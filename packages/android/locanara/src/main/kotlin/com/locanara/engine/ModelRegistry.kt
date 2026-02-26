package com.locanara.engine

import com.locanara.DownloadableModelInfo
import com.locanara.FeatureType
import com.locanara.PromptFormat
import com.locanara.QuantizationType

/**
 * Registry of available models for Locanara Android
 *
 * Provides a curated list of ExecuTorch-compatible models
 * that can be downloaded and run on-device.
 */
object ModelRegistry {

    /** The default recommended model ID */
    const val DEFAULT_MODEL_ID = "llama-3.2-3b-instruct"

    /** All registered models */
    val models: List<DownloadableModelInfo> = listOf(
        DownloadableModelInfo(
            modelId = "llama-3.2-3b-instruct",
            name = "Llama 3.2 3B",
            version = "3.2",
            sizeMB = 2550,
            quantization = QuantizationType.INT4,
            contextLength = 8192,
            downloadURL = "https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/main/llama-3.2-3B/spinquant/llama3_2_3B_spinquant.pte",
            checksum = "sha256:auto",
            minMemoryMB = 6000,
            supportedFeatures = FeatureType.entries.toList(),
            promptFormat = PromptFormat.LLAMA,
            tokenizerURL = "https://huggingface.co/executorch-community/Llama-3.2-1B-ET/resolve/main/tokenizer.model"
        )
    )

    /** Get model info by ID */
    fun getModel(modelId: String): DownloadableModelInfo? {
        return models.firstOrNull { it.modelId == modelId }
    }

    /** Get the default recommended model */
    fun getDefaultModel(): DownloadableModelInfo = models.first()

    /** Get recommended model for available memory */
    fun getRecommendedModel(memoryMB: Int): DownloadableModelInfo? {
        return models.filter { it.minMemoryMB <= memoryMB }
            .maxByOrNull { it.sizeMB }
    }

    /** Get all models compatible with available memory */
    fun getCompatibleModels(memoryMB: Int): List<DownloadableModelInfo> {
        return models.filter { it.minMemoryMB <= memoryMB }
    }
}
