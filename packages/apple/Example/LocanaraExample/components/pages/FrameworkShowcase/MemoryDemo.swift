import SwiftUI
import Locanara

/// Demonstrates Memory — standalone BufferMemory and SummaryMemory without Session
struct MemoryDemo: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedType = MemoryType.buffer
    @State private var userInput = ""
    @State private var assistantInput = ""
    @State private var entries: [MemoryEntry] = []
    @State private var tokenCount: Int = 0
    @State private var errorMessage: String?
    @State private var infoMessage: String?

    @State private var bufferMemory = BufferMemory(maxEntries: 4, maxTokens: 500)
    @State private var summaryMemory: SummaryMemory?

    private enum MemoryType: String, CaseIterable, Identifiable {
        case buffer
        case summary

        var id: String { rawValue }
        var title: String {
            switch self {
            case .buffer: return "BufferMemory"
            case .summary: return "SummaryMemory"
            }
        }
    }

    private var isAIAvailable: Bool {
        appState.currentEngine != .none && appState.isModelReady
    }

    private var codePattern: String {
        switch selectedType {
        case .buffer:
            return """
            // BufferMemory — keeps last N conversation turns
            let memory = BufferMemory(maxEntries: 4, maxTokens: 500)

            // Save a conversation exchange
            await memory.save(
                input: ChainInput(text: "What is AI?"),
                output: ChainOutput(value: "AI is...", text: "AI is...")
            )

            // Load all entries
            let entries = await memory.load(for: ChainInput(text: ""))
            let tokens = memory.estimatedTokenCount

            // When maxEntries (4) is exceeded, oldest entries are removed
            """
        case .summary:
            return """
            // SummaryMemory — compresses older entries using the model
            let memory = SummaryMemory(
                recentWindowSize: 2  // keep 2 recent turns verbatim
            )

            // Save multiple exchanges
            await memory.save(input: ..., output: ...)

            // Older entries get summarized into a compressed form
            let entries = await memory.load(for: ChainInput(text: ""))
            // First entry may be a "system" summary of older messages
            """
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if !isAIAvailable && selectedType == .summary {
                    AIModelRequiredBanner()
                }

                CodePatternView(code: codePattern)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Memory Type")
                        .font(.headline)
                    Picker("Type", selection: $selectedType) {
                        ForEach(MemoryType.allCases) { type in
                            Text(type.title).tag(type)
                        }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: selectedType) { _, _ in
                        Task { await refreshEntries() }
                    }

                    Text(selectedType == .buffer
                         ? "Keeps last 4 entries, max 500 tokens. Oldest removed when full."
                         : "Keeps 2 recent turns verbatim, compresses older ones into summary.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                // Manual save section
                VStack(alignment: .leading, spacing: 8) {
                    Text("Add Conversation Turn")
                        .font(.headline)

                    TextField("User message", text: $userInput)
                        .textFieldStyle(.roundedBorder)

                    TextField("Assistant response", text: $assistantInput)
                        .textFieldStyle(.roundedBorder)

                    HStack(spacing: 12) {
                        Button("Save Turn") {
                            Task { await saveTurn() }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(userInput.isEmpty || assistantInput.isEmpty)

                        Button("Clear All") {
                            Task { await clearMemory() }
                        }
                        .buttonStyle(.bordered)
                        .tint(.red)
                        .disabled(entries.isEmpty)
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                        .font(.caption)
                }

                if let infoMessage {
                    Text(infoMessage)
                        .foregroundStyle(.blue)
                        .font(.caption)
                }

                // Memory state
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Memory State")
                            .font(.headline)
                        Spacer()
                        HStack(spacing: 12) {
                            StatBadge(
                                label: "Entries",
                                value: selectedType == .buffer
                                    ? "\(entries.count) / 4"
                                    : "\(entries.count)"
                            )
                            StatBadge(
                                label: "Tokens",
                                value: selectedType == .buffer
                                    ? "\(tokenCount) / 500"
                                    : "\(tokenCount)"
                            )
                        }
                    }

                    if entries.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "tray")
                                .font(.largeTitle)
                                .foregroundStyle(.secondary)
                            Text("Memory is empty")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Text("Add conversation turns above to see memory behavior")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 30)
                    } else {
                        ForEach(Array(entries.enumerated()), id: \.offset) { i, entry in
                            HStack(alignment: .top, spacing: 10) {
                                Text(roleIcon(entry.role))
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(.white)
                                    .frame(width: 24, height: 24)
                                    .background(roleColor(entry.role))
                                    .clipShape(Circle())

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(roleLabel(entry.role))
                                        .font(.caption2.weight(.semibold))
                                        .foregroundStyle(.secondary)
                                    Text(entry.content)
                                        .font(.caption)
                                        .lineLimit(4)
                                }

                                Spacer()

                                Text("#\(i + 1)")
                                    .font(.caption2)
                                    .foregroundStyle(.tertiary)
                            }
                            .padding(10)
                            .background(roleColor(entry.role).opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
            }
            .padding()
        }
        .task {
            if summaryMemory == nil {
                summaryMemory = SummaryMemory(
                    recentWindowSize: 2
                )
            }
        }
    }

    private func roleIcon(_ role: String) -> String {
        switch role {
        case "user": return "U"
        case "assistant": return "A"
        case "system": return "S"
        default: return "?"
        }
    }

    private func roleColor(_ role: String) -> Color {
        switch role {
        case "user": return .blue
        case "assistant": return .gray
        case "system": return .orange
        default: return .gray
        }
    }

    private func roleLabel(_ role: String) -> String {
        switch role {
        case "user": return "User"
        case "assistant": return "Assistant"
        case "system": return "Summary"
        default: return role
        }
    }

    private var currentMemory: any Memory {
        switch selectedType {
        case .buffer: return bufferMemory
        case .summary: return summaryMemory ?? bufferMemory
        }
    }

    private func saveTurn() async {
        errorMessage = nil
        infoMessage = nil

        let input = ChainInput(text: userInput)
        let output = ChainOutput(
            value: assistantInput as any Sendable,
            text: assistantInput,
            metadata: [:],
            processingTimeMs: nil
        )

        let countBefore = entries.count
        await currentMemory.save(input: input, output: output)
        await refreshEntries()

        userInput = ""
        assistantInput = ""

        if selectedType == .buffer && entries.count <= countBefore && countBefore > 0 {
            infoMessage = "BufferMemory trimmed oldest entries to stay within limits"
        }
    }

    private func clearMemory() async {
        await currentMemory.clear()
        await refreshEntries()
        infoMessage = "Memory cleared"
    }

    private func refreshEntries() async {
        let loaded = await currentMemory.load(for: ChainInput(text: ""))
        let tokens = currentMemory.estimatedTokenCount
        await MainActor.run {
            self.entries = loaded
            self.tokenCount = tokens
        }
    }
}
