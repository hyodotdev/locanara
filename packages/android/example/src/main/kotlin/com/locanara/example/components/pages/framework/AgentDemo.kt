package com.locanara.example.components.pages.framework

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material3.AssistChip
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.locanara.builtin.SummarizeChain
import com.locanara.composable.FunctionTool
import com.locanara.composable.LocalSearchTool
import com.locanara.runtime.Agent
import com.locanara.runtime.AgentConfig
import com.locanara.runtime.AgentResult
import kotlinx.coroutines.launch
import java.text.DateFormat
import java.util.Date

/**
 * Demonstrates Agent with Tools — ReAct-lite pattern with reasoning trace.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentDemo(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf("") }
    var agentResult by remember { mutableStateOf<AgentResult?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val sampleDocuments = remember {
        listOf(
            "On-device AI processes data locally without sending it to the cloud. This ensures complete user privacy and enables offline functionality. Models like Apple Intelligence and Gemini Nano run directly on the device's neural engine.",
            "Mobile app development frameworks help developers build applications for iOS and Android from a shared codebase. Cross-platform tools reduce development time by providing unified APIs that abstract platform differences.",
            "Privacy regulations like GDPR and CCPA require apps to minimize data collection and provide users with control over their personal information. On-device processing is one strategy to comply with these regulations.",
            "Neural Processing Units (NPUs) are specialized hardware accelerators designed for AI workloads. Apple's Neural Engine and Qualcomm's Hexagon NPU enable efficient on-device inference with low power consumption."
        )
    }

    val suggestedQueries = remember {
        listOf(
            "What do the documents say about privacy?",
            "Find information about NPUs and summarize it",
            "What is today's date?"
        )
    }

    val codePattern = """
val searchTool = LocalSearchTool(documents = listOf(...))
val dateTool = FunctionTool(
    id = "current_date",
    description = "Get current date and time",
    parameterDescription = "No parameters needed"
) { _ ->
    DateFormat.getDateTimeInstance().format(Date())
}

val agent = Agent(
    model = model,
    config = AgentConfig(
        maxSteps = 3,
        tools = listOf(searchTool, dateTool),
        chains = listOf(SummarizeChain(model))
    )
)
val result = agent.run("Find info about privacy")
// result.steps — see the reasoning trace
    """.trimIndent()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Agent + Tools") },
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

            // Local Documents
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Local Documents (${sampleDocuments.size})", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                    sampleDocuments.forEachIndexed { i, doc ->
                        Text(
                            "Doc ${i + 1}: $doc",
                            style = MaterialTheme.typography.bodySmall,
                            maxLines = 3,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(6.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .padding(8.dp)
                        )
                    }
                }
            }

            // Query input
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                label = { Text("Ask the agent...") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                enabled = !isLoading
            )

            // Suggested queries
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                suggestedQueries.forEach { query ->
                    AssistChip(
                        onClick = { inputText = query },
                        label = { Text(query, style = MaterialTheme.typography.labelSmall) }
                    )
                }
            }

            Button(
                onClick = {
                    isLoading = true
                    errorMessage = null
                    agentResult = null
                    scope.launch {
                        try {
                            println("[AgentDemo] input: $inputText")
                            val searchTool = LocalSearchTool(documents = sampleDocuments)
                            val dateTool = FunctionTool(
                                id = "current_date",
                                description = "Get the current date and time",
                                parameterDescription = "No parameters needed"
                            ) { _ ->
                                DateFormat.getDateTimeInstance(DateFormat.FULL, DateFormat.SHORT).format(Date())
                            }
                            val agent = Agent(
                                config = AgentConfig(
                                    maxSteps = 3,
                                    tools = listOf(searchTool, dateTool),
                                    chains = listOf(SummarizeChain())
                                )
                            )
                            agentResult = agent.run(inputText)
                            println("[AgentDemo] result: ${agentResult?.answer?.take(200)}, steps: ${agentResult?.totalSteps}")
                        } catch (e: Exception) {
                            println("[AgentDemo] error: ${e.message}")
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
                Text(if (isLoading) "Agent thinking..." else "Run Agent")
            }

            errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }

            agentResult?.let { result ->
                // Reasoning trace
                if (result.steps.isNotEmpty()) {
                    Text("Reasoning Trace", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    result.steps.forEachIndexed { i, step ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFFFF9800))
                                        .padding(horizontal = 10.dp, vertical = 2.dp)
                                ) {
                                    Text("Step ${i + 1}", style = MaterialTheme.typography.labelSmall, color = Color.White, fontWeight = FontWeight.Bold)
                                }

                                if (step.thought.isNotEmpty()) {
                                    Row(verticalAlignment = Alignment.Top) {
                                        Icon(Icons.Default.Psychology, contentDescription = null, tint = Color(0xFF9C27B0), modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(step.thought, style = MaterialTheme.typography.bodySmall)
                                    }
                                }

                                if (step.action.isNotEmpty()) {
                                    Row(verticalAlignment = Alignment.Top) {
                                        Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color(0xFF2196F3), modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("${step.action}(${step.input})", style = MaterialTheme.typography.bodySmall, fontFamily = FontFamily.Monospace)
                                    }
                                }

                                step.observation?.takeIf { it.isNotEmpty() }?.let { obs ->
                                    Row(verticalAlignment = Alignment.Top) {
                                        Icon(Icons.Default.RemoveRedEye, contentDescription = null, tint = Color(0xFF4CAF50), modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(obs, style = MaterialTheme.typography.bodySmall, maxLines = 3)
                                    }
                                }
                            }
                        }
                    }
                }

                // Final answer
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF4CAF50))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Final Answer", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(result.answer, style = MaterialTheme.typography.bodyMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        StatBadge(label = "Steps", value = "${result.totalSteps}")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
