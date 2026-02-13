import Foundation
import os.log
#if canImport(FoundationModels)
import FoundationModels
#endif
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// Logger for DescribeImageExecutor
private let logger = Logger(subsystem: "com.locanara", category: "DescribeImageExecutor")

/// Image description feature executor
///
/// Generates descriptions of images using Apple Intelligence Foundation Models.
internal final class DescribeImageExecutor {

    /// Execute image description feature
    ///
    /// - Parameters:
    ///   - input: Input text (not used for image description, but kept for API consistency)
    ///   - parameters: Image description parameters (imageBase64 or imagePath required)
    /// - Returns: ImageDescriptionResult with generated description
    /// - Throws: LocanaraError if execution fails
    func execute(
        input: String,
        parameters: ImageDescriptionParametersInput?
    ) async throws -> ImageDescriptionResult {
        // Validate parameters
        guard let params = parameters else {
            throw LocanaraError.invalidInput("Image parameters are required")
        }

        guard params.imageBase64 != nil || params.imagePath != nil else {
            throw LocanaraError.invalidInput("Either imageBase64 or imagePath must be provided")
        }

        // Try custom inference provider first (if registered)
        if let provider = LocanaraClient.shared.inferenceProvider, provider.isReady() {
            return try await provider.describeImage(input: input, params: params)
        }

        // Fall back to Foundation Models
        return try await processWithFoundationModel(parameters: params)
    }

    private func processWithFoundationModel(
        parameters: ImageDescriptionParametersInput
    ) async throws -> ImageDescriptionResult {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            let availability = SystemLanguageModel.default.availability
            logger.info("Foundation Models availability = \(String(describing: availability))")
            if case .available = availability {
                return try await processWithAppleIntelligence(parameters: parameters)
            } else {
                logger.warning("Foundation Models not available")
            }
        }
        #endif

        // No inference available
        logger.warning("No fallback available")
        throw LocanaraError.featureNotAvailable(.describeImage)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    private func processWithAppleIntelligence(
        parameters: ImageDescriptionParametersInput
    ) async throws -> ImageDescriptionResult {
        // TODO: Implement when Foundation Models adds multimodal (image) input support
        //
        // Apple's on-device model includes a ViTDet-L vision encoder (300M params) trained on
        // 6B image-text pairs, supporting text-rich image understanding and multi-image reasoning.
        // However, as of Xcode 26.2, the public LanguageModelSession API only accepts String prompts.
        //
        // When image input API is exposed:
        // 1. Implement UIImage/CGImage input here using the new API
        // 3. Unify describeImage across platforms (remove describeImageAndroid distinction)
        //
        // Reference: https://machinelearning.apple.com/research/apple-foundation-models-2025-updates
        throw LocanaraError.featureNotAvailable(.describeImage)
    }
    #endif
}
