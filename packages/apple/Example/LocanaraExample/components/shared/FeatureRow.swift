import SwiftUI
import Locanara

/// Row displaying a feature with icon and description
struct FeatureRow: View {
    let feature: FeatureInfo

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconName)
                .font(.title2)
                .foregroundStyle(feature.isAvailable ? .blue : .gray)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(featureName)
                    .font(.headline)
                    .foregroundStyle(feature.isAvailable ? .primary : .secondary)

                Text(feature.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            Spacer()

            if !feature.isAvailable {
                Image(systemName: "lock.fill")
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private var iconName: String {
        switch feature.type {
        case .summarize: return "doc.text.magnifyingglass"
        case .classify: return "tag"
        case .extract: return "text.viewfinder"
        case .chat: return "bubble.left.and.bubble.right"
        case .translate: return "globe"
        case .rewrite: return "pencil.and.outline"
        case .proofread: return "checkmark.circle"
        case .describeImage, .describeImageAndroid: return "photo"
        case .generateImage, .generateImageIos: return "wand.and.stars"
        }
    }

    private var featureName: String {
        switch feature.type {
        case .summarize: return "Summarize"
        case .classify: return "Classify"
        case .extract: return "Extract"
        case .chat: return "Chat"
        case .translate: return "Translate"
        case .rewrite: return "Rewrite"
        case .proofread: return "Proofread"
        case .describeImage, .describeImageAndroid: return "Describe Image"
        case .generateImage, .generateImageIos: return "Generate Image"
        }
    }
}
