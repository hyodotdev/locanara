package com.locanara.rag

import java.text.BreakIterator
import java.util.Locale
import kotlin.math.sqrt

/**
 * Error types for embedding operations
 */
sealed class EmbeddingError : Exception() {
    data class TextTooLong(val length: Int, val max: Int) :
        EmbeddingError() {
        override val message = "Text length $length exceeds maximum $max"
    }

    data class BatchTooLarge(val count: Int, val max: Int) :
        EmbeddingError() {
        override val message = "Batch size $count exceeds maximum $max"
    }

    data class EmbeddingFailed(val text: String) :
        EmbeddingError() {
        override val message = "Failed to generate embedding for text: ${text.take(50)}..."
    }
}

/**
 * A text embedding vector
 */
data class TextEmbedding(
    /** The original text that was embedded */
    val text: String,
    /** The embedding vector */
    val vector: DoubleArray,
    /** The dimension of the embedding */
    val dimension: Int = vector.size,
    /** Language used for embedding */
    val language: String = "en"
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as TextEmbedding
        return text == other.text && vector.contentEquals(other.vector)
    }

    override fun hashCode(): Int {
        var result = text.hashCode()
        result = 31 * result + vector.contentHashCode()
        return result
    }
}

/**
 * Configuration for the embedding engine
 */
data class EmbeddingConfig(
    /** Maximum text length for embedding */
    val maxTextLength: Int = 10000,
    /** Maximum batch size for batch embedding */
    val maxBatchSize: Int = 100,
    /** Embedding dimension */
    val dimension: Int = 384
)

/**
 * Handles text embedding using hash-based vectorization
 *
 * This implementation uses a combination of:
 * 1. Hash-based word vectorization (similar to feature hashing)
 * 2. TF weighting
 * 3. N-gram features for capturing local context
 *
 * This provides reasonable semantic similarity for RAG without
 * requiring a large embedding model.
 *
 * ## Limitations
 *
 * Hash-based embeddings produce low cosine similarity scores (typically 0.03-0.05)
 * compared to neural embedding models (0.7-0.95). This affects confidence display
 * but not retrieval quality (relative ranking still works).
 *
 * ## TODO: ML Kit Embeddings Upgrade
 *
 * When Google releases ML Kit Text Embeddings API (currently in preview/limited access),
 * replace this hash-based implementation with ML Kit for:
 * - Higher quality semantic similarity scores
 * - Better multilingual support
 * - On-device neural embeddings (512-768 dimensions)
 *
 * Tracking: https://developers.google.com/ml-kit
 * Target: ML Kit GenAI Embeddings API (when publicly available)
 */
class EmbeddingEngine(
    private val config: EmbeddingConfig = EmbeddingConfig()
) {
    /** Dimension of embedding vectors */
    val embeddingDimension: Int = config.dimension

    // Common English stop words to filter out
    private val stopWords = setOf(
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
        "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
        "to", "was", "were", "will", "with", "the", "this", "but", "they",
        "have", "had", "what", "when", "where", "who", "which", "why", "how"
    )

    /**
     * Generate an embedding for a single text
     * @param text The text to embed
     * @return The embedding vector
     */
    fun embed(text: String): TextEmbedding {
        if (text.length > config.maxTextLength) {
            throw EmbeddingError.TextTooLong(text.length, config.maxTextLength)
        }

        val vector = computeEmbedding(text)
        return TextEmbedding(
            text = text,
            vector = vector,
            language = "en"
        )
    }

    /**
     * Generate embeddings for multiple texts
     * @param texts Array of texts to embed
     * @return Array of embeddings in the same order
     */
    fun embedBatch(texts: List<String>): List<TextEmbedding> {
        if (texts.size > config.maxBatchSize) {
            throw EmbeddingError.BatchTooLarge(texts.size, config.maxBatchSize)
        }
        return texts.map { embed(it) }
    }

    /**
     * Calculate cosine similarity between two embeddings
     */
    fun cosineSimilarity(embedding1: TextEmbedding, embedding2: TextEmbedding): Double {
        return cosineSimilarity(embedding1.vector, embedding2.vector)
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    fun cosineSimilarity(vec1: DoubleArray, vec2: DoubleArray): Double {
        if (vec1.size != vec2.size) return 0.0

        var dotProduct = 0.0
        var norm1 = 0.0
        var norm2 = 0.0

        for (i in vec1.indices) {
            dotProduct += vec1[i] * vec2[i]
            norm1 += vec1[i] * vec1[i]
            norm2 += vec2[i] * vec2[i]
        }

        val denominator = sqrt(norm1) * sqrt(norm2)
        return if (denominator > 0) dotProduct / denominator else 0.0
    }

    /**
     * Find the most similar embeddings to a query
     */
    fun findSimilar(
        query: TextEmbedding,
        candidates: List<TextEmbedding>,
        topK: Int = 5
    ): List<Pair<TextEmbedding, Double>> {
        return candidates
            .map { candidate -> candidate to cosineSimilarity(query, candidate) }
            .sortedByDescending { it.second }
            .take(topK)
    }

    /**
     * Compute embedding vector for text using hash-based approach
     */
    private fun computeEmbedding(text: String): DoubleArray {
        val vector = DoubleArray(config.dimension)
        val normalizedText = text.lowercase(Locale.getDefault())

        // Tokenize
        val words = tokenize(normalizedText)

        // Filter stop words and short words
        val filteredWords = words.filter { word ->
            word.length > 2 && word !in stopWords
        }

        if (filteredWords.isEmpty()) {
            // Fallback: use all words if filtering removes everything
            addWordsToVector(words, vector)
        } else {
            addWordsToVector(filteredWords, vector)
        }

        // Add character n-grams for better matching
        addCharNgramsToVector(normalizedText, vector, 3)

        // Normalize the vector
        return normalize(vector)
    }

    /**
     * Tokenize text into words
     */
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

    /**
     * Add words to vector using feature hashing
     */
    private fun addWordsToVector(words: List<String>, vector: DoubleArray) {
        val wordCounts = words.groupingBy { it }.eachCount()
        val totalWords = words.size.toDouble()

        // Build word-to-first-index map for efficient bigram lookup (O(n) instead of O(n²))
        val wordFirstIndex = mutableMapOf<String, Int>()
        words.forEachIndexed { index, word ->
            if (word !in wordFirstIndex) {
                wordFirstIndex[word] = index
            }
        }

        for ((word, count) in wordCounts) {
            // Term frequency
            val tf = count / totalWords

            // Hash word to get index
            val hash = word.hashCode()
            val index = ((hash % config.dimension) + config.dimension) % config.dimension
            val sign = if ((hash shr 16) % 2 == 0) 1.0 else -1.0

            vector[index] += sign * tf

            // Add bigrams with neighboring words for context
            val wordIndex = wordFirstIndex[word] ?: -1
            if (wordIndex > 0) {
                val bigram = words[wordIndex - 1] + "_" + word
                val bigramHash = bigram.hashCode()
                val bigramIndex = ((bigramHash % config.dimension) + config.dimension) % config.dimension
                val bigramSign = if ((bigramHash shr 16) % 2 == 0) 1.0 else -1.0
                vector[bigramIndex] += bigramSign * tf * 0.5
            }
        }
    }

    /**
     * Add character n-grams for subword matching
     */
    private fun addCharNgramsToVector(text: String, vector: DoubleArray, n: Int) {
        val cleanText = text.replace(Regex("[^a-z0-9]"), " ").replace(Regex("\\s+"), " ")

        for (i in 0..(cleanText.length - n)) {
            val ngram = cleanText.substring(i, i + n)
            if (ngram.any { it.isLetterOrDigit() }) {
                val hash = ngram.hashCode()
                val index = ((hash % config.dimension) + config.dimension) % config.dimension
                val sign = if ((hash shr 16) % 2 == 0) 1.0 else -1.0
                vector[index] += sign * 0.1
            }
        }
    }

    /**
     * Normalize a vector to unit length
     */
    fun normalize(vector: DoubleArray): DoubleArray {
        val magnitude = sqrt(vector.sumOf { it * it })
        return if (magnitude > 0) {
            vector.map { it / magnitude }.toDoubleArray()
        } else {
            vector
        }
    }

    /**
     * Calculate Euclidean distance between two vectors
     */
    fun euclideanDistance(vec1: DoubleArray, vec2: DoubleArray): Double {
        if (vec1.size != vec2.size) return Double.MAX_VALUE

        val sumSquares = vec1.zip(vec2.toList()).sumOf { (a, b) ->
            val diff = a - b
            diff * diff
        }

        return sqrt(sumSquares)
    }

    /**
     * Average multiple embedding vectors
     */
    fun averageVectors(vectors: List<DoubleArray>): DoubleArray? {
        if (vectors.isEmpty()) return null
        val dimension = vectors.first().size

        val result = DoubleArray(dimension)
        for (vector in vectors) {
            if (vector.size != dimension) continue
            for (i in 0 until dimension) {
                result[i] += vector[i]
            }
        }

        val count = vectors.size.toDouble()
        return result.map { it / count }.toDoubleArray()
    }
}
