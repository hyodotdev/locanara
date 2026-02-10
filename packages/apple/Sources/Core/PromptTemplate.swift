import Foundation

/// A reusable prompt template with variable interpolation.
///
/// ```swift
/// let template = PromptTemplate(
///     template: "Summarize into {count} points:\n{text}",
///     inputVariables: ["count", "text"]
/// )
/// let prompt = try template.format(["count": "3", "text": article])
/// ```
public struct PromptTemplate: Sendable {
    /// The template string with {variable} placeholders
    public let template: String
    /// Required variable names
    public let inputVariables: [String]
    /// Optional system instruction prefix
    public let systemInstruction: String?

    public init(
        template: String,
        inputVariables: [String],
        systemInstruction: String? = nil
    ) {
        self.template = template
        self.inputVariables = inputVariables
        self.systemInstruction = systemInstruction
    }

    /// Format the template with provided values
    public func format(_ values: [String: String]) throws -> String {
        for variable in inputVariables {
            guard values[variable] != nil else {
                throw LocanaraError.invalidInput("Missing template variable: \(variable)")
            }
        }

        var result = template
        for (key, value) in values {
            result = result.replacingOccurrences(of: "{\(key)}", with: value)
        }

        if let system = systemInstruction {
            return "System instruction: \(system)\n\n\(result)"
        }
        return result
    }

    /// Create a prompt template from a string with auto-detected {variable} placeholders
    public static func from(_ template: String) -> PromptTemplate {
        let pattern = try! NSRegularExpression(pattern: "\\{(\\w+)\\}")
        let matches = pattern.matches(
            in: template,
            range: NSRange(template.startIndex..., in: template)
        )
        let variables = matches.compactMap { match -> String? in
            guard let range = Range(match.range(at: 1), in: template) else { return nil }
            return String(template[range])
        }
        return PromptTemplate(template: template, inputVariables: variables)
    }
}
