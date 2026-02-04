package com.locanara.example.components.pages

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.locanara.RewriteOutputType
import com.locanara.RewriteResult
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.components.shared.SampleTexts
import com.locanara.example.viewmodel.LocanaraViewModel

private val rewriteOutputTypes = listOf(
    RewriteOutputType.ELABORATE to "Elaborate",
    RewriteOutputType.EMOJIFY to "Emojify",
    RewriteOutputType.SHORTEN to "Shorten",
    RewriteOutputType.FRIENDLY to "Friendly",
    RewriteOutputType.PROFESSIONAL to "Professional",
    RewriteOutputType.REPHRASE to "Rephrase"
)

/**
 * Rewrite Feature Demo Screen.
 *
 * Demonstrates text rewriting with ML Kit GenAI styles:
 * - ELABORATE: Make text more detailed
 * - EMOJIFY: Add emojis to text
 * - SHORTEN: Make text more concise
 * - FRIENDLY: Make text more casual and friendly
 * - PROFESSIONAL: Make text more formal and professional
 * - REPHRASE: Reword the text differently
 */
@Composable
fun RewriteScreen(
    onNavigateBack: () -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    var inputText by remember { mutableStateOf(SampleTexts.REWRITE_TEXT) }
    var selectedOutputType by remember { mutableStateOf(RewriteOutputType.PROFESSIONAL) }

    val isExecuting by viewModel.isExecuting.collectAsState()
    val executionResult by viewModel.executionResult.collectAsState()

    FeatureScreenTemplate(
        title = "Rewrite",
        inputLabel = "Text to rewrite",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter text to rewrite in a different style...",
        isExecuting = isExecuting,
        executionResult = executionResult,
        onExecute = {
            viewModel.rewrite(
                text = inputText,
                outputType = selectedOutputType
            )
        },
        onNavigateBack = onNavigateBack,
        executeButtonText = "Rewrite",
        additionalInputs = {
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Rewrite Style",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            // First row of styles
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
            ) {
                rewriteOutputTypes.take(3).forEach { (outputType, label) ->
                    FilterChip(
                        selected = selectedOutputType == outputType,
                        onClick = { selectedOutputType = outputType },
                        label = { Text(label) }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Second row of styles
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
            ) {
                rewriteOutputTypes.drop(3).forEach { (outputType, label) ->
                    FilterChip(
                        selected = selectedOutputType == outputType,
                        onClick = { selectedOutputType = outputType },
                        label = { Text(label) }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
            }
        },
        resultContent = { result ->
            val rewriteResult = result.result as? RewriteResult
            Column {
                Text(
                    text = "Rewritten Text",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = rewriteResult?.rewrittenText ?: "No rewritten text available",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Style: ${rewriteOutputTypes.find { it.first == selectedOutputType }?.second ?: selectedOutputType.name}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    )
}
