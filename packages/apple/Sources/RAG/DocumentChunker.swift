import Foundation
import NaturalLanguage

/// Configuration for document chunking
public struct ChunkingConfig: Sendable {
    /// Target chunk size in characters (approximate)
    public let targetChunkSize: Int

    /// Overlap between chunks in characters
    public let chunkOverlap: Int

    /// Whether to respect sentence boundaries
    public let respectSentences: Bool

    /// Minimum chunk size (smaller chunks will be merged)
    public let minChunkSize: Int

    public init(
        targetChunkSize: Int = 512,
        chunkOverlap: Int = 50,
        respectSentences: Bool = true,
        minChunkSize: Int = 100
    ) {
        self.targetChunkSize = targetChunkSize
        self.chunkOverlap = chunkOverlap
        self.respectSentences = respectSentences
        self.minChunkSize = minChunkSize
    }

    /// Default configuration optimized for on-device embedding
    public static let `default` = ChunkingConfig()

    /// Configuration for longer documents
    public static let longDocument = ChunkingConfig(
        targetChunkSize: 1024,
        chunkOverlap: 100,
        respectSentences: true,
        minChunkSize: 200
    )
}

/// A chunk of text extracted from a document
public struct DocumentChunk: Sendable, Codable {
    /// Unique identifier for this chunk
    public let id: String

    /// The text content of this chunk
    public let content: String

    /// Position of this chunk in the original document (0-indexed)
    public let index: Int

    /// Character offset in the original document
    public let startOffset: Int

    /// Character end offset in the original document
    public let endOffset: Int

    /// Optional metadata
    public let metadata: [String: String]?

    public init(
        id: String = UUID().uuidString,
        content: String,
        index: Int,
        startOffset: Int,
        endOffset: Int,
        metadata: [String: String]? = nil
    ) {
        self.id = id
        self.content = content
        self.index = index
        self.startOffset = startOffset
        self.endOffset = endOffset
        self.metadata = metadata
    }
}

/// Handles splitting documents into chunks for RAG indexing
public actor DocumentChunker {
    private let config: ChunkingConfig
    private let tokenizer: NLTokenizer

    public init(config: ChunkingConfig = .default) {
        self.config = config
        self.tokenizer = NLTokenizer(unit: .sentence)
    }

    /// Chunk a document into smaller pieces for embedding
    /// - Parameters:
    ///   - text: The full document text
    ///   - metadata: Optional metadata to attach to each chunk
    /// - Returns: Array of document chunks
    public func chunk(
        text: String,
        metadata: [String: String]? = nil
    ) -> [DocumentChunk] {
        guard !text.isEmpty else { return [] }

        if config.respectSentences {
            return chunkBySentences(text: text, metadata: metadata)
        } else {
            return chunkByCharacters(text: text, metadata: metadata)
        }
    }

    /// Chunk text respecting sentence boundaries
    private func chunkBySentences(
        text: String,
        metadata: [String: String]?
    ) -> [DocumentChunk] {
        tokenizer.string = text

        var sentences: [(String, Range<String.Index>)] = []
        tokenizer.enumerateTokens(in: text.startIndex..<text.endIndex) { range, _ in
            let sentence = String(text[range])
            sentences.append((sentence, range))
            return true
        }

        guard !sentences.isEmpty else {
            // Fallback to character-based chunking
            return chunkByCharacters(text: text, metadata: metadata)
        }

        var chunks: [DocumentChunk] = []
        var currentChunkText = ""
        var chunkStartIndex: String.Index = text.startIndex

        for (_, (sentence, range)) in sentences.enumerated() {
            let potentialChunk = currentChunkText + sentence

            if potentialChunk.count > config.targetChunkSize && !currentChunkText.isEmpty {
                // Current chunk is full, save it
                let startOffset = text.distance(from: text.startIndex, to: chunkStartIndex)
                let endOffset = startOffset + currentChunkText.count

                let chunk = DocumentChunk(
                    content: currentChunkText.trimmingCharacters(in: .whitespacesAndNewlines),
                    index: chunks.count,
                    startOffset: startOffset,
                    endOffset: endOffset,
                    metadata: metadata
                )

                if chunk.content.count >= config.minChunkSize {
                    chunks.append(chunk)
                }

                // Start new chunk with overlap
                let overlapText = getOverlapText(from: currentChunkText)
                currentChunkText = overlapText + sentence
                chunkStartIndex = range.lowerBound

                // Adjust for overlap
                if !overlapText.isEmpty {
                    let overlapStart = text.index(range.lowerBound, offsetBy: -overlapText.count, limitedBy: text.startIndex) ?? text.startIndex
                    chunkStartIndex = overlapStart
                }
            } else {
                currentChunkText = potentialChunk
                if chunks.isEmpty && currentChunkText == sentence {
                    chunkStartIndex = range.lowerBound
                }
            }
        }

        // Add remaining text as final chunk
        if !currentChunkText.isEmpty {
            let startOffset = text.distance(from: text.startIndex, to: chunkStartIndex)
            let endOffset = startOffset + currentChunkText.count

            let chunk = DocumentChunk(
                content: currentChunkText.trimmingCharacters(in: .whitespacesAndNewlines),
                index: chunks.count,
                startOffset: startOffset,
                endOffset: min(endOffset, text.count),
                metadata: metadata
            )

            // Merge with previous chunk if too small
            if chunk.content.count < config.minChunkSize && !chunks.isEmpty {
                let lastChunk = chunks.removeLast()
                let mergedContent = lastChunk.content + " " + chunk.content
                chunks.append(DocumentChunk(
                    id: lastChunk.id,
                    content: mergedContent,
                    index: lastChunk.index,
                    startOffset: lastChunk.startOffset,
                    endOffset: chunk.endOffset,
                    metadata: metadata
                ))
            } else if chunk.content.count >= config.minChunkSize {
                chunks.append(chunk)
            } else if chunks.isEmpty && !chunk.content.isEmpty {
                // Always create at least one chunk even if smaller than minChunkSize
                chunks.append(chunk)
            }
        }

        return chunks
    }

    /// Chunk text by character count (simpler approach)
    private func chunkByCharacters(
        text: String,
        metadata: [String: String]?
    ) -> [DocumentChunk] {
        var chunks: [DocumentChunk] = []
        var currentIndex = text.startIndex
        var chunkIndex = 0

        while currentIndex < text.endIndex {
            let remainingDistance = text.distance(from: currentIndex, to: text.endIndex)
            let chunkSize = min(config.targetChunkSize, remainingDistance)

            let endIndex = text.index(currentIndex, offsetBy: chunkSize)
            let chunkText = String(text[currentIndex..<endIndex])

            let startOffset = text.distance(from: text.startIndex, to: currentIndex)
            let endOffset = startOffset + chunkText.count

            let chunk = DocumentChunk(
                content: chunkText.trimmingCharacters(in: .whitespacesAndNewlines),
                index: chunkIndex,
                startOffset: startOffset,
                endOffset: endOffset,
                metadata: metadata
            )

            // Always add if large enough, or if it's the only chunk (allow short documents)
            if chunk.content.count >= config.minChunkSize || (chunks.isEmpty && !chunk.content.isEmpty) {
                chunks.append(chunk)
                chunkIndex += 1
            }

            // Move forward with overlap
            let moveDistance = max(1, chunkSize - config.chunkOverlap)
            if let nextIndex = text.index(currentIndex, offsetBy: moveDistance, limitedBy: text.endIndex) {
                currentIndex = nextIndex
            } else {
                break
            }
        }

        return chunks
    }

    /// Get overlap text from the end of a chunk
    private func getOverlapText(from text: String) -> String {
        guard config.chunkOverlap > 0 else { return "" }

        let overlapSize = min(config.chunkOverlap, text.count)
        let startIndex = text.index(text.endIndex, offsetBy: -overlapSize)
        return String(text[startIndex...])
    }
}

// MARK: - Convenience Methods

extension DocumentChunker {
    /// Estimate the number of chunks for a given text
    public func estimateChunkCount(for text: String) -> Int {
        guard !text.isEmpty else { return 0 }
        let effectiveChunkSize = config.targetChunkSize - config.chunkOverlap
        return max(1, (text.count + effectiveChunkSize - 1) / effectiveChunkSize)
    }

    /// Get chunking statistics for debugging
    public func getChunkingStats(chunks: [DocumentChunk]) -> ChunkingStats {
        guard !chunks.isEmpty else {
            return ChunkingStats(count: 0, minSize: 0, maxSize: 0, avgSize: 0, totalSize: 0)
        }

        let sizes = chunks.map { $0.content.count }
        let total = sizes.reduce(0, +)

        return ChunkingStats(
            count: chunks.count,
            minSize: sizes.min() ?? 0,
            maxSize: sizes.max() ?? 0,
            avgSize: total / chunks.count,
            totalSize: total
        )
    }
}

/// Statistics about chunking results
public struct ChunkingStats: Sendable {
    public let count: Int
    public let minSize: Int
    public let maxSize: Int
    public let avgSize: Int
    public let totalSize: Int
}
