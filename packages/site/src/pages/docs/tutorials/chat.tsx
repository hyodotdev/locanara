import CodeTabs from "../../../components/docs/CodeTabs";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";
import VideoPlaceholder from "../../../components/docs/VideoPlaceholder";

function ChatTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Chat Tutorial"
        description="Learn how to build conversational AI with memory strategies, streaming, and session management using Locanara SDK."
        path="/docs/tutorials/chat"
        keywords="chat, conversational AI, ChatChain, BufferMemory, SummaryMemory, Locanara"
      />
      <h1>Chat</h1>
      <p>
        Build conversational AI with built-in memory management, streaming
        responses, and session state. ChatChain handles context windows
        automatically.
      </p>

      <section>
        <h2>1. Basic Chat</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `import Locanara

let result = try await ChatChain().run("What is Swift?")
print(result.message)`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `import com.locanara.builtin.ChatChain

val result = ChatChain().run("What is Kotlin?")
println(result.message)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

const result = await chat('What is React Native?')
console.log(result.message)`,
            },
          ]}
        />

        <VideoPlaceholder
          src="/features/chat_1.mp4"
          caption="Chat UI — user message sent, assistant response streamed into conversation view"
        />
      </section>

      <section>
        <h2>2. System Prompt</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let chain = ChatChain(
    systemPrompt: """
    You are a customer support assistant for [Company].

    ## Guidelines
    - Be concise and direct
    - Never make promises about refunds
    """
)

let result = try await chain.run("How do I reset my password?")`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val chain = ChatChain(
    systemPrompt = """
        |You are a customer support assistant for [Company].
        |
        |## Guidelines
        |- Be concise and direct
        |- Never make promises about refunds
    """.trimMargin()
)

val result = chain.run("How do I reset my password?")`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

const result = await chat('How do I reset my password?', {
  systemPrompt: \`You are a customer support assistant for [Company].

## Guidelines
- Be concise and direct
- Never make promises about refunds\`
})`,
            },
          ]}
        />
      </section>

      <section>
        <h2>3. Memory Strategies</h2>
        <p>
          Two built-in memory strategies for multi-turn conversations. No manual
          history management needed.
        </p>

        <h3>BufferMemory (Last N Turns)</h3>
        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let memory = BufferMemory(maxEntries: 10)
let chain = ChatChain(
    memory: memory,
    systemPrompt: "You are a helpful coding assistant."
)

let r1 = try await chain.run("What is Swift?")
let r2 = try await chain.run("How does it compare to Kotlin?")
print(r2.message)  // Remembers previous context`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val memory = BufferMemory(maxEntries = 10)
val chain = ChatChain(
    memory = memory,
    systemPrompt = "You are a helpful coding assistant."
)

val r1 = chain.run("What is Kotlin?")
val r2 = chain.run("How does it compare to Swift?")
println(r2.message)  // Remembers previous context`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

// Manage history manually
const history = []
const systemPrompt = 'You are a helpful coding assistant.'

const r1 = await chat('What is TypeScript?', { systemPrompt, history })
history.push({ role: 'user', content: 'What is TypeScript?' })
history.push({ role: 'assistant', content: r1.message })

const r2 = await chat('How does it compare to JavaScript?', { systemPrompt, history })
console.log(r2.message)  // Remembers previous context`,
            },
          ]}
        />

        <h3>SummaryMemory (Compressed History)</h3>
        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `// Compresses older turns to save context window space
let memory = SummaryMemory()
let chain = ChatChain(memory: memory, systemPrompt: "You are a helpful assistant.")

let r1 = try await chain.run("Tell me about machine learning")
let r2 = try await chain.run("What about neural networks?")
let r3 = try await chain.run("How do transformers work?")
// Earlier context is summarized, recent turns kept in full`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `// Compresses older turns to save context window space
val memory = SummaryMemory()
val chain = ChatChain(memory = memory, systemPrompt = "You are a helpful assistant.")

val r1 = chain.run("Tell me about machine learning")
val r2 = chain.run("What about neural networks?")
val r3 = chain.run("How do transformers work?")
// Earlier context is summarized, recent turns kept in full`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat, summarize } from 'expo-ondevice-ai'

// Manage history with manual summarization for long conversations
const history = []
const systemPrompt = 'You are a helpful assistant.'

const r1 = await chat('Tell me about machine learning', { systemPrompt, history })
history.push({ role: 'user', content: 'Tell me about machine learning' })
history.push({ role: 'assistant', content: r1.message })

// When history gets long, summarize older turns
if (history.length > 10) {
  const oldContext = history.slice(0, -4).map(m => m.content).join('\\n')
  const summary = await summarize(oldContext)
  history.splice(0, history.length - 4, { role: 'system', content: summary.summary })
}`,
            },
          ]}
        />
      </section>

      <section>
        <h2>4. Streaming</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let chain = ChatChain(
    memory: BufferMemory(),
    systemPrompt: "You are a helpful assistant."
)

for try await chunk in chain.streamRun("Explain SwiftUI") {
    print(chunk, terminator: "")
}
// Memory is updated automatically after stream completes`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val chain = ChatChain(
    memory = BufferMemory(),
    systemPrompt = "You are a helpful assistant."
)

chain.streamRun("Explain Jetpack Compose").collect { chunk ->
    print(chunk)
}
// Memory is updated automatically after stream completes`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chatStream } from 'expo-ondevice-ai'

const result = await chatStream('Explain React Native', {
  systemPrompt: 'You are a helpful assistant.',
  onChunk: (chunk) => {
    process.stdout.write(chunk.delta)
  }
})
console.log('\\nFull response:', result.message)`,
            },
          ]}
        />
      </section>

      <section>
        <h2>5. Session (Stateful)</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `let session = Session(
    memory: BufferMemory(maxEntries: 20)
)

let r1 = try await session.send("What is Swift?")
print(r1)

// Continue conversation (memory tracks turns automatically)
let r2 = try await session.send("How does it compare to Kotlin?")
print(r2)

await session.reset()`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `val session = Session(
    memory = BufferMemory(maxEntries = 20)
)

val r1 = session.send("What is Kotlin?")
println(r1)

// Continue conversation (memory tracks turns automatically)
val r2 = session.send("How does it compare to Swift?")
println(r2)

session.reset()`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { chat } from 'expo-ondevice-ai'

// Manage session state with conversationId
const r1 = await chat('What is TypeScript?', {
  systemPrompt: 'You are a helpful assistant.',
  conversationId: 'session-1'
})
console.log(r1.message)
console.log('Can continue:', r1.canContinue)

// Continue same conversation
const r2 = await chat('Tell me more', {
  conversationId: r1.conversationId
})`,
            },
          ]}
        />
      </section>

      <section>
        <h2>6. UI Integration</h2>

        <CodeTabs
          tabs={[
            {
              label: "Swift",
              language: "swift",
              code: `@Observable
class ChatViewModel {
    private let chain: ChatChain
    var messages: [(role: String, content: String)] = []
    var currentResponse = ""
    var isStreaming = false

    init() {
        self.chain = ChatChain(
            memory: BufferMemory(maxEntries: 20),
            systemPrompt: "You are a helpful assistant."
        )
    }

    func send(_ message: String) async {
        messages.append((role: "user", content: message))
        isStreaming = true
        currentResponse = ""

        do {
            for try await chunk in chain.streamRun(message) {
                currentResponse += chunk
            }
            messages.append((role: "assistant", content: currentResponse))
        } catch {
            messages.append((role: "assistant", content: "Error: \\(error.localizedDescription)"))
        }

        currentResponse = ""
        isStreaming = false
    }
}`,
            },
            {
              label: "Kotlin",
              language: "kotlin",
              code: `class ChatViewModel : ViewModel() {
    private val chain = ChatChain(
        memory = BufferMemory(maxEntries = 20),
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
}`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { useState, useCallback } from 'react'
import { chatStream, ChatMessage } from 'expo-ondevice-ai'

function useChat(systemPrompt: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const history: ChatMessage[] = []

  const send = useCallback(async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setIsStreaming(true)
    setCurrentResponse('')

    try {
      const result = await chatStream(message, {
        systemPrompt,
        history,
        onChunk: (chunk) => setCurrentResponse(chunk.accumulated)
      })
      setMessages(prev => [...prev, { role: 'assistant', content: result.message }])
      history.push({ role: 'user', content: message })
      history.push({ role: 'assistant', content: result.message })
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: \`Error: \${e}\` }])
    }
    setCurrentResponse('')
    setIsStreaming(false)
  }, [])

  return { messages, currentResponse, isStreaming, send }
}`,
            },
          ]}
        />
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
            user-facing chat
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/extract", label: "Extract" }}
        next={{ to: "/docs/tutorials/translate", label: "Translate" }}
      />
    </div>
  );
}

export default ChatTutorial;
