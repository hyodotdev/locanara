import SwiftUI
import Locanara

struct SummarizeDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = """
        Apple Intelligence is the personal intelligence system that puts powerful \
        generative models right at the core of iPhone, iPad, and Mac. It powers \
        incredible new features that help you write, express yourself, and get \
        things done effortlessly. The best part? It's deeply integrated into \
        iOS 18, iPadOS 18, and macOS Sequoia, harnessing the power of Apple \
        silicon to understand and create language and images, take action across \
        apps, and draw from your personal context to simplify and accelerate \
        everyday tasks. All while protecting your privacy.
        """
    @State private var result: SummarizeResult?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var selectedInputType: SummarizeInputType = .article
    @State private var selectedOutputType: SummarizeOutputType = .oneBullet

    private var isAIAvailable: Bool {
        appState.currentEngine != .none && appState.isModelReady
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if !isAIAvailable {
                    AIModelRequiredBanner()
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("Input Text")
                        .font(.headline)

                    TextEditor(text: $inputText)
                        .frame(minHeight: 150)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Input Type")
                        .font(.headline)

                    Picker("Input Type", selection: $selectedInputType) {
                        Text("Article").tag(SummarizeInputType.article)
                        Text("Conversation").tag(SummarizeInputType.conversation)
                    }
                    .pickerStyle(.segmented)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Output Type")
                        .font(.headline)

                    Picker("Output Type", selection: $selectedOutputType) {
                        Text("1 Bullet").tag(SummarizeOutputType.oneBullet)
                        Text("2 Bullets").tag(SummarizeOutputType.twoBullets)
                        Text("3 Bullets").tag(SummarizeOutputType.threeBullets)
                    }
                    .pickerStyle(.segmented)
                }

                Button(action: executeSummarize) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Processing..." : "Summarize")
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 20)
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading || inputText.isEmpty || !isAIAvailable)

                if let error = errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.caption)
                }

                if let result = result {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Result")
                            .font(.headline)

                        Text(result.summary)
                            .padding()
                            .background(Color.gray.opacity(0.15))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        HStack {
                            StatBadge(label: "Original", value: "\(result.originalLength) chars")
                            StatBadge(label: "Summary", value: "\(result.summaryLength) chars")
                            if let confidence = result.confidence {
                                StatBadge(label: "Confidence", value: "\(Int(confidence * 100))%")
                            }
                        }
                    }
                }

                Spacer()
            }
            .padding()
        }
    }

    private func executeSummarize() {
        isLoading = true
        errorMessage = nil
        result = nil

        Task {
            do {
                let params = SummarizeParametersInput(
                    inputType: selectedInputType,
                    outputType: selectedOutputType,
                    language: .english,
                    autoTruncate: true
                )

                DemoLogger.logInput(feature: "SUMMARIZE", input: inputText, parameters: params)

                let input = ExecuteFeatureInput(
                    feature: .summarize,
                    input: inputText,
                    parameters: FeatureParametersInput(summarize: params)
                )

                let executionResult = try await LocanaraClient.shared.executeFeature(input)

                if case .summarize(let summarizeResult) = executionResult.result {
                    DemoLogger.logResult(feature: "SUMMARIZE", result: summarizeResult)
                    await MainActor.run {
                        self.result = summarizeResult
                    }
                }
            } catch {
                DemoLogger.logError(feature: "SUMMARIZE", error: error)
                await MainActor.run {
                    errorMessage = error.localizedDescription
                }
            }

            await MainActor.run {
                isLoading = false
            }
        }
    }
}
