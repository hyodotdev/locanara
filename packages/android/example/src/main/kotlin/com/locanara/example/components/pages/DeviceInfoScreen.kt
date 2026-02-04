package com.locanara.example.components.pages

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.locanara.Locanara
import com.locanara.example.viewmodel.AIStatus
import com.locanara.example.viewmodel.LocanaraViewModel

/**
 * Device Info Screen - Tab 2
 *
 * Shows device information and AI capabilities, matching the Mac Device Info view.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceInfoScreen(
    modifier: Modifier = Modifier,
    viewModel: LocanaraViewModel = viewModel()
) {
    val deviceInfo by viewModel.deviceInfo.collectAsState()
    val geminiNanoInfo by viewModel.geminiNanoInfo.collectAsState()
    val aiStatus by viewModel.aiStatus.collectAsState()

    Column(modifier = modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Device Info") }
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Device Section
            item {
                SectionHeader(title = "Device")
            }

            item {
                InfoCard {
                    deviceInfo?.let { info ->
                        InfoRow(label = "Manufacturer", value = info.manufacturer)
                        HorizontalDivider()
                        InfoRow(label = "Model", value = info.model)
                        HorizontalDivider()
                        InfoRow(label = "Android Version", value = "${info.androidVersion} (API ${info.apiLevel})")
                    } ?: run {
                        Text(
                            text = "Device information not available",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // AI Capabilities Section
            item {
                SectionHeader(title = "AI Capabilities")
            }

            item {
                InfoCard {
                    val isAvailable = aiStatus is AIStatus.Available
                    InfoRow(
                        label = "Gemini Nano",
                        value = if (isAvailable) "Available" else "Not Available",
                        valueColor = if (isAvailable) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                    )
                    HorizontalDivider()

                    deviceInfo?.let { info ->
                        InfoRow(
                            label = "Device Support",
                            value = if (info.supportsGeminiNano) "Supported" else "Not Supported",
                            valueColor = if (info.supportsGeminiNano) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                        )
                        HorizontalDivider()

                        InfoRow(
                            label = "RAM",
                            value = "${info.totalRAMMB / 1024} GB",
                            valueColor = if (info.totalRAMMB >= 6 * 1024) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                        )
                    }

                    geminiNanoInfo?.let { nano ->
                        HorizontalDivider()
                        InfoRow(
                            label = "Model Downloaded",
                            value = if (nano.isDownloaded) "Yes" else "No",
                            valueColor = if (nano.isDownloaded) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        HorizontalDivider()
                        InfoRow(
                            label = "Model Ready",
                            value = if (nano.isReady) "Yes" else "No",
                            valueColor = if (nano.isReady) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // SDK Section
            item {
                SectionHeader(title = "SDK")
            }

            item {
                InfoCard {
                    InfoRow(label = "Locanara Version", value = Locanara.VERSION)
                    HorizontalDivider()
                    InfoRow(
                        label = "SDK State",
                        value = when (aiStatus) {
                            is AIStatus.Checking -> "Checking..."
                            is AIStatus.Available -> "Initialized"
                            is AIStatus.NotAvailable -> "Limited"
                            is AIStatus.Error -> "Error"
                        }
                    )
                }
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title.uppercase(),
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
    )
}

@Composable
private fun InfoCard(
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            content()
        }
    }
}

@Composable
private fun InfoRow(
    label: String,
    value: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = valueColor
        )
    }
}
