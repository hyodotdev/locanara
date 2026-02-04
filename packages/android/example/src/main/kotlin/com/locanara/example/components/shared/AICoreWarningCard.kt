package com.locanara.example.components.shared

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.locanara.mlkit.PromptApiStatus

/**
 * Warning card displayed when Prompt API (Gemini Nano) is not available.
 *
 * Shows different UI based on status:
 * - Downloadable: Show download button
 * - Downloading: Show progress indicator
 * - NotAvailable: Show setup instructions with Play Store button
 */
@Composable
fun AICoreWarningCard(
    status: PromptApiStatus,
    featureName: String,
    onOpenSettings: (() -> Unit)? = null,
    onDownload: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val isDownloadable = status is PromptApiStatus.Downloadable
    val isDownloading = status is PromptApiStatus.Downloading

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = if (isDownloadable || isDownloading) {
            MaterialTheme.colorScheme.primaryContainer
        } else {
            MaterialTheme.colorScheme.errorContainer
        }
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (isDownloading) {
                    CircularProgressIndicator(
                        modifier = Modifier.width(24.dp).height(24.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.primary
                    )
                } else if (isDownloadable) {
                    Icon(
                        Icons.Default.CloudDownload,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                } else {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = when {
                        isDownloading -> "Downloading Gemini Nano..."
                        isDownloadable -> "Download Gemini Nano"
                        else -> "Gemini Nano Not Available"
                    },
                    style = MaterialTheme.typography.titleMedium,
                    color = if (isDownloadable || isDownloading) {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    } else {
                        MaterialTheme.colorScheme.onErrorContainer
                    }
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = when {
                    isDownloading -> "Please wait while the AI model is being downloaded. This may take a few minutes."
                    isDownloadable -> "$featureName requires Gemini Nano which is available for download on this device."
                    else -> "$featureName requires Gemini Nano (AICore) which needs to be set up on this device."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = if (isDownloadable || isDownloading) {
                    MaterialTheme.colorScheme.onPrimaryContainer
                } else {
                    MaterialTheme.colorScheme.onErrorContainer
                }
            )

            if (isDownloadable && onDownload != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onDownload,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.onPrimary
                    )
                ) {
                    Icon(
                        Icons.Default.CloudDownload,
                        contentDescription = null,
                        modifier = Modifier.padding(end = 8.dp)
                    )
                    Text("Download Model")
                }
            } else if (!isDownloadable && !isDownloading && onOpenSettings != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onOpenSettings,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error,
                        contentColor = MaterialTheme.colorScheme.onError
                    )
                ) {
                    Icon(
                        Icons.Default.PlayArrow,
                        contentDescription = null,
                        modifier = Modifier.padding(end = 8.dp)
                    )
                    Text("Setup in Play Store")
                }
            }
        }
    }
}
