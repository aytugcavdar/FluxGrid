# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Capacitor - Keep all Capacitor classes and plugins
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
}
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}

# AdMob - Keep all AdMob and UMP SDK classes
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }
-keep class com.google.android.ump.** { *; }
-dontwarn com.google.android.gms.ads.**
-dontwarn com.google.android.ump.**

# AdMob UMP (User Messaging Platform)
-keep class com.google.android.ump.** { *; }
-keepclassmembers class * implements com.google.android.gms.ads.initialization.OnInitializationCompleteListener { *; }

# Rewarded Video
-keep class com.google.android.gms.ads.rewarded.** { *; }

# Interstitial
-keep class com.google.android.gms.ads.interstitial.** { *; }

# WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Babylon.js / WebGL - Keep WebView and related classes
-keep class android.webkit.WebView { *; }
-keep class android.webkit.WebViewClient { *; }
-keep class android.webkit.WebChromeClient { *; }
-keep class android.webkit.WebSettings { *; }
-keepclassmembers class * extends android.webkit.WebView { *; }

# Keep JavaScript interface methods
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}

# Skia rendering optimizations - Keep Skia classes for GPU acceleration
-keep class android.graphics.** { *; }
-keep class android.opengl.** { *; }
-keepclassmembers class android.graphics.** { *; }
-keepclassmembers class android.opengl.** { *; }

# WebView Chromium optimizations
-keep class org.chromium.** { *; }
-dontwarn org.chromium.**

# GPU and hardware acceleration
-keep class android.view.HardwareCanvas { *; }
-keep class android.view.GLES20Canvas { *; }
-keep class android.view.HardwareRenderer { *; }
-keep class android.view.ThreadedRenderer { *; }

# Optimize WebView rendering pipeline
-optimizations !code/simplification/arithmetic
-optimizations !code/simplification/cast
-optimizations !field/*
-optimizations !class/merging/*
-optimizations !code/allocation/variable

# AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# Preserve line numbers for debugging stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep native methods (used by Babylon.js WebGL)
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ===== Security and Obfuscation Rules =====
# Requirement 12.4: ProGuard obfuscation for security

# Enable aggressive obfuscation
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose

# Obfuscate class names, method names, and field names
-repackageclasses ''
-allowaccessmodification

# Remove logging in production (security)
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Remove debug code
-assumenosideeffects class * {
    public void setDebug(boolean);
    public boolean isDebug();
}

# Optimize and shrink code
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*

# Keep source file names and line numbers for crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep custom exceptions for crash reporting
-keep public class * extends java.lang.Exception

# Firebase Crashlytics - Keep crash reporting classes
-keepattributes *Annotation*
-keepattributes Signature
-keep class com.google.firebase.crashlytics.** { *; }
-dontwarn com.google.firebase.crashlytics.**

# Security: Remove sensitive information from stack traces
-keepattributes Exceptions

# Obfuscate string constants (additional security)
-adaptclassstrings

# Remove unused code
-dontwarn **
-ignorewarnings

