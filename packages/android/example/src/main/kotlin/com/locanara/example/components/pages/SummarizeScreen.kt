package com.locanara.example.components.pages

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.locanara.SummarizeInputType
import com.locanara.SummarizeOutputType
import com.locanara.SummarizeResult
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.components.shared.SampleTexts
import com.locanara.example.viewmodel.LocanaraViewModel

/**
 * Summarize Feature Demo Screen.
 *
 * Demonstrates text summarization with ML Kit GenAI options:
 * - Input Type: ARTICLE or CONVERSATION
 * - Output Type: ONE_BULLET, TWO_BULLETS, THREE_BULLETS
 */
@Composable
fun SummarizeScreen(
    onNavigateBack: () -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    var inputText by remember { mutableStateOf(SampleTexts.APPLE_INTELLIGENCE.trim()) }
    var selectedInputType by remember { mutableStateOf(SummarizeInputType.ARTICLE) }
    var selectedOutputType by remember { mutableStateOf(SummarizeOutputType.ONE_BULLET) }

    val isExecuting by viewModel.isExecuting.collectAsState()
    val executionResult by viewModel.executionResult.collectAsState()

    FeatureScreenTemplate(
        title = "Summarize",
        inputLabel = "Text to summarize",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter or paste text to summarize...",
        isExecuting = isExecuting,
        executionResult = executionResult,
        onExecute = {
            viewModel.summarize(
                text = inputText,
                inputType = selectedInputType,
                outputType = selectedOutputType
            )
        },
        onNavigateBack = onNavigateBack,
        executeButtonText = "Summarize",
        additionalInputs = {
            Spacer(modifier = Modifier.height(16.dp))

            // Input Type Selection
            Text(
                text = "Input Type",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                FilterChip(
                    selected = selectedInputType == SummarizeInputType.ARTICLE,
                    onClick = { selectedInputType = SummarizeInputType.ARTICLE },
                    label = { Text("Article") }
                )
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(
                    selected = selectedInputType == SummarizeInputType.CONVERSATION,
                    onClick = { selectedInputType = SummarizeInputType.CONVERSATION },
                    label = { Text("Conversation") }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Output Type Selection
            Text(
                text = "Output Type",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                FilterChip(
                    selected = selectedOutputType == SummarizeOutputType.ONE_BULLET,
                    onClick = { selectedOutputType = SummarizeOutputType.ONE_BULLET },
                    label = { Text("1 Bullet") }
                )
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(
                    selected = selectedOutputType == SummarizeOutputType.TWO_BULLETS,
                    onClick = { selectedOutputType = SummarizeOutputType.TWO_BULLETS },
                    label = { Text("2 Bullets") }
                )
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(
                    selected = selectedOutputType == SummarizeOutputType.THREE_BULLETS,
                    onClick = { selectedOutputType = SummarizeOutputType.THREE_BULLETS },
                    label = { Text("3 Bullets") }
                )
            }
        },
        resultContent = { result ->
            val summarizeResult = result.result as? SummarizeResult
            Column {
                Text(
                    text = "Summary",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = summarizeResult?.summary ?: "No summary available",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Original: ${summarizeResult?.originalLength ?: 0} chars → Summary: ${summarizeResult?.summaryLength ?: 0} chars",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    )
}
