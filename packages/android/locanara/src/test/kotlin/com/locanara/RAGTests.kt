package com.locanara

import com.locanara.rag.ChunkingConfig
import com.locanara.rag.DocumentChunker
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

// MARK: - RAG Layer Tests
//
// VectorStore and RAGManager require an Android Context and are covered by
// instrumentation tests. This suite focuses on the pure-JVM DocumentChunker,
// ChunkingConfig, and DocumentChunk which can run on the host JVM.

class ChunkingConfigTest {
    @Test
    fun `default config has sensible values`() {
        val config = ChunkingConfig.DEFAULT
        assertTrue(config.targetChunkSize > 0)
        assertTrue(config.chunkOverlap >= 0)
        assertTrue(config.chunkOverlap < config.targetChunkSize)
        assertTrue(config.minChunkSize >= 0)
    }

    @Test
    fun `long document config has larger chunk size`() {
        assertTrue(ChunkingConfig.LONG_DOCUMENT.targetChunkSize > ChunkingConfig.DEFAULT.targetChunkSize)
    }

    @Test(expected = IllegalArgumentException::class)
    fun `non-positive targetChunkSize throws`() {
        ChunkingConfig(targetChunkSize = 0)
    }

    @Test(expected = IllegalArgumentException::class)
    fun `negative chunkOverlap throws`() {
        ChunkingConfig(targetChunkSize = 512, chunkOverlap = -1)
    }

    @Test(expected = IllegalArgumentException::class)
    fun `chunkOverlap equal to targetChunkSize throws`() {
        ChunkingConfig(targetChunkSize = 100, chunkOverlap = 100)
    }

    @Test(expected = IllegalArgumentException::class)
    fun `chunkOverlap greater than targetChunkSize throws`() {
        ChunkingConfig(targetChunkSize = 100, chunkOverlap = 150)
    }
}

class DocumentChunkerTest {
    private val chunker = DocumentChunker(
        ChunkingConfig(
            targetChunkSize = 100,
            chunkOverlap = 10,
            respectSentences = false,
            minChunkSize = 10
        )
    )

    @Test
    fun `empty text returns no chunks`() {
        val chunks = chunker.chunk("")
        assertTrue(chunks.isEmpty())
    }

    @Test
    fun `short text produces single chunk`() {
        val text = "Hello world."
        val chunks = chunker.chunk(text)
        assertEquals(1, chunks.size)
        assertEquals(text, chunks[0].content)
    }

    @Test
    fun `chunk index starts at zero`() {
        val text = "Hello world."
        val chunks = chunker.chunk(text)
        assertEquals(0, chunks[0].index)
    }

    @Test
    fun `chunks have unique ids`() {
        val text = "A".repeat(500)
        val chunks = chunker.chunk(text)
        val ids = chunks.map { it.id }.toSet()
        assertEquals(chunks.size, ids.size)
    }

    @Test
    fun `long text produces multiple chunks`() {
        val text = "A".repeat(500)
        val chunks = chunker.chunk(text)
        assertTrue(chunks.size > 1)
    }

    @Test
    fun `metadata is attached to all chunks`() {
        val text = "A".repeat(300)
        val metadata = mapOf("source" to "test-doc", "author" to "Alice")
        val chunks = chunker.chunk(text, metadata = metadata)
        chunks.forEach { chunk ->
            assertNotNull(chunk.metadata)
            assertEquals("test-doc", chunk.metadata?.get("source"))
            assertEquals("Alice", chunk.metadata?.get("author"))
        }
    }

    @Test
    fun `chunk offsets are non-negative`() {
        val text = "B".repeat(300)
        val chunks = chunker.chunk(text)
        chunks.forEach { chunk ->
            assertTrue(chunk.startOffset >= 0)
            assertTrue(chunk.endOffset > chunk.startOffset)
        }
    }

    @Test
    fun `sentence-respecting chunker splits on sentences`() {
        val sentenceChunker = DocumentChunker(
            ChunkingConfig(
                targetChunkSize = 60,
                chunkOverlap = 0,
                respectSentences = true,
                minChunkSize = 0
            )
        )
        // Three short sentences that together exceed targetChunkSize
        val text = "First sentence. Second sentence. Third sentence. Fourth sentence."
        val chunks = sentenceChunker.chunk(text)
        assertTrue(chunks.isNotEmpty())
        // Each chunk should not dramatically exceed the targetChunkSize
        chunks.forEach { chunk ->
            assertTrue(
                "Chunk length ${chunk.content.length} should be reasonable",
                chunk.content.length <= 200 // generous bound
            )
        }
    }

    @Test
    fun `estimate chunk count is positive for non-empty text`() {
        val count = chunker.estimateChunkCount("Hello world, this is a test sentence.")
        assertTrue(count >= 1)
    }

    @Test
    fun `estimate chunk count is zero for empty text`() {
        val count = chunker.estimateChunkCount("")
        assertEquals(0, count)
    }

    @Test
    fun `chunking stats are correct`() {
        val text = "A".repeat(300)
        val chunks = chunker.chunk(text)
        val stats = chunker.getChunkingStats(chunks)

        assertEquals(chunks.size, stats.count)
        assertTrue(stats.minSize > 0)
        assertTrue(stats.maxSize >= stats.minSize)
        assertTrue(stats.avgSize > 0)
        assertTrue(stats.totalSize > 0)
    }

    @Test
    fun `empty chunks list returns zero stats`() {
        val stats = chunker.getChunkingStats(emptyList())
        assertEquals(0, stats.count)
        assertEquals(0, stats.minSize)
        assertEquals(0, stats.maxSize)
        assertEquals(0, stats.avgSize)
        assertEquals(0, stats.totalSize)
    }

    @Test
    fun `chunk content is non-empty`() {
        val text = "The quick brown fox jumps over the lazy dog. " +
            "Pack my box with five dozen liquor jugs. " +
            "How vexingly quick daft zebras jump."
        val chunks = chunker.chunk(text)
        chunks.forEach { chunk ->
            assertFalse("Chunk content should not be empty", chunk.content.isEmpty())
        }
    }
}
