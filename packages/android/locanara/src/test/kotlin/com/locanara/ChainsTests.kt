package com.locanara

import com.locanara.builtin.ChatChain
import com.locanara.builtin.ClassifyChain
import com.locanara.builtin.ExtractChain
import com.locanara.builtin.ProofreadChain
import com.locanara.builtin.RewriteChain
import com.locanara.builtin.SummarizeChain
import com.locanara.builtin.TranslateChain
import com.locanara.composable.BufferMemory
import com.locanara.core.ChainInput
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

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
