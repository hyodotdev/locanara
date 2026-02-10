package com.locanara

import com.locanara.builtin.ChatChain
import com.locanara.builtin.ClassifyChain
import com.locanara.builtin.ExtractChain
import com.locanara.builtin.ProofreadChain
import com.locanara.builtin.RewriteChain
import com.locanara.builtin.SummarizeChain
import com.locanara.builtin.TranslateChain
import com.locanara.composable.BufferMemory
import com.locanara.composable.Chain
import com.locanara.composable.ContentFilterGuardrail
import com.locanara.composable.GuardrailResult
import com.locanara.composable.InputLengthGuardrail
import com.locanara.composable.SequentialChain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.GenerationConfig
import com.locanara.core.LocanaraModel
import com.locanara.core.ModelResponse
import com.locanara.core.OutputParser
import com.locanara.core.PromptTemplate
import com.locanara.core.TextOutputParser
import com.locanara.dsl.pipeline
import com.locanara.dsl.summarize
import com.locanara.dsl.translate
import com.locanara.dsl.proofread
import com.locanara.runtime.ChainExecutor
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// MARK: - Mock Model

class MockModel(
    private val responseGenerator: (String) -> String = { "mock response" }
) : LocanaraModel {
    override val name = "MockModel"
    override val isReady = true
    override val maxContextTokens = 4000

    override suspend fun generate(prompt: String, config: GenerationConfig?): ModelResponse {
        val text = responseGenerator(prompt)
        return ModelResponse(text = text, processingTimeMs = 5)
    }

    override fun stream(prompt: String, config: GenerationConfig?): Flow<String> = emptyFlow()
}

// MARK: - Core Layer Tests

class PromptTemplateTest {
    @Test
    fun `basic formatting`() {
        val template = PromptTemplate(
            template = "Summarize this: {text}",
            inputVariables = listOf("text")
        )
        val result = template.format(mapOf("text" to "Hello world"))
        assertEquals("Summarize this: Hello world", result)
    }

    @Test
    fun `multiple variables`() {
        val template = PromptTemplate(
            template = "Translate from {source} to {target}: {text}",
            inputVariables = listOf("source", "target", "text")
        )
        val result = template.format(
            mapOf("source" to "English", "target" to "Korean", "text" to "Hello")
        )
        assertEquals("Translate from English to Korean: Hello", result)
    }

    @Test(expected = IllegalArgumentException::class)
    fun `missing variable throws`() {
        val template = PromptTemplate(
            template = "Hello {name}",
            inputVariables = listOf("name")
        )
        template.format(emptyMap())
    }

    @Test
    fun `auto detection`() {
        val template = PromptTemplate.from("Hello {name}, welcome to {place}")
        val result = template.format(mapOf("name" to "Alice", "place" to "Locanara"))
        assertEquals("Hello Alice, welcome to Locanara", result)
    }
}

class OutputParserTest {
    @Test
    fun `text parser trims whitespace`() {
        val parser = TextOutputParser()
        val result = parser.parse("  hello world  ")
        assertEquals("hello world", result)
    }
}

class SchemaTest {
    @Test
    fun `chain input creation`() {
        val input = ChainInput(text = "hello", metadata = mutableMapOf("key" to "value"))
        assertEquals("hello", input.text)
        assertEquals("value", input.metadata["key"])
    }

    @Test
    fun `chain output typed`() {
        val result = SummarizeResult(
            summary = "test", originalLength = 100, summaryLength = 4
        )
        val output = ChainOutput(value = result, text = "test", processingTimeMs = 5)

        assertNotNull(output.typed<SummarizeResult>())
        assertEquals("test", output.typed<SummarizeResult>()?.summary)
        assertNull(output.typed<TranslateResult>()) // wrong type
    }
}

// MARK: - Built-in Chain Tests

class SummarizeChainTest {
    @Test
    fun `run returns typed result`() = runBlocking {
        val model = MockModel { "This is a summary." }
        val chain = SummarizeChain(model = model, bulletCount = 1)

        val result = chain.run("Long article text here...")

        assertEquals("This is a summary.", result.summary)
        assertEquals("Long article text here...".length, result.originalLength)
    }

    @Test
    fun `invoke returns chain output`() = runBlocking {
        val model = MockModel { "Summary text" }
        val chain = SummarizeChain(model = model)

        val output = chain.invoke(ChainInput(text = "input"))

        assertEquals("Summary text", output.text)
        assertNotNull(output.typed<SummarizeResult>())
    }
}

class ClassifyChainTest {
    @Test
    fun `run returns classify result`() = runBlocking {
        val model = MockModel { "positive" }
        val chain = ClassifyChain(
            model = model,
            categories = listOf("positive", "negative")
        )

        val result = chain.run("Great product!")

        assertEquals("positive", result.topClassification.label)
        assertEquals(1.0, result.topClassification.score, 0.001)
    }
}

class TranslateChainTest {
    @Test
    fun `run returns translate result`() = runBlocking {
        val model = MockModel { "안녕하세요" }
        val chain = TranslateChain(model = model, targetLanguage = "ko")

        val result = chain.run("Hello")

        assertEquals("안녕하세요", result.translatedText)
        assertEquals("en", result.sourceLanguage)
        assertEquals("ko", result.targetLanguage)
    }
}

class RewriteChainTest {
    @Test
    fun `run returns rewrite result`() = runBlocking {
        val model = MockModel { "Good day, how may I assist you?" }
        val chain = RewriteChain(model = model, style = RewriteOutputType.PROFESSIONAL)

        val result = chain.run("hey whats up")

        assertEquals("Good day, how may I assist you?", result.rewrittenText)
        assertEquals(RewriteOutputType.PROFESSIONAL, result.style)
    }
}

class ProofreadChainTest {
    @Test
    fun `run returns proofread result`() = runBlocking {
        val model = MockModel { "This is a test." }
        val chain = ProofreadChain(model = model)

        val result = chain.run("Ths is a tset.")

        assertEquals("This is a test.", result.correctedText)
        assertTrue(result.hasCorrections)
    }

    @Test
    fun `no corrections detected`() = runBlocking {
        val model = MockModel { "Already correct." }
        val chain = ProofreadChain(model = model)

        val result = chain.run("Already correct.")

        assertFalse(result.hasCorrections)
    }
}

class ChatChainTest {
    @Test
    fun `run returns chat result`() = runBlocking {
        val model = MockModel { "Hi there!" }
        val chain = ChatChain(model = model)

        val result = chain.run("Hello!")

        assertEquals("Hi there!", result.message)
        assertTrue(result.canContinue)
    }

    @Test
    fun `chat with memory saves entries`() = runBlocking {
        val model = MockModel { "First response" }
        val memory = BufferMemory(maxEntries = 10)
        val chain = ChatChain(model = model, memory = memory)

        chain.run("First message")

        val entries = memory.load(ChainInput(text = "test"))
        assertEquals(2, entries.size) // user + assistant
    }
}

class ExtractChainTest {
    @Test
    fun `run returns extract result`() = runBlocking {
        val model = MockModel { "Tim Cook\nCupertino" }
        val chain = ExtractChain(model = model, entityTypes = listOf("person", "location"))

        val result = chain.run("Tim Cook lives in Cupertino")

        assertEquals(2, result.entities.size)
        assertEquals("Tim Cook", result.entities[0].value)
        assertEquals("Cupertino", result.entities[1].value)
    }
}

// MARK: - Pipeline Tests

class PipelineTest {
    @Test
    fun `single step pipeline`() = runBlocking {
        val model = MockModel { "Summary of input." }

        val result = model.pipeline()
            .summarize(bulletCount = 1)
            .run("Long text here")

        // Compile-time: result is SummarizeResult
        assertEquals("Summary of input.", result.summary)
    }

    @Test
    fun `multi step pipeline type safety`() = runBlocking {
        var callCount = 0
        val model = MockModel {
            callCount++
            if (callCount == 1) "Summarized text" else "번역된 텍스트"
        }

        val result = model.pipeline()
            .summarize(bulletCount = 3)
            .translate(to = "ko")
            .run("Long article in English")

        // Compile-time: result is TranslateResult (last step)
        assertEquals("번역된 텍스트", result.translatedText)
        assertEquals("ko", result.targetLanguage)
        assertEquals(2, callCount)
    }

    @Test
    fun `three step pipeline`() = runBlocking {
        var callCount = 0
        val model = MockModel {
            callCount++
            when (callCount) {
                1 -> "Corrected text"
                2 -> "Professionally written text"
                else -> "unexpected"
            }
        }

        val result = model.pipeline()
            .proofread()
            .rewrite(style = RewriteOutputType.PROFESSIONAL)
            .run("messy text with erors")

        // Compile-time: result is RewriteResult
        assertEquals("Professionally written text", result.rewrittenText)
        assertEquals(RewriteOutputType.PROFESSIONAL, result.style)
    }

    @Test
    fun `pipeline passes text between steps`() = runBlocking {
        val receivedPrompts = mutableListOf<String>()
        val model = MockModel { prompt ->
            receivedPrompts.add(prompt)
            if (receivedPrompts.size == 1) "step1 output" else "step2 output"
        }

        model.pipeline()
            .proofread()
            .rewrite(style = RewriteOutputType.FRIENDLY)
            .run("original input")

        // Second step should receive first step's output in its prompt
        assertTrue(receivedPrompts[1].contains("step1 output"))
    }
}

// MARK: - Model Extension Tests

class ModelExtensionTest {
    @Test
    fun `summarize extension`() = runBlocking {
        val model = MockModel { "Short summary." }
        val result = model.summarize("Long text", bulletCount = 2)
        assertEquals("Short summary.", result.summary)
    }

    @Test
    fun `translate extension`() = runBlocking {
        val model = MockModel { "Hola" }
        val result = model.translate("Hello", to = "es")
        assertEquals("Hola", result.translatedText)
        assertEquals("es", result.targetLanguage)
    }

    @Test
    fun `proofread extension`() = runBlocking {
        val model = MockModel { "Fixed text." }
        val result = model.proofread("Brkn text.")
        assertEquals("Fixed text.", result.correctedText)
    }
}

// MARK: - Composable Layer Tests

class MemoryTest {
    @Test
    fun `buffer memory save and load`() = runBlocking {
        val memory = BufferMemory(maxEntries = 5)
        val input = ChainInput(text = "Hello")
        val output = ChainOutput(value = "Hi", text = "Hi")

        memory.save(input, output)

        val entries = memory.load(ChainInput(text = "test"))
        assertEquals(2, entries.size)
        assertEquals("user", entries[0].role)
        assertEquals("Hello", entries[0].content)
        assertEquals("assistant", entries[1].role)
        assertEquals("Hi", entries[1].content)
    }

    @Test
    fun `buffer memory trimming`() = runBlocking {
        val memory = BufferMemory(maxEntries = 2)

        for (i in 0 until 5) {
            memory.save(
                ChainInput(text = "msg $i"),
                ChainOutput(value = "resp $i", text = "resp $i")
            )
        }

        val entries = memory.load(ChainInput(text = "test"))
        assertTrue(entries.size <= 4) // maxEntries * 2
    }

    @Test
    fun `buffer memory clear`() = runBlocking {
        val memory = BufferMemory()
        memory.save(ChainInput(text = "hello"), ChainOutput(value = "hi", text = "hi"))
        memory.clear()

        val entries = memory.load(ChainInput(text = "test"))
        assertEquals(0, entries.size)
    }
}

class GuardrailTest {
    @Test
    fun `input length passes`() = runBlocking {
        val guardrail = InputLengthGuardrail(maxCharacters = 100)
        val result = guardrail.checkInput(ChainInput(text = "short"))
        assertTrue(result is GuardrailResult.Passed)
    }

    @Test
    fun `input length truncates`() = runBlocking {
        val guardrail = InputLengthGuardrail(maxCharacters = 5, truncate = true)
        val result = guardrail.checkInput(ChainInput(text = "longer text"))
        assertTrue(result is GuardrailResult.Modified)
        assertEquals("longe", (result as GuardrailResult.Modified).newText)
    }

    @Test
    fun `input length blocks`() = runBlocking {
        val guardrail = InputLengthGuardrail(maxCharacters = 5, truncate = false)
        val result = guardrail.checkInput(ChainInput(text = "longer text"))
        assertTrue(result is GuardrailResult.Blocked)
    }

    @Test
    fun `content filter blocks`() = runBlocking {
        val guardrail = ContentFilterGuardrail(blockedPatterns = listOf("password", "secret"))
        val blocked = guardrail.checkInput(ChainInput(text = "my password is 123"))
        assertTrue(blocked is GuardrailResult.Blocked)

        val passed = guardrail.checkInput(ChainInput(text = "Hello world"))
        assertTrue(passed is GuardrailResult.Passed)
    }
}

// MARK: - Chain Executor Tests

class ChainExecutorTest {
    @Test
    fun `execute records history`() = runBlocking {
        val model = MockModel { "result" }
        val chain = SummarizeChain(model = model)
        val executor = ChainExecutor(maxRetries = 0)

        executor.execute(chain, ChainInput(text = "test"))

        val history = executor.getHistory()
        assertEquals(1, history.size)
        assertEquals("SummarizeChain", history[0].chainName)
        assertTrue(history[0].success)
        assertEquals(1, history[0].attempt)
    }

    @Test
    fun `clear history`() = runBlocking {
        val model = MockModel { "result" }
        val chain = SummarizeChain(model = model)
        val executor = ChainExecutor()

        executor.execute(chain, ChainInput(text = "test"))
        executor.clearHistory()

        assertEquals(0, executor.getHistory().size)
    }
}

// MARK: - Sequential Chain Tests

class SequentialChainTest {
    @Test
    fun `sequential execution`() = runBlocking {
        var callCount = 0
        val model = MockModel {
            callCount++
            "step$callCount"
        }

        val chain = SequentialChain(
            chains = listOf(
                ProofreadChain(model = model),
                RewriteChain(model = model, style = RewriteOutputType.PROFESSIONAL)
            )
        )

        val output = chain.invoke(ChainInput(text = "input"))

        assertEquals(2, callCount)
        assertEquals("step2", output.text)
    }
}
