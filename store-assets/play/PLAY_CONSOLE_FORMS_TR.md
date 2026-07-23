# FluxGrid - Google Play Console Form Rehberi

Bu dosya, mevcut Android paketi ve kullanılan SDK'lar incelenerek hazırlanmıştır. Play Console sorularının metni zamanla değişebilir; gönderim ekranında seçenekleri bu anlamlara göre işaretle.

## Temel bilgiler

- Uygulama türü: Oyun
- Kategori: Bulmaca
- Ücret: Ücretsiz
- Uygulama içi satın alma: Hayır
- Kullanıcı hesabı/giriş: Hayır
- Reklam içeriyor: Evet
- Uygulama erişimi: Tüm özellikler giriş veya özel talimat olmadan kullanılabilir
- Hedef kitle önerisi: 13-15, 16-17 ve 18+
- 13 yaş altı çocukları hedefleme: Hayır

## Reklam beyanı

`Uygulamanız reklam içeriyor mu?` sorusuna **Evet** yanıtı ver.

Kullanılan formatlar:

- Oyun ekranında banner
- Sonsuz modda isteğe bağlı devam hakkı için ödüllü reklam
- Oyun bittikten sonra frekans sınırına bağlı geçiş reklamı

Oyunun kendisi kumar, bahis veya gerçek para ödülü içermez. Reklam içeriği AdMob üzerinden gelir. AdMob'da maksimum reklam içerik derecelendirmesini hedeflediğin mağaza derecesiyle uyumlu biçimde `G` olarak ayarlamak güvenli başlangıçtır.

## Veri Güvenliği

### Genel sorular

- Uygulama veri topluyor veya paylaşıyor mu: **Evet**
- Aktarım sırasında veriler şifreleniyor mu: **Evet**
- Kullanıcı hesabı oluşturulabiliyor mu: **Hayır**
- Kullanıcılar veri silme talep edebilir mi: **Evet**; `privacy@fluxgrid.app` üzerinden uzaktaki bildirim verileri için talep alınır. Cihazdaki oyun verileri Ayarlar > Verileri Sıfırla veya uygulamayı kaldırma yoluyla silinir.
- Veri toplama zorunlu mu: Reklam ve temel tanılama verileri uygulama/SDK çalışırken otomatik olabilir. Bildirim token'ı yalnızca kullanıcı bildirim izni verirse toplanır.

### Beyan edilecek veri türleri

| Veri türü | Toplanıyor | Paylaşılıyor | Amaçlar | Not |
|---|---:|---:|---|---|
| Yaklaşık konum | Evet | Evet | Reklam, analiz, dolandırıcılığı önleme | AdMob IP adresinden genel konum tahmini yapabilir; GPS kullanılmaz. |
| Uygulama etkileşimleri | Evet | Evet | Analiz, reklam | Açılışlar, reklam gösterimleri ve etkileşim sinyalleri. |
| Çökme günlükleri | Evet | Hayır* | Uygulama işlevselliği, analiz | Firebase Crashlytics. |
| Tanılama / performans | Evet | Evet | Uygulama işlevselliği, analiz, dolandırıcılığı önleme | Çökme durumu, başlatma süresi, cihaz/uygulama teknik bilgileri. |
| Cihaz veya diğer kimlikler | Evet | Evet | Reklam, analiz, dolandırıcılığı önleme, bildirim | Reklam kimliği, App Set/Firebase kurulum kimlikleri, Crashlytics UUID ve izin verilirse FCM token'ı. |

`*` Play Console, hizmet sağlayıcıya yapılan aktarımı bazı koşullarda “paylaşma” saymayabilir. AdMob verileri için paylaşımı **Evet** işaretle. Crashlytics satırında Console'un hizmet sağlayıcı açıklamasını okuyup son SDK yapılandırmasına göre onayla.

### Toplanmayan hassas veri türleri

- Kesin konum/GPS
- Ad, e-posta veya telefon numarası
- Kişiler
- Fotoğraf, video veya ses
- Sağlık, finans veya ödeme bilgileri
- Mesajlar
- Dosyalar ve belgeler

## İçerik derecelendirme

IARC formunda mevcut içerik için:

- Şiddet veya yaralanma tasviri: Hayır
- Korku/rahatsız edici içerik: Hayır
- Cinsellik veya çıplaklık: Hayır
- Küfür: Hayır
- Alkol, tütün veya uyuşturucu: Hayır
- Kumar ya da simüle kumar: Hayır
- Kullanıcı tarafından oluşturulan içerik: Hayır
- Kullanıcılar arası iletişim: Hayır
- Gerçek para ödülü: Hayır
- Dijital ürün satın alma: Hayır

Bomba, buz ve virüs yalnızca soyut blok bulmaca mekanikleridir; insan, hayvan veya gerçekçi zarar göstermez. Nihai yaş derecesini IARC verir.

## Gizlilik politikası

Play Console'a verilecek tercih edilen URL:

`https://fluxgrid-d0ad3.web.app/privacy-policy.html`

Gönderimden önce URL'yi gizli sekmede aç. Sayfa herkese açık olmalı, giriş istememeli, PDF olmamalı ve geliştirici/uygulama adı ile iletişim adresini göstermeli.

## İçerik ve hedef kitle notu

13 yaş altını hedeflemiyorsan mağaza görselleri ve açıklamalarında özellikle çocuklara yönelik dil kullanma. Bu seçim AdMob/UMP ayarları ve gerçek reklam içeriğiyle uyumlu kalmalıdır.

## Resmi referanslar

- [Play mağaza kaydı ve grafik varlık gereksinimleri](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Veri Güvenliği formu](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Kullanıcı verileri ve gizlilik politikası](https://support.google.com/googleplay/android-developer/answer/10144311)
- [AdMob Google Play veri açıklaması](https://developers.google.com/admob/android/privacy/play-data-disclosure)
- [Firebase Google Play veri açıklaması](https://firebase.google.com/docs/android/play-data-disclosure)
