import SwiftUI
import Locanara

/// Banner shown when AI model is required but not available
/// Community version - Apple Intelligence only
struct AIModelRequiredBanner: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconName)
                .font(.title2)
                .foregroundStyle(.orange)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var iconName: String {
        if appState.isFoundationModelsEligibleButNotReady {
            return "apple.intelligence"
        } else {
            return "exclamationmark.triangle"
        }
    }

    private var title: String {
        if appState.isFoundationModelsEligibleButNotReady {
            return "Apple Intelligence Models Required"
        } else {
            return "AI Not Available"
        }
    }

    private var subtitle: String {
        if appState.isFoundationModelsEligibleButNotReady {
            return "Download Apple Intelligence models in Settings → Apple Intelligence & Siri."
        } else {
            return "This device does not support on-device AI features."
        }
    }
}

#Preview {
    AIModelRequiredBanner()
        .environmentObject(AppState())
        .padding()
}
