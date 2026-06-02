<div align="center">

# ⚡ FluxGrid

**Quantum Block Puzzle - Premium Android Native App**

Yerçekimi mekanikleri, aktif yetenekler ve cyberpunk neon estetiği ile geliştirilmiş, yüksek performanslı ve "juice" mekanikleriyle zenginleştirilmiş 3D blok bulmaca deneyimi.

📱 Android Native App (Capacitor 8) · 🎮 Babylon.js 3D Engine · ⚛️ React 19 & Vite
</div>

---

## 🌟 Özellikler

- **🧊 10x10 3D Izgara (Babylon.js):** Tamamen 3D, akıcı ve optimize edilmiş oyun alanı. Tüm cihazlarda parlak renkler ve net görünüm.
- **⚡ "Juice" Mekanikleri & Görsel Şölen:** Yüksek etkili (high-tactile) görsel geri bildirimler, slot makinesi tarzı skor sayaçları, ekran titreşimleri (screen shake), kombo ve satır temizleme (Line Clear) efektleri.
- **🚀 6-Tier Performans Sistemi:** Cihaz donanımına göre otomatik kalite ayarı yapan gelişmiş tier sistemi (LOW, LOW_MID, MID_LOW, MID, MID_HIGH, HIGH). VIP flagship cihazlar otomatik HIGH tier. Gelişmiş GPU sınıflandırması (Mali-G52/G51 = LOW), RAM ve CPU bazlı skor hesaplama (0-100 puan).
- **🎨 Optimizasyon & Performans:** Memory leak koruması, requestAnimationFrame optimizasyonu, production build'de console.log temizliği, telefon ısınma önleme.
- **🏗️ Feature-Sliced Design (FSD):** Temiz, sürdürülebilir ve modüler mimari. Monolitik yapıdan `gridStore`, `pieceStore`, `scoreStore`, `progressionStore` ve `multiplierStore` gibi modüler Zustand store'larına geçiş.
- **✨ Premium UI/UX:** Modern glassmorphism estetiği, Framer Motion ile desteklenmiş mikro animasyonlar ve özel haptic feedback (titreşim) sistemi. Türkçe dil desteği, UTF-8 encoding koruması.
- **💰 Monetizasyon & Analitik:** AdMob (Banner, Interstitial, Rewarded) ve Firebase entegrasyonu.
- **🎮 Oyun Modları:** Zamanlı Mod (60 saniye, ICE/BOMB yok), Sonsuz Mod (sınırsız, tier progression).

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

### Device Tier Sistemi
- **6-Tier Sınıflandırma:** LOW (0-35), LOW_MID (36-45), MID_LOW (46-60), MID (61-70), MID_HIGH (71-80), HIGH (81-100)
- **Skor Hesaplama:** GPU (50%) + RAM (30%) + CPU (20%) = 0-100 puan
- **VIP Flagship:** 50+ model otomatik HIGH tier (Samsung S23+, Xiaomi 14, iPhone 15, vb.)
- **GPU Sınıflandırması:** Mali-G52/G51 (Honor 9X) = LOW, Adreno 7xx = HIGH
- **Smart RAM Estimation:** Web API 8GB sınırı flagship cihazlarda 12GB'a yükseltilir

### Görsel Optimizasyonlar
- **Grid Renkleri:** Tüm tier'larda aynı parlak renkler (emissive: 0.8x, alpha: 0.92)
- **Grid Çizgileri:** Tüm cihazlarda aktif, parlak renk (alpha: 0.8)
- **Hardware Scaling:** `devicePixelRatio=1.0` ile optimize edilmiş çözünürlük
- **Pool Management:** Parçacık (particle) ve parça (fragment) havuzlarının cihaz seviyesine göre dinamik yönetimi

### Performans İyileştirmeleri
- **Console.log Temizliği:** Production build'de tüm console.log'lar kaldırıldı
- **RequestAnimationFrame Optimizasyonu:** CircularTimer setInterval'a çevrildi (100ms)
- **Telefon Isınma Önleme:** Gereksiz render loop'lar optimize edildi
- **UTF-8 Encoding Koruması:** Türkçe karakter bozulması otomatik algılama ve temizleme
- **Event System:** Oyun içi olayların (event) decoupled (bağımsız) olarak yönetilmesi

---

## 📄 Lisans

MIT
