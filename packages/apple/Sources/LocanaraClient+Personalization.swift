import Foundation

/// Personalization extensions for LocanaraClient
///
/// These methods provide on-device AI personalization:
/// - Create and manage personalization profiles
/// - Record feedback on AI outputs (like/dislike)
/// - Execute features with personalization based on learned preferences
///
/// All data is stored locally on the device for privacy.
@available(iOS 15.0, macOS 14.0, *)
extension LocanaraClient {

    // MARK: - Personalization Components (lazy-loaded)

    nonisolated(unsafe) private static var _personalizationManager: PersonalizationManager?
    nonisolated(unsafe) private static var _personalizationInitialized = false
    private static let _personalizationLock = NSLock()

    private var personalizationManager: PersonalizationManager {
        Self._personalizationLock.lock()
        defer { Self._personalizationLock.unlock() }
        if Self._personalizationManager == nil {
            Self._personalizationManager = PersonalizationManager()
        }
        return Self._personalizationManager!
    }

    // MARK: - Initialization

    /// Initialize the personalization system
    ///
    /// Must be called before using any personalization features.
    /// - Throws: PersonalizationError if initialization fails
    public func initializePersonalization() async throws {
        guard !Self._personalizationLock.withLock({ Self._personalizationInitialized }) else { return }

        try await personalizationManager.initialize()

        // Connect inference router if available
        if InferenceRouter.shared.isModelReady() {
            await personalizationManager.setInferenceRouter(InferenceRouter.shared)
        }

        Self._personalizationLock.withLock { Self._personalizationInitialized = true }
    }

    /// Shutdown the personalization system
    public func shutdownPersonalization() async {
        guard Self._personalizationLock.withLock({ Self._personalizationInitialized }) else { return }
        await personalizationManager.shutdown()
        Self._personalizationLock.withLock {
            Self._personalizationManager = nil
            Self._personalizationInitialized = false
        }
    }

    /// Check if personalization is initialized
    public var isPersonalizationInitialized: Bool {
        Self._personalizationLock.withLock { Self._personalizationInitialized }
    }

    // MARK: - Profile Management

    /// Create a new personalization profile
    ///
    /// - Parameter name: Human-readable profile name
    /// - Returns: The created profile
    /// - Throws: PersonalizationError if creation fails
    public func createPersonalizationProfile(name: String) async throws -> PersonalizationProfile {
        try ensurePersonalizationInitialized()
        return try await personalizationManager.createProfile(name: name)
    }

    /// Get all personalization profiles
    ///
    /// - Returns: Array of all profiles
    /// - Throws: PersonalizationError if query fails
    public func getPersonalizationProfiles() async throws -> [PersonalizationProfile] {
        try ensurePersonalizationInitialized()
        return try await personalizationManager.getProfiles()
    }

    /// Get the active personalization profile
    ///
    /// - Returns: The active profile, or nil if none is active
    /// - Throws: PersonalizationError if query fails
    public func getActivePersonalizationProfile() async throws -> PersonalizationProfile? {
        try ensurePersonalizationInitialized()
        return try await personalizationManager.getActiveProfile()
    }

    /// Activate a personalization profile
    ///
    /// Only one profile can be active at a time. Activating a profile
    /// deactivates any previously active profile.
    /// - Parameter profileId: Profile ID to activate
    /// - Returns: The activated profile
    /// - Throws: PersonalizationError if activation fails
    public func activatePersonalizationProfile(_ profileId: String) async throws -> PersonalizationProfile {
        try ensurePersonalizationInitialized()
        return try await personalizationManager.activateProfile(profileId)
    }

    /// Deactivate the current personalization profile
    ///
    /// After calling this, personalized execution will fail until a
    /// profile is activated.
    /// - Throws: PersonalizationError if deactivation fails
    public func deactivatePersonalizationProfile() async throws {
        try ensurePersonalizationInitialized()
        try await personalizationManager.deactivateProfile()
    }

    /// Delete a personalization profile
    ///
    /// This also deletes all feedback data associated with the profile.
    /// - Parameter profileId: Profile ID to delete
    /// - Throws: PersonalizationError if deletion fails
    public func deletePersonalizationProfile(_ profileId: String) async throws {
        try ensurePersonalizationInitialized()
        try await personalizationManager.deleteProfile(profileId)
    }

    // MARK: - Feedback Recording

    /// Record feedback for an AI execution
    ///
    /// Feedback is used to learn user preferences and improve future responses.
    /// - Parameters:
    ///   - executionId: The execution ID returned from personalized execution
    ///   - liked: Whether the user liked this response
    ///   - comment: Optional comment explaining the feedback
    /// - Throws: PersonalizationError if recording fails
    public func recordFeedback(
        executionId: String,
        liked: Bool,
        comment: String? = nil
    ) async throws {
        try ensurePersonalizationInitialized()
        try await personalizationManager.recordFeedback(
            executionId: executionId,
            liked: liked,
            comment: comment
        )
    }

    /// Get feedback history for a profile
    ///
    /// - Parameters:
    ///   - profileId: Profile ID
    ///   - limit: Maximum number of records to return
    /// - Returns: Array of feedback records
    /// - Throws: PersonalizationError if query fails
    public func getFeedbackHistory(
        profileId: String,
        limit: Int? = nil
    ) async throws -> [FeedbackRecord] {
        try ensurePersonalizationInitialized()
        return try await personalizationManager.getFeedbackHistory(
            profileId: profileId,
            limit: limit
        )
    }

    /// Clear all feedback for a profile
    ///
    /// This resets the learned preferences without deleting the profile.
    /// - Parameter profileId: Profile ID
    /// - Throws: PersonalizationError if clearing fails
    public func clearFeedback(profileId: String) async throws {
        try ensurePersonalizationInitialized()
        try await personalizationManager.clearFeedback(profileId: profileId)
    }

    // MARK: - Personalized Execution

    /// Execute an AI feature with personalization
    ///
    /// Uses the active profile (or specified profile) to personalize the
    /// AI response based on learned preferences.
    /// - Parameters:
    ///   - input: Standard feature execution input
    ///   - profileId: Optional profile ID (uses active profile if not specified)
    /// - Returns: Personalized execution result with feedback ID
    /// - Throws: PersonalizationError if execution fails
    public func executePersonalized(
        input: ExecuteFeatureInput,
        profileId: String? = nil
    ) async throws -> PersonalizedExecutionResult {
        try ensurePersonalizationInitialized()

        // Ensure inference engine is connected
        if InferenceRouter.shared.isModelReady() {
            await personalizationManager.setInferenceRouter(InferenceRouter.shared)
        }

        return try await personalizationManager.executePersonalized(
            input: input,
            profileId: profileId
        )
    }

    // MARK: - Preferences & Statistics

    /// Get analyzed preferences for a profile
    ///
    /// Returns the preferences learned from feedback.
    /// - Parameter profileId: Profile ID
    /// - Returns: User preferences object
    /// - Throws: PersonalizationError if analysis fails
    public func getPersonalizationPreferences(profileId: String) async throws -> UserPreferences {
        try ensurePersonalizationInitialized()
        return try await personalizationManager.getPreferences(profileId: profileId)
    }

    /// Get feedback statistics for a profile
    ///
    /// - Parameter profileId: Profile ID
    /// - Returns: Feedback statistics
    /// - Throws: PersonalizationError if query fails
    public func getPersonalizationStatistics(profileId: String) async throws -> FeedbackStatistics {
        try ensurePersonalizationInitialized()
        return try await personalizationManager.getStatistics(profileId: profileId)
    }

    // MARK: - Private Helpers

    private func ensurePersonalizationInitialized() throws {
        guard Self._personalizationLock.withLock({ Self._personalizationInitialized }) else {
            throw PersonalizationError.notInitialized
        }
    }
}
