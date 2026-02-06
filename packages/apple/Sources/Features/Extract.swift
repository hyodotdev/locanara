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

        Return ONLY a JSON array of objects with "type", "value", "confidence" fields.
        Example: [{"type":"person","value":"John","confidence":0.95}]
        """

        if extractKeyValues {
            prompt += "\n\nAlso extract key-value pairs as: {\"kv\":[{\"key\":\"k\",\"value\":\"v\",\"confidence\":0.9}]}"
        }

        prompt += "\n\nText:\n\(input)"

        let response = try await session.respond(to: prompt)
        let responseText = response.content

        return Self.parseExtractResponse(responseText, extractKeyValues: extractKeyValues)
    }
    #endif

    static func parseExtractResponse(
        _ responseText: String,
        extractKeyValues: Bool
    ) -> ExtractResult {
        var entities: [Entity] = []
        var keyValuePairs: [KeyValuePair]? = extractKeyValues ? [] : nil

        // Try JSON parsing: match {"type":"...","value":"...","confidence":...} objects
        let entityPattern = try? NSRegularExpression(
            pattern: #""type"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"([^"]+)"\s*,\s*"confidence"\s*:\s*([\d.]+)"#
        )
        let nsText = responseText as NSString
        let matches = entityPattern?.matches(in: responseText, range: NSRange(location: 0, length: nsText.length)) ?? []
        for match in matches {
            guard match.numberOfRanges >= 4 else { continue }
            let type = nsText.substring(with: match.range(at: 1))
            let value = nsText.substring(with: match.range(at: 2))
            let confStr = nsText.substring(with: match.range(at: 3))
            guard let confidence = Double(confStr) else { continue }
            entities.append(Entity(
                type: type,
                value: value,
                confidence: min(max(confidence, 0.0), 1.0),
                startPos: nil,
                endPos: nil
            ))
        }

        if extractKeyValues, let kvStart = responseText.range(of: "\"kv\"") {
            let kvSection = String(responseText[kvStart.lowerBound...])
            let kvPattern = try? NSRegularExpression(
                pattern: #""key"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"([^"]+)"\s*,\s*"confidence"\s*:\s*([\d.]+)"#
            )
            let nsKv = kvSection as NSString
            let kvMatches = kvPattern?.matches(in: kvSection, range: NSRange(location: 0, length: nsKv.length)) ?? []
            for match in kvMatches {
                guard match.numberOfRanges >= 4 else { continue }
                let key = nsKv.substring(with: match.range(at: 1))
                let value = nsKv.substring(with: match.range(at: 2))
                let confStr = nsKv.substring(with: match.range(at: 3))
                guard let confidence = Double(confStr) else { continue }
                keyValuePairs?.append(KeyValuePair(
                    key: key, value: value, confidence: min(max(confidence, 0.0), 1.0)
                ))
            }
        }

        // Fallback: pipe-delimited format (ENTITY|type|value|confidence)
        if entities.isEmpty {
            for line in responseText.components(separatedBy: .newlines) {
                let parts = line.trimmingCharacters(in: .whitespaces).split(separator: "|")
                guard parts.count >= 4 else { continue }
                let prefix = String(parts[0]).trimmingCharacters(in: .whitespaces).lowercased()
                if prefix == "entity" {
                    guard let confidence = Double(String(parts[3]).trimmingCharacters(in: .whitespaces)) else { continue }
                    entities.append(Entity(
                        type: String(parts[1]).trimmingCharacters(in: .whitespaces),
                        value: String(parts[2]).trimmingCharacters(in: .whitespaces),
                        confidence: min(max(confidence, 0.0), 1.0),
                        startPos: nil, endPos: nil
                    ))
                } else if prefix == "keyvalue" && extractKeyValues {
                    guard let confidence = Double(String(parts[3]).trimmingCharacters(in: .whitespaces)) else { continue }
                    keyValuePairs?.append(KeyValuePair(
                        key: String(parts[1]).trimmingCharacters(in: .whitespaces),
                        value: String(parts[2]).trimmingCharacters(in: .whitespaces),
                        confidence: min(max(confidence, 0.0), 1.0)
                    ))
                }
            }
        }

        return ExtractResult(entities: entities, keyValuePairs: keyValuePairs)
    }
}
