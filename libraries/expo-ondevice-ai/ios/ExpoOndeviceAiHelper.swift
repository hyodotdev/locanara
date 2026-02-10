import Locanara

/// Decodes JS options dictionaries into chain constructor parameters
@available(iOS 15.0, macOS 14.0, *)
enum ExpoOndeviceAiHelper {

    // MARK: - Summarize

    static func bulletCount(from options: [String: Any]?) -> Int {
        guard let opts = options else { return 1 }
        if let outputType = opts["outputType"] as? String {
            switch outputType {
            case "TWO_BULLETS": return 2
            case "THREE_BULLETS": return 3
            default: return 1
            }
        }
        return 1
    }

    // MARK: - Classify

    static func classifyOptions(from options: [String: Any]?) -> (categories: [String], maxResults: Int) {
        guard let opts = options else {
            return (["positive", "negative", "neutral"], 3)
        }
        let categories = (opts["categories"] as? [String]) ?? ["positive", "negative", "neutral"]
        let maxResults = (opts["maxResults"] as? Int) ?? 3
        return (categories, maxResults)
    }

    // MARK: - Extract

    static func entityTypes(from options: [String: Any]?) -> [String] {
        (options?["entityTypes"] as? [String]) ?? ["person", "location", "date", "organization"]
    }

    // MARK: - Chat

    static func chatOptions(from options: [String: Any]?) -> (systemPrompt: String, memory: (any Memory)?) {
        let systemPrompt = (options?["systemPrompt"] as? String) ?? "You are a friendly, helpful assistant."

        var memory: (any Memory)? = nil
        if let historyArray = options?["history"] as? [[String: String]], !historyArray.isEmpty {
            memory = PrefilledMemory(history: historyArray)
        }

        return (systemPrompt, memory)
    }

    // MARK: - Translate

    static func translateOptions(from options: [String: Any]?) -> (sourceLanguage: String, targetLanguage: String) {
        let source = (options?["sourceLanguage"] as? String) ?? "en"
        let target = (options?["targetLanguage"] as? String) ?? "en"
        return (source, target)
    }

    // MARK: - Rewrite

    static func rewriteStyle(from options: [String: Any]?) -> RewriteOutputType {
        guard let opts = options,
              let outputTypeStr = opts["outputType"] as? String,
              let outputType = RewriteOutputType(rawValue: outputTypeStr) else {
            return .rephrase
        }
        return outputType
    }
}

// MARK: - Prefilled Memory

/// Memory adapter that provides pre-filled chat history from JS.
@available(iOS 15.0, macOS 14.0, *)
final class PrefilledMemory: Memory, @unchecked Sendable {
    private let entries: [MemoryEntry]

    init(history: [[String: String]]) {
        self.entries = history.compactMap { msg in
            guard let role = msg["role"], let content = msg["content"] else { return nil }
            return MemoryEntry(role: role, content: content)
        }
    }

    func load(for input: ChainInput) async -> [MemoryEntry] { entries }
    func save(input: ChainInput, output: ChainOutput) async { }
    func clear() async { }

    var estimatedTokenCount: Int {
        entries.reduce(0) { $0 + ($1.content.count / 4) }
    }
}
