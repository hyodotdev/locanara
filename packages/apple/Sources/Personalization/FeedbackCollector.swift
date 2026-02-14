import Foundation
import SQLite3
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "FeedbackCollector")

/// Error types for feedback collection
public enum FeedbackError: LocalizedError {
    case databaseError(message: String)
    case profileNotFound(id: String)
    case executionNotFound(id: String)
    case notInitialized

    public var errorDescription: String? {
        switch self {
        case .databaseError(let message):
            return "Feedback database error: \(message)"
        case .profileNotFound(let id):
            return "Profile not found: \(id)"
        case .executionNotFound(let id):
            return "Execution not found for feedback: \(id)"
        case .notInitialized:
            return "Feedback system not initialized"
        }
    }
}

/// Internal execution record for feedback tracking
public struct ExecutionRecord: Sendable, Codable {
    public let executionId: String
    public let profileId: String
    public let feature: FeatureType
    public let input: String
    public let output: String
    public let timestamp: Date

    public init(
        executionId: String,
        profileId: String,
        feature: FeatureType,
        input: String,
        output: String,
        timestamp: Date = Date()
    ) {
        self.executionId = executionId
        self.profileId = profileId
        self.feature = feature
        self.input = input
        self.output = output
        self.timestamp = timestamp
    }
}

/// Collects and stores user feedback on AI outputs
public actor FeedbackCollector {
    nonisolated(unsafe) private var db: OpaquePointer?
    private let dbPath: String
    private var isInitialized = false

    // Pending executions waiting for feedback (in-memory)
    private var pendingExecutions: [String: ExecutionRecord] = [:]

    /// Maximum number of pending executions to keep in memory
    private let maxPendingExecutions = 100

    public init(databasePath: String? = nil) {
        if let path = databasePath {
            self.dbPath = path
        } else {
            let documentsPath = FileManager.default.urls(
                for: .documentDirectory,
                in: .userDomainMask
            ).first!
            self.dbPath = documentsPath.appendingPathComponent("locanara_personalization.db").path
        }
    }

    deinit {
        if let db = db {
            sqlite3_close(db)
        }
    }

    // MARK: - Initialization

    /// Initialize the feedback storage
    public func initialize() throws {
        guard !isInitialized else { return }

        var dbPointer: OpaquePointer?
        let result = sqlite3_open(dbPath, &dbPointer)

        guard result == SQLITE_OK, let database = dbPointer else {
            let message = String(cString: sqlite3_errmsg(dbPointer))
            throw FeedbackError.databaseError(message: message)
        }

        self.db = database
        try createTables()
        isInitialized = true

        logger.info("Feedback collector initialized at: \(self.dbPath)")
    }

    /// Shutdown the feedback collector
    public func shutdown() {
        if let db = db {
            sqlite3_close(db)
            self.db = nil
        }
        isInitialized = false
        pendingExecutions.removeAll()
    }

    private func createTables() throws {
        let createProfilesSQL = """
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 0,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            );
        """

        let createFeedbackSQL = """
            CREATE TABLE IF NOT EXISTS feedback (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                feature TEXT NOT NULL,
                input TEXT NOT NULL,
                output TEXT NOT NULL,
                liked INTEGER NOT NULL,
                comment TEXT,
                timestamp REAL NOT NULL,
                FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
            );
        """

        let createIndexesSQL = """
            CREATE INDEX IF NOT EXISTS idx_feedback_profile ON feedback(profile_id);
            CREATE INDEX IF NOT EXISTS idx_feedback_feature ON feedback(feature);
            CREATE INDEX IF NOT EXISTS idx_feedback_liked ON feedback(liked);
            CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
        """

        try execute(createProfilesSQL)
        try execute(createFeedbackSQL)
        try execute(createIndexesSQL)
    }

    // MARK: - Profile Management

    /// Create a new personalization profile
    public func createProfile(name: String) throws -> PersonalizationProfile {
        guard isInitialized else { throw FeedbackError.notInitialized }
        guard let db = db else { throw FeedbackError.notInitialized }

        let profileId = UUID().uuidString
        let now = Date().timeIntervalSince1970

        let sql = """
            INSERT INTO profiles (id, name, is_active, created_at, updated_at)
            VALUES (?, ?, 0, ?, ?);
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw FeedbackError.databaseError(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, profileId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_text(statement, 2, name, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_double(statement, 3, now)
        sqlite3_bind_double(statement, 4, now)

        guard sqlite3_step(statement) == SQLITE_DONE else {
            throw FeedbackError.databaseError(message: String(cString: sqlite3_errmsg(db)))
        }

        logger.info("Created profile: \(profileId) (\(name))")

        return PersonalizationProfile(
            profileId: profileId,
            name: name,
            feedbackCount: 0,
            positiveFeedbackCount: 0,
            lastUpdated: now,
            isActive: false,
            createdAt: now
        )
    }

    /// Get all profiles
    public func getProfiles() throws -> [PersonalizationProfile] {
        guard isInitialized else { throw FeedbackError.notInitialized }
        guard let db = db else { throw FeedbackError.notInitialized }

        let sql = """
            SELECT p.id, p.name, p.is_active, p.created_at, p.updated_at,
                   (SELECT COUNT(*) FROM feedback WHERE profile_id = p.id) as feedback_count,
                   (SELECT COUNT(*) FROM feedback WHERE profile_id = p.id AND liked = 1) as positive_count
            FROM profiles p
            ORDER BY p.created_at DESC;
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw FeedbackError.databaseError(message: String(cString: sqlite3_errmsg(db)))
        }

        var profiles: [PersonalizationProfile] = []

        while sqlite3_step(statement) == SQLITE_ROW {
            let id = String(cString: sqlite3_column_text(statement, 0))
            let name = String(cString: sqlite3_column_text(statement, 1))
            let isActive = sqlite3_column_int(statement, 2) != 0
            let createdAt = sqlite3_column_double(statement, 3)
            let updatedAt = sqlite3_column_double(statement, 4)
            let feedbackCount = Int(sqlite3_column_int(statement, 5))
            let positiveCount = Int(sqlite3_column_int(statement, 6))

            profiles.append(PersonalizationProfile(
                profileId: id,
                name: name,
                feedbackCount: feedbackCount,
                positiveFeedbackCount: positiveCount,
                lastUpdated: updatedAt,
                isActive: isActive,
                createdAt: createdAt
            ))
        }

        return profiles
    }

    /// Get the active profile
    public func getActiveProfile() throws -> PersonalizationProfile? {
        guard isInitialized else { throw FeedbackError.notInitialized }

        let profiles = try getProfiles()
        return profiles.first { $0.isActive }
    }

    /// Activate a profile (deactivates others)
    public func activateProfile(_ profileId: String) throws -> PersonalizationProfile {
        guard isInitialized else { throw FeedbackError.notInitialized }

        // Deactivate all profiles
        try execute("UPDATE profiles SET is_active = 0;")

        // Activate the specified profile
        try execute("UPDATE profiles SET is_active = 1, updated_at = \(Date().timeIntervalSince1970) WHERE id = '\(profileId)';")

        // Return the updated profile
        let profiles = try getProfiles()
        guard let profile = profiles.first(where: { $0.profileId == profileId }) else {
            throw FeedbackError.profileNotFound(id: profileId)
        }

        logger.info("Activated profile: \(profileId)")
        return profile
    }

    /// Deactivate all profiles
    public func deactivateProfiles() throws {
        guard isInitialized else { throw FeedbackError.notInitialized }
        try execute("UPDATE profiles SET is_active = 0;")
        logger.info("Deactivated all profiles")
    }

    /// Delete a profile
    public func deleteProfile(_ profileId: String) throws {
        guard isInitialized else { throw FeedbackError.notInitialized }

        // Delete feedback first (due to foreign key)
        try execute("DELETE FROM feedback WHERE profile_id = '\(profileId)';")

        // Delete profile
        try execute("DELETE FROM profiles WHERE id = '\(profileId)';")

        logger.info("Deleted profile: \(profileId)")
    }

    // MARK: - Execution Tracking

    /// Register an execution for potential feedback
    public func registerExecution(
        executionId: String,
        profileId: String,
        feature: FeatureType,
        input: String,
        output: String
    ) {
        let record = ExecutionRecord(
            executionId: executionId,
            profileId: profileId,
            feature: feature,
            input: input,
            output: output
        )

        pendingExecutions[executionId] = record

        // Prune old pending executions if needed
        if pendingExecutions.count > maxPendingExecutions {
            let sortedKeys = pendingExecutions.keys.sorted { a, b in
                (pendingExecutions[a]?.timestamp ?? Date.distantPast) <
                (pendingExecutions[b]?.timestamp ?? Date.distantPast)
            }

            for key in sortedKeys.prefix(pendingExecutions.count - maxPendingExecutions) {
                pendingExecutions.removeValue(forKey: key)
            }
        }

        logger.debug("Registered execution \(executionId) for feedback")
    }

    // MARK: - Feedback Recording

    /// Record feedback for an execution
    public func recordFeedback(
        executionId: String,
        liked: Bool,
        comment: String? = nil
    ) throws {
        guard isInitialized else { throw FeedbackError.notInitialized }
        guard let db = db else { throw FeedbackError.notInitialized }

        guard let execution = pendingExecutions[executionId] else {
            throw FeedbackError.executionNotFound(id: executionId)
        }

        let feedbackId = UUID().uuidString
        let now = Date().timeIntervalSince1970

        let sql = """
            INSERT INTO feedback (id, profile_id, feature, input, output, liked, comment, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw FeedbackError.databaseError(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, feedbackId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_text(statement, 2, execution.profileId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_text(statement, 3, execution.feature.rawValue, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_text(statement, 4, execution.input, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_text(statement, 5, execution.output, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_int(statement, 6, liked ? 1 : 0)

        if let comment = comment {
            sqlite3_bind_text(statement, 7, comment, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        } else {
            sqlite3_bind_null(statement, 7)
        }

        sqlite3_bind_double(statement, 8, now)

        guard sqlite3_step(statement) == SQLITE_DONE else {
            throw FeedbackError.databaseError(message: String(cString: sqlite3_errmsg(db)))
        }

        // Update profile timestamp
        try execute("UPDATE profiles SET updated_at = \(now) WHERE id = '\(execution.profileId)';")

        // Remove from pending
        pendingExecutions.removeValue(forKey: executionId)

        logger.info("Recorded feedback for \(executionId): \(liked ? "liked" : "disliked")")
    }

    // MARK: - Feedback Retrieval

    /// Get feedback history for a profile
    public func getFeedbackHistory(
        profileId: String,
        limit: Int? = nil
    ) throws -> [FeedbackRecord] {
        guard isInitialized else { throw FeedbackError.notInitialized }
        guard let db = db else { throw FeedbackError.notInitialized }

        var sql = """
            SELECT id, profile_id, feature, input, output, liked, timestamp
            FROM feedback
            WHERE profile_id = ?
            ORDER BY timestamp DESC
        """

        if let limit = limit {
            sql += " LIMIT \(limit)"
        }

        sql += ";"

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw FeedbackError.databaseError(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, profileId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        var records: [FeedbackRecord] = []

        while sqlite3_step(statement) == SQLITE_ROW {
            let id = String(cString: sqlite3_column_text(statement, 0))
            let profId = String(cString: sqlite3_column_text(statement, 1))
            let featureString = String(cString: sqlite3_column_text(statement, 2))
            let input = String(cString: sqlite3_column_text(statement, 3))
            let output = String(cString: sqlite3_column_text(statement, 4))
            let liked = sqlite3_column_int(statement, 5) != 0
            let timestamp = sqlite3_column_double(statement, 6)

            let feature = FeatureType(rawValue: featureString) ?? .chat

            records.append(FeedbackRecord(
                feedbackId: id,
                profileId: profId,
                feature: feature,
                input: input,
                output: output,
                liked: liked,
                timestamp: timestamp
            ))
        }

        return records
    }

    /// Get positive feedback examples for a feature
    public func getPositiveFeedback(
        profileId: String,
        feature: FeatureType,
        limit: Int = 10
    ) throws -> [FeedbackRecord] {
        guard isInitialized else { throw FeedbackError.notInitialized }
        guard let db = db else { throw FeedbackError.notInitialized }

        let sql = """
            SELECT id, profile_id, feature, input, output, liked, timestamp
            FROM feedback
            WHERE profile_id = ? AND feature = ? AND liked = 1
            ORDER BY timestamp DESC
            LIMIT ?;
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw FeedbackError.databaseError(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, profileId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_text(statement, 2, feature.rawValue, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
        sqlite3_bind_int(statement, 3, Int32(limit))

        var records: [FeedbackRecord] = []

        while sqlite3_step(statement) == SQLITE_ROW {
            let id = String(cString: sqlite3_column_text(statement, 0))
            let profId = String(cString: sqlite3_column_text(statement, 1))
            let featureString = String(cString: sqlite3_column_text(statement, 2))
            let input = String(cString: sqlite3_column_text(statement, 3))
            let output = String(cString: sqlite3_column_text(statement, 4))
            let liked = sqlite3_column_int(statement, 5) != 0
            let timestamp = sqlite3_column_double(statement, 6)

            let featureType = FeatureType(rawValue: featureString) ?? .chat

            records.append(FeedbackRecord(
                feedbackId: id,
                profileId: profId,
                feature: featureType,
                input: input,
                output: output,
                liked: liked,
                timestamp: timestamp
            ))
        }

        return records
    }

    /// Clear all feedback for a profile
    public func clearFeedback(profileId: String) throws {
        guard isInitialized else { throw FeedbackError.notInitialized }

        try execute("DELETE FROM feedback WHERE profile_id = '\(profileId)';")
        try execute("UPDATE profiles SET updated_at = \(Date().timeIntervalSince1970) WHERE id = '\(profileId)';")

        logger.info("Cleared feedback for profile: \(profileId)")
    }

    // MARK: - Statistics

    /// Get feedback statistics for a profile
    public func getStatistics(profileId: String) throws -> FeedbackStatistics {
        guard isInitialized else { throw FeedbackError.notInitialized }
        guard let db = db else { throw FeedbackError.notInitialized }

        let sql = """
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN liked = 1 THEN 1 ELSE 0 END) as positive,
                SUM(CASE WHEN liked = 0 THEN 1 ELSE 0 END) as negative
            FROM feedback
            WHERE profile_id = ?;
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw FeedbackError.databaseError(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, profileId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        guard sqlite3_step(statement) == SQLITE_ROW else {
            return FeedbackStatistics(totalFeedback: 0, positiveFeedback: 0, negativeFeedback: 0, featureBreakdown: [:])
        }

        let total = Int(sqlite3_column_int(statement, 0))
        let positive = Int(sqlite3_column_int(statement, 1))
        let negative = Int(sqlite3_column_int(statement, 2))

        // Get feature breakdown
        let breakdown = try getFeatureBreakdown(profileId: profileId)

        return FeedbackStatistics(
            totalFeedback: total,
            positiveFeedback: positive,
            negativeFeedback: negative,
            featureBreakdown: breakdown
        )
    }

    private func getFeatureBreakdown(profileId: String) throws -> [FeatureType: (positive: Int, negative: Int)] {
        guard let db = db else { throw FeedbackError.notInitialized }

        let sql = """
            SELECT feature,
                   SUM(CASE WHEN liked = 1 THEN 1 ELSE 0 END) as positive,
                   SUM(CASE WHEN liked = 0 THEN 1 ELSE 0 END) as negative
            FROM feedback
            WHERE profile_id = ?
            GROUP BY feature;
        """

        var statement: OpaquePointer?
        defer { sqlite3_finalize(statement) }

        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
            throw FeedbackError.databaseError(message: String(cString: sqlite3_errmsg(db)))
        }

        sqlite3_bind_text(statement, 1, profileId, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))

        var breakdown: [FeatureType: (positive: Int, negative: Int)] = [:]

        while sqlite3_step(statement) == SQLITE_ROW {
            let featureString = String(cString: sqlite3_column_text(statement, 0))
            let positive = Int(sqlite3_column_int(statement, 1))
            let negative = Int(sqlite3_column_int(statement, 2))

            if let feature = FeatureType(rawValue: featureString) {
                breakdown[feature] = (positive: positive, negative: negative)
            }
        }

        return breakdown
    }

    // MARK: - Private Helpers

    private func execute(_ sql: String) throws {
        guard let db = db else { throw FeedbackError.notInitialized }

        var errorMessage: UnsafeMutablePointer<CChar>?
        let result = sqlite3_exec(db, sql, nil, nil, &errorMessage)

        if result != SQLITE_OK {
            let message = errorMessage.map { String(cString: $0) } ?? "Unknown error"
            sqlite3_free(errorMessage)
            throw FeedbackError.databaseError(message: message)
        }
    }
}

/// Statistics about feedback for a profile
public struct FeedbackStatistics: Sendable {
    public let totalFeedback: Int
    public let positiveFeedback: Int
    public let negativeFeedback: Int
    public let featureBreakdown: [FeatureType: (positive: Int, negative: Int)]

    public var positiveRatio: Double {
        guard totalFeedback > 0 else { return 0 }
        return Double(positiveFeedback) / Double(totalFeedback)
    }

    public var hasEnoughData: Bool {
        return totalFeedback >= 10
    }
}
