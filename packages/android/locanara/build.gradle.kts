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
        minSdk = 31

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")

        buildConfigField("String", "TIER", "\"community\"")
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
}

dependencies {
    // AndroidX
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-guava:1.7.3")

    // JSON
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

    // ML Kit GenAI APIs
    implementation("com.google.mlkit:genai-summarization:1.0.0-beta1")
    implementation("com.google.mlkit:genai-proofreading:1.0.0-beta1")
    implementation("com.google.mlkit:genai-rewriting:1.0.0-beta1")
    implementation("com.google.mlkit:genai-image-description:1.0.0-beta1")
    implementation("com.google.mlkit:genai-prompt:1.0.0-alpha1")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
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

    publishToMavenCentral(com.vanniktech.maven.publish.SonatypeHost.CENTRAL_PORTAL)
    signAllPublications()

    pom {
        name.set("Locanara Android SDK")
        description.set("On-device AI SDK for Android using Gemini Nano")
        url.set("https://locanara.dev")

        licenses {
            license {
                name.set("Apache-2.0")
                url.set("https://www.apache.org/licenses/LICENSE-2.0")
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
