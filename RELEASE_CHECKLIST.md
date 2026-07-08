# FluxGrid Release Checklist

Bu dosya cikis oncesi donem icin tek takip listesi olsun. Bu asamada yeni oyun ozelligi ekleme; sadece bug, isi, denge, tutorial ve Play hazirligi.

## 1. Kritik Bug Akislari

- [ ] Uygulama acilisi: logo, hazirlaniyor ekrani, ana menu gecisi.
- [ ] Sonsuz mod: yeni oyun, cik, tekrar gir, Devam Et, kaybet, Devam Et kartinin kaybolmasi.
- [ ] Timed mod: yeni oyun, sure kazanimi, son 10 saniye, kaybetme akisi.
- [ ] Arka plan: oyundayken home tusu, ekran kilidi, uygulamaya geri donus.
- [ ] Internet yokken: oyun aciliyor, reklam hatasi oyunu kilitlemiyor.
- [ ] Reklam akisi: banner yer kaplamasi, odullu reklam iptal/basari durumlari.

## 2. Isi ve Performans

- [ ] Low-end Android cihazda Sonsuz mod 25 dakika test.
- [ ] Low-end Android cihazda Timed mod 15 dakika test.
- [ ] Ana menude surekli animasyon/loop yok.
- [ ] Oyun beklerken canvas sadece degisiklikte ciziyor.
- [ ] Arka planda requestAnimationFrame ve timerlar duruyor.
- [ ] Floating score, combo, tier ve HUD efektleri low-end cihazda sade.

Hedef olcum:
- Baslangic sicakligi kaydedilecek.
- 2, 4, 8, 15, 20, 25. dakikalar kaydedilecek.
- Takilma, dokunma gecikmesi ve FPS dususu not alinacak.

## 3. Denge

- [ ] Ilk 200k puan cok hizli gelmiyor.
- [ ] Ilk 5 dakika sikici degil.
- [ ] Combo carpani sacma skor uretmiyor.
- [ ] Tier 0-6 arasi zorluk okunabilir sekilde artiyor.
- [ ] Tier 6 sonrasi gravity/ozel blok ritmi oyuncuyu kilitlemiyor.
- [ ] Timed modda sure kazanimi ve skor kasma suistimali yok.

## 4. Tutorial

- [ ] Tutorial 2D oyun masasi diliyle uyumlu.
- [ ] Ilk parca yerlestirme anlasilir.
- [ ] Satir/sutun clear anlatimi anlasilir.
- [ ] Clear sonrasi blok dususu anlatiliyor.
- [ ] Combo kisa ve net anlatiliyor.
- [ ] Timed modda clear ile sure kazanimi anlatiliyor.
- [ ] Atla/tekrar goster akisi calisiyor.

## 5. Google Play Hazirligi

- [ ] `versionCode` onceki Play yuklemesinden buyuk.
- [ ] `versionName`, `package.json` ve Capacitor user-agent uyumlu.
- [ ] Release AAB uretiliyor.
- [ ] Release imzasi `android/key.properties` ile calisiyor.
- [ ] Privacy Policy URL calisiyor.
- [ ] Data Safety formu AdMob, Firebase Analytics, Crashlytics icin dogru.
- [ ] Reklam var/yok bilgisi Play Console'da dogru.
- [ ] Content rating tamam.
- [ ] Hedef kitle ve aile politikasi kontrol edildi.
- [ ] Ekran goruntuleri: ana menu, oyun, clear, tier/ozel blok, timed mod.

## 6. Release Gate

Production'a cikmadan once:
- [ ] `npm run build:android`
- [ ] `npm run cap:sync`
- [ ] `npm run android:bundle`
- [ ] En az 2 farkli Android cihazda smoke test
- [ ] En az 1 low-end cihazda isi testi
- [ ] Closed/internal test feedback kontrolu
