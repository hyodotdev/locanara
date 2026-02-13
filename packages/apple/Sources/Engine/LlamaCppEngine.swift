// LlamaCppEngine - On-device LLM inference using llama.cpp via LocalLLMClient
//
// This file requires LocalLLMClient as an opt-in dependency.
// To use LlamaCppEngine, add LocalLLMClient to your app's Package.swift:
//
//   .package(url: "https://github.com/tattn/LocalLLMClient.git", branch: "main")
//
// And add the products to your target:
//   .product(name: "LocalLLMClient", package: "LocalLLMClient"),
//   .product(name: "LocalLLMClientLlama", package: "LocalLLMClient"),

#if canImport(LocalLLMClientLlama)

import Foundation
import os.log
import LocalLLMClient
import LocalLLMClientCore
import LocalLLMClientLlama
#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

private let logger = Logger(subsystem: "com.locanara", category: "LlamaCppEngine")

// MARK: - LlamaCppEngine

/// On-device LLM inference engine for Locanara using llama.cpp via LocalLLMClient
///
/// Provides real on-device LLM inference using GGUF format models.
@available(iOS 17.0, macOS 14.0, *)
public final class LlamaCppEngine: @unchecked Sendable, InferenceEngine, LlamaCppEngineProtocol {

    // MARK: - InferenceEngine Protocol

    public static var engineType: InferenceEngineType { .llamaCpp }

    public var engineName: String { "On-Device LLM (llama.cpp)" }

    // MARK: - Types

    /// Engine configuration
    public struct Configuration: Sendable {
        public var numThreads: Int
        public var contextSize: Int
        public var batchSize: Int
        public var useMetal: Bool
        public var gpuLayers: Int

        public static let `default` = Configuration(
            numThreads: max(4, ProcessInfo.processInfo.activeProcessorCount - 2),
            contextSize: 8192,
            batchSize: 512,
            useMetal: true,
            gpuLayers: 99
        )

        public static let lowMemory = Configuration(
            numThreads: 2,
            contextSize: 4096,
            batchSize: 256,
            useMetal: true,
            gpuLayers: 20
        )

        public init(
            numThreads: Int = max(4, ProcessInfo.processInfo.activeProcessorCount - 2),
            contextSize: Int = 8192,
            batchSize: Int = 512,
            useMetal: Bool = true,
            gpuLayers: Int = 99
        ) {
            self.numThreads = numThreads
            self.contextSize = contextSize
            self.batchSize = batchSize
            self.useMetal = useMetal
            self.gpuLayers = gpuLayers
        }
    }

    // MARK: - Properties

    public private(set) var isLoaded: Bool = false
    private let modelPath: URL
    private let mmprojPath: URL?
    private let config: Configuration
    private var isCancelled: Bool = false
    private let lock = NSLock()
    private let memoryManager = MemoryManager.shared

    /// LocalLLMClient session for inference
    private var llmSession: LLMSession?

    /// Serialization queue for inference calls to prevent concurrent access
    private let inferenceQueue = DispatchQueue(label: "com.locanara.llamacpp.inference")

    /// Flag to track if inference is in progress
    private var isInferencing: Bool = false

    /// Whether this engine supports multimodal (image) input
    public var isMultimodal: Bool { mmprojPath != nil }

    // MARK: - Initialization

    private init(modelPath: URL, mmprojPath: URL?, config: Configuration) {
        self.modelPath = modelPath
        self.mmprojPath = mmprojPath
        self.config = config
    }

    public static func create(
        modelPath: URL,
        mmprojPath: URL? = nil,
        config: Configuration = .default
    ) async throws -> LlamaCppEngine {
        let engine = LlamaCppEngine(modelPath: modelPath, mmprojPath: mmprojPath, config: config)
        try await engine.loadModel()
        return engine
    }

    deinit {
        unloadModel()
    }

    // MARK: - InferenceEngine Protocol

    public func unload() {
        unloadModel()
    }

    // MARK: - Model Loading

    private func loadModel() async throws {
        guard !isLoaded else { return }

        guard FileManager.default.fileExists(atPath: modelPath.path) else {
            logger.error("Model path not found: \(self.modelPath.path)")
            throw LocanaraError.modelNotDownloaded(modelPath.lastPathComponent)
        }

        let fileAttributes = try? FileManager.default.attributesOfItem(atPath: modelPath.path)
        let fileSize = fileAttributes?[.size] as? Int64 ?? 0
        let fileSizeMB = fileSize / (1024 * 1024)
        logger.info("Model file size: \(fileSizeMB)MB at path: \(self.modelPath.path)")

        if fileSize < 10_000_000 {
            logger.error("Model file too small (\(fileSizeMB)MB). Expected GGUF model file.")
            throw LocanaraError.modelLoadFailed("Invalid model file: too small (\(fileSizeMB)MB)")
        }

        let availableMemory = memoryManager.getAvailableMemoryMB()
        let requiredMemory = 500
        guard availableMemory > requiredMemory else {
            throw LocanaraError.insufficientMemory(required: requiredMemory, available: availableMemory)
        }

        logger.info("Loading model from: \(self.modelPath.path)")
        logger.info("Available memory: \(availableMemory)MB")

        let modelName = modelPath.lastPathComponent

        let llamaParameter = LlamaClient.Parameter(
            context: config.contextSize,
            seed: nil,
            numberOfThreads: config.numThreads,
            batch: config.batchSize,
            temperature: 0.5,
            topK: 40,
            topP: 0.9,
            typicalP: 1.0,
            penaltyLastN: 64,
            penaltyRepeat: 1.2,
            options: LlamaClient.Options(
                extraEOSTokens: ["</s>", "<end_of_turn>"],
                verbose: false
            )
        )

        let localModel = LLMSession.LocalModel.llama(
            url: modelPath,
            mmprojURL: mmprojPath,
            parameter: llamaParameter
        )
        llmSession = LLMSession(model: localModel)

        if let mmproj = mmprojPath {
            logger.info("Multimodal projector loaded: \(mmproj.lastPathComponent)")
        }

        do {
            try await llmSession?.prewarm()
            isLoaded = true
            logger.info("Model loaded successfully: \(modelName)")
        } catch {
            logger.error("Failed to load model: \(error.localizedDescription)")
            llmSession = nil
            throw LocanaraError.modelLoadFailed("Failed to load model: \(error.localizedDescription)")
        }
    }

    private func unloadModel() {
        guard isLoaded else { return }
        llmSession = nil
        isLoaded = false
        logger.info("Model unloaded")
    }

    // MARK: - LlamaCppEngineProtocol

    public func generate(prompt: String, config: InferenceConfig) async throws -> String {
        while lock.withLock({ isInferencing }) {
            try await Task.sleep(nanoseconds: 100_000_000)
        }

        lock.withLock {
            isInferencing = true
            isCancelled = false
        }

        defer {
            lock.withLock { isInferencing = false }
        }

        guard isLoaded, let session = llmSession else {
            throw LocanaraError.custom(.modelNotLoaded, "Model not loaded")
        }

        logger.debug("Generating response for prompt (\(prompt.count) chars), maxTokens: \(config.maxTokens)")

        do {
            let response = try await session.respond(to: prompt)

            var result = response
            if let stopSequences = config.stopSequences {
                for stopSeq in stopSequences {
                    if let range = result.range(of: stopSeq) {
                        result = String(result[..<range.lowerBound])
                        break
                    }
                }
            }

            let maxChars = config.maxTokens * 4
            if result.count > maxChars {
                let truncated = String(result.prefix(maxChars))
                if let lastPeriod = truncated.lastIndex(of: ".") {
                    result = String(truncated[...lastPeriod])
                } else {
                    result = truncated
                }
            }

            try await Task.sleep(nanoseconds: 50_000_000)
            return result.trimmingCharacters(in: .whitespacesAndNewlines)
        } catch {
            logger.error("Inference error: \(error.localizedDescription)")

            if error.localizedDescription.contains("nil") ||
               error.localizedDescription.contains("fatal") {
                logger.warning("Attempting to recover from potential crash state...")
                lock.withLock {
                    isLoaded = false
                    llmSession = nil
                }
            }

            throw LocanaraError.executionFailed(error.localizedDescription)
        }
    }

    public func generateStreaming(
        prompt: String,
        config: InferenceConfig
    ) -> AsyncThrowingStream<String, Error> {
        return AsyncThrowingStream { continuation in
            Task { [weak self] in
                guard let self = self else {
                    continuation.finish(throwing: LocanaraError.custom(.modelNotLoaded, "Engine deallocated"))
                    return
                }

                guard self.isLoaded, let session = self.llmSession else {
                    continuation.finish(throwing: LocanaraError.custom(.modelNotLoaded, "Model not loaded"))
                    return
                }

                do {
                    for try await text in session.streamResponse(to: prompt) {
                        let cancelled = self.lock.withLock { self.isCancelled }
                        if cancelled { break }
                        continuation.yield(text)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: LocanaraError.executionFailed(error.localizedDescription))
                }
            }
        }
    }

    public func cancel() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        if !isCancelled {
            isCancelled = true
            logger.info("Generation cancelled")
            return true
        }
        return false
    }

    // MARK: - Multimodal (Image) Support

    public func generateWithImage(
        prompt: String,
        imageData: Data,
        config: InferenceConfig
    ) async throws -> String {
        guard isMultimodal else {
            throw LocanaraError.custom(
                .featureNotSupported,
                "Model does not support image input. Multimodal projector (mmproj) file is required."
            )
        }

        while lock.withLock({ isInferencing }) {
            try await Task.sleep(nanoseconds: 100_000_000)
        }

        lock.withLock {
            isInferencing = true
            isCancelled = false
        }

        defer {
            lock.withLock { isInferencing = false }
        }

        guard isLoaded, let session = llmSession else {
            throw LocanaraError.custom(.modelNotLoaded, "Model not loaded")
        }

        logger.info("Generating image description for prompt: \(prompt.prefix(50))...")

        #if os(iOS)
        guard let image = UIImage(data: imageData) else {
            throw LocanaraError.custom(.invalidInput, "Failed to create image from data")
        }
        let inputImage: LLMInputImage = image
        #elseif os(macOS)
        guard let image = NSImage(data: imageData) else {
            throw LocanaraError.custom(.invalidInput, "Failed to create image from data")
        }
        let inputImage: LLMInputImage = image
        #else
        throw LocanaraError.custom(.featureNotSupported, "Image input not supported on this platform")
        #endif

        do {
            let attachment = LLMAttachment.image(inputImage)
            let response = try await session.respond(to: prompt, attachments: [attachment])

            var result = response
            if let stopSequences = config.stopSequences {
                for stopSeq in stopSequences {
                    if let range = result.range(of: stopSeq) {
                        result = String(result[..<range.lowerBound])
                        break
                    }
                }
            }

            let maxChars = config.maxTokens * 4
            if result.count > maxChars {
                let truncated = String(result.prefix(maxChars))
                if let lastPeriod = truncated.lastIndex(of: ".") {
                    result = String(truncated[...lastPeriod])
                } else {
                    result = truncated
                }
            }

            logger.info("Image description generated successfully")
            return result.trimmingCharacters(in: .whitespacesAndNewlines)
        } catch {
            logger.error("Image inference error: \(error.localizedDescription)")
            throw LocanaraError.executionFailed(error.localizedDescription)
        }
    }
}

// MARK: - Engine Statistics

@available(iOS 17.0, macOS 14.0, *)
extension LlamaCppEngine {

    public struct Statistics: Sendable {
        public let modelPath: String
        public let isLoaded: Bool
        public let contextSize: Int
        public let numThreads: Int
        public let useMetal: Bool
        public let modelInfo: String?
    }

    public func getStatistics() async -> Statistics {
        return Statistics(
            modelPath: modelPath.path,
            isLoaded: isLoaded,
            contextSize: config.contextSize,
            numThreads: config.numThreads,
            useMetal: config.useMetal,
            modelInfo: llmSession != nil ? "LocalLLMClient (llama.cpp)" : nil
        )
    }
}

// MARK: - Prompt Templates

@available(iOS 17.0, macOS 14.0, *)
extension LlamaCppEngine {

    public static func buildPrompt(
        systemPrompt: String? = nil,
        userMessage: String,
        modelType: ModelType = .chatML
    ) -> String {
        switch modelType {
        case .chatML:
            var prompt = ""
            if let system = systemPrompt {
                prompt += "<|im_start|>system\n\(system)<|im_end|>\n"
            }
            prompt += "<|im_start|>user\n\(userMessage)<|im_end|>\n"
            prompt += "<|im_start|>assistant\n"
            return prompt
        case .llama2:
            var prompt = "[INST] "
            if let system = systemPrompt {
                prompt += "<<SYS>>\n\(system)\n<</SYS>>\n\n"
            }
            prompt += "\(userMessage) [/INST]"
            return prompt
        case .llama3:
            var prompt = "<|begin_of_text|>"
            if let system = systemPrompt {
                prompt += "<|start_header_id|>system<|end_header_id|>\n\n\(system)<|eot_id|>"
            }
            prompt += "<|start_header_id|>user<|end_header_id|>\n\n\(userMessage)<|eot_id|>"
            prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n"
            return prompt
        case .phi3:
            var prompt = ""
            if let system = systemPrompt {
                prompt += "<|system|>\n\(system)<|end|>\n"
            }
            prompt += "<|user|>\n\(userMessage)<|end|>\n<|assistant|>\n"
            return prompt
        case .mistral:
            var prompt = "[INST] "
            if let system = systemPrompt {
                prompt += "\(system)\n\n"
            }
            prompt += "\(userMessage) [/INST]"
            return prompt
        case .alpaca:
            var prompt = ""
            if let system = systemPrompt {
                prompt += "\(system)\n\n"
            }
            prompt += "### Instruction:\n\(userMessage)\n\n### Response:\n"
            return prompt
        case .vicuna:
            var prompt = ""
            if let system = systemPrompt {
                prompt += "\(system)\n\n"
            }
            prompt += "USER: \(userMessage)\nASSISTANT:"
            return prompt
        case .gemma:
            var prompt = "<start_of_turn>user\n"
            if let system = systemPrompt {
                prompt += "\(system)\n\n"
            }
            prompt += "\(userMessage)<end_of_turn>\n<start_of_turn>model\n"
            return prompt
        case .zephyr:
            var prompt = ""
            if let system = systemPrompt {
                prompt += "<|system|>\n\(system)</s>\n"
            }
            prompt += "<|user|>\n\(userMessage)</s>\n<|assistant|>\n"
            return prompt
        case .raw:
            return userMessage
        }
    }

    public enum ModelType: String, Sendable {
        case chatML = "chatml"
        case llama2 = "llama2"
        case llama3 = "llama3"
        case phi3 = "phi3"
        case mistral = "mistral"
        case alpaca = "alpaca"
        case vicuna = "vicuna"
        case gemma = "gemma"
        case zephyr = "zephyr"
        case raw = "raw"
    }
}

#else

// MARK: - Stub when LocalLLMClient is not available

import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "LlamaCppEngine")

/// Stub LlamaCppEngine when LocalLLMClient is not available.
///
/// To enable llama.cpp inference, add LocalLLMClient to your app's dependencies:
/// ```swift
/// // In Package.swift
/// .package(url: "https://github.com/tattn/LocalLLMClient.git", branch: "main")
/// ```
@available(iOS 17.0, macOS 14.0, *)
public final class LlamaCppEngine: @unchecked Sendable, InferenceEngine, LlamaCppEngineProtocol {

    public static var engineType: InferenceEngineType { .llamaCpp }
    public var engineName: String { "On-Device LLM (llama.cpp) - Not Configured" }
    public private(set) var isLoaded: Bool = false

    public struct Configuration: Sendable {
        public var numThreads: Int
        public var contextSize: Int
        public var batchSize: Int
        public var useMetal: Bool
        public var gpuLayers: Int

        public static let `default` = Configuration()
        public static let lowMemory = Configuration()

        public init(
            numThreads: Int = 4,
            contextSize: Int = 8192,
            batchSize: Int = 512,
            useMetal: Bool = true,
            gpuLayers: Int = 99
        ) {
            self.numThreads = numThreads
            self.contextSize = contextSize
            self.batchSize = batchSize
            self.useMetal = useMetal
            self.gpuLayers = gpuLayers
        }
    }

    private static let notConfiguredError = LocanaraError.custom(
        .featureNotAvailable,
        "LocalLLMClient is not configured. Add LocalLLMClient to your app's Package.swift dependencies to enable llama.cpp inference."
    )

    public static func create(
        modelPath: URL,
        mmprojPath: URL? = nil,
        config: Configuration = .default
    ) async throws -> LlamaCppEngine {
        logger.warning("LlamaCppEngine: LocalLLMClient is not available. Add it to your app's dependencies.")
        throw notConfiguredError
    }

    public func generate(prompt: String, config: InferenceConfig) async throws -> String {
        throw LlamaCppEngine.notConfiguredError
    }

    public func generateStreaming(prompt: String, config: InferenceConfig) -> AsyncThrowingStream<String, Error> {
        return AsyncThrowingStream { $0.finish(throwing: LlamaCppEngine.notConfiguredError) }
    }

    public func cancel() -> Bool { false }
    public func unload() {}

    public var isMultimodal: Bool { false }

    public func generateWithImage(prompt: String, imageData: Data, config: InferenceConfig) async throws -> String {
        throw LlamaCppEngine.notConfiguredError
    }

    public struct Statistics: Sendable {
        public let modelPath: String
        public let isLoaded: Bool
        public let contextSize: Int
        public let numThreads: Int
        public let useMetal: Bool
        public let modelInfo: String?
    }

    public func getStatistics() async -> Statistics {
        return Statistics(modelPath: "", isLoaded: false, contextSize: 0, numThreads: 0, useMetal: false, modelInfo: nil)
    }

    public static func buildPrompt(
        systemPrompt: String? = nil,
        userMessage: String,
        modelType: ModelType = .chatML
    ) -> String {
        return userMessage
    }

    public enum ModelType: String, Sendable {
        case chatML = "chatml"
        case llama2 = "llama2"
        case llama3 = "llama3"
        case phi3 = "phi3"
        case mistral = "mistral"
        case alpaca = "alpaca"
        case vicuna = "vicuna"
        case gemma = "gemma"
        case zephyr = "zephyr"
        case raw = "raw"
    }
}

#endif
