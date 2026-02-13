import Foundation

// MARK: - Model Download

/// Progress information for model download
public struct ModelDownloadProgress: Sendable {
    public let modelId: String
    public let bytesDownloaded: Int64
    public let totalBytes: Int64
    public var progress: Double {
        guard totalBytes > 0 else { return 0 }
        return Double(bytesDownloaded) / Double(totalBytes)
    }
    public let state: ModelDownloadState

    public init(
        modelId: String,
        bytesDownloaded: Int64,
        totalBytes: Int64,
        state: ModelDownloadState
    ) {
        self.modelId = modelId
        self.bytesDownloaded = bytesDownloaded
        self.totalBytes = totalBytes
        self.state = state
    }
}

/// State of model download
public enum ModelDownloadState: String, Codable, Sendable {
    case pending
    case downloading
    case verifying
    case extracting
    case completed
    case failed
    case cancelled
}

// MARK: - Model State

/// Current state of a model
public enum ModelState: String, Codable, Sendable {
    case notDownloaded
    case downloading
    case downloaded
    case loading
    case loaded
    case unloading
    case error
}

// MARK: - Model Info

/// Information about a CoreML/GGUF model
public struct DownloadableModelInfo: Codable, Sendable {
    public let modelId: String
    public let name: String
    public let version: String
    public let sizeMB: Int
    public let quantization: ModelQuantization
    public let contextLength: Int
    public let downloadURL: URL
    public let checksum: String
    public let minMemoryMB: Int
    public let supportedFeatures: [FeatureType]
    public let promptFormat: PromptFormat
    /// URL for multimodal projector file (for vision models)
    public let mmprojURL: URL?
    /// Size of mmproj file in MB (for vision models)
    public let mmprojSizeMB: Int?
    /// Whether this model supports image input
    public var isMultimodal: Bool { mmprojURL != nil }

    public init(
        modelId: String,
        name: String,
        version: String,
        sizeMB: Int,
        quantization: ModelQuantization,
        contextLength: Int,
        downloadURL: URL,
        checksum: String,
        minMemoryMB: Int,
        supportedFeatures: [FeatureType],
        promptFormat: PromptFormat = .chatml,
        mmprojURL: URL? = nil,
        mmprojSizeMB: Int? = nil
    ) {
        self.modelId = modelId
        self.name = name
        self.version = version
        self.sizeMB = sizeMB
        self.quantization = quantization
        self.contextLength = contextLength
        self.downloadURL = downloadURL
        self.checksum = checksum
        self.minMemoryMB = minMemoryMB
        self.supportedFeatures = supportedFeatures
        self.promptFormat = promptFormat
        self.mmprojURL = mmprojURL
        self.mmprojSizeMB = mmprojSizeMB
    }
}

/// Model quantization type
public enum ModelQuantization: String, Codable, Sendable {
    case int4 = "int4"
    case int8 = "int8"
    case float16 = "float16"
    case float32 = "float32"
}

/// Prompt format for different model families
public enum PromptFormat: String, Codable, Sendable {
    /// ChatML format: <|im_start|>user\n...<|im_end|>
    case chatml = "chatml"
    /// Qwen format (ChatML variant): <|im_start|>system/user/assistant\n...<|im_end|>
    case qwen = "qwen"
    /// Gemma format: <start_of_turn>user\n...<end_of_turn>
    case gemma = "gemma"
    /// Llama 2 format: [INST] ... [/INST]
    case llama2 = "llama2"
    /// Llama 3 format: <|begin_of_text|><|start_header_id|>user<|end_header_id|>...<|eot_id|>
    case llama3 = "llama3"
    /// Phi-3 format: <|user|>\n...<|end|>\n<|assistant|>
    case phi3 = "phi3"
    /// Mistral format: [INST] ... [/INST]
    case mistral = "mistral"
    /// Alpaca format: ### Instruction:\n...
    case alpaca = "alpaca"
    /// Vicuna format: USER: ... ASSISTANT:
    case vicuna = "vicuna"
    /// Zephyr format: <|user|>\n...<|assistant|>
    case zephyr = "zephyr"
    /// Raw format (no special tokens)
    case raw = "raw"
}

// MARK: - Inference Configuration

/// Configuration for LLM inference
///
/// All parameters have defaults but can be customized by the user.
/// This allows fine-tuning generation behavior for specific use cases.
public struct InferenceConfig: Sendable {
    /// Controls randomness in generation (0.0 = deterministic, 1.0 = very random)
    public var temperature: Double

    /// Limits sampling to top K most likely tokens
    public var topK: Int

    /// Limits sampling to tokens with cumulative probability <= topP
    public var topP: Double

    /// Maximum number of tokens to generate
    public var maxTokens: Int

    /// Penalty for repeating tokens (1.0 = no penalty, > 1.0 = discourage repetition)
    public var repeatPenalty: Double

    /// Random seed for reproducible generation (nil = random)
    public var seed: UInt64?

    /// Stop sequences - generation stops when any of these are produced
    public var stopSequences: [String]?

    public init(
        temperature: Double = 0.7,
        topK: Int = 40,
        topP: Double = 0.9,
        maxTokens: Int = 2048,
        repeatPenalty: Double = 1.1,
        seed: UInt64? = nil,
        stopSequences: [String]? = nil
    ) {
        self.temperature = temperature
        self.topK = topK
        self.topP = topP
        self.maxTokens = maxTokens
        self.repeatPenalty = repeatPenalty
        self.seed = seed
        self.stopSequences = stopSequences
    }

    /// Create config from AdvancedInferenceOptions, using defaults for missing values
    public init(from options: AdvancedInferenceOptions?, base: InferenceConfig) {
        self.temperature = options?.temperature ?? base.temperature
        self.topK = options?.topK ?? base.topK
        self.topP = options?.topP ?? base.topP
        self.maxTokens = options?.maxTokens ?? base.maxTokens
        self.repeatPenalty = options?.repeatPenalty ?? base.repeatPenalty
        self.seed = options?.seed ?? base.seed
        self.stopSequences = options?.stopSequences ?? base.stopSequences
    }

    /// Default configuration for chat
    public static let chat = InferenceConfig(
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxTokens: 2048
    )

    /// Configuration for summarization (balanced settings for Gemma 3 4B)
    public static let summarize = InferenceConfig(
        temperature: 0.4,
        topK: 40,
        topP: 0.9,
        maxTokens: 300,     // Allow more tokens for multi-bullet summaries
        repeatPenalty: 1.3, // Higher penalty to avoid repetition
        stopSequences: ["</s>", "\n\n\n", "<end_of_turn>"]
    )

    /// Configuration for classification (very deterministic)
    public static let classify = InferenceConfig(
        temperature: 0.2,
        topK: 20,
        topP: 0.7,
        maxTokens: 50,
        repeatPenalty: 1.3,
        stopSequences: ["</s>", "\n\n"]
    )
}

// MARK: - Advanced Inference Options (User-facing)

/// Advanced inference options for Locanara features
///
/// These options allow users to customize LLM generation behavior.
/// All parameters are optional - defaults will be used if not specified.
///
/// Example usage:
/// ```swift
/// let options = AdvancedInferenceOptions(
///     maxTokens: 512,
///     temperature: 0.5
/// )
/// let result = try await client.summarizeWithOptions(text, options: options)
/// ```
public struct AdvancedInferenceOptions: Codable, Sendable {
    /// Controls randomness in generation (0.0 = deterministic, 1.0 = very random)
    /// Default varies by feature (chat: 0.7, summarize: 0.3, classify: 0.1)
    public var temperature: Double?

    /// Limits sampling to top K most likely tokens
    /// Lower values make output more focused, higher values more diverse
    public var topK: Int?

    /// Limits sampling to tokens with cumulative probability <= topP
    /// Alternative to topK for controlling diversity
    public var topP: Double?

    /// Maximum number of tokens to generate
    /// Default: 2048 for chat, 256 for summarize/classify
    public var maxTokens: Int?

    /// Penalty for repeating tokens (1.0 = no penalty, > 1.0 = discourage repetition)
    /// Useful for avoiding repetitive outputs
    public var repeatPenalty: Double?

    /// Random seed for reproducible generation
    /// Use the same seed to get identical outputs for the same input
    public var seed: UInt64?

    /// Stop sequences - generation stops when any of these are produced
    /// Useful for controlling output format
    public var stopSequences: [String]?

    public init(
        temperature: Double? = nil,
        topK: Int? = nil,
        topP: Double? = nil,
        maxTokens: Int? = nil,
        repeatPenalty: Double? = nil,
        seed: UInt64? = nil,
        stopSequences: [String]? = nil
    ) {
        self.temperature = temperature
        self.topK = topK
        self.topP = topP
        self.maxTokens = maxTokens
        self.repeatPenalty = repeatPenalty
        self.seed = seed
        self.stopSequences = stopSequences
    }
}

// MARK: - Generation Result

/// Result of token generation
public struct GenerationResult: Sendable {
    public let text: String
    public let tokenCount: Int
    public let generationTimeMs: Int64
    public let tokensPerSecond: Double
    public let finishReason: FinishReason

    public init(
        text: String,
        tokenCount: Int,
        generationTimeMs: Int64,
        finishReason: FinishReason
    ) {
        self.text = text
        self.tokenCount = tokenCount
        self.generationTimeMs = generationTimeMs
        self.tokensPerSecond = generationTimeMs > 0
            ? Double(tokenCount) / (Double(generationTimeMs) / 1000.0)
            : 0
        self.finishReason = finishReason
    }
}

/// Reason for generation completion
public enum FinishReason: String, Codable, Sendable {
    case endOfSequence
    case maxTokens
    case cancelled
    case error
}

// MARK: - Device Capability (Extended)

/// Extended device capability for Locanara
public struct ExtendedDeviceCapability: Sendable {
    public let hasNeuralEngine: Bool
    public let availableMemoryMB: Int
    public let totalMemoryMB: Int
    public let chipset: String
    public let iosVersion: String
    public let supportsFoundationModels: Bool
    public let recommendedModel: String?

    public init(
        hasNeuralEngine: Bool,
        availableMemoryMB: Int,
        totalMemoryMB: Int,
        chipset: String,
        iosVersion: String,
        supportsFoundationModels: Bool,
        recommendedModel: String?
    ) {
        self.hasNeuralEngine = hasNeuralEngine
        self.availableMemoryMB = availableMemoryMB
        self.totalMemoryMB = totalMemoryMB
        self.chipset = chipset
        self.iosVersion = iosVersion
        self.supportsFoundationModels = supportsFoundationModels
        self.recommendedModel = recommendedModel
    }
}
