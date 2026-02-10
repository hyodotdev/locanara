import SwiftUI
import Locanara

/// Detail view for each feature with interactive demo
struct FeatureDetail: View {
    let feature: FeatureInfo

    var body: some View {
        Group {
            switch feature.type {
            case .summarize:
                SummarizeDemo()
            case .classify:
                ClassifyDemo()
            case .extract:
                ExtractDemo()
            case .chat:
                ChatDemo()
            case .translate:
                TranslateDemo()
            case .rewrite:
                RewriteDemo()
            case .proofread:
                ProofreadDemo()
            default:
                Text("Not available")
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle(featureName)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
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
        default: return "Feature"
        }
    }
}

#Preview {
    NavigationStack {
        FeatureDetail(feature: FeatureInfo(
            type: .summarize,
            isAvailable: true,
            description: "Test"
        ))
    }
}
