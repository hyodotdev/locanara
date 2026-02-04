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
    private func processWithAppleIntelligence(
        input: String,
        entityTypes: [String],
        extractKeyValues: Bool
    ) async throws -> ExtractResult {
        let session = LanguageModelSession()

        let entityTypesList = entityTypes.joined(separator: ", ")
        var prompt = """
        Extract entities from the following text.
        Entity types to find: \(entityTypesList)

        For each entity found, provide:
        - Type (one of: \(entityTypesList))
        - Value (the exact text)
        - Confidence (0.0 to 1.0)

        Respond ONLY in this exact format (one entity per line):
        ENTITY|type|value|confidence

        """

        if extractKeyValues {
            prompt += """

            Also extract any key-value pairs in the text.
            For key-value pairs, use this format:
            KEYVALUE|key|value|confidence

            """
        }

        prompt += """

        Text to analyze:
        \(input)
        """

        let response = try await session.respond(to: prompt)
        let responseText = response.content

        var entities: [Entity] = []
        var keyValuePairs: [KeyValuePair]? = extractKeyValues ? [] : nil

        let lines = responseText.components(separatedBy: .newlines)

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty else { continue }

            let parts = trimmed.split(separator: "|")

            if parts.count >= 4 && parts[0] == "ENTITY" {
                let type = String(parts[1]).trimmingCharacters(in: .whitespaces)
                let value = String(parts[2]).trimmingCharacters(in: .whitespaces)
                let confidenceStr = String(parts[3]).trimmingCharacters(in: .whitespaces)

                if let confidence = Double(confidenceStr) {
                    entities.append(Entity(
                        type: type,
                        value: value,
                        confidence: min(max(confidence, 0.0), 1.0),
                        startPos: nil,
                        endPos: nil
                    ))
                }
            } else if parts.count >= 4 && parts[0] == "KEYVALUE" && extractKeyValues {
                let key = String(parts[1]).trimmingCharacters(in: .whitespaces)
                let value = String(parts[2]).trimmingCharacters(in: .whitespaces)
                let confidenceStr = String(parts[3]).trimmingCharacters(in: .whitespaces)

                if let confidence = Double(confidenceStr) {
                    keyValuePairs?.append(KeyValuePair(
                        key: key,
                        value: value,
                        confidence: min(max(confidence, 0.0), 1.0)
                    ))
                }
            }
        }

        return ExtractResult(
            entities: entities,
            keyValuePairs: keyValuePairs
        )
    }
    #endif
}
