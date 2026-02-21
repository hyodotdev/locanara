import Locanara
import NitroModules

/// Decodes Nitro option structs into Locanara chain constructor parameters
@available(iOS 15.0, macOS 14.0, *)
enum OndeviceAiHelper {

    // MARK: - Summarize

    static func bulletCount(from options: NitroSummarizeOptions?) -> Int {
        guard let outputType = options?.outputType else { return 1 }
        switch outputType {
        case .TWO_BULLETS: return 2
        case .THREE_BULLETS: return 3
        default: return 1
        }
    }

    static func inputType(from options: NitroSummarizeOptions?) -> String {
        guard let inputType = options?.inputType else { return "text" }
        switch inputType {
        case .CONVERSATION: return "conversation"
        default: return "text"
        }
    }

    // MARK: - Classify

    static func classifyOptions(from options: NitroClassifyOptions?) -> (categories: [String], maxResults: Int) {
        let categories = options?.categories ?? ["positive", "negative", "neutral"]
        let maxResults = options?.maxResults.flatMap { Int(exactly: $0) } ?? 3
        return (categories, maxResults)
    }

    // MARK: - Extract

    static func entityTypes(from options: NitroExtractOptions?) -> [String] {
        options?.entityTypes ?? ["person", "location", "date", "organization"]
    }

    // MARK: - Chat

    static func chatOptions(from options: NitroChatOptions?) -> (systemPrompt: String, memory: (any Memory)?) {
        let systemPrompt = options?.systemPrompt ?? "You are a friendly, helpful assistant."

        var memory: (any Memory)? = nil
        if let history = options?.history, !history.isEmpty {
            memory = PrefilledMemory(history: history)
        }

        return (systemPrompt, memory)
    }

    // MARK: - Translate

    static func translateOptions(from options: NitroTranslateOptions) -> (sourceLanguage: String, targetLanguage: String) {
        (options.sourceLanguage, options.targetLanguage)
    }

    // MARK: - Rewrite

    static func rewriteStyle(from options: NitroRewriteOptions) -> RewriteOutputType {
        switch options.outputType {
        case .ELABORATE: return .elaborate
        case .EMOJIFY: return .emojify
        case .SHORTEN: return .shorten
        case .FRIENDLY: return .friendly
        case .PROFESSIONAL: return .professional
        case .REPHRASE: return .rephrase
        }
    }
}

// MARK: - Prefilled Memory

/// Memory adapter that provides pre-filled chat history from JS.
@available(iOS 15.0, macOS 14.0, *)
final class PrefilledMemory: Memory, @unchecked Sendable {
    private let entries: [MemoryEntry]

    init(history: [NitroChatMessage]) {
        self.entries = history.map { msg in
            MemoryEntry(role: msg.role.rawValue, content: msg.content)
        }
    }

    func load(for input: ChainInput) async -> [MemoryEntry] { entries }
    func save(input: ChainInput, output: ChainOutput) async { }
    func clear() async { }

    var estimatedTokenCount: Int {
        entries.reduce(0) { $0 + ($1.content.count / 4) }
    }
}
