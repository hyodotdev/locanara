import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";

function IOSChatTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="iOS Chat Tutorial"
        description="Advanced guide for building conversational AI with Apple Intelligence - system prompts, history management, and optimization."
        path="/docs/tutorials/ios-chat"
        keywords="iOS chat, Apple Intelligence, SwiftUI, chat history, context management, Locanara"
      />
      <h1>iOS: Chat Advanced Guide</h1>
      <p>
        Learn the core patterns for building conversational AI with Apple
        Intelligence. This guide covers system prompt design, chat history
        management, and memory optimization strategies for long conversations.
      </p>

      <section>
        <h2>System Prompt Design</h2>
        <p>
          System prompts define the AI&apos;s personality and behavior rules. A
          well-designed system prompt ensures consistent response quality.
        </p>

        <h3>Basic Structure</h3>
        <CodeBlock language="swift">{`let systemPrompt = """
You are a customer support assistant for [Company].

## Your Role
- Answer questions about products and services
- Help troubleshoot common issues
- Escalate complex issues to human agents

## Guidelines
- Be concise and direct
- Always verify before providing account-specific information
- Never make promises about refunds or compensation

## Tone
- Professional but friendly
- Use simple language, avoid jargon
"""

let input = ExecuteFeatureInput(
    feature: .chat,
    input: userMessage,
    parameters: FeatureParametersInput(
        chat: ChatParametersInput(
            systemPrompt: systemPrompt,
            temperature: 0.3  // Low temperature for consistency
        )
    )
)`}</CodeBlock>

        <h3>Dynamic Context Injection</h3>
        <p>
          You can dynamically inject user information or current state into the
          system prompt.
        </p>
        <CodeBlock language="swift">{`func buildSystemPrompt(user: User, context: AppContext) -> String {
    return """
    You are assisting \\(user.name).

    ## User Context
    - Account type: \\(user.accountType.rawValue)
    - Language preference: \\(user.preferredLanguage)
    - Current screen: \\(context.currentScreen)

    ## Available Actions
    \\(context.availableActions.map { "- \\($0)" }.joined(separator: "\\n"))

    Respond in \\(user.preferredLanguage).
    """
}`}</CodeBlock>
      </section>

      <section>
        <h2>Chat History Management</h2>
        <p>
          To maintain context in multi-turn conversations, you need to pass
          previous conversation history along with each request.
        </p>

        <h3>History Format</h3>
        <CodeBlock language="swift">{`struct ChatHistory {
    private var messages: [(role: ChatRole, content: String)] = []

    mutating func append(role: ChatRole, content: String) {
        messages.append((role, content))
    }

    /// Convert history to prompt format
    func formatForPrompt() -> String {
        return messages.map { msg in
            let prefix = msg.role == .user ? "User" : "Assistant"
            return "\\(prefix): \\(msg.content)"
        }.joined(separator: "\\n\\n")
    }

    /// Build input combining history with new message
    func buildInput(newMessage: String) -> String {
        let history = formatForPrompt()
        if history.isEmpty {
            return newMessage
        }
        return """
        Previous conversation:
        \\(history)

        User: \\(newMessage)
        """
    }
}`}</CodeBlock>

        <h3>Usage Example</h3>
        <CodeBlock language="swift">{`class ChatViewModel: ObservableObject {
    private var history = ChatHistory()

    func sendMessage(_ message: String) async throws -> String {
        // Build input with history
        let fullInput = history.buildInput(newMessage: message)

        let input = ExecuteFeatureInput(
            feature: .chat,
            input: fullInput,
            parameters: FeatureParametersInput(
                chat: ChatParametersInput(
                    systemPrompt: systemPrompt,
                    temperature: 0.7
                )
            )
        )

        let result = try await LocanaraClient.shared.executeFeature(input)

        guard case .chat(let chatResult) = result.result else {
            throw LocanaraError.unexpectedResult
        }

        // Update history
        history.append(role: .user, content: message)
        history.append(role: .assistant, content: chatResult.response)

        return chatResult.response
    }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Context Window Management</h2>
        <p>
          As conversations grow longer, you&apos;ll hit context window limits.
          Efficient management strategies are essential.
        </p>

        <h3>Token Estimation and Pruning</h3>
        <CodeBlock language="swift">{`struct ChatHistory {
    private var messages: [(role: ChatRole, content: String, tokenEstimate: Int)] = []

    /// Rough token estimation (~4 chars per token for English)
    private func estimateTokens(_ text: String) -> Int {
        return text.count / 4
    }

    /// Total token count
    var totalTokens: Int {
        messages.reduce(0) { $0 + $1.tokenEstimate }
    }

    mutating func append(role: ChatRole, content: String) {
        let tokens = estimateTokens(content)
        messages.append((role, content, tokens))
    }

    /// Remove old messages to fit within context window
    mutating func pruneToFit(maxTokens: Int) {
        // Reserve space for system prompt
        let targetTokens = maxTokens - 500

        while totalTokens > targetTokens && messages.count > 2 {
            // Remove oldest messages first (keep last 2)
            messages.removeFirst()
        }
    }

    /// Smart pruning that preserves important context
    mutating func smartPrune(maxTokens: Int) {
        let targetTokens = maxTokens - 500

        guard totalTokens > targetTokens else { return }

        // Strategy: Replace middle messages with summary
        // Keep first 2 + last 4 messages
        if messages.count > 6 {
            let first = Array(messages.prefix(2))
            let last = Array(messages.suffix(4))
            let middle = Array(messages.dropFirst(2).dropLast(4))

            // Generate summary of middle portion
            let middleSummary = "[Previous conversation about: " +
                extractTopics(from: middle).joined(separator: ", ") + "]"

            messages = first + [(role: .assistant, content: middleSummary, tokenEstimate: estimateTokens(middleSummary))] + last
        }
    }

    private func extractTopics(from msgs: [(role: ChatRole, content: String, tokenEstimate: Int)]) -> [String] {
        // Simple keyword extraction or separate summarize call
        // In practice, use AI to generate summary
        return ["earlier discussion"]
    }
}`}</CodeBlock>

        <h3>Sliding Window Approach</h3>
        <CodeBlock language="swift">{`struct SlidingWindowHistory {
    private var messages: [ChatMessage] = []
    private let maxMessages: Int

    init(maxMessages: Int = 20) {
        self.maxMessages = maxMessages
    }

    mutating func append(_ message: ChatMessage) {
        messages.append(message)

        // Remove oldest when exceeding max count
        if messages.count > maxMessages {
            messages.removeFirst(messages.count - maxMessages)
        }
    }

    /// Return only recent N messages
    func recentMessages(_ count: Int) -> [ChatMessage] {
        return Array(messages.suffix(count))
    }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Error Handling and Retry</h2>
        <CodeBlock language="swift">{`enum ChatError: Error {
    case contextTooLong
    case modelUnavailable
    case timeout
    case unknown(Error)
}

func sendWithRetry(
    _ message: String,
    maxRetries: Int = 3
) async throws -> String {
    var lastError: Error?

    for attempt in 1...maxRetries {
        do {
            return try await sendMessage(message)
        } catch let error as LocanaraError {
            lastError = error

            switch error {
            case .contextLengthExceeded:
                // Prune history and retry on context overflow
                history.pruneToFit(maxTokens: 4000)
                continue

            case .modelNotAvailable:
                // Model unavailable - no point retrying
                throw ChatError.modelUnavailable

            case .timeout:
                // Timeout - wait and retry
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
                continue

            default:
                throw ChatError.unknown(error)
            }
        }
    }

    throw ChatError.unknown(lastError ?? LocanaraError.unknown)
}`}</CodeBlock>
      </section>

      <section>
        <h2>Streaming Response Handling</h2>
        <p>
          For long responses, streaming improves user experience significantly.
        </p>
        <CodeBlock language="swift">{`func sendMessageStreaming(
    _ message: String,
    onChunk: @escaping (String) -> Void
) async throws -> String {
    let fullInput = history.buildInput(newMessage: message)

    var fullResponse = ""

    for try await chunk in LocanaraClient.shared.chatStreaming(
        input: fullInput,
        systemPrompt: systemPrompt
    ) {
        fullResponse += chunk
        onChunk(chunk)
    }

    // Update history after completion
    history.append(role: .user, content: message)
    history.append(role: .assistant, content: fullResponse)

    return fullResponse
}

// Usage
await sendMessageStreaming("Explain quantum computing") { chunk in
    DispatchQueue.main.async {
        self.currentResponse += chunk
    }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Best Practices</h2>
        <ul>
          <li>
            <strong>Temperature tuning</strong>: Use 0.1-0.3 for factual
            responses, 0.7-0.9 for creative outputs
          </li>
          <li>
            <strong>History management</strong>: Don&apos;t send
            everything—include only relevant recent conversation
          </li>
          <li>
            <strong>System prompt length</strong>: Keep under 500 tokens to
            leave room for actual conversation
          </li>
          <li>
            <strong>Error recovery</strong>: Auto-prune and retry on context
            overflow for seamless UX
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/ios-summarize", label: "iOS Summarize" }}
        next={{ to: "/docs/tutorials/ios-rewrite", label: "iOS Rewrite" }}
      />
    </div>
  );
}

export default IOSChatTutorial;
