import SwiftUI
import Locanara

struct ProofreadDemo: View {
    @State private var inputText = """
        I recieve your message and will definately respond untill tommorow. \
        Thier was a wierd occurence.
        """
    @State private var result: ProofreadResult?
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Text to Proofread")
                        .font(.headline)

                    TextEditor(text: $inputText)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
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
                .disabled(isLoading || inputText.isEmpty)

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
                let chain = ProofreadChain()
                let proofreadResult = try await chain.run(inputText)
                await MainActor.run {
                    self.result = proofreadResult
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
