import XCTest
@testable import Locanara

// MARK: - Mock Model

@available(iOS 15.0, macOS 14.0, *)
struct MockModel: LocanaraModel {
    let name = "MockModel"
    let isReady = true
    let maxContextTokens = 4000

    /// Custom response generator for testing different scenarios
    var responseGenerator: @Sendable (String) -> String = { _ in "mock response" }

    func generate(prompt: String, config: GenerationConfig?) async throws -> ModelResponse {
        let text = responseGenerator(prompt)
        return ModelResponse(text: text, processingTimeMs: 5)
    }

    func stream(prompt: String, config: GenerationConfig?) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            continuation.yield("mock ")
            continuation.yield("stream")
            continuation.finish()
        }
    }
}

// MARK: - Core Layer Tests

@available(iOS 15.0, macOS 14.0, *)
final class PromptTemplateTests: XCTestCase {

    func testBasicFormatting() throws {
        let template = PromptTemplate(
            templateString: "Summarize this: {text}",
            inputVariables: ["text"]
        )
        let result = try template.format(["text": "Hello world"])
        XCTAssertEqual(result, "Summarize this: Hello world")
    }

    func testMultipleVariables() throws {
        let template = PromptTemplate(
            templateString: "Translate from {source} to {target}: {text}",
            inputVariables: ["source", "target", "text"]
        )
        let result = try template.format([
            "source": "English",
            "target": "Korean",
            "text": "Hello"
        ])
        XCTAssertEqual(result, "Translate from English to Korean: Hello")
    }

    func testMissingVariableThrows() {
        let template = PromptTemplate(
            templateString: "Hello {name}",
            inputVariables: ["name"]
        )
        XCTAssertThrowsError(try template.format([:]))
    }

    func testAutoDetection() throws {
        let template = PromptTemplate.from("Hello {name}, welcome to {place}")
        let result = try template.format(["name": "Alice", "place": "Locanara"])
        XCTAssertEqual(result, "Hello Alice, welcome to Locanara")
    }
}

@available(iOS 15.0, macOS 14.0, *)
final class OutputParserTests: XCTestCase {

    func testTextParser() throws {
        let parser = TextOutputParser()
        let result: String = try parser.parse("  hello world  ")
        XCTAssertEqual(result, "hello world")
    }

    func testListParser() throws {
        let parser = ListOutputParser(delimiter: ", ")
        let result: [String] = try parser.parse("apple, banana, cherry")
        XCTAssertEqual(result, ["apple", "banana", "cherry"])
    }
}

@available(iOS 15.0, macOS 14.0, *)
final class SchemaTests: XCTestCase {

    func testChainInputCreation() {
        let input = ChainInput(text: "hello", metadata: ["key": "value"])
        XCTAssertEqual(input.text, "hello")
        XCTAssertEqual(input.metadata["key"], "value")
    }

    func testChainOutputTyped() {
        let result = SummarizeResult(
            summary: "test", originalLength: 100, summaryLength: 4
        )
        let output = ChainOutput(value: result, text: "test", processingTimeMs: 5)

        XCTAssertNotNil(output.typed(SummarizeResult.self))
        XCTAssertEqual(output.typed(SummarizeResult.self)?.summary, "test")
        XCTAssertNil(output.typed(TranslateResult.self)) // wrong type
    }
}

// MARK: - Built-in Chain Tests

@available(iOS 15.0, macOS 14.0, *)
final class SummarizeChainTests: XCTestCase {

    func testRunReturnsTypedResult() async throws {
        let model = MockModel(responseGenerator: { _ in "This is a summary." })
        let chain = SummarizeChain(model: model, bulletCount: 1)

        let result = try await chain.run("Long article text here...")

        XCTAssertEqual(result.summary, "This is a summary.")
        XCTAssertEqual(result.originalLength, "Long article text here...".count)
        XCTAssertEqual(result.summaryLength, "This is a summary.".count)
    }

    func testInvokeReturnsChainOutput() async throws {
        let model = MockModel(responseGenerator: { _ in "Summary text" })
        let chain = SummarizeChain(model: model)

        let output = try await chain.invoke(ChainInput(text: "input"))

        XCTAssertEqual(output.text, "Summary text")
        XCTAssertNotNil(output.typed(SummarizeResult.self))
    }
}

@available(iOS 15.0, macOS 14.0, *)
final class ClassifyChainTests: XCTestCase {

    func testRunReturnsClassifyResult() async throws {
        let model = MockModel(responseGenerator: { _ in "positive" })
        let chain = ClassifyChain(
            model: model,
            categories: ["positive", "negative"]
        )

        let result = try await chain.run("Great product!")

        XCTAssertEqual(result.topClassification.label, "positive")
        XCTAssertEqual(result.topClassification.score, 1.0)
        XCTAssertEqual(result.classifications.count, 1)
    }
}

@available(iOS 15.0, macOS 14.0, *)
final class TranslateChainTests: XCTestCase {

    func testRunReturnsTranslateResult() async throws {
        let model = MockModel(responseGenerator: { _ in "안녕하세요" })
        let chain = TranslateChain(model: model, targetLanguage: "ko")

        let result = try await chain.run("Hello")

        XCTAssertEqual(result.translatedText, "안녕하세요")
        XCTAssertEqual(result.sourceLanguage, "en")
        XCTAssertEqual(result.targetLanguage, "ko")
    }
}

@available(iOS 15.0, macOS 14.0, *)
final class RewriteChainTests: XCTestCase {

    func testRunReturnsRewriteResult() async throws {
        let model = MockModel(responseGenerator: { _ in "Good day, how may I assist you?" })
        let chain = RewriteChain(model: model, style: .professional)

        let result = try await chain.run("hey whats up")

        XCTAssertEqual(result.rewrittenText, "Good day, how may I assist you?")
        XCTAssertEqual(result.style, .professional)
    }
}

@available(iOS 15.0, macOS 14.0, *)
final class ProofreadChainTests: XCTestCase {

    func testRunReturnsProofreadResult() async throws {
        let model = MockModel(responseGenerator: { _ in "This is a test." })
        let chain = ProofreadChain(model: model)

        let result = try await chain.run("Ths is a tset.")

        XCTAssertEqual(result.correctedText, "This is a test.")
        XCTAssertTrue(result.hasCorrections)
    }

    func testNoCorrections() async throws {
        let model = MockModel(responseGenerator: { _ in "Already correct." })
        let chain = ProofreadChain(model: model)

        let result = try await chain.run("Already correct.")

        XCTAssertFalse(result.hasCorrections)
    }
}

@available(iOS 15.0, macOS 14.0, *)
final class ChatChainTests: XCTestCase {

    func testRunReturnsChatResult() async throws {
        let model = MockModel(responseGenerator: { _ in "Hi there!" })
        let chain = ChatChain(model: model)

        let result = try await chain.run("Hello!")

        XCTAssertEqual(result.message, "Hi there!")
        XCTAssertTrue(result.canContinue)
    }

    func testChatWithMemory() async throws {
        let model = MockModel(responseGenerator: { prompt in
            if prompt.contains("Previous question") {
                return "I remember the context"
            }
            return "First response"
        })
        let memory = BufferMemory(maxEntries: 10)
        let chain = ChatChain(model: model, memory: memory)

        let first = try await chain.run("First message")
        XCTAssertEqual(first.message, "First response")

        // Memory should now contain the first exchange
        let entries = await memory.load(for: ChainInput(text: "test"))
        XCTAssertEqual(entries.count, 2) // user + assistant
    }
}

@available(iOS 15.0, macOS 14.0, *)
final class ExtractChainTests: XCTestCase {

    func testRunReturnsExtractResult() async throws {
        let model = MockModel(responseGenerator: { _ in "Tim Cook\nCupertino" })
        let chain = ExtractChain(model: model, entityTypes: ["person", "location"])

        let result = try await chain.run("Tim Cook lives in Cupertino")

        XCTAssertEqual(result.entities.count, 2)
        XCTAssertEqual(result.entities[0].value, "Tim Cook")
        XCTAssertEqual(result.entities[1].value, "Cupertino")
    }
}

// MARK: - Pipeline Tests

@available(iOS 15.0, macOS 14.0, *)
final class PipelineTests: XCTestCase {

    func testSingleStepPipeline() async throws {
        let model = MockModel(responseGenerator: { _ in "Summary of input." })

        let result = try await model.pipeline {
            Summarize(bulletCount: 1)
        }.run("Long text here")

        // Compile-time: result is SummarizeResult
        XCTAssertEqual(result.summary, "Summary of input.")
    }

    func testMultiStepPipelineTypeSafety() async throws {
        var callCount = 0
        let model = MockModel(responseGenerator: { prompt in
            callCount += 1
            if callCount == 1 {
                return "Summarized text"  // First step: summarize
            } else {
                return "번역된 텍스트"  // Second step: translate
            }
        })

        let result = try await model.pipeline {
            Summarize(bulletCount: 3)
            Translate(to: "ko")
        }.run("Long article in English")

        // Compile-time: result is TranslateResult (last step)
        XCTAssertEqual(result.translatedText, "번역된 텍스트")
        XCTAssertEqual(result.targetLanguage, "ko")
        XCTAssertEqual(callCount, 2)
    }

    func testThreeStepPipeline() async throws {
        var callCount = 0
        let model = MockModel(responseGenerator: { _ in
            callCount += 1
            switch callCount {
            case 1: return "Corrected text"
            case 2: return "Professionally written text"
            default: return "unexpected"
            }
        })

        let result = try await model.pipeline {
            Proofread()
            Rewrite(style: .professional)
        }.run("messy text with erors")

        // Compile-time: result is RewriteResult
        XCTAssertEqual(result.rewrittenText, "Professionally written text")
        XCTAssertEqual(result.style, .professional)
        XCTAssertEqual(callCount, 2)
    }

    func testPipelinePassesTextBetweenSteps() async throws {
        var receivedPrompts: [String] = []
        let model = MockModel(responseGenerator: { prompt in
            receivedPrompts.append(prompt)
            if receivedPrompts.count == 1 {
                return "step1 output"
            }
            return "step2 output"
        })

        _ = try await model.pipeline {
            Proofread()
            Rewrite(style: .friendly)
        }.run("original input")

        // Second step should receive first step's output text in its prompt
        XCTAssertTrue(receivedPrompts[1].contains("step1 output"))
    }
}

// MARK: - Model Extension Tests

@available(iOS 15.0, macOS 14.0, *)
final class ModelExtensionTests: XCTestCase {

    func testSummarizeExtension() async throws {
        let model = MockModel(responseGenerator: { _ in "Short summary." })
        let result = try await model.summarize("Long text", bulletCount: 2)
        XCTAssertEqual(result.summary, "Short summary.")
    }

    func testTranslateExtension() async throws {
        let model = MockModel(responseGenerator: { _ in "Hola" })
        let result = try await model.translate("Hello", to: "es")
        XCTAssertEqual(result.translatedText, "Hola")
        XCTAssertEqual(result.targetLanguage, "es")
    }

    func testProofreadExtension() async throws {
        let model = MockModel(responseGenerator: { _ in "Fixed text." })
        let result = try await model.proofread("Brkn text.")
        XCTAssertEqual(result.correctedText, "Fixed text.")
    }

    func testClassifyExtension() async throws {
        let model = MockModel(responseGenerator: { _ in "negative" })
        let result = try await model.classify("Terrible product", categories: ["positive", "negative"])
        XCTAssertEqual(result.topClassification.label, "negative")
    }

    func testRewriteExtension() async throws {
        let model = MockModel(responseGenerator: { _ in "Greetings!" })
        let result = try await model.rewrite("hey", style: .professional)
        XCTAssertEqual(result.rewrittenText, "Greetings!")
    }
}

// MARK: - Composable Layer Tests

@available(iOS 15.0, macOS 14.0, *)
final class MemoryTests: XCTestCase {

    func testBufferMemorySaveAndLoad() async {
        let memory = BufferMemory(maxEntries: 5)
        let input = ChainInput(text: "Hello")
        let output = ChainOutput(value: "Hi", text: "Hi")

        await memory.save(input: input, output: output)

        let entries = await memory.load(for: ChainInput(text: "test"))
        XCTAssertEqual(entries.count, 2) // user + assistant
        XCTAssertEqual(entries[0].role, "user")
        XCTAssertEqual(entries[0].content, "Hello")
        XCTAssertEqual(entries[1].role, "assistant")
        XCTAssertEqual(entries[1].content, "Hi")
    }

    func testBufferMemoryTrimming() async {
        let memory = BufferMemory(maxEntries: 2)

        for i in 0..<5 {
            await memory.save(
                input: ChainInput(text: "msg \(i)"),
                output: ChainOutput(value: "resp \(i)", text: "resp \(i)")
            )
        }

        let entries = await memory.load(for: ChainInput(text: "test"))
        XCTAssertLessThanOrEqual(entries.count, 4) // maxEntries * 2
    }

    func testBufferMemoryClear() async {
        let memory = BufferMemory()
        await memory.save(
            input: ChainInput(text: "hello"),
            output: ChainOutput(value: "hi", text: "hi")
        )
        await memory.clear()

        let entries = await memory.load(for: ChainInput(text: "test"))
        XCTAssertEqual(entries.count, 0)
    }
}

@available(iOS 15.0, macOS 14.0, *)
final class GuardrailTests: XCTestCase {

    func testInputLengthGuardrailPasses() async throws {
        let guardrail = InputLengthGuardrail(maxCharacters: 100)
        let result = try await guardrail.checkInput(ChainInput(text: "short"))
        XCTAssertEqual(result, .passed)
    }

    func testInputLengthGuardrailTruncates() async throws {
        let guardrail = InputLengthGuardrail(maxCharacters: 5, truncate: true)
        let result = try await guardrail.checkInput(ChainInput(text: "longer text"))
        if case .modified(let newText, _) = result {
            XCTAssertEqual(newText, "longe")
        } else {
            XCTFail("Expected modified result")
        }
    }

    func testInputLengthGuardrailBlocks() async throws {
        let guardrail = InputLengthGuardrail(maxCharacters: 5, truncate: false)
        let result = try await guardrail.checkInput(ChainInput(text: "longer text"))
        if case .blocked = result {
            // expected
        } else {
            XCTFail("Expected blocked result")
        }
    }

    func testContentFilterGuardrail() async throws {
        let guardrail = ContentFilterGuardrail(blockedPatterns: ["password", "secret"])
        let blocked = try await guardrail.checkInput(ChainInput(text: "my password is 123"))
        if case .blocked = blocked {
            // expected
        } else {
            XCTFail("Expected blocked result")
        }

        let passed = try await guardrail.checkInput(ChainInput(text: "Hello world"))
        XCTAssertEqual(passed, .passed)
    }
}

// MARK: - Chain Executor Tests

@available(iOS 15.0, macOS 14.0, *)
final class ChainExecutorTests: XCTestCase {

    func testExecuteRecordsHistory() async throws {
        let model = MockModel(responseGenerator: { _ in "result" })
        let chain = SummarizeChain(model: model)
        let executor = ChainExecutor(maxRetries: 0)

        _ = try await executor.execute(chain, input: ChainInput(text: "test"))

        let history = executor.getHistory()
        XCTAssertEqual(history.count, 1)
        XCTAssertEqual(history[0].chainName, "SummarizeChain")
        XCTAssertTrue(history[0].success)
        XCTAssertEqual(history[0].attempt, 1)
    }

    func testClearHistory() async throws {
        let model = MockModel(responseGenerator: { _ in "result" })
        let chain = SummarizeChain(model: model)
        let executor = ChainExecutor()

        _ = try await executor.execute(chain, input: ChainInput(text: "test"))
        executor.clearHistory()

        XCTAssertEqual(executor.getHistory().count, 0)
    }
}

// MARK: - Sequential Chain Tests

@available(iOS 15.0, macOS 14.0, *)
final class SequentialChainTests: XCTestCase {

    func testSequentialExecution() async throws {
        var callCount = 0
        let model = MockModel(responseGenerator: { _ in
            callCount += 1
            return "step\(callCount)"
        })

        let chain = SequentialChain(chains: [
            ProofreadChain(model: model),
            RewriteChain(model: model, style: .professional)
        ])

        let output = try await chain.invoke(ChainInput(text: "input"))

        XCTAssertEqual(callCount, 2)
        XCTAssertEqual(output.text, "step2")
    }
}

// MARK: - GuardrailResult Equatable (for testing)

extension GuardrailResult: Equatable {
    public static func == (lhs: GuardrailResult, rhs: GuardrailResult) -> Bool {
        switch (lhs, rhs) {
        case (.passed, .passed): return true
        case (.blocked(let a), .blocked(let b)): return a == b
        case (.modified(let a1, let a2), .modified(let b1, let b2)):
            return a1 == b1 && a2 == b2
        default: return false
        }
    }
}
