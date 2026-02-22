import Locanara
import NitroModules

/// Decodes Nitro option structs into Locanara chain constructor parameters
@available(iOS 15.0, macOS 14.0, *)
enum OndeviceAiHelper {

    // MARK: - Summarize

    static func bulletCount(from options: NitroSummarizeOptions?) -> Int {
        guard let outputType = options?.outputType else { return 1 }
        switch outputType {
        case .twoBullets: return 2
        case .threeBullets: return 3
        default: return 1
        }
    }

    static func inputType(from options: NitroSummarizeOptions?) -> String {
        guard let inputType = options?.inputType else { return "text" }
        switch inputType {
        case .conversation: return "conversation"
        default: return "text"
        }
    }

    // MARK: - Classify

    static func classifyOptions(from options: NitroClassifyOptions?) -> (categories: [String], maxResults: Int) {
        let categories: [String]
        if case .second(let arr) = options?.categories {
            categories = arr
        } else {
            categories = ["positive", "negative", "neutral"]
        }
        let maxResults: Int
        if case .second(let v) = options?.maxResults {
            maxResults = Int(v)
        } else {
            maxResults = 3
        }
        return (categories, maxResults)
    }

    // MARK: - Extract

    static func entityTypes(from options: NitroExtractOptions?) -> [String] {
        if case .second(let arr) = options?.entityTypes {
            return arr
        }
        return ["person", "location", "date", "organization"]
    }

    // MARK: - Chat

    static func chatOptions(from options: NitroChatOptions?) -> (systemPrompt: String, memory: (any Memory)?) {
        let systemPrompt: String
        if case .second(let s) = options?.systemPrompt {
            systemPrompt = s
        } else {
            systemPrompt = "You are a friendly, helpful assistant."
        }

        var memory: (any Memory)? = nil
        if case .second(let history) = options?.history, !history.isEmpty {
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
        case .elaborate: return .elaborate
        case .emojify: return .emojify
        case .shorten: return .shorten
        case .friendly: return .friendly
        case .professional: return .professional
        case .rephrase: return .rephrase
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
            MemoryEntry(role: msg.role.stringValue, content: msg.content)
        }
    }

    func load(for input: ChainInput) async -> [MemoryEntry] { entries }
    func save(input: ChainInput, output: ChainOutput) async { }
    func clear() async { }

    var estimatedTokenCount: Int {
        entries.reduce(0) { $0 + ($1.content.count / 4) }
    }
}
