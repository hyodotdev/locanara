package com.locanara.example.components.pages

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.locanara.SummarizeResult
import com.locanara.builtin.SummarizeChain
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.components.shared.SampleTexts
import kotlinx.coroutines.launch

/**
 * Summarize Feature Demo Screen.
 *
 * Demonstrates text summarization using SummarizeChain with configurable bullet count.
 */
@Composable
fun SummarizeScreen(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf(SampleTexts.APPLE_INTELLIGENCE.trim()) }
    var bulletCount by remember { mutableIntStateOf(1) }
    var inputType by remember { mutableStateOf("text") }
    var result by remember { mutableStateOf<SummarizeResult?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    FeatureScreenTemplate(
        title = "Summarize",
        inputLabel = "Text to summarize",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter or paste text to summarize...",
        isLoading = isLoading,
        errorMessage = errorMessage,
        onExecute = {
            isLoading = true
            errorMessage = null
            result = null
            scope.launch {
                try {
                    println("[SummarizeScreen] input: ${inputText.take(200)}, bulletCount: $bulletCount, inputType: $inputType")
                    val chain = SummarizeChain(bulletCount = bulletCount, inputType = inputType)
                    result = chain.run(inputText)
                    println("[SummarizeScreen] result: ${result?.summary?.take(200)}")
                } catch (e: Exception) {
                    println("[SummarizeScreen] error: ${e.message}")
                    errorMessage = e.message ?: "Unknown error"
                } finally {
                    isLoading = false
                }
            }
        },
        onNavigateBack = onNavigateBack,
        executeButtonText = "Summarize",
        additionalInputs = {
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Input Type",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                FilterChip(
                    selected = inputType == "text",
                    onClick = { inputType = "text" },
                    label = { Text("Article") }
                )
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(
                    selected = inputType == "conversation",
                    onClick = { inputType = "conversation" },
                    label = { Text("Conversation") }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Bullet Count",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                FilterChip(
                    selected = bulletCount == 1,
                    onClick = { bulletCount = 1 },
                    label = { Text("1 Bullet") }
                )
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(
                    selected = bulletCount == 2,
                    onClick = { bulletCount = 2 },
                    label = { Text("2 Bullets") }
                )
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(
                    selected = bulletCount == 3,
                    onClick = { bulletCount = 3 },
                    label = { Text("3 Bullets") }
                )
            }
        },
        resultContent = result?.let { summarizeResult -> {
            Column {
                Text(
                    text = "Summary",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = summarizeResult.summary,
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Original: ${summarizeResult.originalLength} chars → Summary: ${summarizeResult.summaryLength} chars",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }}
    )
}
