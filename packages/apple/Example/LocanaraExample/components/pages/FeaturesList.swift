import SwiftUI
import Locanara

/// Features list view - Tab 1
struct FeaturesList: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        NavigationStack {
            List {
                Section {
                    AIStatusBanner()
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                }

                Section("Available Features") {
                    ForEach(appState.availableFeatures) { feature in
                        NavigationLink {
                            FeatureDetail(feature: feature)
                        } label: {
                            FeatureRow(feature: feature)
                        }
                        .disabled(!feature.isAvailable)
                    }
                }
            }
            .navigationTitle("Features")
        }
    }
}

#Preview {
    FeaturesList()
        .environmentObject(AppState())
}
