package com.locanara

import com.locanara.builtin.ChatChain
import com.locanara.builtin.ClassifyChain
import com.locanara.builtin.ExtractChain
import com.locanara.builtin.ProofreadChain
import com.locanara.builtin.RewriteChain
import com.locanara.builtin.SummarizeChain
import com.locanara.builtin.TranslateChain
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals

import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

// MARK: - Error Handling Tests

class ErrorHandlingTest {

    // --- LocanaraException property tests ---

    @Test
    fun `ModelBusy has correct message and code`() {
        val exception = LocanaraException.ModelBusy
        val message = requireNotNull(exception.message)
        assertTrue(message.contains("busy"))
        assertEquals(ErrorCode.MODEL_BUSY, exception.code)
    }

    @Test
    fun `BackgroundUseBlocked has correct message and code`() {
        val exception = LocanaraException.BackgroundUseBlocked
        val message = requireNotNull(exception.message)
        assertTrue(message.contains("foreground"))
        assertEquals(ErrorCode.BACKGROUND_USE_BLOCKED, exception.code)
    }

    @Test
    fun `ExecutionFailed preserves reason in message`() {
        val exception = LocanaraException.ExecutionFailed("something went wrong")
        val message = requireNotNull(exception.message)
        assertTrue(message.contains("something went wrong"))
        assertEquals(ErrorCode.EXECUTION_FAILED, exception.code)
    }

    @Test
    fun `ExecutionFailed preserves cause`() {
        val cause = RuntimeException("root cause")
        val exception = LocanaraException.ExecutionFailed("wrapped", cause)
        assertEquals(cause, exception.cause)
    }

    @Test
    fun `InvalidInput has correct code`() {
        val exception = LocanaraException.InvalidInput("too short")
        val message = requireNotNull(exception.message)
        assertTrue(message.contains("too short"))
        assertEquals(ErrorCode.INVALID_INPUT, exception.code)
    }

    @Test
    fun `DeviceNotSupported has correct code`() {
        val exception: LocanaraException = LocanaraException.DeviceNotSupported
        assertEquals(ErrorCode.DEVICE_NOT_SUPPORTED, exception.code)
    }

    @Test
    fun `PermissionDenied has correct code`() {
        val exception = LocanaraException.PermissionDenied
        assertEquals(ErrorCode.PERMISSION_DENIED, exception.code)
    }

    // --- Chain error propagation tests ---

    @Test
    fun `SummarizeChain propagates LocanaraException from model`() {
        val chain = SummarizeChain(model = failingModel(LocanaraException.ExecutionFailed("model timeout")))
        try {
            runBlocking { chain.run("test text") }
            fail("Expected LocanaraException.ExecutionFailed")
        } catch (e: LocanaraException.ExecutionFailed) {
            val message = requireNotNull(e.message)
            assertTrue(message.contains("model timeout"))
        }
    }

    @Test
    fun `ClassifyChain propagates LocanaraException from model`() {
        val chain = ClassifyChain(model = failingModel(LocanaraException.ModelBusy), categories = listOf("a", "b"))
        try {
            runBlocking { chain.run("text") }
            fail("Expected LocanaraException.ModelBusy")
        } catch (e: LocanaraException) {
            assertTrue(e is LocanaraException.ModelBusy)
        }
    }

    @Test
    fun `TranslateChain propagates LocanaraException from model`() {
        val chain = TranslateChain(model = failingModel(LocanaraException.BackgroundUseBlocked), targetLanguage = "ko")
        try {
            runBlocking { chain.run("hello") }
            fail("Expected LocanaraException.BackgroundUseBlocked")
        } catch (e: LocanaraException) {
            assertTrue(e is LocanaraException.BackgroundUseBlocked)
        }
    }

    @Test
    fun `ProofreadChain propagates LocanaraException from model`() {
        val chain = ProofreadChain(model = failingModel(LocanaraException.ExecutionFailed("inference failed")))
        try {
            runBlocking { chain.run("text") }
            fail("Expected LocanaraException.ExecutionFailed")
        } catch (e: LocanaraException.ExecutionFailed) {
            val message = requireNotNull(e.message)
            assertTrue(message.contains("inference failed"))
        }
    }

    @Test
    fun `ChatChain propagates LocanaraException from model`() {
        val chain = ChatChain(model = failingModel(LocanaraException.ExecutionFailed("chat failed")))
        try {
            runBlocking { chain.run("hello") }
            fail("Expected LocanaraException.ExecutionFailed")
        } catch (e: LocanaraException.ExecutionFailed) {
            val message = requireNotNull(e.message)
            assertTrue(message.contains("chat failed"))
        }
    }

    @Test
    fun `RewriteChain propagates LocanaraException from model`() {
        val chain = RewriteChain(
            model = failingModel(LocanaraException.ExecutionFailed("rewrite failed")),
            style = RewriteOutputType.FRIENDLY
        )
        try {
            runBlocking { chain.run("text") }
            fail("Expected LocanaraException.ExecutionFailed")
        } catch (e: LocanaraException.ExecutionFailed) {
            val message = requireNotNull(e.message)
            assertTrue(message.contains("rewrite failed"))
        }
    }

    @Test
    fun `ExtractChain propagates LocanaraException from model`() {
        val chain = ExtractChain(
            model = failingModel(LocanaraException.ExecutionFailed("extract failed")),
            entityTypes = listOf("person")
        )
        try {
            runBlocking { chain.run("Tim Cook") }
            fail("Expected LocanaraException.ExecutionFailed")
        } catch (e: LocanaraException.ExecutionFailed) {
            val message = requireNotNull(e.message)
            assertTrue(message.contains("extract failed"))
        }
    }

    // --- LocanaraException is-a Exception ---

    @Test
    fun `LocanaraException is catchable as Exception`() {
        val ex: Exception = LocanaraException.ModelBusy
        assertTrue(ex is LocanaraException)
        assertTrue(ex is Exception)
    }
}
