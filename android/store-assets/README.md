# Store Assets - Mağaza Varlıkları

Bu klasör, Google Play Store'a yüklenecek görsel varlıkları içerir.

## 📋 Gerekli Dosyalar

### ✅ Hazır Olanlar
- App icons (launcher icons) - Zaten `android/app/src/main/res/mipmap-*` klasörlerinde mevcut

### ⏳ Oluşturulması Gerekenler

1. **feature-graphic.png** (1024 x 500 px)
   - Öne çıkan grafik (Google Play'de büyük banner olarak gösterilir)
   - Oyunun logosunu ve temel özelliğini vurgulayın

2. **icon-512.png** (512 x 512 px)
   - Yüksek çözünürlüklü uygulama ikonu
   - Mevcut launcher icon'u ölçeklendirerek oluşturabilirsiniz

3. **screenshots/** klasörü (minimum 2, maksimum 8 ekran görüntüsü)
   - `screenshot-1-gameplay.png` - Ana oyun ekranı
   - `screenshot-2-abilities.png` - Yetenekler ekranı
   - `screenshot-3-statistics.png` - İstatistikler ekranı
   - `screenshot-4-settings.png` - Ayarlar ekranı
   - Her biri 1080 x 1920 px (portrait) veya 1920 x 1080 px (landscape)

4. **promo-graphic.png** (180 x 120 px) - OPSİYONEL
   - Tanıtım grafiği

## 🎨 Nasıl Oluşturulur?

Detaylı talimatlar için `STORE_ASSETS_GUIDE.md` dosyasına bakın.

### Hızlı Başlangıç:

1. **Ekran Görüntüleri Alın**:
   ```bash
   # Android cihazda: Power + Volume Down tuşlarına basın
   # Veya emulator'de: Ctrl+S (Windows) / Cmd+S (Mac)
   ```

2. **Görselleri Düzenleyin**:
   - Figma, Canva, veya GIMP kullanın
   - Doğru boyutlara ölçeklendirin
   - Gerekirse overlay metin ekleyin

3. **Dosyaları Bu Klasöre Kaydedin**:
   ```
   android/store-assets/
   ├── feature-graphic.png
   ├── icon-512.png
   ├── promo-graphic.png (opsiyonel)
   └── screenshots/
       ├── screenshot-1-gameplay.png
       ├── screenshot-2-abilities.png
       ├── screenshot-3-statistics.png
       └── screenshot-4-settings.png
   ```

## ✅ Kontrol Listesi

Yükleme öncesi kontrol edin:

- [ ] Feature graphic oluşturuldu (1024x500)
- [ ] High-resolution icon oluşturuldu (512x512)
- [ ] Minimum 2 ekran görüntüsü hazırlandı
- [ ] Tüm görseller doğru boyutlarda
- [ ] Tüm görseller PNG veya JPEG formatında
- [ ] Dosya boyutları limitlerin altında (feature graphic: 1MB, screenshots: 8MB)
- [ ] Görseller net ve yüksek kalitede

## 📤 Yükleme

1. [Google Play Console](https://play.google.com/console)'a gidin
2. Uygulamanızı seçin
3. **Store presence > Main store listing** seçin
4. **Graphics** bölümünde görselleri yükleyin

## 🔗 Kaynaklar

- [STORE_ASSETS_GUIDE.md](./STORE_ASSETS_GUIDE.md) - Detaylı rehber
- [Google Play Asset Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)
