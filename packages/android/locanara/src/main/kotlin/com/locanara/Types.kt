// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from GraphQL schema

package com.locanara

import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.Serializable

// ============================================
// ENUMS
// ============================================

@Serializable
enum class EventCategory {
    CAPABILITY,
    MODEL,
    EXECUTION,
    CONTEXT,
    SYSTEM
}

@Serializable
enum class ImagePlaygroundStyleIOS {
    ANIMATION,
    ILLUSTRATION,
    SKETCH
}

@Serializable
enum class Platform {
    IOS,
    ANDROID,
    WEB
}

@Serializable
enum class FeatureType {
    SUMMARIZE,
    CLASSIFY,
    EXTRACT,
    CHAT,
    TRANSLATE,
    REWRITE,
    PROOFREAD,
    DESCRIBE_IMAGE,
    GENERATE_IMAGE,
    DESCRIBE_IMAGE_ANDROID,
    GENERATE_IMAGE_IOS
}

@Serializable
enum class SummarizeInputType {
    ARTICLE,
    CONVERSATION
}

@Serializable
enum class SummarizeOutputType {
    ONE_BULLET,
    TWO_BULLETS,
    THREE_BULLETS
}

@Serializable
enum class RewriteOutputType {
    ELABORATE,
    EMOJIFY,
    SHORTEN,
    FRIENDLY,
    PROFESSIONAL,
    REPHRASE
}

@Serializable
enum class ProofreadInputType {
    KEYBOARD,
    VOICE
}

@Serializable
enum class MLKitLanguage {
    ENGLISH,
    JAPANESE,
    KOREAN,
    FRENCH,
    GERMAN,
    ITALIAN,
    SPANISH
}

@Serializable
enum class FeatureStatus {
    UNAVAILABLE,
    DOWNLOADABLE,
    DOWNLOADING,
    AVAILABLE
}

@Serializable
enum class CapabilityLevel {
    NONE,
    LIMITED,
    FULL
}

@Serializable
enum class ProcessingPreference {
    ON_DEVICE_ONLY,
    ON_DEVICE_PREFERRED,
    CLOUD_PREFERRED,
    AUTO
}

@Serializable
enum class PrivacyLevel {
    STRICT,
    BALANCED,
    PERMISSIVE
}

@Serializable
enum class ExecutionState {
    IDLE,
    PREPARING,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED
}

@Serializable
enum class LocanaraEvent {
    CAPABILITY_CHANGED,
    MODEL_LOADED,
    MODEL_UNLOADED,
    EXECUTION_STARTED,
    EXECUTION_COMPLETED,
    EXECUTION_FAILED,
    CONTEXT_UPDATED
}

@Serializable
enum class ProcessingLocation {
    ON_DEVICE,
    CLOUD,
    HYBRID
}

@Serializable
enum class InferenceEngineType {
    FOUNDATION_MODELS,  // iOS: Apple Intelligence
    GEMINI_NANO,        // Android: ML Kit / AICore
    EXECUTORCH,         // Android: ExecuTorch (PyTorch)
    NONE                // No engine available
}

@Serializable
enum class ErrorCode {
    SDK_NOT_INITIALIZED,
    INITIALIZATION_FAILED,
    FEATURE_NOT_AVAILABLE,
    FEATURE_NOT_SUPPORTED,
    MODEL_NOT_LOADED,
    MODEL_DOWNLOAD_REQUIRED,
    EXECUTION_FAILED,
    EXECUTION_TIMEOUT,
    EXECUTION_CANCELLED,
    INVALID_INPUT,
    INPUT_TOO_LONG,
    INSUFFICIENT_MEMORY,
    LOW_POWER_MODE,
    DEVICE_NOT_SUPPORTED,
    CONTEXT_NOT_FOUND,
    CONTEXT_INVALID,
    PERMISSION_DENIED,
    PERMISSION_NOT_GRANTED,
    NETWORK_UNAVAILABLE,
    API_ERROR,
    MODEL_NOT_FOUND,
    MODEL_LOAD_FAILED,
    MODEL_BUSY,
    BACKGROUND_USE_BLOCKED,
    UNKNOWN_ERROR,
    INTERNAL_ERROR
}

// ============================================
// TYPES
// ============================================

@Serializable
data class CapabilityChangedEvent(
    val previous: DeviceCapability? = null,
    val current: DeviceCapability,
    val reason: String? = null
) : EventData

@Serializable
data class ModelLoadedEvent(
    val modelInfo: ModelInfo,
    val availableFeatures: List<FeatureType>,
    val loadTimeMs: Int? = null
) : EventData

@Serializable
data class ModelUnloadedEvent(
    val modelInfo: ModelInfo,
    val reason: String? = null
) : EventData

@Serializable
data class ExecutionStartedEvent(
    val executionId: String,
    val feature: FeatureType,
    val processingLocation: ProcessingLocation
) : EventData

@Serializable
data class ExecutionCompletedEvent(
    val executionId: String,
    val feature: FeatureType,
    val processingTimeMs: Int,
    val resultSizeBytes: Int? = null
) : EventData

@Serializable
data class ExecutionFailedEvent(
    val executionId: String,
    val feature: FeatureType,
    val error: ExecutionError
) : EventData

@Serializable
data class ContextUpdatedEvent(
    val contextId: String,
    val actionCount: Int,
    val preferences: ContextPreferences? = null
) : EventData

@Serializable
data class Event(
    val id: String,
    val type: LocanaraEvent,
    val category: EventCategory,
    val timestamp: Double,
    val data: EventData? = null,
    val platform: Platform? = null
)

@Serializable
data class FoundationModelInfoIOS(
    val modelId: String,
    val version: String? = null,
    val supportedLanguages: List<String>,
    val capabilities: List<String>,
    val requiresDownload: Boolean,
    val downloadSizeMB: Int? = null,
    val isAvailable: Boolean
)

@Serializable
data class DeviceInfoIOS(
    val modelIdentifier: String,
    val osVersion: String,
    val supportsAppleIntelligence: Boolean,
    val systemLanguages: List<String>,
    val hasNeuralEngine: Boolean
)

@Serializable
data class DeviceCapability(
    val platform: Platform,
    val supportsOnDeviceAI: Boolean,
    val availableFeatures: List<FeatureType>,
    val featureCapabilities: List<FeatureCapability>,
    val availableMemoryMB: Int? = null,
    val isLowPowerMode: Boolean,
    val modelInfo: ModelInfo? = null
)

@Serializable
data class FeatureCapability(
    val feature: FeatureType,
    val level: CapabilityLevel,
    val estimatedProcessingTimeMs: Int? = null,
    val maxInputLength: Int? = null
)

@Serializable
data class ModelInfo(
    val name: String,
    val version: String? = null,
    val sizeMB: Int? = null,
    val isLoaded: Boolean,
    val foundationModelIOS: FoundationModelInfoIOS? = null,
    val geminiNanoAndroid: GeminiNanoInfoAndroid? = null
)

@Serializable
data class ExecutionContext(
    val id: String,
    val recentActions: List<String>? = null,
    val appState: String? = null,
    val preferences: ContextPreferences? = null,
    val lastUpdated: Double
)

@Serializable
data class ContextPreferences(
    val processingPreference: ProcessingPreference,
    val privacyLevel: PrivacyLevel,
    val maxProcessingTimeMs: Int? = null,
    val enableCaching: Boolean
)

@Serializable
data class ExecutionResult(
    val id: String,
    val feature: FeatureType,
    val state: ExecutionState,
    val result: ExecutionResultData? = null,
    val processedOn: ProcessingLocation,
    val processingTimeMs: Int? = null,
    val error: ExecutionError? = null,
    val startedAt: Double,
    val completedAt: Double? = null
)

@Serializable
data class SummarizeResult(
    val summary: String,
    val originalLength: Int,
    val summaryLength: Int,
    val confidence: Double? = null
) : ExecutionResultData

@Serializable
data class ClassifyResult(
    val classifications: List<Classification>,
    val topClassification: Classification
) : ExecutionResultData

@Serializable
data class Classification(
    val label: String,
    val score: Double,
    val metadata: String? = null
)

@Serializable
data class ExtractResult(
    val entities: List<Entity>,
    val keyValuePairs: List<KeyValuePair>? = null
) : ExecutionResultData

@Serializable
data class Entity(
    val type: String,
    val value: String,
    val confidence: Double,
    val startPos: Int? = null,
    val endPos: Int? = null
)

@Serializable
data class KeyValuePair(
    val key: String,
    val value: String,
    val confidence: Double? = null
)

@Serializable
data class ChatResult(
    val message: String,
    val conversationId: String? = null,
    val canContinue: Boolean,
    val suggestedPrompts: List<String>? = null
) : ExecutionResultData

@Serializable
data class ChatStreamChunk(
    val delta: String,
    val accumulated: String,
    val isFinal: Boolean,
    val conversationId: String? = null
)

@Serializable
data class TranslateResult(
    val translatedText: String,
    val sourceLanguage: String,
    val targetLanguage: String,
    val confidence: Double? = null
) : ExecutionResultData

@Serializable
data class RewriteResult(
    val rewrittenText: String,
    val style: RewriteOutputType? = null,
    val alternatives: List<String>? = null,
    val confidence: Double? = null
) : ExecutionResultData

@Serializable
data class ProofreadResult(
    val correctedText: String,
    val corrections: List<ProofreadCorrection>,
    val hasCorrections: Boolean
) : ExecutionResultData

@Serializable
data class ProofreadCorrection(
    val original: String,
    val corrected: String,
    val type: String? = null,
    val confidence: Double? = null,
    val startPos: Int? = null,
    val endPos: Int? = null
)

@Serializable
data class ImageDescriptionResult(
    val description: String,
    val alternatives: List<String>? = null,
    val confidence: Double? = null
) : ExecutionResultData

@Serializable
data class ImageGenerationResult(
    val imageUrls: List<String>,
    val count: Int,
    val style: String? = null,
    val prompt: String? = null
) : ExecutionResultData

@Serializable
data class ExecutionError(
    val code: String,
    val message: String,
    val details: String? = null,
    val isRecoverable: Boolean
)

@Serializable
data class VoidResult(
    val success: Boolean
)

@Serializable
data class LocanaraEventPayload(
    val event: LocanaraEvent,
    val timestamp: Double,
    val data: String? = null
)

@Serializable
data class GeminiNanoInfoAndroid(
    val version: String,
    val variant: String? = null,
    val supportedLanguages: List<String>,
    val capabilities: List<String>,
    val isDownloaded: Boolean,
    val downloadSizeMB: Int? = null,
    val isReady: Boolean
)

@Serializable
data class DeviceInfoAndroid(
    val manufacturer: String,
    val model: String,
    val apiLevel: Int,
    val androidVersion: String,
    val supportsGeminiNano: Boolean,
    val systemLanguages: List<String>,
    val gpuInfo: String? = null,
    val totalRAMMB: Int
)

@Serializable
data class ErrorDetails(
    val code: ErrorCode,
    val message: String,
    val technicalDetails: String? = null,
    val suggestedAction: String? = null,
    val canRetry: Boolean,
    val platform: Platform? = null
)

// ============================================
// INPUT TYPES
// ============================================

@Serializable
data class ExecuteFeatureOptionsIOS(
    val useAppleIntelligence: Boolean? = null,
    val modelId: String? = null,
    val requireOnDevice: Boolean? = null
)

@Serializable
data class ImagePlaygroundParametersIOS(
    val prompt: String,
    val style: ImagePlaygroundStyleIOS? = null,
    val sourceImageBase64: String? = null
)

@Serializable
data class ExecuteFeatureInput(
    val feature: FeatureType,
    val input: String,
    val contextId: String? = null,
    val preferences: ContextPreferencesInput? = null,
    val parameters: FeatureParametersInput? = null
)

@Serializable
data class ContextPreferencesInput(
    val processingPreference: ProcessingPreference? = null,
    val privacyLevel: PrivacyLevel? = null,
    val maxProcessingTimeMs: Int? = null,
    val enableCaching: Boolean? = null
)

@Serializable
data class FeatureParametersInput(
    val summarize: SummarizeParametersInput? = null,
    val classify: ClassifyParametersInput? = null,
    val extract: ExtractParametersInput? = null,
    val chat: ChatParametersInput? = null,
    val translate: TranslateParametersInput? = null,
    val rewrite: RewriteParametersInput? = null,
    val proofread: ProofreadParametersInput? = null,
    val imageDescription: ImageDescriptionParametersInput? = null,
    val imageGeneration: ImageGenerationParametersInput? = null
)

@Serializable
data class SummarizeParametersInput(
    val inputType: SummarizeInputType? = null,
    val outputType: SummarizeOutputType? = null,
    val language: MLKitLanguage? = null,
    val autoTruncate: Boolean? = null
)

@Serializable
data class ClassifyParametersInput(
    val categories: List<String>? = null,
    val maxResults: Int? = null
)

@Serializable
data class ExtractParametersInput(
    val entityTypes: List<String>? = null,
    val extractKeyValues: Boolean? = null
)

@Serializable
data class ChatParametersInput(
    val conversationId: String? = null,
    val systemPrompt: String? = null,
    val history: List<ChatMessageInput>? = null
)

@Serializable
data class ChatMessageInput(
    val role: String,
    val content: String
)

@Serializable
data class TranslateParametersInput(
    val sourceLanguage: String? = null,
    val targetLanguage: String
)

@Serializable
data class RewriteParametersInput(
    val outputType: RewriteOutputType,
    val language: MLKitLanguage? = null
)

@Serializable
data class ProofreadParametersInput(
    val inputType: ProofreadInputType? = null,
    val language: MLKitLanguage? = null
)

@Serializable
data class ImageDescriptionParametersInput(
    val imageBase64: String? = null,
    val imagePath: String? = null
)

@Serializable
data class ImageGenerationParametersInput(
    val prompt: String,
    val style: String? = null,
    val count: Int? = null
)

@Serializable
data class UpdateContextInput(
    val contextId: String,
    val addActions: List<String>? = null,
    val appState: String? = null,
    val preferences: ContextPreferencesInput? = null
)

@Serializable
data class ExecuteFeatureOptionsAndroid(
    val useGeminiNano: Boolean? = null,
    val modelVariant: String? = null,
    val enableGPU: Boolean? = null,
    val numThreads: Int? = null
)

@Serializable
data class ImageDescriptionParametersAndroid(
    val imageBase64: String? = null,
    val imagePath: String? = null,
    val language: MLKitLanguage? = null
)

// ============================================
// RAG TYPES
// ============================================

@Serializable
enum class RAGDocumentStatus {
    PENDING,
    INDEXING,
    INDEXED,
    ERROR
}

@Serializable
data class RAGCollection(
    val collectionId: String,
    val name: String,
    val description: String? = null,
    val documentCount: Int,
    val totalChunks: Int,
    val createdAt: Double,
    val updatedAt: Double
)

@Serializable
data class RAGDocument(
    val documentId: String,
    val collectionId: String,
    val title: String,
    val chunkCount: Int,
    val status: RAGDocumentStatus,
    val indexedAt: Double? = null,
    val errorMessage: String? = null
)

@Serializable
data class RAGQueryResult(
    val answer: String,
    val sources: List<RAGSourceChunk>,
    val processingTimeMs: Int,
    val confidence: Double,
    val retrievedCount: Int
)

@Serializable
data class RAGSourceChunk(
    val documentId: String,
    val documentTitle: String,
    val content: String,
    val relevanceScore: Double,
    val chunkIndex: Int
)

// ============================================
// PERSONALIZATION TYPES
// ============================================

@Serializable
data class PersonalizationProfile(
    val profileId: String,
    val name: String,
    val feedbackCount: Int,
    val positiveFeedbackCount: Int,
    val lastUpdated: Double,
    val isActive: Boolean,
    val createdAt: Double
)

@Serializable
data class FeedbackRecord(
    val feedbackId: String,
    val profileId: String,
    val feature: FeatureType,
    val input: String,
    val output: String,
    val liked: Boolean,
    val timestamp: Double
)

// ============================================
// MODEL MANAGEMENT TYPES
// ============================================

@Serializable
enum class QuantizationType {
    INT4,
    INT8,
    FLOAT16,
    FLOAT32
}

@Serializable
enum class PromptFormat {
    LLAMA,
    GEMMA,
    CHATML,
    RAW
}

@Serializable
data class DownloadableModelInfo(
    val modelId: String,
    val name: String,
    val version: String,
    val sizeMB: Int,
    val quantization: QuantizationType,
    val contextLength: Int,
    val downloadURL: String,
    val checksum: String,
    val minMemoryMB: Int,
    val supportedFeatures: List<FeatureType>,
    val promptFormat: PromptFormat,
    val tokenizerURL: String? = null
)

/**
 * Display model for the UI (combines registry info + runtime state)
 */
data class ModelDisplayInfo(
    val modelId: String,
    val name: String,
    val sizeMB: Int,
    val isDownloaded: Boolean,
    val isLoaded: Boolean,
    val isRecommended: Boolean,
    val downloadProgress: Float = 0f
)

// ============================================
// UNION TYPES (Sealed Interfaces)
// ============================================

@Serializable
sealed interface EventData

@Serializable
sealed interface ExecutionResultData

@Serializable
data class PersonalizedExecutionResult(
    val result: ExecutionResult,
    val feedbackId: String,
    val personalizationApplied: Boolean,
    val personalizationScore: Double? = null
) : ExecutionResultData

// ============================================
// QUERY RESOLVER (Common)
// ============================================

interface QueryResolver {
    /** Get current device capabilities for AI features */
    suspend fun getDeviceCapability(): DeviceCapability

    /** Check if a specific feature is available */
    suspend fun isFeatureAvailable(feature: FeatureType): Boolean

    /** Get current execution context */
    suspend fun getContext(contextId: String): ExecutionContext?

    /** Get execution result by ID */
    suspend fun getExecutionResult(executionId: String): ExecutionResult?

    /** Get all execution results for a context */
    suspend fun getExecutionHistory(contextId: String, limit: Int?): List<ExecutionResult>
}

// ============================================
// QUERY RESOLVER (Android)
// ============================================

interface QueryResolverAndroid : QueryResolver {
    /** Get Android device information */
    suspend fun getDeviceInfoAndroid(): DeviceInfoAndroid

    /** Get Gemini Nano status */
    suspend fun getGeminiNanoStatus(): GeminiNanoInfoAndroid

    /** Check if device meets minimum requirements */
    suspend fun meetsMinimumRequirements(): Boolean
}

// ============================================
// MUTATION RESOLVER (Common)
// ============================================

interface MutationResolver {
    /** Initialize the Locanara SDK */
    suspend fun initializeSDK(platform: Platform): VoidResult

    /** Create a new execution context */
    suspend fun createContext(preferences: ContextPreferencesInput?): ExecutionContext

    /** Update an existing context */
    suspend fun updateContext(input: UpdateContextInput): ExecutionContext

    /** Execute an AI feature */
    suspend fun executeFeature(input: ExecuteFeatureInput): ExecutionResult

    /** Cancel an ongoing execution */
    suspend fun cancelExecution(executionId: String): VoidResult

    /** Clear execution history for a context */
    suspend fun clearHistory(contextId: String): VoidResult

    /** Delete a context */
    suspend fun deleteContext(contextId: String): VoidResult

    /** Preload models for better performance */
    suspend fun preloadModels(features: List<FeatureType>): VoidResult

    /** Unload models to free memory */
    suspend fun unloadModels(features: List<FeatureType>): VoidResult
}

// ============================================
// MUTATION RESOLVER (Android)
// ============================================

interface MutationResolverAndroid : MutationResolver {
    /** Download Gemini Nano model */
    suspend fun downloadGeminiNano(variant: String?): VoidResult

    /** Execute feature with Android-specific options */
    suspend fun executeFeatureAndroid(input: ExecuteFeatureInput, options: ExecuteFeatureOptionsAndroid?): ExecutionResult

    /** Initialize Gemini Nano */
    suspend fun initializeGeminiNano(): VoidResult

    /** Describe image using Android ML Kit GenAI (Gemini Nano)
    Uses on-device Gemini Nano vision model */
    suspend fun describeImageAndroid(parameters: ImageDescriptionParametersAndroid): ImageDescriptionResult
}

// ============================================
// SUBSCRIPTION RESOLVER
// ============================================

interface SubscriptionResolver {
    fun onExecutionStateChanged(executionId: String): Flow<ExecutionResult>

    fun onCapabilityChanged(): Flow<DeviceCapability>

    fun onEvent(): Flow<LocanaraEventPayload>
}
