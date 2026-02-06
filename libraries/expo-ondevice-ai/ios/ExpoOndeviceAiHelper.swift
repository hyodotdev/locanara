import Locanara

/// Decodes JS options dictionaries into Locanara SDK input types
enum ExpoOndeviceAiHelper {

    static func buildFeatureInput(
        feature: FeatureType,
        text: String,
        options: [String: Any]?
    ) -> ExecuteFeatureInput {
        let parameters = decodeParameters(feature: feature, options: options)
        return ExecuteFeatureInput(
            feature: feature,
            input: text,
            parameters: parameters
        )
    }

    // MARK: - Parameter Decoding

    private static func decodeParameters(
        feature: FeatureType,
        options: [String: Any]?
    ) -> FeatureParametersInput? {
        guard let opts = options else { return nil }

        switch feature {
        case .summarize:
            return decodeSummarize(opts)
        case .classify:
            return decodeClassify(opts)
        case .extract:
            return decodeExtract(opts)
        case .chat:
            return decodeChat(opts)
        case .translate:
            return decodeTranslate(opts)
        case .rewrite:
            return decodeRewrite(opts)
        case .proofread:
            return decodeProofread(opts)
        default:
            return nil
        }
    }

    private static func decodeSummarize(_ opts: [String: Any]) -> FeatureParametersInput? {
        let inputType = (opts["inputType"] as? String).flatMap(SummarizeInputType.init(rawValue:))
        let outputType = (opts["outputType"] as? String).flatMap(SummarizeOutputType.init(rawValue:))
        guard inputType != nil || outputType != nil else { return nil }
        return FeatureParametersInput(
            summarize: SummarizeParametersInput(inputType: inputType, outputType: outputType)
        )
    }

    private static func decodeClassify(_ opts: [String: Any]) -> FeatureParametersInput? {
        let categories = opts["categories"] as? [String]
        let maxResults = opts["maxResults"] as? Int
        guard categories != nil || maxResults != nil else { return nil }
        return FeatureParametersInput(
            classify: ClassifyParametersInput(categories: categories, maxResults: maxResults)
        )
    }

    private static func decodeExtract(_ opts: [String: Any]) -> FeatureParametersInput? {
        let entityTypes = opts["entityTypes"] as? [String]
        let extractKeyValues = opts["extractKeyValues"] as? Bool
        guard entityTypes != nil || extractKeyValues != nil else { return nil }
        return FeatureParametersInput(
            extract: ExtractParametersInput(entityTypes: entityTypes, extractKeyValues: extractKeyValues)
        )
    }

    private static func decodeChat(_ opts: [String: Any]) -> FeatureParametersInput? {
        let conversationId = opts["conversationId"] as? String
        let systemPrompt = opts["systemPrompt"] as? String
        var history: [ChatMessageInput]? = nil

        if let historyArray = opts["history"] as? [[String: String]] {
            history = historyArray.compactMap { msg in
                guard let role = msg["role"], let content = msg["content"] else { return nil }
                return ChatMessageInput(role: role, content: content)
            }
        }

        return FeatureParametersInput(
            chat: ChatParametersInput(
                conversationId: conversationId,
                systemPrompt: systemPrompt,
                history: history
            )
        )
    }

    private static func decodeTranslate(_ opts: [String: Any]) -> FeatureParametersInput? {
        guard let targetLanguage = opts["targetLanguage"] as? String else { return nil }
        let sourceLanguage = opts["sourceLanguage"] as? String
        return FeatureParametersInput(
            translate: TranslateParametersInput(
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage
            )
        )
    }

    private static func decodeRewrite(_ opts: [String: Any]) -> FeatureParametersInput? {
        guard let outputTypeStr = opts["outputType"] as? String,
              let outputType = RewriteOutputType(rawValue: outputTypeStr) else { return nil }
        return FeatureParametersInput(
            rewrite: RewriteParametersInput(outputType: outputType)
        )
    }

    private static func decodeProofread(_ opts: [String: Any]) -> FeatureParametersInput? {
        let inputType = (opts["inputType"] as? String).flatMap(ProofreadInputType.init(rawValue:))
        guard inputType != nil else { return nil }
        return FeatureParametersInput(
            proofread: ProofreadParametersInput(inputType: inputType)
        )
    }
}
