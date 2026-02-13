package com.locanara.example.components.shared

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.locanara.InferenceEngineType
import com.locanara.ModelDisplayInfo
import com.locanara.example.viewmodel.LocanaraViewModel

/**
 * Model Selection Bottom Sheet
 *
 * Matches the iOS ModelDownloadSheet, showing:
 * - Native AI Engines (Gemini Nano)
 * - Available ExecuTorch models (download, load, select, delete)
 * - Info section
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ModelSelectionSheet(
    viewModel: LocanaraViewModel,
    onDismiss: () -> Unit
) {
    val currentEngine by viewModel.currentEngine.collectAsState()
    val availableModels by viewModel.availableModels.collectAsState()
    val supportsGeminiNano by viewModel.supportsGeminiNano.collectAsState()
    val loadedModelId by viewModel.loadedModelId.collectAsState()
    val isDownloading by viewModel.isDownloading.collectAsState()

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState
    ) {
        LazyColumn(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Memory,
                        contentDescription = null,
                        modifier = Modifier.size(32.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "On-Device AI Models",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Select an engine or download a model",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Native AI Engines Section
            item {
                Text(
                    text = "NATIVE AI ENGINES",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }

            item {
                NativeEngineCard(
                    name = "Gemini Nano",
                    description = if (supportsGeminiNano) "Available on this device" else "Not supported on this device",
                    isSupported = supportsGeminiNano,
                    isActive = currentEngine == InferenceEngineType.GEMINI_NANO,
                    onSelect = { viewModel.switchToGeminiNano() }
                )
            }

            // ExecuTorch Models Section
            item {
                Text(
                    text = "AVAILABLE MODELS",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }

            if (availableModels.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Text(
                            text = "No compatible models found for this device",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            } else {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Column {
                            availableModels.forEachIndexed { index, model ->
                                ModelRow(
                                    model = model,
                                    isActive = currentEngine == InferenceEngineType.EXECUTORCH && loadedModelId == model.modelId,
                                    isDownloading = isDownloading,
                                    onDownload = { viewModel.downloadModel(model.modelId) },
                                    onLoad = { viewModel.loadModel(model.modelId) },
                                    onSelect = { viewModel.switchToExecuTorch(model.modelId) },
                                    onDelete = { viewModel.deleteModel(model.modelId) }
                                )
                                if (index < availableModels.size - 1) {
                                    HorizontalDivider(modifier = Modifier.padding(start = 16.dp))
                                }
                            }
                        }
                    }
                }
            }

            // Info Section
            item {
                Text(
                    text = "ABOUT ON-DEVICE AI",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        InfoItem(icon = Icons.Default.Lock, title = "Privacy", description = "All processing happens on your device")
                        Spacer(modifier = Modifier.height(12.dp))
                        InfoItem(icon = Icons.Default.Memory, title = "Offline", description = "Works without internet connection")
                    }
                }
            }

            // Bottom spacing
            item { Spacer(modifier = Modifier.height(32.dp)) }
        }
    }
}

@Composable
private fun NativeEngineCard(
    name: String,
    description: String,
    isSupported: Boolean,
    isActive: Boolean,
    onSelect: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = isSupported && !isActive) { onSelect() },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Memory,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = if (isSupported) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium,
                    color = if (isSupported) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            StatusBadge(
                text = when {
                    isActive -> "Active"
                    isSupported -> "Available"
                    else -> "Unsupported"
                },
                color = when {
                    isActive -> MaterialTheme.colorScheme.primary
                    isSupported -> MaterialTheme.colorScheme.tertiary
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                }
            )
        }
    }
}

@Composable
private fun ModelRow(
    model: ModelDisplayInfo,
    isActive: Boolean,
    isDownloading: Boolean,
    onDownload: () -> Unit,
    onLoad: () -> Unit,
    onSelect: () -> Unit,
    onDelete: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = model.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.width(8.dp))
                when {
                    isActive -> StatusBadge(text = "Active", color = MaterialTheme.colorScheme.primary)
                    model.isLoaded -> StatusBadge(text = "Loaded", color = MaterialTheme.colorScheme.tertiary)
                    model.isRecommended -> StatusBadge(text = "Recommended", color = MaterialTheme.colorScheme.secondary)
                }
            }

            Row {
                Text(
                    text = "${model.sizeMB} MB",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (model.isDownloaded && !model.isLoaded) {
                    Text(
                        text = " \u2022 Downloaded",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        // Action buttons
        if (model.isDownloaded) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (isActive) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Active",
                        modifier = Modifier.size(28.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                } else if (model.isLoaded) {
                    Button(
                        onClick = onSelect,
                        modifier = Modifier.height(32.dp),
                        shape = RoundedCornerShape(16.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)
                    ) {
                        Text("Select", style = MaterialTheme.typography.labelMedium)
                    }
                } else {
                    Button(
                        onClick = onLoad,
                        modifier = Modifier.height(32.dp),
                        shape = RoundedCornerShape(16.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)
                    ) {
                        Text("Load", style = MaterialTheme.typography.labelMedium)
                    }
                }

                // Overflow menu
                IconButton(onClick = { showMenu = true }) {
                    Icon(
                        imageVector = Icons.Default.MoreVert,
                        contentDescription = "More options",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    if (model.isLoaded && !isActive) {
                        DropdownMenuItem(
                            text = { Text("Use This Model") },
                            leadingIcon = { Icon(Icons.Default.CheckCircle, contentDescription = null) },
                            onClick = { onSelect(); showMenu = false }
                        )
                    }
                    if (!model.isLoaded) {
                        DropdownMenuItem(
                            text = { Text("Load Model") },
                            leadingIcon = { Icon(Icons.Default.PlayArrow, contentDescription = null) },
                            onClick = { onLoad(); showMenu = false }
                        )
                    }
                    DropdownMenuItem(
                        text = { Text("Delete Model") },
                        leadingIcon = {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error
                            )
                        },
                        onClick = { onDelete(); showMenu = false }
                    )
                }
            }
        } else {
            // Download button
            IconButton(
                onClick = onDownload,
                enabled = !isDownloading
            ) {
                Icon(
                    imageVector = Icons.Default.Download,
                    contentDescription = "Download",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun StatusBadge(text: String, color: androidx.compose.ui.graphics.Color) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelSmall,
        fontWeight = FontWeight.Medium,
        color = color,
        modifier = Modifier
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}

@Composable
private fun InfoItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
