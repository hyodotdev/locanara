import SwiftUI
import Locanara

struct ClassifyDemo: View {
    @State private var inputText = "The new iPhone features an incredible camera system with advanced computational photography."
    @State private var categories = "Technology, Sports, Entertainment, Business, Health"
    @State private var result: ClassifyResult?
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Text to Classify")
                        .font(.headline)

                    TextEditor(text: $inputText)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Categories (comma-separated)")
                        .font(.headline)

                    TextField("Categories", text: $categories)
                        .textFieldStyle(.roundedBorder)
                }

                Button(action: executeClassify) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Processing..." : "Classify")
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
                        Text("Classifications")
                            .font(.headline)

                        ForEach(result.classifications, id: \.label) { classification in
                            HStack {
                                Text(classification.label)
                                    .fontWeight(classification.label == result.topClassification.label ? .bold : .regular)

                                Spacer()

                                ProgressView(value: classification.score)
                                    .frame(width: 100)

                                Text("\(Int(classification.score * 100))%")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }

                Spacer()
            }
            .padding()
        }
    }

    private func executeClassify() {
        isLoading = true
        errorMessage = nil
        result = nil

        Task {
            do {
                let categoryList = categories.split(separator: ",").map { String($0.trimmingCharacters(in: .whitespaces)) }
                let chain = ClassifyChain(
                    categories: categoryList
                )
                let classifyResult = try await chain.run(inputText)
                await MainActor.run {
                    self.result = classifyResult
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
