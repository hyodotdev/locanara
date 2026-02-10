package com.locanara.example.components.pages

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Spellcheck
import androidx.compose.material.icons.filled.Summarize
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.locanara.FeatureType
import com.locanara.example.components.navigation.Routes
import com.locanara.example.viewmodel.AIStatus
import com.locanara.example.viewmodel.LocanaraViewModel

/**
 * Feature data for display in the list.
 */
data class FeatureItem(
    val type: FeatureType,
    val name: String,
    val description: String,
    val icon: ImageVector,
    val route: String
)

private val features = listOf(
    FeatureItem(
        type = FeatureType.SUMMARIZE,
        name = "Summarize",
        description = "Condense long text into key points",
        icon = Icons.Default.Summarize,
        route = Routes.SUMMARIZE
    ),
    FeatureItem(
        type = FeatureType.CLASSIFY,
        name = "Classify",
        description = "Categorize text into predefined labels",
        icon = Icons.Default.Category,
        route = Routes.CLASSIFY
    ),
    FeatureItem(
        type = FeatureType.EXTRACT,
        name = "Extract",
        description = "Extract entities and key-value pairs",
        icon = Icons.Default.Search,
        route = Routes.EXTRACT
    ),
    FeatureItem(
        type = FeatureType.CHAT,
        name = "Chat",
        description = "Conversational AI assistant",
        icon = Icons.AutoMirrored.Filled.Chat,
        route = Routes.CHAT
    ),
    FeatureItem(
        type = FeatureType.TRANSLATE,
        name = "Translate",
        description = "Translate text between languages",
        icon = Icons.Default.Translate,
        route = Routes.TRANSLATE
    ),
    FeatureItem(
        type = FeatureType.REWRITE,
        name = "Rewrite",
        description = "Rewrite text in different styles",
        icon = Icons.Default.Edit,
        route = Routes.REWRITE
    ),
    FeatureItem(
        type = FeatureType.PROOFREAD,
        name = "Proofread",
        description = "Check and correct grammar and spelling",
        icon = Icons.Default.Spellcheck,
        route = Routes.PROOFREAD
    ),
)

/**
 * Feature List Screen - Shows all available Locanara features.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeatureListScreen(
    onNavigateToFeature: (String) -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    val deviceCapability by viewModel.deviceCapability.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Locanara Features") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Select a feature to try",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            items(features) { feature ->
                val isAvailable = deviceCapability?.availableFeatures?.contains(feature.type) ?: false

                FeatureCard(
                    feature = feature,
                    isAvailable = isAvailable,
                    onClick = {
                        if (isAvailable) {
                            onNavigateToFeature(feature.route)
                        }
                    }
                )
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun FeatureCard(
    feature: FeatureItem,
    isAvailable: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = isAvailable, onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = if (isAvailable) {
                MaterialTheme.colorScheme.surface
            } else {
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            }
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isAvailable) 2.dp else 0.dp
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = feature.icon,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = if (isAvailable) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                }
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = feature.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium,
                    color = if (isAvailable) {
                        MaterialTheme.colorScheme.onSurface
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    }
                )
                Text(
                    text = feature.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isAvailable) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    }
                )
                if (!isAvailable) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Not available on this device",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }

            if (isAvailable) {
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * Features List Tab - Used in the tab navigation (without back button).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeaturesListTab(
    modifier: Modifier = Modifier,
    onNavigateToFeature: (String) -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    val deviceCapability by viewModel.deviceCapability.collectAsState()
    val aiStatus by viewModel.aiStatus.collectAsState()

    Column(modifier = modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Locanara for Community") }
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // AI Status Banner
            item {
                AIStatusBanner(aiStatus = aiStatus)
            }

            // Section Header
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "AVAILABLE FEATURES",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
                )
            }

            // Features List Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                ) {
                    Column {
                        features.forEachIndexed { index, feature ->
                            val isAvailable = deviceCapability?.availableFeatures?.contains(feature.type) ?: false

                            FeatureListItem(
                                feature = feature,
                                isAvailable = isAvailable,
                                onClick = {
                                    if (isAvailable) {
                                        onNavigateToFeature(feature.route)
                                    }
                                }
                            )

                            if (index < features.size - 1) {
                                HorizontalDivider(
                                    modifier = Modifier.padding(start = 56.dp)
                                )
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }
        }
    }
}

/**
 * AI Status Banner showing Gemini Nano status.
 */
@Composable
private fun AIStatusBanner(aiStatus: AIStatus) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
                imageVector = when (aiStatus) {
                    is AIStatus.Available -> Icons.Default.CheckCircle
                    else -> Icons.Default.Lock
                },
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = when (aiStatus) {
                    is AIStatus.Available -> MaterialTheme.colorScheme.primary
                    is AIStatus.Checking -> MaterialTheme.colorScheme.onSurfaceVariant
                    else -> MaterialTheme.colorScheme.error
                }
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column {
                Text(
                    text = when (aiStatus) {
                        is AIStatus.Checking -> "Checking AI Status..."
                        is AIStatus.Available -> "Gemini Nano Active"
                        is AIStatus.NotAvailable -> "Gemini Nano Not Available"
                        is AIStatus.Error -> "Error"
                    },
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = when (aiStatus) {
                        is AIStatus.Checking -> "Please wait"
                        is AIStatus.Available -> "On-device AI is ready to use"
                        is AIStatus.NotAvailable -> "See Settings tab for setup"
                        is AIStatus.Error -> aiStatus.message
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun FeatureListItem(
    feature: FeatureItem,
    isAvailable: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = isAvailable, onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = feature.icon,
            contentDescription = null,
            modifier = Modifier.size(24.dp),
            tint = if (isAvailable) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            }
        )

        Spacer(modifier = Modifier.width(16.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = feature.name,
                style = MaterialTheme.typography.bodyLarge,
                color = if (isAvailable) {
                    MaterialTheme.colorScheme.onSurface
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                }
            )
            Text(
                text = feature.description,
                style = MaterialTheme.typography.bodySmall,
                color = if (isAvailable) {
                    MaterialTheme.colorScheme.onSurfaceVariant
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                }
            )
        }

        if (isAvailable) {
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            Icon(
                imageVector = Icons.Default.Lock,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            )
        }
    }
}
