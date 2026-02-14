import Foundation
import os.log
#if canImport(FoundationModels)
import FoundationModels
#endif

private let logger = Logger(subsystem: "com.locanara", category: "RAGQueryEngine")

/// Configuration for RAG queries
public struct RAGQueryConfig: Sendable {
    /// Number of top chunks to retrieve
    public let topK: Int

    /// Minimum relevance score for retrieved chunks
    public let minRelevance: Double

    /// System prompt for answer generation
    public let systemPrompt: String?

    /// Maximum tokens for generated answer
    public let maxTokens: Int

    /// Temperature for generation (higher = more creative)
    public let temperature: Double

    /// Whether to include source citations in answer
    public let includeCitations: Bool

    public init(
        topK: Int = 5,
        minRelevance: Double = -1.0,  // Allow all results including negative similarity (NLEmbedding limitation)
        systemPrompt: String? = nil,
        maxTokens: Int = 1024,
        temperature: Double = 0.7,
        includeCitations: Bool = true
    ) {
        self.topK = topK
        self.minRelevance = minRelevance
        self.systemPrompt = systemPrompt
        self.maxTokens = maxTokens
        self.temperature = temperature
        self.includeCitations = includeCitations
    }

    public static let `default` = RAGQueryConfig()
}

/// Error types for RAG query operations
public enum RAGQueryError: LocalizedError {
    case noRelevantChunks
    case generationFailed(message: String)
    case inferenceEngineNotReady
    case collectionNotFound(id: String)

    public var errorDescription: String? {
        switch self {
        case .noRelevantChunks:
            return "No relevant content found for the query"
        case .generationFailed(let message):
            return "Failed to generate answer: \(message)"
        case .inferenceEngineNotReady:
            return "Inference engine is not ready. Please load a model first."
        case .collectionNotFound(let id):
            return "Collection not found: \(id)"
        }
    }
}

/// Executes RAG queries by combining retrieval and generation
@available(iOS 15.0, macOS 14.0, *)
public actor RAGQueryEngine {
    private let collectionManager: RAGCollectionManager
    private var inferenceRouter: InferenceRouter?

    public init(collectionManager: RAGCollectionManager) {
        self.collectionManager = collectionManager
    }

    /// Set the inference router for answer generation
    public func setInferenceRouter(_ router: InferenceRouter) {
        self.inferenceRouter = router
    }

    // MARK: - Query Execution

    /// Execute a RAG query
    /// - Parameters:
    ///   - query: Natural language question
    ///   - collectionId: Collection to search
    ///   - config: Query configuration
    /// - Returns: RAG query result with answer and sources
    public func query(
        _ query: String,
        collectionId: String,
        config: RAGQueryConfig = .default
    ) async throws -> RAGQueryResult {
        let startTime = Date()

        logger.info("RAG query: '\(query)' in collection: \(collectionId)")

        // Step 1: Retrieve relevant chunks
        let chunks = try await collectionManager.search(
            query: query,
            collectionId: collectionId,
            topK: config.topK,
            minRelevance: config.minRelevance
        )

        guard !chunks.isEmpty else {
            logger.warning("No relevant chunks found for query")
            throw RAGQueryError.noRelevantChunks
        }

        logger.info("Retrieved \(chunks.count) relevant chunks")

        // Step 2: Build context from retrieved chunks
        let context = buildContext(from: chunks, includeCitations: config.includeCitations)

        // Step 3: Generate answer
        let answer = try await generateAnswer(
            query: query,
            context: context,
            config: config
        )

        let processingTimeMs = Int(Date().timeIntervalSince(startTime) * 1000)

        // Calculate confidence based on average relevance score
        let avgRelevance = chunks.reduce(0.0) { $0 + $1.relevanceScore } / Double(chunks.count)

        return RAGQueryResult(
            answer: answer,
            sources: chunks,
            processingTimeMs: processingTimeMs,
            confidence: avgRelevance,
            retrievedCount: chunks.count
        )
    }

    /// Stream a RAG query response
    /// - Parameters:
    ///   - query: Natural language question
    ///   - collectionId: Collection to search
    ///   - config: Query configuration
    /// - Returns: AsyncStream of answer tokens
    public func queryStreaming(
        _ query: String,
        collectionId: String,
        config: RAGQueryConfig = .default
    ) -> AsyncThrowingStream<RAGStreamEvent, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    // Step 1: Retrieve relevant chunks
                    let chunks = try await collectionManager.search(
                        query: query,
                        collectionId: collectionId,
                        topK: config.topK,
                        minRelevance: config.minRelevance
                    )

                    guard !chunks.isEmpty else {
                        continuation.finish(throwing: RAGQueryError.noRelevantChunks)
                        return
                    }

                    // Emit sources event
                    continuation.yield(.sources(chunks))

                    // Step 2: Build context
                    let context = buildContext(from: chunks, includeCitations: config.includeCitations)

                    // Step 3: Stream answer generation
                    try await streamAnswer(
                        query: query,
                        context: context,
                        config: config,
                        continuation: continuation
                    )

                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - Private Helpers

    private func buildContext(from chunks: [RAGSourceChunk], includeCitations: Bool) -> String {
        var context = "Based on the following documents:\n\n"

        for (index, chunk) in chunks.enumerated() {
            if includeCitations {
                context += "[\(index + 1)] From \"\(chunk.documentTitle)\":\n"
            }
            context += chunk.content
            context += "\n\n"
        }

        return context
    }

    private func generateAnswer(
        query: String,
        context: String,
        config: RAGQueryConfig
    ) async throws -> String {
        // Build the full prompt
        let systemPrompt = config.systemPrompt ?? defaultSystemPrompt
        let fullPrompt = """
        \(systemPrompt)

        Context:
        \(context)

        Question: \(query)

        Answer:
        """

        // Use InferenceRouter if available
        if let router = inferenceRouter, router.isModelReady() {
            let inferenceConfig = InferenceConfig(
                temperature: config.temperature,
                maxTokens: config.maxTokens
            )

            return try await router.execute(
                feature: .chat,
                input: fullPrompt,
                config: inferenceConfig
            )
        }

        // Fallback: Use Foundation Models if available on iOS 26+
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            return try await generateWithFoundationModels(prompt: fullPrompt, config: config)
        }
        #endif

        throw RAGQueryError.inferenceEngineNotReady
    }

    private func streamAnswer(
        query: String,
        context: String,
        config: RAGQueryConfig,
        continuation: AsyncThrowingStream<RAGStreamEvent, Error>.Continuation
    ) async throws {
        let systemPrompt = config.systemPrompt ?? defaultSystemPrompt
        let fullPrompt = """
        \(systemPrompt)

        Context:
        \(context)

        Question: \(query)

        Answer:
        """

        // Use InferenceRouter for streaming if available
        if let router = inferenceRouter, router.isModelReady() {
            let inferenceConfig = InferenceConfig(
                temperature: config.temperature,
                maxTokens: config.maxTokens
            )

            let stream = router.executeStreaming(
                feature: .chat,
                input: fullPrompt,
                config: inferenceConfig
            )

            for try await token in stream {
                continuation.yield(.token(token))
            }
            return
        }

        // Fallback: Non-streaming generation
        let answer = try await generateAnswer(query: query, context: context, config: config)
        continuation.yield(.token(answer))
    }

    #if canImport(FoundationModels)
    @available(iOS 26.0, macOS 26.0, *)
    private func generateWithFoundationModels(prompt: String, config: RAGQueryConfig) async throws -> String {
        // Check if Foundation Models are available
        guard case .available = SystemLanguageModel.default.availability else {
            logger.warning("Foundation Models not available for RAG generation")
            throw RAGQueryError.inferenceEngineNotReady
        }

        logger.info("Using Foundation Models for RAG answer generation")

        let session = LanguageModelSession()
        let response = try await session.respond(to: prompt)

        logger.info("Foundation Models RAG generation completed")
        return response.content
    }
    #endif

    private var defaultSystemPrompt: String {
        """
        You are a helpful AI assistant that answers questions based on the provided context.

        Instructions:
        - Only use information from the provided context to answer the question
        - If the context doesn't contain enough information, say so
        - Be concise and direct in your answers
        - If relevant, mention which document the information comes from
        - Do not make up information that isn't in the context
        """
    }
}

// MARK: - Streaming Events

/// Events emitted during RAG streaming
public enum RAGStreamEvent: Sendable {
    /// Retrieved source chunks
    case sources([RAGSourceChunk])

    /// Generated answer token
    case token(String)

    /// Generation complete
    case complete
}

