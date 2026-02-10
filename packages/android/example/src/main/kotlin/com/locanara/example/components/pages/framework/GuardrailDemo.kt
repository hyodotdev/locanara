package com.locanara.example.components.pages.framework

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Security
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
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.locanara.composable.ContentFilterGuardrail
import com.locanara.composable.GuardedChain
import com.locanara.composable.InputLengthGuardrail
import com.locanara.builtin.SummarizeChain
import com.locanara.core.ChainInput
import kotlinx.coroutines.launch

/**
 * Demonstrates Guardrails — wrapping chains with input validation and content safety.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GuardrailDemo(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf("Apple Intelligence is a personal intelligence system that puts powerful generative models at the core of iPhone, iPad, and Mac.") }
    var maxCharacters by remember { mutableFloatStateOf(500f) }
    var blockedPatternsText by remember { mutableStateOf("password, SSN, credit card") }
    var resultText by remember { mutableStateOf<String?>(null) }
    var blockedReason by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val blockedPatterns = blockedPatternsText
        .split(",")
        .map { it.trim() }
        .filter { it.isNotEmpty() }

    val codePattern = """
val guardrails = listOf(
    InputLengthGuardrail(
        maxCharacters = ${maxCharacters.toInt()}, truncate = false
    ),
    ContentFilterGuardrail(
        blockedPatterns = listOf(${blockedPatterns.joinToString { "\"$it\"" }})
    )
)
val guarded = GuardedChain(
    chain = SummarizeChain(model),
    guardrails = guardrails
)
val result = guarded.invoke(ChainInput(text = input))
    """.trimIndent()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Guardrail") },
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
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CodePatternCard(code = codePattern)

            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                label = { Text("Input Text") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 4,
                enabled = !isLoading
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "${inputText.length} characters",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (inputText.length > maxCharacters.toInt()) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text("Max: ${maxCharacters.toInt()}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            Column {
                Text("Max Characters: ${maxCharacters.toInt()}", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                Slider(
                    value = maxCharacters,
                    onValueChange = { maxCharacters = it },
                    valueRange = 50f..2000f,
                    steps = 38
                )
            }

            OutlinedTextField(
                value = blockedPatternsText,
                onValueChange = { blockedPatternsText = it },
                label = { Text("Blocked Patterns (comma-separated)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Button(
                onClick = {
                    isLoading = true
                    errorMessage = null
                    resultText = null
                    blockedReason = null
                    scope.launch {
                        try {
                            println("[GuardrailDemo] input: ${inputText.take(200)}, maxChars: ${maxCharacters.toInt()}, blocked: $blockedPatterns")
                            val guardrails = listOf(
                                InputLengthGuardrail(maxCharacters = maxCharacters.toInt(), truncate = false),
                                ContentFilterGuardrail(blockedPatterns = blockedPatterns)
                            )
                            val guarded = GuardedChain(
                                name = "GuardedSummarize",
                                chain = SummarizeChain(),
                                guardrails = guardrails
                            )
                            val output = guarded.invoke(ChainInput(text = inputText))
                            resultText = output.text
                            println("[GuardrailDemo] result: ${resultText?.take(200)}")
                        } catch (e: IllegalArgumentException) {
                            println("[GuardrailDemo] blocked: ${e.message}")
                            blockedReason = e.message
                        } catch (e: Exception) {
                            println("[GuardrailDemo] error: ${e.message}")
                            errorMessage = e.message ?: "Unknown error"
                        } finally {
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading && inputText.isNotBlank()
            ) {
                if (isLoading) CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp), strokeWidth = 2.dp)
                Text(if (isLoading) "Processing..." else "Summarize with Guardrails")
            }

            errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }

            blockedReason?.let { reason ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Block, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                            Text("  Blocked by Guardrail", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.error)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(reason, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            resultText?.let { result ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Security, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text("  Guardrails Passed — Summary", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(result, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
