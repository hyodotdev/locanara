// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from GraphQL schema

import Foundation

// MARK: - Enums

public enum EventCategory: String, Codable, CaseIterable, Sendable {
    case capability = "CAPABILITY"
    case model = "MODEL"
    case execution = "EXECUTION"
    case context = "CONTEXT"
    case system = "SYSTEM"
}

public enum ImagePlaygroundStyleIOS: String, Codable, CaseIterable, Sendable {
    case animation = "ANIMATION"
    case illustration = "ILLUSTRATION"
    case sketch = "SKETCH"
}

public enum Platform: String, Codable, CaseIterable, Sendable {
    case ios = "IOS"
    case android = "ANDROID"
    case web = "WEB"
}

public enum FeatureType: String, Codable, CaseIterable, Sendable {
    case summarize = "SUMMARIZE"
    case classify = "CLASSIFY"
    case extract = "EXTRACT"
    case chat = "CHAT"
    case translate = "TRANSLATE"
    case rewrite = "REWRITE"
    case proofread = "PROOFREAD"
    case describeImage = "DESCRIBE_IMAGE"
    case generateImage = "GENERATE_IMAGE"
    case describeImageAndroid = "DESCRIBE_IMAGE_ANDROID"
    case generateImageIos = "GENERATE_IMAGE_IOS"
}

public enum SummarizeInputType: String, Codable, CaseIterable, Sendable {
    case article = "ARTICLE"
    case conversation = "CONVERSATION"
}

public enum SummarizeOutputType: String, Codable, CaseIterable, Sendable {
    case oneBullet = "ONE_BULLET"
    case twoBullets = "TWO_BULLETS"
    case threeBullets = "THREE_BULLETS"
}

public enum RewriteOutputType: String, Codable, CaseIterable, Sendable {
    case elaborate = "ELABORATE"
    case emojify = "EMOJIFY"
    case shorten = "SHORTEN"
    case friendly = "FRIENDLY"
    case professional = "PROFESSIONAL"
    case rephrase = "REPHRASE"
}

public enum ProofreadInputType: String, Codable, CaseIterable, Sendable {
    case keyboard = "KEYBOARD"
    case voice = "VOICE"
}

public enum MLKitLanguage: String, Codable, CaseIterable, Sendable {
    case english = "ENGLISH"
    case japanese = "JAPANESE"
    case korean = "KOREAN"
    case french = "FRENCH"
    case german = "GERMAN"
    case italian = "ITALIAN"
    case spanish = "SPANISH"
}

public enum FeatureStatus: String, Codable, CaseIterable, Sendable {
    case unavailable = "UNAVAILABLE"
    case downloadable = "DOWNLOADABLE"
    case downloading = "DOWNLOADING"
    case available = "AVAILABLE"
}

public enum CapabilityLevel: String, Codable, CaseIterable, Sendable {
    case none = "NONE"
    case limited = "LIMITED"
    case full = "FULL"
}

public enum ProcessingPreference: String, Codable, CaseIterable, Sendable {
    case onDeviceOnly = "ON_DEVICE_ONLY"
    case onDevicePreferred = "ON_DEVICE_PREFERRED"
    case cloudPreferred = "CLOUD_PREFERRED"
    case auto = "AUTO"
}

public enum PrivacyLevel: String, Codable, CaseIterable, Sendable {
    case strict = "STRICT"
    case balanced = "BALANCED"
    case permissive = "PERMISSIVE"
}

public enum ExecutionState: String, Codable, CaseIterable, Sendable {
    case idle = "IDLE"
    case preparing = "PREPARING"
    case processing = "PROCESSING"
    case completed = "COMPLETED"
    case failed = "FAILED"
    case cancelled = "CANCELLED"
}

public enum LocanaraEvent: String, Codable, CaseIterable, Sendable {
    case capabilityChanged = "CAPABILITY_CHANGED"
    case modelLoaded = "MODEL_LOADED"
    case modelUnloaded = "MODEL_UNLOADED"
    case executionStarted = "EXECUTION_STARTED"
    case executionCompleted = "EXECUTION_COMPLETED"
    case executionFailed = "EXECUTION_FAILED"
    case contextUpdated = "CONTEXT_UPDATED"
}

public enum ProcessingLocation: String, Codable, CaseIterable, Sendable {
    case onDevice = "ON_DEVICE"
    case cloud = "CLOUD"
    case hybrid = "HYBRID"
}

public enum RAGDocumentStatus: String, Codable, CaseIterable, Sendable {
    case pending = "PENDING"
    case indexing = "INDEXING"
    case indexed = "INDEXED"
    case error = "ERROR"
}

public enum ErrorCode: String, Codable, CaseIterable, Sendable {
    case sdkNotInitialized = "SDK_NOT_INITIALIZED"
    case initializationFailed = "INITIALIZATION_FAILED"
    case featureNotAvailable = "FEATURE_NOT_AVAILABLE"
    case featureNotSupported = "FEATURE_NOT_SUPPORTED"
    case modelNotLoaded = "MODEL_NOT_LOADED"
    case modelDownloadRequired = "MODEL_DOWNLOAD_REQUIRED"
    case executionFailed = "EXECUTION_FAILED"
    case executionTimeout = "EXECUTION_TIMEOUT"
    case executionCancelled = "EXECUTION_CANCELLED"
    case invalidInput = "INVALID_INPUT"
    case inputTooLong = "INPUT_TOO_LONG"
    case insufficientMemory = "INSUFFICIENT_MEMORY"
    case lowPowerMode = "LOW_POWER_MODE"
    case deviceNotSupported = "DEVICE_NOT_SUPPORTED"
    case contextNotFound = "CONTEXT_NOT_FOUND"
    case contextInvalid = "CONTEXT_INVALID"
    case permissionDenied = "PERMISSION_DENIED"
    case permissionNotGranted = "PERMISSION_NOT_GRANTED"
    case networkUnavailable = "NETWORK_UNAVAILABLE"
    case apiError = "API_ERROR"
    case proTierRequired = "PRO_TIER_REQUIRED"
    case unknownError = "UNKNOWN_ERROR"
    case internalError = "INTERNAL_ERROR"
}

// MARK: - Types

public struct CapabilityChangedEvent: Codable, Sendable {
    public var previous: DeviceCapability?
    public var current: DeviceCapability
    public var reason: String?

    public init(
        previous: DeviceCapability? = nil,
        current: DeviceCapability,
        reason: String? = nil
    ) {
        self.previous = previous
        self.current = current
        self.reason = reason
    }
}

public struct ModelLoadedEvent: Codable, Sendable {
    public var modelInfo: ModelInfo
    public var availableFeatures: [FeatureType]
    public var loadTimeMs: Int?

    public init(
        modelInfo: ModelInfo,
        availableFeatures: [FeatureType],
        loadTimeMs: Int? = nil
    ) {
        self.modelInfo = modelInfo
        self.availableFeatures = availableFeatures
        self.loadTimeMs = loadTimeMs
    }
}

public struct ModelUnloadedEvent: Codable, Sendable {
    public var modelInfo: ModelInfo
    public var reason: String?

    public init(
        modelInfo: ModelInfo,
        reason: String? = nil
    ) {
        self.modelInfo = modelInfo
        self.reason = reason
    }
}

public struct ExecutionStartedEvent: Codable, Sendable {
    public var executionId: String
    public var feature: FeatureType
    public var processingLocation: ProcessingLocation

    public init(
        executionId: String,
        feature: FeatureType,
        processingLocation: ProcessingLocation
    ) {
        self.executionId = executionId
        self.feature = feature
        self.processingLocation = processingLocation
    }
}

public struct ExecutionCompletedEvent: Codable, Sendable {
    public var executionId: String
    public var feature: FeatureType
    public var processingTimeMs: Int
    public var resultSizeBytes: Int?

    public init(
        executionId: String,
        feature: FeatureType,
        processingTimeMs: Int,
        resultSizeBytes: Int? = nil
    ) {
        self.executionId = executionId
        self.feature = feature
        self.processingTimeMs = processingTimeMs
        self.resultSizeBytes = resultSizeBytes
    }
}

public struct ExecutionFailedEvent: Codable, Sendable {
    public var executionId: String
    public var feature: FeatureType
    public var error: ExecutionError

    public init(
        executionId: String,
        feature: FeatureType,
        error: ExecutionError
    ) {
        self.executionId = executionId
        self.feature = feature
        self.error = error
    }
}

public struct ContextUpdatedEvent: Codable, Sendable {
    public var contextId: String
    public var actionCount: Int
    public var preferences: ContextPreferences?

    public init(
        contextId: String,
        actionCount: Int,
        preferences: ContextPreferences? = nil
    ) {
        self.contextId = contextId
        self.actionCount = actionCount
        self.preferences = preferences
    }
}

public struct Event: Codable, Sendable {
    public var id: String
    public var type: LocanaraEvent
    public var category: EventCategory
    public var timestamp: Double
    public var data: EventData?
    public var platform: Platform?

    public init(
        id: String,
        type: LocanaraEvent,
        category: EventCategory,
        timestamp: Double,
        data: EventData? = nil,
        platform: Platform? = nil
    ) {
        self.id = id
        self.type = type
        self.category = category
        self.timestamp = timestamp
        self.data = data
        self.platform = platform
    }
}

public struct FoundationModelInfoIOS: Codable, Sendable {
    public var modelId: String
    public var version: String?
    public var supportedLanguages: [String]
    public var capabilities: [String]
    public var requiresDownload: Bool
    public var downloadSizeMB: Int?
    public var isAvailable: Bool

    public init(
        modelId: String,
        version: String? = nil,
        supportedLanguages: [String],
        capabilities: [String],
        requiresDownload: Bool,
        downloadSizeMB: Int? = nil,
        isAvailable: Bool
    ) {
        self.modelId = modelId
        self.version = version
        self.supportedLanguages = supportedLanguages
        self.capabilities = capabilities
        self.requiresDownload = requiresDownload
        self.downloadSizeMB = downloadSizeMB
        self.isAvailable = isAvailable
    }
}

public struct DeviceInfoIOS: Codable, Sendable {
    public var modelIdentifier: String
    public var osVersion: String
    public var supportsAppleIntelligence: Bool
    public var systemLanguages: [String]
    public var hasNeuralEngine: Bool

    public init(
        modelIdentifier: String,
        osVersion: String,
        supportsAppleIntelligence: Bool,
        systemLanguages: [String],
        hasNeuralEngine: Bool
    ) {
        self.modelIdentifier = modelIdentifier
        self.osVersion = osVersion
        self.supportsAppleIntelligence = supportsAppleIntelligence
        self.systemLanguages = systemLanguages
        self.hasNeuralEngine = hasNeuralEngine
    }
}

public struct DeviceCapability: Codable, Sendable {
    public var platform: Platform
    public var supportsOnDeviceAI: Bool
    public var availableFeatures: [FeatureType]
    public var featureCapabilities: [FeatureCapability]
    public var availableMemoryMB: Int?
    public var isLowPowerMode: Bool
    public var modelInfo: ModelInfo?

    public init(
        platform: Platform,
        supportsOnDeviceAI: Bool,
        availableFeatures: [FeatureType],
        featureCapabilities: [FeatureCapability],
        availableMemoryMB: Int? = nil,
        isLowPowerMode: Bool,
        modelInfo: ModelInfo? = nil
    ) {
        self.platform = platform
        self.supportsOnDeviceAI = supportsOnDeviceAI
        self.availableFeatures = availableFeatures
        self.featureCapabilities = featureCapabilities
        self.availableMemoryMB = availableMemoryMB
        self.isLowPowerMode = isLowPowerMode
        self.modelInfo = modelInfo
    }
}

public struct FeatureCapability: Codable, Sendable {
    public var feature: FeatureType
    public var level: CapabilityLevel
    public var estimatedProcessingTimeMs: Int?
    public var maxInputLength: Int?

    public init(
        feature: FeatureType,
        level: CapabilityLevel,
        estimatedProcessingTimeMs: Int? = nil,
        maxInputLength: Int? = nil
    ) {
        self.feature = feature
        self.level = level
        self.estimatedProcessingTimeMs = estimatedProcessingTimeMs
        self.maxInputLength = maxInputLength
    }
}

public struct ModelInfo: Codable, Sendable {
    public var name: String
    public var version: String?
    public var sizeMB: Int?
    public var isLoaded: Bool
    public var foundationModelIOS: FoundationModelInfoIOS?

    public init(
        name: String,
        version: String? = nil,
        sizeMB: Int? = nil,
        isLoaded: Bool,
        foundationModelIOS: FoundationModelInfoIOS? = nil
    ) {
        self.name = name
        self.version = version
        self.sizeMB = sizeMB
        self.isLoaded = isLoaded
        self.foundationModelIOS = foundationModelIOS
    }
}

public struct ExecutionContext: Codable, Sendable {
    public var id: String
    public var recentActions: [String]?
    public var appState: String?
    public var preferences: ContextPreferences?
    public var lastUpdated: Double

    public init(
        id: String,
        recentActions: [String]? = nil,
        appState: String? = nil,
        preferences: ContextPreferences? = nil,
        lastUpdated: Double
    ) {
        self.id = id
        self.recentActions = recentActions
        self.appState = appState
        self.preferences = preferences
        self.lastUpdated = lastUpdated
    }
}

public struct ContextPreferences: Codable, Sendable {
    public var processingPreference: ProcessingPreference
    public var privacyLevel: PrivacyLevel
    public var maxProcessingTimeMs: Int?
    public var enableCaching: Bool

    public init(
        processingPreference: ProcessingPreference,
        privacyLevel: PrivacyLevel,
        maxProcessingTimeMs: Int? = nil,
        enableCaching: Bool
    ) {
        self.processingPreference = processingPreference
        self.privacyLevel = privacyLevel
        self.maxProcessingTimeMs = maxProcessingTimeMs
        self.enableCaching = enableCaching
    }
}

public struct ExecutionResult: Codable, Sendable {
    public var id: String
    public var feature: FeatureType
    public var state: ExecutionState
    public var result: ExecutionResultData?
    public var processedOn: ProcessingLocation
    public var processingTimeMs: Int?
    public var error: ExecutionError?
    public var startedAt: Double
    public var completedAt: Double?

    public init(
        id: String,
        feature: FeatureType,
        state: ExecutionState,
        result: ExecutionResultData? = nil,
        processedOn: ProcessingLocation,
        processingTimeMs: Int? = nil,
        error: ExecutionError? = nil,
        startedAt: Double,
        completedAt: Double? = nil
    ) {
        self.id = id
        self.feature = feature
        self.state = state
        self.result = result
        self.processedOn = processedOn
        self.processingTimeMs = processingTimeMs
        self.error = error
        self.startedAt = startedAt
        self.completedAt = completedAt
    }
}

public struct SummarizeResult: Codable, Sendable {
    public var summary: String
    public var originalLength: Int
    public var summaryLength: Int
    public var confidence: Double?

    public init(
        summary: String,
        originalLength: Int,
        summaryLength: Int,
        confidence: Double? = nil
    ) {
        self.summary = summary
        self.originalLength = originalLength
        self.summaryLength = summaryLength
        self.confidence = confidence
    }
}

public struct ClassifyResult: Codable, Sendable {
    public var classifications: [Classification]
    public var topClassification: Classification

    public init(
        classifications: [Classification],
        topClassification: Classification
    ) {
        self.classifications = classifications
        self.topClassification = topClassification
    }
}

public struct Classification: Codable, Sendable {
    public var label: String
    public var score: Double
    public var metadata: String?

    public init(
        label: String,
        score: Double,
        metadata: String? = nil
    ) {
        self.label = label
        self.score = score
        self.metadata = metadata
    }
}

public struct ExtractResult: Codable, Sendable {
    public var entities: [Entity]
    public var keyValuePairs: [KeyValuePair]?

    public init(
        entities: [Entity],
        keyValuePairs: [KeyValuePair]? = nil
    ) {
        self.entities = entities
        self.keyValuePairs = keyValuePairs
    }
}

public struct Entity: Codable, Sendable {
    public var type: String
    public var value: String
    public var confidence: Double
    public var startPos: Int?
    public var endPos: Int?

    public init(
        type: String,
        value: String,
        confidence: Double,
        startPos: Int? = nil,
        endPos: Int? = nil
    ) {
        self.type = type
        self.value = value
        self.confidence = confidence
        self.startPos = startPos
        self.endPos = endPos
    }
}

public struct KeyValuePair: Codable, Sendable {
    public var key: String
    public var value: String
    public var confidence: Double?

    public init(
        key: String,
        value: String,
        confidence: Double? = nil
    ) {
        self.key = key
        self.value = value
        self.confidence = confidence
    }
}

public struct ChatResult: Codable, Sendable {
    public var message: String
    public var conversationId: String?
    public var canContinue: Bool
    public var suggestedPrompts: [String]?

    public init(
        message: String,
        conversationId: String? = nil,
        canContinue: Bool,
        suggestedPrompts: [String]? = nil
    ) {
        self.message = message
        self.conversationId = conversationId
        self.canContinue = canContinue
        self.suggestedPrompts = suggestedPrompts
    }
}

public struct ChatStreamChunk: Codable, Sendable {
    public var delta: String
    public var accumulated: String
    public var isFinal: Bool
    public var conversationId: String?

    public init(
        delta: String,
        accumulated: String,
        isFinal: Bool,
        conversationId: String? = nil
    ) {
        self.delta = delta
        self.accumulated = accumulated
        self.isFinal = isFinal
        self.conversationId = conversationId
    }
}

public struct TranslateResult: Codable, Sendable {
    public var translatedText: String
    public var sourceLanguage: String
    public var targetLanguage: String
    public var confidence: Double?

    public init(
        translatedText: String,
        sourceLanguage: String,
        targetLanguage: String,
        confidence: Double? = nil
    ) {
        self.translatedText = translatedText
        self.sourceLanguage = sourceLanguage
        self.targetLanguage = targetLanguage
        self.confidence = confidence
    }
}

public struct RewriteResult: Codable, Sendable {
    public var rewrittenText: String
    public var style: RewriteOutputType?
    public var alternatives: [String]?
    public var confidence: Double?

    public init(
        rewrittenText: String,
        style: RewriteOutputType? = nil,
        alternatives: [String]? = nil,
        confidence: Double? = nil
    ) {
        self.rewrittenText = rewrittenText
        self.style = style
        self.alternatives = alternatives
        self.confidence = confidence
    }
}

public struct ProofreadResult: Codable, Sendable {
    public var correctedText: String
    public var corrections: [ProofreadCorrection]
    public var hasCorrections: Bool

    public init(
        correctedText: String,
        corrections: [ProofreadCorrection],
        hasCorrections: Bool
    ) {
        self.correctedText = correctedText
        self.corrections = corrections
        self.hasCorrections = hasCorrections
    }
}

public struct ProofreadCorrection: Codable, Sendable {
    public var original: String
    public var corrected: String
    public var type: String?
    public var confidence: Double?
    public var startPos: Int?
    public var endPos: Int?

    public init(
        original: String,
        corrected: String,
        type: String? = nil,
        confidence: Double? = nil,
        startPos: Int? = nil,
        endPos: Int? = nil
    ) {
        self.original = original
        self.corrected = corrected
        self.type = type
        self.confidence = confidence
        self.startPos = startPos
        self.endPos = endPos
    }
}

public struct ImageDescriptionResult: Codable, Sendable {
    public var description: String
    public var alternatives: [String]?
    public var confidence: Double?

    public init(
        description: String,
        alternatives: [String]? = nil,
        confidence: Double? = nil
    ) {
        self.description = description
        self.alternatives = alternatives
        self.confidence = confidence
    }
}

public struct ImageGenerationResult: Codable, Sendable {
    public var imageUrls: [String]
    public var count: Int
    public var style: String?
    public var prompt: String?

    public init(
        imageUrls: [String],
        count: Int,
        style: String? = nil,
        prompt: String? = nil
    ) {
        self.imageUrls = imageUrls
        self.count = count
        self.style = style
        self.prompt = prompt
    }
}

public struct ExecutionError: Codable, Sendable {
    public var code: String
    public var message: String
    public var details: String?
    public var isRecoverable: Bool

    public init(
        code: String,
        message: String,
        details: String? = nil,
        isRecoverable: Bool
    ) {
        self.code = code
        self.message = message
        self.details = details
        self.isRecoverable = isRecoverable
    }
}

public struct VoidResult: Codable, Sendable {
    public var success: Bool

    public init(
        success: Bool
    ) {
        self.success = success
    }
}

public struct RAGCollection: Codable, Sendable {
    public var collectionId: String
    public var name: String
    public var description: String?
    public var documentCount: Int
    public var totalChunks: Int
    public var createdAt: Double
    public var updatedAt: Double

    public init(
        collectionId: String,
        name: String,
        description: String? = nil,
        documentCount: Int,
        totalChunks: Int,
        createdAt: Double,
        updatedAt: Double
    ) {
        self.collectionId = collectionId
        self.name = name
        self.description = description
        self.documentCount = documentCount
        self.totalChunks = totalChunks
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

public struct RAGDocument: Codable, Sendable {
    public var documentId: String
    public var collectionId: String
    public var title: String
    public var chunkCount: Int
    public var status: RAGDocumentStatus
    public var indexedAt: Double?
    public var errorMessage: String?

    public init(
        documentId: String,
        collectionId: String,
        title: String,
        chunkCount: Int,
        status: RAGDocumentStatus,
        indexedAt: Double? = nil,
        errorMessage: String? = nil
    ) {
        self.documentId = documentId
        self.collectionId = collectionId
        self.title = title
        self.chunkCount = chunkCount
        self.status = status
        self.indexedAt = indexedAt
        self.errorMessage = errorMessage
    }
}

public struct RAGQueryResult: Codable, Sendable {
    public var answer: String
    public var sources: [RAGSourceChunk]
    public var processingTimeMs: Int
    public var confidence: Double?
    public var retrievedCount: Int

    public init(
        answer: String,
        sources: [RAGSourceChunk],
        processingTimeMs: Int,
        confidence: Double? = nil,
        retrievedCount: Int
    ) {
        self.answer = answer
        self.sources = sources
        self.processingTimeMs = processingTimeMs
        self.confidence = confidence
        self.retrievedCount = retrievedCount
    }
}

public struct RAGSourceChunk: Codable, Sendable {
    public var documentId: String
    public var documentTitle: String
    public var content: String
    public var relevanceScore: Double
    public var chunkIndex: Int

    public init(
        documentId: String,
        documentTitle: String,
        content: String,
        relevanceScore: Double,
        chunkIndex: Int
    ) {
        self.documentId = documentId
        self.documentTitle = documentTitle
        self.content = content
        self.relevanceScore = relevanceScore
        self.chunkIndex = chunkIndex
    }
}

public struct PersonalizationProfile: Codable, Sendable {
    public var profileId: String
    public var name: String
    public var feedbackCount: Int
    public var positiveFeedbackCount: Int
    public var lastUpdated: Double
    public var isActive: Bool
    public var createdAt: Double

    public init(
        profileId: String,
        name: String,
        feedbackCount: Int,
        positiveFeedbackCount: Int,
        lastUpdated: Double,
        isActive: Bool,
        createdAt: Double
    ) {
        self.profileId = profileId
        self.name = name
        self.feedbackCount = feedbackCount
        self.positiveFeedbackCount = positiveFeedbackCount
        self.lastUpdated = lastUpdated
        self.isActive = isActive
        self.createdAt = createdAt
    }
}

public struct FeedbackRecord: Codable, Sendable {
    public var feedbackId: String
    public var profileId: String
    public var feature: FeatureType
    public var input: String
    public var output: String
    public var liked: Bool
    public var timestamp: Double

    public init(
        feedbackId: String,
        profileId: String,
        feature: FeatureType,
        input: String,
        output: String,
        liked: Bool,
        timestamp: Double
    ) {
        self.feedbackId = feedbackId
        self.profileId = profileId
        self.feature = feature
        self.input = input
        self.output = output
        self.liked = liked
        self.timestamp = timestamp
    }
}

public struct PersonalizedExecutionResult: Codable, Sendable {
    public var result: ExecutionResult
    public var feedbackId: String
    public var personalizationApplied: Bool
    public var personalizationScore: Double?

    public init(
        result: ExecutionResult,
        feedbackId: String,
        personalizationApplied: Bool,
        personalizationScore: Double? = nil
    ) {
        self.result = result
        self.feedbackId = feedbackId
        self.personalizationApplied = personalizationApplied
        self.personalizationScore = personalizationScore
    }
}

public struct LocanaraEventPayload: Codable, Sendable {
    public var event: LocanaraEvent
    public var timestamp: Double
    public var data: String?

    public init(
        event: LocanaraEvent,
        timestamp: Double,
        data: String? = nil
    ) {
        self.event = event
        self.timestamp = timestamp
        self.data = data
    }
}

public struct ErrorDetails: Codable, Sendable {
    public var code: ErrorCode
    public var message: String
    public var technicalDetails: String?
    public var suggestedAction: String?
    public var canRetry: Bool
    public var platform: Platform?

    public init(
        code: ErrorCode,
        message: String,
        technicalDetails: String? = nil,
        suggestedAction: String? = nil,
        canRetry: Bool,
        platform: Platform? = nil
    ) {
        self.code = code
        self.message = message
        self.technicalDetails = technicalDetails
        self.suggestedAction = suggestedAction
        self.canRetry = canRetry
        self.platform = platform
    }
}

// MARK: - Input Types

public struct ExecuteFeatureOptionsIOS: Codable, Sendable {
    public var useAppleIntelligence: Bool?
    public var modelId: String?
    public var requireOnDevice: Bool?

    public init(
        useAppleIntelligence: Bool? = nil,
        modelId: String? = nil,
        requireOnDevice: Bool? = nil
    ) {
        self.useAppleIntelligence = useAppleIntelligence
        self.modelId = modelId
        self.requireOnDevice = requireOnDevice
    }
}

public struct ImagePlaygroundParametersIOS: Codable, Sendable {
    public var prompt: String
    public var style: ImagePlaygroundStyleIOS?
    public var sourceImageBase64: String?

    public init(
        prompt: String,
        style: ImagePlaygroundStyleIOS? = nil,
        sourceImageBase64: String? = nil
    ) {
        self.prompt = prompt
        self.style = style
        self.sourceImageBase64 = sourceImageBase64
    }
}

public struct ExecuteFeatureInput: Codable, Sendable {
    public var feature: FeatureType
    public var input: String
    public var contextId: String?
    public var preferences: ContextPreferencesInput?
    public var parameters: FeatureParametersInput?

    public init(
        feature: FeatureType,
        input: String,
        contextId: String? = nil,
        preferences: ContextPreferencesInput? = nil,
        parameters: FeatureParametersInput? = nil
    ) {
        self.feature = feature
        self.input = input
        self.contextId = contextId
        self.preferences = preferences
        self.parameters = parameters
    }
}

public struct ContextPreferencesInput: Codable, Sendable {
    public var processingPreference: ProcessingPreference?
    public var privacyLevel: PrivacyLevel?
    public var maxProcessingTimeMs: Int?
    public var enableCaching: Bool?

    public init(
        processingPreference: ProcessingPreference? = nil,
        privacyLevel: PrivacyLevel? = nil,
        maxProcessingTimeMs: Int? = nil,
        enableCaching: Bool? = nil
    ) {
        self.processingPreference = processingPreference
        self.privacyLevel = privacyLevel
        self.maxProcessingTimeMs = maxProcessingTimeMs
        self.enableCaching = enableCaching
    }
}

public struct FeatureParametersInput: Codable, Sendable {
    public var summarize: SummarizeParametersInput?
    public var classify: ClassifyParametersInput?
    public var extract: ExtractParametersInput?
    public var chat: ChatParametersInput?
    public var translate: TranslateParametersInput?
    public var rewrite: RewriteParametersInput?
    public var proofread: ProofreadParametersInput?
    public var imageDescription: ImageDescriptionParametersInput?
    public var imageGeneration: ImageGenerationParametersInput?

    public init(
        summarize: SummarizeParametersInput? = nil,
        classify: ClassifyParametersInput? = nil,
        extract: ExtractParametersInput? = nil,
        chat: ChatParametersInput? = nil,
        translate: TranslateParametersInput? = nil,
        rewrite: RewriteParametersInput? = nil,
        proofread: ProofreadParametersInput? = nil,
        imageDescription: ImageDescriptionParametersInput? = nil,
        imageGeneration: ImageGenerationParametersInput? = nil
    ) {
        self.summarize = summarize
        self.classify = classify
        self.extract = extract
        self.chat = chat
        self.translate = translate
        self.rewrite = rewrite
        self.proofread = proofread
        self.imageDescription = imageDescription
        self.imageGeneration = imageGeneration
    }
}

public struct SummarizeParametersInput: Codable, Sendable {
    public var inputType: SummarizeInputType?
    public var outputType: SummarizeOutputType?
    public var language: MLKitLanguage?
    public var autoTruncate: Bool?

    public init(
        inputType: SummarizeInputType? = nil,
        outputType: SummarizeOutputType? = nil,
        language: MLKitLanguage? = nil,
        autoTruncate: Bool? = nil
    ) {
        self.inputType = inputType
        self.outputType = outputType
        self.language = language
        self.autoTruncate = autoTruncate
    }
}

public struct ClassifyParametersInput: Codable, Sendable {
    public var categories: [String]?
    public var maxResults: Int?

    public init(
        categories: [String]? = nil,
        maxResults: Int? = nil
    ) {
        self.categories = categories
        self.maxResults = maxResults
    }
}

public struct ExtractParametersInput: Codable, Sendable {
    public var entityTypes: [String]?
    public var extractKeyValues: Bool?

    public init(
        entityTypes: [String]? = nil,
        extractKeyValues: Bool? = nil
    ) {
        self.entityTypes = entityTypes
        self.extractKeyValues = extractKeyValues
    }
}

public struct ChatParametersInput: Codable, Sendable {
    public var conversationId: String?
    public var systemPrompt: String?
    public var history: [ChatMessageInput]?

    public init(
        conversationId: String? = nil,
        systemPrompt: String? = nil,
        history: [ChatMessageInput]? = nil
    ) {
        self.conversationId = conversationId
        self.systemPrompt = systemPrompt
        self.history = history
    }
}

public struct ChatMessageInput: Codable, Sendable {
    public var role: String
    public var content: String

    public init(
        role: String,
        content: String
    ) {
        self.role = role
        self.content = content
    }
}

public struct TranslateParametersInput: Codable, Sendable {
    public var sourceLanguage: String?
    public var targetLanguage: String

    public init(
        sourceLanguage: String? = nil,
        targetLanguage: String
    ) {
        self.sourceLanguage = sourceLanguage
        self.targetLanguage = targetLanguage
    }
}

public struct RewriteParametersInput: Codable, Sendable {
    public var outputType: RewriteOutputType
    public var language: MLKitLanguage?

    public init(
        outputType: RewriteOutputType,
        language: MLKitLanguage? = nil
    ) {
        self.outputType = outputType
        self.language = language
    }
}

public struct ProofreadParametersInput: Codable, Sendable {
    public var inputType: ProofreadInputType?
    public var language: MLKitLanguage?

    public init(
        inputType: ProofreadInputType? = nil,
        language: MLKitLanguage? = nil
    ) {
        self.inputType = inputType
        self.language = language
    }
}

public struct ImageDescriptionParametersInput: Codable, Sendable {
    public var imageBase64: String?
    public var imagePath: String?

    public init(
        imageBase64: String? = nil,
        imagePath: String? = nil
    ) {
        self.imageBase64 = imageBase64
        self.imagePath = imagePath
    }
}

public struct ImageGenerationParametersInput: Codable, Sendable {
    public var prompt: String
    public var style: String?
    public var count: Int?

    public init(
        prompt: String,
        style: String? = nil,
        count: Int? = nil
    ) {
        self.prompt = prompt
        self.style = style
        self.count = count
    }
}

public struct UpdateContextInput: Codable, Sendable {
    public var contextId: String
    public var addActions: [String]?
    public var appState: String?
    public var preferences: ContextPreferencesInput?

    public init(
        contextId: String,
        addActions: [String]? = nil,
        appState: String? = nil,
        preferences: ContextPreferencesInput? = nil
    ) {
        self.contextId = contextId
        self.addActions = addActions
        self.appState = appState
        self.preferences = preferences
    }
}

public struct CreateRAGCollectionInput: Codable, Sendable {
    public var name: String
    public var description: String?

    public init(
        name: String,
        description: String? = nil
    ) {
        self.name = name
        self.description = description
    }
}

public struct IndexDocumentInput: Codable, Sendable {
    public var collectionId: String
    public var title: String
    public var content: String
    public var metadata: String?

    public init(
        collectionId: String,
        title: String,
        content: String,
        metadata: String? = nil
    ) {
        self.collectionId = collectionId
        self.title = title
        self.content = content
        self.metadata = metadata
    }
}

public struct RAGQueryInput: Codable, Sendable {
    public var collectionId: String
    public var query: String
    public var topK: Int?
    public var minRelevance: Double?
    public var systemPrompt: String?

    public init(
        collectionId: String,
        query: String,
        topK: Int? = nil,
        minRelevance: Double? = nil,
        systemPrompt: String? = nil
    ) {
        self.collectionId = collectionId
        self.query = query
        self.topK = topK
        self.minRelevance = minRelevance
        self.systemPrompt = systemPrompt
    }
}

public struct CreatePersonalizationProfileInput: Codable, Sendable {
    public var name: String

    public init(
        name: String
    ) {
        self.name = name
    }
}

public struct RecordFeedbackInput: Codable, Sendable {
    public var executionId: String
    public var liked: Bool
    public var comment: String?

    public init(
        executionId: String,
        liked: Bool,
        comment: String? = nil
    ) {
        self.executionId = executionId
        self.liked = liked
        self.comment = comment
    }
}

public struct ExecutePersonalizedInput: Codable, Sendable {
    public var featureInput: ExecuteFeatureInput
    public var profileId: String?

    public init(
        featureInput: ExecuteFeatureInput,
        profileId: String? = nil
    ) {
        self.featureInput = featureInput
        self.profileId = profileId
    }
}

// MARK: - Union Types

public enum EventData: Sendable {
    case capabilityChangedEvent(CapabilityChangedEvent)
    case modelLoadedEvent(ModelLoadedEvent)
    case modelUnloadedEvent(ModelUnloadedEvent)
    case executionStartedEvent(ExecutionStartedEvent)
    case executionCompletedEvent(ExecutionCompletedEvent)
    case executionFailedEvent(ExecutionFailedEvent)
    case contextUpdatedEvent(ContextUpdatedEvent)
}

public enum ExecutionResultData: Sendable {
    case summarize(SummarizeResult)
    case classify(ClassifyResult)
    case extract(ExtractResult)
    case chat(ChatResult)
    case translate(TranslateResult)
    case rewrite(RewriteResult)
    case proofread(ProofreadResult)
    case imageDescription(ImageDescriptionResult)
    case imageGeneration(ImageGenerationResult)
}
