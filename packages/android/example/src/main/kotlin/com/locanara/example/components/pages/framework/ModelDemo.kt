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
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.locanara.core.GenerationConfig
import com.locanara.core.ModelResponse
import com.locanara.platform.PromptApiModel
import kotlinx.coroutines.launch

private enum class ConfigPreset(val label: String, val description: String) {
    STRUCTURED("Structured", "temp 0.2, topK 16 — precise"),
    CREATIVE("Creative", "temp 0.8, topK 40 — varied"),
    CONVERSATIONAL("Conversational", "temp 0.7, topK 40 — natural")
}

/**
 * Demonstrates LocanaraModel — direct model usage with GenerationConfig presets and streaming.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ModelDemo(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf("Explain what on-device AI means in one sentence.") }
    var selectedPreset by remember { mutableStateOf(ConfigPreset.CONVERSATIONAL) }
    var useStreaming by remember { mutableStateOf(false) }
    var resultText by remember { mutableStateOf<String?>(null) }
    var streamedText by remember { mutableStateOf("") }
    var processingTime by remember { mutableStateOf<Int?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    val codePattern = """
val model = PromptApiModel(context)

// Direct generation with config presets
val response = model.generate(
    prompt = "Your prompt here",
    config = GenerationConfig.${selectedPreset.name}
)
println(response.text)
println(response.processingTimeMs)

// Streaming
model.stream(prompt = "...").collect { chunk ->
    print(chunk)
}
    """.trimIndent()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Model") },
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
                label = { Text("Prompt") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                enabled = !isLoading
            )

            Column {
                Text("GenerationConfig Preset", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                Spacer(modifier = Modifier.height(4.dp))
                Text(selectedPreset.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ConfigPreset.entries.forEach { preset ->
                        FilterChip(
                            selected = selectedPreset == preset,
                            onClick = { selectedPreset = preset },
                            label = { Text(preset.label) }
                        )
                    }
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Use Streaming", style = MaterialTheme.typography.titleSmall)
                Switch(checked = useStreaming, onCheckedChange = { useStreaming = it })
            }

            Button(
                onClick = {
                    isLoading = true
                    errorMessage = null
                    resultText = null
                    streamedText = ""
                    processingTime = null
                    scope.launch {
                        try {
                            println("[ModelDemo] input: ${inputText.take(200)}, config: ${selectedPreset.label}, streaming: $useStreaming")
                            val model = PromptApiModel(context)
                            val config = when (selectedPreset) {
                                ConfigPreset.STRUCTURED -> GenerationConfig.STRUCTURED
                                ConfigPreset.CREATIVE -> GenerationConfig.CREATIVE
                                ConfigPreset.CONVERSATIONAL -> GenerationConfig.CONVERSATIONAL
                            }

                            if (useStreaming) {
                                val startTime = System.currentTimeMillis()
                                var accumulated = ""
                                model.stream(prompt = inputText, config = config).collect { chunk ->
                                    accumulated += chunk
                                    streamedText = accumulated
                                }
                                processingTime = (System.currentTimeMillis() - startTime).toInt()
                                resultText = accumulated
                            } else {
                                val response = model.generate(prompt = inputText, config = config)
                                resultText = response.text
                                processingTime = response.processingTimeMs
                            }
                            println("[ModelDemo] result: ${resultText?.take(200)}, time: ${processingTime}ms")
                        } catch (e: Exception) {
                            println("[ModelDemo] error: ${e.message}")
                            errorMessage = e.message ?: "Unknown error"
                        } finally {
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading && inputText.isNotBlank()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp), strokeWidth = 2.dp)
                }
                Text(if (isLoading) "Generating..." else "Generate")
            }

            errorMessage?.let { error ->
                Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }

            if (useStreaming && streamedText.isNotEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Streamed Output", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(streamedText, style = MaterialTheme.typography.bodyMedium)
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
                            Icon(Icons.Default.Memory, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text("  Model Response", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(result, style = MaterialTheme.typography.bodyMedium)
                    }
                }

                processingTime?.let { time ->
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatBadge(label = "Time", value = "${time}ms")
                        StatBadge(label = "Config", value = selectedPreset.label)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
