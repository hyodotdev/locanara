import Locanara

/// Serializes Locanara SDK result types into JS-compatible dictionaries
enum ExpoOndeviceAiSerialization {

    // MARK: - Device Capability

    static func deviceCapability(
        _ capability: DeviceCapability,
        isModelReady: Bool,
        supportsAppleIntelligence: Bool
    ) -> [String: Any] {
        let availableSet = Set(capability.availableFeatures)
        var features: [String: Bool] = [:]
        for feature in FeatureType.allCases {
            features["\(feature)"] = availableSet.contains(feature)
        }

        return [
            "isSupported": capability.supportsOnDeviceAI,
            "isModelReady": isModelReady,
            "supportsAppleIntelligence": supportsAppleIntelligence,
            "platform": "IOS",
            "features": features,
            "availableMemoryMB": capability.availableMemoryMB ?? 0,
            "isLowPowerMode": capability.isLowPowerMode
        ]
    }

    // MARK: - Result Serializers

    static func summarize(_ r: SummarizeResult) -> [String: Any] {
        [
            "summary": r.summary,
            "originalLength": r.originalLength,
            "summaryLength": r.summaryLength,
            "confidence": r.confidence ?? 0.0
        ]
    }

    static func classify(_ r: ClassifyResult) -> [String: Any] {
        let classifications = r.classifications.map { c in
            [
                "label": c.label,
                "score": c.score,
                "metadata": c.metadata ?? ""
            ] as [String: Any]
        }
        return [
            "classifications": classifications,
            "topClassification": [
                "label": r.topClassification.label,
                "score": r.topClassification.score
            ]
        ]
    }

    static func extract(_ r: ExtractResult) -> [String: Any] {
        let entities = r.entities.map { e in
            [
                "type": e.type,
                "value": e.value,
                "confidence": e.confidence,
                "startPos": e.startPos ?? 0,
                "endPos": e.endPos ?? 0
            ] as [String: Any]
        }

        var response: [String: Any] = ["entities": entities]

        if let keyValuePairs = r.keyValuePairs {
            response["keyValuePairs"] = keyValuePairs.map { p in
                [
                    "key": p.key,
                    "value": p.value,
                    "confidence": p.confidence ?? 0.0
                ] as [String: Any]
            }
        }

        return response
    }

    static func chat(_ r: ChatResult) -> [String: Any] {
        var response: [String: Any] = [
            "message": r.message,
            "canContinue": r.canContinue
        ]
        if let conversationId = r.conversationId {
            response["conversationId"] = conversationId
        }
        if let suggestedPrompts = r.suggestedPrompts {
            response["suggestedPrompts"] = suggestedPrompts
        }
        return response
    }

    static func translate(_ r: TranslateResult) -> [String: Any] {
        [
            "translatedText": r.translatedText,
            "sourceLanguage": r.sourceLanguage,
            "targetLanguage": r.targetLanguage,
            "confidence": r.confidence ?? 0.0
        ]
    }

    static func rewrite(_ r: RewriteResult) -> [String: Any] {
        var response: [String: Any] = [
            "rewrittenText": r.rewrittenText,
            "confidence": r.confidence ?? 0.0
        ]
        if let style = r.style {
            response["style"] = style.rawValue
        }
        if let alternatives = r.alternatives {
            response["alternatives"] = alternatives
        }
        return response
    }

    static func modelInfo(_ m: DownloadableModelInfo) -> [String: Any] {
        [
            "modelId": m.modelId,
            "name": m.name,
            "version": m.version,
            "sizeMB": m.sizeMB,
            "quantization": m.quantization.rawValue,
            "contextLength": m.contextLength,
            "minMemoryMB": m.minMemoryMB,
            "isMultimodal": m.isMultimodal
        ]
    }

    static func proofread(_ r: ProofreadResult) -> [String: Any] {
        let corrections = r.corrections.map { c in
            [
                "original": c.original,
                "corrected": c.corrected,
                "type": c.type ?? "",
                "confidence": c.confidence ?? 0.0,
                "startPos": c.startPos ?? 0,
                "endPos": c.endPos ?? 0
            ] as [String: Any]
        }
        return [
            "correctedText": r.correctedText,
            "corrections": corrections,
            "hasCorrections": r.hasCorrections
        ]
    }
}
