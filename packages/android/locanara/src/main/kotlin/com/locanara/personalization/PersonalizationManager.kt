package com.locanara.personalization

import android.content.Context
import android.util.Log
import com.locanara.ChatResult
import com.locanara.Classification
import com.locanara.ClassifyResult
import com.locanara.ExecuteFeatureInput
import com.locanara.ExecutionResult
import com.locanara.ExecutionResultData
import com.locanara.ExecutionState
import com.locanara.ExtractResult
import com.locanara.FeedbackRecord
import com.locanara.FeatureType
import com.locanara.ImageDescriptionResult
import com.locanara.ImageGenerationResult
import com.locanara.PersonalizationProfile
import com.locanara.PersonalizedExecutionResult
import com.locanara.ProcessingLocation
import com.locanara.ProofreadResult
import com.locanara.RewriteResult
import com.locanara.SummarizeResult
import com.locanara.TranslateResult
import com.locanara.mlkit.MLKitPromptClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * PersonalizationManager - Orchestrates personalized AI execution
 *
 * This manager handles:
 * 1. Profile management
 * 2. Feedback collection
 * 3. Preference analysis
 * 4. Personalized execution
 */
class PersonalizationManager(
    context: Context
) {
    companion object {
        private const val TAG = "PersonalizationManager"
    }

    private val feedbackCollector = FeedbackCollector(context)
    private val preferenceAnalyzer = PreferenceAnalyzer(feedbackCollector)
    private val promptOptimizer = PromptOptimizer()
    private val promptClient = MLKitPromptClient(context)

    // Cache for preferences (thread-safe for concurrent access)
    private val cachedPreferences: MutableMap<String, UserPreferences> = ConcurrentHashMap()

    // MARK: - Profile Management

    /**
     * Create a new personalization profile
     */
    suspend fun createProfile(name: String): PersonalizationProfile = withContext(Dispatchers.IO) {
        feedbackCollector.createProfile(name)
    }

    /**
     * Get all profiles
     */
    suspend fun getProfiles(): List<PersonalizationProfile> = withContext(Dispatchers.IO) {
        feedbackCollector.getProfiles()
    }

    /**
     * Get the active profile
     */
    suspend fun getActiveProfile(): PersonalizationProfile? = withContext(Dispatchers.IO) {
        feedbackCollector.getActiveProfile()
    }

    /**
     * Activate a profile
     */
    suspend fun activateProfile(profileId: String): PersonalizationProfile = withContext(Dispatchers.IO) {
        // Invalidate cached preferences when switching profiles
        cachedPreferences.clear()
        feedbackCollector.activateProfile(profileId)
    }

    /**
     * Deactivate the current profile
     */
    suspend fun deactivateProfile() = withContext(Dispatchers.IO) {
        feedbackCollector.deactivateAllProfiles()
    }

    /**
     * Delete a profile
     */
    suspend fun deleteProfile(profileId: String) = withContext(Dispatchers.IO) {
        cachedPreferences.remove(profileId)
        feedbackCollector.deleteProfile(profileId)
    }

    // MARK: - Feedback

    /**
     * Register an execution for feedback tracking
     */
    fun registerExecution(
        executionId: String,
        profileId: String,
        feature: FeatureType,
        input: String,
        output: String
    ) {
        feedbackCollector.registerExecution(
            ExecutionRecord(
                executionId = executionId,
                profileId = profileId,
                feature = feature,
                input = input,
                output = output
            )
        )
    }

    /**
     * Record feedback for an execution
     */
    suspend fun recordFeedback(
        executionId: String,
        liked: Boolean,
        comment: String? = null
    ) = withContext(Dispatchers.IO) {
        val execution = feedbackCollector.getPendingExecution(executionId)
        feedbackCollector.recordFeedback(executionId, liked, comment)

        // Invalidate cached preferences for this profile
        execution?.let {
            cachedPreferences.remove(it.profileId)
        }

        Log.i(TAG, "Recorded feedback for $executionId: ${if (liked) "liked" else "disliked"}")
    }

    /**
     * Get feedback history for a profile
     */
    suspend fun getFeedbackHistory(
        profileId: String,
        limit: Int? = null
    ): List<FeedbackRecord> = withContext(Dispatchers.IO) {
        feedbackCollector.getFeedbackHistory(profileId, limit)
    }

    /**
     * Clear all feedback for a profile
     */
    suspend fun clearFeedback(profileId: String) = withContext(Dispatchers.IO) {
        cachedPreferences.remove(profileId)
        feedbackCollector.clearFeedback(profileId)
    }

    // MARK: - Preferences

    /**
     * Get analyzed preferences for a profile
     */
    suspend fun getPreferences(profileId: String): UserPreferences = withContext(Dispatchers.IO) {
        // Check cache first
        cachedPreferences[profileId]?.let { return@withContext it }

        // Analyze and cache
        val preferences = preferenceAnalyzer.analyzePreferences(profileId)
        cachedPreferences[profileId] = preferences
        preferences
    }

    /**
     * Force re-analysis of preferences
     */
    suspend fun refreshPreferences(profileId: String): UserPreferences = withContext(Dispatchers.IO) {
        cachedPreferences.remove(profileId)
        getPreferences(profileId)
    }

    /**
     * Get a summary of preferences
     */
    suspend fun getPreferencesSummary(profileId: String): String = withContext(Dispatchers.IO) {
        val preferences = getPreferences(profileId)
        promptOptimizer.getPreferenceSummary(preferences)
    }

    // MARK: - Personalized Execution

    /**
     * Execute a feature with personalization applied
     */
    suspend fun executePersonalized(
        input: ExecuteFeatureInput,
        profileId: String? = null
    ): PersonalizedExecutionResult = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        val executionId = UUID.randomUUID().toString()

        // Get active profile or specified profile
        val profile = profileId?.let { feedbackCollector.getProfile(it) }
            ?: feedbackCollector.getActiveProfile()

        val personalizationApplied: Boolean
        val output: String

        if (profile != null) {
            // Get preferences and generate personalized prompt
            val preferences = getPreferences(profile.profileId)
            val personalizedPrompt = promptOptimizer.generateFeaturePrompt(
                feature = input.feature,
                preferences = preferences,
                userInput = input.input
            )

            personalizationApplied = preferences.confidence > 0.3
            Log.i(TAG, "Executing with personalization (confidence: ${preferences.confidence})")

            // Execute with personalized prompt
            output = try {
                val result = promptClient.chat(
                    message = personalizedPrompt,
                    systemPrompt = null,
                    history = null
                )
                result?.message ?: "Unable to generate response"
            } catch (e: Exception) {
                Log.e(TAG, "Personalized execution failed", e)
                "Error: ${e.message}"
            }

            // Register for feedback
            registerExecution(
                executionId = executionId,
                profileId = profile.profileId,
                feature = input.feature,
                input = input.input,
                output = output
            )
        } else {
            // No profile - execute without personalization
            personalizationApplied = false
            Log.i(TAG, "Executing without personalization (no active profile)")

            output = try {
                val result = promptClient.chat(
                    message = input.input,
                    systemPrompt = null,
                    history = null
                )
                result?.message ?: "Unable to generate response"
            } catch (e: Exception) {
                Log.e(TAG, "Execution failed", e)
                "Error: ${e.message}"
            }
        }

        val processingTimeMs = (System.currentTimeMillis() - startTime).toInt()

        // Create the appropriate result type based on feature
        val resultData: ExecutionResultData = when (input.feature) {
            FeatureType.CHAT -> ChatResult(
                message = output,
                conversationId = executionId,
                canContinue = true
            )
            FeatureType.SUMMARIZE -> SummarizeResult(
                summary = output,
                originalLength = input.input.length,
                summaryLength = output.length
            )
            FeatureType.REWRITE -> RewriteResult(
                rewrittenText = output
            )
            FeatureType.TRANSLATE -> TranslateResult(
                translatedText = output,
                sourceLanguage = "auto",
                targetLanguage = "en"
            )
            FeatureType.CLASSIFY -> ClassifyResult(
                classifications = emptyList(),
                topClassification = Classification(label = output, score = 1.0)
            )
            FeatureType.EXTRACT -> ExtractResult(
                entities = emptyList()
            )
            FeatureType.PROOFREAD -> ProofreadResult(
                correctedText = output,
                corrections = emptyList(),
                hasCorrections = false
            )
            FeatureType.DESCRIBE_IMAGE, FeatureType.DESCRIBE_IMAGE_ANDROID -> ImageDescriptionResult(
                description = output
            )
            FeatureType.GENERATE_IMAGE, FeatureType.GENERATE_IMAGE_IOS -> ImageGenerationResult(
                imageUrls = emptyList(),
                count = 0
            )
        }

        val executionResult = ExecutionResult(
            id = executionId,
            feature = input.feature,
            state = ExecutionState.COMPLETED,
            result = resultData,
            processedOn = ProcessingLocation.ON_DEVICE,
            processingTimeMs = processingTimeMs,
            error = null,
            startedAt = startTime.toDouble(),
            completedAt = System.currentTimeMillis().toDouble()
        )

        PersonalizedExecutionResult(
            result = executionResult,
            feedbackId = executionId,
            personalizationApplied = personalizationApplied,
            personalizationScore = profile?.let { getPreferences(it.profileId).confidence }
        )
    }

    /**
     * Generate a personalized system prompt for manual use
     */
    suspend fun generatePersonalizedPrompt(
        feature: FeatureType,
        basePrompt: String? = null,
        profileId: String? = null
    ): String = withContext(Dispatchers.IO) {
        val profile = profileId?.let { feedbackCollector.getProfile(it) }
            ?: feedbackCollector.getActiveProfile()

        if (profile == null) {
            return@withContext basePrompt ?: "You are a helpful AI assistant."
        }

        val preferences = getPreferences(profile.profileId)
        promptOptimizer.generateSystemPrompt(preferences, feature, basePrompt)
    }
}
