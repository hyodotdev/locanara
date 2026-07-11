import XCTest
import SQLite3
@testable import Locanara

@available(iOS 15.0, macOS 14.0, *)
final class PersonalizationSecurityTests: XCTestCase {
    func testProfileMutationsTreatSQLMetacharactersAsData() async throws {
        let dbPath = FileManager.default.temporaryDirectory
            .appendingPathComponent("test_feedback_sql_\(UUID().uuidString).db").path
        let collector = FeedbackCollector(databasePath: dbPath)
        try await collector.initialize()

        addTeardownBlock {
            await collector.shutdown()
            try? FileManager.default.removeItem(atPath: dbPath)
        }

        let first = try await collector.createProfile(name: "First")
        _ = try await collector.createProfile(name: "Second")
        _ = try await collector.activateProfile(first.profileId)
        let adversarialID = "' OR 1=1 --"

        do {
            _ = try await collector.activateProfile(adversarialID)
            XCTFail("Activating an unknown profile should fail")
        } catch let error as FeedbackError {
            guard case .profileNotFound = error else { throw error }
        }

        let activeProfile = try await collector.getActiveProfile()
        XCTAssertEqual(activeProfile?.profileId, first.profileId)

        try await collector.deleteProfile(adversarialID)
        let profiles = try await collector.getProfiles()
        XCTAssertEqual(profiles.count, 2)
    }

    func testDeleteProfileRollsBackFeedbackWhenProfileDeleteFails() async throws {
        let dbPath = FileManager.default.temporaryDirectory
            .appendingPathComponent("test_feedback_rollback_\(UUID().uuidString).db").path
        let collector = FeedbackCollector(databasePath: dbPath)
        try await collector.initialize()

        addTeardownBlock {
            await collector.shutdown()
            try? FileManager.default.removeItem(atPath: dbPath)
        }

        let profile = try await collector.createProfile(name: "Rollback")
        await collector.registerExecution(
            executionId: "execution",
            profileId: profile.profileId,
            feature: .chat,
            input: "input",
            output: "output"
        )
        try await collector.recordFeedback(executionId: "execution", liked: true)
        let initialFeedback = try await collector.getFeedbackHistory(profileId: profile.profileId)
        XCTAssertEqual(initialFeedback.count, 1)

        try installProfileDeleteFailureTrigger(at: dbPath)

        do {
            try await collector.deleteProfile(profile.profileId)
            XCTFail("The profile delete trigger should abort the transaction")
        } catch let error as FeedbackError {
            guard case .databaseError(let message) = error else { throw error }
            XCTAssertTrue(message.contains("forced profile delete failure"))
        }

        let remainingProfiles = try await collector.getProfiles()
        XCTAssertTrue(remainingProfiles.contains { $0.profileId == profile.profileId })
        let remainingFeedback = try await collector.getFeedbackHistory(profileId: profile.profileId)
        XCTAssertEqual(
            remainingFeedback.count,
            1,
            "The preceding feedback delete must roll back with the profile delete"
        )
    }

    private func installProfileDeleteFailureTrigger(at databasePath: String) throws {
        var database: OpaquePointer?
        guard sqlite3_open(databasePath, &database) == SQLITE_OK, let database else {
            throw FeedbackError.databaseError(message: "Unable to open test database")
        }
        defer { sqlite3_close(database) }

        let sql = """
            CREATE TRIGGER fail_profile_delete
            BEFORE DELETE ON profiles
            BEGIN
                SELECT RAISE(ABORT, 'forced profile delete failure');
            END;
        """
        var errorMessage: UnsafeMutablePointer<CChar>?
        guard sqlite3_exec(database, sql, nil, nil, &errorMessage) == SQLITE_OK else {
            let message = errorMessage.map { String(cString: $0) } ?? "Unknown trigger error"
            sqlite3_free(errorMessage)
            throw FeedbackError.databaseError(message: message)
        }
    }
}
