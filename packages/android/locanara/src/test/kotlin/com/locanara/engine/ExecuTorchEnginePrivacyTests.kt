package com.locanara.engine

import com.locanara.ErrorCode
import com.locanara.LocanaraException
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.job
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.fail
import org.junit.Test

class ExecuTorchEnginePrivacyTests {

    @Test
    fun `failure reason omits the native exception message`() {
        val sensitiveMessage = "prompt content at private model path"

        val reason = sanitizedFailureReason(
            "ExecuTorch generation failed",
            IllegalStateException(sensitiveMessage)
        )

        assertEquals(
            "ExecuTorch generation failed (IllegalStateException)",
            reason
        )
        assertFalse(reason.contains(sensitiveMessage))
    }

    @Test
    fun `failure reason handles an anonymous exception without exposing its message`() {
        val sensitiveMessage = "private generated output"
        val error = object : Exception(sensitiveMessage) {}

        val reason = sanitizedFailureReason("Failed to load model", error)

        assertEquals("Failed to load model (Exception)", reason)
        assertFalse(reason.contains(sensitiveMessage))
    }

    @Test
    fun `public execution failure does not retain the sensitive native cause`() {
        val sensitiveMessage = "private prompt and generated output"
        val nativeError = IllegalArgumentException(sensitiveMessage)

        val error = sanitizedExecutionFailure("ExecuTorch streaming failed", nativeError)

        assertEquals(
            "Execution failed: ExecuTorch streaming failed (IllegalArgumentException)",
            error.message
        )
        assertFalse(error.message.orEmpty().contains(sensitiveMessage))
        assertNull(error.cause)
    }

    @Test
    fun `model validation omits the missing absolute path`() {
        val privateDirectory = File(
            System.getProperty("java.io.tmpdir"),
            "private-user-path-${System.nanoTime()}"
        )
        val missingModel = File(privateDirectory, "model.pte")
        val missingTokenizer = File(privateDirectory, "tokenizer.bin")

        val error = captureCustomError {
            validateExecuTorchModelFiles(missingModel, missingTokenizer)
        }

        assertEquals(ErrorCode.MODEL_NOT_FOUND, error.errorCode)
        assertEquals("Model file not found", error.errorMessage)
        assertFalse(error.message.orEmpty().contains(privateDirectory.absolutePath))
    }

    @Test
    fun `tokenizer validation omits the missing absolute path`() {
        val model = File.createTempFile("locanara-model-", ".pte")
        val privateDirectory = File(
            System.getProperty("java.io.tmpdir"),
            "private-user-path-${System.nanoTime()}"
        )
        val missingTokenizer = File(privateDirectory, "tokenizer.bin")

        try {
            val error = captureCustomError {
                validateExecuTorchModelFiles(model, missingTokenizer)
            }

            assertEquals(ErrorCode.MODEL_NOT_FOUND, error.errorCode)
            assertEquals("Tokenizer file not found", error.errorMessage)
            assertFalse(error.message.orEmpty().contains(privateDirectory.absolutePath))
        } finally {
            model.delete()
        }
    }

    @Test
    fun `synchronous native generation failure cannot become an empty success`() {
        val sensitiveMessage = "private prompt echoed by native runtime"

        val error = try {
            runBlocking {
                awaitExecuTorchNativeGeneration(
                    start = { throw IllegalStateException(sensitiveMessage) },
                    onToken = { fail("A failed generation must not emit a token") }
                )
            }
            fail("Expected LocanaraException.ExecutionFailed")
            null
        } catch (error: LocanaraException.ExecutionFailed) {
            error
        }

        requireNotNull(error)
        assertEquals(
            "Execution failed: ExecuTorch generation failed (IllegalStateException)",
            error.message
        )
        assertFalse(error.message.orEmpty().contains(sensitiveMessage))
        assertNull(error.cause)
    }

    @Test
    fun `native nonzero status cannot become a successful generation`() {
        val error = try {
            runBlocking {
                awaitExecuTorchNativeGeneration(
                    start = { callback ->
                        callback.onStats("completed-with-error")
                        17
                    },
                    onToken = { fail("A failed generation must not emit a token") }
                )
            }
            fail("Expected LocanaraException.ExecutionFailed")
            null
        } catch (error: LocanaraException.ExecutionFailed) {
            error
        }

        requireNotNull(error)
        assertEquals(
            "Execution failed: ExecuTorch generation failed (native status 17)",
            error.message
        )
        assertNull(error.cause)
    }

    @Test
    fun `native success returns even when no stats callback arrives`() = runBlocking {
        awaitExecuTorchNativeGeneration(
            start = { 0 },
            onToken = { fail("The status-only test must not emit a token") }
        )
    }

    @Test
    fun `synchronous native cancellation preserves cancellation semantics`() {
        val cancellation = CancellationException("cancelled")

        val thrown = try {
            runBlocking {
                awaitExecuTorchNativeGeneration(
                    start = { throw cancellation },
                    onToken = { fail("A cancelled generation must not emit a token") }
                )
            }
            fail("Expected CancellationException")
            null
        } catch (error: CancellationException) {
            error
        }

        assertEquals("cancelled", thrown?.message)
    }

    @Test
    fun `generation does not start after the calling job is already cancelled`() = runBlocking {
        var startCalled = false
        var cancellationHookCalled = false

        val job = launch(start = CoroutineStart.UNDISPATCHED) {
            currentCoroutineContext().job.cancel()
            awaitExecuTorchNativeGeneration(
                start = {
                    startCalled = true
                    0
                },
                onToken = { fail("A cancelled generation must not emit a token") },
                onCancellation = { cancellationHookCalled = true }
            )
        }
        job.join()

        assertFalse(startCalled)
        assertFalse(cancellationHookCalled)
    }

    @Test
    fun `cancellation interrupts a blocking native generation`() = runBlocking {
        val nativeStarted = CountDownLatch(1)
        val releaseNative = CountDownLatch(1)
        val cancellationHookCalled = CountDownLatch(1)

        val generation = async(Dispatchers.IO) {
            awaitExecuTorchNativeGeneration(
                start = {
                    nativeStarted.countDown()
                    check(releaseNative.await(2, TimeUnit.SECONDS))
                    0
                },
                onToken = { fail("A cancelled generation must not emit a token") },
                onCancellation = {
                    cancellationHookCalled.countDown()
                    releaseNative.countDown()
                }
            )
        }

        check(nativeStarted.await(2, TimeUnit.SECONDS))
        generation.cancel()
        assertEquals(true, cancellationHookCalled.await(1, TimeUnit.SECONDS))
        generation.join()
    }

    private fun captureCustomError(block: () -> Unit): LocanaraException.Custom {
        try {
            block()
            fail("Expected LocanaraException.Custom")
        } catch (error: LocanaraException.Custom) {
            return error
        }

        error("Unreachable")
    }
}
