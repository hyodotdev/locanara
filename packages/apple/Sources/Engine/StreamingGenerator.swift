import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "StreamingGenerator")

/// Manages streaming text generation with backpressure handling
///
/// Features:
/// - Token-by-token streaming
/// - Backpressure handling
/// - Generation statistics
/// - Cancellation support
@available(iOS 15.0, macOS 14.0, *)
public final class StreamingGenerator: @unchecked Sendable {

    // MARK: - Types

    /// Generation event
    public enum GenerationEvent: Sendable {
        /// New token generated
        case token(String)

        /// Progress update (tokens generated, total expected)
        case progress(generated: Int, total: Int?)

        /// Generation completed
        case completed(GenerationResult)

        /// Generation failed
        case failed(Error)

        /// Generation cancelled
        case cancelled
    }

    /// Generator state
    public enum State: Sendable {
        case idle
        case generating
        case paused
        case completed
        case failed
        case cancelled
    }

    // MARK: - Properties

    /// Current state
    public private(set) var state: State = .idle

    /// Generated tokens count
    public private(set) var tokensGenerated: Int = 0

    /// Start time
    private var startTime: Date?

    /// Accumulated text
    private var accumulatedText: String = ""

    /// Cancellation flag
    private var isCancelled: Bool = false

    /// Lock for thread safety
    private let lock = NSLock()

    // MARK: - Initialization

    public init() {}

    // MARK: - Public Methods

    /// Create a streaming generator from engine
    ///
    /// - Parameters:
    ///   - engine: LlamaCpp engine to use
    ///   - prompt: Input prompt
    ///   - config: Inference configuration
    /// - Returns: AsyncStream of generation events
    public func generate(
        using engine: LlamaCppEngineProtocol,
        prompt: String,
        config: InferenceConfig
    ) -> AsyncStream<GenerationEvent> {
        AsyncStream { [weak self] continuation in
            guard let self = self else {
                continuation.finish()
                return
            }

            Task {
                await self.performGeneration(
                    engine: engine,
                    prompt: prompt,
                    config: config,
                    continuation: continuation
                )
            }
        }
    }

    /// Cancel the current generation
    public func cancel() {
        lock.lock()
        defer { lock.unlock() }

        guard state == .generating || state == .paused else { return }

        isCancelled = true
        state = .cancelled
        logger.info("Generation cancelled by user")
    }

    /// Pause the current generation
    public func pause() {
        lock.lock()
        defer { lock.unlock() }

        guard state == .generating else { return }

        state = .paused
        logger.debug("Generation paused")
    }

    /// Resume a paused generation
    public func resume() {
        lock.lock()
        defer { lock.unlock() }

        guard state == .paused else { return }

        state = .generating
        logger.debug("Generation resumed")
    }

    /// Reset generator state
    public func reset() {
        lock.lock()
        defer { lock.unlock() }

        state = .idle
        tokensGenerated = 0
        startTime = nil
        accumulatedText = ""
        isCancelled = false
    }

    // MARK: - Private Methods

    private func performGeneration(
        engine: LlamaCppEngineProtocol,
        prompt: String,
        config: InferenceConfig,
        continuation: AsyncStream<GenerationEvent>.Continuation
    ) async {
        lock.withLock {
            state = .generating
            startTime = Date()
            tokensGenerated = 0
            accumulatedText = ""
            isCancelled = false
        }

        do {
            // Use engine's streaming capability
            let stream = engine.generateStreaming(prompt: prompt, config: config)

            for try await token in stream {
                // Check cancellation
                let (shouldCancel, shouldPause) = lock.withLock {
                    (isCancelled, state == .paused)
                }

                if shouldCancel {
                    continuation.yield(.cancelled)
                    continuation.finish()
                    return
                }

                // Handle pause
                while shouldPause {
                    try await Task.sleep(nanoseconds: 100_000_000) // 100ms
                    let stillPaused = lock.withLock { state == .paused }
                    if !stillPaused { break }
                }

                // Process token
                let currentTokens = lock.withLock {
                    tokensGenerated += 1
                    accumulatedText += token
                    return tokensGenerated
                }

                // Yield events
                continuation.yield(.token(token))
                continuation.yield(.progress(generated: currentTokens, total: config.maxTokens))
            }

            // Generation completed
            let (finalText, finalTokens, elapsedTime) = lock.withLock {
                state = .completed
                let text = accumulatedText
                let tokens = tokensGenerated
                let elapsed = startTime.map { Date().timeIntervalSince($0) * 1000 } ?? 0
                return (text, tokens, elapsed)
            }

            let result = GenerationResult(
                text: finalText,
                tokenCount: finalTokens,
                generationTimeMs: Int64(elapsedTime),
                finishReason: .endOfSequence
            )

            continuation.yield(.completed(result))
            continuation.finish()

            logger.info("Generation completed: \(finalTokens) tokens in \(Int(elapsedTime))ms")

        } catch {
            lock.withLock {
                state = .failed
            }

            let isCancellation: Bool
            if error is CancellationError {
                isCancellation = true
            } else if let locanaraError = error as? LocanaraError,
                      case .inferenceCancelled = locanaraError {
                isCancellation = true
            } else {
                isCancellation = false
            }

            if isCancellation {
                continuation.yield(.cancelled)
            } else {
                continuation.yield(.failed(error))
                logger.error("Generation failed: \(error.localizedDescription)")
            }

            continuation.finish()
        }
    }
}

// MARK: - Generation Statistics

@available(iOS 15.0, macOS 14.0, *)
extension StreamingGenerator {

    /// Current generation statistics
    public struct Statistics: Sendable {
        public let tokensGenerated: Int
        public let elapsedTimeMs: Int64
        public let tokensPerSecond: Double
        public let state: State
    }

    /// Get current generation statistics
    public func getStatistics() -> Statistics {
        lock.lock()
        defer { lock.unlock() }

        let elapsed = startTime.map { Date().timeIntervalSince($0) * 1000 } ?? 0
        let tps = elapsed > 0 ? Double(tokensGenerated) / (elapsed / 1000.0) : 0

        return Statistics(
            tokensGenerated: tokensGenerated,
            elapsedTimeMs: Int64(elapsed),
            tokensPerSecond: tps,
            state: state
        )
    }
}

// MARK: - Buffered Streaming

@available(iOS 15.0, macOS 14.0, *)
extension StreamingGenerator {

    /// Generate with buffering for smoother output
    ///
    /// Buffers tokens and yields complete words/sentences
    /// for a better user experience.
    ///
    /// - Parameters:
    ///   - engine: LlamaCpp engine to use
    ///   - prompt: Input prompt
    ///   - config: Inference configuration
    ///   - bufferSize: Minimum characters before yielding
    /// - Returns: AsyncStream of buffered text chunks
    public func generateBuffered(
        using engine: LlamaCppEngineProtocol,
        prompt: String,
        config: InferenceConfig,
        bufferSize: Int = 10
    ) -> AsyncStream<String> {
        AsyncStream { [weak self] continuation in
            guard let self = self else {
                continuation.finish()
                return
            }

            Task {
                var buffer = ""

                let eventStream = self.generate(
                    using: engine,
                    prompt: prompt,
                    config: config
                )

                for await event in eventStream {
                    switch event {
                    case .token(let token):
                        buffer += token

                        // Yield when buffer is large enough or at sentence boundaries
                        if buffer.count >= bufferSize ||
                           buffer.hasSuffix(".") ||
                           buffer.hasSuffix("!") ||
                           buffer.hasSuffix("?") ||
                           buffer.hasSuffix("\n") {
                            continuation.yield(buffer)
                            buffer = ""
                        }

                    case .completed:
                        // Yield remaining buffer
                        if !buffer.isEmpty {
                            continuation.yield(buffer)
                        }
                        continuation.finish()
                        return

                    case .cancelled, .failed:
                        // Yield remaining buffer before finishing
                        if !buffer.isEmpty {
                            continuation.yield(buffer)
                        }
                        continuation.finish()
                        return

                    case .progress:
                        // Ignore progress events in buffered mode
                        break
                    }
                }
            }
        }
    }
}
