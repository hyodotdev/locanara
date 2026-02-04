package com.locanara.example.components.pages

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.locanara.ExtractResult
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.components.shared.SampleTexts
import com.locanara.example.viewmodel.LocanaraViewModel

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
 * - Key-value pairs
 * - Contact information
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExtractScreen(
    onNavigateBack: () -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    var inputText by remember { mutableStateOf(SampleTexts.EXTRACT_TEXT) }
    val selectedEntityTypes = remember { mutableStateListOf<String>() }
    var extractKeyValues by remember { mutableStateOf(true) }

    val isExecuting by viewModel.isExecuting.collectAsState()
    val executionResult by viewModel.executionResult.collectAsState()

    FeatureScreenTemplate(
        title = "Extract",
        inputLabel = "Text to extract from",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter text containing entities to extract...",
        isExecuting = isExecuting,
        executionResult = executionResult,
        onExecute = {
            viewModel.extract(
                text = inputText,
                entityTypes = if (selectedEntityTypes.isNotEmpty()) selectedEntityTypes.toList() else null,
                extractKeyValues = extractKeyValues
            )
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

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = extractKeyValues,
                    onCheckedChange = { extractKeyValues = it }
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Extract key-value pairs",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        },
        resultContent = { result ->
            val extractResult = result.result as? ExtractResult
            Column {
                Text(
                    text = "Extracted Entities",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                extractResult?.entities?.forEach { entity ->
                    Text(
                        text = "[${entity.type.uppercase()}] ${entity.value}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
                extractResult?.keyValuePairs?.let { pairs ->
                    if (pairs.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Key-Value Pairs",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        pairs.forEach { pair ->
                            Text(
                                text = "${pair.key}: ${pair.value}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                        }
                    }
                }
                if (extractResult == null) {
                    Text(
                        text = "No extracted entities available",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    )
}
