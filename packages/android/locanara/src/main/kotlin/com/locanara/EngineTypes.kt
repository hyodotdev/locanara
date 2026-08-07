package com.locanara

import kotlinx.serialization.Serializable

/** Runtime engine selected for Android inference. */
@Serializable
enum class InferenceEngineType {
    FOUNDATION_MODELS,
    GEMINI_NANO,
    EXECUTORCH,
    NONE,
}

/** Quantization used by a downloadable Android model. */
@Serializable
enum class QuantizationType {
    INT4,
    INT8,
    FLOAT16,
    FLOAT32,
}

/** Prompt format expected by an Android external model. */
@Serializable
enum class PromptFormat {
    LLAMA,
    GEMMA,
    CHATML,
    RAW,
}

/** Immutable registry information for a downloadable Android model. */
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
    val tokenizerURL: String? = null,
)

/** Registry information combined with the current Android runtime state. */
data class ModelDisplayInfo(
    val modelId: String,
    val name: String,
    val sizeMB: Int,
    val isDownloaded: Boolean,
    val isLoaded: Boolean,
    val isRecommended: Boolean,
    val downloadProgress: Float = 0f,
)
