# Google Play Store Assets Guide

Bu doküman, FluxGrid oyununun Google Play Store'a yüklenmesi için gerekli tüm görsel varlıkları (assets) içerir.

## ✅ Tamamlanan Varlıklar

### App Icons (Launcher Icons)
Uygulama ikonları zaten mevcut ve tüm yoğunluklar için hazır:

- ✅ **mdpi** (48x48): `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- ✅ **hdpi** (72x72): `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- ✅ **xhdpi** (96x96): `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- ✅ **xxhdpi** (144x144): `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- ✅ **xxxhdpi** (192x192): `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

Adaptive icons (Android 8.0+) da mevcut:
- ✅ Foreground layer: `ic_launcher_foreground.png` (tüm yoğunluklar)
- ✅ Round icons: `ic_launcher_round.png` (tüm yoğunluklar)
- ✅ Adaptive icon XML: `mipmap-anydpi-v26/ic_launcher.xml`

## 📋 Gerekli Varlıklar (Google Play Console'da yüklenecek)

### 1. Feature Graphic (Öne Çıkan Grafik)
**Gereksinim**: ZORUNLU
**Boyut**: 1024 x 500 piksel
**Format**: PNG veya JPEG (24-bit, alpha kanalı yok)
**Maksimum Dosya Boyutu**: 1 MB
**Konum**: `android/store-assets/feature-graphic.png`

**Tasarım Önerileri**:
- Oyunun ana görselini veya logoyu merkeze yerleştirin
- Oyunun adını ve temel özelliğini vurgulayın (örn: "FluxGrid - Tetris Benzeri Puzzle Oyunu")
- Canlı renkler ve yüksek kontrast kullanın
- Metin kullanıyorsanız, minimum 40pt font boyutu kullanın
- Güvenli alan: Kenarlardan 40px içeride kalın

**Örnek İçerik**:
```
[FluxGrid Logo]
Sonsuz Puzzle Mücadelesi
Yeteneklerini Geliştir • Rekorları Kır
```

### 2. Screenshots (Ekran Görüntüleri)
**Gereksinim**: Minimum 2, maksimum 8 ekran görüntüsü
**Boyut**: 
- Telefon: 16:9 veya 9:16 aspect ratio
- Önerilen: 1080 x 1920 piksel (portrait) veya 1920 x 1080 piksel (landscape)
**Format**: PNG veya JPEG (24-bit)
**Maksimum Dosya Boyutu**: 8 MB per screenshot
**Konum**: `android/store-assets/screenshots/`

**Gerekli Ekran Görüntüleri**:

1. **screenshot-1-gameplay.png** (Ana Oyun Ekranı)
   - Oyun alanını gösterin (grid, aktif parça, skor)
   - Oyunun temel mekaniğini vurgulayın
   - Overlay metin: "Parçaları Yerleştir ve Satırları Temizle"

2. **screenshot-2-abilities.png** (Yetenekler Ekranı)
   - Aktif yetenekleri gösterin (Chrono, Surge, vb.)
   - Yetenek ikonlarını ve açıklamalarını gösterin
   - Overlay metin: "Güçlü Yetenekler Kullan"

3. **screenshot-3-statistics.png** (İstatistikler Ekranı)
   - Oyuncu istatistiklerini gösterin (en yüksek skor, toplam oyun, vb.)
   - Başarıları ve ilerlemeleri gösterin
   - Overlay metin: "İlerlemeni Takip Et"

4. **screenshot-4-settings.png** (Ayarlar Ekranı)
   - Ayarlar menüsünü gösterin
   - Ses, müzik, haptic feedback seçeneklerini gösterin
   - Overlay metin: "Oyunu Kişiselleştir"

**Tasarım Önerileri**:
- Gerçek oyun ekranlarını kullanın (mockup değil)
- Her ekran görüntüsüne kısa açıklayıcı metin ekleyin
- Tutarlı bir stil kullanın (aynı font, renk paleti)
- Oyunun en iyi özelliklerini vurgulayın
- İlk 2 ekran görüntüsü en önemlidir (kullanıcılar genellikle sadece bunları görür)

### 3. App Icon (High-Resolution)
**Gereksinim**: ZORUNLU
**Boyut**: 512 x 512 piksel
**Format**: PNG (32-bit, alpha kanalı ile)
**Maksimum Dosya Boyutu**: 1 MB
**Konum**: `android/store-assets/icon-512.png`

**Not**: Mevcut `ic_launcher.png` dosyasını 512x512 boyutuna ölçeklendirin.

### 4. Promo Graphic (Tanıtım Grafiği) - OPSİYONEL
**Gereksinim**: Opsiyonel (ancak önerilir)
**Boyut**: 180 x 120 piksel
**Format**: PNG veya JPEG (24-bit)
**Maksimum Dosya Boyutu**: 1 MB
**Konum**: `android/store-assets/promo-graphic.png`

**Kullanım**: Google Play'in bazı bölümlerinde öne çıkan uygulamalar için kullanılır.

### 5. TV Banner - OPSİYONEL
**Gereksinim**: Sadece Android TV destekliyorsanız
**Boyut**: 1280 x 720 piksel
**Format**: PNG veya JPEG (24-bit)
**Not**: FluxGrid şu anda Android TV desteklemiyor, bu varlık gerekli değil.

## 📁 Dizin Yapısı

Tüm store assets'leri şu dizinde toplayın:

```
android/store-assets/
├── feature-graphic.png          (1024x500)
├── icon-512.png                 (512x512)
├── promo-graphic.png            (180x120, opsiyonel)
└── screenshots/
    ├── screenshot-1-gameplay.png     (1080x1920)
    ├── screenshot-2-abilities.png    (1080x1920)
    ├── screenshot-3-statistics.png   (1080x1920)
    └── screenshot-4-settings.png     (1080x1920)
```

## 🎨 Tasarım Araçları

Bu varlıkları oluşturmak için kullanabileceğiniz araçlar:

1. **Figma** (Ücretsiz): https://www.figma.com
   - Profesyonel tasarım aracı
   - Şablonlar ve bileşenler

2. **Canva** (Ücretsiz): https://www.canva.com
   - Kolay kullanımlı tasarım aracı
   - Hazır şablonlar

3. **GIMP** (Ücretsiz): https://www.gimp.org
   - Açık kaynak görüntü düzenleme aracı
   - Photoshop alternatifi

4. **Android Asset Studio**: https://romannurik.github.io/AndroidAssetStudio/
   - Launcher icon generator
   - Feature graphic templates

## 📸 Ekran Görüntüsü Alma

### Android Cihazda:
1. Oyunu başlatın ve istediğiniz ekrana gidin
2. **Power + Volume Down** tuşlarına aynı anda basın
3. Ekran görüntüsü `Pictures/Screenshots` klasörüne kaydedilir

### Android Emulator'de:
1. Emulator'ü başlatın
2. Emulator yan panelinde **Camera** ikonuna tıklayın
3. Veya **Ctrl + S** (Windows) / **Cmd + S** (Mac) kısayolunu kullanın

### Ekran Görüntüsünü Düzenleme:
1. Ekran görüntüsünü 1080x1920 boyutuna kırpın/ölçeklendirin
2. Gerekirse overlay metin ekleyin (Figma, Canva, veya GIMP ile)
3. PNG formatında kaydedin

## ✅ Kontrol Listesi

Yükleme öncesi kontrol edin:

- [ ] Feature graphic oluşturuldu (1024x500)
- [ ] High-resolution icon oluşturuldu (512x512)
- [ ] Minimum 2 ekran görüntüsü hazırlandı (1080x1920)
- [ ] Tüm görseller doğru boyutlarda
- [ ] Tüm görseller doğru formatlarda (PNG/JPEG)
- [ ] Dosya boyutları limitlerin altında
- [ ] Görseller net ve yüksek kalitede
- [ ] Ekran görüntüleri oyunun en iyi özelliklerini gösteriyor
- [ ] Tutarlı bir görsel stil kullanıldı

## 📤 Google Play Console'a Yükleme

1. [Google Play Console](https://play.google.com/console)'a giriş yapın
2. Uygulamanızı seçin
3. Sol menüden **Store presence > Main store listing** seçin
4. **Graphics** bölümüne gidin
5. Her varlık türü için **Upload** butonuna tıklayın
6. İlgili dosyaları seçin ve yükleyin
7. **Save** butonuna tıklayın

## 🔗 Faydalı Kaynaklar

- [Google Play Asset Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Feature Graphic Best Practices](https://developer.android.com/distribute/marketing-tools/device-art-generator)
- [Screenshot Best Practices](https://developer.android.com/distribute/marketing-tools/device-art-generator)

## 📝 Notlar

- Tüm görseller oyunun gerçek içeriğini yansıtmalıdır (yanıltıcı görsel kullanmayın)
- Google Play politikalarına uygun olmalıdır (şiddet, cinsellik, vb. içermemeli)
- Telif hakkı olan görseller kullanmayın
- Görsellerde metin kullanıyorsanız, hem Türkçe hem İngilizce versiyonlar hazırlayın
