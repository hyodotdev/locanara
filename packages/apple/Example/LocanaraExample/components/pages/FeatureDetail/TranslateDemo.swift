import SwiftUI
import Locanara

struct TranslateDemo: View {
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

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
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
                .disabled(isLoading || inputText.isEmpty)

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
                let chain = TranslateChain(
                    targetLanguage: targetLanguage
                )
                let translateResult = try await chain.run(inputText)
                await MainActor.run {
                    self.result = translateResult
                }
            } catch {
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
