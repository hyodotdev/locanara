import SwiftUI
import Locanara

struct RewriteDemo: View {
    @State private var inputText = "i think this product is really good and everyone should buy it"
    @State private var selectedStyle: RewriteOutputType = .professional
    @State private var result: RewriteResult?
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Text to Rewrite")
                        .font(.headline)

                    TextEditor(text: $inputText)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Style")
                        .font(.headline)

                    Picker("Style", selection: $selectedStyle) {
                        Text("Elaborate").tag(RewriteOutputType.elaborate)
                        Text("Emojify").tag(RewriteOutputType.emojify)
                        Text("Shorten").tag(RewriteOutputType.shorten)
                    }
                    .pickerStyle(.segmented)

                    Picker("", selection: $selectedStyle) {
                        Text("Friendly").tag(RewriteOutputType.friendly)
                        Text("Professional").tag(RewriteOutputType.professional)
                        Text("Rephrase").tag(RewriteOutputType.rephrase)
                    }
                    .pickerStyle(.segmented)
                }

                Button(action: executeRewrite) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Processing..." : "Rewrite")
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
                        Text("Rewritten Text")
                            .font(.headline)

                        Text(result.rewrittenText)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.gray.opacity(0.15))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        if let style = result.style {
                            Text("Style: \(style.rawValue)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        if let alternatives = result.alternatives, !alternatives.isEmpty {
                            Text("Alternatives")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .padding(.top, 8)

                            ForEach(alternatives, id: \.self) { alt in
                                Text(alt)
                                    .font(.caption)
                                    .padding(8)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.gray.opacity(0.1))
                                    .clipShape(RoundedRectangle(cornerRadius: 6))
                            }
                        }
                    }
                }

                Spacer()
            }
            .padding()
        }
    }

    private func executeRewrite() {
        isLoading = true
        errorMessage = nil
        result = nil

        Task {
            do {
                let chain = RewriteChain(
                    style: selectedStyle
                )
                let rewriteResult = try await chain.run(inputText)
                await MainActor.run {
                    self.result = rewriteResult
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
