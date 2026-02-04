import SwiftUI
import Locanara

#if os(macOS)
import AppKit
#endif

/// Settings view - Tab 3
struct Settings: View {
    @EnvironmentObject var appState: AppState
    @State private var showingInstructions = false

    var body: some View {
        NavigationStack {
            List {
                // Setup Guide (at top)
                Section("Setup Guide") {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("How to Enable Apple Intelligence")
                            .font(.headline)

                        SetupStepRow(number: 1, title: "Check Requirements", description: "iPhone 15 Pro+, iPad M1+, or Mac M1+")
                        SetupStepRow(
                            number: 2,
                            title: "Update to iOS 18+",
                            description: "Settings > General > Software Update"
                        )
                        SetupStepRow(
                            number: 3,
                            title: "Enable Apple Intelligence",
                            description: "Settings > Apple Intelligence & Siri"
                        )
                        SetupStepRow(number: 4, title: "Wait for Setup", description: "Download may take a few minutes")

                        Text("Requirements: A17 Pro chip or M1+, iOS 18+, Device language set to English")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.top, 4)
                    }
                    .padding(.vertical, 4)
                }

                Section("Apple Intelligence") {
                    Button {
                        openAppleIntelligenceSettings()
                    } label: {
                        HStack {
                            Label("Apple Intelligence Settings", systemImage: "brain.head.profile")
                            Spacer()
                            Image(systemName: "arrow.up.forward.app")
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                Section("Privacy") {
                    NavigationLink {
                        PrivacySettingsView()
                    } label: {
                        Label("Processing Preferences", systemImage: "hand.raised")
                    }
                }

                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(LocanaraClient.version)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .alert("Apple Intelligence Settings", isPresented: $showingInstructions) {
                Button("OK", role: .cancel) { }
            } message: {
                #if os(macOS) || targetEnvironment(macCatalyst)
                Text("""
                    To configure Apple Intelligence:

                    1. Open System Settings
                    2. Click "Apple Intelligence & Siri"
                    3. Turn on Apple Intelligence
                    """)
                #else
                Text("""
                    To configure Apple Intelligence:

                    1. Open Settings app
                    2. Tap "Apple Intelligence & Siri"
                    3. Turn on Apple Intelligence
                    """)
                #endif
            }
        }
    }

    private func openAppleIntelligenceSettings() {
        #if os(macOS)
        // Native macOS: Use NSWorkspace to open System Settings
        let urlStrings = [
            "x-apple.systempreferences:com.apple.Siri-Settings.extension",
            "x-apple.systempreferences:com.apple.preferences.AppleIntelligence",
            "x-apple.systempreferences:"
        ]

        for urlString in urlStrings {
            if let url = URL(string: urlString) {
                if NSWorkspace.shared.open(url) {
                    return
                }
            }
        }

        // Fallback: open System Settings app directly
        NSWorkspace.shared.open(URL(fileURLWithPath: "/System/Applications/System Settings.app"))
        #elseif targetEnvironment(macCatalyst)
        // Mac Catalyst cannot open System Settings due to sandbox restrictions
        showingInstructions = true
        #else
        // iOS/iPadOS: Show instructions instead of deep-linking
        //
        // Why we don't use URL deep-linking:
        // 1. App-prefs: URL scheme is undocumented and not officially supported by Apple
        // 2. iPadOS has stricter sandbox restrictions that block App-prefs: URLs
        //    (Error: "unable to make sandbox extension: Operation not permitted")
        // 3. URL scheme behavior varies between iOS versions
        // 4. Apple may reject apps that use private URL schemes
        //
        // The only reliable approach is to show manual instructions.
        showingInstructions = true
        #endif
    }
}

// MARK: - Privacy Settings (sub-page)

struct PrivacySettingsView: View {
    @AppStorage("processingPreference") private var processingPreference: ProcessingPreference = .auto
    @AppStorage("privacyLevel") private var privacyLevel: PrivacyLevel = .balanced

    var body: some View {
        Form {
            Section {
                Picker("Processing Location", selection: $processingPreference) {
                    Text("Auto").tag(ProcessingPreference.auto)
                    Text("On-Device Only").tag(ProcessingPreference.onDeviceOnly)
                    Text("On-Device Preferred").tag(ProcessingPreference.onDevicePreferred)
                    Text("Cloud Preferred").tag(ProcessingPreference.cloudPreferred)
                }
            } footer: {
                Text("Choose where AI processing should occur. On-device processing keeps your data private.")
            }

            Section {
                Picker("Privacy Level", selection: $privacyLevel) {
                    Text("Strict").tag(PrivacyLevel.strict)
                    Text("Balanced").tag(PrivacyLevel.balanced)
                    Text("Permissive").tag(PrivacyLevel.permissive)
                }
            } footer: {
                Text("Strict mode ensures maximum privacy. Balanced mode offers a good trade-off. Permissive mode prioritizes functionality.")
            }
        }
        .navigationTitle("Privacy Settings")
    }
}

// MARK: - Setup Step Row

struct SetupStepRow: View {
    let number: Int
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundStyle(.white)
                .frame(width: 22, height: 22)
                .background(Color.accentColor)
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

#Preview {
    Settings()
}
