import Foundation

// MARK: - Guardrail Result

/// Result of a guardrail check
public enum GuardrailResult: Sendable {
    case passed
    case blocked(reason: String)
    case modified(newText: String, reason: String)
}

// MARK: - Guardrail Protocol

/// Protocol for input/output validation and safety.
///
/// ```swift
/// let guardrail = InputLengthGuardrail(maxCharacters: 4000)
/// let result = try await guardrail.checkInput(input)
/// ```
public protocol Guardrail: Sendable {
    var name: String { get }

    /// Check input before it reaches the model
    func checkInput(_ input: ChainInput) async throws -> GuardrailResult

    /// Check output before it is returned to the caller
    func checkOutput(_ output: ChainOutput) async throws -> GuardrailResult
}

// MARK: - Input Length Guardrail

/// Validates input length against model constraints
public struct InputLengthGuardrail: Guardrail {
    public let name = "InputLengthGuardrail"
    private let maxCharacters: Int
    private let truncate: Bool

    public init(maxCharacters: Int = 16000, truncate: Bool = true) {
        self.maxCharacters = maxCharacters
        self.truncate = truncate
    }

    public func checkInput(_ input: ChainInput) async throws -> GuardrailResult {
        if input.text.count <= maxCharacters { return .passed }
        if truncate {
            return .modified(
                newText: String(input.text.prefix(maxCharacters)),
                reason: "Input truncated from \(input.text.count) to \(maxCharacters) characters"
            )
        }
        return .blocked(reason: "Input exceeds maximum length of \(maxCharacters) characters")
    }

    public func checkOutput(_ output: ChainOutput) async throws -> GuardrailResult { .passed }
}

// MARK: - Content Filter Guardrail

/// Blocks or filters sensitive content patterns
public struct ContentFilterGuardrail: Guardrail {
    public let name = "ContentFilterGuardrail"
    private let blockedPatterns: [String]

    public init(blockedPatterns: [String] = []) {
        self.blockedPatterns = blockedPatterns
    }

    public func checkInput(_ input: ChainInput) async throws -> GuardrailResult {
        for pattern in blockedPatterns {
            if input.text.localizedCaseInsensitiveContains(pattern) {
                return .blocked(reason: "Input contains blocked content pattern")
            }
        }
        return .passed
    }

    public func checkOutput(_ output: ChainOutput) async throws -> GuardrailResult {
        for pattern in blockedPatterns {
            if output.text.localizedCaseInsensitiveContains(pattern) {
                return .blocked(reason: "Output contains blocked content pattern")
            }
        }
        return .passed
    }
}

// MARK: - Guarded Chain

/// Wraps a chain with guardrail checks on input and output
@available(iOS 15.0, macOS 14.0, *)
public struct GuardedChain: Chain {
    public let name: String
    private let chain: any Chain
    private let guardrails: [any Guardrail]

    public init(name: String? = nil, chain: any Chain, guardrails: [any Guardrail]) {
        self.name = name ?? "Guarded(\(chain.name))"
        self.chain = chain
        self.guardrails = guardrails
    }

    public func invoke(_ input: ChainInput) async throws -> ChainOutput {
        var currentInput = input

        // Check input guardrails
        for guardrail in guardrails {
            switch try await guardrail.checkInput(currentInput) {
            case .passed:
                continue
            case .blocked(let reason):
                throw LocanaraError.invalidInput("Blocked by \(guardrail.name): \(reason)")
            case .modified(let newText, _):
                currentInput = ChainInput(text: newText, metadata: currentInput.metadata)
            }
        }

        // Execute chain
        let output = try await chain.invoke(currentInput)

        // Check output guardrails
        for guardrail in guardrails {
            switch try await guardrail.checkOutput(output) {
            case .passed:
                continue
            case .blocked(let reason):
                throw LocanaraError.executionFailed("Output blocked by \(guardrail.name): \(reason)")
            case .modified(let newText, _):
                return ChainOutput(
                    value: newText,
                    text: newText,
                    metadata: output.metadata,
                    processingTimeMs: output.processingTimeMs
                )
            }
        }

        return output
    }
}
