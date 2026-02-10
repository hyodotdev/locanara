package com.locanara.example.components.pages.framework

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.locanara.composable.BufferMemory
import com.locanara.composable.Memory
import com.locanara.composable.MemoryEntry
import com.locanara.composable.SummaryMemory
import com.locanara.core.ChainInput
import com.locanara.core.ChainOutput
import kotlinx.coroutines.launch

private enum class MemoryType(val label: String) {
    BUFFER("BufferMemory"),
    SUMMARY("SummaryMemory")
}

/**
 * Demonstrates Memory — standalone BufferMemory and SummaryMemory without Session.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemoryDemo(onNavigateBack: () -> Unit) {
    var selectedType by remember { mutableStateOf(MemoryType.BUFFER) }
    var userInput by remember { mutableStateOf("") }
    var assistantInput by remember { mutableStateOf("") }
    val entries = remember { mutableStateListOf<MemoryEntry>() }
    var tokenCount by remember { mutableIntStateOf(0) }
    var infoMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val bufferMemory = remember { BufferMemory(maxEntries = 4, maxTokens = 500) }
    val summaryMemory = remember { SummaryMemory(recentWindowSize = 2) }

    val currentMemory: Memory = if (selectedType == MemoryType.BUFFER) bufferMemory else summaryMemory

    fun refreshEntries() {
        scope.launch {
            val loaded = currentMemory.load(ChainInput(text = ""))
            entries.clear()
            entries.addAll(loaded)
            tokenCount = currentMemory.estimatedTokenCount
        }
    }

    val codePatterns = mapOf(
        MemoryType.BUFFER to """
// BufferMemory — keeps last N conversation turns
val memory = BufferMemory(maxEntries = 4, maxTokens = 500)

// Save a conversation exchange
memory.save(
    input = ChainInput(text = "What is AI?"),
    output = ChainOutput(value = "AI is...", text = "AI is...")
)

// Load all entries
val entries = memory.load(ChainInput(text = ""))
val tokens = memory.estimatedTokenCount
        """.trimIndent(),
        MemoryType.SUMMARY to """
// SummaryMemory — compresses older entries
val memory = SummaryMemory(
    model = PromptApiModel(context),
    recentWindowSize = 2
)

// Older entries get summarized into compressed form
memory.save(input = ..., output = ...)
val entries = memory.load(ChainInput(text = ""))
        """.trimIndent()
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Memory") },
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
            CodePatternCard(code = codePatterns[selectedType] ?: "")

            Column {
                Text("Memory Type", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MemoryType.entries.forEach { type ->
                        FilterChip(
                            selected = selectedType == type,
                            onClick = {
                                selectedType = type
                                refreshEntries()
                            },
                            label = { Text(type.label) }
                        )
                    }
                }
                Text(
                    if (selectedType == MemoryType.BUFFER) "Keeps last 4 entries, max 500 tokens. Oldest removed when full."
                    else "Keeps 2 recent turns verbatim, compresses older ones into summary.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Column {
                Text("Add Conversation Turn", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = userInput,
                    onValueChange = { userInput = it },
                    label = { Text("User message") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = assistantInput,
                    onValueChange = { assistantInput = it },
                    label = { Text("Assistant response") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = {
                            scope.launch {
                                println("[MemoryDemo] saving turn - user: $userInput, assistant: $assistantInput")
                                currentMemory.save(
                                    input = ChainInput(text = userInput),
                                    output = ChainOutput(value = assistantInput, text = assistantInput, metadata = mutableMapOf(), processingTimeMs = null)
                                )
                                userInput = ""
                                assistantInput = ""
                                refreshEntries()
                                println("[MemoryDemo] entries: ${entries.size}, tokens: $tokenCount")
                                infoMessage = "Turn saved"
                            }
                        },
                        enabled = userInput.isNotBlank() && assistantInput.isNotBlank()
                    ) { Text("Save Turn") }

                    Button(
                        onClick = {
                            scope.launch {
                                currentMemory.clear()
                                refreshEntries()
                                infoMessage = "Memory cleared"
                            }
                        },
                        enabled = entries.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                    ) { Text("Clear All") }
                }
            }

            infoMessage?.let {
                Text(it, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodySmall)
            }

            // Memory state
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Memory State", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatBadge(
                            label = "Entries",
                            value = if (selectedType == MemoryType.BUFFER) "${entries.size} / 4" else "${entries.size}"
                        )
                        StatBadge(
                            label = "Tokens",
                            value = if (selectedType == MemoryType.BUFFER) "$tokenCount / 500" else "$tokenCount"
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                if (entries.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Inbox, contentDescription = null, modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Memory is empty", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("Add conversation turns above", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f))
                    }
                } else {
                    entries.forEachIndexed { index, entry ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = when (entry.role) {
                                    "user" -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                                    "assistant" -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                    else -> MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.3f)
                                }
                            ),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(CircleShape)
                                        .background(
                                            when (entry.role) {
                                                "user" -> MaterialTheme.colorScheme.primary
                                                "system" -> Color(0xFFFF9800)
                                                else -> MaterialTheme.colorScheme.outline
                                            }
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        when (entry.role) {
                                            "user" -> "U"
                                            "assistant" -> "A"
                                            "system" -> "S"
                                            else -> "?"
                                        },
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        when (entry.role) {
                                            "user" -> "User"
                                            "assistant" -> "Assistant"
                                            "system" -> "Summary"
                                            else -> entry.role
                                        },
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(entry.content, style = MaterialTheme.typography.bodySmall, maxLines = 4)
                                }
                                Text("#${index + 1}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f))
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
