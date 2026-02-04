package com.locanara.example.components.pages

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.locanara.ImageDescriptionResult
import com.locanara.example.components.shared.AICoreWarningCard
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.viewmodel.LocanaraViewModel
import com.locanara.mlkit.PromptApiStatus
import java.io.ByteArrayOutputStream

/**
 * DescribeImage Feature Demo Screen.
 *
 * Demonstrates image description using on-device AI:
 * - Select image from gallery
 * - Shows image preview
 * - Returns detailed description with confidence
 */
@Composable
fun DescribeImageScreen(
    onNavigateBack: () -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    val context = LocalContext.current
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var selectedBitmap by remember { mutableStateOf<Bitmap?>(null) }

    val isExecuting by viewModel.isExecuting.collectAsState()
    val executionResult by viewModel.executionResult.collectAsState()
    val promptApiStatus by viewModel.promptApiStatus.collectAsState()

    // Check if Gemini Nano is available for image description
    val isGeminiNanoReady = promptApiStatus is PromptApiStatus.Available

    // Photo picker launcher
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        uri?.let {
            selectedImageUri = it
            // Load bitmap from URI
            try {
                context.contentResolver.openInputStream(it)?.use { inputStream ->
                    selectedBitmap = BitmapFactory.decodeStream(inputStream)
                }
            } catch (e: Exception) {
                selectedBitmap = null
            }
        }
    }

    FeatureScreenTemplate(
        title = "Describe Image",
        inputLabel = "",
        inputValue = "",
        onInputChange = { },
        inputPlaceholder = "",
        isExecuting = isExecuting,
        executionResult = executionResult,
        onExecute = {
            selectedBitmap?.let { bitmap ->
                val base64 = bitmapToBase64(bitmap)
                viewModel.describeImage(imageBase64 = base64)
            }
        },
        onNavigateBack = onNavigateBack,
        executeButtonText = "Describe Image",
        showMainInput = false,
        executeEnabled = selectedBitmap != null && isGeminiNanoReady,
        additionalInputs = {
            // Show warning if Gemini Nano is not available
            if (!isGeminiNanoReady) {
                AICoreWarningCard(
                    status = promptApiStatus,
                    featureName = "Image Description",
                    onOpenSettings = { viewModel.openAICorePlayStore(context) },
                    onDownload = { viewModel.downloadPromptApiModel() }
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Select Image Section
            Text(
                text = "Select Image",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Photo Picker Button
            Button(
                onClick = {
                    photoPickerLauncher.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                    )
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer,
                    contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                )
            ) {
                Icon(
                    Icons.Default.PhotoLibrary,
                    contentDescription = null,
                    modifier = Modifier.padding(end = 8.dp)
                )
                Text("Choose from Library")
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Select an image to describe using AI",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Image Preview
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                if (selectedBitmap != null) {
                    Image(
                        bitmap = selectedBitmap!!.asImageBitmap(),
                        contentDescription = "Selected image",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.Fit
                    )
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Image,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "No Image Selected",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        },
        resultContent = { result ->
            val imageResult = result.result as? ImageDescriptionResult
            Column {
                Text(
                    text = "Description",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = cleanDescription(imageResult?.description ?: "No description available"),
                    style = MaterialTheme.typography.bodyMedium
                )
                imageResult?.confidence?.let { confidence ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Confidence: ${String.format("%.1f", confidence * 100)}%",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                imageResult?.alternatives?.let { alts ->
                    if (alts.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Alternative Descriptions",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        alts.forEach { alt ->
                            Text(
                                text = "• ${cleanDescription(alt)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                        }
                    }
                }
            }
        }
    )
}

/**
 * Convert a Bitmap to Base64 encoded string.
 */
private fun bitmapToBase64(bitmap: Bitmap): String {
    val outputStream = ByteArrayOutputStream()
    // Compress to JPEG with 85% quality to reduce size while maintaining quality
    bitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
    val byteArray = outputStream.toByteArray()
    return Base64.encodeToString(byteArray, Base64.NO_WRAP)
}

/**
 * Clean up AI response by removing unnecessary preambles.
 */
private fun cleanDescription(text: String): String {
    var cleaned = text

    // Remove common preambles that don't add value
    val preamblesToRemove = listOf(
        "Okay, here's a description of what I see in the image:",
        "Okay, here is a description of what I see in the image:",
        "Here's a description of what I see in the image:",
        "Here is a description of what I see in the image:",
        "Here's what I see in the image:",
        "Here is what I see in the image:",
        "I can see the following in this image:",
        "This image shows:",
        "The image shows:",
        "In this image, I can see:",
        "Let me describe what I see:",
        "Sure, here's a description:",
        "Sure, here is a description:"
    )

    for (preamble in preamblesToRemove) {
        if (cleaned.lowercase().startsWith(preamble.lowercase())) {
            cleaned = cleaned.drop(preamble.length)
            break
        }
    }

    // Remove trailing questions
    val trailingPatterns = listOf(
        "Do you want me to",
        "Would you like me to",
        "Should I focus on",
        "Let me know if you",
        "Is there anything specific"
    )

    for (pattern in trailingPatterns) {
        val index = cleaned.lowercase().indexOf(pattern.lowercase())
        if (index != -1) {
            val beforePattern = cleaned.substring(0, index)
            val lastNewline = beforePattern.lastIndexOf('\n')
            val lastPeriod = beforePattern.lastIndexOf('.')

            cleaned = when {
                lastNewline != -1 -> cleaned.substring(0, lastNewline + 1)
                lastPeriod != -1 -> cleaned.substring(0, lastPeriod + 1)
                else -> beforePattern
            }
            break
        }
    }

    return cleaned.trim()
}
