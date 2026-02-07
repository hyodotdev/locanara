package expo.modules.ondeviceai

import com.locanara.*

/// Serializes Locanara SDK result types into JS-compatible maps
object ExpoOndeviceAiSerialization {

    // MARK: - Device Capability

    fun deviceCapability(capability: DeviceCapability): Map<String, Any> {
        val availableSet = capability.availableFeatures.toSet()
        val features = mutableMapOf<String, Boolean>()
        for (feature in FeatureType.entries) {
            features[featureKey(feature)] = availableSet.contains(feature)
        }

        return mapOf(
            "isSupported" to capability.supportsOnDeviceAI,
            "isModelReady" to (capability.modelInfo?.isLoaded == true),
            "platform" to "ANDROID",
            "features" to features,
            "availableMemoryMB" to (capability.availableMemoryMB ?: 0),
            "isLowPowerMode" to capability.isLowPowerMode
        )
    }

    // MARK: - Feature Results

    fun result(executionResult: ExecutionResult): Map<String, Any> {
        val data = executionResult.result
            ?: throw Exception("No result data")

        return when (data) {
            is SummarizeResult -> summarize(data)
            is ClassifyResult -> classify(data)
            is ExtractResult -> extract(data)
            is ChatResult -> chat(data)
            is TranslateResult -> translate(data)
            is RewriteResult -> rewrite(data)
            is ProofreadResult -> proofread(data)
            else -> throw Exception("Unsupported result type")
        }
    }

    // MARK: - Individual Serializers

    private fun summarize(r: SummarizeResult): Map<String, Any> = mapOf(
        "summary" to r.summary,
        "originalLength" to r.originalLength,
        "summaryLength" to r.summaryLength,
        "confidence" to (r.confidence ?: 0.0)
    )

    private fun classify(r: ClassifyResult): Map<String, Any> {
        val classifications = r.classifications.map { c ->
            mapOf(
                "label" to c.label,
                "score" to c.score,
                "metadata" to (c.metadata ?: "")
            )
        }
        return mapOf(
            "classifications" to classifications,
            "topClassification" to mapOf(
                "label" to r.topClassification.label,
                "score" to r.topClassification.score
            )
        )
    }

    private fun extract(r: ExtractResult): Map<String, Any> {
        val entities = r.entities.map { e ->
            mapOf(
                "type" to e.type,
                "value" to e.value,
                "confidence" to e.confidence,
                "startPos" to (e.startPos ?: 0),
                "endPos" to (e.endPos ?: 0)
            )
        }

        val response = mutableMapOf<String, Any>("entities" to entities)

        r.keyValuePairs?.let { pairs ->
            response["keyValuePairs"] = pairs.map { p ->
                mapOf(
                    "key" to p.key,
                    "value" to p.value,
                    "confidence" to (p.confidence ?: 0.0)
                )
            }
        }

        return response
    }

    private fun chat(r: ChatResult): Map<String, Any> {
        val response = mutableMapOf<String, Any>(
            "message" to r.message,
            "canContinue" to r.canContinue
        )
        r.conversationId?.let { response["conversationId"] = it }
        r.suggestedPrompts?.let { response["suggestedPrompts"] = it }
        return response
    }

    private fun translate(r: TranslateResult): Map<String, Any> = mapOf(
        "translatedText" to r.translatedText,
        "sourceLanguage" to r.sourceLanguage,
        "targetLanguage" to r.targetLanguage,
        "confidence" to (r.confidence ?: 0.0)
    )

    private fun rewrite(r: RewriteResult): Map<String, Any> {
        val response = mutableMapOf<String, Any>(
            "rewrittenText" to r.rewrittenText,
            "confidence" to (r.confidence ?: 0.0)
        )
        r.style?.let { response["style"] = it.name }
        r.alternatives?.let { response["alternatives"] = it }
        return response
    }

    private fun proofread(r: ProofreadResult): Map<String, Any> {
        val corrections = r.corrections.map { c ->
            mapOf(
                "original" to c.original,
                "corrected" to c.corrected,
                "type" to (c.type ?: ""),
                "confidence" to (c.confidence ?: 0.0),
                "startPos" to (c.startPos ?: 0),
                "endPos" to (c.endPos ?: 0)
            )
        }
        return mapOf(
            "correctedText" to r.correctedText,
            "corrections" to corrections,
            "hasCorrections" to r.hasCorrections
        )
    }

    // MARK: - Helpers

    /** Convert FeatureType enum to camelCase key for JS */
    private fun featureKey(feature: FeatureType): String {
        // SUMMARIZE -> summarize, DESCRIBE_IMAGE -> describeImage
        return feature.name.lowercase().replace(Regex("_([a-z])")) { match ->
            match.groupValues[1].uppercase()
        }
    }
}
