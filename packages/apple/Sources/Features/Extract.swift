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

        prompt += "\n\nText:\n<input>\n\(input)\n</input>"

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

        // Try JSON parsing using JSONSerialization for field-order independence
        if let arrayStart = responseText.firstIndex(of: "[") {
            let arrayEnd = Self.findMatchingBracket(responseText, openPos: arrayStart)
            if let arrayEnd = arrayEnd {
                let jsonStr = String(responseText[arrayStart...arrayEnd])
                if let data = jsonStr.data(using: .utf8),
                   let parsed = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
                    for obj in parsed {
                        guard let type = obj["type"] as? String,
                              let value = obj["value"] as? String else { continue }
                        let confidence = (obj["confidence"] as? Double) ?? 0.0
                        entities.append(Entity(
                            type: type,
                            value: value,
                            confidence: min(max(confidence, 0.0), 1.0),
                            startPos: nil,
                            endPos: nil
                        ))
                    }
                }
            }
        }

        if extractKeyValues, let kvStart = responseText.range(of: "\"kv\"") {
            let kvSection = String(responseText[kvStart.lowerBound...])
            if let kvArrayStart = kvSection.firstIndex(of: "[") {
                let kvArrayEnd = Self.findMatchingBracket(kvSection, openPos: kvArrayStart)
                if let kvArrayEnd = kvArrayEnd {
                    let kvJsonStr = String(kvSection[kvArrayStart...kvArrayEnd])
                    if let data = kvJsonStr.data(using: .utf8),
                       let parsed = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
                        for obj in parsed {
                            guard let key = obj["key"] as? String,
                                  let value = obj["value"] as? String else { continue }
                            let confidence = (obj["confidence"] as? Double) ?? 0.0
                            keyValuePairs?.append(KeyValuePair(
                                key: key, value: value, confidence: min(max(confidence, 0.0), 1.0)
                            ))
                        }
                    }
                }
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

    /// Find the matching closing bracket for an opening '[' using balanced scanning.
    private static func findMatchingBracket(_ text: String, openPos: String.Index) -> String.Index? {
        var depth = 0
        var inString = false
        var i = openPos
        while i < text.endIndex {
            let c = text[i]
            if inString {
                if c == "\\" {
                    i = text.index(after: i)
                    guard i < text.endIndex else { return nil }
                } else if c == "\"" {
                    inString = false
                }
            } else {
                switch c {
                case "\"": inString = true
                case "[": depth += 1
                case "]":
                    depth -= 1
                    if depth == 0 { return i }
                default: break
                }
            }
            i = text.index(after: i)
        }
        return nil
    }
}
