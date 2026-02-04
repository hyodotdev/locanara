package com.locanara.example.components.pages

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
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
import androidx.lifecycle.viewmodel.compose.viewModel
import com.locanara.TranslateResult
import com.locanara.example.components.shared.FeatureScreenTemplate
import com.locanara.example.viewmodel.LocanaraViewModel

/**
 * Supported languages for translation.
 */
data class Language(
    val code: String,
    val name: String
)

private val supportedLanguages = listOf(
    Language("auto", "Auto Detect"),
    Language("en", "English"),
    Language("ko", "Korean"),
    Language("ja", "Japanese"),
    Language("zh", "Chinese"),
    Language("es", "Spanish"),
    Language("fr", "French"),
    Language("de", "German"),
    Language("pt", "Portuguese"),
    Language("it", "Italian")
)

/**
 * Translate Feature Demo Screen.
 *
 * Demonstrates text translation between languages.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TranslateScreen(
    onNavigateBack: () -> Unit,
    viewModel: LocanaraViewModel = viewModel()
) {
    var inputText by remember { mutableStateOf("Hello, how are you today?") }
    var sourceLanguage by remember { mutableStateOf(supportedLanguages[0]) }  // Auto
    var targetLanguage by remember { mutableStateOf(supportedLanguages[2]) }  // Korean

    val isExecuting by viewModel.isExecuting.collectAsState()
    val executionResult by viewModel.executionResult.collectAsState()

    FeatureScreenTemplate(
        title = "Translate",
        inputLabel = "Text to translate",
        inputValue = inputText,
        onInputChange = { inputText = it },
        inputPlaceholder = "Enter text to translate...",
        isExecuting = isExecuting,
        executionResult = executionResult,
        onExecute = {
            viewModel.translate(
                text = inputText,
                targetLanguage = targetLanguage.code,
                sourceLanguage = if (sourceLanguage.code == "auto") null else sourceLanguage.code
            )
        },
        onNavigateBack = onNavigateBack,
        executeButtonText = "Translate",
        additionalInputs = {
            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Source Language
                LanguageDropdown(
                    label = "From",
                    selected = sourceLanguage,
                    languages = supportedLanguages,
                    onSelect = { sourceLanguage = it },
                    modifier = Modifier.weight(1f)
                )

                // Swap button
                IconButton(
                    onClick = {
                        if (sourceLanguage.code != "auto") {
                            val temp = sourceLanguage
                            sourceLanguage = targetLanguage
                            targetLanguage = temp
                        }
                    },
                    enabled = sourceLanguage.code != "auto"
                ) {
                    Icon(Icons.Default.SwapHoriz, contentDescription = "Swap languages")
                }

                // Target Language
                LanguageDropdown(
                    label = "To",
                    selected = targetLanguage,
                    languages = supportedLanguages.filter { it.code != "auto" },
                    onSelect = { targetLanguage = it },
                    modifier = Modifier.weight(1f)
                )
            }
        },
        resultContent = { result ->
            val translateResult = result.result as? TranslateResult
            Column {
                Text(
                    text = "Translation",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = translateResult?.translatedText ?: "No translation available",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${translateResult?.sourceLanguage ?: sourceLanguage.name} → ${translateResult?.targetLanguage ?: targetLanguage.name}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LanguageDropdown(
    label: String,
    selected: Language,
    languages: List<Language>,
    onSelect: (Language) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(4.dp))

        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = it }
        ) {
            OutlinedTextField(
                value = selected.name,
                onValueChange = {},
                readOnly = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier.menuAnchor(),
                singleLine = true
            )

            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                languages.forEach { language ->
                    DropdownMenuItem(
                        text = { Text(language.name) },
                        onClick = {
                            onSelect(language)
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}
