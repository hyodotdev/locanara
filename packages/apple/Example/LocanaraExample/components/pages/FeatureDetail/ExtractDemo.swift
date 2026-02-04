import SwiftUI
import Locanara

struct ExtractDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = """
        Contact John Smith at john@example.com or call 555-123-4567. \
        Meeting scheduled for January 15, 2025 at Apple Park, Cupertino.
        """
    @State private var result: ExtractResult?
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
                    Text("Text to Extract From")
                        .font(.headline)

                    TextEditor(text: $inputText)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                Button(action: executeExtract) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Processing..." : "Extract Entities")
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
                        Text("Extracted Entities")
                            .font(.headline)

                        ForEach(result.entities, id: \.value) { entity in
                            HStack {
                                Text(entity.type)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(entityColor(for: entity.type))
                                    .foregroundStyle(.white)
                                    .clipShape(Capsule())

                                Text(entity.value)
                                    .fontWeight(.medium)

                                Spacer()

                                Text("\(Int(entity.confidence * 100))%")
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

    private func entityColor(for type: String) -> Color {
        switch type.lowercased() {
        case "person": return .blue
        case "email": return .orange
        case "phone": return .green
        case "date": return .purple
        case "location": return .red
        default: return .gray
        }
    }

    private func executeExtract() {
        isLoading = true
        errorMessage = nil
        result = nil

        Task {
            do {
                let params = ExtractParametersInput(
                    entityTypes: ["person", "email", "phone", "date", "location"],
                    extractKeyValues: true
                )

                DemoLogger.logInput(feature: "EXTRACT", input: inputText, parameters: params)

                let input = ExecuteFeatureInput(
                    feature: .extract,
                    input: inputText,
                    parameters: FeatureParametersInput(extract: params)
                )

                let executionResult = try await LocanaraClient.shared.executeFeature(input)

                if case .extract(let extractResult) = executionResult.result {
                    DemoLogger.logResult(feature: "EXTRACT", result: extractResult)
                    await MainActor.run {
                        self.result = extractResult
                    }
                }
            } catch {
                DemoLogger.logError(feature: "EXTRACT", error: error)
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
