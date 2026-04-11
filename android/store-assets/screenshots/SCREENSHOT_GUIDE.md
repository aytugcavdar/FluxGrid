# Screenshot Guide - Ekran Görüntüsü Rehberi

## 📐 Gereksinimler

- **Boyut**: 1080 x 1920 piksel (portrait) veya 1920 x 1080 piksel (landscape)
- **Format**: PNG veya JPEG (24-bit)
- **Maksimum Dosya Boyutu**: 8 MB per screenshot
- **Minimum Sayı**: 2 ekran görüntüsü
- **Maksimum Sayı**: 8 ekran görüntüsü
- **Aspect Ratio**: 9:16 (portrait) veya 16:9 (landscape)

## 📸 Gerekli Ekran Görüntüleri

### 1. screenshot-1-gameplay.png (ZORUNLU)
**Konu**: Ana Oyun Ekranı

**İçerik**:
- Aktif oyun alanı (grid)
- Düşen parça
- Skor ve seviye bilgisi
- HUD elemanları (combo bar, chain counter, vb.)
- Aktif yetenekler

**Overlay Metin**:
- Türkçe: "Parçaları Yerleştir ve Satırları Temizle"
- İngilizce: "Place Pieces and Clear Lines"

**Nasıl Alınır**:
1. Oyunu başlat
2. Birkaç parça yerleştir (grid'in yarısı dolu olsun)
3. Combo veya chain aktifken ekran görüntüsü al
4. Power + Volume Down tuşlarına bas

**İpuçları**:
- Oyun ortasında olsun (çok boş veya çok dolu değil)
- Skor yüksek olsun (etkileyici görünsün)
- Combo/chain aktif olsun (dinamik görünsün)

---

### 2. screenshot-2-abilities.png (ZORUNLU)
**Konu**: Yetenekler Ekranı

**İçerik**:
- Yetenek ikonları (Chrono, Surge, Perfect Bonus, vb.)
- Yetenek açıklamaları
- Yetenek seviyeleri/ilerlemeleri
- Aktif/pasif yetenek göstergeleri

**Overlay Metin**:
- Türkçe: "Güçlü Yetenekler Kullan"
- İngilizce: "Use Powerful Abilities"

**Nasıl Alınır**:
1. Ana menüden "Abilities" veya "Yetenekler" ekranına git
2. Tüm yeteneklerin görünür olduğundan emin ol
3. Ekran görüntüsü al

**İpuçları**:
- Bazı yetenekler unlock edilmiş olsun
- Yetenek açıklamaları okunabilir olsun
- İkonlar net ve renkli olsun

---

### 3. screenshot-3-statistics.png (ÖNERİLİR)
**Konu**: İstatistikler Ekranı

**İçerik**:
- En yüksek skor
- Toplam oyun sayısı
- Toplam satır temizleme
- Başarılar (achievements)
- İlerleme grafikleri

**Overlay Metin**:
- Türkçe: "İlerlemeni Takip Et"
- İngilizce: "Track Your Progress"

**Nasıl Alınır**:
1. Ana menüden "Statistics" veya "İstatistikler" ekranına git
2. İstatistiklerin dolu olduğundan emin ol (birkaç oyun oyna)
3. Ekran görüntüsü al

**İpuçları**:
- İstatistikler etkileyici olsun (yüksek skorlar)
- Grafikler varsa göster
- Başarılar unlock edilmiş olsun

---

### 4. screenshot-4-settings.png (ÖNERİLİR)
**Konu**: Ayarlar Ekranı

**İçerik**:
- Ses kontrolü
- Müzik kontrolü
- Haptic feedback toggle
- Dil seçimi
- Dark mode toggle
- Accessibility options

**Overlay Metin**:
- Türkçe: "Oyunu Kişiselleştir"
- İngilizce: "Customize Your Experience"

**Nasıl Alınır**:
1. Ana menüden "Settings" veya "Ayarlar" ekranına git
2. Tüm ayarların görünür olduğundan emin ol
3. Ekran görüntüsü al

**İpuçları**:
- Ayarlar düzenli ve okunabilir olsun
- Toggle'lar ve slider'lar net görünsün
- Kullanıcı dostu arayüz vurgulansın

---

### 5. screenshot-5-game-over.png (OPSİYONEL)
**Konu**: Game Over Ekranı

**İçerik**:
- Final skoru
- Yeni rekor bildirimi (varsa)
- Paylaşım butonu
- Tekrar oyna butonu
- İstatistik özeti

**Overlay Metin**:
- Türkçe: "Rekorlarını Kır"
- İngilizce: "Break Your Records"

---

### 6. screenshot-6-tutorial.png (OPSİYONEL)
**Konu**: Tutorial/Onboarding Ekranı

**İçerik**:
- Tutorial adımları
- Oyun mekaniği açıklamaları
- İnteraktif rehber

**Overlay Metin**:
- Türkçe: "Kolay Öğren, Hızlı Başla"
- İngilizce: "Learn Fast, Start Quick"

---

## 🎨 Overlay Metin Ekleme

### Figma ile:

1. Ekran görüntüsünü Figma'ya import et
2. Frame boyutunu 1080 x 1920 olarak ayarla
3. Ekran görüntüsünü frame'e yerleştir
4. Alt kısma yarı saydam overlay ekle:
   - Rectangle: 1080 x 200 px
   - Fill: Black (#000000)
   - Opacity: 60%
   - Position: Bottom
5. Metin ekle:
   - Font: Bold, sans-serif (örn: Roboto Bold)
   - Size: 48-60pt
   - Color: White (#FFFFFF)
   - Align: Center
6. Export: PNG, 1080x1920

### Canva ile:

1. "Custom dimensions" seç: 1080 x 1920 px
2. Ekran görüntüsünü upload et ve arka plan olarak ayarla
3. Alt kısma "Shape" ekle (rectangle)
4. Shape'i siyah yap ve transparency'yi %40'a ayarla
5. Metin ekle (beyaz, bold, 48-60pt)
6. Download: PNG format

### GIMP ile:

1. File > Open: Ekran görüntüsünü aç
2. Image > Scale Image: 1080 x 1920 px
3. Yeni layer ekle: Layer > New Layer (siyah, 60% opacity)
4. Rectangle Select Tool ile alt kısmı seç
5. Edit > Fill with FG Color
6. Text Tool (T) ile metin ekle (beyaz, bold, 48-60pt)
7. Export: File > Export As > PNG

## 📱 Ekran Görüntüsü Alma Yöntemleri

### Android Cihazda:

**Yöntem 1: Fiziksel Tuşlar**
1. Ekranı hazırla (istediğin görünüm)
2. **Power + Volume Down** tuşlarına aynı anda basın
3. Ekran yanıp söner ve bildirim gelir
4. Görüntü `Pictures/Screenshots` klasörüne kaydedilir

**Yöntem 2: Gesture (Samsung)**
1. Ekranı hazırla
2. Avuç kenarıyla ekranı sağdan sola kaydır
3. Görüntü kaydedilir

**Yöntem 3: Quick Settings**
1. Bildirim panelini aç
2. "Screenshot" butonuna dokun
3. Görüntü kaydedilir

### Android Emulator'de:

**Yöntem 1: Kısayol Tuşları**
- Windows: **Ctrl + S**
- Mac: **Cmd + S**

**Yöntem 2: Emulator Toolbar**
1. Emulator yan panelinde **Camera** ikonuna tıkla
2. "Take Screenshot" seç
3. Kaydetme konumunu seç

**Yöntem 3: ADB (Advanced)**
```bash
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

### Chrome DevTools (Web Preview):

1. Oyunu tarayıcıda aç
2. F12 ile DevTools'u aç
3. Device Toolbar'ı aç (Ctrl+Shift+M)
4. Cihaz boyutunu ayarla: 1080 x 1920
5. Sağ üstteki "..." menüsünden "Capture screenshot" seç

## 🖼️ Ekran Görüntüsü Düzenleme

### Boyutlandırma:

**ImageMagick (Command Line)**:
```bash
magick convert input.png -resize 1080x1920! output.png
```

**GIMP**:
1. Image > Scale Image
2. Width: 1080, Height: 1920
3. Uncheck "Chain" icon (aspect ratio'yu kır)
4. Scale

**Online Tool**:
- [ResizeImage.net](https://resizeimage.net)
- [Pixlr](https://pixlr.com/editor/)

### Kırpma (Cropping):

**GIMP**:
1. Rectangle Select Tool (R)
2. Fixed Aspect Ratio: 9:16
3. Seçimi yap
4. Image > Crop to Selection

**Online Tool**:
- [Crop.photo](https://crop.photo)

### Optimizasyon (Dosya Boyutu Küçültme):

**TinyPNG** (Online):
- [TinyPNG.com](https://tinypng.com)
- PNG dosyalarını %70'e kadar küçültür
- Kalite kaybı minimal

**ImageOptim** (Mac):
- Drag & drop PNG dosyalarını
- Otomatik optimize eder

**PNGGauntlet** (Windows):
- Batch processing
- Lossless compression

## ✅ Kalite Kontrol Listesi

Her ekran görüntüsü için kontrol edin:

- [ ] Boyut tam olarak 1080 x 1920 piksel (veya 1920 x 1080)
- [ ] Format PNG veya JPEG
- [ ] Dosya boyutu 8 MB'ın altında
- [ ] Görüntü net ve yüksek kaliteli (bulanık değil)
- [ ] Metin okunabilir
- [ ] UI elemanları tam görünüyor (kesilmemiş)
- [ ] Oyunun gerçek içeriğini yansıtıyor
- [ ] Yanıltıcı içerik yok
- [ ] Overlay metin eklenmiş (opsiyonel ama önerilir)
- [ ] Tutarlı stil (tüm ekran görüntüleri benzer görünüyor)

## 🎯 İyi Örnekler

Google Play'de başarılı oyunların ekran görüntülerini inceleyin:

**Candy Crush Saga**:
- Renkli ve canlı
- Oyun mekaniği net görünüyor
- Her ekran farklı bir özelliği gösteriyor

**Subway Surfers**:
- Aksiyon dolu anlar
- Karakterler ve power-up'lar vurgulanmış
- Overlay metin minimal ama etkili

**Monument Valley**:
- Sanatsal ve estetik
- Oyunun benzersiz görsel stilini vurguluyor
- Minimal UI, maksimum etki

## 🚫 Kaçınılması Gerekenler

- ❌ Bulanık veya düşük kaliteli görüntüler
- ❌ Yanlış boyutlar (1080x1920 değil)
- ❌ Çok fazla overlay metin (oyunu gizliyor)
- ❌ Boş veya anlamsız ekranlar
- ❌ Debug bilgileri veya geliştirici araçları
- ❌ Placeholder içerik ("Lorem ipsum", test verileri)
- ❌ Yanıltıcı içerik (oyunda olmayan özellikler)
- ❌ Telif hakkı ihlali (başka oyunlardan görüntüler)

## 📊 Öncelik Sırası

Google Play'de kullanıcılar genellikle sadece ilk 2-3 ekran görüntüsünü görür. Bu yüzden öncelik sırası önemli:

1. **screenshot-1-gameplay.png** - EN ÖNEMLİ (oyunun ne olduğunu gösterir)
2. **screenshot-2-abilities.png** - ÖNEMLİ (benzersiz özellikleri gösterir)
3. **screenshot-3-statistics.png** - İyi olur (ilerleme sistemini gösterir)
4. **screenshot-4-settings.png** - İyi olur (kişiselleştirme seçeneklerini gösterir)
5. **screenshot-5-game-over.png** - Opsiyonel
6. **screenshot-6-tutorial.png** - Opsiyonel

## 📚 Kaynaklar

- [Google Play Screenshot Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Figma](https://www.figma.com) - Ücretsiz tasarım aracı
- [Canva](https://www.canva.com) - Kolay tasarım aracı
- [GIMP](https://www.gimp.org) - Ücretsiz görüntü düzenleme
- [TinyPNG](https://tinypng.com) - PNG optimizasyon
- [Device Art Generator](https://developer.android.com/distribute/marketing-tools/device-art-generator) - Cihaz frame'leri ekle

## 💡 Pro İpuçları

1. **Tutarlılık**: Tüm ekran görüntülerinde aynı font, renk ve stil kullanın
2. **Hikaye Anlatımı**: Ekran görüntüleri bir hikaye anlatmalı (oyun başlangıcından sona)
3. **Özellik Vurgulama**: Her ekran farklı bir özelliği vurgulamalı
4. **Minimal Metin**: Overlay metin kısa ve öz olmalı (maksimum 5-7 kelime)
5. **Yüksek Kontrast**: Overlay metin arka plandan net ayrılmalı
6. **Gerçek İçerik**: Placeholder veya test verisi kullanmayın
7. **Güncel Tutun**: Oyun güncellendiğinde ekran görüntülerini de güncelleyin
8. **A/B Test**: Farklı ekran görüntüleri deneyin ve hangisinin daha iyi performans gösterdiğini ölçün
