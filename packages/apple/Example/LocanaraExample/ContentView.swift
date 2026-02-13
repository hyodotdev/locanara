import SwiftUI
import Locanara
#if os(macOS)
import AppKit
#endif

/// Main content view with AI availability check and feature navigation
struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        NavigationStack {
            Group {
                switch appState.sdkState {
                case .notInitialized:
                    InitializingView()

                case .initializing:
                    LoadingView(message: "Initializing Locanara SDK...")

                case .initialized:
                    // Always show main tab navigation - model download handled via AIStatusBanner
                    MainTabNavigation()

                case .error(let message):
                    ErrorView(message: message) {
                        Task {
                            await appState.initializeSDK()
                        }
                    }
                }
            }
            .navigationTitle("Locanara")
        }
        .task {
            await appState.initializeSDK()
        }
    }
}

// MARK: - Initializing View

struct InitializingView: View {
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 80))
                .foregroundStyle(.blue)

            Text("Locanara")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("On-device AI SDK")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            ProgressView()
                .padding(.top)
        }
        .padding()
    }
}

// MARK: - Loading View

struct LoadingView: View {
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)

            Text(message)
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

// MARK: - Error View

struct ErrorView: View {
    let message: String
    let retryAction: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundStyle(.red)

            Text("Initialization Error")
                .font(.title2)
                .fontWeight(.bold)

            Text(message)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: retryAction) {
                Label("Retry", systemImage: "arrow.clockwise")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.horizontal, 32)
        }
        .padding()
    }
}

// MARK: - Preview

#Preview {
    ContentView()
        .environmentObject(AppState())
}
