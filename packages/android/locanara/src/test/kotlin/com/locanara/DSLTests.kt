package com.locanara

import com.locanara.dsl.pipeline
import com.locanara.dsl.proofread
import com.locanara.dsl.summarize
import com.locanara.dsl.translate
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

// MARK: - Pipeline DSL Tests

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
