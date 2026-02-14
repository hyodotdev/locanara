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

            FrameworkShowcase()
                .tabItem {
                    Label("Framework", systemImage: "cube.transparent")
                }
                .tag(1)

            DeviceInfo()
                .tabItem {
                    Label("Device", systemImage: "iphone")
                }
                .tag(2)

            Settings()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(3)
        }
    }
}

#Preview {
    MainTabNavigation()
        .environmentObject(AppState())
}
