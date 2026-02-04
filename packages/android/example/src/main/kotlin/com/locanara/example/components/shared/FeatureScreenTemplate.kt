package com.locanara.example.components.shared

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.locanara.ExecutionResult
import com.locanara.ExecutionState

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
    isExecuting: Boolean,
    executionResult: ExecutionResult?,
    onExecute: () -> Unit,
    onNavigateBack: () -> Unit,
    executeButtonText: String = "Execute",
    showMainInput: Boolean = true,
    executeEnabled: Boolean? = null,
    additionalInputs: @Composable (() -> Unit)? = null,
    resultContent: @Composable ((ExecutionResult) -> Unit)? = null
) {
    val clipboardManager = LocalClipboardManager.current

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
                    enabled = !isExecuting
                )
            }

            // Additional inputs (e.g., language selector, style picker)
            additionalInputs?.invoke()

            Spacer(modifier = Modifier.height(16.dp))

            // Execute Button
            Button(
                onClick = onExecute,
                modifier = Modifier.fillMaxWidth(),
                enabled = !isExecuting && isButtonEnabled
            ) {
                if (isExecuting) {
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

            // Result Section
            executionResult?.let { result ->
                ResultCard(
                    result = result,
                    onCopyResult = { text ->
                        clipboardManager.setText(AnnotatedString(text))
                    },
                    customContent = resultContent
                )
            }
        }
    }
}

@Composable
fun ResultCard(
    result: ExecutionResult,
    onCopyResult: (String) -> Unit,
    customContent: @Composable ((ExecutionResult) -> Unit)? = null
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = when (result.state) {
                ExecutionState.COMPLETED -> MaterialTheme.colorScheme.primaryContainer
                ExecutionState.FAILED -> MaterialTheme.colorScheme.errorContainer
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header with status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = when (result.state) {
                            ExecutionState.COMPLETED -> Icons.Default.CheckCircle
                            ExecutionState.FAILED -> Icons.Default.Error
                            else -> Icons.Default.Timer
                        },
                        contentDescription = null,
                        tint = when (result.state) {
                            ExecutionState.COMPLETED -> MaterialTheme.colorScheme.primary
                            ExecutionState.FAILED -> MaterialTheme.colorScheme.error
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = when (result.state) {
                            ExecutionState.COMPLETED -> "Completed"
                            ExecutionState.FAILED -> "Failed"
                            ExecutionState.PROCESSING -> "Processing"
                            else -> result.state.name
                        },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium
                    )
                }

                // Processing time
                result.processingTimeMs?.let { time ->
                    Text(
                        text = "${time}ms",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Show error first if present
            if (result.error != null) {
                Text(
                    text = "Error: ${result.error?.message}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error
                )
                result.error?.details?.let { details ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = details.take(500),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            } else if (customContent != null) {
                // Custom content for successful results
                customContent(result)
            } else {
                // Default: show processing location
                Text(
                    text = "Processed on: ${result.processedOn.name}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
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
