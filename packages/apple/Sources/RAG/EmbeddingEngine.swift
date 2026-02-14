import Foundation
import NaturalLanguage
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "EmbeddingEngine")

/// Error types for embedding operations
public enum EmbeddingError: LocalizedError {
    case embeddingNotAvailable(language: NLLanguage)
    case embeddingFailed(text: String)
    case batchTooLarge(count: Int, max: Int)
    case textTooLong(length: Int, max: Int)
    case unsupportedLanguage(String)

    public var errorDescription: String? {
        switch self {
        case .embeddingNotAvailable(let language):
            return "Embedding model not available for language: \(language.rawValue)"
        case .embeddingFailed(let text):
            return "Failed to generate embedding for text: \(text.prefix(50))..."
        case .batchTooLarge(let count, let max):
            return "Batch size \(count) exceeds maximum \(max)"
        case .textTooLong(let length, let max):
            return "Text length \(length) exceeds maximum \(max)"
        case .unsupportedLanguage(let lang):
            return "Unsupported language: \(lang)"
        }
    }
}

/// A text embedding vector
public struct TextEmbedding: Sendable, Codable {
    /// The original text that was embedded
    public let text: String

    /// The embedding vector
    public let vector: [Double]

    /// The dimension of the embedding
    public var dimension: Int { vector.count }

    /// Language used for embedding
    public let language: String

    public init(text: String, vector: [Double], language: String) {
        self.text = text
        self.vector = vector
        self.language = language
    }
}

/// Configuration for the embedding engine
public struct EmbeddingConfig: Sendable {
    /// Primary language for embedding (default: English)
    public let language: NLLanguage

    /// Whether to detect language automatically
    public let autoDetectLanguage: Bool

    /// Maximum text length for embedding
    public let maxTextLength: Int

    /// Maximum batch size for batch embedding
    public let maxBatchSize: Int

    public init(
        language: NLLanguage = .english,
        autoDetectLanguage: Bool = true,
        maxTextLength: Int = 10000,
        maxBatchSize: Int = 100
    ) {
        self.language = language
        self.autoDetectLanguage = autoDetectLanguage
        self.maxTextLength = maxTextLength
        self.maxBatchSize = maxBatchSize
    }

    public static let `default` = EmbeddingConfig()
}

/// Handles text embedding using Apple's NLEmbedding
///
/// ## Implementation
///
/// Uses Apple's built-in NLEmbedding (NaturalLanguage.framework) which provides:
/// - Sentence embeddings (iOS 17+, macOS 14+) for document text
/// - Word embeddings fallback with averaging for older systems
/// - High quality cosine similarity scores (0.5-0.95 range)
/// - Multilingual support (English, Korean, Japanese, Chinese, etc.)
/// - No additional model download required for supported languages
///
/// ## Availability
///
/// - Sentence embedding: iOS 17+, macOS 14+
/// - Word embedding fallback: iOS 13+, macOS 10.15+
/// For unsupported languages, the engine falls back to the default language (English).
///
public actor EmbeddingEngine {
    private let config: EmbeddingConfig
    private var wordEmbeddingCache: [NLLanguage: NLEmbedding] = [:]
    private var sentenceEmbeddingCache: [NLLanguage: NLEmbedding] = [:]
    private let languageRecognizer: NLLanguageRecognizer

    /// Dimension of embedding vectors (varies by language/model)
    public var embeddingDimension: Int {
        // NLEmbedding typically produces 512-dimensional vectors
        512
    }

    public init(config: EmbeddingConfig = .default) {
        self.config = config
        self.languageRecognizer = NLLanguageRecognizer()
    }

    // MARK: - Public API

    /// Generate an embedding for a single text
    /// - Parameter text: The text to embed
    /// - Returns: The embedding vector
    public func embed(text: String) async throws -> TextEmbedding {
        guard text.count <= config.maxTextLength else {
            throw EmbeddingError.textTooLong(length: text.count, max: config.maxTextLength)
        }

        let language = detectLanguage(for: text)

        // Try sentence embedding first (iOS 17+ / macOS 14+)
        if let sentenceEmbedding = try? getSentenceEmbedding(for: language),
           let vector = sentenceEmbedding.vector(for: text) {
            logger.info("Using SENTENCE embedding for '\(text.prefix(30))...' (lang=\(language.rawValue), dim=\(vector.count))")
            return TextEmbedding(
                text: text,
                vector: vector,
                language: language.rawValue
            )
        }

        // Fallback: average word embeddings for multi-word text
        logger.warning("SENTENCE embedding unavailable for \(language.rawValue), falling back to WORD embedding")
        let wordEmbedding = try getWordEmbedding(for: language)
        let vector = try computeAverageWordEmbedding(text: text, embedding: wordEmbedding)
        logger.info("Using WORD embedding for '\(text.prefix(30))...' (lang=\(language.rawValue), dim=\(vector.count))")

        return TextEmbedding(
            text: text,
            vector: vector,
            language: language.rawValue
        )
    }

    /// Generate embeddings for multiple texts
    /// - Parameter texts: Array of texts to embed
    /// - Returns: Array of embeddings in the same order
    public func embedBatch(texts: [String]) async throws -> [TextEmbedding] {
        guard texts.count <= config.maxBatchSize else {
            throw EmbeddingError.batchTooLarge(count: texts.count, max: config.maxBatchSize)
        }

        var results: [TextEmbedding] = []
        results.reserveCapacity(texts.count)

        for text in texts {
            let embedding = try await embed(text: text)
            results.append(embedding)
        }

        return results
    }

    /// Calculate cosine similarity between two embeddings
    /// - Parameters:
    ///   - embedding1: First embedding
    ///   - embedding2: Second embedding
    /// - Returns: Similarity score between -1 and 1
    public func cosineSimilarity(
        _ embedding1: TextEmbedding,
        _ embedding2: TextEmbedding
    ) -> Double {
        return cosineSimilarity(embedding1.vector, embedding2.vector)
    }

    /// Calculate cosine similarity between two vectors
    public func cosineSimilarity(_ vec1: [Double], _ vec2: [Double]) -> Double {
        guard vec1.count == vec2.count else { return 0 }

        var dotProduct: Double = 0
        var norm1: Double = 0
        var norm2: Double = 0

        for i in 0..<vec1.count {
            dotProduct += vec1[i] * vec2[i]
            norm1 += vec1[i] * vec1[i]
            norm2 += vec2[i] * vec2[i]
        }

        let denominator = sqrt(norm1) * sqrt(norm2)
        return denominator > 0 ? dotProduct / denominator : 0
    }

    /// Find the most similar embeddings to a query
    /// - Parameters:
    ///   - query: The query embedding
    ///   - candidates: Candidate embeddings to search
    ///   - topK: Number of results to return
    /// - Returns: Array of (embedding, similarity) pairs sorted by similarity
    public func findSimilar(
        query: TextEmbedding,
        candidates: [TextEmbedding],
        topK: Int = 5
    ) -> [(embedding: TextEmbedding, similarity: Double)] {
        let scored = candidates.map { candidate in
            (embedding: candidate, similarity: cosineSimilarity(query, candidate))
        }

        return scored
            .sorted { $0.similarity > $1.similarity }
            .prefix(topK)
            .map { $0 }
    }

    /// Check if embedding is available for a language
    public func isEmbeddingAvailable(for language: NLLanguage) -> Bool {
        // Check sentence embedding first, then word embedding
        if NLEmbedding.sentenceEmbedding(for: language) != nil {
            return true
        }
        return NLEmbedding.wordEmbedding(for: language) != nil
    }

    /// Get supported languages for embedding
    public func supportedLanguages() -> [NLLanguage] {
        let languages: [NLLanguage] = [
            .english,
            .french,
            .german,
            .italian,
            .spanish,
            .portuguese,
            .simplifiedChinese,
            .traditionalChinese,
            .japanese,
            .korean
        ]

        return languages.filter { isEmbeddingAvailable(for: $0) }
    }

    // MARK: - Private Helpers

    private func detectLanguage(for text: String) -> NLLanguage {
        if !config.autoDetectLanguage {
            return config.language
        }

        languageRecognizer.reset()
        languageRecognizer.processString(text)

        if let detected = languageRecognizer.dominantLanguage,
           isEmbeddingAvailable(for: detected) {
            return detected
        }

        return config.language
    }

    private func getSentenceEmbedding(for language: NLLanguage) throws -> NLEmbedding {
        if let cached = sentenceEmbeddingCache[language] {
            return cached
        }

        guard let embedding = NLEmbedding.sentenceEmbedding(for: language) else {
            throw EmbeddingError.embeddingNotAvailable(language: language)
        }

        sentenceEmbeddingCache[language] = embedding
        return embedding
    }

    private func getWordEmbedding(for language: NLLanguage) throws -> NLEmbedding {
        if let cached = wordEmbeddingCache[language] {
            return cached
        }

        guard let embedding = NLEmbedding.wordEmbedding(for: language) else {
            throw EmbeddingError.embeddingNotAvailable(language: language)
        }

        wordEmbeddingCache[language] = embedding
        return embedding
    }

    /// Compute average of word embeddings for multi-word text
    private func computeAverageWordEmbedding(text: String, embedding: NLEmbedding) throws -> [Double] {
        let tokenizer = NLTokenizer(unit: .word)
        tokenizer.string = text

        var wordVectors: [[Double]] = []

        tokenizer.enumerateTokens(in: text.startIndex..<text.endIndex) { range, _ in
            let word = String(text[range]).lowercased()
            if let vector = embedding.vector(for: word) {
                wordVectors.append(vector)
            }
            return true
        }

        // If no words were embedded, try the whole text as a single token
        if wordVectors.isEmpty {
            if let vector = embedding.vector(for: text.lowercased()) {
                return vector
            }
            throw EmbeddingError.embeddingFailed(text: text)
        }

        // Average all word vectors
        guard let dimension = wordVectors.first?.count else {
            throw EmbeddingError.embeddingFailed(text: text)
        }

        var result = [Double](repeating: 0, count: dimension)
        for vector in wordVectors {
            for i in 0..<dimension {
                result[i] += vector[i]
            }
        }

        let count = Double(wordVectors.count)
        return result.map { $0 / count }
    }
}

// MARK: - Vector Utilities

extension EmbeddingEngine {
    /// Normalize a vector to unit length
    public func normalize(_ vector: [Double]) -> [Double] {
        let magnitude = sqrt(vector.reduce(0) { $0 + $1 * $1 })
        guard magnitude > 0 else { return vector }
        return vector.map { $0 / magnitude }
    }

    /// Calculate Euclidean distance between two vectors
    public func euclideanDistance(_ vec1: [Double], _ vec2: [Double]) -> Double {
        guard vec1.count == vec2.count else { return Double.infinity }

        let sumSquares = zip(vec1, vec2).reduce(0.0) { result, pair in
            let diff = pair.0 - pair.1
            return result + diff * diff
        }

        return sqrt(sumSquares)
    }

    /// Average multiple embedding vectors
    public func averageVectors(_ vectors: [[Double]]) -> [Double]? {
        guard !vectors.isEmpty else { return nil }
        guard let dimension = vectors.first?.count else { return nil }

        var result = [Double](repeating: 0, count: dimension)

        for vector in vectors {
            guard vector.count == dimension else { continue }
            for i in 0..<dimension {
                result[i] += vector[i]
            }
        }

        let count = Double(vectors.count)
        return result.map { $0 / count }
    }
}
