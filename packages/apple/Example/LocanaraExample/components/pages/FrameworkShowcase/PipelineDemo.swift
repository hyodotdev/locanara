import SwiftUI
import Locanara

/// Demonstrates the Pipeline DSL and its compile-time final-output type tracking.
struct PipelineDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = "Ths is a tset of on-devce AI. It can proofread and then translte your text in one pipline."
    @State private var translateResult: TranslateResult?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var selectedLanguage = "ko"

    private let languages = [
        ("ko", "Korean"),
        ("ja", "Japanese"),
        ("es", "Spanish"),
        ("fr", "French"),
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
                let result: TranslateResult = try await model.pipeline {
                    Proofread()
                    Translate(to: "\(selectedLanguage)")
                }.run(text)
                """)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Input Text (with intentional typos)")
                        .font(.headline)
                    TextEditor(text: $inputText)
                        .frame(minHeight: 120)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Target Language")
                        .font(.headline)
                    Picker("Language", selection: $selectedLanguage) {
                        ForEach(languages, id: \.0) { code, name in
                            Text(name).tag(code)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Button(action: executePipeline) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Running Pipeline..." : "Run Pipeline")
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

                if let translateResult {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Pipeline Result: Proofread → Translate", systemImage: "globe")
                            .font(.headline)
                            .foregroundStyle(.blue)
                        Text(translateResult.translatedText)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.blue.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        HStack(spacing: 12) {
                            StatBadge(
                                label: "From",
                                value: translateResult.sourceLanguage
                            )
                            StatBadge(
                                label: "To",
                                value: translateResult.targetLanguage
                            )
                            if let confidence = translateResult.confidence {
                                StatBadge(
                                    label: "Confidence",
                                    value: String(format: "%.0f%%", confidence * 100)
                                )
                            }
                        }
                    }
                }
            }
            .padding()
        }
    }

    private func executePipeline() {
        isLoading = true
        errorMessage = nil
        translateResult = nil

        Task {
            do {
                let model = LocanaraDefaults.model
                let translated: TranslateResult = try await model.pipeline {
                    Proofread()
                    Translate(to: selectedLanguage)
                }.run(inputText)
                await MainActor.run { self.translateResult = translated }
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isLoading = false }
        }
    }
}
