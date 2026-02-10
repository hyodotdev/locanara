import SwiftUI
import Locanara

/// Demonstrates Guardrails — wrapping chains with input validation and content safety
struct GuardrailDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = "Apple Intelligence is a personal intelligence system that puts powerful generative models at the core of iPhone, iPad, and Mac."
    @State private var maxCharacters = 500
    @State private var blockedPatternsText = "password, SSN, credit card"
    @State private var resultText: String?
    @State private var blockedReason: String?
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

                CodePatternView(code: """
                let guardrails: [any Guardrail] = [
                    InputLengthGuardrail(maxCharacters: \(maxCharacters), truncate: false),
                    ContentFilterGuardrail(blockedPatterns: \(blockedPatterns))
                ]
                let guarded = GuardedChain(
                    chain: SummarizeChain(),
                    guardrails: guardrails
                )
                let result = try await guarded.invoke(ChainInput(text: input))
                """)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Input Text")
                        .font(.headline)
                    TextEditor(text: $inputText)
                        .frame(minHeight: 120)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                    HStack {
                        Text("\(inputText.count) characters")
                            .font(.caption)
                            .foregroundStyle(inputText.count > maxCharacters ? .red : .secondary)
                        Spacer()
                        Text("Max: \(maxCharacters)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Max Characters")
                        .font(.headline)
                    Stepper("\(maxCharacters)", value: $maxCharacters, in: 50...2000, step: 50)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Blocked Patterns (comma-separated)")
                        .font(.headline)
                    TextField("e.g. password, SSN", text: $blockedPatternsText)
                        .textFieldStyle(.roundedBorder)
                }

                Button(action: executeGuardedChain) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Processing..." : "Summarize with Guardrails")
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

                if let blockedReason {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Blocked by Guardrail", systemImage: "shield.slash")
                            .font(.headline)
                            .foregroundStyle(.red)
                        Text(blockedReason)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.red.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }

                if let resultText {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Guardrails Passed — Summary", systemImage: "shield.checkered")
                            .font(.headline)
                            .foregroundStyle(.green)
                        Text(resultText)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.green.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .padding()
        }
    }

    private var blockedPatterns: [String] {
        blockedPatternsText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
    }

    private func executeGuardedChain() {
        isLoading = true
        errorMessage = nil
        resultText = nil
        blockedReason = nil

        Task {
            do {
                let guardrails: [any Guardrail] = [
                    InputLengthGuardrail(maxCharacters: maxCharacters, truncate: false),
                    ContentFilterGuardrail(blockedPatterns: blockedPatterns),
                ]
                let guarded = GuardedChain(
                    chain: SummarizeChain(),
                    guardrails: guardrails
                )
                let output = try await guarded.invoke(ChainInput(text: inputText))
                await MainActor.run { resultText = output.text }
            } catch let error as LocanaraError {
                if case .invalidInput(let reason) = error {
                    await MainActor.run { blockedReason = reason }
                } else {
                    await MainActor.run { errorMessage = error.localizedDescription }
                }
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isLoading = false }
        }
    }
}
