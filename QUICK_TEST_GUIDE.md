# 🚀 Hızlı Test Rehberi - Firebase App Distribution

## En Hızlı Yol (3 Adım)

### 1️⃣ Firebase CLI Kurulumu (İlk Seferinde)
```bash
npm install -g firebase-tools
firebase login
```

### 2️⃣ APK Build + Upload (Tek Komut)
```bash
# Debug APK build et ve Firebase'e yükle
npm run firebase:deploy:test
```

Bu komut:
- ✅ Web build yapar
- ✅ Android sync yapar
- ✅ Debug APK build eder
- ✅ Firebase App Distribution'a yükler
- ✅ "testers" grubuna dağıtır

### 3️⃣ Test Kullanıcıları Ekle

[Firebase Console](https://console.firebase.google.com/) → App Distribution → Testers & Groups

## 📱 Diğer Komutlar

```bash
# Sadece debug APK yükle (APK zaten build edilmişse)
npm run firebase:deploy:debug

# Release APK yükle (imzalı)
npm run firebase:deploy:release

# Özel parametrelerle yükle
node scripts/deploy-test-apk.js --debug --groups "beta-users,internal" --notes "v1.2.0 - Bug fixes"
```

## 🎯 Test Kullanıcıları İçin

1. Email gelecek: "New build available"
2. Firebase App Tester uygulamasını indir (Google Play)
3. Email'deki linke tıkla veya App Tester'dan indir
4. APK'yı yükle ve test et

## 📚 Detaylı Rehber

Daha fazla bilgi için: [FIREBASE_APP_DISTRIBUTION_GUIDE.md](./FIREBASE_APP_DISTRIBUTION_GUIDE.md)

## ⚡ Hızlı Sorun Giderme

**"Firebase CLI yüklü değil"**
```bash
npm install -g firebase-tools
```

**"Firebase'e giriş yapılmamış"**
```bash
firebase login
```

**"APK bulunamadı"**
```bash
npm run android:build:debug
```

## 🔥 Son Değişiklikler

Bu build'de düzeltilen buglar:
- ✅ 10x combo freeze bug düzeltildi
- ✅ MIRROR event double processing düzeltildi
- ✅ Animation overload optimizasyonu
- ✅ Score jump bug düzeltildi
