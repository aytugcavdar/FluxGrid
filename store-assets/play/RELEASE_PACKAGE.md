# FluxGrid Google Play Yayın Paketi

## Yüklenecek dosyalar

- Uygulama simgesi: `icon-512-final.png` (512x512 PNG)
- Özellik grafiği: `feature-graphic.png` (1024x500 PNG)
- Türkçe ekran görüntüleri: `screenshots/tr-TR/01-gameplay-final.png`, `02-statistics-final.png`, `03-achievements-final.png`, `04-settings-final.png`
- İngilizce ekran görüntüleri: `screenshots/en-US/02-achievements-final.png`, `03-settings-final.png`
- Türkçe metin: `listing/tr-TR.md`
- İngilizce metin: `listing/en-US.md`
- Console form cevapları: `PLAY_CONSOLE_FORMS_TR.md`

## Gönderim öncesi zorunlu kontroller

- Gizlilik URL'sini gizli sekmede aç ve herkese açık olduğunu doğrula.
- `privacy@fluxgrid.app` ve `support@fluxgrid.app` adreslerinin e-posta alabildiğini doğrula.
- Üretim AAB'sinde test reklam kimlikleri yerine doğru üretim kimliklerinin kullanıldığını `npm run ads:check:production` ile doğrula.
- UMP gizlilik seçeneklerinin EEA test cihazında açıldığını doğrula.
- Data Safety beyanını son üretim AAB'sindeki SDK'larla tekrar karşılaştır.
- Kapalı test sürümünde ödüllü reklam, başarısız reklam, banner yerleşimi ve oyun sonu geçiş reklamını gerçek cihazda dene.

`*-raw.png` dosyaları kaynak görüntülerdir; Play Console'a yalnızca `*-final.png` dosyalarını yükle.

