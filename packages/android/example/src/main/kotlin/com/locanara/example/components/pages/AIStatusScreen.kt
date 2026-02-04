package com.locanara.example.components.pages

import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.locanara.example.viewmodel.AIStatus
import com.locanara.example.viewmodel.LocanaraViewModel
import com.locanara.example.viewmodel.NotAvailableReason
import kotlinx.coroutines.delay

/**
 * AI Status Screen - First screen shown to check Gemini Nano availability.
 *
 * This screen:
 * 1. Checks if Gemini Nano / on-device AI is available
 * 2. Shows device information
 * 3. Provides actions to enable AI if not available
 * 4. Navigates to features if AI is ready
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AIStatusScreen(
    onNavigateToFeatures: () -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    val context = LocalContext.current
    val aiStatus by viewModel.aiStatus.collectAsState()
    val deviceInfo by viewModel.deviceInfo.collectAsState()

    // Auto-navigate when AI is available
    LaunchedEffect(aiStatus) {
        if (aiStatus is AIStatus.Available) {
            delay(1500) // Show success briefly
            onNavigateToFeatures()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Locanara") },
                actions = {
                    IconButton(onClick = { viewModel.checkAIStatus() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Status Icon
            StatusIcon(aiStatus)

            Spacer(modifier = Modifier.height(24.dp))

            // Status Title
            StatusTitle(aiStatus)

            Spacer(modifier = Modifier.height(8.dp))

            // Status Description
            StatusDescription(aiStatus)

            Spacer(modifier = Modifier.height(32.dp))

            // Device Info Card
            deviceInfo?.let { info ->
                DeviceInfoCard(
                    manufacturer = info.manufacturer,
                    model = info.model,
                    androidVersion = info.androidVersion,
                    apiLevel = info.apiLevel,
                    totalRAM = info.totalRAMMB,
                    supportsGeminiNano = info.supportsGeminiNano
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Action Buttons
            ActionButtons(
                aiStatus = aiStatus,
                onRetry = { viewModel.checkAIStatus() },
                onOpenSettings = {
                    val intent = if (Build.VERSION.SDK_INT >= 34) {
                        // Try to open Google AI settings
                        Intent(Settings.ACTION_SETTINGS).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                    } else {
                        Intent(Settings.ACTION_SETTINGS)
                    }
                    context.startActivity(intent)
                },
                onDownload = { viewModel.downloadPromptApiModel() },
                onContinue = onNavigateToFeatures
            )
        }
    }
}

@Composable
private fun StatusIcon(status: AIStatus) {
    val iconSize = 80.dp

    when (status) {
        is AIStatus.Checking -> {
            CircularProgressIndicator(
                modifier = Modifier.size(iconSize),
                strokeWidth = 6.dp
            )
        }
        is AIStatus.Available -> {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = "Available",
                modifier = Modifier.size(iconSize),
                tint = MaterialTheme.colorScheme.primary
            )
        }
        is AIStatus.NotAvailable -> {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Not Available",
                modifier = Modifier.size(iconSize),
                tint = MaterialTheme.colorScheme.error
            )
        }
        is AIStatus.Error -> {
            Icon(
                imageVector = Icons.Default.Error,
                contentDescription = "Error",
                modifier = Modifier.size(iconSize),
                tint = MaterialTheme.colorScheme.error
            )
        }
    }
}

@Composable
private fun StatusTitle(status: AIStatus) {
    val title = when (status) {
        is AIStatus.Checking -> "Checking AI Status..."
        is AIStatus.Available -> "Gemini Nano Ready!"
        is AIStatus.NotAvailable -> when (status.reason) {
            NotAvailableReason.DEVICE_NOT_SUPPORTED -> "Device Not Supported"
            NotAvailableReason.ANDROID_VERSION_TOO_LOW -> "Android Update Required"
            NotAvailableReason.GEMINI_NANO_NOT_ENABLED -> "Gemini Nano Not Enabled"
            NotAvailableReason.INSUFFICIENT_MEMORY -> "Insufficient Memory"
            NotAvailableReason.UNKNOWN -> "AI Not Available"
        }
        is AIStatus.Error -> "Error"
    }

    Text(
        text = title,
        style = MaterialTheme.typography.headlineMedium,
        fontWeight = FontWeight.Bold,
        textAlign = TextAlign.Center
    )
}

@Composable
private fun StatusDescription(status: AIStatus) {
    val description = when (status) {
        is AIStatus.Checking -> "Verifying Gemini Nano availability on your device..."
        is AIStatus.Available -> "On-device AI is ready. You can now use all features!"
        is AIStatus.NotAvailable -> when (status.reason) {
            NotAvailableReason.DEVICE_NOT_SUPPORTED ->
                "Your device does not support Gemini Nano. This feature requires specific hardware."
            NotAvailableReason.ANDROID_VERSION_TOO_LOW ->
                "Gemini Nano requires Android 14 (API 34) or higher. Please update your device."
            NotAvailableReason.GEMINI_NANO_NOT_ENABLED ->
                "Gemini Nano is not enabled on your device. Please enable it in Settings > Google > AI > Gemini Nano."
            NotAvailableReason.INSUFFICIENT_MEMORY ->
                "Your device needs at least 6GB of RAM for Gemini Nano."
            NotAvailableReason.UNKNOWN ->
                "On-device AI is not available on this device."
        }
        is AIStatus.Error -> status.message
    }

    Text(
        text = description,
        style = MaterialTheme.typography.bodyLarge,
        textAlign = TextAlign.Center,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

@Composable
private fun DeviceInfoCard(
    manufacturer: String,
    model: String,
    androidVersion: String,
    apiLevel: Int,
    totalRAM: Int,
    supportsGeminiNano: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Device Information",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(12.dp))

            InfoRow(
                icon = Icons.Default.PhoneAndroid,
                label = "Device",
                value = "$manufacturer $model"
            )

            InfoRow(
                icon = Icons.Default.PhoneAndroid,
                label = "Android",
                value = "$androidVersion (API $apiLevel)"
            )

            InfoRow(
                icon = Icons.Default.Memory,
                label = "RAM",
                value = "${totalRAM / 1024} GB"
            )

            InfoRow(
                icon = if (supportsGeminiNano) Icons.Default.CheckCircle else Icons.Default.Warning,
                label = "Gemini Nano",
                value = if (supportsGeminiNano) "Supported" else "Not Supported",
                valueColor = if (supportsGeminiNano) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.error
                }
            )
        }
    }
}

@Composable
private fun InfoRow(
    icon: ImageVector,
    label: String,
    value: String,
    valueColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "$label:",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = valueColor
        )
    }
}

@Composable
private fun ActionButtons(
    aiStatus: AIStatus,
    onRetry: () -> Unit,
    onOpenSettings: () -> Unit,
    onDownload: () -> Unit,
    onContinue: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        when (aiStatus) {
            is AIStatus.Checking -> {
                // No buttons while checking
            }

            is AIStatus.Available -> {
                Button(
                    onClick = onContinue,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Continue to Features")
                }
            }

            is AIStatus.NotAvailable -> {
                when (aiStatus.reason) {
                    NotAvailableReason.GEMINI_NANO_NOT_ENABLED -> {
                        Button(
                            onClick = onOpenSettings,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Settings, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Open Settings")
                        }

                        OutlinedButton(
                            onClick = onDownload,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Download Gemini Nano")
                        }
                    }

                    NotAvailableReason.ANDROID_VERSION_TOO_LOW -> {
                        Button(
                            onClick = onOpenSettings,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Check for Updates")
                        }
                    }

                    else -> {
                        // Device not supported - just retry
                    }
                }

                OutlinedButton(
                    onClick = onRetry,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Check Again")
                }
            }

            is AIStatus.Error -> {
                Button(
                    onClick = onRetry,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Retry")
                }
            }
        }
    }
}
