import Foundation
import os.log

/// Registry of available models for Locanara
///
/// Locanara supports external models via llama.cpp for devices
/// without native AI support (Apple Intelligence / Gemini Nano).
///
/// ## Supported Model
/// - **Gemma 3 4B** (Google): Multimodal (text + vision)
///
/// ## Requirements
/// - Minimum RAM: 6GB
/// - Storage: ~3.4GB (model + vision projector)
///
/// ## Features
/// - Text generation and understanding
/// - Image description (multimodal)
/// - Multilingual support
/// - 128K context length
///
/// ## Extensibility
/// The architecture supports adding more models in the future.
/// See the GQL schema for the full model type definition.
@available(iOS 15.0, macOS 14.0, *)
public final class ModelRegistry: Sendable {

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = ModelRegistry()

    /// Logger for debug messages
    private static let logger = Logger(subsystem: "com.locanara", category: "ModelRegistry")

    // MARK: - Constants

    /// The single supported model ID for Locanara
    public static let defaultModelId = "gemma-3-4b-it-q4"

    // MARK: - Registered Models

    /// All registered models (single model for Locanara)
    public let models: [DownloadableModelInfo]

    /// The default model for Locanara
    public var defaultModel: DownloadableModelInfo {
        models[0]
    }

    // MARK: - Initialization

    private init() {
        self.models = Self.createModelRegistry()
        Self.logger.debug("Initialized with \(self.models.count) models")
        for model in models {
            Self.logger.debug("  - \(model.modelId): \(model.name)")
        }
    }

    // MARK: - Public Methods

    /// Get model info by ID
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: DownloadableModelInfo if found
    public func getModel(_ modelId: String) -> DownloadableModelInfo? {
        return models.first { $0.modelId == modelId }
    }

    /// Get the recommended model for Locanara
    ///
    /// Since Locanara uses a single model, this always returns the default model
    /// if the device has sufficient memory.
    ///
    /// - Parameter memoryMB: Available memory in MB
    /// - Returns: The default model if device meets requirements, nil otherwise
    public func getRecommendedModel(forMemoryMB memoryMB: Int) -> DownloadableModelInfo? {
        let model = defaultModel
        return memoryMB >= model.minMemoryMB ? model : nil
    }

    /// Get all models that can run on device
    ///
    /// - Parameter memoryMB: Available memory in MB
    /// - Returns: Array of compatible models
    public func getCompatibleModels(forMemoryMB memoryMB: Int) -> [DownloadableModelInfo] {
        return models.filter { $0.minMemoryMB <= memoryMB }
    }

    /// Check if model is registered
    ///
    /// - Parameter modelId: Model identifier
    /// - Returns: true if model is registered
    public func isRegistered(_ modelId: String) -> Bool {
        return getModel(modelId) != nil
    }

    /// Check if device meets minimum requirements for Locanara
    ///
    /// - Parameter memoryMB: Total device memory in MB
    /// - Returns: true if device can run Locanara
    public func canRunExternalModel(memoryMB: Int) -> Bool {
        return memoryMB >= defaultModel.minMemoryMB
    }

    // MARK: - Model Registry Data

    private static func createModelRegistry() -> [DownloadableModelInfo] {
        return [
            // MARK: Gemma 3 4B (Default & Only Model)
            // Multimodal support with 128K context - ideal balance of capability and size

            DownloadableModelInfo(
                modelId: "gemma-3-4b-it-q4",
                name: "Gemma 3 4B",
                version: "3.0",
                sizeMB: 2490,
                quantization: .int4,
                contextLength: 131072,
                // swiftlint:disable:next line_length
                downloadURL: URL(string: "https://huggingface.co/bartowski/google_gemma-3-4b-it-GGUF/resolve/main/google_gemma-3-4b-it-Q4_K_M.gguf")!,
                checksum: "sha256:auto",
                minMemoryMB: 6000,
                supportedFeatures: FeatureType.allCases,
                promptFormat: .gemma,
                // swiftlint:disable:next line_length
                mmprojURL: URL(string: "https://huggingface.co/bartowski/google_gemma-3-4b-it-GGUF/resolve/main/mmproj-google_gemma-3-4b-it-f16.gguf"),
                mmprojSizeMB: 851
            )

            // Future models can be added here following the same pattern.
            // The GQL schema (DownloadableModelInfo type) is designed to be extensible.
        ]
    }
}

// MARK: - Model Tier (Simplified for Single Model)

extension ModelRegistry {

    /// Device capability tier for Locanara
    public enum DeviceTier: String, Sendable {
        /// Supported devices (6GB+ RAM) - Full Locanara support
        case supported = "supported"

        /// Unsupported devices (< 6GB RAM) - Cannot run Locanara
        case unsupported = "unsupported"
    }

    /// Get device tier based on memory
    ///
    /// - Parameter memoryMB: Total memory in MB
    /// - Returns: Device tier (supported or unsupported)
    public func getDeviceTier(forMemoryMB memoryMB: Int) -> DeviceTier {
        return memoryMB >= defaultModel.minMemoryMB ? .supported : .unsupported
    }
}
