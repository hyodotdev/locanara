// swiftlint:disable file_length
import Foundation
import os.log

/// Logger for LocalModelInferenceProvider
private let logger = Logger(subsystem: "com.locanara", category: "LocalModelInferenceProvider")

/// Locanara inference provider implementation
///
/// Implements InferenceProvider protocol using llama.cpp-based inference
/// via InferenceRouter. This provider is registered with LocanaraClient
/// during Locanara initialization.
@available(iOS 15.0, macOS 14.0, *)
// swiftlint:disable:next type_body_length
public final class LocalModelInferenceProvider: InferenceProvider, @unchecked Sendable {

    // MARK: - Singleton

    /// Shared singleton instance
    public static let shared = LocalModelInferenceProvider()

    // MARK: - Properties

    private var router: InferenceRouter { InferenceRouter.shared }
    private var modelManager: ModelManager { ModelManager.shared }

    /// Conversation storage for chat context (protected by conversationsLock)
    private var conversations: [String: [ChatMessageInput]] = [:]
    private let conversationsLock = NSLock()

    // MARK: - Initialization

    private init() {}

    // MARK: - InferenceProvider Protocol

    public func isReady() -> Bool {
        return modelManager.getLoadedModel() != nil
    }

    // MARK: - Private Helpers

    /// Ensure router is initialized before executing inference
    private func ensureRouterInitialized() async throws {
        try await router.initialize()
    }

    // MARK: - Gemma 2 Prompt Formatting

    /// Format a prompt using Gemma 2 template
    ///
    /// Gemma 2 uses turn-based format:
    /// ```
    /// <start_of_turn>user
    /// {system_message}
    ///
    /// {user_message}<end_of_turn>
    /// <start_of_turn>model
    /// ```
    private func formatGemmaPrompt(system: String, user: String) -> String {
        return """
        <start_of_turn>user
        \(system)

        \(user)<end_of_turn>
        <start_of_turn>model
        """
    }

    /// Format a simple prompt without system message
    private func formatGemmaUserPrompt(user: String) -> String {
        return """
        <start_of_turn>user
        \(user)<end_of_turn>
        <start_of_turn>model
        """
    }

    // MARK: - Summarize

    public func summarize(input: String, params: SummarizeParametersInput?) async throws -> SummarizeResult {
        try await ensureRouterInitialized()

        let outputType = params?.outputType ?? .oneBullet

        let bulletCount: Int
        switch outputType {
        case .oneBullet:
            bulletCount = 1
        case .twoBullets:
            bulletCount = 2
        case .threeBullets:
            bulletCount = 3
        }

        // Detect input language dynamically (no hardcoding)
        let detectedLangCode = detectLanguage(input)
        let detectedLanguage = getLanguageName(for: detectedLangCode)
        let languageInstruction = "You MUST respond in \(detectedLanguage). Do NOT use any other language."

        // Gemma 2 format prompt - respond in same language as input
        let systemPrompt = "You are a helpful assistant that summarizes text. \(languageInstruction) Do NOT translate."
        let userPrompt = """
        Summarize the following text in exactly \(bulletCount) bullet point\(bulletCount > 1 ? "s" : ""). Output in the same language as the input text. Do not translate.

        Text:
        \(input)
        """

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let response = try await router.execute(
            feature: .summarize,
            input: prompt,
            config: .summarize
        )

        // Post-process: limit bullet points to requested count
        let processedResponse = limitBulletPoints(response, to: bulletCount)

        return SummarizeResult(
            summary: processedResponse,
            originalLength: input.count,
            summaryLength: processedResponse.count,
            confidence: 0.85
        )
    }

    /// Check if a line starts with a bullet or numbered list marker
    private func isBulletLine(_ line: String) -> Bool {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        // Check for bullet markers
        if trimmed.hasPrefix("•") || trimmed.hasPrefix("-") || trimmed.hasPrefix("*") {
            return true
        }
        // Check for numbered list (1., 2., etc.)
        let numberedPattern = "^\\d+[.)]\\s"
        if let regex = try? NSRegularExpression(pattern: numberedPattern),
           regex.firstMatch(in: trimmed, range: NSRange(trimmed.startIndex..., in: trimmed)) != nil {
            return true
        }
        return false
    }

    /// Check if a line is a prompt echo that should be filtered out
    private func isPromptEchoLine(_ line: String) -> Bool {
        let trimmed = line.trimmingCharacters(in: .whitespaces).lowercased()

        // Filter out common prompt echo patterns
        let echoPatterns = [
            "most important point",
            "key point",
            "main point",
            "here are the",
            "the following",
            "from this text are",
            "from the text are",
            "summary of"
        ]

        for pattern in echoPatterns {
            if trimmed.contains(pattern) {
                return true
            }
        }

        // Filter out lines that are just "N." where N is a number (orphaned list marker)
        let orphanedNumberPattern = "^\\d+\\.?$"
        if let regex = try? NSRegularExpression(pattern: orphanedNumberPattern),
           regex.firstMatch(in: trimmed, range: NSRange(trimmed.startIndex..., in: trimmed)) != nil {
            return true
        }

        return false
    }

    /// Extract content from a bullet line, removing the bullet/number prefix
    private func extractBulletContent(_ line: String) -> String {
        var content = line.trimmingCharacters(in: .whitespaces)

        // Remove bullet markers
        if content.hasPrefix("•") {
            content = String(content.dropFirst()).trimmingCharacters(in: .whitespaces)
        } else if content.hasPrefix("-") || content.hasPrefix("*") {
            content = String(content.dropFirst()).trimmingCharacters(in: .whitespaces)
        }

        // Remove numbered prefix (1., 2., 1), etc.)
        let numberedPattern = "^\\d+[.)]\\s*"
        if let regex = try? NSRegularExpression(pattern: numberedPattern) {
            let range = NSRange(content.startIndex..., in: content)
            content = regex.stringByReplacingMatches(in: content, range: range, withTemplate: "")
        }

        return content.trimmingCharacters(in: .whitespaces)
    }

    /// Limit the number of bullet points in a response
    private func limitBulletPoints(_ text: String, to count: Int) -> String {
        // Clean up the text
        let processedText = text.trimmingCharacters(in: .whitespacesAndNewlines)

        let lines = processedText.components(separatedBy: "\n")
        var bulletPoints: [String] = []
        var currentBulletContent = ""

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            // Skip prompt echo lines and orphaned markers
            if isPromptEchoLine(trimmed) {
                continue
            }

            if isBulletLine(trimmed) {
                // Save previous bullet if exists and is not a prompt echo
                if !currentBulletContent.isEmpty && !isPromptEchoLine(currentBulletContent) {
                    bulletPoints.append("• " + currentBulletContent)
                }
                // Start new bullet
                let content = extractBulletContent(trimmed)
                // Skip if the extracted content is a prompt echo
                if isPromptEchoLine(content) {
                    currentBulletContent = ""
                } else {
                    currentBulletContent = content
                }
            } else if !trimmed.isEmpty && !currentBulletContent.isEmpty {
                // Continuation of current bullet (skip if it's a prompt echo continuation)
                if !isPromptEchoLine(trimmed) {
                    currentBulletContent += " " + trimmed
                }
            } else if !trimmed.isEmpty && currentBulletContent.isEmpty && bulletPoints.isEmpty {
                // First line without bullet marker - treat as content only if not a prompt echo
                if !isPromptEchoLine(trimmed) {
                    currentBulletContent = trimmed
                }
            }
        }

        // Add last bullet if exists and is not a prompt echo
        if !currentBulletContent.isEmpty && !isPromptEchoLine(currentBulletContent) {
            bulletPoints.append("• " + currentBulletContent)
        }

        // If we only found one bullet but need more, try to split by sentences
        if bulletPoints.count == 1 && count > 1 {
            bulletPoints = splitIntoMultipleBullets(bulletPoints[0], targetCount: count)
        }

        // If no bullet points found, try to create from the text by splitting sentences
        if bulletPoints.isEmpty && !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            // Filter out echo lines from raw text
            let cleanLines = text.components(separatedBy: .newlines)
                .map { $0.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty && !isPromptEchoLine($0) }
            let cleanText = cleanLines.joined(separator: " ")
            if !cleanText.isEmpty {
                bulletPoints = splitIntoMultipleBullets("• " + cleanText, targetCount: count)
            }
        }

        // Remove duplicate bullet points (comparing content without the bullet marker)
        var uniqueBullets: [String] = []
        var seenContent: Set<String> = []
        for bullet in bulletPoints {
            let content = bullet.hasPrefix("• ") ? String(bullet.dropFirst(2)) : bullet
            let normalizedContent = content.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            if !seenContent.contains(normalizedContent) {
                seenContent.insert(normalizedContent)
                uniqueBullets.append(bullet)
            }
        }

        // Limit to requested count
        let limited = Array(uniqueBullets.prefix(count))
        return limited.joined(separator: "\n")
    }

    /// Split a single bullet point into multiple bullets based on sentences
    private func splitIntoMultipleBullets(_ text: String, targetCount: Int) -> [String] {
        // Remove bullet prefix if present
        var content = text
        if content.hasPrefix("• ") {
            content = String(content.dropFirst(2))
        } else if content.hasPrefix("•") {
            content = String(content.dropFirst(1))
        }

        // Try to split by sentences
        let sentences = splitIntoSentences(content)

        if sentences.count >= targetCount {
            // Group sentences into target count bullets
            var bullets: [String] = []
            let sentencesPerBullet = max(1, sentences.count / targetCount)

            var currentSentences: [String] = []
            for (index, sentence) in sentences.enumerated() {
                currentSentences.append(sentence)

                // Create a bullet when we have enough sentences or at the end
                if currentSentences.count >= sentencesPerBullet || index == sentences.count - 1 {
                    if bullets.count < targetCount - 1 || index == sentences.count - 1 {
                        let bulletContent = currentSentences.joined(separator: " ").trimmingCharacters(in: .whitespaces)
                        if !bulletContent.isEmpty {
                            bullets.append("• " + bulletContent)
                        }
                        currentSentences = []
                    }
                }
            }

            // If we still have leftover sentences, append to last bullet
            if !currentSentences.isEmpty && !bullets.isEmpty {
                let lastIndex = bullets.count - 1
                let additionalContent = currentSentences.joined(separator: " ")
                bullets[lastIndex] += " " + additionalContent
            }

            return bullets
        }

        // If not enough sentences, return as single bullet
        return ["• " + content.trimmingCharacters(in: .whitespaces)]
    }

    /// Split text into sentences
    private func splitIntoSentences(_ text: String) -> [String] {
        var sentences: [String] = []

        // Use NSLinguisticTagger for sentence detection
        let tagger = NSLinguisticTagger(tagSchemes: [.tokenType], options: 0)
        tagger.string = text

        var sentenceRanges: [Range<String.Index>] = []
        let range = NSRange(text.startIndex..., in: text)

        tagger.enumerateTags(in: range, unit: .sentence, scheme: .tokenType, options: []) { _, tokenRange, _ in
            if let range = Range(tokenRange, in: text) {
                sentenceRanges.append(range)
            }
        }

        for range in sentenceRanges {
            let sentence = String(text[range]).trimmingCharacters(in: .whitespacesAndNewlines)
            if !sentence.isEmpty {
                sentences.append(sentence)
            }
        }

        // Fallback: split by common sentence endings if tagger didn't work well
        if sentences.count <= 1 {
            // Try splitting by ". " followed by capital letter
            let pattern = "(?<=[.!?])\\s+(?=[A-Z])"
            if let regex = try? NSRegularExpression(pattern: pattern) {
                let nsText = text as NSString
                var lastEnd = 0
                let matches = regex.matches(in: text, range: NSRange(location: 0, length: nsText.length))

                for match in matches {
                    let sentenceRange = NSRange(location: lastEnd, length: match.range.location - lastEnd)
                    let sentence = nsText.substring(with: sentenceRange).trimmingCharacters(in: .whitespacesAndNewlines)
                    if !sentence.isEmpty {
                        sentences.append(sentence)
                    }
                    lastEnd = match.range.location + match.range.length
                }

                // Add the last sentence
                if lastEnd < nsText.length {
                    let lastSentence = nsText.substring(from: lastEnd).trimmingCharacters(in: .whitespacesAndNewlines)
                    if !lastSentence.isEmpty {
                        sentences.append(lastSentence)
                    }
                }
            }
        }

        // If still only one or no sentences, return as-is
        if sentences.isEmpty {
            sentences = [text]
        }

        return sentences
    }

    // MARK: - Classify

    public func classify(input: String, params: ClassifyParametersInput?) async throws -> ClassifyResult {
        try await ensureRouterInitialized()

        let categories = params?.categories ?? ["positive", "negative", "neutral"]
        let maxResults = params?.maxResults ?? 3

        let categoriesList = categories.joined(separator: ", ")

        // Gemma 2 format
        let systemPrompt = "You are a text classifier. Respond with only the category name, nothing else."
        let userPrompt = "Classify the following text into one of these categories: \(categoriesList)\n\nText: \(input)"

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let responseText = try await router.execute(
            feature: .classify,
            input: prompt,
            config: .classify
        )

        // Parse classification result - expect a single category name
        let trimmedResponse = responseText.trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .replacingOccurrences(of: ".", with: "")
            .replacingOccurrences(of: ",", with: "")

        // Find matching category (case-insensitive)
        var matchedCategory: String?
        for category in categories {
            if trimmedResponse.contains(category.lowercased()) {
                matchedCategory = category
                break
            }
        }

        // Build classifications with the matched category having highest score
        var classifications: [Classification] = []

        if let matched = matchedCategory {
            // Add matched category with high score
            classifications.append(Classification(
                label: matched,
                score: 0.9,
                metadata: nil
            ))
            // Add other categories with lower scores
            let remainingScore = 0.1 / Double(max(categories.count - 1, 1))
            for category in categories where category != matched {
                classifications.append(Classification(
                    label: category,
                    score: remainingScore,
                    metadata: nil
                ))
            }
        } else {
            // No match found, use first category as default
            let count = min(maxResults, categories.count)
            classifications = categories.prefix(count).enumerated().map { index, category in
                let score: Double
                if index == 0 {
                    score = 0.6
                } else {
                    score = 0.4 / Double(max(count - 1, 1))
                }
                return Classification(
                    label: category,
                    score: score,
                    metadata: nil
                )
            }
        }

        classifications.sort { $0.score > $1.score }
        classifications = Array(classifications.prefix(maxResults))

        guard let topClassification = classifications.first else {
            throw LocanaraError.executionFailed("No classifications generated")
        }

        return ClassifyResult(
            classifications: classifications,
            topClassification: topClassification
        )
    }

    // MARK: - Extract

    public func extract(input: String, params: ExtractParametersInput?) async throws -> ExtractResult {
        try await ensureRouterInitialized()

        let entityTypes = params?.entityTypes ?? ["person", "location", "date", "organization"]
        let extractKeyValues = params?.extractKeyValues ?? false

        let typesDescription = entityTypes.joined(separator: ", ")

        // Gemma 2 format - extract entities preserving original language
        let systemPrompt = "You are an entity extraction assistant. Extract entities exactly as they appear in the text. Format each on a new line as 'type: value'."
        let userPrompt = """
        Extract all \(typesDescription) from this text. Keep entity values in their original form:

        \(input)
        """

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let responseText = try await router.execute(
            feature: .extract,
            input: prompt,
            config: .chat
        )

        // Parse extraction results with flexible parsing
        var entities: [Entity] = []
        var keyValuePairs: [KeyValuePair]? = extractKeyValues ? [] : nil

        // Try to parse the response flexibly
        entities = parseEntitiesFlexibly(from: responseText, allowedTypes: entityTypes, originalText: input)

        // Extract key-value pairs if requested
        if extractKeyValues {
            keyValuePairs = extractKeyValuePairs(from: input)
        }

        return ExtractResult(
            entities: entities,
            keyValuePairs: keyValuePairs
        )
    }

    /// Parse entities from LLM response with flexible format handling
    private func parseEntitiesFlexibly(from response: String, allowedTypes: [String], originalText: String) -> [Entity] {
        var entities: [Entity] = []
        let lines = response.components(separatedBy: .newlines)

        // Type mapping for flexible matching
        let typeMapping: [String: String] = [
            "name": "person",
            "person": "person",
            "people": "person",
            "human": "person",
            "place": "location",
            "location": "location",
            "city": "location",
            "country": "location",
            "address": "location",
            "date": "date",
            "time": "date",
            "year": "date",
            "organization": "organization",
            "org": "organization",
            "company": "organization",
            "email": "email",
            "phone": "phone",
            "number": "number"
        ]

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { continue }

            // Try format: "type: value" or "- type: value"
            var workingLine = trimmed
            if workingLine.hasPrefix("-") || workingLine.hasPrefix("•") || workingLine.hasPrefix("*") {
                workingLine = String(workingLine.dropFirst()).trimmingCharacters(in: .whitespaces)
            }

            // Try to split by ":" or "-"
            var parts: [String] = []
            if workingLine.contains(":") {
                parts = workingLine.split(separator: ":", maxSplits: 1).map { String($0).trimmingCharacters(in: .whitespaces) }
            } else if workingLine.contains(" - ") {
                parts = workingLine.components(separatedBy: " - ").map { $0.trimmingCharacters(in: .whitespaces) }
            }

            if parts.count >= 2 {
                let potentialType = parts[0].lowercased()
                let value = parts[1]

                // Map to standard type
                if let mappedType = typeMapping[potentialType], !value.isEmpty {
                    // Check if this type is in allowed types
                    let finalType = allowedTypes.contains(mappedType) ? mappedType : allowedTypes.first ?? "unknown"
                    entities.append(Entity(
                        type: finalType,
                        value: value,
                        confidence: 0.8,
                        startPos: nil,
                        endPos: nil
                    ))
                } else if !value.isEmpty {
                    // Use the raw type if it matches allowed types
                    let matchedType = allowedTypes.first { potentialType.contains($0.lowercased()) }
                    if let type = matchedType {
                        entities.append(Entity(
                            type: type,
                            value: value,
                            confidence: 0.7,
                            startPos: nil,
                            endPos: nil
                        ))
                    }
                }
            }
        }

        // If no entities found, try basic NLP extraction from original text
        if entities.isEmpty {
            entities = extractEntitiesWithBasicNLP(from: originalText, types: allowedTypes)
        }

        return entities
    }

    /// Basic NLP-based entity extraction as fallback
    private func extractEntitiesWithBasicNLP(from text: String, types: [String]) -> [Entity] {
        var entities: [Entity] = []

        // Email pattern
        if types.contains("email") || types.contains("contact") {
            let emailPattern = "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
            if let regex = try? NSRegularExpression(pattern: emailPattern) {
                let range = NSRange(text.startIndex..., in: text)
                let matches = regex.matches(in: text, range: range)
                for match in matches {
                    if let matchRange = Range(match.range, in: text) {
                        entities.append(Entity(
                            type: "email",
                            value: String(text[matchRange]),
                            confidence: 0.95,
                            startPos: text.distance(from: text.startIndex, to: matchRange.lowerBound),
                            endPos: text.distance(from: text.startIndex, to: matchRange.upperBound)
                        ))
                    }
                }
            }
        }

        // Phone pattern (simple)
        if types.contains("phone") || types.contains("contact") {
            let phonePattern = "\\+?[0-9][0-9\\s\\-\\(\\)]{8,}[0-9]"
            if let regex = try? NSRegularExpression(pattern: phonePattern) {
                let range = NSRange(text.startIndex..., in: text)
                let matches = regex.matches(in: text, range: range)
                for match in matches {
                    if let matchRange = Range(match.range, in: text) {
                        entities.append(Entity(
                            type: "phone",
                            value: String(text[matchRange]),
                            confidence: 0.9,
                            startPos: text.distance(from: text.startIndex, to: matchRange.lowerBound),
                            endPos: text.distance(from: text.startIndex, to: matchRange.upperBound)
                        ))
                    }
                }
            }
        }

        // Date patterns
        if types.contains("date") {
            let datePatterns = [
                "\\d{1,2}/\\d{1,2}/\\d{2,4}",
                "\\d{1,2}-\\d{1,2}-\\d{2,4}",
                "\\d{4}-\\d{2}-\\d{2}",
                "(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+\\d{4}"
            ]
            for pattern in datePatterns {
                if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) {
                    let range = NSRange(text.startIndex..., in: text)
                    let matches = regex.matches(in: text, range: range)
                    for match in matches {
                        if let matchRange = Range(match.range, in: text) {
                            entities.append(Entity(
                                type: "date",
                                value: String(text[matchRange]),
                                confidence: 0.9,
                                startPos: text.distance(from: text.startIndex, to: matchRange.lowerBound),
                                endPos: text.distance(from: text.startIndex, to: matchRange.upperBound)
                            ))
                        }
                    }
                }
            }
        }

        // Capitalized words as potential names/organizations (simple heuristic)
        if types.contains("person") || types.contains("organization") {
            let words = text.components(separatedBy: .whitespacesAndNewlines)
            var i = 0
            while i < words.count {
                let word = words[i]
                // Check if word starts with capital and is not at sentence start
                if word.first?.isUppercase == true && word.count > 1 {
                    // Look for consecutive capitalized words (potential name)
                    var nameWords = [word]
                    var j = i + 1
                    while j < words.count {
                        let nextWord = words[j].trimmingCharacters(in: .punctuationCharacters)
                        if nextWord.first?.isUppercase == true && nextWord.count > 1 {
                            nameWords.append(nextWord)
                            j += 1
                        } else {
                            break
                        }
                    }

                    if nameWords.count >= 2 {
                        let name = nameWords.joined(separator: " ")
                        // Skip common non-name phrases
                        let skipPhrases = ["The", "This", "That", "These", "Those", "I", "We", "You", "He", "She", "It", "They"]
                        if !skipPhrases.contains(nameWords[0]) {
                            let entityType = types.contains("person") ? "person" : "organization"
                            entities.append(Entity(
                                type: entityType,
                                value: name,
                                confidence: 0.6,
                                startPos: nil,
                                endPos: nil
                            ))
                        }
                        i = j
                        continue
                    }
                }
                i += 1
            }
        }

        return entities
    }

    /// Extract key-value pairs from text using patterns
    private func extractKeyValuePairs(from text: String) -> [KeyValuePair] {
        var pairs: [KeyValuePair] = []

        // Pattern: "Key: Value" or "Key = Value"
        let patterns = [
            "([A-Za-z][A-Za-z\\s]{1,20}):\\s*([^\\n:]+)",
            "([A-Za-z][A-Za-z\\s]{1,20})\\s*=\\s*([^\\n=]+)"
        ]

        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern) {
                let range = NSRange(text.startIndex..., in: text)
                let matches = regex.matches(in: text, range: range)
                for match in matches where match.numberOfRanges >= 3 {
                    if let keyRange = Range(match.range(at: 1), in: text),
                       let valueRange = Range(match.range(at: 2), in: text) {
                        let key = String(text[keyRange]).trimmingCharacters(in: .whitespaces)
                        let value = String(text[valueRange]).trimmingCharacters(in: .whitespaces)
                        if !key.isEmpty && !value.isEmpty && key.count <= 30 {
                            pairs.append(KeyValuePair(
                                key: key,
                                value: value,
                                confidence: 0.8
                            ))
                        }
                    }
                }
            }
        }

        return pairs
    }

    // MARK: - Chat

    public func chat(input: String, params: ChatParametersInput?) async throws -> ChatResult {
        try await ensureRouterInitialized()

        let conversationId = params?.conversationId ?? UUID().uuidString

        // Get or create conversation history
        var history = conversationsLock.withLock { conversations[conversationId] ?? [] }

        // Detect input language dynamically (no hardcoding)
        let detectedLangCode = detectLanguage(input)
        let detectedLanguage = getLanguageName(for: detectedLangCode)

        // DEBUG: Log language detection
        logger.debug("========== [Chat] DEBUG START ==========")
        logger.debug("[Chat] Input text: '\(input)'")
        logger.debug("[Chat] Input length: \(input.count) chars")
        logger.debug("[Chat] Detected language code: \(detectedLangCode)")
        logger.debug("[Chat] Detected language name: \(detectedLanguage)")

        // Build Gemma 2 format prompt
        var promptParts: [String] = []

        // Add system prompt - respond in detected language ONLY (no mixing)
        let defaultSystemPrompt = """
            You are a helpful assistant. You MUST respond ONLY in \(detectedLanguage). \
            Do NOT mix languages. Do NOT add translations or explanations in parentheses. \
            Keep responses concise - one or two sentences.
            """
        let systemPrompt = params?.systemPrompt ?? defaultSystemPrompt

        // Add provided history if any
        if let providedHistory = params?.history {
            history.append(contentsOf: providedHistory)
        }

        // Add existing conversation history with Gemma format
        for msg in history {
            if msg.role == "user" {
                promptParts.append("<start_of_turn>user\n\(msg.content)<end_of_turn>")
            } else if msg.role == "assistant" {
                promptParts.append("<start_of_turn>model\n\(msg.content)<end_of_turn>")
            }
        }

        // Add current user message with language instruction for EVERY message
        // This ensures language switching mid-conversation works correctly
        history.append(ChatMessageInput(role: "user", content: input))

        // Build language reminder for the current message
        let languageReminder = "Respond in \(detectedLanguage)."

        if promptParts.isEmpty {
            // First message - include full system prompt
            promptParts.append("<start_of_turn>user\n\(systemPrompt)\n\n\(input)<end_of_turn>")
        } else {
            // Subsequent messages - include language reminder with the user's input
            promptParts.append("<start_of_turn>user\n[\(languageReminder)] \(input)<end_of_turn>")
        }
        promptParts.append("<start_of_turn>model")

        let prompt = promptParts.joined(separator: "\n")

        // DEBUG: Log prompt
        logger.debug("[Chat] Full prompt:\n\(prompt)")

        let rawResponse = try await router.execute(
            feature: .chat,
            input: prompt,
            config: .chat
        )

        // DEBUG: Log raw and cleaned response
        logger.debug("[Chat] Raw response: \(rawResponse)")

        // Post-process: clean up chat response
        let response = cleanChatResponse(rawResponse)

        logger.debug("[Chat] Cleaned response: \(response)")
        logger.debug("========== [Chat] DEBUG END ==========")

        // Store updated history
        history.append(ChatMessageInput(role: "assistant", content: response))
        conversationsLock.withLock { conversations[conversationId] = history }

        // Generate suggested prompts
        let suggestedPrompts = [
            "Tell me more",
            "Can you explain further?",
            "What are the alternatives?"
        ]

        return ChatResult(
            message: response,
            conversationId: conversationId,
            canContinue: true,
            suggestedPrompts: suggestedPrompts
        )
    }

    // MARK: - Translate

    public func translate(input: String, params: TranslateParametersInput?) async throws -> TranslateResult {
        try await ensureRouterInitialized()

        guard let params = params else {
            throw LocanaraError.invalidInput("Target language is required for translation")
        }

        let targetLanguage = params.targetLanguage
        let sourceLanguage = params.sourceLanguage ?? detectLanguage(input)

        // If same language, return as-is
        if sourceLanguage == targetLanguage {
            return TranslateResult(
                translatedText: input,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
                confidence: 1.0
            )
        }

        // Get language name dynamically (no hardcoding)
        let targetLangName = getLanguageName(for: targetLanguage)

        // Gemma 2 format - strict target language output only
        let systemPrompt = "You are a translator. Output ONLY in \(targetLangName). Never mix languages or use characters from other writing systems in your translation."
        let userPrompt = "Translate the following text to \(targetLangName). Output only the translation:\n\n\(input)"

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let rawResponse = try await router.execute(
            feature: .translate,
            input: prompt,
            config: .chat
        )

        // Extract only the translated text from response
        let translatedText = extractTranslation(from: rawResponse, originalInput: input, targetLanguage: targetLanguage)

        return TranslateResult(
            translatedText: translatedText,
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
            confidence: 0.85
        )
    }

    /// Extract the actual translation from LLM response
    private func extractTranslation(from response: String, originalInput: String, targetLanguage: String) -> String {
        var trimmed = response.trimmingCharacters(in: .whitespacesAndNewlines)

        // If response contains "Output:", extract text after the last "Output:"
        if let lastOutputRange = trimmed.range(of: "Output:", options: .backwards) {
            let afterOutput = trimmed[lastOutputRange.upperBound...]
            // Get text until next "Input:" or end of string
            if let nextInputRange = afterOutput.range(of: "Input:") {
                trimmed = String(afterOutput[..<nextInputRange.lowerBound]).trimmingCharacters(in: .whitespacesAndNewlines)
            } else {
                trimmed = String(afterOutput).trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }

        // If response starts with the original input, remove it
        if trimmed.hasPrefix(originalInput) {
            let remainder = String(trimmed.dropFirst(originalInput.count)).trimmingCharacters(in: .whitespacesAndNewlines)
            if !remainder.isEmpty {
                trimmed = remainder
            }
        }

        // Look for lines that don't contain "Input:" or "Output:" or "Example:"
        let lines = trimmed.components(separatedBy: .newlines)
        var translationLines: [String] = []
        for line in lines {
            let lineTrimmed = line.trimmingCharacters(in: .whitespaces)
            if !lineTrimmed.isEmpty &&
               !lineTrimmed.lowercased().contains("input:") &&
               !lineTrimmed.lowercased().contains("output:") &&
               !lineTrimmed.lowercased().contains("example:") &&
               !lineTrimmed.lowercased().contains("translate") {
                translationLines.append(lineTrimmed)
            }
        }

        var result = translationLines.isEmpty ? trimmed : translationLines.joined(separator: "\n")

        // Post-process: clean up mixed script characters based on target language
        result = cleanMixedScripts(from: result, targetLanguage: targetLanguage)

        return result
    }

    /// Remove unexpected script characters when the text contains mixed writing systems
    /// This handles cases where the model outputs characters from the wrong writing system
    private func cleanMixedScripts(from text: String, targetLanguage: String) -> String {
        // Filter characters based on target language script requirements
        var result = ""

        for scalar in text.unicodeScalars {
            let value = scalar.value
            var shouldKeep = true

            // CJK characters (Chinese) - only keep if target is Chinese
            if (0x4E00...0x9FFF).contains(value) {
                shouldKeep = (targetLanguage == "zh")
            }
            // Korean characters (Hangul) - only keep if target is Korean
            else if (0xAC00...0xD7AF).contains(value) ||
                    (0x1100...0x11FF).contains(value) ||
                    (0x3130...0x318F).contains(value) {
                shouldKeep = (targetLanguage == "ko")
            }
            // Japanese kana - only keep if target is Japanese
            else if (0x3040...0x309F).contains(value) ||
                    (0x30A0...0x30FF).contains(value) {
                shouldKeep = (targetLanguage == "ja")
            }
            // Everything else (Latin, punctuation, numbers, spaces) - always keep

            if shouldKeep {
                result.append(Character(scalar))
            }
        }

        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    // MARK: - Rewrite

    public func rewrite(input: String, params: RewriteParametersInput?) async throws -> RewriteResult {
        try await ensureRouterInitialized()

        guard let params = params else {
            throw LocanaraError.invalidInput("outputType is required for rewriting")
        }

        let outputType = params.outputType
        let styleInstruction = getStyleInstruction(for: outputType)

        // Detect input language dynamically (no hardcoding)
        let detectedLangCode = detectLanguage(input)
        let detectedLanguage = getLanguageName(for: detectedLangCode)

        // Gemma 2 format - preserve input language with explicit instruction
        let systemPrompt = """
            You are a writing assistant. Rewrite text according to instructions. \
            You MUST output ONLY in \(detectedLanguage). Do NOT translate to any other language. \
            Output only the rewritten text.
            """
        let userPrompt = "Rewrite this text \(styleInstruction). Output in \(detectedLanguage) only:\n\n\(input)"

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let responseText = try await router.execute(
            feature: .rewrite,
            input: prompt,
            config: .chat
        )

        // Extract the actual rewritten text
        let mainText = extractRewrittenText(from: responseText, originalInput: input)

        return RewriteResult(
            rewrittenText: mainText,
            style: outputType,
            alternatives: [],
            confidence: 0.85
        )
    }

    /// Extract the actual rewritten text from LLM response
    private func extractRewrittenText(from response: String, originalInput: String) -> String {
        let trimmed = response.trimmingCharacters(in: .whitespacesAndNewlines)

        // Remove common prefixes/labels
        var result = trimmed

        // Check for "Main version:" or similar labels
        let labelsToRemove = [
            "Main version:", "MAIN:", "Rewritten:", "Result:",
            "Main:", "Version 1:", "1.", "Alternative 1:", "ALT1:"
        ]

        for label in labelsToRemove {
            if let range = result.range(of: label, options: .caseInsensitive) {
                result = String(result[range.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
                break
            }
        }

        // Remove quotes if the entire result is quoted
        if result.hasPrefix("\"") && result.hasSuffix("\"") && result.count > 2 {
            result = String(result.dropFirst().dropLast())
        }

        // If result still contains multiple labeled sections, extract just the first one
        let lines = result.components(separatedBy: .newlines)
        var cleanLines: [String] = []

        for line in lines {
            let lineTrimmed = line.trimmingCharacters(in: .whitespaces)
            // Stop at alternative labels
            if lineTrimmed.lowercased().hasPrefix("alternative") ||
               lineTrimmed.hasPrefix("ALT") ||
               lineTrimmed.hasPrefix("Version 2") ||
               lineTrimmed.hasPrefix("2.") {
                break
            }
            // Skip label lines
            if lineTrimmed.lowercased().hasPrefix("main") && lineTrimmed.contains(":") {
                continue
            }
            if !lineTrimmed.isEmpty {
                // Remove leading quote if present
                var cleanLine = lineTrimmed
                if cleanLine.hasPrefix("\"") {
                    cleanLine = String(cleanLine.dropFirst())
                }
                if cleanLine.hasSuffix("\"") {
                    cleanLine = String(cleanLine.dropLast())
                }
                cleanLines.append(cleanLine)
            }
        }

        if !cleanLines.isEmpty {
            return cleanLines.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
        }

        return result
    }

    // MARK: - Proofread

    public func proofread(input: String, params: ProofreadParametersInput?) async throws -> ProofreadResult {
        try await ensureRouterInitialized()

        // Gemma 2 format - preserve input language
        let systemPrompt = "You are a proofreader. Fix spelling and grammar errors in the given language. Output only the corrected text in the same language."
        let userPrompt = "Correct all spelling and grammar errors in this text. Keep the same language:\n\n\(input)"

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let responseText = try await router.execute(
            feature: .proofread,
            input: prompt,
            config: .chat
        )

        // Extract the corrected text
        let correctedText = extractCorrectedText(from: responseText, originalInput: input)

        // Find corrections by comparing original and corrected text
        let corrections = findCorrections(original: input, corrected: correctedText)

        return ProofreadResult(
            correctedText: correctedText,
            corrections: corrections,
            hasCorrections: !corrections.isEmpty
        )
    }

    /// Extract corrected text from LLM response
    private func extractCorrectedText(from response: String, originalInput: String) -> String {
        let trimmed = response.trimmingCharacters(in: .whitespacesAndNewlines)

        // Remove common prefixes
        let prefixesToRemove = ["Corrected:", "Fixed:", "Result:", "Output:"]
        var result = trimmed

        for prefix in prefixesToRemove {
            if let range = result.range(of: prefix, options: .caseInsensitive) {
                result = String(result[range.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
                break
            }
        }

        // Remove quotes if present
        if result.hasPrefix("\"") && result.hasSuffix("\"") && result.count > 2 {
            result = String(result.dropFirst().dropLast())
        }

        // If result is empty or same as original, return original
        if result.isEmpty {
            return originalInput
        }

        return result
    }

    /// Find corrections by comparing original and corrected text word by word
    private func findCorrections(original: String, corrected: String) -> [ProofreadCorrection] {
        var corrections: [ProofreadCorrection] = []

        let originalWords = original.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }
        let correctedWords = corrected.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }

        // Simple word-by-word comparison
        let minCount = min(originalWords.count, correctedWords.count)

        var currentPos = 0
        for i in 0..<minCount {
            let origWord = originalWords[i]
            let corrWord = correctedWords[i]

            // Find position in original text
            if let range = original.range(of: origWord, range: original.index(original.startIndex, offsetBy: currentPos)..<original.endIndex) {
                let startPos = original.distance(from: original.startIndex, to: range.lowerBound)
                let endPos = original.distance(from: original.startIndex, to: range.upperBound)
                currentPos = endPos

                // Check if words are different (case-insensitive comparison for detection)
                if origWord.lowercased() != corrWord.lowercased() || origWord != corrWord {
                    // Determine error type
                    let errorType = determineErrorType(original: origWord, corrected: corrWord)

                    corrections.append(ProofreadCorrection(
                        original: origWord,
                        corrected: corrWord,
                        type: errorType,
                        confidence: 0.85,
                        startPos: startPos,
                        endPos: endPos
                    ))
                }
            }
        }

        return corrections
    }

    /// Determine the type of error based on the difference
    private func determineErrorType(original: String, corrected: String) -> String {
        let origLower = original.lowercased()
        let corrLower = corrected.lowercased()

        // Check for capitalization only
        if origLower == corrLower && original != corrected {
            return "capitalization"
        }

        // Check for punctuation differences
        let origNoPunct = original.trimmingCharacters(in: .punctuationCharacters)
        let corrNoPunct = corrected.trimmingCharacters(in: .punctuationCharacters)
        if origNoPunct.lowercased() == corrNoPunct.lowercased() && original != corrected {
            return "punctuation"
        }

        // Otherwise it's likely a spelling error
        return "spelling"
    }

    // MARK: - Describe Image

    public func describeImage(input: String, params: ImageDescriptionParametersInput?) async throws -> ImageDescriptionResult {
        try await ensureRouterInitialized()

        // Check if multimodal is available
        guard router.isMultimodalAvailable() else {
            return ImageDescriptionResult(
                description: "Image description requires the vision projector (mmproj) file. Please download the complete model package including the multimodal components.",
                alternatives: nil,
                confidence: 0.0
            )
        }

        // Get image data from params or input
        let imageData: Data

        if let base64 = params?.imageBase64, let data = Data(base64Encoded: base64) {
            imageData = data
        } else if let path = params?.imagePath, let data = FileManager.default.contents(atPath: path) {
            imageData = data
        } else if !input.isEmpty {
            // Try input as base64 or file path
            if let data = Data(base64Encoded: input) {
                imageData = data
            } else if let data = FileManager.default.contents(atPath: input) {
                imageData = data
            } else {
                throw LocanaraError.invalidInput("Input must be base64-encoded image data or a valid file path")
            }
        } else {
            throw LocanaraError.invalidInput("No image data provided")
        }

        // Execute with image
        let prompt = "Describe what you see in this image."
        let description = try await router.executeWithImage(
            prompt: prompt,
            imageData: imageData,
            config: .chat
        )

        return ImageDescriptionResult(
            description: description,
            alternatives: nil,
            confidence: 0.85
        )
    }

    public func generateImage(input: String, params: ImageGenerationParametersInput?) async throws -> ImageGenerationResult {
        // Locanara image generation would use Stable Diffusion or similar
        // For now, throw an error indicating this feature is not yet implemented
        throw LocanaraError.featureNotAvailable(.generateImage)
    }

    // MARK: - Helper Methods

    /// Detect language code from text using NSLinguisticTagger
    private func detectLanguage(_ text: String) -> String {
        let tagger = NSLinguisticTagger(tagSchemes: [.language], options: 0)
        tagger.string = text

        if let language = tagger.dominantLanguage {
            // Return the full language code for more accurate identification
            return String(language.prefix(2))
        }

        return "en"
    }

    /// Get human-readable language name from language code using Locale
    /// This dynamically handles all languages without hardcoding
    private func getLanguageName(for code: String) -> String {
        let locale = Locale(identifier: "en") // Use English locale for language names
        if let languageName = locale.localizedString(forLanguageCode: code) {
            return languageName
        }
        // Fallback to the code itself if no name found
        return code.uppercased()
    }

    /// Clean up chat response by removing Gemma special tokens and duplicate content
    private func cleanChatResponse(_ response: String) -> String {
        var result = response

        // 1. Remove everything after <end_of_turn> or <start_of_turn>
        if let endRange = result.range(of: "<end_of_turn>") {
            result = String(result[..<endRange.lowerBound])
        }
        if let startRange = result.range(of: "<start_of_turn>") {
            result = String(result[..<startRange.lowerBound])
        }

        // 2. Remove </s> and other end tokens
        result = result.replacingOccurrences(of: "</s>", with: "")
        result = result.replacingOccurrences(of: "<eos>", with: "")

        // 3. Trim whitespace
        result = result.trimmingCharacters(in: .whitespacesAndNewlines)

        // 4. Remove duplicate sentences (keep first occurrence only)
        let sentences = splitIntoSentences(result)
        var seenSentences: Set<String> = []
        var uniqueSentences: [String] = []

        for sentence in sentences {
            let normalized = sentence.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            if !normalized.isEmpty && !seenSentences.contains(normalized) {
                seenSentences.insert(normalized)
                uniqueSentences.append(sentence)
            }
        }

        // 5. Join unique sentences
        if uniqueSentences.count < sentences.count {
            // Had duplicates, rejoin
            result = uniqueSentences.joined(separator: " ")
        }

        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func getStyleInstruction(for outputType: RewriteOutputType) -> String {
        switch outputType {
        case .elaborate:
            return "to be more detailed and elaborate. Add context and expand on the ideas."
        case .emojify:
            return "by adding appropriate emojis throughout the text to make it more expressive and fun."
        case .shorten:
            return "to be more concise. Remove unnecessary words while keeping the main meaning."
        case .friendly:
            return "in a friendly, casual tone. Make it warm and approachable."
        case .professional:
            return "in a professional, formal tone. Make it suitable for business communication."
        case .rephrase:
            return "using different words and sentence structures while keeping the same meaning."
        }
    }

    /// Get translation example for few-shot prompting
    private func getTranslationExample(for targetLanguage: String) -> String {
        switch targetLanguage {
        case "ko":
            return """
            Example:
            Input: Hello
            Output: 안녕하세요
            """
        case "ja":
            return """
            Example:
            Input: Hello
            Output: こんにちは
            """
        case "zh":
            return """
            Example:
            Input: Hello
            Output: 你好
            """
        case "es":
            return """
            Example:
            Input: Hello
            Output: Hola
            """
        case "fr":
            return """
            Example:
            Input: Hello
            Output: Bonjour
            """
        case "de":
            return """
            Example:
            Input: Hello
            Output: Hallo
            """
        case "en":
            return """
            Example:
            Input: 안녕하세요
            Output: Hello
            """
        default:
            return ""
        }
    }

    /// Clear conversation history
    ///
    /// - Parameter conversationId: Conversation to clear
    public func clearConversation(_ conversationId: String) {
        conversations.removeValue(forKey: conversationId)
    }

    // MARK: - Advanced Options Methods

    /// Summarize with custom inference options
    public func summarizeWithOptions(
        input: String,
        params: SummarizeParametersInput?,
        options: AdvancedInferenceOptions?
    ) async throws -> SummarizeResult {
        try await ensureRouterInitialized()

        let outputType = params?.outputType ?? .oneBullet

        let bulletCount: Int
        switch outputType {
        case .oneBullet:
            bulletCount = 1
        case .twoBullets:
            bulletCount = 2
        case .threeBullets:
            bulletCount = 3
        }

        // Detect input language dynamically (no hardcoding)
        let detectedLangCode = detectLanguage(input)
        let detectedLanguage = getLanguageName(for: detectedLangCode)
        let languageInstruction = "You MUST respond in \(detectedLanguage). Do NOT use any other language."

        // Gemma 2 format prompt - respond in same language as input
        let systemPrompt = "You are a helpful assistant that summarizes text. \(languageInstruction) Do NOT translate."
        let userPrompt = """
        Summarize the following text in exactly \(bulletCount) bullet point\(bulletCount > 1 ? "s" : ""). Output in the same language as the input text. Do not translate.

        Text:
        \(input)
        """

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let config = InferenceConfig(from: options, base: .summarize)
        let response = try await router.execute(
            feature: .summarize,
            input: prompt,
            config: config
        )

        let processedResponse = limitBulletPoints(response, to: bulletCount)

        return SummarizeResult(
            summary: processedResponse,
            originalLength: input.count,
            summaryLength: processedResponse.count,
            confidence: 0.85
        )
    }

    /// Classify with custom inference options
    public func classifyWithOptions(
        input: String,
        params: ClassifyParametersInput?,
        options: AdvancedInferenceOptions?
    ) async throws -> ClassifyResult {
        try await ensureRouterInitialized()

        let categories = params?.categories ?? ["positive", "negative", "neutral"]
        let maxResults = params?.maxResults ?? 3
        let categoriesList = categories.joined(separator: ", ")

        // Gemma 2 format
        let systemPrompt = "You are a text classifier. Respond with only the category name, nothing else."
        let userPrompt = "Classify the following text into one of these categories: \(categoriesList)\n\nText: \(input)"

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let config = InferenceConfig(from: options, base: .classify)
        let responseText = try await router.execute(
            feature: .classify,
            input: prompt,
            config: config
        )

        let trimmedResponse = responseText.trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .replacingOccurrences(of: ".", with: "")
            .replacingOccurrences(of: ",", with: "")

        var matchedCategory: String?
        for category in categories {
            if trimmedResponse.contains(category.lowercased()) {
                matchedCategory = category
                break
            }
        }

        var classifications: [Classification] = []

        if let matched = matchedCategory {
            classifications.append(Classification(label: matched, score: 0.9, metadata: nil))
            let remainingScore = 0.1 / Double(max(categories.count - 1, 1))
            for category in categories where category != matched {
                classifications.append(Classification(label: category, score: remainingScore, metadata: nil))
            }
        } else {
            let count = min(maxResults, categories.count)
            classifications = categories.prefix(count).enumerated().map { index, category in
                Classification(
                    label: category,
                    score: index == 0 ? 0.6 : 0.4 / Double(max(count - 1, 1)),
                    metadata: nil
                )
            }
        }

        classifications.sort { $0.score > $1.score }
        classifications = Array(classifications.prefix(maxResults))

        guard let topClassification = classifications.first else {
            throw LocanaraError.executionFailed("No classifications generated")
        }

        return ClassifyResult(classifications: classifications, topClassification: topClassification)
    }

    /// Chat with custom inference options
    public func chatWithOptions(
        input: String,
        params: ChatParametersInput?,
        options: AdvancedInferenceOptions?
    ) async throws -> ChatResult {
        try await ensureRouterInitialized()

        let conversationId = params?.conversationId ?? UUID().uuidString
        var history = conversationsLock.withLock { conversations[conversationId] ?? [] }

        // Detect input language dynamically (no hardcoding)
        let detectedLangCode = detectLanguage(input)
        let detectedLanguage = getLanguageName(for: detectedLangCode)

        // Build Gemma 2 format prompt
        var promptParts: [String] = []

        // Add system prompt - respond in detected language ONLY (no mixing)
        let defaultSystemPrompt = """
            You are a helpful assistant. You MUST respond ONLY in \(detectedLanguage). \
            Do NOT mix languages. Do NOT add translations or explanations in parentheses. \
            Keep responses concise - one or two sentences.
            """
        let systemPrompt = params?.systemPrompt ?? defaultSystemPrompt

        if let providedHistory = params?.history {
            history.append(contentsOf: providedHistory)
        }

        // Add existing conversation history with Gemma format
        for msg in history {
            if msg.role == "user" {
                promptParts.append("<start_of_turn>user\n\(msg.content)<end_of_turn>")
            } else if msg.role == "assistant" {
                promptParts.append("<start_of_turn>model\n\(msg.content)<end_of_turn>")
            }
        }

        // Add current user message with language instruction for EVERY message
        // This ensures language switching mid-conversation works correctly
        history.append(ChatMessageInput(role: "user", content: input))

        // Build language reminder for the current message
        let languageReminder = "Respond in \(detectedLanguage)."

        if promptParts.isEmpty {
            // First message - include full system prompt
            promptParts.append("<start_of_turn>user\n\(systemPrompt)\n\n\(input)<end_of_turn>")
        } else {
            // Subsequent messages - include language reminder with the user's input
            promptParts.append("<start_of_turn>user\n[\(languageReminder)] \(input)<end_of_turn>")
        }
        promptParts.append("<start_of_turn>model")

        let prompt = promptParts.joined(separator: "\n")

        let config = InferenceConfig(from: options, base: .chat)
        let rawResponse = try await router.execute(feature: .chat, input: prompt, config: config)

        // Post-process: clean up chat response
        let response = cleanChatResponse(rawResponse)

        history.append(ChatMessageInput(role: "assistant", content: response))
        conversationsLock.withLock { conversations[conversationId] = history }

        return ChatResult(
            message: response,
            conversationId: conversationId,
            canContinue: true,
            suggestedPrompts: ["Tell me more", "Can you explain further?", "What are the alternatives?"]
        )
    }

    /// Translate with custom inference options
    public func translateWithOptions(
        input: String,
        params: TranslateParametersInput?,
        options: AdvancedInferenceOptions?
    ) async throws -> TranslateResult {
        try await ensureRouterInitialized()

        guard let params = params else {
            throw LocanaraError.invalidInput("Target language is required for translation")
        }

        let targetLanguage = params.targetLanguage
        let sourceLanguage = params.sourceLanguage ?? detectLanguage(input)

        if sourceLanguage == targetLanguage {
            return TranslateResult(
                translatedText: input,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
                confidence: 1.0
            )
        }

        // Get language name dynamically (no hardcoding)
        let targetLangName = getLanguageName(for: targetLanguage)

        // Gemma 2 format - strict target language output only
        let systemPrompt = "You are a translator. Output ONLY in \(targetLangName). Never mix languages or use characters from other writing systems in your translation."
        let userPrompt = "Translate the following text to \(targetLangName). Output only the translation:\n\n\(input)"

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let config = InferenceConfig(from: options, base: .chat)
        let rawResponse = try await router.execute(feature: .translate, input: prompt, config: config)
        let translatedText = extractTranslation(from: rawResponse, originalInput: input, targetLanguage: targetLanguage)

        return TranslateResult(
            translatedText: translatedText,
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
            confidence: 0.85
        )
    }

    /// Rewrite with custom inference options
    public func rewriteWithOptions(
        input: String,
        params: RewriteParametersInput?,
        options: AdvancedInferenceOptions?
    ) async throws -> RewriteResult {
        try await ensureRouterInitialized()

        guard let params = params else {
            throw LocanaraError.invalidInput("outputType is required for rewriting")
        }

        let styleInstruction = getStyleInstruction(for: params.outputType)

        // Detect input language dynamically (no hardcoding)
        let detectedLangCode = detectLanguage(input)
        let detectedLanguage = getLanguageName(for: detectedLangCode)

        // Gemma 2 format - preserve input language with explicit instruction
        let systemPrompt = """
            You are a writing assistant. Rewrite text according to instructions. \
            You MUST output ONLY in \(detectedLanguage). Do NOT translate to any other language. \
            Output only the rewritten text.
            """
        let userPrompt = "Rewrite this text \(styleInstruction). Output in \(detectedLanguage) only:\n\n\(input)"

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let config = InferenceConfig(from: options, base: .chat)
        let responseText = try await router.execute(feature: .rewrite, input: prompt, config: config)
        let mainText = extractRewrittenText(from: responseText, originalInput: input)

        return RewriteResult(
            rewrittenText: mainText,
            style: params.outputType,
            alternatives: [],
            confidence: 0.85
        )
    }

    /// Proofread with custom inference options
    public func proofreadWithOptions(
        input: String,
        params: ProofreadParametersInput?,
        options: AdvancedInferenceOptions?
    ) async throws -> ProofreadResult {
        try await ensureRouterInitialized()

        // Gemma 2 format - preserve input language
        let systemPrompt = "You are a proofreader. Fix spelling and grammar errors in the given language. Output only the corrected text in the same language."
        let userPrompt = "Correct all spelling and grammar errors in this text. Keep the same language:\n\n\(input)"

        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let config = InferenceConfig(from: options, base: .chat)
        let responseText = try await router.execute(feature: .proofread, input: prompt, config: config)
        let correctedText = extractCorrectedText(from: responseText, originalInput: input)
        let corrections = findCorrections(original: input, corrected: correctedText)

        return ProofreadResult(
            correctedText: correctedText,
            corrections: corrections,
            hasCorrections: !corrections.isEmpty
        )
    }

    /// Extract with custom inference options
    public func extractWithOptions(
        input: String,
        params: ExtractParametersInput?,
        options: AdvancedInferenceOptions?
    ) async throws -> ExtractResult {
        try await ensureRouterInitialized()

        let entityTypes = params?.entityTypes ?? ["person", "location", "date", "organization"]
        let extractKeyValues = params?.extractKeyValues ?? false
        let typesDescription = entityTypes.joined(separator: ", ")

        // Gemma 2 format prompt - extract entities preserving original language
        let systemPrompt = "You are an entity extraction assistant. Extract entities exactly as they appear in the text. Format each on a new line as 'type: value'."
        let userPrompt = "Extract all \(typesDescription) from this text. Keep entity values in their original form:\n\n\(input)"
        let prompt = formatGemmaPrompt(system: systemPrompt, user: userPrompt)

        let config = InferenceConfig(from: options, base: .chat)
        let responseText = try await router.execute(feature: .extract, input: prompt, config: config)

        let entities = parseEntitiesFlexibly(from: responseText, allowedTypes: entityTypes, originalText: input)
        let keyValuePairs: [KeyValuePair]? = extractKeyValues ? extractKeyValuePairs(from: input) : nil

        return ExtractResult(entities: entities, keyValuePairs: keyValuePairs)
    }
}
