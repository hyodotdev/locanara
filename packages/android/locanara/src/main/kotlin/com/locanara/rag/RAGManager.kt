package com.locanara.rag

import android.content.Context
import android.util.Log
import com.locanara.RAGCollection
import com.locanara.RAGDocument
import com.locanara.RAGDocumentStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID

/**
 * RAG Collection Manager - Orchestrates document chunking, embedding, and storage
 */
class RAGManager(
    context: Context,
    private val embeddingDimension: Int = 384
) {
    companion object {
        private const val TAG = "RAGManager"
    }

    private val vectorStore = VectorStore(context, embeddingDimension)
    private val chunker = DocumentChunker()
    private val embeddingEngine = EmbeddingEngine(EmbeddingConfig(dimension = embeddingDimension))

    // MARK: - Collection Operations

    /**
     * Create a new RAG collection
     */
    suspend fun createCollection(
        name: String,
        description: String? = null
    ): RAGCollection = withContext(Dispatchers.IO) {
        val id = UUID.randomUUID().toString()
        vectorStore.createCollection(id, name, description)
    }

    /**
     * Get all collections
     */
    suspend fun getCollections(): List<RAGCollection> = withContext(Dispatchers.IO) {
        vectorStore.getCollections()
    }

    /**
     * Get a specific collection
     */
    suspend fun getCollection(collectionId: String): RAGCollection? = withContext(Dispatchers.IO) {
        vectorStore.getCollection(collectionId)
    }

    /**
     * Delete a collection and all its documents
     */
    suspend fun deleteCollection(collectionId: String) = withContext(Dispatchers.IO) {
        vectorStore.deleteCollection(collectionId)
    }

    // MARK: - Document Operations

    /**
     * Index a document into a collection
     * This performs: chunking -> embedding -> storage
     */
    suspend fun indexDocument(
        collectionId: String,
        title: String,
        content: String,
        metadata: Map<String, String>? = null
    ): RAGDocument = withContext(Dispatchers.IO) {
        val documentId = UUID.randomUUID().toString()

        Log.i(TAG, "=== RAGManager.indexDocument ===")
        Log.i(TAG, "Title: '$title'")
        Log.i(TAG, "Content length: ${content.length}")
        Log.i(TAG, "Collection: $collectionId")

        // Create document record first
        val document = vectorStore.addDocument(
            id = documentId,
            collectionId = collectionId,
            title = title,
            metadata = metadata
        )

        try {
            // Update status to indexing
            vectorStore.updateDocumentStatus(documentId, RAGDocumentStatus.INDEXING)

            // Chunk the document
            val chunks = chunker.chunk(content, metadata)
            Log.i(TAG, "Chunked into ${chunks.size} chunks")

            if (chunks.isEmpty()) {
                Log.w(TAG, "No chunks generated! Content too short.")
                vectorStore.updateDocumentStatus(
                    documentId,
                    RAGDocumentStatus.ERROR,
                    errorMessage = "Document content is too short to index"
                )
                return@withContext document.copy(
                    status = RAGDocumentStatus.ERROR,
                    errorMessage = "Document content is too short to index"
                )
            }

            // Generate embeddings and store vectors
            val storedVectors = chunks.mapIndexed { index, chunk ->
                val embedding = embeddingEngine.embed(chunk.content)
                Log.i(TAG, "  Chunk[$index]: content='${chunk.content.take(50)}...', vector sample=${embedding.vector.take(3).joinToString { String.format("%.4f", it) }}")
                StoredVector(
                    collectionId = collectionId,
                    documentId = documentId,
                    chunkIndex = index,
                    content = chunk.content,
                    vector = embedding.vector,
                    metadata = chunk.metadata
                )
            }

            // Store all vectors
            vectorStore.storeVectors(storedVectors)
            Log.i(TAG, "Stored ${storedVectors.size} vectors successfully")

            // Update document status
            vectorStore.updateDocumentStatus(
                documentId,
                RAGDocumentStatus.INDEXED,
                chunkCount = chunks.size
            )

            document.copy(
                status = RAGDocumentStatus.INDEXED,
                chunkCount = chunks.size,
                indexedAt = System.currentTimeMillis().toDouble()
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error indexing document: ${e.message}", e)
            vectorStore.updateDocumentStatus(
                documentId,
                RAGDocumentStatus.ERROR,
                errorMessage = e.message ?: "Unknown error during indexing"
            )
            throw e
        }
    }

    /**
     * Get all documents in a collection
     */
    suspend fun getDocuments(collectionId: String): List<RAGDocument> = withContext(Dispatchers.IO) {
        vectorStore.getDocuments(collectionId)
    }

    /**
     * Get a specific document
     */
    suspend fun getDocument(
        collectionId: String,
        documentId: String
    ): RAGDocument? = withContext(Dispatchers.IO) {
        vectorStore.getDocument(collectionId, documentId)
    }

    /**
     * Remove a document from a collection
     */
    suspend fun removeDocument(
        collectionId: String,
        documentId: String
    ) = withContext(Dispatchers.IO) {
        vectorStore.deleteDocument(collectionId, documentId)
    }

    // MARK: - Search Operations

    /**
     * Search for relevant chunks in a collection
     */
    suspend fun search(
        collectionId: String,
        query: String,
        topK: Int = 5,
        minRelevance: Double = 0.0
    ): List<SearchResult> = withContext(Dispatchers.IO) {
        Log.i(TAG, "=== RAGManager.search ===")
        Log.i(TAG, "Query: '$query'")
        Log.i(TAG, "Collection: $collectionId, TopK: $topK, MinRelevance: $minRelevance")

        // Generate query embedding
        val queryEmbedding = embeddingEngine.embed(query)
        Log.i(TAG, "Query embedding generated, dimension: ${queryEmbedding.vector.size}")
        Log.i(TAG, "Query vector sample (first 5): ${queryEmbedding.vector.take(5).joinToString { String.format("%.4f", it) }}")

        // Search vector store
        val results = vectorStore.search(
            queryVector = queryEmbedding.vector,
            collectionId = collectionId,
            topK = topK,
            minSimilarity = minRelevance
        )

        Log.i(TAG, "VectorStore returned ${results.size} results (after minSimilarity filter)")

        // Map to search results with document titles
        val searchResults = results.map { result ->
            val documentTitle = vectorStore.getDocumentTitle(result.vector.documentId)
                ?: "Unknown Document"

            SearchResult(
                documentId = result.vector.documentId,
                documentTitle = documentTitle,
                content = result.vector.content,
                chunkIndex = result.vector.chunkIndex,
                relevanceScore = result.similarity
            )
        }

        Log.i(TAG, "Final search results: ${searchResults.size}")
        searchResults.forEachIndexed { index, result ->
            Log.i(TAG, "  [$index] doc='${result.documentTitle}', score=${String.format("%.4f", result.relevanceScore)}, content='${result.content.take(50)}...'")
        }

        searchResults
    }

    /**
     * Get collection statistics
     */
    suspend fun getCollectionStats(collectionId: String): CollectionStats? = withContext(Dispatchers.IO) {
        val collection = vectorStore.getCollection(collectionId) ?: return@withContext null

        CollectionStats(
            collectionId = collectionId,
            name = collection.name,
            documentCount = collection.documentCount,
            totalChunks = collection.totalChunks,
            embeddingDimension = embeddingDimension
        )
    }
}

/**
 * Search result from RAG
 */
data class SearchResult(
    val documentId: String,
    val documentTitle: String,
    val content: String,
    val chunkIndex: Int,
    val relevanceScore: Double
)

/**
 * Collection statistics
 */
data class CollectionStats(
    val collectionId: String,
    val name: String,
    val documentCount: Int,
    val totalChunks: Int,
    val embeddingDimension: Int
)
