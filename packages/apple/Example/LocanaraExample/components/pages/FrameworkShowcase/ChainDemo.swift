import SwiftUI
import Locanara

/// A custom Chain that analyzes sentiment — shows how to implement the Chain protocol
private struct SentimentChain: Chain {
    let name = "SentimentChain"
    let model: any LocanaraModel

    func invoke(_ input: ChainInput) async throws -> ChainOutput {
        let template = PromptTemplate.from(
            "Analyze the sentiment of the following text. Reply with exactly one word: positive, negative, or neutral.\n\nText: {text}"
        )
        let chain = ModelChain(model: model, promptTemplate: template)
        return try await chain.invoke(input)
    }
}

/// Demonstrates Chain variants: ModelChain, SequentialChain, ParallelChain, ConditionalChain, and Custom Chain
struct ChainDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = "I absolutely love how easy it is to build AI features with Locanara. The framework makes everything so simple and intuitive!"
    @State private var selectedMode = ChainMode.modelChain
    @State private var resultText: String?
    @State private var secondaryResult: String?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var processingTime: Int?

    private enum ChainMode: String, CaseIterable, Identifiable {
        case modelChain
        case sequential
        case parallel
        case conditional
        case custom

        var id: String { rawValue }

        var title: String {
            switch self {
            case .modelChain: return "ModelChain"
            case .sequential: return "Sequential"
            case .parallel: return "Parallel"
            case .conditional: return "Conditional"
            case .custom: return "Custom"
            }
        }
    }

    private var isAIAvailable: Bool {
        appState.currentEngine != .none && appState.isModelReady
    }

    private var codePattern: String {
        switch selectedMode {
        case .modelChain:
            return """
            // ModelChain — wraps a model with a PromptTemplate
            let template = PromptTemplate.from(
                "Explain the following concept briefly:\\n{text}"
            )
            let chain = ModelChain(
                model: model,
                promptTemplate: template,
                config: .conversational
            )
            let output = try await chain.invoke(ChainInput(text: input))
            """
        case .sequential:
            return """
            // SequentialChain — runs chains in order, output feeds into next
            let sequential = SequentialChain(chains: [
                ProofreadChain(),
                TranslateChain(targetLanguage: "ko")
            ])
            let output = try await sequential.invoke(ChainInput(text: input))
            """
        case .parallel:
            return """
            // ParallelChain — runs chains concurrently, collects all results
            let parallel = ParallelChain(chains: [
                SentimentChain(model: model),
                SummarizeChain()
            ])
            let output = try await parallel.invoke(ChainInput(text: input))
            // output.metadata["SummarizeChain"] has the summary
            """
        case .conditional:
            return """
            // ConditionalChain — routes based on condition
            let conditional = ConditionalChain(
                condition: { $0.text.count > 200 ? "long" : "short" },
                branches: [
                    "long": SummarizeChain(),
                    "short": RewriteChain(style: .elaborate)
                ]
            )
            let output = try await conditional.invoke(ChainInput(text: input))
            """
        case .custom:
            return """
            // Custom Chain — implement the Chain protocol
            struct SentimentChain: Chain {
                let name = "SentimentChain"
                let model: any LocanaraModel

                func invoke(_ input: ChainInput) async throws -> ChainOutput {
                    let template = PromptTemplate.from(
                        "Analyze the sentiment: {text}\\nReply: positive, negative, or neutral."
                    )
                    let chain = ModelChain(model: model, promptTemplate: template)
                    return try await chain.invoke(input)
                }
            }
            let output = try await SentimentChain(model: model).invoke(input)
            """
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if !isAIAvailable {
                    AIModelRequiredBanner()
                }

                CodePatternView(code: codePattern)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Chain Type")
                        .font(.headline)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(ChainMode.allCases) { mode in
                                Button(mode.title) {
                                    selectedMode = mode
                                    resultText = nil
                                    secondaryResult = nil
                                    processingTime = nil
                                }
                                .buttonStyle(.bordered)
                                .tint(selectedMode == mode ? .blue : .gray)
                            }
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Input Text")
                        .font(.headline)
                    TextEditor(text: $inputText)
                        .frame(minHeight: 120)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .disabled(isLoading)

                    if selectedMode == .conditional {
                        Text("\(inputText.count) characters — \(inputText.count > 200 ? "will summarize (>200)" : "will elaborate (≤200)")")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Button(action: executeChain) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Running..." : "Run \(selectedMode.title)")
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

                if let resultText {
                    VStack(alignment: .leading, spacing: 8) {
                        Label(resultLabel, systemImage: resultIcon)
                            .font(.headline)
                            .foregroundStyle(resultColor)
                        Text(resultText)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(resultColor.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }

                if let secondaryResult {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("SummarizeChain (Parallel)", systemImage: "doc.text")
                            .font(.headline)
                            .foregroundStyle(.blue)
                        Text(secondaryResult)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.blue.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }

                if let processingTime {
                    HStack(spacing: 12) {
                        StatBadge(label: "Chain", value: selectedMode.title)
                        StatBadge(label: "Time", value: "\(processingTime)ms")
                    }
                }
            }
            .padding()
        }
    }

    private var resultLabel: String {
        switch selectedMode {
        case .modelChain: return "ModelChain Output"
        case .sequential: return "Sequential Result (Proofread → Translate)"
        case .parallel: return "SentimentChain (Parallel)"
        case .conditional: return inputText.count > 200 ? "Summarized (long text)" : "Elaborated (short text)"
        case .custom: return "SentimentChain (Custom)"
        }
    }

    private var resultIcon: String {
        switch selectedMode {
        case .modelChain: return "cpu"
        case .sequential: return "arrow.right.arrow.right"
        case .parallel: return "arrow.triangle.branch"
        case .conditional: return "arrow.triangle.swap"
        case .custom: return "link"
        }
    }

    private var resultColor: Color {
        switch selectedMode {
        case .modelChain: return .green
        case .sequential: return .orange
        case .parallel: return .purple
        case .conditional: return .teal
        case .custom: return .purple
        }
    }

    private func executeChain() {
        isLoading = true
        errorMessage = nil
        resultText = nil
        secondaryResult = nil
        processingTime = nil

        Task {
            do {
                let model = FoundationLanguageModel()
                let startTime = Date()
                let input = ChainInput(text: inputText)

                switch selectedMode {
                case .modelChain:
                    let template = PromptTemplate.from(
                        "Explain the following concept briefly:\n{text}"
                    )
                    let chain = ModelChain(
                        model: model,
                        promptTemplate: template,
                        config: .conversational
                    )
                    let output = try await chain.invoke(input)
                    await MainActor.run { self.resultText = output.text }

                case .sequential:
                    let sequential = SequentialChain(chains: [
                        ProofreadChain(),
                        TranslateChain(targetLanguage: "ko"),
                    ])
                    let output = try await sequential.invoke(input)
                    await MainActor.run { self.resultText = output.text }

                case .parallel:
                    let parallel = ParallelChain(chains: [
                        SentimentChain(model: model),
                        SummarizeChain(),
                    ])
                    let output = try await parallel.invoke(input)
                    await MainActor.run {
                        self.resultText = output.text
                        self.secondaryResult = output.metadata["SummarizeChain"] ?? output.text
                    }

                case .conditional:
                    let conditional = ConditionalChain(
                        condition: { $0.text.count > 200 ? "long" : "short" },
                        branches: [
                            "long": SummarizeChain(),
                            "short": RewriteChain(style: .elaborate),
                        ]
                    )
                    let output = try await conditional.invoke(input)
                    await MainActor.run { self.resultText = output.text }

                case .custom:
                    let chain = SentimentChain(model: model)
                    let output = try await chain.invoke(input)
                    await MainActor.run { self.resultText = output.text }
                }

                let elapsed = Int(Date().timeIntervalSince(startTime) * 1000)
                await MainActor.run { self.processingTime = elapsed }

            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isLoading = false }
        }
    }
}
