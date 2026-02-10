package com.locanara.example.components.pages

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
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.locanara.builtin.ChatChain
import com.locanara.composable.BufferMemory
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Chat message data class.
 */
data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    var content: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * Chat Feature Demo Screen.
 *
 * Demonstrates conversational AI with:
 * - Message history
 * - Context-aware responses via BufferMemory
 * - Streaming toggle for real-time token display
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf("") }
    val messages = remember { mutableStateListOf<ChatMessage>() }
    var isLoading by remember { mutableStateOf(false) }
    var useStreaming by remember { mutableStateOf(true) }
    val memory = remember { BufferMemory() }
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    // Scroll to bottom when new message added (reverseLayout: index 0 = bottom)
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(0)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chat") },
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
        ) {
            // Messages List
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                state = listState,
                reverseLayout = true,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Loading indicator (non-streaming only) - at bottom
                if (isLoading && !useStreaming) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Start
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Thinking...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                items(messages.asReversed(), key = { it.id }) { message ->
                    ChatBubble(message)
                }

                // Welcome message - at top
                if (messages.isEmpty()) {
                    item {
                        WelcomeCard()
                    }
                }
            }

            // Input Area
            Surface(
                modifier = Modifier.fillMaxWidth(),
                tonalElevation = 2.dp
            ) {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Surface(
                                onClick = { useStreaming = false },
                                shape = RoundedCornerShape(16.dp),
                                color = if (!useStreaming) MaterialTheme.colorScheme.primary
                                       else MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.SmartToy,
                                        contentDescription = null,
                                        modifier = Modifier.size(14.dp),
                                        tint = if (!useStreaming) MaterialTheme.colorScheme.onPrimary
                                              else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        "Standard",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (!useStreaming) MaterialTheme.colorScheme.onPrimary
                                               else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Surface(
                                onClick = { useStreaming = true },
                                shape = RoundedCornerShape(16.dp),
                                color = if (useStreaming) MaterialTheme.colorScheme.primary
                                       else MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.SmartToy,
                                        contentDescription = null,
                                        modifier = Modifier.size(14.dp),
                                        tint = if (useStreaming) MaterialTheme.colorScheme.onPrimary
                                              else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        "Stream",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (useStreaming) MaterialTheme.colorScheme.onPrimary
                                               else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            placeholder = { Text("Type a message...") },
                            modifier = Modifier.weight(1f),
                            maxLines = 4,
                            enabled = !isLoading
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        IconButton(
                            onClick = {
                                if (inputText.isNotBlank()) {
                                    val userMessage = inputText
                                    inputText = ""
                                    messages.add(
                                        ChatMessage(
                                            content = userMessage,
                                            isUser = true
                                        )
                                    )
                                    isLoading = true
                                    scope.launch {
                                        val chain = ChatChain(memory = memory)

                                        if (useStreaming) {
                                            println("[ChatScreen] input (streaming): $userMessage")
                                            // Add placeholder for streaming
                                            val placeholderIndex = messages.size
                                            messages.add(
                                                ChatMessage(content = "", isUser = false)
                                            )
                                            try {
                                                chain.streamRun(userMessage).collect { chunk ->
                                                    val current = messages[placeholderIndex]
                                                    messages[placeholderIndex] = current.copy(content = current.content + chunk)
                                                }
                                                println("[ChatScreen] result (streamed): ${messages[placeholderIndex].content.take(200)}")
                                            } catch (e: Exception) {
                                                println("[ChatScreen] error: ${e.message}")
                                                messages[placeholderIndex] = messages[placeholderIndex].copy(
                                                    content = "Error: ${e.message}"
                                                )
                                            }
                                        } else {
                                            try {
                                                println("[ChatScreen] input: $userMessage")
                                                val chatResult = chain.run(userMessage)
                                                println("[ChatScreen] result: ${chatResult.message.take(200)}")
                                                messages.add(
                                                    ChatMessage(
                                                        content = chatResult.message,
                                                        isUser = false
                                                    )
                                                )
                                            } catch (e: Exception) {
                                                println("[ChatScreen] error: ${e.message}")
                                                messages.add(
                                                    ChatMessage(
                                                        content = "Error: ${e.message}",
                                                        isUser = false
                                                    )
                                                )
                                            }
                                        }
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading && inputText.isNotBlank()
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.Send,
                                contentDescription = "Send",
                                tint = if (inputText.isNotBlank()) {
                                    MaterialTheme.colorScheme.primary
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WelcomeCard() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.primaryContainer
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.SmartToy,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Welcome to Locanara Chat!",
                    style = MaterialTheme.typography.titleMedium
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "This chat runs entirely on your device using Gemini Nano. Your conversations are private and never leave your device.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

@Composable
private fun ChatBubble(message: ChatMessage) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (message.isUser) Arrangement.End else Arrangement.Start
    ) {
        if (!message.isUser) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.SmartToy,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        Surface(
            modifier = Modifier.widthIn(max = 280.dp),
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (message.isUser) 16.dp else 4.dp,
                bottomEnd = if (message.isUser) 4.dp else 16.dp
            ),
            color = if (message.isUser) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.surfaceVariant
            }
        ) {
            Text(
                text = message.content.trim(),
                modifier = Modifier.padding(12.dp),
                color = if (message.isUser) {
                    MaterialTheme.colorScheme.onPrimary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                },
                style = MaterialTheme.typography.bodyMedium
            )
        }

        if (message.isUser) {
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.secondaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.secondary
                )
            }
        }
    }
}
