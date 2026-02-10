package com.locanara.example.components.pages.framework

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.QuestionAnswer
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * Framework demo items matching the documentation API pages.
 */
enum class FrameworkDemo(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val route: String
) {
    MODEL(
        "Model",
        "Direct model usage with GenerationConfig presets and streaming",
        Icons.Default.Memory,
        "framework_model"
    ),
    CHAIN(
        "Chain",
        "ModelChain, SequentialChain, ParallelChain, ConditionalChain, and custom chains",
        Icons.Default.Link,
        "framework_chain"
    ),
    PIPELINE(
        "Pipeline DSL",
        "Compose multiple AI steps into a single pipeline with type safety",
        Icons.Default.SwapHoriz,
        "framework_pipeline"
    ),
    MEMORY(
        "Memory",
        "BufferMemory and SummaryMemory — conversation history management",
        Icons.Default.Psychology,
        "framework_memory"
    ),
    GUARDRAIL(
        "Guardrail",
        "Wrap chains with input length and content safety guardrails",
        Icons.Default.Security,
        "framework_guardrail"
    ),
    SESSION(
        "Session",
        "Stateful chat with BufferMemory — see memory entries in real-time",
        Icons.Default.QuestionAnswer,
        "framework_session"
    ),
    AGENT(
        "Agent + Tools",
        "ReAct-lite agent with tools and step-by-step reasoning trace",
        Icons.Default.Person,
        "framework_agent"
    )
}

/**
 * Framework Showcase — lists all 7 framework demos.
 */
@Composable
fun FrameworkShowcase(
    modifier: Modifier = Modifier,
    onNavigateToDemo: (String) -> Unit
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Framework Demos",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Build custom AI features using the framework primitives — Model, Chain, Pipeline, Memory, Guardrail, Session, and Agent.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        items(FrameworkDemo.entries.toList()) { demo ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .clickable { onNavigateToDemo(demo.route) },
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = demo.icon,
                        contentDescription = demo.title,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = demo.title,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = demo.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = "Navigate",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        item { Spacer(modifier = Modifier.height(16.dp)) }
    }
}
