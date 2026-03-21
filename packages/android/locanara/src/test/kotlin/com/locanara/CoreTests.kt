package com.locanara

import com.locanara.builtin.SummarizeChain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.OutputParser
import com.locanara.core.PromptTemplate
import com.locanara.core.TextOutputParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

// MARK: - Core Layer Tests

class PromptTemplateTest {
    @Test
    fun `basic formatting`() {
        val template = PromptTemplate(
            templateString = "Summarize this: {text}",
            inputVariables = listOf("text")
        )
        val result = template.format(mapOf("text" to "Hello world"))
        assertEquals("Summarize this: Hello world", result)
    }

    @Test
    fun `multiple variables`() {
        val template = PromptTemplate(
            templateString = "Translate from {source} to {target}: {text}",
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
            templateString = "Hello {name}",
            inputVariables = listOf("name")
        )
        template.format(emptyMap())
    }

    @Test
    fun `auto detection`() {
        val template = PromptTemplate.from("Hello {name}, welcome to {place}")
        assertEquals(listOf("name", "place"), template.inputVariables)
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
