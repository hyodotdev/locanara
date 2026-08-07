import groovy.json.JsonSlurper

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("maven-publish")
    id("com.vanniktech.maven.publish")
}

// Read version from locanara-versions.json with fallback
val locanaraVersion: String = findProperty("sdk.version")?.toString() ?: run {
    val versionsFile = File(rootDir.parentFile.parentFile, "locanara-versions.json")
    if (versionsFile.exists()) {
        try {
            val versionsJson = JsonSlurper().parseText(versionsFile.readText()) as? Map<*, *>
            versionsJson?.get("android")?.toString() ?: "0.0.0-dev"
        } catch (e: Exception) {
            logger.warn("Failed to parse locanara-versions.json: ${e.message}")
            "0.0.0-dev"
        }
    } else {
        "0.0.0-dev"
    }
}

android {
    namespace = "com.locanara"
    compileSdk = 35

    defaultConfig {
        // Note: minSdk 31 allows broader compatibility. AI features are checked at runtime:
        // - ML Kit GenAI (Summarize, Proofread, Rewrite, Image Description): API 26+
        // - Prompt API (Gemini Nano): API 34+ with supported devices
        // SDK gracefully disables unavailable features via getDeviceCapability()
        minSdk = 31

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")

        buildConfigField("String", "TIER", "\"unified\"")
        buildConfigField("String", "SDK_VERSION", "\"$locanaraVersion\"")
    }

    testOptions {
        targetSdk = 35
    }

    lint {
        targetSdk = 35
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
    }
}

dependencies {
    // AndroidX
    implementation("androidx.core:core-ktx:1.16.0")
    implementation("androidx.appcompat:appcompat:1.7.1")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-guava:1.10.2")

    // JSON
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.1")

    // ML Kit GenAI APIs
    // GenAI APIs are prerelease and may change in future releases.
    implementation("com.google.mlkit:genai-summarization:1.0.0-beta1")
    implementation("com.google.mlkit:genai-proofreading:1.0.0-beta1")
    implementation("com.google.mlkit:genai-rewriting:1.0.0-beta1")
    implementation("com.google.mlkit:genai-image-description:1.0.0-beta1")
    // beta3+ requires Kotlin 2.3 metadata; beta2 is the latest Kotlin 2.1-compatible release.
    implementation("com.google.mlkit:genai-prompt:1.0.0-beta2")

    // ExecuTorch (PyTorch on-device inference)
    implementation("org.pytorch:executorch-android:1.3.1")
    implementation("com.facebook.soloader:soloader:0.12.1")
    implementation("com.facebook.fbjni:fbjni:0.7.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")
}

// ============================================================================
// Maven Central Publishing (via Vanniktech plugin)
// ============================================================================
mavenPublishing {
    coordinates("com.locanara", "locanara", locanaraVersion)

    configure(com.vanniktech.maven.publish.AndroidSingleVariantLibrary(
        variant = "release",
        sourcesJar = false,
        publishJavadocJar = true
    ))

    publishToMavenCentral(com.vanniktech.maven.publish.SonatypeHost.CENTRAL_PORTAL, automaticRelease = true)
    signAllPublications()

    pom {
        name.set("Locanara Android SDK")
        description.set("On-device AI SDK for Android using Gemini Nano")
        url.set("https://locanara.hyo.dev")

        licenses {
            license {
                name.set("AGPL-3.0")
                url.set("https://www.gnu.org/licenses/agpl-3.0.html")
            }
        }

        developers {
            developer {
                id.set("locanara")
                name.set("Locanara")
                email.set("hyo@hyo.dev")
            }
        }

        scm {
            connection.set("scm:git:git://github.com/hyodotdev/locanara.git")
            developerConnection.set("scm:git:ssh://github.com/hyodotdev/locanara.git")
            url.set("https://github.com/hyodotdev/locanara")
        }
    }
}
