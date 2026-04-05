# Android Build Guide

Bu doküman FluxGrid Android uygulamasını build etmek için gerekli adımları açıklar.

## Gereksinimler

- Node.js 18+
- Android Studio
- JDK 17+
- Android SDK (API 24+)

## Build Komutları

### Hızlı Build (Async)

Async build script'leri arka planda çalışır ve progress gösterir:

```bash
# Debug APK (geliştirme için)
npm run android:build:async

# Release APK (imzalı, production için)
npm run android:build:release:async

# Android App Bundle (Google Play için)
npm run android:bundle:async
```

### Standart Build

```bash
# Debug APK
npm run android:build:debug

# Release APK
npm run android:build:release

# Android App Bundle
npm run android:bundle
```

### Geliştirme

```bash
# Build + Android Studio'da aç
npm run android:dev

# Sadece Android Studio'da aç
npm run android:open
```

## Build Çıktıları

Build tamamlandığında APK/AAB dosyaları şu konumlarda bulunur:

### Debug APK
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK
```
android/app/build/outputs/apk/release/app-release.apk
```

### Android App Bundle (AAB)
```
android/app/build/outputs/bundle/release/app-release.aab
```

## İmzalama Yapılandırması

Release build için imzalama yapılandırması gereklidir.

### 1. Keystore Oluşturma

```bash
keytool -genkey -v -keystore fluxgrid-release.keystore -alias fluxgrid -keyalg RSA -keysize 2048 -validity 10000
```

### 2. key.properties Dosyası Oluşturma

`android/key.properties` dosyasını oluşturun:

```properties
storeFile=../fluxgrid-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=fluxgrid
keyPassword=YOUR_KEY_PASSWORD
```

**ÖNEMLİ:** `key.properties` ve `.keystore` dosyalarını Git'e eklemeyin!

### 3. .gitignore Kontrolü

`android/.gitignore` dosyasında şunların olduğundan emin olun:

```
key.properties
*.keystore
*.jks
```

## Build Optimizasyonları

### ProGuard

Release build'lerde ProGuard otomatik olarak aktiftir:
- Kod küçültme (minification)
- Kod gizleme (obfuscation)
- Kullanılmayan kod kaldırma

ProGuard kuralları: `android/app/proguard-rules.pro`

### Multi-DEX

Uygulama Multi-DEX desteği ile yapılandırılmıştır (64K method limiti için).

## Performans Optimizasyonları

Bu build'de aktif olan Android-specific optimizasyonlar:

1. **FPS Limiter**
   - Batarya seviyesine göre dinamik FPS ayarlaması
   - Idle detection ile FPS düşürme
   - Device tier bazlı otomatik ayarlama

2. **Background Pause**
   - Arka planda render loop durdurma
   - Game state preservation
   - Timer senkronizasyonu

3. **Touch Optimizer**
   - 300ms click delay bypass
   - Touch event optimizasyonu
   - Android-specific CSS optimizasyonları

## Sorun Giderme

### Build Hatası: "SDK location not found"

```bash
# Android SDK path'ini ayarlayın
echo "sdk.dir=/path/to/Android/Sdk" > android/local.properties
```

### Build Hatası: "Execution failed for task ':app:processReleaseResources'"

Web asset'leri yeniden build edin:

```bash
npm run build:android
npm run cap:sync
```

### Gradle Daemon Sorunları

```bash
cd android
./gradlew --stop
./gradlew clean
```

## CI/CD

GitHub Actions veya başka bir CI/CD platformu için:

```yaml
- name: Build Android Release
  run: npm run android:build:release:async
  
- name: Upload APK
  uses: actions/upload-artifact@v3
  with:
    name: app-release
    path: android/app/build/outputs/apk/release/app-release.apk
```

## Google Play Store Yayınlama

1. **App Bundle Oluştur:**
   ```bash
   npm run android:bundle:async
   ```

2. **Google Play Console'a Yükle:**
   - `android/app/build/outputs/bundle/release/app-release.aab` dosyasını yükleyin

3. **Internal Testing:**
   - İlk olarak internal testing track'ine yükleyin
   - Test edin ve onaylayın

4. **Production:**
   - Production track'ine promote edin

## Versiyonlama

Version bilgilerini güncellemek için `android/app/build.gradle`:

```groovy
defaultConfig {
    versionCode 2        // Her release'de artırın
    versionName "1.1.0"  // Semantic versioning
}
```

## Daha Fazla Bilgi

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)
