import Foundation

// MARK: - Execution Record

/// Record of a chain execution for history and debugging
public struct ChainExecutionRecord: Sendable {
    public let chainName: String
    public let input: String
    public let output: String?
    public let processingTimeMs: Int
    public let success: Bool
    public let attempt: Int
    public let timestamp: Double
}

// MARK: - Chain Executor

/// Chain execution engine with instrumentation, retries, and history tracking.
///
/// ```swift
/// let executor = ChainExecutor(maxRetries: 1)
/// let output = try await executor.execute(summarizeChain, input: ChainInput(text: article))
/// print(executor.getHistory())
/// ```
@available(iOS 15.0, macOS 14.0, *)
public final class ChainExecutor: @unchecked Sendable {
    private var history: [ChainExecutionRecord] = []
    private let maxRetries: Int

    public init(maxRetries: Int = 1) {
        self.maxRetries = maxRetries
    }

    /// Execute a chain with timing, retries, and history tracking
    public func execute(_ chain: any Chain, input: ChainInput) async throws -> ChainOutput {
        let startTime = Date().timeIntervalSince1970
        var lastError: Error?

        for attempt in 0...maxRetries {
            do {
                let output = try await chain.invoke(input)
                let endTime = Date().timeIntervalSince1970
                history.append(ChainExecutionRecord(
                    chainName: chain.name,
                    input: input.text,
                    output: output.text,
                    processingTimeMs: Int((endTime - startTime) * 1000),
                    success: true,
                    attempt: attempt + 1,
                    timestamp: startTime
                ))
                return output
            } catch {
                lastError = error
                if attempt < maxRetries {
                    try? await Task.sleep(nanoseconds: 100_000_000)
                }
            }
        }

        let endTime = Date().timeIntervalSince1970
        history.append(ChainExecutionRecord(
            chainName: chain.name,
            input: input.text,
            output: nil,
            processingTimeMs: Int((endTime - startTime) * 1000),
            success: false,
            attempt: maxRetries + 1,
            timestamp: startTime
        ))
        throw lastError ?? LocanaraError.executionFailed("Chain execution failed")
    }

    /// Get execution history
    public func getHistory() -> [ChainExecutionRecord] { history }

    /// Clear execution history
    public func clearHistory() { history.removeAll() }
}
