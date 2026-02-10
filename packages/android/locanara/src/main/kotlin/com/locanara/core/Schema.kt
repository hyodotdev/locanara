package com.locanara.core

/**
 * Input to a chain step. Contains the primary value plus metadata.
 *
 * ```kotlin
 * val input = ChainInput(text = "Hello world")
 * val output = chain.invoke(input)
 * ```
 */
data class ChainInput(
    /** Primary text input */
    val text: String,
    /** Arbitrary key-value metadata carried through the chain */
    val metadata: MutableMap<String, String> = mutableMapOf()
)

/**
 * Output from a chain step.
 *
 * Internally carries a type-erased value for chain composition.
 * Use [typed] for safe downcasting, or prefer the typed `run()` methods
 * on built-in chains which return concrete types directly.
 */
data class ChainOutput(
    /** The result value (type-erased for composition) */
    val value: Any,
    /** The raw text representation */
    val text: String,
    /** Metadata carried forward */
    val metadata: MutableMap<String, String> = mutableMapOf(),
    /** Processing time for this step */
    val processingTimeMs: Int? = null
) {
    /** Type-safe value accessor. Returns null if the value is not the expected type. */
    inline fun <reified T> typed(): T? = value as? T
}
