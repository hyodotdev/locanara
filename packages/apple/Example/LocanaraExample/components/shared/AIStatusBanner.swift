import SwiftUI
import Locanara

/// AI status banner showing current Apple Intelligence status
/// Community version - Apple Intelligence only
struct AIStatusBanner: View {
    @EnvironmentObject var appState: AppState

    /// Whether the SDK is currently initializing
    private var isInitializing: Bool {
        appState.sdkState == .initializing || appState.aiAvailability == .checking
    }

    var body: some View {
        HStack(spacing: 12) {
            if isInitializing {
                ProgressView()
                    .frame(width: 24, height: 24)
            } else {
                Image(systemName: statusIcon)
                    .font(.title2)
                    .foregroundStyle(statusColor)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(statusTitle)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Text(statusSubtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding(.vertical, 8)
    }

    private var statusIcon: String {
        switch appState.currentEngine {
        case .foundationModels:
            return "apple.intelligence"
        case .none:
            return "exclamationmark.triangle.fill"
        }
    }

    private var statusColor: Color {
        switch appState.currentEngine {
        case .foundationModels:
            return .blue
        case .none:
            return .orange
        }
    }

    private var statusTitle: String {
        if isInitializing {
            return "Checking Apple Intelligence..."
        }

        switch appState.currentEngine {
        case .foundationModels:
            return "Apple Intelligence Active"
        case .none:
            return "Apple Intelligence Required"
        }
    }

    private var statusSubtitle: String {
        if isInitializing {
            return "Please wait while checking device capabilities"
        }

        switch appState.currentEngine {
        case .foundationModels:
            return "Using Apple's on-device AI"
        case .none:
            return "This device doesn't support Apple Intelligence"
        }
    }
}

#Preview {
    AIStatusBanner()
        .environmentObject(AppState())
        .padding()
}
