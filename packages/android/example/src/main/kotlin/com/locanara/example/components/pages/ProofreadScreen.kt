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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.locanara.ProofreadInputType
import com.locanara.ProofreadResult
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.components.shared.SampleTexts
import com.locanara.example.viewmodel.LocanaraViewModel

/**
 * Proofread Feature Demo Screen.
 *
 * Demonstrates grammar and spelling correction:
 * - Input Type: KEYBOARD or VOICE
 * - Shows corrected text with error highlights
 */
@Composable
fun ProofreadScreen(
    onNavigateBack: () -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    var inputText by remember { mutableStateOf(SampleTexts.PROOFREAD_TEXT) }
    var selectedInputType by remember { mutableStateOf(ProofreadInputType.KEYBOARD) }

    val isExecuting by viewModel.isExecuting.collectAsState()
    val executionResult by viewModel.executionResult.collectAsState()

    FeatureScreenTemplate(
        title = "Proofread",
        inputLabel = "Text to proofread",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter text to check for grammar and spelling errors...",
        isExecuting = isExecuting,
        executionResult = executionResult,
        onExecute = {
            viewModel.proofread(
                text = inputText,
                inputType = selectedInputType
            )
        },
        onNavigateBack = onNavigateBack,
        executeButtonText = "Proofread",
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
                    selected = selectedInputType == ProofreadInputType.KEYBOARD,
                    onClick = { selectedInputType = ProofreadInputType.KEYBOARD },
                    label = { Text("Keyboard") }
                )
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(
                    selected = selectedInputType == ProofreadInputType.VOICE,
                    onClick = { selectedInputType = ProofreadInputType.VOICE },
                    label = { Text("Voice") }
                )
            }
        },
        resultContent = { result ->
            val proofreadResult = result.result as? ProofreadResult
            Column {
                Text(
                    text = "Corrected Text",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = proofreadResult?.correctedText ?: "No corrections available",
                    style = MaterialTheme.typography.bodyMedium
                )
                proofreadResult?.let { pr ->
                    if (pr.hasCorrections && pr.corrections.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "${pr.corrections.size} correction(s) made",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    )
}
