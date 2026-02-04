package com.locanara.example.components.pages

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.locanara.ClassifyResult
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.components.shared.SampleTexts
import com.locanara.example.viewmodel.LocanaraViewModel

private val defaultCategories = listOf(
    "Technology",
    "Sports",
    "Entertainment",
    "Business",
    "Health"
)

/**
 * Classify Feature Demo Screen.
 *
 * Demonstrates text classification into predefined categories.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ClassifyScreen(
    onNavigateBack: () -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    var inputText by remember { mutableStateOf(SampleTexts.CLASSIFY_TEXT) }
    val selectedCategories = remember { mutableStateListOf(*defaultCategories.toTypedArray()) }
    var customCategory by remember { mutableStateOf("") }

    val isExecuting by viewModel.isExecuting.collectAsState()
    val executionResult by viewModel.executionResult.collectAsState()

    FeatureScreenTemplate(
        title = "Classify",
        inputLabel = "Text to classify",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter text to classify into categories...",
        isExecuting = isExecuting,
        executionResult = executionResult,
        onExecute = {
            viewModel.classify(
                text = inputText,
                categories = if (selectedCategories.isNotEmpty()) selectedCategories.toList() else null
            )
        },
        onNavigateBack = onNavigateBack,
        executeButtonText = "Classify",
        additionalInputs = {
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Categories",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(8.dp))

            FlowRow(modifier = Modifier.fillMaxWidth()) {
                defaultCategories.forEach { category ->
                    FilterChip(
                        selected = category in selectedCategories,
                        onClick = {
                            if (category in selectedCategories) {
                                selectedCategories.remove(category)
                            } else {
                                selectedCategories.add(category)
                            }
                        },
                        label = { Text(category) },
                        modifier = Modifier.padding(end = 8.dp, bottom = 8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = customCategory,
                onValueChange = { customCategory = it },
                label = { Text("Add custom category") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                trailingIcon = {
                    if (customCategory.isNotBlank()) {
                        androidx.compose.material3.TextButton(
                            onClick = {
                                if (customCategory !in selectedCategories) {
                                    selectedCategories.add(customCategory)
                                }
                                customCategory = ""
                            }
                        ) {
                            Text("Add")
                        }
                    }
                }
            )

            if (selectedCategories.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Selected: ${selectedCategories.joinToString(", ")}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        },
        resultContent = { result ->
            val classifyResult = result.result as? ClassifyResult
            Column {
                Text(
                    text = "Classification Results",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                classifyResult?.classifications?.forEach { classification ->
                    Text(
                        text = "${classification.label}: ${String.format("%.1f", classification.score * 100)}%",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
                if (classifyResult == null) {
                    Text(
                        text = "No classification results available",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    )
}
