<div align="center">

# ⚡ FluxGrid

**Cyberpunk Blok Bulmaca Oyunu - Android Native App**

Yerçekimi mekanikleri, aktif yetenekler ve neon estetiği ile 3D blok bulmaca deneyimi.

📱 Android Native App (Capacitor)

</div>

## Özellikler

- 🧊 10x10 3D ızgara (Babylon.js)
- 🎯 Sürükle-Bırak parça yerleştirme
- ⚡ Flux enerji sistemi & aktif yetenekler (Shatter, Bomb, Reroll)
- 🔊 Haptic feedback & ses efektleri
- 📱 Android native optimizasyonları
- 🌈 Cyberpunk neon estetik
- 💰 AdMob entegrasyonu (Banner, Interstitial, Rewarded)

## Geliştirme

```bash
npm install
npm run dev
```

## Android Build

```bash
# Build ve sync
npm run android:build

# Android Studio'da aç
npm run android:open

# Tek komutta build + sync + open
npm run android:dev
```

## AdMob Konfigürasyonu

`.env` dosyasında AdMob Ad Unit ID'lerinizi tanımlayın:

```env
VITE_ADMOB_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
VITE_ADMOB_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_ID
VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID
VITE_ADMOB_REWARDED_ID=ca-app-pub-XXXXXXXXXXXXXXXX/REWARDED_ID
```

Tanımlanmazsa test ID'leri kullanılır.

## Teknolojiler

React · Vite · Zustand · Babylon.js · Framer Motion · TypeScript · Capacitor · AdMob

## Android Optimizasyonları

- Hardware scaling (devicePixelRatio=1.0)
- Fragment pool reduction (25 vs 50)
- Particle effects disabled
- Memory leak fixes
- Safe area handling
- Back button navigation
- Haptic feedback optimization

## Lisans

MIT
