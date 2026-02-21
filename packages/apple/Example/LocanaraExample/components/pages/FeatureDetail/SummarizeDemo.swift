import SwiftUI
import Locanara

struct SummarizeDemo: View {
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
    @State private var bulletCount = 1
    @State private var inputType = "text"

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
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

                    Picker("Input Type", selection: $inputType) {
                        Text("Article").tag("text")
                        Text("Conversation").tag("conversation")
                    }
                    .pickerStyle(.segmented)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Bullet Count")
                        .font(.headline)

                    Picker("Bullet Count", selection: $bulletCount) {
                        Text("1 Bullet").tag(1)
                        Text("2 Bullets").tag(2)
                        Text("3 Bullets").tag(3)
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
                .disabled(isLoading || inputText.isEmpty)

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
                let chain = SummarizeChain(
                    bulletCount: bulletCount,
                    inputType: inputType
                )
                let summarizeResult = try await chain.run(inputText)
                await MainActor.run {
                    self.result = summarizeResult
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
