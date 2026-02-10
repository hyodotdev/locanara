package com.locanara.example.components.pages

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import com.locanara.ExtractResult
import com.locanara.builtin.ExtractChain
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.components.shared.SampleTexts
import kotlinx.coroutines.launch

private val entityTypes = listOf(
    "person",
    "organization",
    "location",
    "date",
    "email",
    "phone",
    "money",
    "url"
)

/**
 * Extract Feature Demo Screen.
 *
 * Demonstrates entity extraction from text:
 * - Named entities (people, places, organizations)
 * - Contact information
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExtractScreen(onNavigateBack: () -> Unit) {
    var inputText by remember { mutableStateOf(SampleTexts.EXTRACT_TEXT) }
    val selectedEntityTypes = remember { mutableStateListOf<String>() }
    var result by remember { mutableStateOf<ExtractResult?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    FeatureScreenTemplate(
        title = "Extract",
        inputLabel = "Text to extract from",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter text containing entities to extract...",
        isLoading = isLoading,
        errorMessage = errorMessage,
        onExecute = {
            isLoading = true
            errorMessage = null
            result = null
            scope.launch {
                try {
                    val types = if (selectedEntityTypes.isNotEmpty()) selectedEntityTypes.toList() else entityTypes
                    println("[ExtractScreen] input: ${inputText.take(200)}, entityTypes: $types")
                    val chain = ExtractChain(entityTypes = types)
                    result = chain.run(inputText)
                    println("[ExtractScreen] result: ${result?.entities?.joinToString { "[${it.type}] ${it.value}" }}")
                } catch (e: Exception) {
                    println("[ExtractScreen] error: ${e.message}")
                    errorMessage = e.message ?: "Unknown error"
                } finally {
                    isLoading = false
                }
            }
        },
        onNavigateBack = onNavigateBack,
        executeButtonText = "Extract",
        additionalInputs = {
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Entity Types (optional)",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            FlowRow(modifier = Modifier.fillMaxWidth()) {
                entityTypes.forEach { type ->
                    FilterChip(
                        selected = type in selectedEntityTypes,
                        onClick = {
                            if (type in selectedEntityTypes) {
                                selectedEntityTypes.remove(type)
                            } else {
                                selectedEntityTypes.add(type)
                            }
                        },
                        label = { Text(type.replaceFirstChar { it.uppercase() }) },
                        modifier = Modifier.padding(end = 8.dp, bottom = 8.dp)
                    )
                }
            }
        },
        resultContent = result?.let { extractResult -> {
            Column {
                Text(
                    text = "Extracted Entities",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                extractResult.entities.forEach { entity ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        Text(
                            text = entity.type.uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(entityColor(entity.type))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                        Text(
                            text = entity.value,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }}
    )
}

private fun entityColor(type: String): Color = when (type.lowercase()) {
    "person" -> Color(0xFF2196F3)       // Blue
    "email" -> Color(0xFFFF9800)        // Orange
    "phone" -> Color(0xFF4CAF50)        // Green
    "date" -> Color(0xFF9C27B0)         // Purple
    "location" -> Color(0xFFF44336)     // Red
    "organization" -> Color(0xFF00BCD4) // Cyan
    "money" -> Color(0xFFFF5722)        // Deep Orange
    "url" -> Color(0xFF607D8B)          // Blue Grey
    else -> Color(0xFF9E9E9E)           // Grey
}
