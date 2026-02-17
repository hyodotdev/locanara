package com.locanara.mlkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.google.mlkit.genai.common.DownloadCallback
import com.google.mlkit.genai.common.GenAiException
import com.locanara.LocanaraException
import com.google.mlkit.genai.imagedescription.ImageDescription
import com.google.mlkit.genai.imagedescription.ImageDescriber
import com.google.mlkit.genai.imagedescription.ImageDescriberOptions
import com.google.mlkit.genai.imagedescription.ImageDescriptionRequest
import com.google.mlkit.genai.proofreading.Proofreader
import com.google.mlkit.genai.proofreading.ProofreaderOptions
import com.google.mlkit.genai.proofreading.Proofreading
import com.google.mlkit.genai.proofreading.ProofreadingRequest
import com.google.mlkit.genai.rewriting.Rewriter
import com.google.mlkit.genai.rewriting.RewriterOptions
import com.google.mlkit.genai.rewriting.Rewriting
import com.google.mlkit.genai.rewriting.RewritingRequest
import com.google.mlkit.genai.summarization.Summarization
import com.google.mlkit.genai.summarization.Summarizer
import com.google.mlkit.genai.summarization.SummarizerOptions
import com.google.mlkit.genai.summarization.SummarizationRequest
import com.locanara.FeatureStatus
import com.locanara.ImageDescriptionResult
import com.locanara.MLKitLanguage
import com.locanara.ProofreadCorrection
import com.locanara.ProofreadInputType
import com.locanara.ProofreadResult
import com.locanara.RewriteOutputType
import com.locanara.RewriteResult
import com.locanara.SummarizeInputType
import com.locanara.SummarizeOutputType
import com.locanara.SummarizeResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.guava.await
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.Closeable
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Download progress callback data
 */
data class DownloadProgress(
    val bytesToDownload: Long,
    val bytesDownloaded: Long,
    val isCompleted: Boolean,
    val error: String? = null
)

/**
 * ML Kit GenAI Clients Manager
 *
 * Provides a unified interface to ML Kit's on-device AI features:
 * - Summarization
 * - Proofreading
 * - Rewriting
 * - Image Description
 */
class MLKitClients(private val context: Context) : Closeable {

    private var summarizer: Summarizer? = null
    private var proofreader: Proofreader? = null
    private var rewriter: Rewriter? = null
    private var imageDescriber: ImageDescriber? = null

    // ============================================
    // Summarization
    // ============================================

    /**
     * Get or create a Summarizer client with specified options.
     */
    fun getSummarizer(
        inputType: SummarizeInputType = SummarizeInputType.ARTICLE,
        outputType: SummarizeOutputType = SummarizeOutputType.ONE_BULLET,
        language: MLKitLanguage = MLKitLanguage.ENGLISH,
        autoTruncate: Boolean = true
    ): Summarizer {
        summarizer?.close()

        val options = SummarizerOptions.builder(context)
            .setInputType(inputType.toMLKit())
            .setOutputType(outputType.toMLKit())
            .setLanguage(language.toSummarizerLanguage())
            .setLongInputAutoTruncationEnabled(autoTruncate)
            .build()

        return Summarization.getClient(options).also { summarizer = it }
    }

    /**
     * Check summarizer feature status.
     */
    suspend fun checkSummarizerStatus(
        inputType: SummarizeInputType = SummarizeInputType.ARTICLE,
        outputType: SummarizeOutputType = SummarizeOutputType.ONE_BULLET,
        language: MLKitLanguage = MLKitLanguage.ENGLISH
    ): FeatureStatus = withContext(Dispatchers.IO) {
        val client = getSummarizer(inputType, outputType, language)
        val status = client.checkFeatureStatus().await()
        status.toFeatureStatus()
    }

    /**
     * Download summarizer model.
     */
    suspend fun downloadSummarizer(
        inputType: SummarizeInputType = SummarizeInputType.ARTICLE,
        outputType: SummarizeOutputType = SummarizeOutputType.ONE_BULLET,
        language: MLKitLanguage = MLKitLanguage.ENGLISH,
        onProgress: ((DownloadProgress) -> Unit)? = null
    ): Unit = withContext(Dispatchers.IO) {
        val client = getSummarizer(inputType, outputType, language)
        suspendCancellableCoroutine { continuation ->
            client.downloadFeature(object : DownloadCallback {
                override fun onDownloadStarted(bytesToDownload: Long) {
                    onProgress?.invoke(DownloadProgress(bytesToDownload, 0, false))
                }

                override fun onDownloadProgress(totalBytesDownloaded: Long) {
                    onProgress?.invoke(DownloadProgress(0, totalBytesDownloaded, false))
                }

                override fun onDownloadCompleted() {
                    onProgress?.invoke(DownloadProgress(0, 0, true))
                    continuation.resume(Unit)
                }

                override fun onDownloadFailed(e: GenAiException) {
                    onProgress?.invoke(DownloadProgress(0, 0, false, e.message))
                    continuation.resumeWithException(e)
                }
            })
        }
    }

    /**
     * Run summarization inference.
     */
    suspend fun summarize(
        text: String,
        inputType: SummarizeInputType = SummarizeInputType.ARTICLE,
        outputType: SummarizeOutputType = SummarizeOutputType.ONE_BULLET,
        language: MLKitLanguage = MLKitLanguage.ENGLISH
    ): SummarizeResult = withContext(Dispatchers.IO) {
        val client = getSummarizer(inputType, outputType, language)
        val request = SummarizationRequest.builder(text).build()
        val result = client.runInference(request).await()
        SummarizeResult(
            summary = result.summary,
            originalLength = text.length,
            summaryLength = result.summary.length,
            confidence = null
        )
    }

    /**
     * Run summarization with streaming output.
     */
    suspend fun summarizeStreaming(
        text: String,
        inputType: SummarizeInputType = SummarizeInputType.ARTICLE,
        outputType: SummarizeOutputType = SummarizeOutputType.ONE_BULLET,
        language: MLKitLanguage = MLKitLanguage.ENGLISH,
        onPartialResult: (String) -> Unit
    ): Unit = withContext(Dispatchers.IO) {
        val client = getSummarizer(inputType, outputType, language)
        val request = SummarizationRequest.builder(text).build()
        client.runInference(request, onPartialResult)
    }

    // ============================================
    // Proofreading
    // ============================================

    /**
     * Get or create a Proofreader client with specified options.
     */
    fun getProofreader(
        inputType: ProofreadInputType = ProofreadInputType.KEYBOARD,
        language: MLKitLanguage = MLKitLanguage.ENGLISH
    ): Proofreader {
        proofreader?.close()

        val options = ProofreaderOptions.builder(context)
            .setInputType(inputType.toMLKit())
            .setLanguage(language.toProofreaderLanguage())
            .build()

        return Proofreading.getClient(options).also { proofreader = it }
    }

    /**
     * Check proofreader feature status.
     */
    suspend fun checkProofreaderStatus(
        inputType: ProofreadInputType = ProofreadInputType.KEYBOARD,
        language: MLKitLanguage = MLKitLanguage.ENGLISH
    ): FeatureStatus = withContext(Dispatchers.IO) {
        val client = getProofreader(inputType, language)
        val status = client.checkFeatureStatus().await()
        status.toFeatureStatus()
    }

    /**
     * Download proofreader model.
     */
    suspend fun downloadProofreader(
        inputType: ProofreadInputType = ProofreadInputType.KEYBOARD,
        language: MLKitLanguage = MLKitLanguage.ENGLISH,
        onProgress: ((DownloadProgress) -> Unit)? = null
    ): Unit = withContext(Dispatchers.IO) {
        val client = getProofreader(inputType, language)
        suspendCancellableCoroutine { continuation ->
            client.downloadFeature(object : DownloadCallback {
                override fun onDownloadStarted(bytesToDownload: Long) {
                    onProgress?.invoke(DownloadProgress(bytesToDownload, 0, false))
                }

                override fun onDownloadProgress(totalBytesDownloaded: Long) {
                    onProgress?.invoke(DownloadProgress(0, totalBytesDownloaded, false))
                }

                override fun onDownloadCompleted() {
                    onProgress?.invoke(DownloadProgress(0, 0, true))
                    continuation.resume(Unit)
                }

                override fun onDownloadFailed(e: GenAiException) {
                    onProgress?.invoke(DownloadProgress(0, 0, false, e.message))
                    continuation.resumeWithException(e)
                }
            })
        }
    }

    /**
     * Run proofreading inference.
     */
    suspend fun proofread(
        text: String,
        inputType: ProofreadInputType = ProofreadInputType.KEYBOARD,
        language: MLKitLanguage = MLKitLanguage.ENGLISH
    ): ProofreadResult = withContext(Dispatchers.IO) {
        val client = getProofreader(inputType, language)
        val request = ProofreadingRequest.builder(text).build()
        val result = client.runInference(request).await()
        val suggestions = result.results
        val correctedText = suggestions.firstOrNull()?.text ?: text

        val corrections = if (correctedText != text) {
            extractWordCorrections(text, correctedText)
        } else {
            emptyList()
        }

        ProofreadResult(
            correctedText = correctedText,
            corrections = corrections,
            hasCorrections = corrections.isNotEmpty()
        )
    }

    /**
     * Extract individual word-level corrections by diffing original and corrected text.
     */
    private fun extractWordCorrections(
        original: String,
        corrected: String
    ): List<ProofreadCorrection> {
        val corrections = mutableListOf<ProofreadCorrection>()
        val wordPattern = Regex("""\S+""")
        val origWords = wordPattern.findAll(original).toList()
        val corrWords = wordPattern.findAll(corrected).toList()

        if (origWords.size == corrWords.size) {
            for (i in origWords.indices) {
                val ow = origWords[i]
                val cw = corrWords[i]
                if (ow.value != cw.value) {
                    corrections.add(
                        ProofreadCorrection(
                            original = ow.value,
                            corrected = cw.value,
                            type = guessErrorType(ow.value, cw.value),
                            confidence = 0.9,
                            startPos = ow.range.first,
                            endPos = ow.range.last + 1
                        )
                    )
                }
            }
        }

        // Fallback: if word counts differ or no corrections found, return single correction
        if (corrections.isEmpty() && original != corrected) {
            corrections.add(
                ProofreadCorrection(
                    original = original,
                    corrected = corrected,
                    type = null,
                    confidence = null,
                    startPos = null,
                    endPos = null
                )
            )
        }

        return corrections
    }

    private fun guessErrorType(original: String, corrected: String): String {
        val origLower = original.lowercase().filter { it.isLetter() }
        val corrLower = corrected.lowercase().filter { it.isLetter() }
        if (origLower != corrLower) return "spelling"

        val origPunct = original.filter { !it.isLetterOrDigit() }
        val corrPunct = corrected.filter { !it.isLetterOrDigit() }
        if (origPunct != corrPunct) return "punctuation"

        return "grammar"
    }

    // ============================================
    // Rewriting
    // ============================================

    /**
     * Get or create a Rewriter client with specified options.
     */
    fun getRewriter(
        outputType: RewriteOutputType = RewriteOutputType.PROFESSIONAL,
        language: MLKitLanguage = MLKitLanguage.ENGLISH
    ): Rewriter {
        rewriter?.close()

        val options = RewriterOptions.builder(context)
            .setOutputType(outputType.toMLKit())
            .setLanguage(language.toRewriterLanguage())
            .build()

        return Rewriting.getClient(options).also { rewriter = it }
    }

    /**
     * Check rewriter feature status.
     */
    suspend fun checkRewriterStatus(
        outputType: RewriteOutputType = RewriteOutputType.PROFESSIONAL,
        language: MLKitLanguage = MLKitLanguage.ENGLISH
    ): FeatureStatus = withContext(Dispatchers.IO) {
        val client = getRewriter(outputType, language)
        val status = client.checkFeatureStatus().await()
        status.toFeatureStatus()
    }

    /**
     * Download rewriter model.
     */
    suspend fun downloadRewriter(
        outputType: RewriteOutputType = RewriteOutputType.PROFESSIONAL,
        language: MLKitLanguage = MLKitLanguage.ENGLISH,
        onProgress: ((DownloadProgress) -> Unit)? = null
    ): Unit = withContext(Dispatchers.IO) {
        val client = getRewriter(outputType, language)
        suspendCancellableCoroutine { continuation ->
            client.downloadFeature(object : DownloadCallback {
                override fun onDownloadStarted(bytesToDownload: Long) {
                    onProgress?.invoke(DownloadProgress(bytesToDownload, 0, false))
                }

                override fun onDownloadProgress(totalBytesDownloaded: Long) {
                    onProgress?.invoke(DownloadProgress(0, totalBytesDownloaded, false))
                }

                override fun onDownloadCompleted() {
                    onProgress?.invoke(DownloadProgress(0, 0, true))
                    continuation.resume(Unit)
                }

                override fun onDownloadFailed(e: GenAiException) {
                    onProgress?.invoke(DownloadProgress(0, 0, false, e.message))
                    continuation.resumeWithException(e)
                }
            })
        }
    }

    /**
     * Run rewriting inference.
     */
    suspend fun rewrite(
        text: String,
        outputType: RewriteOutputType = RewriteOutputType.PROFESSIONAL,
        language: MLKitLanguage = MLKitLanguage.ENGLISH
    ): RewriteResult = withContext(Dispatchers.IO) {
        val client = getRewriter(outputType, language)
        val request = RewritingRequest.builder(text).build()
        val result = client.runInference(request).await()
        val suggestions = result.results

        RewriteResult(
            rewrittenText = suggestions.firstOrNull()?.text ?: text,
            style = outputType,
            alternatives = null,
            confidence = null
        )
    }

    // ============================================
    // Image Description
    // ============================================

    /**
     * Get or create an ImageDescriber client.
     */
    fun getImageDescriber(): ImageDescriber {
        imageDescriber?.close()

        val options = ImageDescriberOptions.builder(context).build()
        return ImageDescription.getClient(options).also { imageDescriber = it }
    }

    /**
     * Check image describer feature status.
     */
    suspend fun checkImageDescriberStatus(): FeatureStatus = withContext(Dispatchers.IO) {
        val client = getImageDescriber()
        val status = client.checkFeatureStatus().await()
        status.toFeatureStatus()
    }

    /**
     * Download image describer model.
     */
    suspend fun downloadImageDescriber(
        onProgress: ((DownloadProgress) -> Unit)? = null
    ): Unit = withContext(Dispatchers.IO) {
        val client = getImageDescriber()
        suspendCancellableCoroutine { continuation ->
            client.downloadFeature(object : DownloadCallback {
                override fun onDownloadStarted(bytesToDownload: Long) {
                    onProgress?.invoke(DownloadProgress(bytesToDownload, 0, false))
                }

                override fun onDownloadProgress(totalBytesDownloaded: Long) {
                    onProgress?.invoke(DownloadProgress(0, totalBytesDownloaded, false))
                }

                override fun onDownloadCompleted() {
                    onProgress?.invoke(DownloadProgress(0, 0, true))
                    continuation.resume(Unit)
                }

                override fun onDownloadFailed(e: GenAiException) {
                    onProgress?.invoke(DownloadProgress(0, 0, false, e.message))
                    continuation.resumeWithException(e)
                }
            })
        }
    }

    /**
     * Run image description inference with a Bitmap.
     */
    suspend fun describeImage(bitmap: Bitmap): ImageDescriptionResult = withContext(Dispatchers.IO) {
        val client = getImageDescriber()
        val request = ImageDescriptionRequest.builder(bitmap).build()
        val result = client.runInference(request).await()
        ImageDescriptionResult(
            description = result.description,
            alternatives = null,
            confidence = null
        )
    }

    /**
     * Run image description inference with a file path.
     */
    suspend fun describeImageFromPath(imagePath: String): ImageDescriptionResult = withContext(Dispatchers.IO) {
        val bitmap = BitmapFactory.decodeFile(imagePath)
            ?: throw IllegalArgumentException("Could not decode image at path: $imagePath")
        describeImage(bitmap)
    }

    /**
     * Run image description inference with base64 encoded image.
     */
    suspend fun describeImageFromBase64(base64: String): ImageDescriptionResult = withContext(Dispatchers.IO) {
        val decodedBytes = Base64.decode(base64, Base64.DEFAULT)
        val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            ?: throw IllegalArgumentException("Could not decode base64 image")
        describeImage(bitmap)
    }

    /**
     * Run image description with streaming output.
     */
    suspend fun describeImageStreaming(
        bitmap: Bitmap,
        onPartialResult: (String) -> Unit
    ): Unit = withContext(Dispatchers.IO) {
        val client = getImageDescriber()
        val request = ImageDescriptionRequest.builder(bitmap).build()
        client.runInference(request, onPartialResult)
    }

    // ============================================
    // Cleanup
    // ============================================

    override fun close() {
        summarizer?.close()
        proofreader?.close()
        rewriter?.close()
        imageDescriber?.close()

        summarizer = null
        proofreader = null
        rewriter = null
        imageDescriber = null
    }
}

// ============================================
// Extension Functions for Enum Conversions
// ============================================

private fun SummarizeInputType.toMLKit(): Int = when (this) {
    SummarizeInputType.ARTICLE -> SummarizerOptions.InputType.ARTICLE
    SummarizeInputType.CONVERSATION -> SummarizerOptions.InputType.CONVERSATION
}

private fun SummarizeOutputType.toMLKit(): Int = when (this) {
    SummarizeOutputType.ONE_BULLET -> SummarizerOptions.OutputType.ONE_BULLET
    SummarizeOutputType.TWO_BULLETS -> SummarizerOptions.OutputType.TWO_BULLETS
    SummarizeOutputType.THREE_BULLETS -> SummarizerOptions.OutputType.THREE_BULLETS
}

private fun MLKitLanguage.toSummarizerLanguage(): Int = when (this) {
    MLKitLanguage.ENGLISH -> SummarizerOptions.Language.ENGLISH
    MLKitLanguage.JAPANESE -> SummarizerOptions.Language.JAPANESE
    MLKitLanguage.KOREAN -> SummarizerOptions.Language.KOREAN
    else -> SummarizerOptions.Language.ENGLISH // Summarization only supports en, ja, ko
}

private fun ProofreadInputType.toMLKit(): Int = when (this) {
    ProofreadInputType.KEYBOARD -> ProofreaderOptions.InputType.KEYBOARD
    ProofreadInputType.VOICE -> ProofreaderOptions.InputType.VOICE
}

private fun MLKitLanguage.toProofreaderLanguage(): Int = when (this) {
    MLKitLanguage.ENGLISH -> ProofreaderOptions.Language.ENGLISH
    MLKitLanguage.JAPANESE -> ProofreaderOptions.Language.JAPANESE
    MLKitLanguage.KOREAN -> ProofreaderOptions.Language.KOREAN
    MLKitLanguage.FRENCH -> ProofreaderOptions.Language.FRENCH
    MLKitLanguage.GERMAN -> ProofreaderOptions.Language.GERMAN
    MLKitLanguage.ITALIAN -> ProofreaderOptions.Language.ITALIAN
    MLKitLanguage.SPANISH -> ProofreaderOptions.Language.SPANISH
}

private fun RewriteOutputType.toMLKit(): Int = when (this) {
    RewriteOutputType.ELABORATE -> RewriterOptions.OutputType.ELABORATE
    RewriteOutputType.EMOJIFY -> RewriterOptions.OutputType.EMOJIFY
    RewriteOutputType.SHORTEN -> RewriterOptions.OutputType.SHORTEN
    RewriteOutputType.FRIENDLY -> RewriterOptions.OutputType.FRIENDLY
    RewriteOutputType.PROFESSIONAL -> RewriterOptions.OutputType.PROFESSIONAL
    RewriteOutputType.REPHRASE -> RewriterOptions.OutputType.REPHRASE
}

private fun MLKitLanguage.toRewriterLanguage(): Int = when (this) {
    MLKitLanguage.ENGLISH -> RewriterOptions.Language.ENGLISH
    MLKitLanguage.JAPANESE -> RewriterOptions.Language.JAPANESE
    MLKitLanguage.KOREAN -> RewriterOptions.Language.KOREAN
    MLKitLanguage.FRENCH -> RewriterOptions.Language.FRENCH
    MLKitLanguage.GERMAN -> RewriterOptions.Language.GERMAN
    MLKitLanguage.ITALIAN -> RewriterOptions.Language.ITALIAN
    MLKitLanguage.SPANISH -> RewriterOptions.Language.SPANISH
}

private fun Int.toFeatureStatus(): FeatureStatus = when (this) {
    0 -> FeatureStatus.UNAVAILABLE
    1 -> FeatureStatus.DOWNLOADABLE
    2 -> FeatureStatus.DOWNLOADING
    3 -> FeatureStatus.AVAILABLE
    else -> FeatureStatus.UNAVAILABLE
}

// ============================================
// ML Kit GenAI Error Mapping
// ============================================

/**
 * Maps ML Kit GenAiException to Locanara exceptions with specific handling
 * for BUSY (quota exceeded) and BACKGROUND_USE_BLOCKED error conditions.
 */
internal fun mapGenAiException(e: Exception): LocanaraException {
    val message = e.message?.lowercase() ?: ""
    return when {
        message.contains("busy") || message.contains("quota") ->
            LocanaraException.ModelBusy
        message.contains("background") || message.contains("foreground") ->
            LocanaraException.BackgroundUseBlocked
        else ->
            LocanaraException.ExecutionFailed(e.message ?: "ML Kit GenAI error", e)
    }
}
