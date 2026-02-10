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
import com.locanara.example.components.pages.framework.AgentDemo
import com.locanara.example.components.pages.framework.ChainDemo
import com.locanara.example.components.pages.framework.GuardrailDemo
import com.locanara.example.components.pages.framework.MemoryDemo
import com.locanara.example.components.pages.framework.ModelDemo
import com.locanara.example.components.pages.framework.PipelineDemo
import com.locanara.example.components.pages.framework.SessionDemo

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
    // Framework demos
    const val FRAMEWORK_MODEL = "framework_model"
    const val FRAMEWORK_CHAIN = "framework_chain"
    const val FRAMEWORK_PIPELINE = "framework_pipeline"
    const val FRAMEWORK_MEMORY = "framework_memory"
    const val FRAMEWORK_GUARDRAIL = "framework_guardrail"
    const val FRAMEWORK_SESSION = "framework_session"
    const val FRAMEWORK_AGENT = "framework_agent"
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
                },
                onNavigateToFrameworkDemo = { route ->
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

        // Framework Demo Screens
        composable(Routes.FRAMEWORK_MODEL) {
            ModelDemo(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.FRAMEWORK_CHAIN) {
            ChainDemo(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.FRAMEWORK_PIPELINE) {
            PipelineDemo(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.FRAMEWORK_MEMORY) {
            MemoryDemo(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.FRAMEWORK_GUARDRAIL) {
            GuardrailDemo(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.FRAMEWORK_SESSION) {
            SessionDemo(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Routes.FRAMEWORK_AGENT) {
            AgentDemo(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
