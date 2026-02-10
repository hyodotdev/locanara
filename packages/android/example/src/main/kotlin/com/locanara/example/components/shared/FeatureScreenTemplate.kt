package com.locanara.example.components.shared

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Template composable for feature demo screens.
 *
 * Provides consistent UI for all feature screens with:
 * - Input text field
 * - Execute button
 * - Loading state
 * - Result display
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeatureScreenTemplate(
    title: String,
    inputLabel: String,
    inputValue: String,
    onInputChange: (String) -> Unit,
    inputPlaceholder: String = "",
    isLoading: Boolean,
    errorMessage: String?,
    onExecute: () -> Unit,
    onNavigateBack: () -> Unit,
    executeButtonText: String = "Execute",
    showMainInput: Boolean = true,
    executeEnabled: Boolean? = null,
    additionalInputs: @Composable (() -> Unit)? = null,
    resultContent: @Composable (() -> Unit)? = null
) {
    // Use custom executeEnabled if provided, otherwise default to inputValue check
    val isButtonEnabled = executeEnabled ?: inputValue.isNotBlank()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Input Section (optional)
            if (showMainInput) {
                OutlinedTextField(
                    value = inputValue,
                    onValueChange = onInputChange,
                    label = { Text(inputLabel) },
                    placeholder = { Text(inputPlaceholder) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 4,
                    maxLines = 8,
                    enabled = !isLoading
                )
            }

            // Additional inputs (e.g., language selector, style picker)
            additionalInputs?.invoke()

            Spacer(modifier = Modifier.height(16.dp))

            // Execute Button
            Button(
                onClick = onExecute,
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading && isButtonEnabled
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Processing...")
                } else {
                    Text(executeButtonText)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Error display
            errorMessage?.let { error ->
                Text(
                    text = error,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Result content
            resultContent?.invoke()
        }
    }
}

/**
 * Sample text for demos - aligned with Apple example.
 */
object SampleTexts {
    const val APPLE_INTELLIGENCE = """
Apple Intelligence is the personal intelligence system that puts powerful generative models right at the core of iPhone, iPad, and Mac. It powers incredible new features that help you write, express yourself, and get things done effortlessly. The best part? It's deeply integrated into iOS 26, iPadOS 18, and macOS Sequoia, harnessing the power of Apple silicon to understand and create language and images, take action across apps, and draw from your personal context to simplify and accelerate everyday tasks. All while protecting your privacy.
"""

    const val CLASSIFY_TEXT = "The new iPhone features an incredible camera system with advanced computational photography."

    const val EXTRACT_TEXT = "Contact John Smith at john@example.com or call 555-123-4567. Meeting scheduled for January 15, 2025 at Apple Park, Cupertino."

    const val REWRITE_TEXT = "i think this product is really good and everyone should buy it"

    const val PROOFREAD_TEXT = "I recieve your message and will definately respond untill tommorow. Thier was a wierd occurence."

    const val TRANSLATE_TEXT = "Hello, how are you today?"
}
