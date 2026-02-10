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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Translate
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
import com.locanara.TranslateResult
import com.locanara.dsl.proofread
import com.locanara.dsl.summarize
import com.locanara.dsl.translate
import com.locanara.platform.PromptApiModel
import kotlinx.coroutines.launch

/**
 * Demonstrates the Pipeline DSL — composing multiple AI steps with type safety.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PipelineDemo(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf("Ths is a tset of on-devce AI. It can proofread and then translte your text in one pipline.") }
    var selectedLanguage by remember { mutableStateOf("ko") }
    var proofreadResult by remember { mutableStateOf<String?>(null) }
    var translateResult by remember { mutableStateOf<TranslateResult?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    val languages = listOf("ko" to "Korean", "ja" to "Japanese", "es" to "Spanish", "fr" to "French")

    val codePattern = """
val model = PromptApiModel(context)

// Step 1: Proofread
val proofread = model.proofread(text)

// Step 2: Translate the corrected text
val translated = model.translate(
    proofread.correctedText, to = "$selectedLanguage"
)
    """.trimIndent()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Pipeline DSL") },
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
                label = { Text("Input Text (with intentional typos)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 4,
                enabled = !isLoading
            )

            Column {
                Text("Target Language", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    languages.forEach { (code, name) ->
                        FilterChip(
                            selected = selectedLanguage == code,
                            onClick = { selectedLanguage = code },
                            label = { Text(name) }
                        )
                    }
                }
            }

            Button(
                onClick = {
                    isLoading = true
                    errorMessage = null
                    proofreadResult = null
                    translateResult = null
                    scope.launch {
                        try {
                            println("[PipelineDemo] input: ${inputText.take(200)}, targetLang: $selectedLanguage")
                            val model = PromptApiModel(context)
                            // Step 1: Proofread
                            val proofread = model.proofread(inputText)
                            proofreadResult = proofread.correctedText
                            println("[PipelineDemo] step1 proofread: ${proofread.correctedText.take(200)}")
                            // Step 2: Translate
                            val translated = model.translate(proofread.correctedText, to = selectedLanguage)
                            translateResult = translated
                            println("[PipelineDemo] step2 translate: ${translated.translatedText.take(200)}")
                        } catch (e: Exception) {
                            println("[PipelineDemo] error: ${e.message}")
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
                Text(if (isLoading) "Running Pipeline..." else "Run Pipeline")
            }

            errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }

            proofreadResult?.let { result ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text("  Step 1: Proofread", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(result, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            translateResult?.let { result ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Translate, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text("  Step 2: Translate", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(result.translatedText, style = MaterialTheme.typography.bodyMedium)
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatBadge(label = "From", value = result.sourceLanguage ?: "auto")
                    StatBadge(label = "To", value = result.targetLanguage)
                    result.confidence?.let { StatBadge(label = "Confidence", value = "${(it * 100).toInt()}%") }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
