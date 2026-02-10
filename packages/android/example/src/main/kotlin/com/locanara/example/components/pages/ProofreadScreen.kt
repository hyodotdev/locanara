package com.locanara.example.components.pages

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.locanara.ProofreadResult
import com.locanara.builtin.ProofreadChain
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.components.shared.SampleTexts
import kotlinx.coroutines.launch

/**
 * Proofread Feature Demo Screen.
 *
 * Demonstrates grammar and spelling correction using ProofreadChain.
 */
@Composable
fun ProofreadScreen(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf(SampleTexts.PROOFREAD_TEXT) }
    var result by remember { mutableStateOf<ProofreadResult?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    FeatureScreenTemplate(
        title = "Proofread",
        inputLabel = "Text to proofread",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter text to check for grammar and spelling errors...",
        isLoading = isLoading,
        errorMessage = errorMessage,
        onExecute = {
            isLoading = true
            errorMessage = null
            result = null
            scope.launch {
                try {
                    println("[ProofreadScreen] input: ${inputText.take(200)}")
                    val chain = ProofreadChain()
                    result = chain.run(inputText)
                    println("[ProofreadScreen] result: ${result?.correctedText?.take(200)}, corrections: ${result?.corrections?.size ?: 0}")
                } catch (e: Exception) {
                    println("[ProofreadScreen] error: ${e.message}")
                    errorMessage = e.message ?: "Unknown error"
                } finally {
                    isLoading = false
                }
            }
        },
        onNavigateBack = onNavigateBack,
        executeButtonText = "Proofread",
        resultContent = result?.let { proofreadResult -> {
            Column {
                Text(
                    text = "Corrected Text",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = proofreadResult.correctedText,
                    style = MaterialTheme.typography.bodyMedium
                )
                if (proofreadResult.hasCorrections && proofreadResult.corrections.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Corrections Made",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    proofreadResult.corrections.forEach { correction ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(vertical = 4.dp)
                        ) {
                            Text(
                                text = correction.original,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFF44336),
                                textDecoration = TextDecoration.LineThrough
                            )
                            Text(
                                text = "→",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = correction.corrected,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF4CAF50)
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            correction.type?.let { type ->
                                Text(
                                    text = type,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFF2196F3).copy(alpha = 0.2f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }}
    )
}
