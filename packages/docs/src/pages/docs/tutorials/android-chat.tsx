import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";

function AndroidChatTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Android Chat Tutorial"
        description="Advanced guide for building conversational AI with Gemini Nano - system prompts, history management, and optimization."
        path="/docs/tutorials/android-chat"
        keywords="Android chat, Gemini Nano, Kotlin, chat history, context management, Locanara"
      />
      <h1>Android: Chat Advanced Guide</h1>
      <p>
        Learn the core patterns for building conversational AI with Gemini Nano
        (AICore). This guide covers system prompt design, chat history
        management, and memory optimization strategies for long conversations.
      </p>

      <div className="alert-card alert-card--warning">
        <p>
          <strong>Note:</strong> Chat functionality on Android uses AICore,
          which may have varying availability depending on device and region.
        </p>
      </div>

      <section>
        <h2>System Prompt Design</h2>
        <p>
          System prompts define the AI&apos;s role and behavior rules. A
          structured prompt ensures consistent response quality.
        </p>

        <h3>Basic Structure</h3>
        <CodeBlock language="kotlin">{`val systemPrompt = """
    |You are a customer support assistant for [Company].
    |
    |## Your Role
    |- Answer questions about products and services
    |- Help troubleshoot common issues
    |- Escalate complex issues to human agents
    |
    |## Guidelines
    |- Be concise and direct
    |- Always verify before providing account-specific information
    |- Never make promises about refunds or compensation
    |
    |## Tone
    |- Professional but friendly
    |- Use simple language, avoid jargon
""".trimMargin()

val input = ExecuteFeatureInput(
    feature = FeatureType.CHAT,
    input = userMessage,
    parameters = FeatureParametersInput(
        chat = ChatParametersInput(
            systemPrompt = systemPrompt,
            temperature = 0.3f  // Low temperature for consistency
        )
    )
)`}</CodeBlock>

        <h3>Dynamic Context Injection</h3>
        <CodeBlock language="kotlin">{`fun buildSystemPrompt(user: User, context: AppContext): String {
    return """
        |You are assisting \${user.name}.
        |
        |## User Context
        |- Account type: \${user.accountType}
        |- Language preference: \${user.preferredLanguage}
        |- Current screen: \${context.currentScreen}
        |
        |## Available Actions
        |\${context.availableActions.joinToString("\\n") { "- \$it" }}
        |
        |Respond in \${user.preferredLanguage}.
    """.trimMargin()
}`}</CodeBlock>
      </section>

      <section>
        <h2>Chat History Management</h2>
        <p>
          To maintain context in multi-turn conversations, you need to pass
          previous conversation history along with each request.
        </p>

        <h3>History Class</h3>
        <CodeBlock language="kotlin">{`data class ChatMessage(
    val role: ChatRole,
    val content: String,
    val tokenEstimate: Int = content.length / 4  // Rough token estimate
)

class ChatHistory {
    private val messages = mutableListOf<ChatMessage>()

    val totalTokens: Int
        get() = messages.sumOf { it.tokenEstimate }

    fun append(role: ChatRole, content: String) {
        messages.add(ChatMessage(role, content))
    }

    fun formatForPrompt(): String {
        return messages.joinToString("\\n\\n") { msg ->
            val prefix = if (msg.role == ChatRole.USER) "User" else "Assistant"
            "\$prefix: \${msg.content}"
        }
    }

    fun buildInput(newMessage: String): String {
        val history = formatForPrompt()
        return if (history.isEmpty()) {
            newMessage
        } else {
            """
            |Previous conversation:
            |\$history
            |
            |User: \$newMessage
            """.trimMargin()
        }
    }

    fun clear() {
        messages.clear()
    }
}`}</CodeBlock>

        <h3>ViewModel Integration</h3>
        <CodeBlock language="kotlin">{`class ChatViewModel : ViewModel() {
    private val locanara = Locanara.getInstance()
    private val history = ChatHistory()
    private var systemPrompt = "You are a helpful assistant."

    private val _response = MutableStateFlow<String?>(null)
    val response: StateFlow<String?> = _response

    fun setSystemPrompt(prompt: String) {
        systemPrompt = prompt
    }

    fun sendMessage(message: String) {
        viewModelScope.launch {
            try {
                val fullInput = history.buildInput(message)

                val input = ExecuteFeatureInput(
                    feature = FeatureType.CHAT,
                    input = fullInput,
                    parameters = FeatureParametersInput(
                        chat = ChatParametersInput(
                            systemPrompt = systemPrompt,
                            temperature = 0.7f
                        )
                    )
                )

                val result = locanara.executeFeature(input)
                val responseText = result.result?.chat?.response ?: return@launch

                // Update history
                history.append(ChatRole.USER, message)
                history.append(ChatRole.ASSISTANT, responseText)

                _response.value = responseText

            } catch (e: Exception) {
                _response.value = "Error: \${e.message}"
            }
        }
    }

    fun resetChat() {
        history.clear()
        _response.value = null
    }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Context Window Management</h2>
        <p>
          As conversations grow longer, you&apos;ll hit context window limits.
          Efficient pruning strategies are essential.
        </p>

        <h3>Token-Based Pruning</h3>
        <CodeBlock language="kotlin">{`class ChatHistory {
    private val messages = mutableListOf<ChatMessage>()
    private val maxTokens = 4000  // Context window limit
    private val reservedTokens = 500  // Reserved for system prompt

    fun append(role: ChatRole, content: String) {
        messages.add(ChatMessage(role, content))
        pruneIfNeeded()
    }

    private fun pruneIfNeeded() {
        val targetTokens = maxTokens - reservedTokens

        // Remove oldest messages when exceeding token limit
        while (totalTokens > targetTokens && messages.size > 2) {
            messages.removeAt(0)
        }
    }

    /**
     * Smart pruning: Preserves important context
     * - First 2 messages (initial context)
     * - Last 4 messages (recent conversation)
     * - Middle is replaced with summary
     */
    suspend fun smartPrune(summarizer: suspend (String) -> String) {
        if (messages.size <= 6) return

        val first = messages.take(2)
        val last = messages.takeLast(4)
        val middle = messages.drop(2).dropLast(4)

        // Summarize middle portion
        val middleText = middle.joinToString("\\n") { it.content }
        val summary = summarizer(middleText)

        messages.clear()
        messages.addAll(first)
        messages.add(ChatMessage(ChatRole.ASSISTANT, "[Earlier: \$summary]"))
        messages.addAll(last)
    }
}`}</CodeBlock>

        <h3>Sliding Window Approach</h3>
        <CodeBlock language="kotlin">{`class SlidingWindowHistory(
    private val maxMessages: Int = 20
) {
    private val messages = mutableListOf<ChatMessage>()

    fun append(message: ChatMessage) {
        messages.add(message)

        if (messages.size > maxMessages) {
            // FIFO: Remove oldest
            messages.removeAt(0)
        }
    }

    fun getRecent(count: Int): List<ChatMessage> {
        return messages.takeLast(count)
    }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Error Handling and Retry</h2>
        <CodeBlock language="kotlin">{`sealed class ChatError : Exception() {
    object ContextTooLong : ChatError()
    object ModelUnavailable : ChatError()
    object Timeout : ChatError()
    data class Unknown(override val cause: Throwable) : ChatError()
}

suspend fun sendWithRetry(
    message: String,
    maxRetries: Int = 3
): String {
    var lastError: Exception? = null

    repeat(maxRetries) { attempt ->
        try {
            return sendMessage(message)
        } catch (e: LocanaraException) {
            lastError = e

            when (e) {
                is LocanaraException.ContextLengthExceeded -> {
                    // Prune and retry on context overflow
                    history.pruneIfNeeded()
                }
                is LocanaraException.ModelNotAvailable -> {
                    // Model unavailable - no point retrying
                    throw ChatError.ModelUnavailable
                }
                is LocanaraException.Timeout -> {
                    // Timeout - wait and retry
                    delay((attempt + 1) * 1000L)
                }
                else -> throw ChatError.Unknown(e)
            }
        }
    }

    throw ChatError.Unknown(lastError ?: Exception("Unknown error"))
}`}</CodeBlock>
      </section>

      <section>
        <h2>Coroutine-Based Streaming</h2>
        <CodeBlock language="kotlin">{`fun sendMessageStreaming(message: String): Flow<String> = flow {
    val fullInput = history.buildInput(message)
    val fullResponse = StringBuilder()

    locanara.chatStreaming(
        input = fullInput,
        systemPrompt = systemPrompt
    ).collect { chunk ->
        fullResponse.append(chunk)
        emit(chunk)
    }

    // Update history after completion
    history.append(ChatRole.USER, message)
    history.append(ChatRole.ASSISTANT, fullResponse.toString())
}

// Usage
viewModelScope.launch {
    sendMessageStreaming("Explain quantum computing")
        .collect { chunk ->
            _currentResponse.value += chunk
        }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Best Practices</h2>
        <ul>
          <li>
            <strong>Temperature tuning</strong>: Use 0.1-0.3 for factual
            answers, 0.7-0.9 for creative responses
          </li>
          <li>
            <strong>History management</strong>: Don&apos;t send
            everything—include only relevant recent conversation
          </li>
          <li>
            <strong>System prompt</strong>: Keep under 500 tokens to leave room
            for actual conversation
          </li>
          <li>
            <strong>Coroutine scope</strong>: Use viewModelScope for automatic
            lifecycle management
          </li>
          <li>
            <strong>Error recovery</strong>: Auto-prune and retry on context
            overflow for seamless UX
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{
          to: "/docs/tutorials/android-summarize",
          label: "Android Summarize",
        }}
        next={{
          to: "/docs/tutorials/android-rewrite",
          label: "Android Rewrite",
        }}
      />
    </div>
  );
}

export default AndroidChatTutorial;
