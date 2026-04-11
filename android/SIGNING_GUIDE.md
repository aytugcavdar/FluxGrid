# Android App Signing Guide - Uygulama İmzalama Rehberi

Bu doküman, FluxGrid uygulamasının Google Play Store'a yüklenmesi için gerekli release keystore oluşturma ve imzalama yapılandırmasını içerir.

## 📋 Genel Bakış

Android uygulamaları Google Play Store'a yüklenirken dijital olarak imzalanmalıdır. Bu imza:
- Uygulamanın geliştiricisini doğrular
- Uygulamanın değiştirilmediğini garanti eder
- Güncellemelerin aynı geliştirici tarafından yapıldığını doğrular

## ⚠️ ÖNEMLİ UYARILAR

1. **Keystore Dosyasını Asla Kaybetmeyin!**
   - Keystore dosyasını kaybederseniz, uygulamanızı güncelleyemezsiniz
   - Yeni bir keystore ile yeni bir uygulama olarak yayınlamanız gerekir
   - Tüm kullanıcılarınızı kaybedersiniz

2. **Keystore Şifresini Asla Unutmayın!**
   - Şifreyi unutursanız, keystore kullanılamaz hale gelir
   - Şifreyi güvenli bir yerde saklayın (password manager önerilir)

3. **Keystore'u Asla Paylaşmayın!**
   - Keystore dosyasını Git'e commit etmeyin
   - Keystore'u public olarak paylaşmayın
   - Sadece güvenilir ekip üyeleriyle paylaşın

4. **Yedek Alın!**
   - Keystore dosyasını birden fazla güvenli yerde saklayın
   - Cloud storage (Google Drive, Dropbox) kullanın
   - Fiziksel yedek alın (USB drive, external hard drive)

## 🔑 Keystore Oluşturma

### Adım 1: Java Keytool Kurulumu Kontrolü

Keystore oluşturmak için Java Development Kit (JDK) gereklidir.

**Kontrol Et**:
```bash
keytool -version
```

Eğer "command not found" hatası alırsanız, JDK'yı yükleyin:
- **Windows**: [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) veya [OpenJDK](https://adoptium.net/)
- **Mac**: `brew install openjdk`
- **Linux**: `sudo apt install openjdk-17-jdk`

### Adım 2: Keystore Dosyası Oluşturma

**Komut** (tek satırda çalıştırın):
```bash
keytool -genkey -v -keystore fluxgrid-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias fluxgrid
```

**Parametreler Açıklaması**:
- `-genkey`: Yeni bir key pair oluştur
- `-v`: Verbose (detaylı çıktı)
- `-keystore fluxgrid-release-key.jks`: Keystore dosya adı
- `-keyalg RSA`: RSA algoritması kullan
- `-keysize 2048`: 2048-bit key boyutu (güvenli)
- `-validity 10000`: 10000 gün geçerlilik (yaklaşık 27 yıl)
- `-alias fluxgrid`: Key alias (tanımlayıcı isim)

### Adım 3: Bilgileri Girin

Komut çalıştırıldığında aşağıdaki bilgiler sorulacak:

```
Enter keystore password: [ŞİFRE GİRİN - minimum 6 karakter]
Re-enter new password: [ŞİFREYİ TEKRAR GİRİN]

What is your first and last name?
  [Unknown]:  [İsim Soyisim veya Şirket Adı]

What is the name of your organizational unit?
  [Unknown]:  [Departman - örn: Development]

What is the name of your organization?
  [Unknown]:  [Şirket/Organizasyon Adı]

What is the name of your City or Locality?
  [Unknown]:  [Şehir]

What is the name of your State or Province?
  [Unknown]:  [İl/Eyalet]

What is the two-letter country code for this unit?
  [Unknown]:  [TR]

Is CN=[İsim], OU=[Departman], O=[Şirket], L=[Şehir], ST=[İl], C=TR correct?
  [no]:  yes

Enter key password for <fluxgrid>
        (RETURN if same as keystore password): [ENTER veya farklı şifre]
```

**Örnek Değerler**:
```
Keystore password: MySecurePassword123!
First and last name: Ahmet Yılmaz
Organizational unit: Development
Organization: FluxGrid Games
City: Istanbul
State: Istanbul
Country code: TR
Key password: [ENTER - keystore password ile aynı]
```

### Adım 4: Keystore Dosyasını Taşıma

Oluşturulan `fluxgrid-release-key.jks` dosyasını güvenli bir yere taşıyın:

**Önerilen Konum**:
```
android/fluxgrid-release-key.jks
```

**Veya** (daha güvenli):
```
~/.android/fluxgrid-release-key.jks
```

**Not**: Keystore dosyasını `android/` klasörüne koyarsanız, `.gitignore` dosyasında olduğundan emin olun!

## 🔧 Signing Yapılandırması

### Adım 1: key.properties Dosyası Oluşturma

`android/key.properties.example` dosyasını kopyalayın:

```bash
cd android
cp key.properties.example key.properties
```

### Adım 2: key.properties Dosyasını Düzenleme

`android/key.properties` dosyasını açın ve bilgileri girin:

```properties
# Android Release Signing Configuration
# NEVER commit this file to version control!

storeFile=fluxgrid-release-key.jks
storePassword=MySecurePassword123!
keyAlias=fluxgrid
keyPassword=MySecurePassword123!
```

**Parametreler**:
- `storeFile`: Keystore dosyasının yolu (relative veya absolute)
  - Relative: `fluxgrid-release-key.jks` (android/ klasöründe)
  - Absolute: `/Users/username/.android/fluxgrid-release-key.jks`
  - Windows: `C:\\Users\\username\\.android\\fluxgrid-release-key.jks`
- `storePassword`: Keystore şifresi (Adım 3'te girdiğiniz)
- `keyAlias`: Key alias (Adım 2'de belirttiğiniz - `fluxgrid`)
- `keyPassword`: Key şifresi (Adım 3'te girdiğiniz, genellikle storePassword ile aynı)

### Adım 3: .gitignore Kontrolü

`android/.gitignore` dosyasında aşağıdaki satırların olduğundan emin olun:

```gitignore
# Signing files
key.properties
*.jks
*.keystore
```

**Kontrol Et**:
```bash
cd android
cat .gitignore | grep -E "key.properties|\.jks|\.keystore"
```

Eğer yoksa, ekleyin:
```bash
echo "" >> .gitignore
echo "# Signing files" >> .gitignore
echo "key.properties" >> .gitignore
echo "*.jks" >> .gitignore
echo "*.keystore" >> .gitignore
```

## ✅ Yapılandırma Testi

### Test 1: Keystore Bilgilerini Görüntüleme

```bash
keytool -list -v -keystore android/fluxgrid-release-key.jks -alias fluxgrid
```

**Beklenen Çıktı**:
```
Enter keystore password: [ŞİFRE GİRİN]

Alias name: fluxgrid
Creation date: [TARİH]
Entry type: PrivateKeyEntry
Certificate chain length: 1
Certificate[1]:
Owner: CN=[İsim], OU=[Departman], O=[Şirket], L=[Şehir], ST=[İl], C=TR
Issuer: CN=[İsim], OU=[Departman], O=[Şirket], L=[Şehir], ST=[İl], C=TR
Serial number: [NUMARA]
Valid from: [BAŞLANGIÇ TARİHİ] until: [BİTİŞ TARİHİ]
Certificate fingerprints:
         SHA1: [FINGERPRINT]
         SHA256: [FINGERPRINT]
Signature algorithm name: SHA256withRSA
Subject Public Key Algorithm: 2048-bit RSA key
Version: 3
```

### Test 2: Release Build Oluşturma

```bash
cd android
./gradlew assembleRelease
```

**Beklenen Çıktı**:
```
BUILD SUCCESSFUL in [SÜRE]
```

**APK Konumu**:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Test 3: APK İmza Kontrolü

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

**Beklenen Çıktı**:
```
jar verified.
```

## 📦 Release Build Oluşturma

### Yöntem 1: Gradle (Önerilen)

**APK Oluşturma**:
```bash
cd android
./gradlew assembleRelease
```

**AAB (Android App Bundle) Oluşturma** (Google Play için önerilir):
```bash
cd android
./gradlew bundleRelease
```

**Çıktı Konumları**:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### Yöntem 2: Android Studio

1. Android Studio'da projeyi açın
2. **Build > Generate Signed Bundle / APK** seçin
3. **Android App Bundle** veya **APK** seçin
4. **Next** tıklayın
5. Keystore bilgilerini girin:
   - Key store path: `android/fluxgrid-release-key.jks`
   - Key store password: [ŞİFRE]
   - Key alias: `fluxgrid`
   - Key password: [ŞİFRE]
6. **Next** tıklayın
7. **release** build variant seçin
8. **Finish** tıklayın

## 🔐 Güvenlik En İyi Uygulamaları

### 1. Keystore Yedekleme

**Yedekleme Konumları**:
- ✅ Cloud storage (Google Drive, Dropbox, OneDrive)
- ✅ Password manager (1Password, LastPass, Bitwarden)
- ✅ External hard drive
- ✅ USB flash drive
- ✅ Şirket sunucusu (şifreli)

**Yedekleme Komutu**:
```bash
# Google Drive'a kopyala (manuel)
cp android/fluxgrid-release-key.jks ~/Google\ Drive/Backups/

# Şifreli zip oluştur
zip -e fluxgrid-keystore-backup.zip android/fluxgrid-release-key.jks android/key.properties
```

### 2. Şifre Yönetimi

**Öneriler**:
- Password manager kullanın (1Password, LastPass, Bitwarden)
- Güçlü şifre oluşturun (minimum 12 karakter, büyük/küçük harf, rakam, özel karakter)
- Şifreyi birden fazla yerde saklayın
- Şifreyi asla kod içinde saklamayın

**Örnek Güçlü Şifre**:
```
FluxGrid2024!Secure#Key
```

### 3. Erişim Kontrolü

**Kimler Erişebilir**:
- ✅ Lead developer
- ✅ DevOps engineer
- ✅ Release manager
- ❌ Junior developers (gerekmedikçe)
- ❌ Contractors (gerekmedikçe)

### 4. CI/CD Entegrasyonu

**GitHub Actions / GitLab CI için**:
- Keystore'u base64 encode edin
- Secret olarak ekleyin
- Build sırasında decode edin

**Örnek**:
```bash
# Encode
base64 android/fluxgrid-release-key.jks > keystore.base64

# GitHub Secrets'a ekle
# KEYSTORE_BASE64 = [keystore.base64 içeriği]
# KEYSTORE_PASSWORD = [şifre]
# KEY_ALIAS = fluxgrid
# KEY_PASSWORD = [şifre]

# Decode (CI/CD pipeline'da)
echo $KEYSTORE_BASE64 | base64 -d > android/fluxgrid-release-key.jks
```

## 🚨 Sorun Giderme

### Hata: "keytool: command not found"

**Çözüm**: JDK yükleyin
```bash
# Mac
brew install openjdk

# Ubuntu/Debian
sudo apt install openjdk-17-jdk

# Windows
# Oracle JDK veya OpenJDK indirin ve yükleyin
```

### Hata: "Keystore was tampered with, or password was incorrect"

**Çözüm**: Şifreyi kontrol edin
- `key.properties` dosyasındaki şifre doğru mu?
- Keystore oluştururken farklı bir şifre mi kullandınız?

### Hata: "Failed to read key fluxgrid from store"

**Çözüm**: Alias'ı kontrol edin
- `key.properties` dosyasındaki `keyAlias` doğru mu?
- Keystore'da hangi alias'lar var?
  ```bash
  keytool -list -keystore android/fluxgrid-release-key.jks
  ```

### Hata: "Execution failed for task ':app:packageRelease'"

**Çözüm**: ProGuard hatası olabilir
- `android/app/proguard-rules.pro` dosyasını kontrol edin
- Build log'unu inceleyin: `./gradlew assembleRelease --stacktrace`

### Hata: "INSTALL_PARSE_FAILED_NO_CERTIFICATES"

**Çözüm**: APK imzalanmamış
- `key.properties` dosyası var mı?
- `key.properties` dosyası doğru konumda mı?
- Keystore dosyası erişilebilir mi?

## 📋 Kontrol Listesi

Release öncesi kontrol edin:

- [ ] Keystore dosyası oluşturuldu (`fluxgrid-release-key.jks`)
- [ ] Keystore güvenli bir yerde saklanıyor
- [ ] Keystore yedeklendi (minimum 2 farklı yerde)
- [ ] `key.properties` dosyası oluşturuldu ve doğru bilgiler girildi
- [ ] `key.properties` ve `*.jks` dosyaları `.gitignore`'da
- [ ] Keystore şifresi güvenli bir yerde saklanıyor (password manager)
- [ ] Release build başarıyla oluşturuldu (`./gradlew assembleRelease`)
- [ ] APK imzası doğrulandı (`jarsigner -verify`)
- [ ] AAB (App Bundle) oluşturuldu (`./gradlew bundleRelease`)

## 🔗 Faydalı Kaynaklar

- [Android Developer - Sign Your App](https://developer.android.com/studio/publish/app-signing)
- [Google Play - App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Keytool Documentation](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html)
- [ProGuard Configuration](https://www.guardsquare.com/manual/configuration/usage)

## 📝 Notlar

### Google Play App Signing

Google Play, kendi yönettiği bir app signing sistemi sunar:
- Google, uygulamanızı kendi key'i ile imzalar
- Siz sadece "upload key" kullanırsınız
- Upload key'i kaybederseniz, Google'a başvurarak sıfırlayabilirsiniz
- **Önerilir**: İlk yüklemede Google Play App Signing'i etkinleştirin

### Keystore Bilgileri Kaydetme

Aşağıdaki bilgileri güvenli bir yerde saklayın:

```
Keystore Bilgileri - FluxGrid
================================
Keystore Dosyası: fluxgrid-release-key.jks
Keystore Şifresi: [ŞİFRE]
Key Alias: fluxgrid
Key Şifresi: [ŞİFRE]
Oluşturma Tarihi: [TARİH]
Geçerlilik Süresi: 10000 gün (yaklaşık 27 yıl)
SHA1 Fingerprint: [FINGERPRINT]
SHA256 Fingerprint: [FINGERPRINT]
Yedek Konumları:
- Google Drive: /Backups/fluxgrid-keystore-backup.zip
- External HDD: /Backups/fluxgrid-keystore-backup.zip
- Password Manager: 1Password - FluxGrid Keystore
```

### Keystore Yenileme

Keystore'un geçerlilik süresi dolmadan önce (27 yıl sonra):
1. Yeni keystore oluşturun
2. Uygulamayı yeni keystore ile imzalayın
3. Google Play Console'da key'i güncelleyin (Google Play App Signing kullanıyorsanız)

**Not**: Normal şartlarda 27 yıl yeterli olacaktır, ancak yine de yedeklemeyi unutmayın!
