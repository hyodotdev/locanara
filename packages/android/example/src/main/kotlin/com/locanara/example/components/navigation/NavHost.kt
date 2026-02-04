package com.locanara.example.components.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.locanara.example.components.pages.SummarizeScreen
import com.locanara.example.components.pages.ClassifyScreen
import com.locanara.example.components.pages.ExtractScreen
import com.locanara.example.components.pages.ChatScreen
import com.locanara.example.components.pages.TranslateScreen
import com.locanara.example.components.pages.RewriteScreen
import com.locanara.example.components.pages.ProofreadScreen
import com.locanara.example.components.pages.DescribeImageScreen

/**
 * Navigation routes for the example app.
 */
object Routes {
    const val MAIN_TABS = "main_tabs"
    const val SUMMARIZE = "summarize"
    const val CLASSIFY = "classify"
    const val EXTRACT = "extract"
    const val CHAT = "chat"
    const val TRANSLATE = "translate"
    const val REWRITE = "rewrite"
    const val PROOFREAD = "proofread"
    const val DESCRIBE_IMAGE = "describe_image"
}

/**
 * Main navigation host for the app.
 *
 * Starts with tab navigation (Features, Device, Settings),
 * with feature detail pages accessible from the Features tab.
 *
 * This matches the Mac/iOS navigation structure.
 */
@Composable
fun LocanaraNavHost(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Routes.MAIN_TABS
    ) {
        // Main Tab Navigation
        composable(Routes.MAIN_TABS) {
            MainTabNavigation(
                navController = navController,
                onNavigateToFeature = { route ->
                    navController.navigate(route)
                }
            )
        }

        // Feature Detail Screens
        composable(Routes.SUMMARIZE) {
            SummarizeScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.CLASSIFY) {
            ClassifyScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.EXTRACT) {
            ExtractScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.CHAT) {
            ChatScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.TRANSLATE) {
            TranslateScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.REWRITE) {
            RewriteScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.PROOFREAD) {
            ProofreadScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.DESCRIBE_IMAGE) {
            DescribeImageScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
