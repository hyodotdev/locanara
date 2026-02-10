import Foundation

/// A stateful AI session that manages conversation state, memory, and guardrails.
///
/// ```swift
/// let session = Session(
///     memory: BufferMemory(),
///     guardrails: [InputLengthGuardrail()]
/// )
/// let response = try await session.send("Hello!")
/// ```
@available(iOS 15.0, macOS 14.0, *)
public final class Session: @unchecked Sendable {
    public let id: String
    private let model: any LocanaraModel
    private let memory: any Memory
    private let guardrails: [any Guardrail]

    public init(
        model: (any LocanaraModel)? = nil,
        memory: (any Memory)? = nil,
        guardrails: [any Guardrail] = []
    ) {
        self.id = UUID().uuidString
        self.model = model ?? LocanaraDefaults.model
        self.memory = memory ?? BufferMemory()
        self.guardrails = guardrails
    }

    /// Send a message and get a response, maintaining conversation state
    public func send(_ message: String) async throws -> String {
        // Apply input guardrails
        var processedText = message
        for guardrail in guardrails {
            switch try await guardrail.checkInput(ChainInput(text: processedText)) {
            case .passed: continue
            case .blocked(let reason): throw LocanaraError.invalidInput("Blocked: \(reason)")
            case .modified(let newText, _): processedText = newText
            }
        }

        // Load memory and build prompt
        let input = ChainInput(text: processedText)
        let entries = await memory.load(for: input)
        var prompt = ""
        for entry in entries {
            prompt += "\(entry.role): \(entry.content)\n"
        }
        prompt += "User: \(processedText)\nAssistant:"

        let response = try await model.generate(prompt: prompt, config: .conversational)

        // Apply output guardrails
        var outputText = response.text
        let output = ChainOutput(value: outputText, text: outputText)
        for guardrail in guardrails {
            switch try await guardrail.checkOutput(output) {
            case .passed: continue
            case .blocked(let reason): throw LocanaraError.executionFailed("Blocked: \(reason)")
            case .modified(let newText, _): outputText = newText
            }
        }

        // Save to memory
        await memory.save(
            input: input,
            output: ChainOutput(value: outputText, text: outputText)
        )

        return outputText
    }

    /// Run a built-in chain within this session context
    public func run(_ chain: any Chain, input: String) async throws -> ChainOutput {
        try await chain.invoke(ChainInput(text: input))
    }

    /// Clear session memory
    public func reset() async {
        await memory.clear()
    }
}
