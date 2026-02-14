import Foundation
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "RAGCollectionManager")

/// Error types for RAG collection management
public enum RAGCollectionError: LocalizedError {
    case collectionNotFound(id: String)
    case documentNotFound(id: String)
    case indexingFailed(documentId: String, message: String)
    case collectionAlreadyExists(name: String)
    case emptyContent
    case notInitialized

    public var errorDescription: String? {
        switch self {
        case .collectionNotFound(let id):
            return "Collection not found: \(id)"
        case .documentNotFound(let id):
            return "Document not found: \(id)"
        case .indexingFailed(let documentId, let message):
            return "Failed to index document \(documentId): \(message)"
        case .collectionAlreadyExists(let name):
            return "Collection already exists with name: \(name)"
        case .emptyContent:
            return "Document content cannot be empty"
        case .notInitialized:
            return "RAG Collection Manager not initialized. Call initialize() first."
        }
    }
}

/// Progress callback for indexing operations
public typealias IndexingProgressCallback = @Sendable (IndexingProgress) -> Void

/// Indexing progress information
public struct IndexingProgress: Sendable {
    public let documentId: String
    public let currentChunk: Int
    public let totalChunks: Int
    public let phase: IndexingPhase

    public var percentComplete: Double {
        guard totalChunks > 0 else { return 0 }
        return Double(currentChunk) / Double(totalChunks)
    }
}

/// Phases of document indexing
public enum IndexingPhase: String, Sendable {
    case chunking = "Chunking document"
    case embedding = "Generating embeddings"
    case storing = "Storing vectors"
    case complete = "Indexing complete"
    case failed = "Indexing failed"
}

/// Manages RAG collections, documents, and indexing operations
public actor RAGCollectionManager {
    private let vectorStore: VectorStore
    private let embeddingEngine: EmbeddingEngine
    private let chunker: DocumentChunker
    private var isInitialized = false

    public init(
        vectorStore: VectorStore? = nil,
        embeddingEngine: EmbeddingEngine? = nil,
        chunkingConfig: ChunkingConfig = .default
    ) {
        self.vectorStore = vectorStore ?? VectorStore()
        self.embeddingEngine = embeddingEngine ?? EmbeddingEngine()
        self.chunker = DocumentChunker(config: chunkingConfig)
    }

    // MARK: - Initialization

    /// Initialize the RAG system
    public func initialize() async throws {
        guard !isInitialized else { return }
        try await vectorStore.open()
        isInitialized = true
    }

    /// Shutdown the RAG system
    public func shutdown() async {
        await vectorStore.close()
        isInitialized = false
    }

    // MARK: - Collection Management

    /// Create a new RAG collection
    /// - Parameters:
    ///   - name: Human-readable name for the collection
    ///   - description: Optional description
    /// - Returns: The created collection
    public func createCollection(
        name: String,
        description: String? = nil
    ) async throws -> RAGCollection {
        guard isInitialized else { throw RAGCollectionError.notInitialized }

        let id = UUID().uuidString
        return try await vectorStore.createCollection(
            id: id,
            name: name,
            description: description
        )
    }

    /// Get all collections
    public func getCollections() async throws -> [RAGCollection] {
        guard isInitialized else { throw RAGCollectionError.notInitialized }
        return try await vectorStore.getCollections()
    }

    /// Get a specific collection by ID
    public func getCollection(id: String) async throws -> RAGCollection? {
        guard isInitialized else { throw RAGCollectionError.notInitialized }
        return try await vectorStore.getCollection(id: id)
    }

    /// Delete a collection and all its data
    public func deleteCollection(id: String) async throws {
        guard isInitialized else { throw RAGCollectionError.notInitialized }
        try await vectorStore.deleteCollection(id: id)
    }

    // MARK: - Document Management

    /// Index a document into a collection
    /// - Parameters:
    ///   - collectionId: Target collection ID
    ///   - title: Document title
    ///   - content: Full text content
    ///   - metadata: Optional metadata
    ///   - progress: Optional progress callback
    /// - Returns: The indexed document
    public func indexDocument(
        collectionId: String,
        title: String,
        content: String,
        metadata: [String: String]? = nil,
        progress: IndexingProgressCallback? = nil
    ) async throws -> RAGDocument {
        guard isInitialized else { throw RAGCollectionError.notInitialized }

        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw RAGCollectionError.emptyContent
        }

        // Verify collection exists
        guard await (try? vectorStore.getCollection(id: collectionId)) != nil else {
            throw RAGCollectionError.collectionNotFound(id: collectionId)
        }

        let documentId = UUID().uuidString

        // Create document record
        var document = try await vectorStore.addDocument(
            id: documentId,
            collectionId: collectionId,
            title: title,
            metadata: metadata
        )

        // Update status to indexing
        try await vectorStore.updateDocumentStatus(id: documentId, status: .indexing)

        do {
            // Phase 1: Chunk the document
            progress?(IndexingProgress(
                documentId: documentId,
                currentChunk: 0,
                totalChunks: 0,
                phase: .chunking
            ))

            let chunks = await chunker.chunk(text: content, metadata: metadata)

            guard !chunks.isEmpty else {
                throw RAGCollectionError.indexingFailed(
                    documentId: documentId,
                    message: "Document produced no chunks"
                )
            }

            let totalChunks = chunks.count

            // Phase 2 & 3: Embed and store each chunk
            var storedVectors: [StoredVector] = []

            for (index, chunk) in chunks.enumerated() {
                // Report progress
                progress?(IndexingProgress(
                    documentId: documentId,
                    currentChunk: index + 1,
                    totalChunks: totalChunks,
                    phase: .embedding
                ))

                // Generate embedding
                let embedding = try await embeddingEngine.embed(text: chunk.content)

                logger.debug("Chunk \(index): embedding dimension=\(embedding.vector.count), language=\(embedding.language)")

                // Create stored vector
                let storedVector = StoredVector(
                    collectionId: collectionId,
                    documentId: documentId,
                    chunkIndex: chunk.index,
                    content: chunk.content,
                    vector: embedding.vector,
                    metadata: chunk.metadata
                )

                storedVectors.append(storedVector)
            }

            // Store all vectors
            progress?(IndexingProgress(
                documentId: documentId,
                currentChunk: totalChunks,
                totalChunks: totalChunks,
                phase: .storing
            ))

            try await vectorStore.storeVectors(storedVectors)

            // Update document status to indexed
            try await vectorStore.updateDocumentStatus(
                id: documentId,
                status: .indexed,
                chunkCount: totalChunks
            )

            progress?(IndexingProgress(
                documentId: documentId,
                currentChunk: totalChunks,
                totalChunks: totalChunks,
                phase: .complete
            ))

            // Return updated document
            document = RAGDocument(
                documentId: documentId,
                collectionId: collectionId,
                title: title,
                chunkCount: totalChunks,
                status: .indexed,
                indexedAt: Date().timeIntervalSince1970,
                errorMessage: nil
            )

            return document

        } catch {
            // Update document status to error
            try? await vectorStore.updateDocumentStatus(
                id: documentId,
                status: .error,
                errorMessage: error.localizedDescription
            )

            progress?(IndexingProgress(
                documentId: documentId,
                currentChunk: 0,
                totalChunks: 0,
                phase: .failed
            ))

            throw RAGCollectionError.indexingFailed(
                documentId: documentId,
                message: error.localizedDescription
            )
        }
    }

    /// Get all documents in a collection
    public func getDocuments(collectionId: String) async throws -> [RAGDocument] {
        guard isInitialized else { throw RAGCollectionError.notInitialized }
        return try await vectorStore.getDocuments(collectionId: collectionId)
    }

    /// Get a specific document
    public func getDocument(collectionId: String, documentId: String) async throws -> RAGDocument? {
        guard isInitialized else { throw RAGCollectionError.notInitialized }
        let documents = try await vectorStore.getDocuments(collectionId: collectionId)
        return documents.first { $0.documentId == documentId }
    }

    /// Remove a document from a collection
    public func removeDocument(collectionId: String, documentId: String) async throws {
        guard isInitialized else { throw RAGCollectionError.notInitialized }
        try await vectorStore.deleteDocument(collectionId: collectionId, documentId: documentId)
    }

    // MARK: - Search Operations

    /// Search for similar content in a collection
    /// - Parameters:
    ///   - query: Natural language query
    ///   - collectionId: Collection to search
    ///   - topK: Number of results to return
    ///   - minRelevance: Minimum similarity threshold
    /// - Returns: Array of source chunks with relevance scores
    public func search(
        query: String,
        collectionId: String,
        topK: Int = 5,
        minRelevance: Double = -1.0  // Allow all results including negative similarity (NLEmbedding limitation)
    ) async throws -> [RAGSourceChunk] {
        guard isInitialized else { throw RAGCollectionError.notInitialized }

        // Generate query embedding
        let queryEmbedding = try await embeddingEngine.embed(text: query)

        logger.debug("Query embedding dimension: \(queryEmbedding.vector.count), language: \(queryEmbedding.language)")

        // Search vector store - use minRelevance to allow negative similarities through
        let results = try await vectorStore.search(
            queryVector: queryEmbedding.vector,
            collectionId: collectionId,
            topK: topK * 2,  // Get more results to see similarity scores
            minSimilarity: minRelevance  // Allow negative similarities for NLEmbedding limitation
        )

        logger.debug("Found \(results.count) vectors in collection")
        for (i, result) in results.prefix(5).enumerated() {
            logger.debug("Result \(i): similarity=\(result.similarity), content=\(result.vector.content.prefix(50))...")
        }

        // Filter by minRelevance after logging
        let filteredResults = results.filter { $0.similarity >= minRelevance }.prefix(topK)

        logger.debug("After filtering (minRelevance=\(minRelevance)): \(filteredResults.count) results")

        // Convert to RAGSourceChunk
        var sourceChunks: [RAGSourceChunk] = []

        for result in filteredResults {
            let documentTitle = try await vectorStore.getDocumentTitle(
                documentId: result.vector.documentId
            ) ?? "Unknown"

            sourceChunks.append(RAGSourceChunk(
                documentId: result.vector.documentId,
                documentTitle: documentTitle,
                content: result.vector.content,
                relevanceScore: result.similarity,
                chunkIndex: result.vector.chunkIndex
            ))
        }

        return sourceChunks
    }

    // MARK: - Statistics

    /// Get statistics for a collection
    public func getCollectionStats(collectionId: String) async throws -> CollectionStats {
        guard isInitialized else { throw RAGCollectionError.notInitialized }

        guard let collection = try await vectorStore.getCollection(id: collectionId) else {
            throw RAGCollectionError.collectionNotFound(id: collectionId)
        }

        let documents = try await vectorStore.getDocuments(collectionId: collectionId)

        let indexedCount = documents.filter { $0.status == .indexed }.count
        let pendingCount = documents.filter { $0.status == .pending || $0.status == .indexing }.count
        let errorCount = documents.filter { $0.status == .error }.count

        return CollectionStats(
            collectionId: collectionId,
            documentCount: collection.documentCount,
            totalChunks: collection.totalChunks,
            indexedDocuments: indexedCount,
            pendingDocuments: pendingCount,
            errorDocuments: errorCount
        )
    }
}

/// Statistics for a RAG collection
public struct CollectionStats: Sendable {
    public let collectionId: String
    public let documentCount: Int
    public let totalChunks: Int
    public let indexedDocuments: Int
    public let pendingDocuments: Int
    public let errorDocuments: Int

    public var isFullyIndexed: Bool {
        return indexedDocuments == documentCount && pendingDocuments == 0
    }
}
