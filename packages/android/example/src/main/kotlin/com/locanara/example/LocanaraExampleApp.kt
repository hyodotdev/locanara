package com.locanara.example

import android.app.Application
import com.locanara.Locanara

/**
 * Application class for Locanara Example app.
 *
 * Initializes the Locanara SDK on app startup.
 */
class LocanaraExampleApp : Application() {

    lateinit var locanara: Locanara
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        locanara = Locanara.getInstance(this)
    }

    companion object {
        lateinit var instance: LocanaraExampleApp
            private set
    }
}
