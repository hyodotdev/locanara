import SwiftUI
import Locanara

/// Demonstrates Agent with Tools — ReAct-lite pattern with reasoning trace
struct AgentDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = ""
    @State private var agentResult: AgentResult?
    @State private var isLoading = false
    @State private var errorMessage: String?

    private let sampleDocuments = [
        "On-device AI processes data locally without sending it to the cloud. This ensures complete user privacy and enables offline functionality. Models like Apple Intelligence and Gemini Nano run directly on the device's neural engine.",
        "Mobile app development frameworks help developers build applications for iOS and Android from a shared codebase. Cross-platform tools reduce development time by providing unified APIs that abstract platform differences.",
        "Privacy regulations like GDPR and CCPA require apps to minimize data collection and provide users with control over their personal information. On-device processing is one strategy to comply with these regulations.",
        "Neural Processing Units (NPUs) are specialized hardware accelerators designed for AI workloads. Apple's Neural Engine and Qualcomm's Hexagon NPU enable efficient on-device inference with low power consumption.",
    ]

    private let suggestedQueries = [
        "What do the documents say about privacy?",
        "Find information about NPUs and summarize it",
        "What is today's date?",
    ]

    private var isAIAvailable: Bool {
        appState.currentEngine != .none && appState.isModelReady
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if !isAIAvailable {
                    AIModelRequiredBanner()
                }

                CodePatternView(code: """
                let searchTool = LocalSearchTool(documents: [...])
                let dateTool = FunctionTool(
                    id: "current_date",
                    description: "Get current date and time",
                    parameterDescription: "No parameters needed"
                ) { _ in
                    DateFormatter.localizedString(from: Date(), dateStyle: .full, timeStyle: .short)
                }

                let agent = Agent(
                    config: AgentConfig(
                        maxSteps: 3,
                        tools: [searchTool, dateTool],
                        chains: [SummarizeChain()]
                    )
                )
                let result = try await agent.run("Find info about privacy")
                // result.steps — see the reasoning trace
                """)

                // Documents
                DisclosureGroup("Local Documents (\(sampleDocuments.count))") {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(Array(sampleDocuments.enumerated()), id: \.offset) { i, doc in
                            Text("Doc \(i + 1): \(doc)")
                                .font(.caption)
                                .lineLimit(3)
                                .padding(8)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.gray.opacity(0.1))
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                        }
                    }
                }
                .font(.headline)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Query")
                        .font(.headline)
                    TextField("Ask the agent...", text: $inputText)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { executeAgent() }

                    // Suggested queries
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(suggestedQueries, id: \.self) { query in
                                Button(query) {
                                    inputText = query
                                }
                                .font(.caption)
                                .buttonStyle(.bordered)
                            }
                        }
                    }
                }

                Button(action: executeAgent) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Agent thinking..." : "Run Agent")
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 20)
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading || inputText.isEmpty || !isAIAvailable)

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                        .font(.caption)
                }

                if let agentResult {
                    // Reasoning trace
                    if !agentResult.steps.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Reasoning Trace")
                                .font(.headline)

                            ForEach(Array(agentResult.steps.enumerated()), id: \.offset) { i, step in
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text("Step \(i + 1)")
                                            .font(.caption.weight(.bold))
                                            .foregroundStyle(.white)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 2)
                                            .background(Color.orange)
                                            .clipShape(Capsule())
                                        Spacer()
                                    }

                                    if !step.thought.isEmpty {
                                        Label {
                                            Text(step.thought)
                                                .font(.caption)
                                        } icon: {
                                            Image(systemName: "brain")
                                                .foregroundStyle(.purple)
                                        }
                                    }

                                    if !step.action.isEmpty {
                                        Label {
                                            Text("\(step.action)(\(step.input))")
                                                .font(.system(.caption, design: .monospaced))
                                        } icon: {
                                            Image(systemName: "play.circle")
                                                .foregroundStyle(.blue)
                                        }
                                    }

                                    if let observation = step.observation, !observation.isEmpty {
                                        Label {
                                            Text(observation)
                                                .font(.caption)
                                                .lineLimit(3)
                                        } icon: {
                                            Image(systemName: "eye")
                                                .foregroundStyle(.green)
                                        }
                                    }
                                }
                                .padding(10)
                                .background(Color.orange.opacity(0.05))
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }

                    // Final answer
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Final Answer", systemImage: "checkmark.seal")
                            .font(.headline)
                            .foregroundStyle(.green)
                        Text(agentResult.answer)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.green.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        HStack(spacing: 12) {
                            StatBadge(label: "Steps", value: "\(agentResult.totalSteps)")
                        }
                    }
                }
            }
            .padding()
        }
    }

    private func executeAgent() {
        isLoading = true
        errorMessage = nil
        agentResult = nil

        Task {
            do {
                let searchTool = LocalSearchTool(documents: sampleDocuments)
                let dateTool = FunctionTool(
                    id: "current_date",
                    description: "Get the current date and time",
                    parameterDescription: "No parameters needed"
                ) { _ in
                    DateFormatter.localizedString(from: Date(), dateStyle: .full, timeStyle: .short)
                }

                let agent = Agent(
                    config: AgentConfig(
                        maxSteps: 3,
                        tools: [searchTool, dateTool],
                        chains: [SummarizeChain()]
                    )
                )

                let result = try await agent.run(inputText)
                await MainActor.run { self.agentResult = result }
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isLoading = false }
        }
    }
}
