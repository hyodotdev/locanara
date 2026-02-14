package com.locanara.rag

import android.content.Context
import android.util.Log
import com.locanara.RAGQueryResult
import com.locanara.RAGSourceChunk
import com.locanara.mlkit.MLKitPromptClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * RAG Query Engine - Combines retrieval with LLM generation
 */
class RAGQueryEngine(
    context: Context,
    private val ragManager: RAGManager
) {
    companion object {
        private const val TAG = "RAGQueryEngine"
        private const val DEFAULT_SYSTEM_PROMPT = """You are a helpful AI assistant that answers questions based on the provided document context.

Instructions:
1. Only use information from the provided context to answer the question
2. If the context doesn't contain enough information, say so clearly
3. Be concise and direct in your answers
4. Cite which source document your information comes from when relevant
5. Do not make up information that's not in the context"""
    }

    private val promptClient = MLKitPromptClient(context)

    /**
     * Query a RAG collection with natural language
     * Returns an AI-generated answer based on relevant document chunks
     *
     * @param minRelevance Minimum relevance score (0.0-1.0). For hash-based embeddings,
     *                     use low values (0.0-0.05) as cosine similarities are typically small.
     */
    suspend fun query(
        collectionId: String,
        query: String,
        topK: Int = 5,
        minRelevance: Double = 0.0,  // Changed from 0.1 to 0.0 for hash-based embeddings
        systemPrompt: String? = null
    ): RAGQueryResult = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()

        Log.i(TAG, "=== RAG Query Start ===")
        Log.i(TAG, "Collection: $collectionId")
        Log.i(TAG, "Query: $query")
        Log.i(TAG, "TopK: $topK, MinRelevance: $minRelevance")

        // Search for relevant chunks
        val searchResults = ragManager.search(
            collectionId = collectionId,
            query = query,
            topK = topK,
            minRelevance = minRelevance
        )

        Log.i(TAG, "Search returned ${searchResults.size} results")
        searchResults.forEachIndexed { index, result ->
            Log.i(TAG, "  Result[$index]: doc='${result.documentTitle}', score=${result.relevanceScore}, content='${result.content.take(50)}...'")
        }

        if (searchResults.isEmpty()) {
            Log.w(TAG, "No results found! Returning empty answer.")
            return@withContext RAGQueryResult(
                answer = "I couldn't find any relevant information in the documents to answer your question.\n\n[DEBUG: minRelevance=$minRelevance, try lowering it or check if documents are indexed]",
                sources = emptyList(),
                processingTimeMs = (System.currentTimeMillis() - startTime).toInt(),
                confidence = 0.0,
                retrievedCount = 0
            )
        }

        // Build context from search results
        val context = buildContext(searchResults)

        // Generate answer using LLM
        val answer = generateAnswer(query, context, systemPrompt)

        // Build source chunks
        val sources = searchResults.map { result ->
            RAGSourceChunk(
                documentId = result.documentId,
                documentTitle = result.documentTitle,
                content = result.content,
                relevanceScore = result.relevanceScore,
                chunkIndex = result.chunkIndex
            )
        }

        // Calculate average confidence from relevance scores
        val avgConfidence = searchResults.map { it.relevanceScore }.average()

        RAGQueryResult(
            answer = answer,
            sources = sources,
            processingTimeMs = (System.currentTimeMillis() - startTime).toInt(),
            confidence = avgConfidence,
            retrievedCount = searchResults.size
        )
    }

    /**
     * Build context string from search results
     */
    private fun buildContext(results: List<SearchResult>): String {
        return results
            .sortedByDescending { it.relevanceScore }
            .mapIndexed { index, result ->
                """
                |[Source ${index + 1}: ${result.documentTitle}]
                |${result.content}
                """.trimMargin()
            }
            .joinToString("\n\n---\n\n")
    }

    /**
     * Generate answer using LLM with RAG context
     */
    private suspend fun generateAnswer(
        query: String,
        context: String,
        customSystemPrompt: String?
    ): String {
        val systemPrompt = customSystemPrompt ?: DEFAULT_SYSTEM_PROMPT

        val prompt = """
            |$systemPrompt
            |
            |## Context from Documents:
            |$context
            |
            |## User Question:
            |$query
            |
            |## Your Answer:
        """.trimMargin()

        return try {
            val result = promptClient.chat(
                message = prompt,
                systemPrompt = null,
                history = null
            )
            result?.message ?: "I was unable to generate an answer. Please try again."
        } catch (e: Exception) {
            // If LLM fails, return a simple answer based on the most relevant chunk
            "Based on the documents, here's the most relevant information:\n\n${context.take(500)}..."
        }
    }

    /**
     * Query with callback for response
     * Note: This calls the callback once with the full response, not token-by-token.
     * True streaming would require changes to MLKitPromptClient.
     */
    suspend fun queryWithCallback(
        collectionId: String,
        query: String,
        topK: Int = 5,
        minRelevance: Double = 0.0,  // Changed from 0.1 to 0.0 for hash-based embeddings
        systemPrompt: String? = null,
        onChunk: (String) -> Unit
    ): RAGQueryResult = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()

        // Search for relevant chunks
        val searchResults = ragManager.search(
            collectionId = collectionId,
            query = query,
            topK = topK,
            minRelevance = minRelevance
        )

        if (searchResults.isEmpty()) {
            val noResultMessage = "I couldn't find any relevant information in the documents to answer your question."
            onChunk(noResultMessage)
            return@withContext RAGQueryResult(
                answer = noResultMessage,
                sources = emptyList(),
                processingTimeMs = (System.currentTimeMillis() - startTime).toInt(),
                confidence = 0.0,
                retrievedCount = 0
            )
        }

        // Build context from search results
        val context = buildContext(searchResults)

        // Generate answer using LLM with streaming
        val answer = StringBuilder()
        try {
            val systemPromptToUse = systemPrompt ?: DEFAULT_SYSTEM_PROMPT
            val prompt = """
                |$systemPromptToUse
                |
                |## Context from Documents:
                |$context
                |
                |## User Question:
                |$query
                |
                |## Your Answer:
            """.trimMargin()

            // Use non-streaming for now (streaming would require flow)
            val result = promptClient.chat(
                message = prompt,
                systemPrompt = null,
                history = null
            )
            val responseText = result?.message ?: "I was unable to generate an answer."
            answer.append(responseText)
            onChunk(responseText)
        } catch (e: Exception) {
            val fallbackAnswer = "Based on the documents, here's the most relevant information:\n\n${context.take(500)}..."
            answer.append(fallbackAnswer)
            onChunk(fallbackAnswer)
        }

        // Build source chunks
        val sources = searchResults.map { result ->
            RAGSourceChunk(
                documentId = result.documentId,
                documentTitle = result.documentTitle,
                content = result.content,
                relevanceScore = result.relevanceScore,
                chunkIndex = result.chunkIndex
            )
        }

        val avgConfidence = searchResults.map { it.relevanceScore }.average()

        RAGQueryResult(
            answer = answer.toString(),
            sources = sources,
            processingTimeMs = (System.currentTimeMillis() - startTime).toInt(),
            confidence = avgConfidence,
            retrievedCount = searchResults.size
        )
    }
}
