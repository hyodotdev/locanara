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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.locanara.composable.MemoryEntry
import com.locanara.core.ChainInput
import com.locanara.runtime.Session
import kotlinx.coroutines.launch
import java.util.UUID

private data class ChatMessage(val id: String = UUID.randomUUID().toString(), val role: String, val content: String)

/**
 * Demonstrates Session — stateful chat with BufferMemory and visible memory inspector.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SessionDemo(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf("") }
    val messages = remember { mutableStateListOf<ChatMessage>() }
    val memoryEntries = remember { mutableStateListOf<MemoryEntry>() }
    var tokenCount by remember { mutableIntStateOf(0) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showMemoryInspector by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    val memory = remember { BufferMemory(maxEntries = 5, maxTokens = 1500) }
    val session = remember { Session(memory = memory) }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }

    val codePattern = """
val memory = BufferMemory(maxEntries = 5, maxTokens = 1500)
val session = Session(model = model, memory = memory)

val reply = session.send("Hello!")
// Memory automatically tracks conversation turns
    """.trimIndent()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Session") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        bottomBar = {
            Column {
                HorizontalDivider()
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        placeholder = { Text("Message...") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        enabled = !isLoading
                    )
                    IconButton(
                        onClick = {
                            val text = inputText.trim()
                            if (text.isBlank()) return@IconButton
                            inputText = ""
                            errorMessage = null
                            messages.add(ChatMessage(role = "user", content = text))
                            isLoading = true
                            scope.launch {
                                try {
                                    println("[SessionDemo] input: $text")
                                    val reply = session.send(text)
                                    println("[SessionDemo] result: ${reply.take(200)}")
                                    messages.add(ChatMessage(role = "assistant", content = reply))
                                    val loaded = memory.load(ChainInput(text = ""))
                                    memoryEntries.clear()
                                    memoryEntries.addAll(loaded)
                                    tokenCount = memory.estimatedTokenCount
                                    println("[SessionDemo] memory entries: ${memoryEntries.size}, tokens: $tokenCount")
                                } catch (e: Exception) {
                                    println("[SessionDemo] error: ${e.message}")
                                    errorMessage = e.message
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        enabled = inputText.isNotBlank() && !isLoading
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send")
                    }
                    IconButton(
                        onClick = {
                            scope.launch {
                                session.reset()
                                messages.clear()
                                memoryEntries.clear()
                                tokenCount = 0
                            }
                        },
                        enabled = messages.isNotEmpty()
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = "Clear", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            state = listState,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                CodePatternCard(code = codePattern, initiallyExpanded = false)
            }

            // Memory inspector
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Memory Inspector", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                StatBadge(label = "Entries", value = "${memoryEntries.size} / 5")
                                StatBadge(label = "Tokens", value = "$tokenCount / 1500")
                            }
                        }
                        TextButton(onClick = { showMemoryInspector = !showMemoryInspector }) {
                            Icon(
                                if (showMemoryInspector) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(if (showMemoryInspector) " Hide" else " Show entries")
                        }
                        if (showMemoryInspector) {
                            if (memoryEntries.isEmpty()) {
                                Text("No memory entries yet. Start chatting!", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            } else {
                                memoryEntries.forEach { entry ->
                                    Row(modifier = Modifier.padding(vertical = 2.dp), verticalAlignment = Alignment.Top) {
                                        Box(
                                            modifier = Modifier
                                                .size(20.dp)
                                                .clip(CircleShape)
                                                .background(if (entry.role == "user") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(if (entry.role == "user") "U" else "A", style = MaterialTheme.typography.labelSmall, color = Color.White, fontWeight = FontWeight.Bold)
                                        }
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(entry.content, style = MaterialTheme.typography.bodySmall, maxLines = 2, modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Chat messages
            if (messages.isEmpty()) {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 40.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Start a conversation", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("Session remembers context using BufferMemory", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f))
                    }
                }
            }

            items(messages, key = { it.id }) { msg ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = if (msg.role == "user") Arrangement.End else Arrangement.Start
                ) {
                    Card(
                        modifier = Modifier.widthIn(max = 280.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (msg.role == "user") MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                        ),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(
                            msg.content,
                            modifier = Modifier.padding(12.dp),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }

            if (isLoading) {
                item {
                    Row {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Thinking...", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }

            errorMessage?.let { error ->
                item {
                    Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }
            }

            item { Spacer(modifier = Modifier.height(8.dp)) }
        }
    }
}
