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

// MARK: - Apple Foundation Models Tool Bridge

#if canImport(FoundationModels)
import FoundationModels

/// Bridges a Locanara `Tool` to Apple's Foundation Models `Tool` protocol,
/// enabling the on-device model to autonomously call tools during generation.
///
/// ```swift
/// let weatherTool = FunctionTool(id: "weather", ...) { args in "Sunny" }
/// let bridge = FoundationModelToolBridge(tool: weatherTool)
/// let session = LanguageModelSession(tools: [bridge])
/// ```
@available(iOS 26.0, macOS 26.0, *)
public struct FoundationModelToolBridge: FoundationModels.Tool {
    public let name: String
    public let description: String

    @Generable
    public struct Arguments {
        @Guide(description: "JSON-encoded arguments as key-value pairs")
        var arguments: String
    }

    private let locanaraTool: any Locanara.Tool

    public init(tool: any Locanara.Tool) {
        self.locanaraTool = tool
        self.name = tool.id
        self.description = "\(tool.description). Parameters: \(tool.parameterDescription)"
    }

    public typealias Output = String

    public func call(arguments: Arguments) async throws -> String {
        let parsed = Self.parseArguments(arguments.arguments)
        return try await locanaraTool.execute(arguments: parsed)
    }

    private static func parseArguments(_ json: String) -> [String: String] {
        guard let data = json.data(using: .utf8),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return ["input": json]
        }
        return dict.mapValues { String(describing: $0) }
    }
}
#endif

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
