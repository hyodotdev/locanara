import SwiftUI
import Locanara

/// AI status banner showing current inference engine status with model download support
struct AIStatusBanner: View {
    @EnvironmentObject var appState: AppState
    @State private var showingModelSheet = false

    /// Whether the SDK is currently initializing
    private var isInitializing: Bool {
        appState.sdkState == .initializing || appState.aiAvailability == .checking
    }

    var body: some View {
        VStack(spacing: 0) {
            // Main status banner - tap anywhere to show model sheet
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

                // Show icon - download if needed, chevron otherwise
                if !isInitializing && !appState.isDownloading {
                    if appState.needsModelDownload {
                        Image(systemName: "arrow.down.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.blue)
                    } else {
                        Image(systemName: "chevron.right")
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.vertical, 8)
            .contentShape(Rectangle())
            .onTapGesture {
                guard !isInitializing else { return }
                showingModelSheet = true
            }

            // Download progress indicator
            if appState.isDownloading {
                VStack(spacing: 8) {
                    ProgressView(value: appState.downloadProgress)
                        .progressViewStyle(.linear)

                    HStack {
                        Text("Downloading model...")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        Spacer()

                        Text("\(Int(appState.downloadProgress * 100))%")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .monospacedDigit()
                    }
                }
                .padding(.top, 8)
            }

            // Error message
            if let error = appState.downloadError {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                    Spacer()
                }
                .padding(.top, 8)
            }
        }
        .sheet(isPresented: $showingModelSheet, onDismiss: {
            Task { @MainActor in
                appState.refreshFeatures()
            }
        }) {
            ModelDownloadSheet()
                .environmentObject(appState)
                #if os(macOS)
                .frame(width: 450, height: 600)
                #endif
        }
    }

    private var statusIcon: String {
        if appState.isDownloading {
            return "arrow.down.circle"
        }

        switch appState.currentEngine {
        case .foundationModels:
            return "apple.intelligence"
        case .llamaCpp, .mlx, .coreML:
            return appState.isModelReady ? "checkmark.circle.fill" : "arrow.down.circle"
        case .none:
            return "arrow.down.circle"
        }
    }

    private var statusColor: Color {
        if appState.isDownloading {
            return .blue
        }

        switch appState.currentEngine {
        case .foundationModels:
            return .blue
        case .llamaCpp, .mlx, .coreML:
            return appState.isModelReady ? .green : .orange
        case .none:
            return .orange
        }
    }

    private var statusTitle: String {
        if isInitializing {
            return "Checking AI Capabilities..."
        }

        if appState.isDownloading {
            return "Downloading Model..."
        }

        switch appState.currentEngine {
        case .foundationModels:
            return "Apple Intelligence Active"
        case .llamaCpp:
            if appState.isModelReady, let modelId = appState.loadedModelId {
                return "llama.cpp: \(modelDisplayName(modelId))"
            }
            return "llama.cpp (Model Required)"
        case .mlx:
            if appState.isModelReady, let modelId = appState.loadedModelId {
                return "MLX: \(modelDisplayName(modelId))"
            }
            return "MLX (Model Required)"
        case .coreML:
            if appState.isModelReady, let modelId = appState.loadedModelId {
                return "CoreML: \(modelDisplayName(modelId))"
            }
            return "CoreML (Model Required)"
        case .none:
            return "Download Model to Start"
        }
    }

    private func modelDisplayName(_ modelId: String) -> String {
        if let model = appState.availableModels.first(where: { $0.modelId == modelId }) {
            return model.name
        }
        return modelId
    }

    private var statusSubtitle: String {
        if isInitializing {
            return "Please wait while checking device capabilities"
        }

        if appState.isDownloading {
            return "Please wait while the AI model is downloaded"
        }

        let downloadedCount = appState.availableModels.filter { $0.isDownloaded }.count

        switch appState.currentEngine {
        case .foundationModels:
            return "Using Apple's on-device AI • Tap to manage models"
        case .llamaCpp, .mlx, .coreML:
            if appState.isModelReady {
                return "Model loaded • \(downloadedCount) downloaded"
            }
            return downloadedCount > 0 ? "\(downloadedCount) downloaded • Tap to load" : "Tap to download a model"
        case .none:
            return downloadedCount > 0 ? "\(downloadedCount) downloaded • Tap to load" : "Tap to download a model"
        }
    }
}

// MARK: - Model Download Sheet

struct ModelDownloadSheet: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                // Header section
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "cpu")
                                .font(.title)
                                .foregroundStyle(.blue)

                            VStack(alignment: .leading) {
                                Text("On-Device AI Models")
                                    .font(.headline)
                                Text("Download a model to enable AI features")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        if appState.isDownloading {
                            VStack(spacing: 8) {
                                ProgressView(value: appState.downloadProgress)
                                    .progressViewStyle(.linear)

                                HStack {
                                    Text("Downloading...")
                                        .font(.caption)
                                    Spacer()
                                    Text("\(Int(appState.downloadProgress * 100))%")
                                        .font(.caption)
                                        .monospacedDigit()
                                }
                                .foregroundStyle(.secondary)
                            }
                            .padding(.top, 8)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // Native AI Engines section
                Section("Native AI Engines") {
                    NativeEngineRow(
                        name: "Apple Intelligence",
                        icon: "apple.intelligence",
                        isSupported: appState.deviceInfo?.supportsAppleIntelligence ?? false,
                        isActive: appState.currentEngine == .foundationModels,
                        onSelect: {
                            appState.switchToAppleIntelligence()
                        }
                    )
                }

                // External models (llama.cpp)
                Section("Available Models") {
                    ForEach(appState.availableModels) { model in
                        ModelRow(
                            model: model,
                            isActiveEngine: appState.currentEngine == .llamaCpp && appState.loadedModelId == model.modelId,
                            onDownload: {
                                Task {
                                    await appState.downloadModel(model.modelId)
                                }
                            },
                            onDelete: {
                                Task {
                                    await appState.deleteModel(model.modelId)
                                }
                            },
                            onLoad: {
                                Task {
                                    await appState.loadModel(model.modelId)
                                }
                            },
                            onSelect: {
                                appState.switchToExternalModel(model.modelId)
                            }
                        )
                        .disabled(appState.isDownloading)
                    }

                    if appState.availableModels.isEmpty {
                        Text("No models available")
                            .foregroundStyle(.secondary)
                    }
                }

                // Quick download section
                if !appState.isModelReady && !appState.isDownloading {
                    Section {
                        Button {
                            Task {
                                await appState.downloadRecommendedModel()
                            }
                        } label: {
                            HStack {
                                Image(systemName: "sparkles")
                                Text("Download Recommended Model")
                                Spacer()
                                Image(systemName: "arrow.down.circle.fill")
                            }
                        }
                    } footer: {
                        Text("Downloads the best model for your device based on available memory.")
                    }
                }

                // Info section
                Section("About On-Device AI") {
                    ModelInfoRow(icon: "lock.shield", title: "Privacy", description: "All processing happens on your device")
                    ModelInfoRow(icon: "wifi.slash", title: "Offline", description: "Works without internet connection")
                    ModelInfoRow(icon: "bolt", title: "Fast", description: "Low latency, instant responses")
                }
            }
            .navigationTitle("AI Models")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #else
            .listStyle(.inset)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Native Engine Row

struct NativeEngineRow: View {
    let name: String
    let icon: String
    let isSupported: Bool
    let isActive: Bool
    let onSelect: () -> Void

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(isSupported ? .purple : .secondary)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .font(.headline)
                    .foregroundStyle(isSupported ? .primary : .secondary)

                Text(isSupported ? "Available on this device" : "Not supported on this device")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if isSupported {
                if isActive {
                    Text("Active")
                        .font(.caption2)
                        .fontWeight(.medium)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.2))
                        .foregroundStyle(.green)
                        .clipShape(Capsule())
                } else {
                    Text("Available")
                        .font(.caption2)
                        .fontWeight(.medium)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.2))
                        .foregroundStyle(.blue)
                        .clipShape(Capsule())
                }
            } else {
                Text("Unsupported")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.gray.opacity(0.2))
                    .foregroundStyle(.secondary)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .onTapGesture {
            if isSupported {
                onSelect()
            }
        }
    }
}

// MARK: - Model Row

struct ModelRow: View {
    let model: ModelDisplayInfo
    let isActiveEngine: Bool
    let onDownload: () -> Void
    let onDelete: () -> Void
    let onLoad: () -> Void
    let onSelect: () -> Void
    @State private var showDeleteConfirmation = false

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(model.name)
                        .font(.headline)

                    if isActiveEngine {
                        Text("Active")
                            .font(.caption2)
                            .fontWeight(.medium)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.2))
                            .foregroundStyle(.green)
                            .clipShape(Capsule())
                    } else if model.isLoaded {
                        Text("Loaded")
                            .font(.caption2)
                            .fontWeight(.medium)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.2))
                            .foregroundStyle(.orange)
                            .clipShape(Capsule())
                    } else if model.isRecommended {
                        Text("Recommended")
                            .font(.caption2)
                            .fontWeight(.medium)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.2))
                            .foregroundStyle(.blue)
                            .clipShape(Capsule())
                    }
                }

                HStack(spacing: 4) {
                    Text("\(model.sizeMB) MB")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if model.isDownloaded && !model.isLoaded {
                        Text("• Downloaded")
                            .font(.caption)
                            .foregroundStyle(.green)
                    }
                }
            }

            Spacer()

            if model.isDownloaded {
                HStack(spacing: 12) {
                    if isActiveEngine {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                            .font(.title2)
                    } else if model.isLoaded {
                        Button(action: onSelect) {
                            Text("Select")
                                .font(.caption)
                                .fontWeight(.medium)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.green)
                                .foregroundStyle(.white)
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    } else {
                        Button(action: onLoad) {
                            Text("Load")
                                .font(.caption)
                                .fontWeight(.medium)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.blue)
                                .foregroundStyle(.white)
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    }

                    Menu {
                        if model.isLoaded && !isActiveEngine {
                            Button {
                                onSelect()
                            } label: {
                                Label("Use This Model", systemImage: "checkmark.circle")
                            }
                        }

                        if !model.isLoaded {
                            Button {
                                onLoad()
                            } label: {
                                Label("Load Model", systemImage: "arrow.up.circle")
                            }
                        }

                        Button(role: .destructive) {
                            showDeleteConfirmation = true
                        } label: {
                            Label("Delete Model", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .foregroundStyle(.secondary)
                            .font(.title3)
                    }
                }
            } else {
                Button(action: onDownload) {
                    Image(systemName: "arrow.down.circle")
                        .foregroundStyle(.blue)
                        .font(.title2)
                }
            }
        }
        .padding(.vertical, 4)
        .confirmationDialog(
            "Delete \(model.name)?",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                onDelete()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will remove the model from your device. You can download it again later.")
        }
    }
}

// MARK: - Model Info Row

private struct ModelInfoRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.blue)
                .frame(width: 24)

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
    AIStatusBanner()
        .environmentObject(AppState())
        .padding()
}
