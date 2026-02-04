import SwiftUI
import Locanara

struct ChatMessage: Identifiable {
    let id = UUID()
    let role: String
    let content: String
}

struct ChatDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var isLoading = false
    @State private var conversationId: String?

    private var isAIAvailable: Bool {
        appState.currentEngine != .none && appState.isModelReady
    }

    var body: some View {
        VStack(spacing: 0) {
            if !isAIAvailable {
                AIModelRequiredBanner()
                    .padding()
            }

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { message in
                            ChatBubble(message: message)
                                .id(message.id)
                        }

                        if isLoading {
                            HStack {
                                TypingIndicator()
                                Spacer()
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding()
                }
                .onChange(of: messages.count) { _, _ in
                    if let lastMessage = messages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
            }

            Divider()

            HStack(spacing: 12) {
                TextField("Message", text: $inputText)
                    .textFieldStyle(.roundedBorder)
                    .disabled(isLoading)
                    .autocorrectionDisabled()
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    #endif

                Button(action: sendMessage) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                }
                .disabled(inputText.isEmpty || isLoading || !isAIAvailable)
            }
            .padding()
        }
    }

    private func sendMessage() {
        let userMessage = inputText
        inputText = ""
        messages.append(ChatMessage(role: "user", content: userMessage))
        isLoading = true

        Task {
            do {
                let input = ExecuteFeatureInput(
                    feature: .chat,
                    input: userMessage,
                    parameters: FeatureParametersInput(
                        chat: ChatParametersInput(
                            conversationId: conversationId,
                            systemPrompt: nil  // Use default system prompt with language detection
                        )
                    )
                )

                let executionResult = try await LocanaraClient.shared.executeFeature(input)

                if case .chat(let chatResult) = executionResult.result {
                    await MainActor.run {
                        messages.append(ChatMessage(role: "assistant", content: chatResult.message))
                        conversationId = chatResult.conversationId
                    }
                }
            } catch {
                await MainActor.run {
                    messages.append(ChatMessage(role: "assistant", content: "Error: \(error.localizedDescription)"))
                }
            }

            await MainActor.run {
                isLoading = false
            }
        }
    }
}
