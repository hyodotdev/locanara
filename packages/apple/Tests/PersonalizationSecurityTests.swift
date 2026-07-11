import XCTest
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
}
