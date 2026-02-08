import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Extract feature executor
///
/// Extracts entities and key-value pairs from input text using Apple Intelligence Foundation Models.
internal final class ExtractExecutor {

    /// Execute extract feature
    ///
    /// - Parameters:
    ///   - input: Text to extract from
    ///   - parameters: Optional extract parameters
    /// - Returns: ExtractResult with extracted entities
    /// - Throws: LocanaraError if execution fails
    func execute(
        input: String,
        parameters: ExtractParametersInput?
    ) async throws -> ExtractResult {
        // Validate input
        guard !input.isEmpty else {
            throw LocanaraError.invalidInput("Input cannot be empty")
        }

        // Try Pro tier inference provider first (if registered)
        if let provider = LocanaraClient.shared.inferenceProvider, provider.isReady() {
            return try await provider.extract(input: input, params: parameters)
        }

        // Fall back to Foundation Models
        return try await processWithFoundationModel(
            input: input,
            parameters: parameters
        )
    }

    private func processWithFoundationModel(
        input: String,
        parameters: ExtractParametersInput?
    ) async throws -> ExtractResult {
        let entityTypes = parameters?.entityTypes ?? ["person", "location", "date", "organization"]
        let extractKeyValues = parameters?.extractKeyValues ?? false

        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            if case .available = SystemLanguageModel.default.availability {
                return try await processWithAppleIntelligence(
                    input: input,
                    entityTypes: entityTypes,
                    extractKeyValues: extractKeyValues
                )
            }
        }
        #endif

        // No inference available
        throw LocanaraError.featureNotAvailable(.extract)
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    @Generable
    struct EntityOutput {
        @Guide(description: "Entity type such as person, location, date, organization")
        var type: String
        @Guide(description: "The extracted entity value from the text")
        var value: String
        @Guide(description: "Confidence score between 0.0 and 1.0")
        var confidence: Double
    }

    @available(iOS 26.0, macOS 26.0, *)
    @Generable
    struct KeyValueOutput {
        @Guide(description: "The key name")
        var key: String
        @Guide(description: "The value")
        var value: String
        @Guide(description: "Confidence score between 0.0 and 1.0")
        var confidence: Double
    }

    @available(iOS 26.0, macOS 26.0, *)
    @Generable
    struct ExtractEntitiesOutput {
        @Guide(description: "Extracted entities from the text")
        var entities: [EntityOutput]
    }

    @available(iOS 26.0, macOS 26.0, *)
    @Generable
    struct ExtractWithKVOutput {
        @Guide(description: "Extracted entities from the text")
        var entities: [EntityOutput]
        @Guide(description: "Extracted key-value pairs from the text")
        var keyValues: [KeyValueOutput]
    }

    @available(iOS 26.0, macOS 26.0, *)
    private func processWithAppleIntelligence(
        input: String,
        entityTypes: [String],
        extractKeyValues: Bool
    ) async throws -> ExtractResult {
        let session = LanguageModelSession()
        let entityTypesList = entityTypes.joined(separator: ", ")

        if extractKeyValues {
            let prompt = """
            Extract entities and key-value pairs from the following text.
            Entity types to find: \(entityTypesList)

            Text:
            <input>\(input)</input>
            """

            let output = try await session.respond(to: prompt, generating: ExtractWithKVOutput.self).content
            let entities = output.entities.map { e in
                Entity(type: e.type, value: e.value, confidence: min(max(e.confidence, 0.0), 1.0), startPos: nil, endPos: nil)
            }
            let kvPairs = output.keyValues.map { kv in
                KeyValuePair(key: kv.key, value: kv.value, confidence: min(max(kv.confidence, 0.0), 1.0))
            }
            return ExtractResult(entities: entities, keyValuePairs: kvPairs)
        } else {
            let prompt = """
            Extract entities from the following text.
            Entity types to find: \(entityTypesList)

            Text:
            <input>\(input)</input>
            """

            let output = try await session.respond(to: prompt, generating: ExtractEntitiesOutput.self).content
            let entities = output.entities.map { e in
                Entity(type: e.type, value: e.value, confidence: min(max(e.confidence, 0.0), 1.0), startPos: nil, endPos: nil)
            }
            return ExtractResult(entities: entities, keyValuePairs: nil)
        }
    }
    #endif
}
