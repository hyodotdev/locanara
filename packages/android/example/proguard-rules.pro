# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.kts.

# Locanara SDK
-keep class com.locanara.** { *; }

# Kotlin Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

-keep,includedescriptorclasses class com.locanara.**$$serializer { *; }
-keepclassmembers class com.locanara.** {
    *** Companion;
}
-keepclasseswithmembers class com.locanara.** {
    kotlinx.serialization.KSerializer serializer(...);
}
