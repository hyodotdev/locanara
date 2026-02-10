import SwiftUI
import Locanara

/// Demonstrates LocanaraModel — direct model usage with GenerationConfig presets and streaming
struct ModelDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var inputText = "Explain what on-device AI means in one sentence."
    @State private var selectedPreset = ConfigPreset.conversational
    @State private var resultText: String?
    @State private var processingTime: Int?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var useStreaming = false
    @State private var streamedText = ""

    private enum ConfigPreset: String, CaseIterable, Identifiable {
        case structured
        case creative
        case conversational

        var id: String { rawValue }

        var title: String {
            switch self {
            case .structured: return "Structured"
            case .creative: return "Creative"
            case .conversational: return "Conversational"
            }
        }

        var description: String {
            switch self {
            case .structured: return "temp 0.2, topK 16 — precise, factual"
            case .creative: return "temp 0.8, topK 40 — varied, expressive"
            case .conversational: return "temp 0.7, topK 40 — natural, balanced"
            }
        }

        var config: GenerationConfig {
            switch self {
            case .structured: return .structured
            case .creative: return .creative
            case .conversational: return .conversational
            }
        }
    }

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
                let model = FoundationLanguageModel()

                // Direct generation with config presets
                let response = try await model.generate(
                    prompt: "Your prompt here",
                    config: .\(selectedPreset.rawValue)
                )
                print(response.text)
                print(response.processingTimeMs)

                // Streaming
                for try await chunk in model.stream(prompt: "...") {
                    print(chunk)
                }
                """)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Prompt")
                        .font(.headline)
                    TextEditor(text: $inputText)
                        .frame(minHeight: 100)
                        .padding(8)
                        .background(Color.gray.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .disabled(isLoading)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("GenerationConfig Preset")
                        .font(.headline)
                    Picker("Preset", selection: $selectedPreset) {
                        ForEach(ConfigPreset.allCases) { preset in
                            Text(preset.title).tag(preset)
                        }
                    }
                    .pickerStyle(.segmented)

                    Text(selectedPreset.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Toggle("Use Streaming", isOn: $useStreaming)
                    .font(.headline)

                Button(action: executeModel) {
                    HStack(spacing: 8) {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text(isLoading ? "Generating..." : "Generate")
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

                if useStreaming && !streamedText.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Streamed Output", systemImage: "text.line.first.and.arrowtriangle.forward")
                            .font(.headline)
                            .foregroundStyle(.blue)
                        Text(streamedText)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.blue.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .animation(.easeInOut(duration: 0.1), value: streamedText)
                    }
                }

                if let resultText {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Model Response", systemImage: "cpu")
                            .font(.headline)
                            .foregroundStyle(.green)
                        Text(resultText)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.green.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        if let processingTime {
                            HStack(spacing: 12) {
                                StatBadge(label: "Time", value: "\(processingTime)ms")
                                StatBadge(label: "Config", value: selectedPreset.title)
                            }
                        }
                    }
                }
            }
            .padding()
        }
    }

    private func executeModel() {
        isLoading = true
        errorMessage = nil
        resultText = nil
        streamedText = ""
        processingTime = nil

        Task {
            do {
                let model = FoundationLanguageModel()
                let config = selectedPreset.config

                if useStreaming {
                    let startTime = Date()
                    var accumulated = ""
                    for try await chunk in model.stream(prompt: inputText, config: config) {
                        accumulated += chunk
                        await MainActor.run { self.streamedText = accumulated }
                    }
                    let elapsed = Int(Date().timeIntervalSince(startTime) * 1000)
                    await MainActor.run {
                        self.resultText = accumulated
                        self.processingTime = elapsed
                    }
                } else {
                    let response = try await model.generate(prompt: inputText, config: config)
                    await MainActor.run {
                        self.resultText = response.text
                        self.processingTime = response.processingTimeMs
                    }
                }

            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isLoading = false }
        }
    }
}
