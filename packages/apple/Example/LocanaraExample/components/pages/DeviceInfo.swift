import SwiftUI
import Locanara

/// Current SDK tier - Community
let currentTier: LocanaraTier = .community

/// Device info view - Tab 2
struct DeviceInfo: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        NavigationStack {
            List {
                if let deviceInfo = appState.deviceInfo {
                    Section("Device") {
                        InfoRow(label: "Model", value: deviceInfo.modelIdentifier)
                        InfoRow(label: "OS Version", value: deviceInfo.osVersion)
                    }

                    Section("AI Capabilities") {
                        InfoRow(
                            label: "Apple Intelligence",
                            value: deviceInfo.supportsAppleIntelligence ? "Supported" : "Not Supported",
                            valueColor: deviceInfo.supportsAppleIntelligence ? .green : .red
                        )
                        InfoRow(
                            label: "Neural Engine",
                            value: deviceInfo.hasNeuralEngine ? "Available" : "Not Available",
                            valueColor: deviceInfo.hasNeuralEngine ? .green : .red
                        )
                    }

                    Section("Languages") {
                        ForEach(deviceInfo.systemLanguages, id: \.self) { language in
                            Text(language)
                        }
                    }
                } else {
                    Section {
                        Text("Device information not available")
                            .foregroundStyle(.secondary)
                    }
                }

                Section("SDK") {
                    InfoRow(label: "Locanara Version", value: LocanaraClient.version)
                    InfoRow(label: "Tier", value: currentTier.rawValue.capitalized)
                    InfoRow(
                        label: "Package Source",
                        value: ExamplePackageSource.current.rawValue,
                        valueColor: ExamplePackageSource.current == .releasedPackage ? .blue : .orange
                    )
                    InfoRow(label: "SDK State", value: sdkStateString)
                }
            }
            .navigationTitle("Device Info")
        }
    }

    private var sdkStateString: String {
        switch appState.sdkState {
        case .notInitialized: return "Not Initialized"
        case .initializing: return "Initializing..."
        case .initialized: return "Initialized"
        case .error(let msg): return "Error: \(msg)"
        }
    }
}

#Preview {
    DeviceInfo()
        .environmentObject(AppState())
}
