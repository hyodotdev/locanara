import Foundation

/// RAG (Retrieval-Augmented Generation) extensions for LocanaraClient
///
/// These methods provide on-device RAG capabilities:
/// - Create and manage document collections
/// - Index documents with automatic chunking and embedding
/// - Query collections with AI-generated answers based on document context
///
/// All data is stored locally on the device for privacy.
@available(iOS 15.0, macOS 14.0, *)
extension LocanaraClient {

    // MARK: - RAG Components (lazy-loaded)

    nonisolated(unsafe) private static var _ragManager: RAGCollectionManager?
    nonisolated(unsafe) private static var _ragQueryEngine: RAGQueryEngine?
    nonisolated(unsafe) private static var _ragInitialized = false

    private var ragManager: RAGCollectionManager {
        if Self._ragManager == nil {
            Self._ragManager = RAGCollectionManager()
        }
        return Self._ragManager!
    }

    private var ragQueryEngine: RAGQueryEngine {
        if Self._ragQueryEngine == nil {
            Self._ragQueryEngine = RAGQueryEngine(collectionManager: ragManager)
        }
        return Self._ragQueryEngine!
    }

    // MARK: - RAG Initialization

    /// Initialize the RAG system
    ///
    /// Must be called before using any RAG features.
    /// - Throws: RAGCollectionError if initialization fails
    public func initializeRAG() async throws {
        guard !Self._ragInitialized else { return }

        try await ragManager.initialize()

        // Connect inference router if available
        if InferenceRouter.shared.isModelReady() {
            await ragQueryEngine.setInferenceRouter(InferenceRouter.shared)
        }

        Self._ragInitialized = true
    }

    /// Shutdown the RAG system
    ///
    /// Releases resources used by the RAG system.
    public func shutdownRAG() async {
        await ragManager.shutdown()
        Self._ragManager = nil
        Self._ragQueryEngine = nil
        Self._ragInitialized = false
    }

    /// Check if RAG is initialized
    public var isRAGInitialized: Bool {
        Self._ragInitialized
    }

    // MARK: - Collection Management

    /// Create a new RAG collection
    ///
    /// - Parameters:
    ///   - name: Human-readable name for the collection
    ///   - description: Optional description
    /// - Returns: The created collection
    /// - Throws: RAGCollectionError if creation fails
    public func createRAGCollection(
        name: String,
        description: String? = nil
    ) async throws -> RAGCollection {
        try ensureRAGInitialized()
        return try await ragManager.createCollection(name: name, description: description)
    }

    /// Get all RAG collections
    ///
    /// - Returns: Array of all collections
    /// - Throws: RAGCollectionError if query fails
    public func getRAGCollections() async throws -> [RAGCollection] {
        try ensureRAGInitialized()
        return try await ragManager.getCollections()
    }

    /// Get a specific RAG collection
    ///
    /// - Parameter collectionId: Collection ID
    /// - Returns: The collection if found, nil otherwise
    /// - Throws: RAGCollectionError if query fails
    public func getRAGCollection(_ collectionId: String) async throws -> RAGCollection? {
        try ensureRAGInitialized()
        return try await ragManager.getCollection(id: collectionId)
    }

    /// Delete a RAG collection and all its documents
    ///
    /// This operation cannot be undone.
    /// - Parameter collectionId: Collection ID to delete
    /// - Throws: RAGCollectionError if deletion fails
    public func deleteRAGCollection(_ collectionId: String) async throws {
        try ensureRAGInitialized()
        try await ragManager.deleteCollection(id: collectionId)
    }

    // MARK: - Document Management

    /// Index a document into a RAG collection
    ///
    /// The document will be automatically chunked and embedded for semantic search.
    /// - Parameters:
    ///   - collectionId: Target collection ID
    ///   - title: Document title
    ///   - content: Full text content
    ///   - metadata: Optional metadata key-value pairs
    /// - Returns: The indexed document
    /// - Throws: RAGCollectionError if indexing fails
    public func indexDocument(
        collectionId: String,
        title: String,
        content: String,
        metadata: [String: String]? = nil
    ) async throws -> RAGDocument {
        try ensureRAGInitialized()
        return try await ragManager.indexDocument(
            collectionId: collectionId,
            title: title,
            content: content,
            metadata: metadata
        )
    }

    /// Index a document with progress tracking
    ///
    /// - Parameters:
    ///   - collectionId: Target collection ID
    ///   - title: Document title
    ///   - content: Full text content
    ///   - metadata: Optional metadata key-value pairs
    ///   - progress: Progress callback
    /// - Returns: The indexed document
    /// - Throws: RAGCollectionError if indexing fails
    public func indexDocumentWithProgress(
        collectionId: String,
        title: String,
        content: String,
        metadata: [String: String]? = nil,
        progress: @escaping IndexingProgressCallback
    ) async throws -> RAGDocument {
        try ensureRAGInitialized()
        return try await ragManager.indexDocument(
            collectionId: collectionId,
            title: title,
            content: content,
            metadata: metadata,
            progress: progress
        )
    }

    /// Get all documents in a collection
    ///
    /// - Parameter collectionId: Collection ID
    /// - Returns: Array of documents
    /// - Throws: RAGCollectionError if query fails
    public func getRAGDocuments(collectionId: String) async throws -> [RAGDocument] {
        try ensureRAGInitialized()
        return try await ragManager.getDocuments(collectionId: collectionId)
    }

    /// Get a specific document
    ///
    /// - Parameters:
    ///   - collectionId: Collection ID
    ///   - documentId: Document ID
    /// - Returns: The document if found, nil otherwise
    /// - Throws: RAGCollectionError if query fails
    public func getRAGDocument(
        collectionId: String,
        documentId: String
    ) async throws -> RAGDocument? {
        try ensureRAGInitialized()
        return try await ragManager.getDocument(collectionId: collectionId, documentId: documentId)
    }

    /// Remove a document from a collection
    ///
    /// - Parameters:
    ///   - collectionId: Collection ID
    ///   - documentId: Document ID to remove
    /// - Throws: RAGCollectionError if removal fails
    public func removeDocument(
        collectionId: String,
        documentId: String
    ) async throws {
        try ensureRAGInitialized()
        try await ragManager.removeDocument(collectionId: collectionId, documentId: documentId)
    }

    // MARK: - RAG Query

    /// Query a RAG collection with natural language
    ///
    /// Retrieves relevant document chunks and generates an AI answer based on the context.
    /// - Parameters:
    ///   - collectionId: Collection ID to query
    ///   - query: Natural language question
    ///   - topK: Number of chunks to retrieve (default: 5)
    ///   - minRelevance: Minimum relevance score (default: 0.01)
    ///   - systemPrompt: Optional custom system prompt for answer generation
    /// - Returns: RAG query result with answer and sources
    /// - Throws: RAGQueryError if query fails
    public func queryRAG(
        collectionId: String,
        query: String,
        topK: Int = 5,
        minRelevance: Double = -1.0,  // Allow all results including negative similarity
        systemPrompt: String? = nil
    ) async throws -> RAGQueryResult {
        try ensureRAGInitialized()

        // Ensure inference engine is connected
        if InferenceRouter.shared.isModelReady() {
            await ragQueryEngine.setInferenceRouter(InferenceRouter.shared)
        }

        let config = RAGQueryConfig(
            topK: topK,
            minRelevance: minRelevance,
            systemPrompt: systemPrompt
        )

        return try await ragQueryEngine.query(query, collectionId: collectionId, config: config)
    }

    /// Query a RAG collection with streaming response
    ///
    /// - Parameters:
    ///   - collectionId: Collection ID to query
    ///   - query: Natural language question
    ///   - topK: Number of chunks to retrieve
    ///   - minRelevance: Minimum relevance score (default: 0.01)
    ///   - systemPrompt: Optional custom system prompt
    /// - Returns: AsyncStream of RAG stream events (sources and answer tokens)
    public func queryRAGStreaming(
        collectionId: String,
        query: String,
        topK: Int = 5,
        minRelevance: Double = -1.0,  // Allow all results including negative similarity
        systemPrompt: String? = nil
    ) async throws -> AsyncThrowingStream<RAGStreamEvent, Error> {
        try ensureRAGInitialized()

        // Ensure inference engine is connected
        if InferenceRouter.shared.isModelReady() {
            await ragQueryEngine.setInferenceRouter(InferenceRouter.shared)
        }

        let config = RAGQueryConfig(
            topK: topK,
            minRelevance: minRelevance,
            systemPrompt: systemPrompt
        )

        return await ragQueryEngine.queryStreaming(query, collectionId: collectionId, config: config)
    }

    /// Search for similar content without generating an answer
    ///
    /// - Parameters:
    ///   - collectionId: Collection ID to search
    ///   - query: Search query
    ///   - topK: Number of results to return
    ///   - minRelevance: Minimum relevance score (default: 0.01)
    /// - Returns: Array of source chunks with relevance scores
    /// - Throws: RAGCollectionError if search fails
    public func searchRAG(
        collectionId: String,
        query: String,
        topK: Int = 5,
        minRelevance: Double = -1.0  // Allow all results including negative similarity
    ) async throws -> [RAGSourceChunk] {
        try ensureRAGInitialized()
        return try await ragManager.search(
            query: query,
            collectionId: collectionId,
            topK: topK,
            minRelevance: minRelevance
        )
    }

    // MARK: - Statistics

    /// Get statistics for a RAG collection
    ///
    /// - Parameter collectionId: Collection ID
    /// - Returns: Collection statistics
    /// - Throws: RAGCollectionError if query fails
    public func getRAGCollectionStats(_ collectionId: String) async throws -> CollectionStats {
        try ensureRAGInitialized()
        return try await ragManager.getCollectionStats(collectionId: collectionId)
    }

    // MARK: - Private Helpers

    private func ensureRAGInitialized() throws {
        guard Self._ragInitialized else {
            throw RAGCollectionError.notInitialized
        }
    }
}
