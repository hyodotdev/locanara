import Foundation
import os.log
#if canImport(ImagePlayground)
import ImagePlayground
#endif
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// Logger for GenerateImageExecutor
private let logger = Logger(subsystem: "com.locanara", category: "GenerateImageExecutor")

/// Image generation feature executor
///
/// Generates images using iOS Image Playground API (iOS 18.2+).
internal final class GenerateImageExecutor {

    /// Execute image generation feature
    ///
    /// - Parameters:
    ///   - input: Input text (not used for image generation, but kept for API consistency)
    ///   - parameters: Image generation parameters (prompt required)
    /// - Returns: ImageGenerationResult with generated image URLs
    /// - Throws: LocanaraError if execution fails
    func execute(
        input: String,
        parameters: ImageGenerationParametersInput?
    ) async throws -> ImageGenerationResult {
        // Validate parameters
        guard let params = parameters else {
            throw LocanaraError.invalidInput("Image generation parameters are required")
        }

        // Try Pro tier inference provider first (if registered)
        if let provider = LocanaraClient.shared.inferenceProvider, provider.isReady() {
            return try await provider.generateImage(input: input, params: params)
        }

        // Fall back to Image Playground
        return try await processWithImagePlayground(parameters: params)
    }

    private func processWithImagePlayground(
        parameters: ImageGenerationParametersInput
    ) async throws -> ImageGenerationResult {
        #if canImport(ImagePlayground)
        if #available(iOS 18.2, macOS 15.2, *) {
            return try await processWithAppleImagePlayground(parameters: parameters)
        }
        #endif

        // Image Playground not available
        logger.warning("Image Playground not available")
        throw LocanaraError.featureNotAvailable(.generateImageIos)
    }

    #if canImport(ImagePlayground)
    @available(iOS 18.2, macOS 15.2, *)
    private func processWithAppleImagePlayground(
        parameters: ImageGenerationParametersInput
    ) async throws -> ImageGenerationResult {
        // Check if Image Playground is supported (must be on main actor)
        let isAvailable = await MainActor.run {
            ImagePlaygroundViewController.isAvailable
        }

        guard isAvailable else {
            logger.warning("Image Playground is not available on this device")
            throw LocanaraError.featureNotAvailable(.generateImageIos)
        }

        // Image Playground requires user interaction through ImagePlaygroundViewController
        // It cannot generate images programmatically without UI
        // For now, throw an error indicating this limitation
        logger.info("Image Playground requires UI interaction")
        throw LocanaraError.invalidInput(
            "Image Playground requires presenting ImagePlaygroundViewController for user interaction. " +
            "Use presentImagePlayground() instead for iOS."
        )
    }
    #endif
}
