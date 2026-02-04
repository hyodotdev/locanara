import SwiftUI
import Locanara

struct ProofreadDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = """
        I recieve your message and will definately respond untill tommorow. \
        Thier was a wierd occurence.
        """
    @State private var selectedInputType: ProofreadInputType = .keyboard
    @State private var result: ProofreadResult?
    @State private var isLoading = false
    @State private var errorMessage: String?

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
                    Text("Text to Proofread")
                        .font(.headline)

                    TextEditor(text: $inputText)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Input Type")
                        .font(.headline)

                    Picker("Input Type", selection: $selectedInputType) {
                        Text("Keyboard").tag(ProofreadInputType.keyboard)
                        Text("Voice").tag(ProofreadInputType.voice)
                    }
                    .pickerStyle(.segmented)
                }

                Button(action: executeProofread) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Processing..." : "Proofread")
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
                        HStack {
                            Text("Corrected Text")
                                .font(.headline)

                            Spacer()

                            Text(result.hasCorrections ? "\(result.corrections.count) corrections" : "No corrections")
                                .font(.caption)
                                .foregroundStyle(result.hasCorrections ? .orange : .green)
                        }

                        Text(result.correctedText)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.gray.opacity(0.15))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        if !result.corrections.isEmpty {
                            Text("Corrections Made")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .padding(.top, 8)

                            ForEach(result.corrections.indices, id: \.self) { index in
                                let correction = result.corrections[index]
                                HStack {
                                    Text(correction.original)
                                        .strikethrough()
                                        .foregroundStyle(.red)

                                    Image(systemName: "arrow.right")
                                        .foregroundStyle(.secondary)

                                    Text(correction.corrected)
                                        .foregroundStyle(.green)

                                    Spacer()

                                    if let type = correction.type {
                                        Text(type)
                                            .font(.caption2)
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(Color.blue.opacity(0.2))
                                            .clipShape(Capsule())
                                    }
                                }
                                .font(.caption)
                            }
                        }
                    }
                }

                Spacer()
            }
            .padding()
        }
    }

    private func executeProofread() {
        isLoading = true
        errorMessage = nil
        result = nil

        Task {
            do {
                let params = ProofreadParametersInput(
                    inputType: selectedInputType,
                    language: .english
                )

                DemoLogger.logInput(feature: "PROOFREAD", input: inputText, parameters: params)

                let input = ExecuteFeatureInput(
                    feature: .proofread,
                    input: inputText,
                    parameters: FeatureParametersInput(proofread: params)
                )

                let executionResult = try await LocanaraClient.shared.executeFeature(input)

                if case .proofread(let proofreadResult) = executionResult.result {
                    DemoLogger.logResult(feature: "PROOFREAD", result: proofreadResult)
                    await MainActor.run {
                        self.result = proofreadResult
                    }
                }
            } catch {
                DemoLogger.logError(feature: "PROOFREAD", error: error)
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
