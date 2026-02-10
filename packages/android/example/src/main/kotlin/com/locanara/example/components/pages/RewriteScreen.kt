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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.locanara.RewriteOutputType
import com.locanara.RewriteResult
import com.locanara.builtin.RewriteChain
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.components.shared.SampleTexts
import kotlinx.coroutines.launch

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
 * Demonstrates text rewriting with different styles using RewriteChain.
 */
@Composable
fun RewriteScreen(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf(SampleTexts.REWRITE_TEXT) }
    var selectedStyle by remember { mutableStateOf(RewriteOutputType.PROFESSIONAL) }
    var result by remember { mutableStateOf<RewriteResult?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    FeatureScreenTemplate(
        title = "Rewrite",
        inputLabel = "Text to rewrite",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter text to rewrite in a different style...",
        isLoading = isLoading,
        errorMessage = errorMessage,
        onExecute = {
            isLoading = true
            errorMessage = null
            result = null
            scope.launch {
                try {
                    println("[RewriteScreen] input: ${inputText.take(200)}, style: $selectedStyle")
                    val chain = RewriteChain(
                        style = selectedStyle
                    )
                    result = chain.run(inputText)
                    println("[RewriteScreen] result: ${result?.rewrittenText?.take(200)}")
                } catch (e: Exception) {
                    println("[RewriteScreen] error: ${e.message}")
                    errorMessage = e.message ?: "Unknown error"
                } finally {
                    isLoading = false
                }
            }
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
                        selected = selectedStyle == outputType,
                        onClick = { selectedStyle = outputType },
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
                        selected = selectedStyle == outputType,
                        onClick = { selectedStyle = outputType },
                        label = { Text(label) }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
            }
        },
        resultContent = result?.let { rewriteResult -> {
            Column {
                Text(
                    text = "Rewritten Text",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = rewriteResult.rewrittenText,
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Style: ${rewriteOutputTypes.find { it.first == selectedStyle }?.second ?: selectedStyle.name}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }}
    )
}
