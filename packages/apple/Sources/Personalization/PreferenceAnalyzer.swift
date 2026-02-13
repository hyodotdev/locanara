import Foundation
import NaturalLanguage
import os.log

private let logger = Logger(subsystem: "com.locanara", category: "PreferenceAnalyzer")

/// Detected preference patterns from user feedback
public struct UserPreferences: Sendable, Codable {
    /// Preferred response length (short, medium, long)
    public let preferredLength: ResponseLength

    /// Preferred formality level (casual, neutral, formal)
    public let preferredFormality: FormalityLevel

    /// Preferred detail level (concise, balanced, detailed)
    public let preferredDetail: DetailLevel

    /// Common topics the user likes responses about
    public let preferredTopics: [String]

    /// Writing style preferences
    public let stylePreferences: [StylePreference]

    /// Feature-specific preferences
    public let featurePreferences: [FeatureType: FeaturePreference]

    /// Confidence score for the analysis (0.0 - 1.0)
    public let confidence: Double

    /// When this analysis was performed
    public let analyzedAt: Date

    public init(
        preferredLength: ResponseLength = .medium,
        preferredFormality: FormalityLevel = .neutral,
        preferredDetail: DetailLevel = .balanced,
        preferredTopics: [String] = [],
        stylePreferences: [StylePreference] = [],
        featurePreferences: [FeatureType: FeaturePreference] = [:],
        confidence: Double = 0.0,
        analyzedAt: Date = Date()
    ) {
        self.preferredLength = preferredLength
        self.preferredFormality = preferredFormality
        self.preferredDetail = preferredDetail
        self.preferredTopics = preferredTopics
        self.stylePreferences = stylePreferences
        self.featurePreferences = featurePreferences
        self.confidence = confidence
        self.analyzedAt = analyzedAt
    }

    public static let `default` = UserPreferences()
}

/// Response length preference
public enum ResponseLength: String, Codable, Sendable {
    case short = "short"
    case medium = "medium"
    case long = "long"

    public var description: String {
        switch self {
        case .short: return "Keep responses brief and to the point"
        case .medium: return "Provide moderate-length responses"
        case .long: return "Give detailed, comprehensive responses"
        }
    }
}

/// Formality level preference
public enum FormalityLevel: String, Codable, Sendable {
    case casual = "casual"
    case neutral = "neutral"
    case formal = "formal"

    public var description: String {
        switch self {
        case .casual: return "Use a friendly, conversational tone"
        case .neutral: return "Use a balanced, professional tone"
        case .formal: return "Use formal, professional language"
        }
    }
}

/// Detail level preference
public enum DetailLevel: String, Codable, Sendable {
    case concise = "concise"
    case balanced = "balanced"
    case detailed = "detailed"

    public var description: String {
        switch self {
        case .concise: return "Focus on key points without elaboration"
        case .balanced: return "Provide enough detail to be helpful"
        case .detailed: return "Include thorough explanations and examples"
        }
    }
}

/// Style preference type
public struct StylePreference: Sendable, Codable {
    public let name: String
    public let description: String
    public let weight: Double // 0.0 - 1.0 importance

    public init(name: String, description: String, weight: Double) {
        self.name = name
        self.description = description
        self.weight = weight
    }
}

/// Feature-specific preference
public struct FeaturePreference: Sendable, Codable {
    public let feature: FeatureType
    public let preferredStyle: String?
    public let additionalInstructions: String?

    public init(feature: FeatureType, preferredStyle: String?, additionalInstructions: String?) {
        self.feature = feature
        self.preferredStyle = preferredStyle
        self.additionalInstructions = additionalInstructions
    }
}

/// Analyzes user feedback to extract preference patterns
public actor PreferenceAnalyzer {
    private let feedbackCollector: FeedbackCollector
    private let tagger: NLTagger

    /// Minimum feedback count for reliable analysis
    private let minFeedbackCount = 3

    public init(feedbackCollector: FeedbackCollector) {
        self.feedbackCollector = feedbackCollector
        self.tagger = NLTagger(tagSchemes: [.lexicalClass, .nameType])
    }

    // MARK: - Analysis

    /// Analyze feedback to extract user preferences
    public func analyzePreferences(profileId: String) async throws -> UserPreferences {
        let positiveFeedback = try await feedbackCollector.getFeedbackHistory(profileId: profileId, limit: 100)
            .filter { $0.liked }

        guard positiveFeedback.count >= minFeedbackCount else {
            logger.info("Not enough feedback for analysis (have \(positiveFeedback.count), need \(self.minFeedbackCount))")
            return UserPreferences.default
        }

        logger.info("Analyzing \(positiveFeedback.count) positive feedback records")

        // Analyze different aspects
        let lengthPreference = analyzeLength(feedback: positiveFeedback)
        let formalityPreference = analyzeFormality(feedback: positiveFeedback)
        let detailPreference = analyzeDetail(feedback: positiveFeedback)
        let topics = extractTopics(feedback: positiveFeedback)
        let styles = analyzeStyles(feedback: positiveFeedback)
        let featurePrefs = analyzeFeaturePreferences(feedback: positiveFeedback)

        // Calculate confidence based on feedback count
        let confidence = min(1.0, Double(positiveFeedback.count) / 50.0)

        return UserPreferences(
            preferredLength: lengthPreference,
            preferredFormality: formalityPreference,
            preferredDetail: detailPreference,
            preferredTopics: topics,
            stylePreferences: styles,
            featurePreferences: featurePrefs,
            confidence: confidence,
            analyzedAt: Date()
        )
    }

    // MARK: - Length Analysis

    private func analyzeLength(feedback: [FeedbackRecord]) -> ResponseLength {
        let lengths = feedback.map { $0.output.count }
        let avgLength = Double(lengths.reduce(0, +)) / Double(lengths.count)

        // Categorize based on average preferred output length
        if avgLength < 200 {
            return .short
        } else if avgLength < 600 {
            return .medium
        } else {
            return .long
        }
    }

    // MARK: - Formality Analysis

    private func analyzeFormality(feedback: [FeedbackRecord]) -> FormalityLevel {
        var casualCount = 0
        var formalCount = 0

        for record in feedback {
            let output = record.output.lowercased()

            // Casual indicators
            if output.contains("hey") || output.contains("!") ||
               output.contains("gonna") || output.contains("wanna") ||
               output.contains(":)") || output.contains("cool") {
                casualCount += 1
            }

            // Formal indicators
            if output.contains("therefore") || output.contains("furthermore") ||
               output.contains("consequently") || output.contains("regarding") ||
               output.contains("in conclusion") {
                formalCount += 1
            }
        }

        let total = feedback.count
        let casualRatio = Double(casualCount) / Double(total)
        let formalRatio = Double(formalCount) / Double(total)

        if casualRatio > 0.3 {
            return .casual
        } else if formalRatio > 0.3 {
            return .formal
        } else {
            return .neutral
        }
    }

    // MARK: - Detail Analysis

    private func analyzeDetail(feedback: [FeedbackRecord]) -> DetailLevel {
        var totalSentences = 0
        var totalWords = 0

        for record in feedback {
            let sentences = record.output.components(separatedBy: CharacterSet(charactersIn: ".!?"))
                .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
            let words = record.output.components(separatedBy: .whitespaces)
                .filter { !$0.isEmpty }

            totalSentences += sentences.count
            totalWords += words.count
        }

        let avgWordsPerResponse = Double(totalWords) / Double(feedback.count)
        let avgSentencesPerResponse = Double(totalSentences) / Double(feedback.count)

        // Detailed responses have more sentences and examples
        if avgSentencesPerResponse > 8 || avgWordsPerResponse > 150 {
            return .detailed
        } else if avgSentencesPerResponse < 3 || avgWordsPerResponse < 50 {
            return .concise
        } else {
            return .balanced
        }
    }

    // MARK: - Topic Extraction

    private func extractTopics(feedback: [FeedbackRecord]) -> [String] {
        var topicCounts: [String: Int] = [:]

        for record in feedback {
            // Extract nouns from input and output
            let text = record.input + " " + record.output
            tagger.string = text

            tagger.enumerateTags(in: text.startIndex..<text.endIndex, unit: .word, scheme: .lexicalClass) { tag, range in
                if tag == .noun {
                    let word = String(text[range]).lowercased()
                    if word.count > 3 { // Filter short words
                        topicCounts[word, default: 0] += 1
                    }
                }
                return true
            }
        }

        // Return top topics (appearing in at least 3 feedback records)
        return topicCounts
            .filter { $0.value >= 3 }
            .sorted { $0.value > $1.value }
            .prefix(10)
            .map { $0.key }
    }

    // MARK: - Style Analysis

    private func analyzeStyles(feedback: [FeedbackRecord]) -> [StylePreference] {
        var styles: [StylePreference] = []

        // Check for bullet point preference
        let bulletCount = feedback.filter { $0.output.contains("•") || $0.output.contains("-") || $0.output.contains("*") }.count
        if Double(bulletCount) / Double(feedback.count) > 0.3 {
            styles.append(StylePreference(
                name: "bullet_points",
                description: "Use bullet points for lists",
                weight: Double(bulletCount) / Double(feedback.count)
            ))
        }

        // Check for example preference
        let exampleCount = feedback.filter {
            $0.output.lowercased().contains("for example") ||
            $0.output.lowercased().contains("e.g.") ||
            $0.output.lowercased().contains("such as")
        }.count
        if Double(exampleCount) / Double(feedback.count) > 0.2 {
            styles.append(StylePreference(
                name: "examples",
                description: "Include examples when explaining",
                weight: Double(exampleCount) / Double(feedback.count)
            ))
        }

        // Check for step-by-step preference
        let stepCount = feedback.filter {
            $0.output.contains("1.") || $0.output.contains("Step 1") ||
            $0.output.lowercased().contains("first,") || $0.output.lowercased().contains("then,")
        }.count
        if Double(stepCount) / Double(feedback.count) > 0.2 {
            styles.append(StylePreference(
                name: "step_by_step",
                description: "Use numbered steps for instructions",
                weight: Double(stepCount) / Double(feedback.count)
            ))
        }

        return styles
    }

    // MARK: - Feature-Specific Analysis

    private func analyzeFeaturePreferences(feedback: [FeedbackRecord]) -> [FeatureType: FeaturePreference] {
        var featurePrefs: [FeatureType: FeaturePreference] = [:]

        // Group feedback by feature
        let grouped = Dictionary(grouping: feedback) { $0.feature }

        for (feature, records) in grouped where records.count >= 2 {
            var preferredStyle: String?
            var instructions: String?

            switch feature {
            case .summarize:
                let avgLength = records.map { $0.output.count }.reduce(0, +) / records.count
                if avgLength < 100 {
                    preferredStyle = "very brief"
                } else if avgLength < 300 {
                    preferredStyle = "moderate length"
                } else {
                    preferredStyle = "detailed"
                }
                instructions = "Generate \(preferredStyle!) summaries"

            case .rewrite:
                // Analyze if user prefers certain rewrite styles
                instructions = "Maintain the user's preferred writing voice"

            case .chat:
                // Check conversation style
                let avgResponseLength = records.map { $0.output.count }.reduce(0, +) / records.count
                if avgResponseLength < 150 {
                    preferredStyle = "concise"
                    instructions = "Keep chat responses brief and direct"
                } else {
                    preferredStyle = "conversational"
                    instructions = "Provide engaging, thorough chat responses"
                }

            default:
                break
            }

            if preferredStyle != nil || instructions != nil {
                featurePrefs[feature] = FeaturePreference(
                    feature: feature,
                    preferredStyle: preferredStyle,
                    additionalInstructions: instructions
                )
            }
        }

        return featurePrefs
    }
}
