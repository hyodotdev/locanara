package com.locanara

/**
 * Locanara SDK Tier
 *
 * Community Edition - Uses Gemini Nano and ML Kit GenAI for on-device AI.
 */
enum class LocanaraTier(val value: String) {
    COMMUNITY("community")
}

/**
 * Current SDK tier
 */
val currentTier: LocanaraTier = LocanaraTier.COMMUNITY

/**
 * Check if current tier is Community (always true for this SDK)
 */
val isCommunityTier: Boolean
    get() = true
