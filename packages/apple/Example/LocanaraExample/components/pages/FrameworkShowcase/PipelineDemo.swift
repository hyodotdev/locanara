import SwiftUI
import Locanara

/// Demonstrates the Pipeline DSL — composing multiple AI steps with compile-time type safety
struct PipelineDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = "Ths is a tset of on-devce AI. It can proofread and then translte your text in one pipline."
    @State private var proofreadResult: String?
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
                let model = FoundationLanguageModel()

                // Step 1: Proofread
                let proofread = try await model.proofread(text)

                // Step 2: Translate the corrected text
                let translated = try await model.translate(
                    proofread.correctedText, to: "\(selectedLanguage)"
                )
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

                if let proofreadResult {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Step 1: Proofread", systemImage: "checkmark.circle")
                            .font(.headline)
                            .foregroundStyle(.green)
                        Text(proofreadResult)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.green.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }

                if let translateResult {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Step 2: Translate", systemImage: "globe")
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
                                value: translateResult.sourceLanguage ?? "auto"
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
        proofreadResult = nil
        translateResult = nil

        Task {
            do {
                let model = FoundationLanguageModel()

                // Step 1: Proofread
                let proofread = try await model.proofread(inputText)
                let corrected = proofread.correctedText
                await MainActor.run { self.proofreadResult = corrected }

                // Step 2: Translate the corrected text
                let translated = try await model.translate(corrected, to: selectedLanguage)
                await MainActor.run { self.translateResult = translated }
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isLoading = false }
        }
    }
}
