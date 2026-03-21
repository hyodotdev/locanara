package com.locanara

import com.locanara.builtin.ProofreadChain
import com.locanara.builtin.RewriteChain
import com.locanara.builtin.SummarizeChain
import com.locanara.composable.BufferMemory
import com.locanara.composable.ContentFilterGuardrail
import com.locanara.composable.GuardrailResult
import com.locanara.composable.InputLengthGuardrail
import com.locanara.composable.SequentialChain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.runtime.ChainExecutor
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

// MARK: - Memory Tests

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

// MARK: - Guardrail Tests

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
