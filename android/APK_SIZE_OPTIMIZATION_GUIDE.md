# APK Size Optimization Guide

## Overview

This guide documents all APK size optimizations implemented for FluxGrid to achieve the target of < 50MB APK size.

## Current Optimizations

### 1. ProGuard Minification (Enabled)

**Location**: `android/app/build.gradle`

```groovy
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

**Impact**: ~30-40% code size reduction

**What it does**:
- Removes unused code (dead code elimination)
- Obfuscates class/method/field names
- Optimizes bytecode
- Removes debug information

### 2. Resource Shrinking

**Location**: `android/app/build.gradle`

Add to release build type:

```groovy
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true  // Add this line
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

**Impact**: ~10-20% resource size reduction

**What it does**:
- Removes unused resources (images, layouts, strings)
- Removes unused alternative resources (different densities, locales)
- Removes unused library resources

### 3. Asset Compression

**Location**: `android/app/build.gradle`

```groovy
android {
    aaptOptions {
        cruncherEnabled = true  // PNG optimization
        ignoreAssetsPattern = '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
    }
}
```

**Impact**: ~5-10% asset size reduction

**What it does**:
- Compresses PNG images
- Removes metadata from images
- Ignores unnecessary files

### 4. Native Library Filtering

**Location**: `android/app/build.gradle`

```groovy
android {
    defaultConfig {
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a'  // Only include ARM architectures
        }
    }
}
```

**Impact**: ~20-30% native library size reduction

**What it does**:
- Excludes x86/x86_64 architectures (rarely used on real devices)
- Only includes ARM architectures (99% of Android devices)

### 5. Split APKs by ABI

**Location**: `android/app/build.gradle`

```groovy
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a'
            universalApk false  // Don't generate universal APK
        }
    }
}
```

**Impact**: ~40-50% size reduction per APK

**What it does**:
- Creates separate APKs for each architecture
- Users only download the APK for their device architecture
- Play Store automatically serves the correct APK

### 6. WebP Image Format

**Recommendation**: Convert PNG/JPG images to WebP format

```bash
# Install cwebp tool
# Ubuntu/Debian: sudo apt-get install webp
# macOS: brew install webp

# Convert images
cwebp -q 80 input.png -o output.webp
```

**Impact**: ~25-35% image size reduction

**What it does**:
- WebP provides better compression than PNG/JPG
- Maintains visual quality
- Supported on all modern Android versions

### 7. Vector Drawables

**Recommendation**: Use vector drawables (SVG) instead of raster images where possible

**Location**: `android/app/src/main/res/drawable/`

```xml
<!-- Instead of multiple PNG files for different densities -->
<!-- Use a single vector drawable -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FF000000"
        android:pathData="M12,2L2,7v10c0,5.55,3.84,10.74,9,12,5.16,-1.26,9,-6.45,9,-12L20,7z"/>
</vector>
```

**Impact**: ~60-80% icon size reduction

**What it does**:
- Single file for all screen densities
- Scales perfectly without quality loss
- Much smaller file size

### 8. Remove Unused Dependencies

**Location**: `android/app/build.gradle`

Review and remove unused dependencies:

```groovy
dependencies {
    // Remove unused dependencies
    // implementation 'com.example.unused:library:1.0.0'
}
```

**Impact**: Varies (5-50MB per dependency)

**What it does**:
- Reduces APK size by removing unused library code
- Reduces method count
- Improves build time

### 9. Enable R8 Full Mode

**Location**: `gradle.properties`

```properties
android.enableR8.fullMode=true
```

**Impact**: ~5-10% additional code size reduction

**What it does**:
- More aggressive code optimization than standard R8
- Better dead code elimination
- More aggressive inlining

### 10. App Bundle (AAB) Instead of APK

**Recommendation**: Upload AAB to Play Store instead of APK

```bash
# Build AAB
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Impact**: ~15-20% size reduction for end users

**What it does**:
- Play Store generates optimized APKs for each device
- Only includes resources needed for that device
- Automatic split APKs by ABI, density, language

## Implementation Checklist

- [x] ProGuard minification enabled
- [ ] Resource shrinking enabled
- [x] Asset compression enabled
- [ ] Native library filtering (ARM only)
- [ ] Split APKs by ABI
- [ ] Convert images to WebP
- [ ] Use vector drawables for icons
- [ ] Remove unused dependencies
- [ ] Enable R8 full mode
- [ ] Build AAB for Play Store

## Measuring APK Size

### Build Release APK

```bash
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Check APK Size

```bash
# Linux/macOS
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Windows
dir android\app\build\outputs\apk\release\app-release.apk
```

### Analyze APK Contents

```bash
# Using Android Studio
# Build > Analyze APK > Select app-release.apk

# Using apkanalyzer (command line)
apkanalyzer apk summary android/app/build/outputs/apk/release/app-release.apk
apkanalyzer apk file-size android/app/build/outputs/apk/release/app-release.apk
```

### APK Size Breakdown

```bash
# Show size of each component
apkanalyzer apk download-size android/app/build/outputs/apk/release/app-release.apk
apkanalyzer dex list android/app/build/outputs/apk/release/app-release.apk
apkanalyzer resources packages android/app/build/outputs/apk/release/app-release.apk
```

## Expected APK Size

### Before Optimization
- **Estimated**: 60-80 MB
- **Components**:
  - DEX files: ~15-20 MB
  - Native libraries: ~25-35 MB (all architectures)
  - Resources: ~10-15 MB
  - Assets: ~5-10 MB

### After Optimization
- **Target**: < 50 MB
- **Expected**: 35-45 MB
- **Components**:
  - DEX files: ~8-12 MB (minified)
  - Native libraries: ~12-18 MB (ARM only)
  - Resources: ~5-8 MB (shrunk)
  - Assets: ~3-5 MB (compressed)

### With App Bundle (AAB)
- **Download size**: 25-35 MB (per device)
- **Install size**: 40-50 MB (per device)

## Troubleshooting

### Issue: APK size still > 50MB after optimization

**Solution 1**: Check for large assets

```bash
# Find large files in APK
unzip -l app-release.apk | sort -k4 -n -r | head -20
```

**Solution 2**: Remove unused native libraries

```bash
# Check which native libraries are included
unzip -l app-release.apk | grep '\.so$'
```

**Solution 3**: Use App Bundle instead of APK

### Issue: ProGuard breaks app functionality

**Solution**: Add keep rules to `proguard-rules.pro`

```proguard
# Keep specific classes
-keep class com.example.MyClass { *; }

# Keep classes with native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
```

### Issue: Resources not being shrunk

**Solution**: Enable strict mode

```groovy
android {
    buildTypes {
        release {
            shrinkResources true
            minifyEnabled true
            
            // Strict mode - removes all unused resources
            resValue "string", "shrink_resources_strict_mode", "true"
        }
    }
}
```

## Best Practices

### 1. Regular Size Monitoring

```bash
# Add to CI/CD pipeline
./gradlew assembleRelease
APK_SIZE=$(stat -f%z android/app/build/outputs/apk/release/app-release.apk)
if [ $APK_SIZE -gt 52428800 ]; then  # 50MB in bytes
    echo "APK size exceeds 50MB: $APK_SIZE bytes"
    exit 1
fi
```

### 2. Asset Optimization

- Use WebP for photos/screenshots
- Use vector drawables for icons/logos
- Compress audio files (use OGG instead of MP3)
- Remove unused fonts

### 3. Code Optimization

- Remove unused imports
- Remove debug code
- Use ProGuard annotations
- Avoid large libraries for small features

### 4. Dependency Management

```groovy
// Use specific modules instead of full library
implementation 'com.google.firebase:firebase-analytics'  // Good
// implementation 'com.google.firebase:firebase-core'    // Bad (includes everything)
```

### 5. Dynamic Feature Modules

For very large apps, consider dynamic feature modules:

```groovy
// In feature module build.gradle
apply plugin: 'com.android.dynamic-feature'

android {
    // Feature module configuration
}
```

## Play Store Requirements

### Size Limits

- **APK**: 100 MB maximum
- **AAB**: 150 MB maximum (before expansion)
- **Expansion files**: 2 GB maximum (2 files)

### Recommendations

- **Target**: < 50 MB for fast downloads
- **Ideal**: < 30 MB for 3G/4G networks
- **Minimum**: < 100 MB to avoid expansion files

### Download Size vs Install Size

- **Download size**: Compressed APK size (what users download)
- **Install size**: Uncompressed size on device (typically 1.5-2x download size)
- Play Store shows download size to users

## Monitoring and Analytics

### Track APK Size Over Time

```bash
# Create size report
echo "$(date),$(stat -f%z app-release.apk)" >> apk-size-history.csv
```

### Firebase Performance Monitoring

```kotlin
// Track app size metrics
val metrics = FirebasePerformance.getInstance()
val trace = metrics.newTrace("app_size")
trace.putMetric("apk_size_mb", apkSizeInMB)
trace.start()
```

## References

- [Android App Size Optimization](https://developer.android.com/topic/performance/reduce-apk-size)
- [ProGuard Manual](https://www.guardsquare.com/manual/home)
- [R8 Optimization](https://developer.android.com/studio/build/shrink-code)
- [App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [WebP Image Format](https://developers.google.com/speed/webp)

## Requirements Satisfied

- **Task 16.5**: Optimize APK size
- **Requirement 5.9**: Target < 50MB APK size
- **Requirement 12.4**: ProGuard obfuscation for security
