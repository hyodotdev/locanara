import SwiftUI
import Locanara

/// Main tab navigation
struct MainTabNavigation: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            FeaturesList()
                .tabItem {
                    Label("Features", systemImage: "sparkles")
                }
                .tag(0)

            DeviceInfo()
                .tabItem {
                    Label("Device", systemImage: "iphone")
                }
                .tag(1)

            Settings()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(2)
        }
    }
}

#Preview {
    MainTabNavigation()
        .environmentObject(AppState())
}
