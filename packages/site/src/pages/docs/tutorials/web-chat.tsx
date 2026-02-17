import CodeBlock from "../../../components/docs/CodeBlock";
import PageNavigation from "../../../components/docs/PageNavigation";
import { SEO } from "../../../components/SEO";

function WebChatTutorial() {
  return (
    <div className="doc-page">
      <SEO
        title="Web Chat Tutorial"
        description="Advanced guide for building conversational AI with Chrome Built-in AI - system prompts, history management, and optimization."
        path="/docs/tutorials/web-chat"
        keywords="Web chat, Chrome Built-in AI, TypeScript, chat history, context management, Locanara"
      />
      <h1>Web: Chat Advanced Guide</h1>
      <p>
        Learn the core patterns for building conversational AI with Chrome
        Built-in AI. This guide covers system prompt design, chat history
        management, and memory optimization strategies for long conversations.
      </p>

      <section>
        <h2>System Prompt Design</h2>
        <p>
          System prompts define the AI&apos;s personality and behavior rules. A
          well-designed system prompt ensures consistent response quality.
        </p>

        <h3>Basic Structure</h3>
        <CodeBlock language="typescript">{`import { Locanara } from '@locanara/web';

const locanara = Locanara.getInstance();

const systemPrompt = \`
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
\`;

const response = await locanara.chat(userMessage, {
  systemPrompt,
  temperature: 0.3,  // Low temperature for consistency
});`}</CodeBlock>

        <h3>Dynamic Context Injection</h3>
        <CodeBlock language="typescript">{`interface User {
  name: string;
  accountType: string;
  preferredLanguage: string;
}

interface AppContext {
  currentScreen: string;
  availableActions: string[];
}

function buildSystemPrompt(user: User, context: AppContext): string {
  return \`
You are assisting \${user.name}.

## User Context
- Account type: \${user.accountType}
- Language preference: \${user.preferredLanguage}
- Current screen: \${context.currentScreen}

## Available Actions
\${context.availableActions.map(a => \`- \${a}\`).join('\\n')}

Respond in \${user.preferredLanguage}.
\`;
}`}</CodeBlock>
      </section>

      <section>
        <h2>Chat History Management</h2>
        <p>
          Chrome Built-in AI maintains session context automatically within a
          single session. For cross-session persistence or manual control,
          manage history yourself.
        </p>

        <h3>History Manager</h3>
        <CodeBlock language="typescript">{`interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  tokenEstimate: number;
}

class ChatHistory {
  private messages: ChatMessage[] = [];

  get totalTokens(): number {
    return this.messages.reduce((sum, m) => sum + m.tokenEstimate, 0);
  }

  // Rough token estimation (~4 chars per token for English)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  append(role: 'user' | 'assistant', content: string): void {
    this.messages.push({
      role,
      content,
      tokenEstimate: this.estimateTokens(content),
    });
  }

  formatForPrompt(): string {
    return this.messages
      .map(m => \`\${m.role === 'user' ? 'User' : 'Assistant'}: \${m.content}\`)
      .join('\\n\\n');
  }

  buildInput(newMessage: string): string {
    const history = this.formatForPrompt();
    if (!history) return newMessage;

    return \`Previous conversation:
\${history}

User: \${newMessage}\`;
  }

  clear(): void {
    this.messages = [];
  }
}`}</CodeBlock>

        <h3>Integration with Locanara</h3>
        <CodeBlock language="typescript">{`class ChatManager {
  private locanara = Locanara.getInstance();
  private history = new ChatHistory();
  private systemPrompt = 'You are a helpful assistant.';

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  async sendMessage(message: string): Promise<string> {
    const fullInput = this.history.buildInput(message);

    const result = await this.locanara.chat(fullInput, {
      systemPrompt: this.systemPrompt,
      temperature: 0.7,
    });

    // Update history
    this.history.append('user', message);
    this.history.append('assistant', result.response);

    return result.response;
  }

  async sendMessageStreaming(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const fullInput = this.history.buildInput(message);
    let fullResponse = '';

    for await (const chunk of this.locanara.chatStreaming(fullInput)) {
      fullResponse += chunk;
      onChunk(chunk);
    }

    // Update history after completion
    this.history.append('user', message);
    this.history.append('assistant', fullResponse);

    return fullResponse;
  }

  reset(): void {
    this.history.clear();
    this.locanara.resetChat();
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
        <CodeBlock language="typescript">{`class ChatHistory {
  private messages: ChatMessage[] = [];
  private readonly maxTokens = 4000;
  private readonly reservedTokens = 500; // For system prompt

  append(role: 'user' | 'assistant', content: string): void {
    this.messages.push({
      role,
      content,
      tokenEstimate: this.estimateTokens(content),
    });
    this.pruneIfNeeded();
  }

  private pruneIfNeeded(): void {
    const targetTokens = this.maxTokens - this.reservedTokens;

    // Remove oldest messages when exceeding limit
    while (this.totalTokens > targetTokens && this.messages.length > 2) {
      this.messages.shift();
    }
  }

  /**
   * Smart pruning: Preserves important context
   * - First 2 messages (initial context)
   * - Last 4 messages (recent conversation)
   * - Middle is replaced with summary
   */
  async smartPrune(summarize: (text: string) => Promise<string>): Promise<void> {
    if (this.messages.length <= 6) return;

    const first = this.messages.slice(0, 2);
    const last = this.messages.slice(-4);
    const middle = this.messages.slice(2, -4);

    // Summarize middle portion
    const middleText = middle.map(m => m.content).join('\\n');
    const summary = await summarize(middleText);

    this.messages = [
      ...first,
      {
        role: 'assistant',
        content: \`[Earlier: \${summary}]\`,
        tokenEstimate: this.estimateTokens(summary),
      },
      ...last,
    ];
  }
}`}</CodeBlock>

        <h3>Sliding Window Approach</h3>
        <CodeBlock language="typescript">{`class SlidingWindowHistory {
  private messages: ChatMessage[] = [];
  private readonly maxMessages: number;

  constructor(maxMessages = 20) {
    this.maxMessages = maxMessages;
  }

  append(message: ChatMessage): void {
    this.messages.push(message);

    // FIFO: Remove oldest when exceeding max
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  getRecent(count: number): ChatMessage[] {
    return this.messages.slice(-count);
  }
}`}</CodeBlock>
      </section>

      <section>
        <h2>Error Handling and Retry</h2>
        <CodeBlock language="typescript">{`class ChatError extends Error {
  constructor(
    public code: 'CONTEXT_TOO_LONG' | 'MODEL_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN',
    message: string
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

async function sendWithRetry(
  chat: ChatManager,
  message: string,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await chat.sendMessage(message);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error) {
        if (error.message.includes('context length')) {
          // Prune and retry on context overflow
          chat.pruneHistory();
          continue;
        }

        if (error.message.includes('unavailable')) {
          // Model unavailable - no point retrying
          throw new ChatError('MODEL_UNAVAILABLE', error.message);
        }

        if (error.message.includes('timeout')) {
          // Timeout - wait and retry
          await new Promise(r => setTimeout(r, attempt * 1000));
          continue;
        }
      }

      throw new ChatError('UNKNOWN', lastError?.message ?? 'Unknown error');
    }
  }

  throw new ChatError('UNKNOWN', lastError?.message ?? 'Max retries exceeded');
}`}</CodeBlock>
      </section>

      <section>
        <h2>Streaming with Abort Support</h2>
        <CodeBlock language="typescript">{`class ChatManager {
  private abortController: AbortController | null = null;

  async sendMessageStreaming(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    // Cancel any ongoing request
    this.abortController?.abort();
    this.abortController = new AbortController();

    const fullInput = this.history.buildInput(message);
    let fullResponse = '';

    try {
      for await (const chunk of this.locanara.chatStreaming(fullInput, {
        signal: this.abortController.signal,
      })) {
        fullResponse += chunk;
        onChunk(chunk);
      }

      this.history.append('user', message);
      this.history.append('assistant', fullResponse);

      return fullResponse;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request was cancelled');
        return fullResponse; // Return partial response
      }
      throw error;
    }
  }

  cancelCurrentRequest(): void {
    this.abortController?.abort();
  }
}

// Usage
const chat = new ChatManager();

// Start streaming
const responsePromise = chat.sendMessageStreaming(
  'Write a long story',
  (chunk) => console.log(chunk)
);

// Cancel after 5 seconds
setTimeout(() => chat.cancelCurrentRequest(), 5000);`}</CodeBlock>
      </section>

      <section>
        <h2>Persisting Chat History</h2>
        <CodeBlock language="typescript">{`class PersistentChatHistory extends ChatHistory {
  private readonly storageKey: string;

  constructor(sessionId: string) {
    super();
    this.storageKey = \`chat_history_\${sessionId}\`;
    this.load();
  }

  private load(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.messages = JSON.parse(saved);
    }
  }

  private save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
  }

  append(role: 'user' | 'assistant', content: string): void {
    super.append(role, content);
    this.save();
  }

  clear(): void {
    super.clear();
    localStorage.removeItem(this.storageKey);
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
            <strong>Abort support</strong>: Always implement cancellation for
            long-running requests
          </li>
          <li>
            <strong>Error recovery</strong>: Auto-prune and retry on context
            overflow for seamless UX
          </li>
          <li>
            <strong>Persistence</strong>: Use localStorage or IndexedDB to
            preserve conversations across page reloads
          </li>
        </ul>
      </section>

      <PageNavigation
        prev={{ to: "/docs/tutorials/web-summarize", label: "Web Summarize" }}
        next={{ to: "/docs/tutorials/web-translate", label: "Web Translate" }}
      />
    </div>
  );
}

export default WebChatTutorial;
