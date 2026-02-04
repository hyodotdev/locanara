#!/bin/bash

# Locanara Gemini - Open in Android Studio
# This script opens the Gemini (Android) package in Android Studio

echo "Opening Locanara Gemini (Android) in Android Studio..."

# Check if Android Studio is installed
ANDROID_STUDIO_PATH="/Applications/Android Studio.app"
if [ ! -d "$ANDROID_STUDIO_PATH" ]; then
    echo "Android Studio not found at: $ANDROID_STUDIO_PATH"
    echo "Please install Android Studio or update the path in this script"
    exit 1
fi

# Get the script directory and go to the gemini package root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GEMINI_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Open the project in Android Studio
cd "$GEMINI_ROOT"
open -a "Android Studio" .

echo "Gemini (Android) package opened in Android Studio"
echo ""
echo "Quick Start Guide:"
echo "  1. Wait for Gradle sync to complete"
echo "  2. Select 'Example' configuration from the run dropdown"
echo "  3. Connect an Android device or start an emulator"
echo "  4. Click the Run button to launch the example app"
echo ""
echo "Available Gradle Tasks:"
echo "  - Build Library: ./gradlew :locanara:build"
echo "  - Build Example: ./gradlew :Example:assembleDebug"
echo "  - Install Example: ./gradlew :Example:installDebug"
echo "  - Run Tests: ./gradlew :locanara:test"
echo ""
echo "Running from Terminal:"
echo "  ./gradlew :example:installDebug && adb shell am start -n com.locanara.example/.MainActivity"
echo ""
echo "View Logs:"
echo "  adb logcat -s Locanara:V MainActivity:V"
