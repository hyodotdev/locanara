import Foundation

// MARK: - OutputParser Protocol

/// Protocol for parsing model output text into structured types.
///
/// ```swift
/// let parser = JSONOutputParser<MyResponse>()
/// let result = try parser.parse(modelOutput)
/// ```
public protocol OutputParser<Output>: Sendable {
    associatedtype Output: Sendable

    /// Instructions to include in the prompt to guide model output format
    var formatInstructions: String { get }

    /// Parse raw model output text into the target type
    func parse(_ text: String) throws -> Output
}

// MARK: - JSON Output Parser

/// Parses JSON-formatted model output into Decodable types
public struct JSONOutputParser<T: Decodable & Sendable>: OutputParser {
    public typealias Output = T

    public var formatInstructions: String {
        "Respond ONLY with valid JSON matching the expected schema. No explanations."
    }

    public init() {}

    public func parse(_ text: String) throws -> T {
        let cleaned = text
            .replacingOccurrences(of: "```json", with: "")
            .replacingOccurrences(of: "```", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard let data = cleaned.data(using: .utf8) else {
            throw LocanaraError.executionFailed("Could not encode response as UTF-8")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

// MARK: - Text Output Parser

/// Passthrough parser for plain text responses
public struct TextOutputParser: OutputParser {
    public typealias Output = String

    public var formatInstructions: String { "" }

    public init() {}

    public func parse(_ text: String) throws -> String {
        text.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// MARK: - List Output Parser

/// Parses delimited list responses into arrays
public struct ListOutputParser: OutputParser {
    public typealias Output = [String]

    public let delimiter: String

    public var formatInstructions: String {
        "Return items separated by '\(delimiter)', one per line."
    }

    public init(delimiter: String = "\n") {
        self.delimiter = delimiter
    }

    public func parse(_ text: String) throws -> [String] {
        text.components(separatedBy: delimiter)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }
}
