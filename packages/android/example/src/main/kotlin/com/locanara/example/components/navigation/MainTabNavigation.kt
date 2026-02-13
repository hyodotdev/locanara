package com.locanara.example.components.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
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
import com.locanara.example.components.pages.framework.FrameworkShowcase

/**
 * Tab items for the main navigation.
 */
enum class MainTab(
    val title: String,
    val icon: ImageVector
) {
    FEATURES("Features", Icons.Default.AutoAwesome),
    FRAMEWORK("Framework", Icons.Default.AccountTree),
    DEVICE("Device", Icons.Default.PhoneAndroid),
    SETTINGS("Settings", Icons.Default.Settings)
}

/**
 * Main tab navigation.
 *
 * Has 4 tabs:
 * - Features: List of AI features
 * - Framework: Framework API demos (Chain, Pipeline, Memory, etc.)
 * - Device: Device and AI capability information
 * - Settings: Gemini Nano settings and setup
 */
@Composable
fun MainTabNavigation(
    navController: NavHostController,
    onNavigateToFeature: (String) -> Unit,
    onNavigateToFrameworkDemo: (String) -> Unit = {}
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
        val contentModifier = Modifier.padding(padding)
        when (tabs.getOrNull(selectedTab)) {
            MainTab.FEATURES -> {
                FeaturesListTab(
                    modifier = contentModifier,
                    onNavigateToFeature = onNavigateToFeature
                )
            }
            MainTab.FRAMEWORK -> {
                FrameworkShowcase(
                    modifier = contentModifier,
                    onNavigateToDemo = onNavigateToFrameworkDemo
                )
            }
            MainTab.DEVICE -> {
                DeviceInfoScreen(
                    modifier = contentModifier
                )
            }
            MainTab.SETTINGS -> {
                SettingsScreen(
                    modifier = contentModifier
                )
            }
            null -> {
                FeaturesListTab(
                    modifier = contentModifier,
                    onNavigateToFeature = onNavigateToFeature
                )
            }
        }
    }
}
