<div align="center">

# ⚡ FluxGrid

**Quantum Block Puzzle - Premium Android Native App**

Yerçekimi mekanikleri, aktif yetenekler ve cyberpunk neon estetiği ile geliştirilmiş, yüksek performanslı ve "juice" mekanikleriyle zenginleştirilmiş 3D blok bulmaca deneyimi.

📱 Android Native App (Capacitor 8) · 🎮 Babylon.js 3D Engine · ⚛️ React 19 & Vite
</div>

---

## 🌟 Özellikler

- **🧊 10x10 3D Izgara (Babylon.js):** Tamamen 3D, akıcı ve optimize edilmiş oyun alanı.
- **⚡ "Juice" Mekanikleri & Görsel Şölen:** Yüksek etkili (high-tactile) görsel geri bildirimler, slot makinesi tarzı skor sayaçları, ekran titreşimleri (screen shake), kombo ve satır temizleme (Line Clear) efektleri.
- **🚀 Hybrid Performans Sistemi:** Cihaz donanımına göre otomatik kalite ayarı yapan katmanlı performans sistemi (High, Mid, Low tiers). Gelişmiş donanım ölçeklendirmesi ve memory leak koruması.
- **🏗️ Feature-Sliced Design (FSD):** Temiz, sürdürülebilir ve modüler mimari. Monolitik yapıdan `gridStore`, `pieceStore`, `scoreStore`, `progressionStore` ve `multiplierStore` gibi modüler Zustand store'larına geçiş.
- **✨ Premium UI/UX:** Modern glassmorphism estetiği, Framer Motion ile desteklenmiş mikro animasyonlar ve özel haptic feedback (titreşim) sistemi.
- **💰 Monetizasyon & Analitik:** AdMob (Banner, Interstitial, Rewarded) ve Firebase entegrasyonu.

---

## 🛠️ Teknoloji Yığını

- **Core:** React 19, TypeScript, Vite
- **3D & Animasyon:** Babylon.js 7, Framer Motion
- **State Yönetimi:** Zustand 5 (Modüler FSD Mimarisi)
- **Stilleme:** Tailwind CSS, Lucide React
- **Mobil Native:** Capacitor 8 (Core, Haptics, AdMob, Preferences, Share, vb.)
- **Test:** Playwright (E2E), Vitest (Unit/Integration)

---

## 🏗️ Mimari (Architecture)

Proje yakın zamanda kapsamlı bir FSD (Feature-Sliced Design) refaktöründen geçmiştir:
- **`src/core`**: Uygulama genelinde kullanılan servisler (StorageService, PerformanceMonitor, vb.) ve utility'ler.
- **`src/features`**: İş alanına (domain) göre ayrılmış modüller (game, achievements, visual-effects vb.). Zustand store'ları her bir özellik için izole edilmiştir.
- **Bağımlılık Akışı:** `app` → `features` → `core` prensibi katı bir şekilde uygulanmıştır.

---

## 💻 Geliştirme (Development)

Projeyi yerelde çalıştırmak için:

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

### 📱 Android Build ve Test Komutları

```bash
# Sadece build al ve Capacitor ile senkronize et
npm run android:build

# Android Studio'da aç
npm run android:open

# Tek komutta build + sync + open (Geliştirme için ideal)
npm run android:dev

# E2E Testleri (Playwright)
npm run test:e2e:ui
```

---

## ⚙️ Çevresel Değişkenler (Environment Variables)

`.env` dosyasında AdMob ve Firebase yapılandırmalarınızı tanımlayın:

```env
VITE_ADMOB_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
VITE_ADMOB_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_ID
VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID
VITE_ADMOB_REWARDED_ID=ca-app-pub-XXXXXXXXXXXXXXXX/REWARDED_ID
```
*(Tanımlanmazsa geliştirme sürecinde test ID'leri kullanılır.)*

---

## 📊 Performans Optimizasyonları

- **Hardware Scaling:** `devicePixelRatio=1.0` ile optimize edilmiş çözünürlük.
- **Pool Management:** Parçacık (particle) ve parça (fragment) havuzlarının cihaz seviyesine (High/Mid/Low) göre dinamik yönetimi.
- **Event System:** Oyun içi olayların (event) decoupled (bağımsız) olarak yönetilmesi.

---

## 📄 Lisans

MIT
