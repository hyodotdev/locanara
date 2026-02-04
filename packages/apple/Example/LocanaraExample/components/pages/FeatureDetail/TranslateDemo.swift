import SwiftUI
import Locanara

struct TranslateDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = "Hello, how are you today?"
    @State private var targetLanguage = "ko"
    @State private var result: TranslateResult?
    @State private var isLoading = false
    @State private var errorMessage: String?

    let languages = [
        ("en", "English"),
        ("ko", "Korean"),
        ("ja", "Japanese"),
        ("zh", "Chinese"),
        ("es", "Spanish"),
        ("fr", "French"),
        ("de", "German")
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

                VStack(alignment: .leading, spacing: 8) {
                    Text("Text to Translate")
                        .font(.headline)

                    TextEditor(text: $inputText)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Target Language")
                        .font(.headline)

                    Picker("Language", selection: $targetLanguage) {
                        ForEach(languages, id: \.0) { code, name in
                            Text(name).tag(code)
                        }
                    }
                    .pickerStyle(.menu)
                }

                Button(action: executeTranslate) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Processing..." : "Translate")
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
                        Text("Translation")
                            .font(.headline)

                        Text(result.translatedText)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.gray.opacity(0.15))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        HStack {
                            Text("\(result.sourceLanguage) -> \(result.targetLanguage)")
                                .font(.caption)
                                .foregroundStyle(.secondary)

                            Spacer()

                            if let confidence = result.confidence {
                                Text("Confidence: \(Int(confidence * 100))%")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                Spacer()
            }
            .padding()
        }
    }

    private func executeTranslate() {
        isLoading = true
        errorMessage = nil
        result = nil

        Task {
            do {
                let params = TranslateParametersInput(
                    sourceLanguage: nil,
                    targetLanguage: targetLanguage
                )

                DemoLogger.logInput(feature: "TRANSLATE", input: inputText, parameters: params)

                let input = ExecuteFeatureInput(
                    feature: .translate,
                    input: inputText,
                    parameters: FeatureParametersInput(translate: params)
                )

                let executionResult = try await LocanaraClient.shared.executeFeature(input)

                if case .translate(let translateResult) = executionResult.result {
                    DemoLogger.logResult(feature: "TRANSLATE", result: translateResult)
                    await MainActor.run {
                        self.result = translateResult
                    }
                }
            } catch {
                DemoLogger.logError(feature: "TRANSLATE", error: error)
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
