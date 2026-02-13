package com.locanara.personalization

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log
import com.locanara.FeedbackRecord
import com.locanara.FeatureType
import com.locanara.PersonalizationProfile
import java.util.UUID

/**
 * Error types for feedback collection
 */
sealed class FeedbackError : Exception() {
    data class DatabaseError(override val message: String) : FeedbackError()
    data class ProfileNotFound(val id: String) : FeedbackError() {
        override val message = "Profile not found: $id"
    }
    data class ExecutionNotFound(val id: String) : FeedbackError() {
        override val message = "Execution not found for feedback: $id"
    }
    object NotInitialized : FeedbackError() {
        override val message = "Feedback system not initialized"
    }
}

/**
 * Internal execution record for feedback tracking
 */
data class ExecutionRecord(
    val executionId: String,
    val profileId: String,
    val feature: FeatureType,
    val input: String,
    val output: String,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * Collects and stores user feedback on AI outputs
 */
class FeedbackCollector(
    context: Context
) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val TAG = "FeedbackCollector"
        private const val DATABASE_NAME = "locanara_personalization.db"
        private const val DATABASE_VERSION = 1

        private const val TABLE_PROFILES = "profiles"
        private const val TABLE_FEEDBACK = "feedback"

        private const val MAX_PENDING_EXECUTIONS = 100
    }

    // Pending executions waiting for feedback (in-memory)
    private val pendingExecutions = mutableMapOf<String, ExecutionRecord>()

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE $TABLE_PROFILES (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        """)

        db.execSQL("""
            CREATE TABLE $TABLE_FEEDBACK (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                feature TEXT NOT NULL,
                input TEXT NOT NULL,
                output TEXT NOT NULL,
                liked INTEGER NOT NULL,
                comment TEXT,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (profile_id) REFERENCES $TABLE_PROFILES(id) ON DELETE CASCADE
            )
        """)

        db.execSQL("CREATE INDEX idx_feedback_profile ON $TABLE_FEEDBACK(profile_id)")
        db.execSQL("CREATE INDEX idx_feedback_feature ON $TABLE_FEEDBACK(feature)")
        db.execSQL("CREATE INDEX idx_feedback_liked ON $TABLE_FEEDBACK(liked)")
        db.execSQL("CREATE INDEX idx_profiles_active ON $TABLE_PROFILES(is_active)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Handle migrations if needed
    }

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.setForeignKeyConstraintsEnabled(true)
    }

    //region Profile Management

    /**
     * Create a new personalization profile
     */
    fun createProfile(name: String): PersonalizationProfile {
        val profileId = UUID.randomUUID().toString()
        val now = System.currentTimeMillis()
        val db = writableDatabase

        val values = ContentValues().apply {
            put("id", profileId)
            put("name", name)
            put("is_active", 0)
            put("created_at", now)
            put("updated_at", now)
        }

        db.insertOrThrow(TABLE_PROFILES, null, values)
        Log.i(TAG, "Created profile: $profileId ($name)")

        return PersonalizationProfile(
            profileId = profileId,
            name = name,
            feedbackCount = 0,
            positiveFeedbackCount = 0,
            lastUpdated = now.toDouble(),
            isActive = false,
            createdAt = now.toDouble()
        )
    }

    /**
     * Get all profiles
     */
    fun getProfiles(): List<PersonalizationProfile> {
        val db = readableDatabase
        val profiles = mutableListOf<PersonalizationProfile>()

        val cursor = db.rawQuery("""
            SELECT p.id, p.name, p.is_active, p.created_at, p.updated_at,
                   (SELECT COUNT(*) FROM $TABLE_FEEDBACK WHERE profile_id = p.id) as feedback_count,
                   (SELECT COUNT(*) FROM $TABLE_FEEDBACK WHERE profile_id = p.id AND liked = 1) as positive_count
            FROM $TABLE_PROFILES p
            ORDER BY p.created_at DESC
        """, null)

        cursor.use {
            while (it.moveToNext()) {
                profiles.add(
                    PersonalizationProfile(
                        profileId = it.getString(0),
                        name = it.getString(1),
                        isActive = it.getInt(2) == 1,
                        createdAt = it.getLong(3).toDouble(),
                        lastUpdated = it.getLong(4).toDouble(),
                        feedbackCount = it.getInt(5),
                        positiveFeedbackCount = it.getInt(6)
                    )
                )
            }
        }

        return profiles
    }

    /**
     * Get a profile by ID
     */
    fun getProfile(profileId: String): PersonalizationProfile? {
        val db = readableDatabase

        val cursor = db.rawQuery("""
            SELECT p.id, p.name, p.is_active, p.created_at, p.updated_at,
                   (SELECT COUNT(*) FROM $TABLE_FEEDBACK WHERE profile_id = p.id) as feedback_count,
                   (SELECT COUNT(*) FROM $TABLE_FEEDBACK WHERE profile_id = p.id AND liked = 1) as positive_count
            FROM $TABLE_PROFILES p
            WHERE p.id = ?
        """, arrayOf(profileId))

        cursor.use {
            if (it.moveToFirst()) {
                return PersonalizationProfile(
                    profileId = it.getString(0),
                    name = it.getString(1),
                    isActive = it.getInt(2) == 1,
                    createdAt = it.getLong(3).toDouble(),
                    lastUpdated = it.getLong(4).toDouble(),
                    feedbackCount = it.getInt(5),
                    positiveFeedbackCount = it.getInt(6)
                )
            }
        }

        return null
    }

    /**
     * Get the active profile
     */
    fun getActiveProfile(): PersonalizationProfile? {
        val db = readableDatabase

        val cursor = db.rawQuery("""
            SELECT p.id, p.name, p.is_active, p.created_at, p.updated_at,
                   (SELECT COUNT(*) FROM $TABLE_FEEDBACK WHERE profile_id = p.id) as feedback_count,
                   (SELECT COUNT(*) FROM $TABLE_FEEDBACK WHERE profile_id = p.id AND liked = 1) as positive_count
            FROM $TABLE_PROFILES p
            WHERE p.is_active = 1
            LIMIT 1
        """, null)

        cursor.use {
            if (it.moveToFirst()) {
                return PersonalizationProfile(
                    profileId = it.getString(0),
                    name = it.getString(1),
                    isActive = true,
                    createdAt = it.getLong(3).toDouble(),
                    lastUpdated = it.getLong(4).toDouble(),
                    feedbackCount = it.getInt(5),
                    positiveFeedbackCount = it.getInt(6)
                )
            }
        }

        return null
    }

    /**
     * Activate a profile (deactivates all others)
     */
    fun activateProfile(profileId: String): PersonalizationProfile {
        val db = writableDatabase
        db.beginTransaction()
        try {
            // Deactivate all profiles
            db.execSQL("UPDATE $TABLE_PROFILES SET is_active = 0")

            // Activate the specified profile
            val values = ContentValues().apply {
                put("is_active", 1)
                put("updated_at", System.currentTimeMillis())
            }
            db.update(TABLE_PROFILES, values, "id = ?", arrayOf(profileId))

            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }

        return getProfile(profileId) ?: throw FeedbackError.ProfileNotFound(profileId)
    }

    /**
     * Deactivate all profiles
     */
    fun deactivateAllProfiles() {
        val db = writableDatabase
        db.execSQL("UPDATE $TABLE_PROFILES SET is_active = 0")
    }

    /**
     * Delete a profile and all its feedback
     */
    fun deleteProfile(profileId: String) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            db.delete(TABLE_FEEDBACK, "profile_id = ?", arrayOf(profileId))
            db.delete(TABLE_PROFILES, "id = ?", arrayOf(profileId))
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    //endregion

    //region Execution Tracking

    /**
     * Register an execution for potential feedback
     */
    fun registerExecution(record: ExecutionRecord) {
        synchronized(pendingExecutions) {
            // Clean up old entries if too many
            if (pendingExecutions.size >= MAX_PENDING_EXECUTIONS) {
                val oldestKeys = pendingExecutions.entries
                    .sortedBy { it.value.timestamp }
                    .take(pendingExecutions.size - MAX_PENDING_EXECUTIONS + 1)
                    .map { it.key }
                oldestKeys.forEach { pendingExecutions.remove(it) }
            }

            pendingExecutions[record.executionId] = record
        }
    }

    /**
     * Get a pending execution by ID
     */
    fun getPendingExecution(executionId: String): ExecutionRecord? {
        return synchronized(pendingExecutions) {
            pendingExecutions[executionId]
        }
    }

    //endregion

    //region Feedback Recording

    /**
     * Record feedback for an execution
     */
    fun recordFeedback(
        executionId: String,
        liked: Boolean,
        comment: String? = null
    ) {
        val execution = getPendingExecution(executionId)
            ?: throw FeedbackError.ExecutionNotFound(executionId)

        val feedbackId = UUID.randomUUID().toString()
        val db = writableDatabase

        val values = ContentValues().apply {
            put("id", feedbackId)
            put("profile_id", execution.profileId)
            put("feature", execution.feature.name)
            put("input", execution.input)
            put("output", execution.output)
            put("liked", if (liked) 1 else 0)
            put("comment", comment)
            put("timestamp", System.currentTimeMillis())
        }

        db.insertOrThrow(TABLE_FEEDBACK, null, values)

        // Update profile timestamp
        val updateValues = ContentValues().apply {
            put("updated_at", System.currentTimeMillis())
        }
        db.update(TABLE_PROFILES, updateValues, "id = ?", arrayOf(execution.profileId))

        // Remove from pending
        synchronized(pendingExecutions) {
            pendingExecutions.remove(executionId)
        }

        Log.i(TAG, "Recorded feedback for execution $executionId: ${if (liked) "liked" else "disliked"}")
    }

    /**
     * Get feedback history for a profile
     */
    fun getFeedbackHistory(profileId: String, limit: Int? = null): List<FeedbackRecord> {
        val db = readableDatabase
        val feedback = mutableListOf<FeedbackRecord>()

        val query = buildString {
            append("SELECT id, profile_id, feature, input, output, liked, timestamp ")
            append("FROM $TABLE_FEEDBACK ")
            append("WHERE profile_id = ? ")
            append("ORDER BY timestamp DESC")
            if (limit != null) {
                append(" LIMIT $limit")
            }
        }

        val cursor = db.rawQuery(query, arrayOf(profileId))

        cursor.use {
            while (it.moveToNext()) {
                val featureString = it.getString(2)
                val feature = try {
                    FeatureType.valueOf(featureString)
                } catch (e: IllegalArgumentException) {
                    Log.w(TAG, "Unknown feature type in database: $featureString, defaulting to CHAT")
                    FeatureType.CHAT
                }
                feedback.add(
                    FeedbackRecord(
                        feedbackId = it.getString(0),
                        profileId = it.getString(1),
                        feature = feature,
                        input = it.getString(3),
                        output = it.getString(4),
                        liked = it.getInt(5) == 1,
                        timestamp = it.getLong(6).toDouble()
                    )
                )
            }
        }

        return feedback
    }

    /**
     * Get positive feedback for analysis
     */
    fun getPositiveFeedback(profileId: String, limit: Int = 100): List<FeedbackRecord> {
        val db = readableDatabase
        val feedback = mutableListOf<FeedbackRecord>()

        val cursor = db.rawQuery("""
            SELECT id, profile_id, feature, input, output, liked, timestamp
            FROM $TABLE_FEEDBACK
            WHERE profile_id = ? AND liked = 1
            ORDER BY timestamp DESC
            LIMIT ?
        """, arrayOf(profileId, limit.toString()))

        cursor.use {
            while (it.moveToNext()) {
                val featureString = it.getString(2)
                val feature = try {
                    FeatureType.valueOf(featureString)
                } catch (e: IllegalArgumentException) {
                    Log.w(TAG, "Unknown feature type in database: $featureString, defaulting to CHAT")
                    FeatureType.CHAT
                }
                feedback.add(
                    FeedbackRecord(
                        feedbackId = it.getString(0),
                        profileId = it.getString(1),
                        feature = feature,
                        input = it.getString(3),
                        output = it.getString(4),
                        liked = true,
                        timestamp = it.getLong(6).toDouble()
                    )
                )
            }
        }

        return feedback
    }

    /**
     * Clear all feedback for a profile
     */
    fun clearFeedback(profileId: String) {
        val db = writableDatabase
        db.delete(TABLE_FEEDBACK, "profile_id = ?", arrayOf(profileId))
        Log.i(TAG, "Cleared feedback for profile: $profileId")
    }

    //endregion
}
