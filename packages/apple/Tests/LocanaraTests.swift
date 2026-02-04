import XCTest
@testable import Locanara

@available(iOS 15.0, macOS 14.0, tvOS 15.0, watchOS 8.0, *)
final class LocanaraTests: XCTestCase {

    func testSDKVersion() {
        XCTAssertEqual(LocanaraClient.version, "1.0.1")
    }

    func testInitialization() async throws {
        let sdk = LocanaraClient.shared

        // Should not throw
        try await sdk.initialize()

        // Should be able to get device capability after initialization
        let capability = try sdk.getDeviceCapability()
        XCTAssertNotNil(capability)
    }

    func testDeviceInfo() {
        let deviceInfo = DeviceInfoIOS.current()

        XCTAssertFalse(deviceInfo.osVersion.isEmpty)
        XCTAssertFalse(deviceInfo.systemLanguages.isEmpty)
    }

    func testFeatureTypes() {
        let allFeatures = FeatureType.allCases

        XCTAssertTrue(allFeatures.contains(.summarize))
        XCTAssertTrue(allFeatures.contains(.classify))
        XCTAssertTrue(allFeatures.contains(.extract))
        XCTAssertTrue(allFeatures.contains(.chat))
        XCTAssertTrue(allFeatures.contains(.translate))
        XCTAssertTrue(allFeatures.contains(.rewrite))
    }

    func testContextPreferences() {
        let preferences = ContextPreferences()

        XCTAssertEqual(preferences.processingPreference, .auto)
        XCTAssertEqual(preferences.privacyLevel, .balanced)
        XCTAssertTrue(preferences.enableCaching)
    }
}
