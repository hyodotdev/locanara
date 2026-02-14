import Foundation
import SQLite3
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "VectorStore")

/// Error types for vector store operations
public enum VectorStoreError: LocalizedError {
    case databaseOpenFailed(path: String, message: String)
    case databaseNotOpen
    case queryFailed(message: String)
    case insertFailed(message: String)
    case deleteFailed(message: String)
    case vectorDimensionMismatch(expected: Int, got: Int)
    case collectionNotFound(id: String)
    case documentNotFound(id: String)
    case serializationFailed

    public var errorDescription: String? {
        switch self {
        case .databaseOpenFailed(let path, let message):
            return "Failed to open database at \(path): \(message)"
        case .databaseNotOpen:
            return "Database is not open"
        case .queryFailed(let message):
            return "Query failed: \(message)"
        case .insertFailed(let message):
            return "Insert failed: \(message)"
        case .deleteFailed(let message):
            return "Delete failed: \(message)"
        case .vectorDimensionMismatch(let expected, let got):
            return "Vector dimension mismatch: expected \(expected), got \(got)"
        case .collectionNotFound(let id):
            return "Collection not found: \(id)"
        case .documentNotFound(let id):
            return "Document not found: \(id)"
        case .serializationFailed:
            return "Failed to serialize/deserialize data"
        }
    }
}

/// A stored vector with its metadata
public struct StoredVector: Sendable, Codable {
    public let id: String
    public let collectionId: String
    public let documentId: String
    public let chunkIndex: Int
    public let content: String
    public let vector: [Double]
    public let metadata: [String: String]?
    public let createdAt: Date

    public init(
        id: String = UUID().uuidString,
        collectionId: String,
        documentId: String,
        chunkIndex: Int,
        content: String,
        vector: [Double],
        metadata: [String: String]? = nil,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.collectionId = collectionId
        self.documentId = documentId
        self.chunkIndex = chunkIndex
        self.content = content
        self.vector = vector
        self.metadata = metadata
        self.createdAt = createdAt
    }
}

/// Search result from vector store
public struct VectorSearchResult: Sendable {
    public let vector: StoredVector
    public let similarity: Double

    public init(vector: StoredVector, similarity: Double) {
        self.vector = vector
        self.similarity = similarity
    }
}

/// SQLite-based vector store for RAG
public actor VectorStore {
    nonisolated(unsafe) private var db: OpaquePointer?
    private let dbPath: String
    private let expectedDimension: Int

    /// Initialize vector store with database path
    /// - Parameters:
    ///   - path: Path to SQLite database file
    ///   - dimension: Expected embedding dimension
    public init(path: String? = nil, dimension: Int = 512) {
        if let path = path {
            self.dbPath = path
        } else {
            let documentsPath = FileManager.default.urls(
                for: .documentDirectory,
                in: .userDomainMask
            ).first!
            self.dbPath = documentsPath.appendingPathComponent("locanara_rag.db").path
        }
        self.expectedDimension = dimension
    }

    deinit {
        if let db = db {
            sqlite3_close(db)
        }
    }

    // MARK: - Database Management

    /// Open the database and create tables if needed
    public func open() throws {
        guard db == nil else { return }

        var dbPointer: OpaquePointer?
        let result = sqlite3_open(dbPath, &dbPointer)

        guard result == SQLITE_OK, let database = dbPointer else {
            let message = String(cString: sqlite3_errmsg(dbPointer))
            throw VectorStoreError.databaseOpenFailed(path: dbPath, message: message)
        }

        self.db = database
        try createTables()
    }

    /// Close the database
    public func close() {
        guard let db = db else { return }
        sqlite3_close(db)
        self.db = nil
    }

    private func createTables() throws {
        let createCollectionsSQL = """
            CREATE TABLE IF NOT EXISTS collections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            );
        """

        let createDocumentsSQL = """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                collection_id TEXT NOT NULL,
                title TEXT NOT NULL,
                chunk_count INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'PENDING',
                indexed_at REAL,
                error_message TEXT,
                metadata TEXT,
                FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
            );
        """

        let createVectorsSQL = """
            CREATE TABLE IF NOT EXISTS vectors (
                id TEXT PRIMARY KEY,
                collection_id TEXT NOT NULL,
                document_id TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                vector BLOB NOT NULL,
                metadata TEXT,
                created_at REAL NOT NULL,
                FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            );
        """

        let createIndexesSQL = """
            CREATE INDEX IF NOT EXISTS idx_vectors_collection ON vectors(collection_id);
            CREATE INDEX IF NOT EXISTS idx_vectors_document ON vectors(document_id);
            CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection_id);
        """

        try execute(createCollectionsSQL)
        try execute(createDocumentsSQL)
        try execute(createVectorsSQL)
        try execute(createIndexesSQL)
    }

    // MARK: - Collection Operations

    /// Create a new collection
    public func createCollection(
        id: String,
        name: String,
        description: String?
    ) throws -> RAGCollection {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        let sql = """
            INSERT INTO collections (id, name, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?);
        """

        let now = Date().timeIntervalSince1970

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.insertFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, id, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_text(statement, 2, name, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        if let description = description {
            sqlite3_bind_text(statement, 3, description, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        } else {
            sqlite3_bind_null(statement, 3)
        }
        sqlite3_bind_double(statement, 4, now)
        sqlite3_bind_double(statement, 5, now)

        guard sqlite3_step(statement) == SQLITE_DONE else {
            throw VectorStoreError.insertFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        return RAGCollection(
            collectionId: id,
            name: name,
            description: description,
            documentCount: 0,
            totalChunks: 0,
            createdAt: now,
            updatedAt: now
        )
    }

    /// Get all collections
    public func getCollections() throws -> [RAGCollection] {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        let sql = """
            SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM documents WHERE collection_id = c.id) as doc_count,
                   (SELECT COUNT(*) FROM vectors WHERE collection_id = c.id) as chunk_count
            FROM collections c
            ORDER BY c.created_at DESC;
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.queryFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        var collections: [RAGCollection] = []

        while sqlite3_step(statement) == SQLITE_ROW {
            let id = String(cString: sqlite3_column_text(statement, 0))
            let name = String(cString: sqlite3_column_text(statement, 1))
            let description = sqlite3_column_text(statement, 2).map { String(cString: $0) }
            let createdAt = sqlite3_column_double(statement, 3)
            let updatedAt = sqlite3_column_double(statement, 4)
            let docCount = Int(sqlite3_column_int(statement, 5))
            let chunkCount = Int(sqlite3_column_int(statement, 6))

            collections.append(RAGCollection(
                collectionId: id,
                name: name,
                description: description,
                documentCount: docCount,
                totalChunks: chunkCount,
                createdAt: createdAt,
                updatedAt: updatedAt
            ))
        }

        return collections
    }

    /// Get a collection by ID
    public func getCollection(id: String) throws -> RAGCollection? {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        let sql = """
            SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM documents WHERE collection_id = c.id) as doc_count,
                   (SELECT COUNT(*) FROM vectors WHERE collection_id = c.id) as chunk_count
            FROM collections c
            WHERE c.id = ?;
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.queryFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, id, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        guard sqlite3_step(statement) == SQLITE_ROW else {
            return nil
        }

        let collectionId = String(cString: sqlite3_column_text(statement, 0))
        let name = String(cString: sqlite3_column_text(statement, 1))
        let description = sqlite3_column_text(statement, 2).map { String(cString: $0) }
        let createdAt = sqlite3_column_double(statement, 3)
        let updatedAt = sqlite3_column_double(statement, 4)
        let docCount = Int(sqlite3_column_int(statement, 5))
        let chunkCount = Int(sqlite3_column_int(statement, 6))

        return RAGCollection(
            collectionId: collectionId,
            name: name,
            description: description,
            documentCount: docCount,
            totalChunks: chunkCount,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }

    /// Delete a collection and all its data
    public func deleteCollection(id: String) throws {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        // Delete vectors first
        try execute("DELETE FROM vectors WHERE collection_id = '\(id)';")

        // Delete documents
        try execute("DELETE FROM documents WHERE collection_id = '\(id)';")

        // Delete collection
        let sql = "DELETE FROM collections WHERE id = ?;"

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.deleteFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, id, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        guard sqlite3_step(statement) == SQLITE_DONE else {
            throw VectorStoreError.deleteFailed(message: String(cString: sqlite3_errmsg(db)))
        }
    }

    // MARK: - Document Operations

    /// Add a document to a collection
    public func addDocument(
        id: String,
        collectionId: String,
        title: String,
        metadata: [String: String]? = nil
    ) throws -> RAGDocument {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        let sql = """
            INSERT INTO documents (id, collection_id, title, status, metadata)
            VALUES (?, ?, ?, 'PENDING', ?);
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.insertFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, id, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_text(statement, 2, collectionId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_text(statement, 3, title, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        if let metadata = metadata,
           let metadataJSON = try? JSONEncoder().encode(metadata),
           let metadataString = String(data: metadataJSON, encoding: .utf8) {
            sqlite3_bind_text(statement, 4, metadataString, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        } else {
            sqlite3_bind_null(statement, 4)
        }

        guard sqlite3_step(statement) == SQLITE_DONE else {
            throw VectorStoreError.insertFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        // Update collection timestamp
        try updateCollectionTimestamp(collectionId)

        return RAGDocument(
            documentId: id,
            collectionId: collectionId,
            title: title,
            chunkCount: 0,
            status: .pending,
            indexedAt: nil,
            errorMessage: nil
        )
    }

    /// Update document status
    public func updateDocumentStatus(
        id: String,
        status: RAGDocumentStatus,
        chunkCount: Int? = nil,
        errorMessage: String? = nil
    ) throws {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        var sql = "UPDATE documents SET status = ?"
        var params: [Any?] = [status.rawValue]

        if let chunkCount = chunkCount {
            sql += ", chunk_count = ?"
            params.append(chunkCount)
        }

        if status == .indexed {
            sql += ", indexed_at = ?"
            params.append(Date().timeIntervalSince1970)
        }

        if let errorMessage = errorMessage {
            sql += ", error_message = ?"
            params.append(errorMessage)
        }

        sql += " WHERE id = ?;"
        params.append(id)

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.queryFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        // Bind parameters
        for (index, param) in params.enumerated() {
            let bindIndex = Int32(index + 1)
            switch param {
            case let string as String:
                sqlite3_bind_text(statement, bindIndex, string, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
            case let int as Int:
                sqlite3_bind_int(statement, bindIndex, Int32(int))
            case let double as Double:
                sqlite3_bind_double(statement, bindIndex, double)
            default:
                sqlite3_bind_null(statement, bindIndex)
            }
        }

        guard sqlite3_step(statement) == SQLITE_DONE else {
            throw VectorStoreError.queryFailed(message: String(cString: sqlite3_errmsg(db)))
        }
    }

    /// Get documents in a collection
    public func getDocuments(collectionId: String) throws -> [RAGDocument] {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        let sql = """
            SELECT id, collection_id, title, chunk_count, status, indexed_at, error_message
            FROM documents
            WHERE collection_id = ?
            ORDER BY indexed_at DESC;
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.queryFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, collectionId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        var documents: [RAGDocument] = []

        while sqlite3_step(statement) == SQLITE_ROW {
            let id = String(cString: sqlite3_column_text(statement, 0))
            let collId = String(cString: sqlite3_column_text(statement, 1))
            let title = String(cString: sqlite3_column_text(statement, 2))
            let chunkCount = Int(sqlite3_column_int(statement, 3))
            let statusString = String(cString: sqlite3_column_text(statement, 4))
            let indexedAt = sqlite3_column_type(statement, 5) != SQLITE_NULL
                ? sqlite3_column_double(statement, 5)
                : nil
            let errorMessage = sqlite3_column_text(statement, 6).map { String(cString: $0) }

            let status = RAGDocumentStatus(rawValue: statusString) ?? .pending

            documents.append(RAGDocument(
                documentId: id,
                collectionId: collId,
                title: title,
                chunkCount: chunkCount,
                status: status,
                indexedAt: indexedAt,
                errorMessage: errorMessage
            ))
        }

        return documents
    }

    /// Delete a document and its vectors
    public func deleteDocument(collectionId: String, documentId: String) throws {
        guard db != nil else { throw VectorStoreError.databaseNotOpen }

        // Delete vectors first
        try execute("DELETE FROM vectors WHERE document_id = '\(documentId)';")

        // Delete document
        try execute("DELETE FROM documents WHERE id = '\(documentId)';")

        // Update collection timestamp
        try updateCollectionTimestamp(collectionId)
    }

    // MARK: - Vector Operations

    /// Store a vector
    public func storeVector(_ storedVector: StoredVector) throws {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        logger.debug("storeVector: id=\(storedVector.id), collectionId=\(storedVector.collectionId), docId=\(storedVector.documentId), chunkIndex=\(storedVector.chunkIndex), vectorDim=\(storedVector.vector.count)")

        guard storedVector.vector.count == expectedDimension else {
            logger.error("Vector dimension mismatch: expected=\(self.expectedDimension), got=\(storedVector.vector.count)")
            throw VectorStoreError.vectorDimensionMismatch(
                expected: expectedDimension,
                got: storedVector.vector.count
            )
        }

        let sql = """
            INSERT INTO vectors (id, collection_id, document_id, chunk_index, content, vector, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            let errMsg = String(cString: sqlite3_errmsg(db))
            logger.error("storeVector prepare failed: \(errMsg)")
            throw VectorStoreError.insertFailed(message: errMsg)
        }

        // Serialize vector to Data using withUnsafeBytes for safe memory access
        let vectorData: Data = storedVector.vector.withUnsafeBytes { rawBuffer in
            Data(rawBuffer)
        }
        logger.debug("vectorData size: \(vectorData.count) bytes, first 3 doubles: \(storedVector.vector.prefix(3))")

        // Use withCString to ensure string pointers remain valid during binding
        // Keep vectorData.withUnsafeBytes scope around sqlite3_step to ensure blob data stays valid
        let stepResult: Int32 = storedVector.id.withCString { idPtr in
            storedVector.collectionId.withCString { collIdPtr in
                storedVector.documentId.withCString { docIdPtr in
                    storedVector.content.withCString { contentPtr in
                        vectorData.withUnsafeBytes { vectorBytes in
                            sqlite3_bind_text(statement, 1, idPtr, -1, nil)
                            sqlite3_bind_text(statement, 2, collIdPtr, -1, nil)
                            sqlite3_bind_text(statement, 3, docIdPtr, -1, nil)
                            sqlite3_bind_int(statement, 4, Int32(storedVector.chunkIndex))
                            sqlite3_bind_text(statement, 5, contentPtr, -1, nil)

                            // Bind blob - use SQLITE_STATIC since we're inside withUnsafeBytes
                            sqlite3_bind_blob(statement, 6, vectorBytes.baseAddress, Int32(vectorData.count), nil)

                            if let metadata = storedVector.metadata,
                               let metadataJSON = try? JSONEncoder().encode(metadata),
                               let metadataString = String(data: metadataJSON, encoding: .utf8) {
                                return metadataString.withCString { metaPtr in
                                    sqlite3_bind_text(statement, 7, metaPtr, -1, nil)
                                    sqlite3_bind_double(statement, 8, storedVector.createdAt.timeIntervalSince1970)
                                    return sqlite3_step(statement)
                                }
                            } else {
                                sqlite3_bind_null(statement, 7)
                                sqlite3_bind_double(statement, 8, storedVector.createdAt.timeIntervalSince1970)
                                return sqlite3_step(statement)
                            }
                        }
                    }
                }
            }
        }

        if stepResult != SQLITE_DONE {
            let errMsg = String(cString: sqlite3_errmsg(db))
            logger.error("storeVector step failed: result=\(stepResult), error=\(errMsg)")
            throw VectorStoreError.insertFailed(message: errMsg)
        }

        logger.info("storeVector SUCCESS: id=\(storedVector.id)")
    }

    /// Store multiple vectors in a batch
    public func storeVectors(_ vectors: [StoredVector]) throws {
        guard db != nil else { throw VectorStoreError.databaseNotOpen }

        try execute("BEGIN TRANSACTION;")

        do {
            for vector in vectors {
                try storeVector(vector)
            }
            try execute("COMMIT;")
        } catch {
            try? execute("ROLLBACK;")
            throw error
        }
    }

    /// Search for similar vectors
    public func search(
        queryVector: [Double],
        collectionId: String,
        topK: Int = 5,
        minSimilarity: Double = 0.0
    ) throws -> [VectorSearchResult] {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        logger.debug("search: collectionId=\(collectionId), queryVectorDim=\(queryVector.count), topK=\(topK)")

        guard queryVector.count == expectedDimension else {
            throw VectorStoreError.vectorDimensionMismatch(
                expected: expectedDimension,
                got: queryVector.count
            )
        }

        // Load all vectors for the collection and compute similarity
        // Note: For larger datasets, consider using a vector index extension
        let sql = """
            SELECT id, collection_id, document_id, chunk_index, content, vector, metadata, created_at
            FROM vectors
            WHERE collection_id = ?;
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.queryFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        // Bind collection ID using SQLITE_TRANSIENT so SQLite copies the string
        sqlite3_bind_text(statement, 1, collectionId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        var searchResults: [VectorSearchResult] = []
        var rowCount = 0
        var skippedDimension = 0
        var skippedBlob = 0

        while sqlite3_step(statement) == SQLITE_ROW {
            rowCount += 1
            let id = String(cString: sqlite3_column_text(statement, 0))
            let collId = String(cString: sqlite3_column_text(statement, 1))
            let docId = String(cString: sqlite3_column_text(statement, 2))
            let chunkIndex = Int(sqlite3_column_int(statement, 3))
            let content = String(cString: sqlite3_column_text(statement, 4))

            // Read vector blob
            let vectorBytes = sqlite3_column_bytes(statement, 5)
            guard let vectorBlob = sqlite3_column_blob(statement, 5) else {
                logger.warning("search: row \(rowCount) has NULL blob, id=\(id)")
                skippedBlob += 1
                continue
            }

            let vectorCount = Int(vectorBytes) / MemoryLayout<Double>.size
            logger.debug("search: row \(rowCount) id=\(id), blobBytes=\(vectorBytes), vectorCount=\(vectorCount)")

            let vector = Array(UnsafeBufferPointer(
                start: vectorBlob.assumingMemoryBound(to: Double.self),
                count: vectorCount
            ))

            logger.debug("search: row \(rowCount) first 3 doubles: \(vector.prefix(3))")

            guard vector.count == self.expectedDimension else {
                logger.warning("search: row \(rowCount) dimension mismatch: expected=\(self.expectedDimension), got=\(vector.count)")
                skippedDimension += 1
                continue
            }

            let metadataString = sqlite3_column_text(statement, 6).map { String(cString: $0) }
            let metadata = metadataString.flatMap { str -> [String: String]? in
                guard let data = str.data(using: .utf8) else { return nil }
                return try? JSONDecoder().decode([String: String].self, from: data)
            }

            let createdAt = Date(timeIntervalSince1970: sqlite3_column_double(statement, 7))

            // Compute cosine similarity
            let similarity = cosineSimilarity(queryVector, vector)
            logger.debug("search: row \(rowCount) similarity=\(similarity)")

            guard similarity >= minSimilarity else {
                logger.debug("search: row \(rowCount) filtered out (similarity \(similarity) < minSimilarity \(minSimilarity))")
                continue
            }

            let storedVector = StoredVector(
                id: id,
                collectionId: collId,
                documentId: docId,
                chunkIndex: chunkIndex,
                content: content,
                vector: vector,
                metadata: metadata,
                createdAt: createdAt
            )

            searchResults.append(VectorSearchResult(vector: storedVector, similarity: similarity))
        }

        logger.info("search: totalRows=\(rowCount), skippedBlob=\(skippedBlob), skippedDimension=\(skippedDimension), validResults=\(searchResults.count)")

        // Sort by similarity and take top K
        return searchResults
            .sorted { $0.similarity > $1.similarity }
            .prefix(topK)
            .map { $0 }
    }

    /// Get document title by ID
    public func getDocumentTitle(documentId: String) throws -> String? {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        let sql = "SELECT title FROM documents WHERE id = ?;"

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.queryFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, documentId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        guard sqlite3_step(statement) == SQLITE_ROW else {
            return nil
        }

        return String(cString: sqlite3_column_text(statement, 0))
    }

    // MARK: - Private Helpers

    private func execute(_ sql: String) throws {
        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        var errorMessage: UnsafeMutablePointer<CChar>?
        let result = sqlite3_exec(db, sql, nil, nil, &errorMessage)

        if result != SQLITE_OK {
            let message = errorMessage.map { String(cString: $0) } ?? "Unknown error"
            sqlite3_free(errorMessage)
            throw VectorStoreError.queryFailed(message: message)
        }
    }

    private func updateCollectionTimestamp(_ collectionId: String) throws {
        let sql = "UPDATE collections SET updated_at = ? WHERE id = ?;"

        guard let db = db else { throw VectorStoreError.databaseNotOpen }

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw VectorStoreError.queryFailed(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_double(statement, 1, Date().timeIntervalSince1970)
        sqlite3_bind_text(statement, 2, collectionId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        _ = sqlite3_step(statement)
    }

    private func cosineSimilarity(_ vec1: [Double], _ vec2: [Double]) -> Double {
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
}
