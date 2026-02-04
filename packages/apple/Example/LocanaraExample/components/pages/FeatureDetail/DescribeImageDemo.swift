import SwiftUI
import PhotosUI
import Locanara

struct DescribeImageDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedImage: Image?
    @State private var imageData: Data?
    @State private var result: ImageDescriptionResult?
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
                    Text("Select Image")
                        .font(.headline)

                    PhotosPicker(selection: $selectedItem, matching: .images) {
                        Label("Choose from Library", systemImage: "photo.on.rectangle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .onChange(of: selectedItem) { _, newItem in
                        Task {
                            await loadImage(from: newItem)
                        }
                    }

                    Text("Select an image to describe using AI")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if let selectedImage {
                    selectedImage
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: .infinity)
                        .frame(height: 200)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    VStack {
                        Image(systemName: "photo")
                            .font(.system(size: 80))
                            .foregroundStyle(.secondary)

                        Text("No Image Selected")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 200)
                    .background(Color.gray.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                Button(action: executeDescribeImage) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Processing..." : "Describe Image")
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 20)
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading || imageData == nil || !isAIAvailable)

                if let error = errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.caption)
                }

                if let result = result {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Description")
                            .font(.headline)

                        Text(cleanDescription(result.description).toMarkdown())
                            .textSelection(.enabled)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.gray.opacity(0.15))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        if let confidence = result.confidence {
                            Text("Confidence: \(Int(confidence * 100))%")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        if let alternatives = result.alternatives, !alternatives.isEmpty {
                            Text("Alternative Descriptions")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .padding(.top, 8)

                            ForEach(alternatives, id: \.self) { alt in
                                Text(cleanDescription(alt).toMarkdown())
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

    private func loadImage(from item: PhotosPickerItem?) async {
        guard let item else {
            selectedImage = nil
            imageData = nil
            return
        }

        do {
            if let data = try await item.loadTransferable(type: Data.self) {
                imageData = data
                #if os(iOS)
                if let uiImage = UIImage(data: data) {
                    selectedImage = Image(uiImage: uiImage)
                }
                #elseif os(macOS)
                if let nsImage = NSImage(data: data) {
                    selectedImage = Image(nsImage: nsImage)
                }
                #endif
            }
        } catch {
            errorMessage = "Failed to load image: \(error.localizedDescription)"
        }
    }

    /// Clean up AI response by removing unnecessary preambles
    private func cleanDescription(_ text: String) -> String {
        var cleaned = text

        // Remove common preambles that don't add value
        let preamblesToRemove = [
            "Okay, here's a description of what I see in the image:",
            "Okay, here is a description of what I see in the image:",
            "Here's a description of what I see in the image:",
            "Here is a description of what I see in the image:",
            "Here's what I see in the image:",
            "Here is what I see in the image:",
            "I can see the following in this image:",
            "This image shows:",
            "The image shows:",
            "In this image, I can see:",
            "Let me describe what I see:",
            "Sure, here's a description:",
            "Sure, here is a description:",
        ]

        for preamble in preamblesToRemove {
            if cleaned.lowercased().hasPrefix(preamble.lowercased()) {
                cleaned = String(cleaned.dropFirst(preamble.count))
                break
            }
        }

        // Remove trailing questions like "Do you want me to focus on..."
        let trailingPatterns = [
            "Do you want me to",
            "Would you like me to",
            "Should I focus on",
            "Let me know if you",
            "Is there anything specific",
        ]

        for pattern in trailingPatterns {
            if let range = cleaned.range(of: pattern, options: .caseInsensitive) {
                // Find the start of the sentence containing this pattern
                let beforePattern = cleaned[..<range.lowerBound]
                if let lastNewline = beforePattern.lastIndex(of: "\n") {
                    cleaned = String(cleaned[...lastNewline])
                } else if let lastPeriod = beforePattern.lastIndex(of: ".") {
                    cleaned = String(cleaned[...lastPeriod])
                }
                break
            }
        }

        return cleaned.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func executeDescribeImage() {
        guard let imageData else { return }

        isLoading = true
        errorMessage = nil
        result = nil

        Task {
            do {
                let base64String = imageData.base64EncodedString()
                let params = ImageDescriptionParametersInput(imageBase64: base64String)

                DemoLogger.logInput(
                    feature: "DESCRIBE_IMAGE",
                    input: "Image data: \(imageData.count) bytes",
                    parameters: "imageBase64: \(base64String.prefix(50))..."
                )

                let input = ExecuteFeatureInput(
                    feature: .describeImage,
                    input: "",
                    parameters: FeatureParametersInput(imageDescription: params)
                )

                let executionResult = try await LocanaraClient.shared.executeFeature(input)

                if case .imageDescription(let imageResult) = executionResult.result {
                    DemoLogger.logResult(feature: "DESCRIBE_IMAGE", result: imageResult)
                    await MainActor.run {
                        self.result = imageResult
                    }
                }
            } catch {
                DemoLogger.logError(feature: "DESCRIBE_IMAGE", error: error)
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

// MARK: - Markdown Extension

extension String {
    /// Convert markdown string to AttributedString for SwiftUI Text rendering
    func toMarkdown() -> AttributedString {
        do {
            return try AttributedString(markdown: self, options: AttributedString.MarkdownParsingOptions(
                interpretedSyntax: .inlineOnlyPreservingWhitespace
            ))
        } catch {
            return AttributedString(self)
        }
    }
}

#Preview {
    DescribeImageDemo()
}
