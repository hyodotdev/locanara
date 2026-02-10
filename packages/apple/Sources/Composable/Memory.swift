import Foundation

// MARK: - Memory Entry

/// A single entry in conversation memory
public struct MemoryEntry: Sendable {
    public let role: String   // "user", "assistant", or "system"
    public let content: String
    public let timestamp: Double

    public init(role: String, content: String, timestamp: Double = Date().timeIntervalSince1970) {
        self.role = role
        self.content = content
        self.timestamp = timestamp
    }
}

// MARK: - Memory Protocol

/// Protocol for conversation/context memory management.
///
/// Designed for on-device models with small context windows (~4000 tokens).
@available(iOS 15.0, macOS 14.0, *)
public protocol Memory: Sendable {
    /// Load relevant memory for the given input
    func load(for input: ChainInput) async -> [MemoryEntry]

    /// Save a new input/output pair to memory
    func save(input: ChainInput, output: ChainOutput) async

    /// Clear all stored memory
    func clear() async

    /// Current estimated token count for stored context
    var estimatedTokenCount: Int { get }
}

// MARK: - Buffer Memory

/// Buffer memory that keeps the last N conversation turns.
///
/// ```swift
/// let memory = BufferMemory(maxEntries: 10, maxTokens: 2000)
/// await memory.save(input: input, output: output)
/// let entries = await memory.load(for: nextInput)
/// ```
@available(iOS 15.0, macOS 14.0, *)
public final class BufferMemory: Memory, @unchecked Sendable {
    private var entries: [MemoryEntry] = []
    private let maxEntries: Int
    private let maxTokens: Int

    /// - Parameters:
    ///   - maxEntries: Maximum conversation turns to retain
    ///   - maxTokens: Maximum estimated tokens to keep (~half the context window)
    public init(maxEntries: Int = 10, maxTokens: Int = 2000) {
        self.maxEntries = maxEntries
        self.maxTokens = maxTokens
    }

    public func load(for input: ChainInput) async -> [MemoryEntry] {
        return entries
    }

    public func save(input: ChainInput, output: ChainOutput) async {
        entries.append(MemoryEntry(role: "user", content: input.text))
        entries.append(MemoryEntry(role: "assistant", content: output.text))

        // Trim to stay within limits
        while entries.count > maxEntries * 2 {
            entries.removeFirst()
        }
        while estimatedTokenCount > maxTokens && entries.count > 2 {
            entries.removeFirst()
        }
    }

    public func clear() async {
        entries.removeAll()
    }

    public var estimatedTokenCount: Int {
        // Rough estimate: 1 token ~= 4 characters for English
        entries.reduce(0) { $0 + ($1.content.count / 4) }
    }
}

// MARK: - Summary Memory

/// Summary memory that compresses older messages into a summary.
/// Ideal for long conversations on models with small context windows.
///
/// Keeps the most recent turns in full detail and summarizes older ones
/// to maximize the use of limited context space.
@available(iOS 15.0, macOS 14.0, *)
public final class SummaryMemory: Memory, @unchecked Sendable {
    private let model: any LocanaraModel
    private var recentEntries: [MemoryEntry] = []
    private var summary: String = ""
    private let recentWindowSize: Int

    public init(model: (any LocanaraModel)? = nil, recentWindowSize: Int = 4) {
        self.model = model ?? LocanaraDefaults.model
        self.recentWindowSize = recentWindowSize
    }

    public func load(for input: ChainInput) async -> [MemoryEntry] {
        var result: [MemoryEntry] = []
        if !summary.isEmpty {
            result.append(MemoryEntry(
                role: "system",
                content: "Previous conversation summary: \(summary)",
                timestamp: 0
            ))
        }
        result.append(contentsOf: recentEntries)
        return result
    }

    public func save(input: ChainInput, output: ChainOutput) async {
        recentEntries.append(MemoryEntry(role: "user", content: input.text))
        recentEntries.append(MemoryEntry(role: "assistant", content: output.text))

        // When recent window is full, compress oldest entries into summary
        if recentEntries.count > recentWindowSize * 2 {
            let toSummarize = Array(recentEntries.prefix(2))
            recentEntries.removeFirst(2)

            let conversationText = toSummarize
                .map { "\($0.role): \($0.content)" }
                .joined(separator: "\n")
            let currentSummary = summary.isEmpty ? "" : "Existing summary: \(summary)\n\n"

            let prompt = """
            \(currentSummary)Summarize this conversation exchange in one concise sentence:
            \(conversationText)
            """

            if let response = try? await model.generate(prompt: prompt, config: .structured) {
                summary = response.text
            }
        }
    }

    public func clear() async {
        recentEntries.removeAll()
        summary = ""
    }

    public var estimatedTokenCount: Int {
        let summaryTokens = summary.count / 4
        let recentTokens = recentEntries.reduce(0) { $0 + ($1.content.count / 4) }
        return summaryTokens + recentTokens
    }
}
