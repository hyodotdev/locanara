import SwiftUI
import Locanara

struct ChatMessage: Identifiable {
    let id = UUID()
    let role: String
    var content: String
}

struct ChatDemo: View {
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var isLoading = false
    @State private var useStreaming = true
    private let memory = BufferMemory()

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { message in
                            ChatBubble(message: message)
                                .id(message.id)
                        }

                        if isLoading && !useStreaming {
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

            VStack(spacing: 8) {
                HStack(spacing: 4) {
                    Button {
                        useStreaming = false
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "bubble.left")
                                .font(.caption)
                            Text("Standard")
                                .font(.caption)
                                .fontWeight(.semibold)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                        .background(!useStreaming ? Color.blue : Color(.systemGray5))
                        .foregroundStyle(!useStreaming ? .white : .secondary)
                        .clipShape(Capsule())
                    }

                    Button {
                        useStreaming = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "bolt")
                                .font(.caption)
                            Text("Stream")
                                .font(.caption)
                                .fontWeight(.semibold)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                        .background(useStreaming ? Color.blue : Color(.systemGray5))
                        .foregroundStyle(useStreaming ? .white : .secondary)
                        .clipShape(Capsule())
                    }
                }
                .padding(.top, 8)

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
                    .disabled(inputText.isEmpty || isLoading)
                }
                .padding(.horizontal)
                .padding(.bottom)
            }
        }
    }

    private func sendMessage() {
        let userMessage = inputText
        inputText = ""
        messages.append(ChatMessage(role: "user", content: userMessage))
        isLoading = true

        Task {
            let chain = ChatChain(memory: memory)

            if useStreaming {
                // Add placeholder message for streaming
                let placeholderIndex = messages.count
                await MainActor.run {
                    messages.append(ChatMessage(role: "assistant", content: ""))
                }

                do {
                    for try await chunk in chain.streamRun(userMessage) {
                        await MainActor.run {
                            messages[placeholderIndex].content += chunk
                        }
                    }
                } catch {
                    await MainActor.run {
                        messages[placeholderIndex].content = "Error: \(error.localizedDescription)"
                    }
                }
            } else {
                do {
                    let chatResult = try await chain.run(userMessage)
                    await MainActor.run {
                        messages.append(ChatMessage(role: "assistant", content: chatResult.message))
                    }
                } catch {
                    await MainActor.run {
                        messages.append(ChatMessage(role: "assistant", content: "Error: \(error.localizedDescription)"))
                    }
                }
            }

            await MainActor.run {
                isLoading = false
            }
        }
    }
}
