<div align="center">

# ⚡ FluxGrid

**Cyberpunk Blok Bulmaca Oyunu**

Yerçekimi mekanikleri, aktif yetenekler ve neon estetiği ile 3D blok bulmaca deneyimi.

🎮 [Oyna](https://YOUR_USERNAME.github.io/YOUR_REPO/) 

</div>

## Özellikler

- 🧊 10x10 3D ızgara (Babylon.js)
- 🎯 Sürükle-Bırak parça yerleştirme
- ⚡ Flux enerji sistemi & aktif yetenekler (Shatter, Bomb, Reroll)
- 🔊 Web Audio API ses efektleri
- 📱 Mobil uyumlu PWA — offline oyun desteği
- 🌈 Cyberpunk neon estetik

## Çalıştırma

```bash
npm install
npm run dev
```

## Derleme

```bash
npm run build
npm run preview
```

## Teknolojiler

React · Vite · Zustand · Babylon.js · Framer Motion · TypeScript

## Firebase Kurulumu

### VAPID Key Yapılandırması

Web push bildirimleri için VAPID (Voluntary Application Server Identification) anahtarı gereklidir.

**VAPID Anahtarını Alma:**

1. [Firebase Console](https://console.firebase.google.com/) açın
2. Projenizi seçin
3. **Project Settings** (Proje Ayarları) > **Cloud Messaging** sekmesine gidin
4. **Web Push certificates** bölümüne inin
5. Eğer anahtar çifti yoksa, **Generate key pair** butonuna tıklayın
6. Oluşturulan anahtarı kopyalayın

**Projeye Ekleme:**

`.env` dosyanıza aşağıdaki satırı ekleyin:

```
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

Not: `.env.example` dosyasında tüm gerekli Firebase yapılandırma değişkenlerini bulabilirsiniz.
