package com.locanara.rag

import java.text.BreakIterator
import java.util.Locale
import java.util.UUID

/**
 * Configuration for document chunking
 */
data class ChunkingConfig(
    /** Target chunk size in characters (approximate) */
    val targetChunkSize: Int = 512,
    /** Overlap between chunks in characters */
    val chunkOverlap: Int = 50,
    /** Whether to respect sentence boundaries */
    val respectSentences: Boolean = true,
    /** Minimum chunk size (smaller chunks will be merged) */
    val minChunkSize: Int = 100
) {
    companion object {
        /** Default configuration optimized for on-device embedding */
        val DEFAULT = ChunkingConfig()

        /** Configuration for longer documents */
        val LONG_DOCUMENT = ChunkingConfig(
            targetChunkSize = 1024,
            chunkOverlap = 100,
            respectSentences = true,
            minChunkSize = 200
        )
    }
}

/**
 * A chunk of text extracted from a document
 */
data class DocumentChunk(
    /** Unique identifier for this chunk */
    val id: String = UUID.randomUUID().toString(),
    /** The text content of this chunk */
    val content: String,
    /** Position of this chunk in the original document (0-indexed) */
    val index: Int,
    /** Character offset in the original document */
    val startOffset: Int,
    /** Character end offset in the original document */
    val endOffset: Int,
    /** Optional metadata */
    val metadata: Map<String, String>? = null
)

/**
 * Statistics about chunking results
 */
data class ChunkingStats(
    val count: Int,
    val minSize: Int,
    val maxSize: Int,
    val avgSize: Int,
    val totalSize: Int
)

/**
 * Handles splitting documents into chunks for RAG indexing
 */
class DocumentChunker(
    private val config: ChunkingConfig = ChunkingConfig.DEFAULT
) {
    /**
     * Chunk a document into smaller pieces for embedding
     * @param text The full document text
     * @param metadata Optional metadata to attach to each chunk
     * @return Array of document chunks
     */
    fun chunk(
        text: String,
        metadata: Map<String, String>? = null
    ): List<DocumentChunk> {
        if (text.isEmpty()) return emptyList()

        return if (config.respectSentences) {
            chunkBySentences(text, metadata)
        } else {
            chunkByCharacters(text, metadata)
        }
    }

    /**
     * Chunk text respecting sentence boundaries
     */
    private fun chunkBySentences(
        text: String,
        metadata: Map<String, String>?
    ): List<DocumentChunk> {
        val sentences = splitIntoSentences(text)

        if (sentences.isEmpty()) {
            return chunkByCharacters(text, metadata)
        }

        val chunks = mutableListOf<DocumentChunk>()
        var currentChunkText = StringBuilder()
        var chunkStartOffset = 0
        var currentOffset = 0

        for (sentence in sentences) {
            val potentialChunk = currentChunkText.toString() + sentence

            if (potentialChunk.length > config.targetChunkSize && currentChunkText.isNotEmpty()) {
                // Current chunk is full, save it
                val chunkContent = currentChunkText.toString().trim()
                if (chunkContent.length >= config.minChunkSize) {
                    chunks.add(
                        DocumentChunk(
                            content = chunkContent,
                            index = chunks.size,
                            startOffset = chunkStartOffset,
                            endOffset = chunkStartOffset + currentChunkText.length,
                            metadata = metadata
                        )
                    )
                }

                // Start new chunk with overlap
                val overlapText = getOverlapText(currentChunkText.toString())
                currentChunkText = StringBuilder(overlapText + sentence)
                chunkStartOffset = currentOffset - overlapText.length
            } else {
                if (currentChunkText.isEmpty()) {
                    chunkStartOffset = currentOffset
                }
                currentChunkText.append(sentence)
            }
            currentOffset += sentence.length
        }

        // Add remaining text as final chunk
        if (currentChunkText.isNotEmpty()) {
            val chunkContent = currentChunkText.toString().trim()
            if (chunkContent.length < config.minChunkSize && chunks.isNotEmpty()) {
                // Merge with previous chunk
                val lastChunk = chunks.removeAt(chunks.size - 1)
                val mergedContent = lastChunk.content + " " + chunkContent
                chunks.add(
                    lastChunk.copy(
                        content = mergedContent,
                        endOffset = chunkStartOffset + currentChunkText.length
                    )
                )
            } else if (chunkContent.length >= config.minChunkSize) {
                chunks.add(
                    DocumentChunk(
                        content = chunkContent,
                        index = chunks.size,
                        startOffset = chunkStartOffset,
                        endOffset = minOf(chunkStartOffset + currentChunkText.length, text.length),
                        metadata = metadata
                    )
                )
            }
        }

        return chunks
    }

    /**
     * Chunk text by character count (simpler approach)
     */
    private fun chunkByCharacters(
        text: String,
        metadata: Map<String, String>?
    ): List<DocumentChunk> {
        val chunks = mutableListOf<DocumentChunk>()
        var currentIndex = 0

        while (currentIndex < text.length) {
            val chunkSize = minOf(config.targetChunkSize, text.length - currentIndex)
            val chunkText = text.substring(currentIndex, currentIndex + chunkSize).trim()

            if (chunkText.length >= config.minChunkSize) {
                chunks.add(
                    DocumentChunk(
                        content = chunkText,
                        index = chunks.size,
                        startOffset = currentIndex,
                        endOffset = currentIndex + chunkSize,
                        metadata = metadata
                    )
                )
            }

            // Move forward with overlap
            val moveDistance = maxOf(1, chunkSize - config.chunkOverlap)
            currentIndex += moveDistance
        }

        return chunks
    }

    /**
     * Split text into sentences using BreakIterator
     */
    private fun splitIntoSentences(text: String): List<String> {
        val sentences = mutableListOf<String>()
        val iterator = BreakIterator.getSentenceInstance(Locale.getDefault())
        iterator.setText(text)

        var start = iterator.first()
        var end = iterator.next()

        while (end != BreakIterator.DONE) {
            sentences.add(text.substring(start, end))
            start = end
            end = iterator.next()
        }

        return sentences
    }

    /**
     * Get overlap text from the end of a chunk
     */
    private fun getOverlapText(text: String): String {
        if (config.chunkOverlap <= 0) return ""
        val overlapSize = minOf(config.chunkOverlap, text.length)
        return text.substring(text.length - overlapSize)
    }

    /**
     * Estimate the number of chunks for a given text
     */
    fun estimateChunkCount(text: String): Int {
        if (text.isEmpty()) return 0
        val effectiveChunkSize = config.targetChunkSize - config.chunkOverlap
        return maxOf(1, (text.length + effectiveChunkSize - 1) / effectiveChunkSize)
    }

    /**
     * Get chunking statistics for debugging
     */
    fun getChunkingStats(chunks: List<DocumentChunk>): ChunkingStats {
        if (chunks.isEmpty()) {
            return ChunkingStats(count = 0, minSize = 0, maxSize = 0, avgSize = 0, totalSize = 0)
        }

        val sizes = chunks.map { it.content.length }
        val total = sizes.sum()

        return ChunkingStats(
            count = chunks.size,
            minSize = sizes.minOrNull() ?: 0,
            maxSize = sizes.maxOrNull() ?: 0,
            avgSize = total / chunks.size,
            totalSize = total
        )
    }
}
