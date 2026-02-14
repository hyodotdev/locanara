package com.locanara.engine

import android.app.ActivityManager
import android.content.Context
import android.os.Debug
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Memory manager for llama.cpp inference
 *
 * Monitors system memory and provides recommendations for model loading.
 * Matches iOS MemoryManager for cross-platform consistency.
 */
class MemoryManager(private val context: Context) {

    private val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager

    private val _memoryPressure = MutableStateFlow(MemoryPressure.NORMAL)
    val memoryPressure: StateFlow<MemoryPressure> = _memoryPressure.asStateFlow()

    /**
     * Memory pressure levels
     */
    enum class MemoryPressure {
        NORMAL,     // Plenty of memory available
        WARNING,    // Memory getting low
        CRITICAL    // Memory very low, should unload
    }

    /**
     * Get current memory info
     */
    fun getMemoryInfo(): MemoryInfo {
        val memInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memInfo)

        val runtime = Runtime.getRuntime()
        val nativeHeap = Debug.getNativeHeapAllocatedSize()

        return MemoryInfo(
            totalSystemMemory = memInfo.totalMem,
            availableSystemMemory = memInfo.availMem,
            threshold = memInfo.threshold,
            lowMemory = memInfo.lowMemory,
            javaHeapUsed = runtime.totalMemory() - runtime.freeMemory(),
            javaHeapMax = runtime.maxMemory(),
            nativeHeapUsed = nativeHeap
        )
    }

    /**
     * Check if there's enough memory to load a model of the given size
     * @param modelSizeBytes Estimated model size in bytes
     * @return true if there's likely enough memory
     */
    fun canLoadModel(modelSizeBytes: Long): Boolean {
        val memInfo = getMemoryInfo()

        // llama.cpp uses memory-mapped files (mmap), so actual RAM usage
        // is much lower than file size. Only active portions are loaded.
        // We just need enough for the working set (~500MB typical)
        val minWorkingSet = 500L * 1024 * 1024

        val canLoad = memInfo.availableSystemMemory >= minWorkingSet
        Log.d(TAG, "canLoadModel: modelSize=${modelSizeBytes / (1024 * 1024)}MB, " +
                "minWorkingSet=${minWorkingSet / (1024 * 1024)}MB, " +
                "available=${memInfo.availableSystemMemory / (1024 * 1024)}MB, canLoad=$canLoad")

        return canLoad
    }

    /**
     * Get recommended context size based on available memory
     * @param modelSizeBytes Size of the loaded model
     * @return Recommended context size in tokens
     */
    fun getRecommendedContextSize(modelSizeBytes: Long): Int {
        val memInfo = getMemoryInfo()

        // Available memory after model is loaded
        val availableAfterModel = memInfo.availableSystemMemory - modelSizeBytes

        // Rough estimate: 1 token context needs ~4KB for KV cache at 4-bit quantization
        val maxContextFromMemory = (availableAfterModel / (4 * 1024)).toInt()

        // Clamp to reasonable values
        return maxContextFromMemory.coerceIn(512, 8192)
    }

    /**
     * Update memory pressure state
     */
    fun updateMemoryPressure() {
        val memInfo = getMemoryInfo()

        val usedRatio = 1.0 - (memInfo.availableSystemMemory.toDouble() / memInfo.totalSystemMemory.toDouble())

        _memoryPressure.value = when {
            memInfo.lowMemory || usedRatio > 0.9 -> MemoryPressure.CRITICAL
            usedRatio > 0.75 -> MemoryPressure.WARNING
            else -> MemoryPressure.NORMAL
        }

        Log.d(TAG, "Memory pressure: ${_memoryPressure.value}, usedRatio=${String.format("%.2f", usedRatio)}")
    }

    /**
     * Force garbage collection (use sparingly)
     */
    fun requestGC() {
        System.gc()
        Runtime.getRuntime().gc()
    }

    data class MemoryInfo(
        val totalSystemMemory: Long,
        val availableSystemMemory: Long,
        val threshold: Long,
        val lowMemory: Boolean,
        val javaHeapUsed: Long,
        val javaHeapMax: Long,
        val nativeHeapUsed: Long
    ) {
        override fun toString(): String {
            return """
                |MemoryInfo:
                |  System: ${availableSystemMemory / (1024 * 1024)}MB / ${totalSystemMemory / (1024 * 1024)}MB available
                |  Java Heap: ${javaHeapUsed / (1024 * 1024)}MB / ${javaHeapMax / (1024 * 1024)}MB
                |  Native Heap: ${nativeHeapUsed / (1024 * 1024)}MB
                |  Low Memory: $lowMemory
            """.trimMargin()
        }
    }

    companion object {
        private const val TAG = "MemoryManager"
    }
}
