import SwiftUI
import Locanara

/// State holder for Session + Memory demo
@MainActor
private final class SessionDemoState: ObservableObject {
    let memory = BufferMemory(maxEntries: 5, maxTokens: 1500)
    private(set) lazy var session = Session(
        memory: memory
    )

    @Published var messages: [(id: UUID, role: String, content: String)] = []
    @Published var memoryEntries: [MemoryEntry] = []
    @Published var tokenCount: Int = 0
    @Published var isLoading = false

    func send(_ text: String) async throws {
        let userMessage = (id: UUID(), role: "user", content: text)
        messages.append(userMessage)
        isLoading = true

        do {
            let reply = try await session.send(text)
            let assistantMessage = (id: UUID(), role: "assistant", content: reply)
            messages.append(assistantMessage)
            await refreshMemoryDisplay()
        } catch {
            isLoading = false
            throw error
        }
        isLoading = false
    }

    func refreshMemoryDisplay() async {
        memoryEntries = await memory.load(for: ChainInput(text: ""))
        tokenCount = memory.estimatedTokenCount
    }

    func reset() async {
        await session.reset()
        messages.removeAll()
        memoryEntries.removeAll()
        tokenCount = 0
    }
}

/// Demonstrates Session with BufferMemory — stateful chat with visible memory state
struct SessionDemo: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var demoState = SessionDemoState()
    @State private var inputText = ""
    @State private var errorMessage: String?
    @State private var showMemoryInspector = false

    private var isAIAvailable: Bool {
        appState.currentEngine != .none && appState.isModelReady
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if !isAIAvailable {
                        AIModelRequiredBanner()
                    }

                    CodePatternView(code: """
                    let memory = BufferMemory(maxEntries: 5, maxTokens: 1500)
                    let session = Session(memory: memory)

                    let reply = try await session.send("Hello!")
                    // Memory automatically tracks conversation turns
                    """)

                    // Memory Inspector
                    DisclosureGroup("Memory Inspector", isExpanded: $showMemoryInspector) {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 12) {
                                StatBadge(
                                    label: "Entries",
                                    value: "\(demoState.memoryEntries.count) / 5"
                                )
                                StatBadge(
                                    label: "Tokens",
                                    value: "\(demoState.tokenCount) / 1500"
                                )
                            }

                            if demoState.memoryEntries.isEmpty {
                                Text("No memory entries yet. Start chatting!")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .padding(.vertical, 4)
                            } else {
                                ForEach(Array(demoState.memoryEntries.enumerated()), id: \.offset) { _, entry in
                                    HStack(alignment: .top, spacing: 8) {
                                        Text(entry.role == "user" ? "U" : "A")
                                            .font(.caption2.weight(.bold))
                                            .foregroundStyle(.white)
                                            .frame(width: 20, height: 20)
                                            .background(entry.role == "user" ? Color.blue : Color.gray)
                                            .clipShape(Circle())
                                        Text(entry.content)
                                            .font(.caption)
                                            .lineLimit(2)
                                    }
                                }
                            }
                        }
                        .padding(12)
                        .background(Color.gray.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .font(.headline)

                    // Chat messages
                    if demoState.messages.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "bubble.left.and.bubble.right")
                                .font(.largeTitle)
                                .foregroundStyle(.secondary)
                            Text("Start a conversation")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Text("Session remembers context across messages using BufferMemory")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    } else {
                        ForEach(demoState.messages, id: \.id) { message in
                            ChatBubble(message: ChatMessage(
                                role: message.role,
                                content: message.content
                            ))
                        }
                    }

                    if demoState.isLoading {
                        TypingIndicator()
                    }

                    if let errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                }
                .padding()
            }

            Divider()

            // Input bar
            HStack(spacing: 12) {
                TextField("Message...", text: $inputText)
                    .textFieldStyle(.roundedBorder)
                    .disabled(demoState.isLoading || !isAIAvailable)
                    .onSubmit { sendMessage() }

                Button(action: sendMessage) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                }
                .disabled(inputText.isEmpty || demoState.isLoading || !isAIAvailable)

                Button(action: {
                    Task { await demoState.reset() }
                }) {
                    Image(systemName: "trash")
                        .font(.body)
                }
                .foregroundStyle(.red)
                .disabled(demoState.messages.isEmpty)
            }
            .padding()
        }
    }

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        inputText = ""
        errorMessage = nil

        Task {
            do {
                try await demoState.send(text)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
