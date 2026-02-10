import Foundation

// MARK: - Tool Protocol

/// Describes a function that can be called by the model or agent.
///
/// ```swift
/// let tool = FunctionTool(
///     id: "weather",
///     description: "Get current weather",
///     parameterDescription: "city: City name"
/// ) { args in
///     return "Sunny, 25°C in \(args["city"] ?? "unknown")"
/// }
/// ```
public protocol Tool: Sendable {
    /// Unique identifier for this tool
    var id: String { get }
    /// Human-readable description of what this tool does
    var description: String { get }
    /// Description of expected parameters
    var parameterDescription: String { get }

    /// Execute the tool with the given arguments
    func execute(arguments: [String: String]) async throws -> String
}

// MARK: - Function Tool

/// A closure-based tool implementation
public struct FunctionTool: Tool {
    public let id: String
    public let description: String
    public let parameterDescription: String
    private let handler: @Sendable ([String: String]) async throws -> String

    public init(
        id: String,
        description: String,
        parameterDescription: String,
        handler: @escaping @Sendable ([String: String]) async throws -> String
    ) {
        self.id = id
        self.description = description
        self.parameterDescription = parameterDescription
        self.handler = handler
    }

    public func execute(arguments: [String: String]) async throws -> String {
        try await handler(arguments)
    }
}

// MARK: - Local Search Tool

/// Built-in tool that performs on-device text search (no network)
public struct LocalSearchTool: Tool {
    public let id = "local_search"
    public let description = "Search through locally stored documents on-device"
    public let parameterDescription = "query: The search query string"

    private let documents: [String]

    public init(documents: [String]) {
        self.documents = documents
    }

    public func execute(arguments: [String: String]) async throws -> String {
        guard let query = arguments["query"] else {
            throw LocanaraError.invalidInput("Missing 'query' parameter")
        }
        let results = documents.filter { $0.localizedCaseInsensitiveContains(query) }
        return results.isEmpty ? "No results found." : results.joined(separator: "\n")
    }
}
