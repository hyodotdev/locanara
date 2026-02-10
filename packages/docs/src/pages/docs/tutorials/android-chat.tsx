import CodeBlock from "../../../components/CodeBlock";
import PageNavigation from "../../../components/PageNavigation";
import SEO from "../../../components/SEO";

function AndroidChatTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Android Chat Tutorial"
        description="Advanced guide for building conversational AI with Gemini Nano - ChatChain, memory strategies, and streaming."
        path="/docs/tutorials/android-chat"
        keywords="Android chat, Gemini Nano, Kotlin, ChatChain, BufferMemory, SummaryMemory, Locanara"
      />
      <h1>Android: Chat Advanced Guide</h1>
      <p>
        Learn the core patterns for building conversational AI with Gemini Nano.
        This guide covers ChatChain with memory strategies, streaming, and
        session management.
      </p>

      <section>
        <h2>Basic Chat</h2>
        <p>
          ChatChain provides conversational AI with built-in memory support.
        </p>

        <CodeBlock language="kotlin">{`import com.locanara.builtin.ChatChain

// Simple one-shot chat
val result = ChatChain().run("What is Kotlin?")
println(result.message)`}</CodeBlock>
      </section>

      <section>
        <h2>System Prompt Design</h2>
        <p>
          System prompts define the AI&apos;s personality and behavior rules.
        </p>

        <h3>Basic Structure</h3>
        <CodeBlock language="kotlin">{`val chain = ChatChain(
    systemPrompt = """
        |You are a customer support assistant for [Company].
        |
        |## Your Role
        |- Answer questions about products and services
        |- Help troubleshoot common issues
        |
        |## Guidelines
        |- Be concise and direct
        |- Never make promises about refunds
    """.trimMargin()
)

val result = chain.run("How do I reset my password?")
println(result.message)`}</CodeBlock>

        <h3>Dynamic Context Injection</h3>
        <CodeBlock language="kotlin">{`fun buildSystemPrompt(user: User, context: AppContext): String {
    return """
        |You are assisting \${user.name}.
        |
        |## User Context
        |- Account type: \${user.accountType}
        |- Language: \${user.preferredLanguage}
        |- Current screen: \${context.currentScreen}
        |
        |Respond in \${user.preferredLanguage}.
    """.trimMargin()
}

val chain = ChatChain(
    systemPrompt = buildSystemPrompt(currentUser, appContext)
)`}</CodeBlock>
      </section>

      <section>
        <h2>Memory Strategies</h2>
        <p>
          Locanara provides two built-in memory strategies for multi-turn
          conversations. No manual history management needed.
        </p>

        <h3>BufferMemory (Last N Turns)</h3>
        <CodeBlock language="kotlin">{`import com.locanara.composable.BufferMemory

// BufferMemory keeps the last N conversation turns
val memory = BufferMemory(maxTurns = 10)
val chain = ChatChain(
    memory = memory,
    systemPrompt = "You are a helpful coding assistant."
)

// Multi-turn conversation — memory is managed automatically
val r1 = chain.run("What is Kotlin?")
println(r1.message)

val r2 = chain.run("How does it compare to Swift?")
println(r2.message)  // Remembers previous context

val r3 = chain.run("Show me an example")
println(r3.message)  // Remembers both previous turns`}</CodeBlock>

        <h3>SummaryMemory (Compressed History)</h3>
        <CodeBlock language="kotlin">{`import com.locanara.composable.SummaryMemory

// SummaryMemory compresses older conversation into a summary
// Great for very long conversations
val memory = SummaryMemory()
val chain = ChatChain(
    memory = memory,
    systemPrompt = "You are a helpful assistant."
)

// As conversation grows, older turns are automatically
// compressed into a summary to save context window space
val r1 = chain.run("Tell me about machine learning")
val r2 = chain.run("What about neural networks?")
val r3 = chain.run("How do transformers work?")
// Earlier context is summarized, recent turns kept in full`}</CodeBlock>
      </section>

      <section>
        <h2>Streaming Responses</h2>
        <p>
          For long responses, streaming improves user experience by showing
          tokens as they arrive.
        </p>
        <CodeBlock language="kotlin">{`val memory = BufferMemory()
val chain = ChatChain(
    memory = memory,
    systemPrompt = "You are a helpful assistant."
)

// Stream tokens as they arrive using Flow
chain.streamRun("Explain Jetpack Compose").collect { chunk ->
    print(chunk)  // Print tokens as they arrive
}

// Memory is updated automatically after stream completes`}</CodeBlock>
      </section>

      <section>
        <h2>Session (Stateful Conversations)</h2>
        <p>
          For more advanced conversation management with history tracking, use
          Session.
        </p>
        <CodeBlock language="kotlin">{`import com.locanara.runtime.Session

// Session wraps ChatChain with additional state management
val session = Session(
    systemPrompt = "You are a helpful assistant.",
    memory = BufferMemory(maxTurns = 20)
)

val r1 = session.send("What is Kotlin?")
println(r1.message)

// Access conversation history
println("Turn count: \${session.turnCount}")

// Reset conversation
session.reset()`}</CodeBlock>
      </section>

      <section>
        <h2>ViewModel Integration</h2>
        <CodeBlock language="kotlin">{`class ChatViewModel : ViewModel() {
    private val memory = BufferMemory(maxTurns = 20)
    private val chain = ChatChain(
        memory = memory,
        systemPrompt = "You are a helpful assistant."
    )

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages

    private val _currentResponse = MutableStateFlow("")
    val currentResponse: StateFlow<String> = _currentResponse

    fun sendMessage(message: String) {
        viewModelScope.launch {
            _messages.value += ChatMessage("user", message)
            _currentResponse.value = ""

            try {
                chain.streamRun(message).collect { chunk ->
                    _currentResponse.value += chunk
                }
                _messages.value += ChatMessage("assistant", _currentResponse.value)
            } catch (e: Exception) {
                _messages.value += ChatMessage("assistant", "Error: \${e.message}")
            }

            _currentResponse.value = ""
        }
    }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Best Practices</h2>
        <ul>
          <li>
            <strong>BufferMemory</strong> for short conversations (up to ~20
            turns)
          </li>
          <li>
            <strong>SummaryMemory</strong> for long conversations where context
            compression is needed
          </li>
          <li>
            <strong>System prompt</strong>: Keep under 500 tokens to leave room
            for conversation
          </li>
          <li>
            <strong>Streaming</strong>: Always use <code>streamRun()</code> for
            user-facing chat to improve perceived responsiveness
          </li>
          <li>
            <strong>Coroutine scope</strong>: Use viewModelScope for automatic
            lifecycle management
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
