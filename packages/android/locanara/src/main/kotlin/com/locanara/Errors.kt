package com.locanara

/**
 * Locanara exceptions
 */
sealed class LocanaraException(
    message: String,
    val code: ErrorCode,
    cause: Throwable? = null
) : Exception(message, cause) {

    object SdkNotInitialized : LocanaraException(
        "Locanara SDK is not initialized. Call initialize() first.",
        ErrorCode.SDK_NOT_INITIALIZED
    )

    data class InitializationFailed(val reason: String) : LocanaraException(
        "Failed to initialize SDK: $reason",
        ErrorCode.INITIALIZATION_FAILED
    )

    data class FeatureNotAvailable(val feature: FeatureType) : LocanaraException(
        "Feature '${feature.name}' is not available on this device.",
        ErrorCode.FEATURE_NOT_AVAILABLE
    )

    data class FeatureNotSupported(val feature: FeatureType) : LocanaraException(
        "Feature '${feature.name}' is not supported.",
        ErrorCode.FEATURE_NOT_SUPPORTED
    )

    object CapabilityCheckFailed : LocanaraException(
        "Failed to check device capabilities.",
        ErrorCode.INTERNAL_ERROR
    )

    data class ExecutionFailed(val reason: String, override val cause: Throwable? = null) : LocanaraException(
        "Execution failed: $reason",
        ErrorCode.EXECUTION_FAILED,
        cause
    )

    data class InvalidInput(val reason: String) : LocanaraException(
        "Invalid input: $reason",
        ErrorCode.INVALID_INPUT
    )

    object DeviceNotSupported : LocanaraException(
        "This device is not supported.",
        ErrorCode.DEVICE_NOT_SUPPORTED
    )

    data class ContextNotFound(val id: String) : LocanaraException(
        "Context with id '$id' not found.",
        ErrorCode.CONTEXT_NOT_FOUND
    )

    object PermissionDenied : LocanaraException(
        "Permission denied. Please grant necessary permissions.",
        ErrorCode.PERMISSION_DENIED
    )

    data class Custom(
        val errorCode: ErrorCode,
        val errorMessage: String
    ) : LocanaraException(
        "[$errorCode] $errorMessage",
        errorCode
    )
}
