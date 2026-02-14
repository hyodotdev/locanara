package com.locanara.personalization

import android.util.Log
import com.locanara.FeedbackRecord
import com.locanara.FeatureType
import java.text.BreakIterator
import java.util.Locale

/**
 * Response length preference
 */
enum class ResponseLength(val description: String) {
    SHORT("Keep responses brief and to the point"),
    MEDIUM("Provide moderate-length responses"),
    LONG("Give detailed, comprehensive responses")
}

/**
 * Formality level preference
 */
enum class FormalityLevel(val description: String) {
    CASUAL("Use a friendly, conversational tone"),
    NEUTRAL("Use a balanced, professional tone"),
    FORMAL("Use formal, professional language")
}

/**
 * Detail level preference
 */
enum class DetailLevel(val description: String) {
    CONCISE("Focus on key points without elaboration"),
    BALANCED("Provide enough detail to be helpful"),
    DETAILED("Include thorough explanations and examples")
}

/**
 * Style preference
 */
data class StylePreference(
    val name: String,
    val description: String,
    val weight: Double // 0.0 - 1.0 importance
)

/**
 * Feature-specific preference
 */
data class FeaturePreference(
    val feature: FeatureType,
    val preferredStyle: String?,
    val additionalInstructions: String?
)

/**
 * Detected preference patterns from user feedback
 */
data class UserPreferences(
    /** Preferred response length (short, medium, long) */
    val preferredLength: ResponseLength = ResponseLength.MEDIUM,
    /** Preferred formality level (casual, neutral, formal) */
    val preferredFormality: FormalityLevel = FormalityLevel.NEUTRAL,
    /** Preferred detail level (concise, balanced, detailed) */
    val preferredDetail: DetailLevel = DetailLevel.BALANCED,
    /** Common topics the user likes responses about */
    val preferredTopics: List<String> = emptyList(),
    /** Writing style preferences */
    val stylePreferences: List<StylePreference> = emptyList(),
    /** Feature-specific preferences */
    val featurePreferences: Map<FeatureType, FeaturePreference> = emptyMap(),
    /** Confidence score for the analysis (0.0 - 1.0) */
    val confidence: Double = 0.0,
    /** When this analysis was performed */
    val analyzedAt: Long = System.currentTimeMillis()
) {
    companion object {
        val DEFAULT = UserPreferences()
    }
}

/**
 * Analyzes user feedback to extract preference patterns
 */
class PreferenceAnalyzer(
    private val feedbackCollector: FeedbackCollector
) {
    companion object {
        private const val TAG = "PreferenceAnalyzer"
        private const val MIN_FEEDBACK_COUNT = 3  // Lowered for faster personalization (matches iOS)
    }

    // Casual indicators
    private val casualWords = setOf(
        "hey", "hi", "yeah", "ok", "cool", "awesome", "great", "nice",
        "gonna", "wanna", "gotta", "kinda", "sorta", "lol", "btw"
    )

    // Formal indicators
    private val formalWords = setOf(
        "therefore", "however", "moreover", "furthermore", "consequently",
        "nevertheless", "accordingly", "hereby", "pursuant", "whereas"
    )

    /**
     * Analyze feedback to extract user preferences
     */
    fun analyzePreferences(profileId: String): UserPreferences {
        val positiveFeedback = feedbackCollector.getPositiveFeedback(profileId, limit = 100)

        if (positiveFeedback.size < MIN_FEEDBACK_COUNT) {
            Log.i(TAG, "Not enough feedback for analysis (have ${positiveFeedback.size}, need $MIN_FEEDBACK_COUNT)")
            return UserPreferences.DEFAULT
        }

        Log.i(TAG, "Analyzing ${positiveFeedback.size} positive feedback records")

        // Analyze different aspects
        val lengthPreference = analyzeLength(positiveFeedback)
        val formalityPreference = analyzeFormality(positiveFeedback)
        val detailPreference = analyzeDetail(positiveFeedback)
        val topics = extractTopics(positiveFeedback)
        val styles = analyzeStyles(positiveFeedback)
        val featurePrefs = analyzeFeaturePreferences(positiveFeedback)

        // Calculate confidence based on feedback count
        val confidence = minOf(1.0, positiveFeedback.size / 50.0)

        return UserPreferences(
            preferredLength = lengthPreference,
            preferredFormality = formalityPreference,
            preferredDetail = detailPreference,
            preferredTopics = topics,
            stylePreferences = styles,
            featurePreferences = featurePrefs,
            confidence = confidence,
            analyzedAt = System.currentTimeMillis()
        )
    }

    // MARK: - Length Analysis

    private fun analyzeLength(feedback: List<FeedbackRecord>): ResponseLength {
        val lengths = feedback.map { it.output.length }
        val avgLength = lengths.average()

        return when {
            avgLength < 200 -> ResponseLength.SHORT
            avgLength < 600 -> ResponseLength.MEDIUM
            else -> ResponseLength.LONG
        }
    }

    // MARK: - Formality Analysis

    private fun analyzeFormality(feedback: List<FeedbackRecord>): FormalityLevel {
        var casualCount = 0
        var formalCount = 0

        for (record in feedback) {
            val output = record.output.lowercase(Locale.getDefault())
            val words = tokenize(output)

            val casualHits = words.count { it in casualWords }
            val formalHits = words.count { it in formalWords }

            if (casualHits > formalHits) {
                casualCount++
            } else if (formalHits > casualHits) {
                formalCount++
            }
        }

        return when {
            casualCount > formalCount * 2 -> FormalityLevel.CASUAL
            formalCount > casualCount * 2 -> FormalityLevel.FORMAL
            else -> FormalityLevel.NEUTRAL
        }
    }

    // MARK: - Detail Analysis

    private fun analyzeDetail(feedback: List<FeedbackRecord>): DetailLevel {
        // Analyze sentence count and structural complexity
        val sentenceCounts = feedback.map { countSentences(it.output) }
        val avgSentences = sentenceCounts.average()

        // Check for bullet points, numbered lists, headers
        val structuredCount = feedback.count { record ->
            record.output.contains("•") ||
                    record.output.contains("-") ||
                    record.output.contains(Regex("\\d+\\.")) ||
                    record.output.contains(":")
        }
        val structuredRatio = structuredCount.toDouble() / feedback.size

        return when {
            avgSentences < 3 && structuredRatio < 0.3 -> DetailLevel.CONCISE
            avgSentences > 8 || structuredRatio > 0.7 -> DetailLevel.DETAILED
            else -> DetailLevel.BALANCED
        }
    }

    // MARK: - Topic Extraction

    private fun extractTopics(feedback: List<FeedbackRecord>): List<String> {
        val wordFrequency = mutableMapOf<String, Int>()
        val stopWords = setOf(
            "the", "a", "an", "is", "are", "was", "were", "be", "been",
            "being", "have", "has", "had", "do", "does", "did", "will",
            "would", "could", "should", "may", "might", "must", "shall",
            "to", "of", "in", "for", "on", "with", "at", "by", "from",
            "as", "into", "through", "during", "before", "after", "above",
            "below", "between", "under", "again", "further", "then", "once"
        )

        for (record in feedback) {
            val words = tokenize(record.output.lowercase(Locale.getDefault()))
            val filteredWords = words.filter { word ->
                word.length > 3 && word !in stopWords && word.all { it.isLetter() }
            }

            for (word in filteredWords) {
                wordFrequency[word] = (wordFrequency[word] ?: 0) + 1
            }
        }

        // Return top topics based on frequency
        return wordFrequency.entries
            .sortedByDescending { it.value }
            .filter { it.value >= 3 } // Appears in at least 3 responses
            .take(10)
            .map { it.key }
    }

    // MARK: - Style Analysis

    private fun analyzeStyles(feedback: List<FeedbackRecord>): List<StylePreference> {
        val styles = mutableListOf<StylePreference>()

        // Check for emoji usage
        val emojiCount = feedback.count { record ->
            record.output.any { char ->
                Character.UnicodeBlock.of(char) == Character.UnicodeBlock.EMOTICONS ||
                        Character.UnicodeBlock.of(char) == Character.UnicodeBlock.MISCELLANEOUS_SYMBOLS_AND_PICTOGRAPHS
            }
        }
        if (emojiCount > feedback.size / 2) {
            styles.add(StylePreference("emoji", "Include emojis in responses", 0.7))
        }

        // Check for bullet points
        val bulletCount = feedback.count { it.output.contains("•") || it.output.contains(Regex("^\\s*-\\s", RegexOption.MULTILINE)) }
        if (bulletCount > feedback.size / 2) {
            styles.add(StylePreference("bullets", "Use bullet points for lists", 0.8))
        }

        // Check for numbered lists
        val numberedCount = feedback.count { it.output.contains(Regex("\\d+\\.\\s")) }
        if (numberedCount > feedback.size / 2) {
            styles.add(StylePreference("numbered", "Use numbered lists for steps", 0.8))
        }

        // Check for examples
        val exampleCount = feedback.count { record ->
            record.output.lowercase(Locale.getDefault()).contains("for example") ||
                    record.output.lowercase(Locale.getDefault()).contains("e.g.") ||
                    record.output.lowercase(Locale.getDefault()).contains("such as")
        }
        if (exampleCount > feedback.size / 3) {
            styles.add(StylePreference("examples", "Include examples to illustrate points", 0.6))
        }

        return styles
    }

    // MARK: - Feature Preferences

    private fun analyzeFeaturePreferences(feedback: List<FeedbackRecord>): Map<FeatureType, FeaturePreference> {
        val featureGroups = feedback.groupBy { it.feature }
        val preferences = mutableMapOf<FeatureType, FeaturePreference>()

        for ((feature, records) in featureGroups) {
            if (records.size < 3) continue

            val preferredStyle = when (feature) {
                FeatureType.SUMMARIZE -> {
                    val avgLength = records.map { it.output.length }.average()
                    if (avgLength < 150) "bullet points" else "paragraph"
                }
                FeatureType.REWRITE -> {
                    // Analyze if user prefers certain rewrite styles
                    null
                }
                FeatureType.CHAT -> {
                    val avgLength = records.map { it.output.length }.average()
                    when {
                        avgLength < 100 -> "brief"
                        avgLength > 400 -> "detailed"
                        else -> null
                    }
                }
                else -> null
            }

            preferences[feature] = FeaturePreference(
                feature = feature,
                preferredStyle = preferredStyle,
                additionalInstructions = null
            )
        }

        return preferences
    }

    // MARK: - Helpers

    private fun tokenize(text: String): List<String> {
        val words = mutableListOf<String>()
        val iterator = BreakIterator.getWordInstance(Locale.getDefault())
        iterator.setText(text)

        var start = iterator.first()
        var end = iterator.next()

        while (end != BreakIterator.DONE) {
            val word = text.substring(start, end).trim()
            if (word.isNotEmpty() && word.any { it.isLetterOrDigit() }) {
                words.add(word)
            }
            start = end
            end = iterator.next()
        }

        return words
    }

    private fun countSentences(text: String): Int {
        val iterator = BreakIterator.getSentenceInstance(Locale.getDefault())
        iterator.setText(text)

        var count = 0
        var start = iterator.first()
        var end = iterator.next()

        while (end != BreakIterator.DONE) {
            count++
            start = end
            end = iterator.next()
        }

        return count
    }
}
