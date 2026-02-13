package com.locanara.engine

import android.content.Context
import android.util.Log
import com.locanara.ErrorCode
import com.locanara.InferenceEngineType
import com.locanara.LocanaraException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import org.pytorch.executorch.extension.llm.LlmCallback
import org.pytorch.executorch.extension.llm.LlmModule
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.coroutines.resume

/**
 * ExecuTorch inference engine for Android
 *
 * Uses PyTorch ExecuTorch for on-device LLM inference.
 * Supports Android 15+ with 16KB page size alignment.
 */
class ExecuTorchEngine private constructor(
    private val context: Context,
    private val llmModule: LlmModule,
    private val modelPath: String,
    private val tokenizerPath: String,
    private val memoryManager: MemoryManager
) : InferenceEngine {

    override val engineType: InferenceEngineType = InferenceEngineType.EXECUTORCH
    override val engineName: String = "ExecuTorch"
    override val isLoaded: Boolean get() = !isClosed.get()
    override val isMultimodal: Boolean = false

    private val isClosed = AtomicBoolean(false)
    private val isGenerating = AtomicBoolean(false)
    private val engineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /**
     * Get the prompt template based on the loaded model
     */
    override fun getPromptTemplate(): PromptBuilder.ModelTemplate {
        // Detect template from model path (Llama 3.2 uses LLAMA format)
        return PromptBuilder.detectTemplate(modelPath)
    }

    /**
     * Generate text from prompt
     */
    override suspend fun generate(prompt: String, config: InferenceConfig): String {
        ensureLoaded()

        return withContext(Dispatchers.IO) {
            isGenerating.set(true)

            try {
                Log.d(TAG, "Starting generation with config: $config")
                Log.d(TAG, "Prompt length: ${prompt.length}")

                // Reset internal state before new generation to clear KV cache and position counters
                // This fixes the "Max new tokens 0" error that occurs when reusing a LlmModule
                // Note: If reset fails, generation may produce empty/truncated output
                try {
                    llmModule.stop()
                    Log.d(TAG, "Reset LlmModule state before generation")
                } catch (e: Exception) {
                    // Log error but continue - stop() failure usually means the module is already
                    // in a clean state, but generation may fail if state is truly corrupted
                    Log.e(TAG, "Failed to reset LlmModule state: ${e.message}. Generation may fail.", e)
                }

                val result = StringBuilder()

                suspendCancellableCoroutine { continuation ->
                    continuation.invokeOnCancellation {
                        Log.d(TAG, "Generation cancelled via coroutine cancellation")
                        try { llmModule.stop() } catch (_: Exception) {}
                    }

                    val callback = object : LlmCallback {
                        override fun onResult(token: String) {
                            result.append(token)
                        }

                        override fun onStats(stats: String) {
                            Log.d(TAG, "Stats: $stats")
                            if (continuation.isActive) {
                                continuation.resume(Unit)
                            }
                        }
                    }

                    try {
                        llmModule.generate(prompt, config.maxTokens, callback)
                    } catch (e: Exception) {
                        Log.e(TAG, "Native generate() threw: ${e.message}", e)
                        if (continuation.isActive) {
                            continuation.resume(Unit)
                        }
                    }
                }

                val fullOutput = result.toString()
                Log.d(TAG, "Generation complete, full output length: ${fullOutput.length}")

                // Extract only the assistant response (LlmModule returns full prompt + response)
                val template = getPromptTemplate()
                val extractedResponse = PromptBuilder.extractResponse(fullOutput, template)
                Log.d(TAG, "Extracted response length: ${extractedResponse.length}")

                extractedResponse
            } catch (e: CancellationException) {
                throw e
            } catch (e: LocanaraException) {
                Log.e(TAG, "Generation failed", e)
                throw e
            } catch (e: Exception) {
                Log.e(TAG, "Generation failed", e)
                throw LocanaraException.ExecutionFailed("ExecuTorch generation failed: ${e.message}")
            } finally {
                isGenerating.set(false)
            }
        }
    }

    /**
     * Generate text with streaming
     */
    override fun generateStreaming(prompt: String, config: InferenceConfig): Flow<String> = flow {
        ensureLoaded()
        isGenerating.set(true)

        try {
            Log.d(TAG, "Starting streaming generation")

            // Reset internal state before new generation to clear KV cache and position counters
            // Note: If reset fails, streaming may produce empty/truncated output
            try {
                llmModule.stop()
                Log.d(TAG, "Reset LlmModule state before streaming generation")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to reset LlmModule state: ${e.message}. Streaming may fail.", e)
            }

            val tokenChannel = Channel<String>(Channel.UNLIMITED)

            val callback = object : LlmCallback {
                override fun onResult(token: String) {
                    tokenChannel.trySend(token)
                }

                override fun onStats(stats: String) {
                    Log.d(TAG, "Stats: $stats")
                    tokenChannel.close()
                }
            }

            // Start generation in background using engine-scoped coroutine
            val genJob = engineScope.launch {
                try {
                    llmModule.generate(prompt, config.maxTokens, callback)
                } catch (e: Exception) {
                    Log.e(TAG, "Native generate() threw in streaming: ${e.message}", e)
                    tokenChannel.close(e)
                }
            }

            try {
                // Emit tokens as they arrive
                for (token in tokenChannel) {
                    emit(token)
                }
            } finally {
                // Stop native generation when flow collector cancels
                if (genJob.isActive) {
                    try { llmModule.stop() } catch (_: Exception) {}
                    genJob.cancel()
                }
            }

            Log.d(TAG, "Streaming complete")
        } catch (e: CancellationException) {
            throw e
        } catch (e: LocanaraException) {
            Log.e(TAG, "Streaming generation failed", e)
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "Streaming generation failed", e)
            throw LocanaraException.ExecutionFailed("ExecuTorch streaming failed: ${e.message}")
        } finally {
            isGenerating.set(false)
        }
    }.flowOn(Dispatchers.IO)

    /**
     * Cancel ongoing generation
     */
    override fun cancel(): Boolean {
        if (isGenerating.get()) {
            try {
                llmModule.stop()
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping generation: ${e.message}", e)
            }
            return true
        }
        return false
    }

    /**
     * Unload model from memory
     */
    override fun unload() {
        if (isClosed.compareAndSet(false, true)) {
            Log.d(TAG, "Unloading model")
            engineScope.cancel()
            try {
                llmModule.stop()
            } catch (e: Exception) {
                Log.e(TAG, "Error unloading model", e)
            }
            memoryManager.requestGC()
        }
    }

    private fun ensureLoaded() {
        if (isClosed.get()) {
            throw LocanaraException.Custom(ErrorCode.MODEL_NOT_LOADED, "Model has been unloaded")
        }
    }

    companion object {
        private const val TAG = "ExecuTorchEngine"

        /**
         * Create a new ExecuTorch engine with the given model
         *
         * @param context Android context
         * @param modelFile .pte model file (ExecuTorch format)
         * @param tokenizerFile Tokenizer file (.bin)
         * @param temperature Generation temperature (default: 0.7)
         * @return ExecuTorchEngine instance
         * @throws LocanaraException if model loading fails
         */
        suspend fun create(
            context: Context,
            modelFile: File,
            tokenizerFile: File,
            temperature: Float = 0.7f
        ): ExecuTorchEngine = withContext(Dispatchers.IO) {
            Log.w(TAG, "========================================")
            Log.w(TAG, "ExecuTorchEngine.create() CALLED")
            Log.w(TAG, "Model file: ${modelFile.name}")
            Log.w(TAG, "Model path: ${modelFile.absolutePath}")
            Log.w(TAG, "Model exists: ${modelFile.exists()}")
            Log.w(TAG, "Model size: ${modelFile.length() / (1024 * 1024)}MB")
            Log.w(TAG, "Tokenizer: ${tokenizerFile.absolutePath}")
            Log.w(TAG, "Tokenizer exists: ${tokenizerFile.exists()}")
            Log.w(TAG, "========================================")

            if (!modelFile.exists()) {
                throw LocanaraException.Custom(
                    ErrorCode.MODEL_NOT_FOUND,
                    "Model file not found: ${modelFile.absolutePath}"
                )
            }

            if (!tokenizerFile.exists()) {
                throw LocanaraException.Custom(
                    ErrorCode.MODEL_NOT_FOUND,
                    "Tokenizer file not found: ${tokenizerFile.absolutePath}"
                )
            }

            val memoryManager = MemoryManager(context)
            val modelSize = modelFile.length()

            if (!memoryManager.canLoadModel(modelSize)) {
                val memInfo = memoryManager.getMemoryInfo()
                throw LocanaraException.Custom(
                    ErrorCode.INSUFFICIENT_MEMORY,
                    "Insufficient memory. Need 500MB working set, Available: ${memInfo.availableSystemMemory / (1024 * 1024)}MB"
                )
            }

            try {
                Log.w(TAG, "Step 1: Creating LlmModule...")

                val llmModule = LlmModule(
                    modelFile.absolutePath,
                    tokenizerFile.absolutePath,
                    temperature
                )

                Log.w(TAG, "Step 2: Loading model...")
                val loadResult = llmModule.load()

                if (loadResult != 0) {
                    throw LocanaraException.Custom(
                        ErrorCode.MODEL_LOAD_FAILED,
                        "Failed to load model, error code: $loadResult"
                    )
                }

                Log.w(TAG, "Step 3: Model loaded successfully!")
                ExecuTorchEngine(
                    context,
                    llmModule,
                    modelFile.absolutePath,
                    tokenizerFile.absolutePath,
                    memoryManager
                )
            } catch (e: Exception) {
                Log.e(TAG, "FATAL ERROR: Failed to load model: ${e.message}", e)
                throw LocanaraException.Custom(
                    ErrorCode.MODEL_LOAD_FAILED,
                    "Failed to load model: ${e.message}"
                )
            }
        }
    }
}
