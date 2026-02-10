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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.locanara.composable.Chain
import com.locanara.composable.ConditionalChain
import com.locanara.composable.ModelChain
import com.locanara.composable.ParallelChain
import com.locanara.composable.SequentialChain
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import com.locanara.core.PromptTemplate
import com.locanara.builtin.ProofreadChain
import com.locanara.builtin.RewriteChain
import com.locanara.builtin.SummarizeChain
import com.locanara.builtin.TranslateChain
import com.locanara.RewriteOutputType
import kotlinx.coroutines.launch

/** Custom chain that analyzes sentiment. */
private class SentimentChain : Chain {
    override val name = "SentimentChain"
    override suspend fun invoke(input: ChainInput): ChainOutput {
        val template = PromptTemplate.from(
            "Analyze the sentiment of the following text. Reply with exactly one word: positive, negative, or neutral.\n\nText: {text}"
        )
        val chain = ModelChain(promptTemplate = template)
        return chain.invoke(input)
    }
}

private enum class ChainMode(val label: String) {
    MODEL_CHAIN("ModelChain"),
    SEQUENTIAL("Sequential"),
    PARALLEL("Parallel"),
    CONDITIONAL("Conditional"),
    CUSTOM("Custom")
}

/**
 * Demonstrates Chain variants: ModelChain, SequentialChain, ParallelChain, ConditionalChain, Custom.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChainDemo(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf("I absolutely love how easy it is to build AI features with Locanara. The framework makes everything so simple and intuitive!") }
    var selectedMode by remember { mutableStateOf(ChainMode.MODEL_CHAIN) }
    var resultText by remember { mutableStateOf<String?>(null) }
    var secondaryResult by remember { mutableStateOf<String?>(null) }
    var processingTime by remember { mutableStateOf<Long?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val codePatterns = mapOf(
        ChainMode.MODEL_CHAIN to """
// ModelChain — wraps a model with a PromptTemplate
val template = PromptTemplate.from(
    "Explain the following concept briefly:\n{text}"
)
val chain = ModelChain(
    model, promptTemplate = template,
    config = GenerationConfig.CONVERSATIONAL
)
val output = chain.invoke(ChainInput(text = input))
        """.trimIndent(),
        ChainMode.SEQUENTIAL to """
// SequentialChain — runs chains in order
val sequential = SequentialChain(listOf(
    ProofreadChain(model),
    TranslateChain(model, targetLanguage = "ko")
))
val output = sequential.invoke(ChainInput(text = input))
        """.trimIndent(),
        ChainMode.PARALLEL to """
// ParallelChain — runs chains concurrently
val parallel = ParallelChain(listOf(
    SentimentChain(model),
    SummarizeChain(model)
))
val output = parallel.invoke(ChainInput(text = input))
        """.trimIndent(),
        ChainMode.CONDITIONAL to """
// ConditionalChain — routes based on condition
val conditional = ConditionalChain(
    condition = { if (it.text.length > 200) "long" else "short" },
    branches = mapOf(
        "long" to SummarizeChain(model),
        "short" to RewriteChain(model, style = RewriteOutputType.ELABORATE)
    )
)
        """.trimIndent(),
        ChainMode.CUSTOM to """
// Custom Chain — implement the Chain interface
class SentimentChain(private val model: LocanaraModel) : Chain {
    override val name = "SentimentChain"
    override suspend fun invoke(input: ChainInput): ChainOutput {
        val template = PromptTemplate.from(
            "Analyze the sentiment: {text}\nReply: positive, negative, or neutral."
        )
        return ModelChain(model, promptTemplate = template).invoke(input)
    }
}
        """.trimIndent()
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chain") },
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
            CodePatternCard(code = codePatterns[selectedMode] ?: "")

            Column {
                Text("Chain Type", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ChainMode.entries.forEach { mode ->
                        FilterChip(
                            selected = selectedMode == mode,
                            onClick = {
                                selectedMode = mode
                                resultText = null
                                secondaryResult = null
                                processingTime = null
                            },
                            label = { Text(mode.label) }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                label = { Text("Input Text") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 4,
                enabled = !isLoading
            )

            if (selectedMode == ChainMode.CONDITIONAL) {
                Text(
                    "${inputText.length} chars — ${if (inputText.length > 200) "will summarize (>200)" else "will elaborate (≤200)"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Button(
                onClick = {
                    isLoading = true
                    errorMessage = null
                    resultText = null
                    secondaryResult = null
                    processingTime = null
                    scope.launch {
                        try {
                            println("[ChainDemo] input: ${inputText.take(200)}, mode: ${selectedMode.label}")
                            val startTime = System.currentTimeMillis()
                            val input = ChainInput(text = inputText)

                            when (selectedMode) {
                                ChainMode.MODEL_CHAIN -> {
                                    val template = PromptTemplate.from("Explain the following concept briefly:\n{text}")
                                    val chain = ModelChain(promptTemplate = template, config = com.locanara.core.GenerationConfig.CONVERSATIONAL)
                                    resultText = chain.invoke(input).text
                                }
                                ChainMode.SEQUENTIAL -> {
                                    val sequential = SequentialChain(chains = listOf(
                                        ProofreadChain(),
                                        TranslateChain(targetLanguage = "ko")
                                    ))
                                    resultText = sequential.invoke(input).text
                                }
                                ChainMode.PARALLEL -> {
                                    val parallel = ParallelChain(chains = listOf(
                                        SentimentChain(),
                                        SummarizeChain()
                                    ))
                                    val output = parallel.invoke(input)
                                    resultText = output.text
                                    secondaryResult = output.metadata["SummarizeChain"] ?: output.text
                                }
                                ChainMode.CONDITIONAL -> {
                                    val conditional = ConditionalChain(
                                        condition = { if (it.text.length > 200) "long" else "short" },
                                        branches = mapOf(
                                            "long" to SummarizeChain(),
                                            "short" to RewriteChain(style = RewriteOutputType.ELABORATE)
                                        )
                                    )
                                    resultText = conditional.invoke(input).text
                                }
                                ChainMode.CUSTOM -> {
                                    resultText = SentimentChain().invoke(input).text
                                }
                            }
                            processingTime = System.currentTimeMillis() - startTime
                            println("[ChainDemo] result: ${resultText?.take(200)}, time: ${processingTime}ms")
                        } catch (e: Exception) {
                            println("[ChainDemo] error: ${e.message}")
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
                Text(if (isLoading) "Running..." else "Run ${selectedMode.label}")
            }

            errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }

            resultText?.let { result ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("${selectedMode.label} Result", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(result, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            secondaryResult?.let { result ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("SummarizeChain (Parallel)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(result, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            processingTime?.let { time ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatBadge(label = "Chain", value = selectedMode.label)
                    StatBadge(label = "Time", value = "${time}ms")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
