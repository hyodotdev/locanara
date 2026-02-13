package com.locanara.rag

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log
import com.locanara.RAGCollection
import com.locanara.RAGDocument
import com.locanara.RAGDocumentStatus
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.nio.ByteBuffer
import java.util.UUID
import kotlin.math.sqrt

/**
 * Error types for vector store operations
 */
sealed class VectorStoreError : Exception() {
    data class DatabaseError(override val message: String) : VectorStoreError()
    data class CollectionNotFound(val id: String) : VectorStoreError() {
        override val message = "Collection not found: $id"
    }
    data class DocumentNotFound(val id: String) : VectorStoreError() {
        override val message = "Document not found: $id"
    }
    data class VectorDimensionMismatch(val expected: Int, val got: Int) : VectorStoreError() {
        override val message = "Vector dimension mismatch: expected $expected, got $got"
    }
}

/**
 * A stored vector with its metadata
 */
data class StoredVector(
    val id: String = UUID.randomUUID().toString(),
    val collectionId: String,
    val documentId: String,
    val chunkIndex: Int,
    val content: String,
    val vector: DoubleArray,
    val metadata: Map<String, String>? = null,
    val createdAt: Long = System.currentTimeMillis()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as StoredVector
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}

/**
 * Search result from vector store
 */
data class VectorSearchResult(
    val vector: StoredVector,
    val similarity: Double
)

/**
 * SQLite-based vector store for RAG
 */
class VectorStore(
    context: Context,
    private val expectedDimension: Int = 384
) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val TAG = "VectorStore"
        private const val DATABASE_NAME = "locanara_rag.db"
        private const val DATABASE_VERSION = 1

        private const val TABLE_COLLECTIONS = "collections"
        private const val TABLE_DOCUMENTS = "documents"
        private const val TABLE_VECTORS = "vectors"
    }

    private val json = Json { ignoreUnknownKeys = true }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE $TABLE_COLLECTIONS (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        """)

        db.execSQL("""
            CREATE TABLE $TABLE_DOCUMENTS (
                id TEXT PRIMARY KEY,
                collection_id TEXT NOT NULL,
                title TEXT NOT NULL,
                chunk_count INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'PENDING',
                indexed_at INTEGER,
                error_message TEXT,
                metadata TEXT,
                FOREIGN KEY (collection_id) REFERENCES $TABLE_COLLECTIONS(id) ON DELETE CASCADE
            )
        """)

        db.execSQL("""
            CREATE TABLE $TABLE_VECTORS (
                id TEXT PRIMARY KEY,
                collection_id TEXT NOT NULL,
                document_id TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                vector BLOB NOT NULL,
                metadata TEXT,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (collection_id) REFERENCES $TABLE_COLLECTIONS(id) ON DELETE CASCADE,
                FOREIGN KEY (document_id) REFERENCES $TABLE_DOCUMENTS(id) ON DELETE CASCADE
            )
        """)

        db.execSQL("CREATE INDEX idx_vectors_collection ON $TABLE_VECTORS(collection_id)")
        db.execSQL("CREATE INDEX idx_vectors_document ON $TABLE_VECTORS(document_id)")
        db.execSQL("CREATE INDEX idx_documents_collection ON $TABLE_DOCUMENTS(collection_id)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Handle migrations if needed
    }

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.setForeignKeyConstraintsEnabled(true)
    }

    // MARK: - Collection Operations

    /**
     * Create a new collection
     */
    fun createCollection(
        id: String = UUID.randomUUID().toString(),
        name: String,
        description: String? = null
    ): RAGCollection {
        val now = System.currentTimeMillis()
        val db = writableDatabase

        val values = ContentValues().apply {
            put("id", id)
            put("name", name)
            put("description", description)
            put("created_at", now)
            put("updated_at", now)
        }

        db.insertOrThrow(TABLE_COLLECTIONS, null, values)

        return RAGCollection(
            collectionId = id,
            name = name,
            description = description,
            documentCount = 0,
            totalChunks = 0,
            createdAt = now.toDouble(),
            updatedAt = now.toDouble()
        )
    }

    /**
     * Get all collections
     */
    fun getCollections(): List<RAGCollection> {
        val db = readableDatabase
        val collections = mutableListOf<RAGCollection>()

        val cursor = db.rawQuery("""
            SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM $TABLE_DOCUMENTS WHERE collection_id = c.id) as doc_count,
                   (SELECT COUNT(*) FROM $TABLE_VECTORS WHERE collection_id = c.id) as chunk_count
            FROM $TABLE_COLLECTIONS c
            ORDER BY c.created_at DESC
        """, null)

        cursor.use {
            while (it.moveToNext()) {
                collections.add(
                    RAGCollection(
                        collectionId = it.getString(0),
                        name = it.getString(1),
                        description = it.getString(2),
                        documentCount = it.getInt(5),
                        totalChunks = it.getInt(6),
                        createdAt = it.getLong(3).toDouble(),
                        updatedAt = it.getLong(4).toDouble()
                    )
                )
            }
        }

        return collections
    }

    /**
     * Get a collection by ID
     */
    fun getCollection(id: String): RAGCollection? {
        val db = readableDatabase

        val cursor = db.rawQuery("""
            SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM $TABLE_DOCUMENTS WHERE collection_id = c.id) as doc_count,
                   (SELECT COUNT(*) FROM $TABLE_VECTORS WHERE collection_id = c.id) as chunk_count
            FROM $TABLE_COLLECTIONS c
            WHERE c.id = ?
        """, arrayOf(id))

        cursor.use {
            if (it.moveToFirst()) {
                return RAGCollection(
                    collectionId = it.getString(0),
                    name = it.getString(1),
                    description = it.getString(2),
                    documentCount = it.getInt(5),
                    totalChunks = it.getInt(6),
                    createdAt = it.getLong(3).toDouble(),
                    updatedAt = it.getLong(4).toDouble()
                )
            }
        }

        return null
    }

    /**
     * Delete a collection and all its data
     */
    fun deleteCollection(id: String) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            db.delete(TABLE_VECTORS, "collection_id = ?", arrayOf(id))
            db.delete(TABLE_DOCUMENTS, "collection_id = ?", arrayOf(id))
            db.delete(TABLE_COLLECTIONS, "id = ?", arrayOf(id))
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    // MARK: - Document Operations

    /**
     * Add a document to a collection
     */
    fun addDocument(
        id: String = UUID.randomUUID().toString(),
        collectionId: String,
        title: String,
        metadata: Map<String, String>? = null
    ): RAGDocument {
        val db = writableDatabase

        val values = ContentValues().apply {
            put("id", id)
            put("collection_id", collectionId)
            put("title", title)
            put("status", RAGDocumentStatus.PENDING.name)
            metadata?.let { put("metadata", json.encodeToString(it)) }
        }

        db.insertOrThrow(TABLE_DOCUMENTS, null, values)
        updateCollectionTimestamp(collectionId)

        return RAGDocument(
            documentId = id,
            collectionId = collectionId,
            title = title,
            chunkCount = 0,
            status = RAGDocumentStatus.PENDING,
            indexedAt = null,
            errorMessage = null
        )
    }

    /**
     * Update document status
     */
    fun updateDocumentStatus(
        id: String,
        status: RAGDocumentStatus,
        chunkCount: Int? = null,
        errorMessage: String? = null
    ) {
        val db = writableDatabase
        val values = ContentValues().apply {
            put("status", status.name)
            chunkCount?.let { put("chunk_count", it) }
            if (status == RAGDocumentStatus.INDEXED) {
                put("indexed_at", System.currentTimeMillis())
            }
            errorMessage?.let { put("error_message", it) }
        }

        db.update(TABLE_DOCUMENTS, values, "id = ?", arrayOf(id))
    }

    /**
     * Get documents in a collection
     */
    fun getDocuments(collectionId: String): List<RAGDocument> {
        val db = readableDatabase
        val documents = mutableListOf<RAGDocument>()

        val cursor = db.query(
            TABLE_DOCUMENTS,
            arrayOf("id", "collection_id", "title", "chunk_count", "status", "indexed_at", "error_message"),
            "collection_id = ?",
            arrayOf(collectionId),
            null, null, "indexed_at DESC"
        )

        cursor.use {
            while (it.moveToNext()) {
                documents.add(
                    RAGDocument(
                        documentId = it.getString(0),
                        collectionId = it.getString(1),
                        title = it.getString(2),
                        chunkCount = it.getInt(3),
                        status = RAGDocumentStatus.valueOf(it.getString(4)),
                        indexedAt = if (it.isNull(5)) null else it.getLong(5).toDouble(),
                        errorMessage = it.getString(6)
                    )
                )
            }
        }

        return documents
    }

    /**
     * Get a document by ID
     */
    fun getDocument(collectionId: String, documentId: String): RAGDocument? {
        val db = readableDatabase

        val cursor = db.query(
            TABLE_DOCUMENTS,
            arrayOf("id", "collection_id", "title", "chunk_count", "status", "indexed_at", "error_message"),
            "id = ? AND collection_id = ?",
            arrayOf(documentId, collectionId),
            null, null, null
        )

        cursor.use {
            if (it.moveToFirst()) {
                return RAGDocument(
                    documentId = it.getString(0),
                    collectionId = it.getString(1),
                    title = it.getString(2),
                    chunkCount = it.getInt(3),
                    status = RAGDocumentStatus.valueOf(it.getString(4)),
                    indexedAt = if (it.isNull(5)) null else it.getLong(5).toDouble(),
                    errorMessage = it.getString(6)
                )
            }
        }

        return null
    }

    /**
     * Delete a document and its vectors
     */
    fun deleteDocument(collectionId: String, documentId: String) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            db.delete(TABLE_VECTORS, "document_id = ?", arrayOf(documentId))
            db.delete(TABLE_DOCUMENTS, "id = ?", arrayOf(documentId))
            updateCollectionTimestamp(collectionId)
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    // MARK: - Vector Operations

    /**
     * Store a vector
     */
    fun storeVector(storedVector: StoredVector) {
        if (storedVector.vector.size != expectedDimension) {
            throw VectorStoreError.VectorDimensionMismatch(expectedDimension, storedVector.vector.size)
        }

        val db = writableDatabase
        val vectorBlob = vectorToBlob(storedVector.vector)

        val values = ContentValues().apply {
            put("id", storedVector.id)
            put("collection_id", storedVector.collectionId)
            put("document_id", storedVector.documentId)
            put("chunk_index", storedVector.chunkIndex)
            put("content", storedVector.content)
            put("vector", vectorBlob)
            storedVector.metadata?.let { put("metadata", json.encodeToString(it)) }
            put("created_at", storedVector.createdAt)
        }

        db.insertOrThrow(TABLE_VECTORS, null, values)
    }

    /**
     * Store multiple vectors in a batch
     */
    fun storeVectors(vectors: List<StoredVector>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (vector in vectors) {
                storeVector(vector)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    /**
     * Search for similar vectors
     */
    fun search(
        queryVector: DoubleArray,
        collectionId: String,
        topK: Int = 5,
        minSimilarity: Double = 0.0
    ): List<VectorSearchResult> {
        Log.i(TAG, "=== VectorStore.search ===")
        Log.i(TAG, "CollectionId: $collectionId, TopK: $topK, MinSimilarity: $minSimilarity")

        if (queryVector.size != expectedDimension) {
            Log.e(TAG, "Vector dimension mismatch! Expected: $expectedDimension, Got: ${queryVector.size}")
            throw VectorStoreError.VectorDimensionMismatch(expectedDimension, queryVector.size)
        }

        val db = readableDatabase
        val results = mutableListOf<VectorSearchResult>()
        val allSimilarities = mutableListOf<Pair<String, Double>>() // For logging ALL scores

        val cursor = db.query(
            TABLE_VECTORS,
            arrayOf("id", "collection_id", "document_id", "chunk_index", "content", "vector", "metadata", "created_at"),
            "collection_id = ?",
            arrayOf(collectionId),
            null, null, null
        )

        var totalVectors = 0
        var filteredOutCount = 0

        cursor.use {
            while (it.moveToNext()) {
                totalVectors++
                val vectorBlob = it.getBlob(5)
                val vector = blobToVector(vectorBlob)
                val content = it.getString(4)

                if (vector.size != expectedDimension) {
                    Log.w(TAG, "Skipping vector with wrong dimension: ${vector.size}")
                    continue
                }

                val similarity = cosineSimilarity(queryVector, vector)
                allSimilarities.add(content.take(30) to similarity)

                if (similarity < minSimilarity) {
                    filteredOutCount++
                    continue
                }

                val metadataStr = it.getString(6)
                val metadata: Map<String, String>? = metadataStr?.let { str ->
                    try {
                        json.decodeFromString(str)
                    } catch (e: Exception) {
                        null
                    }
                }

                results.add(
                    VectorSearchResult(
                        vector = StoredVector(
                            id = it.getString(0),
                            collectionId = it.getString(1),
                            documentId = it.getString(2),
                            chunkIndex = it.getInt(3),
                            content = content,
                            vector = vector,
                            metadata = metadata,
                            createdAt = it.getLong(7)
                        ),
                        similarity = similarity
                    )
                )
            }
        }

        Log.i(TAG, "Total vectors in collection: $totalVectors")
        Log.i(TAG, "Filtered out (below minSimilarity $minSimilarity): $filteredOutCount")
        Log.i(TAG, "Results passing filter: ${results.size}")

        // Log ALL similarity scores (sorted by score)
        Log.i(TAG, "=== ALL Similarity Scores (sorted) ===")
        allSimilarities.sortedByDescending { it.second }.forEach { (content, score) ->
            Log.i(TAG, "  Score: ${String.format("%.6f", score)} | Content: '$content...'")
        }

        val finalResults = results
            .sortedByDescending { it.similarity }
            .take(topK)

        Log.i(TAG, "Returning top-$topK: ${finalResults.size} results")

        return finalResults
    }

    /**
     * Get document title by ID
     */
    fun getDocumentTitle(documentId: String): String? {
        val db = readableDatabase

        val cursor = db.query(
            TABLE_DOCUMENTS,
            arrayOf("title"),
            "id = ?",
            arrayOf(documentId),
            null, null, null
        )

        cursor.use {
            if (it.moveToFirst()) {
                return it.getString(0)
            }
        }

        return null
    }

    // MARK: - Private Helpers

    private fun updateCollectionTimestamp(collectionId: String) {
        val db = writableDatabase
        val values = ContentValues().apply {
            put("updated_at", System.currentTimeMillis())
        }
        db.update(TABLE_COLLECTIONS, values, "id = ?", arrayOf(collectionId))
    }

    private fun vectorToBlob(vector: DoubleArray): ByteArray {
        val buffer = ByteBuffer.allocate(vector.size * 8)
        for (value in vector) {
            buffer.putDouble(value)
        }
        return buffer.array()
    }

    private fun blobToVector(blob: ByteArray): DoubleArray {
        val buffer = ByteBuffer.wrap(blob)
        val vector = DoubleArray(blob.size / 8)
        for (i in vector.indices) {
            vector[i] = buffer.getDouble()
        }
        return vector
    }

    private fun cosineSimilarity(vec1: DoubleArray, vec2: DoubleArray): Double {
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
}
