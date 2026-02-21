import Foundation

/// Pre-built prompt templates for common on-device AI tasks
public enum BuiltInPrompts {
    public static let summarize = PromptTemplate(
        templateString: """
        Summarize the following {inputTypeHint} into EXACTLY {bulletCount} bullet point(s). You MUST output {bulletCount} bullet point(s) — no more, no less.

        Rules:
        - Output EXACTLY {bulletCount} bullet point(s), each starting with "* "
        - Each bullet should capture a key point concisely
        - Do NOT output any other text before or after the bullet point(s)

        Text to summarize:
        <input>{text}</input>
        """,
        inputVariables: ["text", "bulletCount", "inputTypeHint"]
    )

    public static let classify = PromptTemplate(
        templateString: """
        Classify the following text into one or more of these categories: {categories}

        Return ONLY the matching categories with confidence scores, one per line, in this exact format:
        category: score

        Scores should be between 0.0 and 1.0 and sum to 1.0.
        Do not include any other text, headers, or explanation.

        Text to classify:
        <input>{text}</input>
        """,
        inputVariables: ["text", "categories"]
    )

    public static let extract = PromptTemplate(
        templateString: """
        Extract entities from the following text.
        Entity types to find: {entityTypes}

        Return ONLY a list of entities, one per line, in this exact format:
        type: value

        Do not include any other text, headers, numbering, or explanation.

        Text:
        <input>{text}</input>
        """,
        inputVariables: ["text", "entityTypes"]
    )

    public static let translate = PromptTemplate(
        templateString: """
        Translate the following text from {sourceLang} to {targetLang}.
        Provide ONLY the translation, no explanations or additional text.

        Text to translate:
        {text}
        """,
        inputVariables: ["text", "sourceLang", "targetLang"]
    )

    public static let rewrite = PromptTemplate(
        templateString: """
        Rewrite the following text {styleInstruction}
        Return ONLY the rewritten text with no labels, headers, or alternatives.

        Text to rewrite:
        <input>{text}</input>
        """,
        inputVariables: ["text", "styleInstruction"]
    )

    public static let proofread = PromptTemplate(
        templateString: """
        Proofread the following text for grammar, spelling, and punctuation errors.
        Return the corrected text.

        Text to proofread:
        <input>{text}</input>
        """,
        inputVariables: ["text"]
    )

    /// Clean up on-device model output: strip preambles and wrapping quotes.
    public static func stripPreamble(_ text: String) -> String {
        var result = text

        // Strip preamble lines (e.g. "Certainly! Here is...")
        let parts = result.components(separatedBy: "\n\n")
        if parts.count > 1 {
            let first = parts[0].lowercased()
            let patterns = ["certainly", "sure", "of course", "here is", "here's", "below is", "here are"]
            if patterns.contains(where: { first.contains($0) }) {
                result = parts.dropFirst().joined(separator: "\n\n").trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }

        // Strip wrapping quotes the model sometimes adds
        if result.hasPrefix("\"") && result.hasSuffix("\"") && result.count > 2 {
            result = String(result.dropFirst().dropLast())
        }

        // Strip markdown formatting (bold, italic, headers)
        result = result.replacingOccurrences(of: "\\*\\*(.+?)\\*\\*", with: "$1", options: .regularExpression)
        result = result.replacingOccurrences(of: "(?<!\\*)\\*(?!\\*)(.+?)(?<!\\*)\\*(?!\\*)", with: "$1", options: .regularExpression)
        result = result.replacingOccurrences(of: "(?m)^#{1,6}\\s+", with: "", options: .regularExpression)

        return result
    }

    public static let chat = PromptTemplate(
        templateString: """
        {systemPrompt}

        {languageInstruction}

        {history}User: {text}
        Assistant:
        """,
        inputVariables: ["text", "systemPrompt", "history", "languageInstruction"]
    )
}
