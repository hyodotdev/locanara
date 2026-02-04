package com.locanara.example.components.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavHostController
import com.locanara.example.components.pages.DeviceInfoScreen
import com.locanara.example.components.pages.FeaturesListTab
import com.locanara.example.components.pages.SettingsScreen

/**
 * Tab items for the main navigation.
 */
enum class MainTab(
    val title: String,
    val icon: ImageVector
) {
    FEATURES("Features", Icons.Default.AutoAwesome),
    DEVICE("Device", Icons.Default.PhoneAndroid),
    SETTINGS("Settings", Icons.Default.Settings)
}

/**
 * Main tab navigation.
 *
 * Has 3 tabs:
 * - Features: List of AI features
 * - Device: Device and AI capability information
 * - Settings: Gemini Nano settings and setup
 */
@Composable
fun MainTabNavigation(
    navController: NavHostController,
    onNavigateToFeature: (String) -> Unit
) {
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    val tabs = MainTab.entries

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        icon = { Icon(tab.icon, contentDescription = tab.title) },
                        label = { Text(tab.title) },
                        selected = selectedTab == index,
                        onClick = { selectedTab = index }
                    )
                }
            }
        }
    ) { padding ->
        val bottomPadding = Modifier.padding(bottom = padding.calculateBottomPadding())
        when (tabs.getOrNull(selectedTab)) {
            MainTab.FEATURES -> {
                FeaturesListTab(
                    modifier = bottomPadding,
                    onNavigateToFeature = onNavigateToFeature
                )
            }
            MainTab.DEVICE -> {
                DeviceInfoScreen(
                    modifier = bottomPadding
                )
            }
            MainTab.SETTINGS -> {
                SettingsScreen(
                    modifier = bottomPadding
                )
            }
            null -> {
                FeaturesListTab(
                    modifier = bottomPadding,
                    onNavigateToFeature = onNavigateToFeature
                )
            }
        }
    }
}
