package com.locanara.mlkit

import android.content.Context
import android.util.Log
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.TextPart
import com.google.mlkit.genai.prompt.generateContentRequest
import com.locanara.ChatMessageInput
import com.locanara.ChatResult
import com.locanara.ChatStreamChunk
import com.locanara.Classification
import com.locanara.ClassifyResult
import com.locanara.Entity
import com.locanara.ExtractResult
import com.locanara.KeyValuePair
import com.locanara.TranslateResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import java.io.Closeable

/**
 * Prompt API availability status
 */
sealed class PromptApiStatus {
    data object Available : PromptApiStatus()
    data object Downloadable : PromptApiStatus()
    data object Downloading : PromptApiStatus()
    data class NotAvailable(val reason: String) : PromptApiStatus()
}

/**
 * ML Kit Prompt API Client for on-device Gemini Nano
 *
 * Uses the ML Kit GenAI Prompt API for flexible text generation:
 * - Chat: Conversational AI
 * - Classify: Text classification
 * - Extract: Entity extraction
 * - Translate: Language translation
 *
 * Unlike the experimental AI Edge SDK, the ML Kit Prompt API:
 * - Works with third-party apps (not just system apps)
 * - Uses the shared Gemini Nano model on the device
 * - Has proper availability detection and download APIs
 *
 * Supported languages: English, Korean
 * Token limit: ~4000 tokens (~3000 English words)
 */
class MLKitPromptClient(private val context: Context) : Closeable {

    private var generativeModel: GenerativeModel? = null
    private var _status: PromptApiStatus? = null

    companion object {
        private const val TAG = "MLKitPromptClient"
    }

    /**
     * Get or create the GenerativeModel instance
     */
    private fun getModel(): GenerativeModel {
        return generativeModel ?: Generation.getClient().also { generativeModel = it }
    }

    /**
     * Check Prompt API availability status
     */
    suspend fun checkStatus(): PromptApiStatus = withContext(Dispatchers.IO) {
        _status?.let { return@withContext it }

        Log.w(TAG, "=== Checking Prompt API availability ===")

        try {
            Log.w(TAG, "Getting GenerativeModel client...")
            val model = getModel()
            Log.w(TAG, "GenerativeModel client obtained, checking status...")
            val status = model.checkStatus()
            Log.w(TAG, "Raw status value: $status")

            val result = when (status) {
                FeatureStatus.AVAILABLE -> {
                    Log.w(TAG, "Prompt API is AVAILABLE")
                    PromptApiStatus.Available
                }
                FeatureStatus.DOWNLOADABLE -> {
                    Log.w(TAG, "Prompt API is DOWNLOADABLE")
                    PromptApiStatus.Downloadable
                }
                FeatureStatus.DOWNLOADING -> {
                    Log.w(TAG, "Prompt API is DOWNLOADING")
                    PromptApiStatus.Downloading
                }
                FeatureStatus.UNAVAILABLE -> {
                    Log.w(TAG, "Prompt API is UNAVAILABLE")
                    PromptApiStatus.NotAvailable("Prompt API is not available on this device")
                }
                else -> {
                    Log.w(TAG, "Unknown Prompt API status: $status")
                    PromptApiStatus.NotAvailable("Unknown status: $status")
                }
            }

            _status = result
            result
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check Prompt API status: ${e.javaClass.simpleName}: ${e.message}", e)
            PromptApiStatus.NotAvailable("Error checking status: ${e.message}").also { _status = it }
        }
    }

    /**
     * Check if Prompt API is available (non-suspend version using cached result)
     */
    fun isAvailable(): Boolean = _status is PromptApiStatus.Available

    /**
     * Clear cached status to force recheck
     */
    fun clearStatusCache() {
        _status = null
    }

    /**
     * Download the Prompt API model if needed
     */
    suspend fun downloadModel(
        onProgress: ((DownloadProgress) -> Unit)? = null
    ): Unit = withContext(Dispatchers.IO) {
        val model = getModel()
        model.download()
            .catch { e ->
                Log.e(TAG, "Download failed", e)
                onProgress?.invoke(DownloadProgress(0, 0, false, e.message))
                throw e
            }
            .collect { downloadStatus ->
                when (downloadStatus) {
                    is com.google.mlkit.genai.common.DownloadStatus.DownloadStarted -> {
                        Log.d(TAG, "Download started: ${downloadStatus.bytesToDownload} bytes")
                        onProgress?.invoke(DownloadProgress(downloadStatus.bytesToDownload, 0, false))
                    }
                    is com.google.mlkit.genai.common.DownloadStatus.DownloadProgress -> {
                        onProgress?.invoke(DownloadProgress(0, downloadStatus.totalBytesDownloaded, false))
                    }
                    com.google.mlkit.genai.common.DownloadStatus.DownloadCompleted -> {
                        Log.d(TAG, "Download completed")
                        onProgress?.invoke(DownloadProgress(0, 0, true))
                        _status = PromptApiStatus.Available
                    }
                    is com.google.mlkit.genai.common.DownloadStatus.DownloadFailed -> {
                        Log.e(TAG, "Download failed: ${downloadStatus.e.message}")
                        onProgress?.invoke(DownloadProgress(0, 0, false, downloadStatus.e.message))
                        throw downloadStatus.e
                    }
                }
            }
    }

    // ============================================
    // Chat
    // ============================================

    /**
     * Send a chat message and get a response
     */
    suspend fun chat(
        message: String,
        systemPrompt: String? = null,
        history: List<ChatMessageInput>? = null
    ): ChatResult = withContext(Dispatchers.IO) {
        val model = getModel()

        // Build conversation context
        val promptBuilder = StringBuilder()

        if (systemPrompt != null) {
            promptBuilder.appendLine("System: $systemPrompt")
            promptBuilder.appendLine()
        }

        history?.forEach { msg ->
            val role = when (msg.role.lowercase()) {
                "user" -> "User"
                "assistant" -> "Assistant"
                "system" -> "System"
                else -> msg.role
            }
            promptBuilder.appendLine("$role: ${msg.content}")
        }

        promptBuilder.appendLine("User: $message")
        promptBuilder.appendLine("Assistant:")

        Log.d(TAG, "Sending chat request...")
        val request = generateContentRequest(TextPart(promptBuilder.toString())) {
            temperature = 0.7f
            topK = 40
            candidateCount = 1
        }
        val response = model.generateContent(request)
        val responseText = response.candidates.firstOrNull()?.text?.trim() ?: ""

        Log.d(TAG, "Chat response received: ${responseText.take(50)}...")

        ChatResult(
            message = responseText,
            conversationId = null,
            canContinue = true,
            suggestedPrompts = listOf("Tell me more", "Can you explain?", "What else?")
        )
    }

    /**
     * Send a chat message and stream the response as ChatStreamChunks
     */
    fun chatStream(
        message: String,
        systemPrompt: String? = null,
        history: List<ChatMessageInput>? = null
    ): Flow<ChatStreamChunk> = kotlinx.coroutines.flow.flow {
        val model = getModel()

        val promptBuilder = StringBuilder()

        if (systemPrompt != null) {
            promptBuilder.appendLine("System: $systemPrompt")
            promptBuilder.appendLine()
        }

        history?.forEach { msg ->
            val role = when (msg.role.lowercase()) {
                "user" -> "User"
                "assistant" -> "Assistant"
                "system" -> "System"
                else -> msg.role
            }
            promptBuilder.appendLine("$role: ${msg.content}")
        }

        promptBuilder.appendLine("User: $message")
        promptBuilder.appendLine("Assistant:")

        Log.d(TAG, "Sending streaming chat request...")
        val request = generateContentRequest(TextPart(promptBuilder.toString())) {
            temperature = 0.7f
            topK = 40
            candidateCount = 1
        }

        var accumulated = ""
        model.generateContentStream(request)
            .collect { response ->
                val delta = response.candidates.firstOrNull()?.text ?: ""
                if (delta.isNotEmpty()) {
                    accumulated += delta
                    emit(
                        ChatStreamChunk(
                            delta = delta,
                            accumulated = accumulated,
                            isFinal = false,
                            conversationId = null
                        )
                    )
                }
            }

        // Emit final chunk
        emit(
            ChatStreamChunk(
                delta = "",
                accumulated = accumulated.trim(),
                isFinal = true,
                conversationId = null
            )
        )
    }.flowOn(Dispatchers.IO)

    // ============================================
    // Classify
    // ============================================

    /**
     * Classify text into categories
     */
    suspend fun classify(
        text: String,
        categories: List<String>,
        maxResults: Int = 3
    ): ClassifyResult = withContext(Dispatchers.IO) {
        val model = getModel()

        val categoriesList = categories.joinToString(", ")
        val prompt = """
            Classify the following text into these categories: $categoriesList

            For each applicable category, provide a confidence score between 0.0 and 1.0.
            The scores should sum to 1.0.

            Respond ONLY in this exact format (one per line):
            category_name: score

            Text to classify:
            $text
        """.trimIndent()

        Log.d(TAG, "Sending classify request...")
        val request = generateContentRequest(TextPart(prompt)) {
            temperature = 0.2f
            topK = 16
            candidateCount = 1
        }
        val response = model.generateContent(request)
        val responseText = response.candidates.firstOrNull()?.text ?: ""

        Log.d(TAG, "Classify response: $responseText")

        // Parse classification results
        val classifications = mutableListOf<Classification>()
        val lines = responseText.lines()

        for (line in lines) {
            val trimmed = line.trim()
            if (trimmed.isEmpty()) continue

            val parts = trimmed.split(":", limit = 2)
            if (parts.size != 2) continue

            val label = parts[0].trim()
            val scoreStr = parts[1].trim()

            // Check if this category is in our list
            if (!categories.any { it.equals(label, ignoreCase = true) }) continue

            val score = scoreStr.toDoubleOrNull() ?: continue
            classifications.add(
                Classification(
                    label = label,
                    score = score.coerceIn(0.0, 1.0),
                    metadata = null
                )
            )
        }

        // If parsing failed, throw an exception
        if (classifications.isEmpty()) {
            throw IllegalStateException("Failed to parse classification response from model: $responseText")
        }

        // Sort by score descending and limit results
        val sortedClassifications = classifications
            .sortedByDescending { it.score }
            .take(maxResults)

        ClassifyResult(
            classifications = sortedClassifications,
            topClassification = sortedClassifications.first()
        )
    }

    // ============================================
    // Extract
    // ============================================

    /**
     * Extract entities from text
     */
    suspend fun extract(
        text: String,
        entityTypes: List<String> = listOf("person", "location", "date", "organization"),
        extractKeyValues: Boolean = false
    ): ExtractResult = withContext(Dispatchers.IO) {
        val model = getModel()

        val entityTypesList = entityTypes.joinToString(", ")
        var prompt = """
            Extract entities from the following text.
            Entity types to find: $entityTypesList

            Return ONLY a JSON array of objects with "type", "value", "confidence" fields.
            Example: [{"type":"person","value":"John","confidence":0.95}]
        """.trimIndent()

        if (extractKeyValues) {
            prompt += "\n\nAlso extract key-value pairs as: {\"kv\":[{\"key\":\"k\",\"value\":\"v\",\"confidence\":0.9}]}"
        }

        prompt += "\n\nText:\n<input>\n$text\n</input>"

        Log.d(TAG, "Sending extract request...")
        val request = generateContentRequest(TextPart(prompt)) {
            temperature = 0.2f
            topK = 16
            candidateCount = 1
        }
        val response = model.generateContent(request)
        val responseText = response.candidates.firstOrNull()?.text ?: ""

        Log.d(TAG, "Extract response: $responseText")

        parseExtractResponse(responseText, extractKeyValues)
    }

    private fun parseExtractResponse(
        responseText: String,
        extractKeyValues: Boolean
    ): ExtractResult {
        val entities = mutableListOf<Entity>()
        val keyValuePairs = if (extractKeyValues) mutableListOf<KeyValuePair>() else null

        // Try JSON parsing with JSONArray/JSONObject for robustness
        try {
            // Find the first JSON array using balanced bracket matching
            val arrayStart = responseText.indexOf('[')
            val arrayEnd = if (arrayStart >= 0) findMatchingBracket(responseText, arrayStart) else -1
            if (arrayStart >= 0 && arrayEnd > arrayStart) {
                val jsonArray = org.json.JSONArray(responseText.substring(arrayStart, arrayEnd + 1))
                for (i in 0 until jsonArray.length()) {
                    val obj = jsonArray.getJSONObject(i)
                    val type = obj.optString("type", "")
                    val value = obj.optString("value", "")
                    val confidence = obj.optDouble("confidence", 0.0)
                    if (type.isNotEmpty() && value.isNotEmpty()) {
                        entities.add(Entity(type = type, value = value, confidence = confidence.coerceIn(0.0, 1.0)))
                    }
                }
            }

            // Parse key-value pairs from "kv" field if present
            if (extractKeyValues) {
                val kvStart = responseText.indexOf("\"kv\"")
                if (kvStart >= 0) {
                    val kvArrayStart = responseText.indexOf('[', kvStart)
                    val kvArrayEnd = if (kvArrayStart >= 0) findMatchingBracket(responseText, kvArrayStart) else -1
                    if (kvArrayStart >= 0 && kvArrayEnd > kvArrayStart) {
                        val kvArray = org.json.JSONArray(responseText.substring(kvArrayStart, kvArrayEnd + 1))
                        for (i in 0 until kvArray.length()) {
                            val obj = kvArray.getJSONObject(i)
                            val key = obj.optString("key", "")
                            val value = obj.optString("value", "")
                            val confidence = obj.optDouble("confidence", 0.0)
                            if (key.isNotEmpty() && value.isNotEmpty()) {
                                keyValuePairs?.add(KeyValuePair(key = key, value = value, confidence = confidence.coerceIn(0.0, 1.0)))
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "JSON parsing failed, trying fallback: ${e.message}")
        }

        // Fallback: pipe-delimited format (ENTITY|type|value|confidence)
        if (entities.isEmpty()) {
            for (line in responseText.lines()) {
                val parts = line.trim().split("|")
                if (parts.size >= 4 && parts[0].trim().equals("ENTITY", ignoreCase = true)) {
                    val confidence = parts[3].trim().toDoubleOrNull() ?: continue
                    entities.add(Entity(type = parts[1].trim(), value = parts[2].trim(), confidence = confidence.coerceIn(0.0, 1.0)))
                } else if (parts.size >= 4 && parts[0].trim().equals("KEYVALUE", ignoreCase = true) && extractKeyValues) {
                    val confidence = parts[3].trim().toDoubleOrNull() ?: continue
                    keyValuePairs?.add(KeyValuePair(key = parts[1].trim(), value = parts[2].trim(), confidence = confidence.coerceIn(0.0, 1.0)))
                }
            }
        }

        return ExtractResult(entities = entities, keyValuePairs = keyValuePairs)
    }

    /**
     * Find the matching closing bracket for an opening '[' using balanced scanning.
     * Returns the index of the matching ']', or -1 if not found.
     */
    private fun findMatchingBracket(text: String, openPos: Int): Int {
        var depth = 0
        var inString = false
        var i = openPos
        while (i < text.length) {
            val c = text[i]
            if (inString) {
                if (c == '\\' && i + 1 < text.length) {
                    i += 2
                    continue
                }
                if (c == '"') inString = false
            } else {
                when (c) {
                    '"' -> inString = true
                    '[' -> depth++
                    ']' -> {
                        depth--
                        if (depth == 0) return i
                    }
                }
            }
            i++
        }
        return -1
    }

    // ============================================
    // Translate
    // ============================================

    /**
     * Resolve a language code to its English display name using java.util.Locale.
     * Falls back to the raw code if the system cannot resolve it.
     */
    private fun languageName(code: String): String {
        val locale = java.util.Locale.forLanguageTag(code)
        val name = locale.getDisplayLanguage(java.util.Locale.ENGLISH)
        return if (name.isNotEmpty() && name != code) name else code
    }

    /**
     * Translate text to target language
     */
    suspend fun translate(
        text: String,
        sourceLanguage: String,
        targetLanguage: String
    ): TranslateResult = withContext(Dispatchers.IO) {
        // If same language, return as-is
        if (sourceLanguage == targetLanguage) {
            return@withContext TranslateResult(
                translatedText = text,
                sourceLanguage = sourceLanguage,
                targetLanguage = targetLanguage,
                confidence = 1.0
            )
        }

        val model = getModel()

        val sourceLangName = languageName(sourceLanguage)
        val targetLangName = languageName(targetLanguage)

        val prompt = """
            Translate the following text from $sourceLangName to $targetLangName.
            Provide ONLY the translation, no explanations or additional text.

            Text to translate:
            $text
        """.trimIndent()

        Log.d(TAG, "Sending translate request...")
        val request = generateContentRequest(TextPart(prompt)) {
            temperature = 0.3f
            topK = 20
            candidateCount = 1
        }
        val response = model.generateContent(request)
        val translatedText = response.candidates.firstOrNull()?.text?.trim() ?: text

        Log.d(TAG, "Translate response: ${translatedText.take(50)}...")

        TranslateResult(
            translatedText = translatedText,
            sourceLanguage = sourceLanguage,
            targetLanguage = targetLanguage,
            confidence = 0.90
        )
    }

    // ============================================
    // Cleanup
    // ============================================

    override fun close() {
        generativeModel?.close()
        generativeModel = null
    }
}
