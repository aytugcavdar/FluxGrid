# FluxGrid Tier Sistemi - Derinlemesine Analiz

## 📊 Genel Bakış

FluxGrid'in tier (zorluk seviyesi) sistemi, oyuncunun skoruna göre dinamik olarak değişen 7 seviyeli (Tier 0-6) bir progresyon sistemidir. Bu sistem yalnızca **ENDLESS** modunda aktiftir ve oyun deneyimini skorla birlikte giderek zorlaştırır.

---

## 🎯 Tier Seviyeleri ve Eşik Değerleri

### Mevcut Tier Yapısı

| Tier | Skor Aralığı | İsim | Açıklama |
|------|-------------|------|----------|
| **0** | 0 - 999 | Beginner (Başlangıç) | Öğrenme aşaması, temel mekanikler |
| **1** | 1,000 - 2,999 | Advanced (İleri) | İlk zorluk artışı, ICE_STORM eventi |
| **2** | 3,000 - 6,999 | Expert (Uzman) | GRAVITY_RUSH eventi aktif |
| **3** | 7,000 - 13,999 | Master (Usta) | QUAKE eventi, ciddi zorluk |
| **4** | 14,000 - 24,999 | Legend (Efsane) | MIRROR eventi, yüksek beceri gerekli |
| **5** | 25,000 - 44,999 | Chaos (Kaos) | CHAOS eventi, sürekli değişim |
| **6** | 45,000+ | Void (Boşluk) | VOID eventi, maksimum zorluk |

### Tier Geçiş Eşikleri (TIER_THRESHOLDS)
```typescript
[0, 1000, 3000, 7000, 14000, 25000, 45000]
```

---

## 💰 Skor Çarpanları (Score Multipliers)

Tier sistemi, oyuncunun kazandığı puanları çarpanlarla artırır. Bu, yüksek tier'larda daha hızlı ilerlemeyi sağlar.

### Tier Bazlı Skor Çarpanları

| Tier | Çarpan | Artış Oranı | Örnek (100 puan) |
|------|--------|-------------|------------------|
| 0 | 1.0x | - | 100 puan |
| 1 | 1.15x | +15% | 115 puan |
| 2 | 1.35x | +35% | 135 puan |
| 3 | 1.6x | +60% | 160 puan |
| 4 | 2.0x | +100% | 200 puan |
| 5 | 2.5x | +150% | 250 puan |
| 6 | 3.0x | +200% | 300 puan |

### Çarpan Progresyonu Analizi

```
Tier 0→1: +15% artış (yumuşak başlangıç)
Tier 1→2: +17.4% artış (kademeli artış)
Tier 2→3: +18.5% artış (ivmelenme)
Tier 3→4: +25% artış (büyük sıçrama)
Tier 4→5: +25% artış (tutarlı artış)
Tier 5→6: +20% artış (son zirve)
```

**Tasarım Felsefesi:**
- İlk tier'lar yumuşak artış (oyuncuyu alıştırma)
- Orta tier'lar hızlı artış (momentum kazanma)
- Son tier'lar yüksek ödül (ustaları ödüllendirme)

---

## ⚡ Flux Çarpanları (Flux Multipliers)

Flux, oyuncunun yetenekleri kullanmak için ihtiyaç duyduğu kaynaktır. Tier arttıkça flux kazanımı da artar.

### Tier Bazlı Flux Çarpanları

| Tier | Çarpan | Artış Oranı | Örnek (20 flux) |
|------|--------|-------------|-----------------|
| 0 | 1.0x | - | 20 flux |
| 1 | 1.1x | +10% | 22 flux |
| 2 | 1.2x | +20% | 24 flux |
| 3 | 1.3x | +30% | 26 flux |
| 4 | 1.5x | +50% | 30 flux |
| 5 | 1.7x | +70% | 34 flux |
| 6 | 2.0x | +100% | 40 flux |

### Flux Kazanım Formülü
```typescript
baseFlux = (blocks × 2) + (lines × 10)
finalFlux = Math.min(100, baseFlux × tierFluxMultiplier × miniEventMultiplier)
```

**Önemli:** Flux maksimum 100 ile sınırlıdır.

---

## 🎪 Tier Bazlı Event Sistemi

Her tier, kendine özgü bir event (olay) tetikler. Bu eventler oyunu zorlaştırır ve çeşitlendirir.

### Event Tablosu

| Tier | Event | Süre | Açıklama | Zorluk |
|------|-------|------|----------|--------|
| 1 | ICE_STORM | 10 hamle | Grid'e 2 buz bloğu spawn eder | ⭐ |
| 2 | GRAVITY_RUSH | 10 hamle | Bloklar yukarı doğru kayar | ⭐⭐ |
| 3 | QUAKE | 8 hamle | Rastgele bloklar kaybolur | ⭐⭐⭐ |
| 4 | MIRROR | 10 hamle | Grid ayna etkisi ile ters çevrilir | ⭐⭐⭐⭐ |
| 5 | CHAOS | 12 hamle | Her 4 hamlede rastgele event tetiklenir | ⭐⭐⭐⭐⭐ |
| 6 | VOID | 10 hamle | Her 5 hamlede rastgele bloklar kaybolur | ⭐⭐⭐⭐⭐⭐ |

### Event Cooldown (Bekleme Süresi)

Event bittikten sonra yeni event tetiklenmeden önce geçmesi gereken hamle sayısı:

| Tier | Cooldown (hamle) |
|------|------------------|
| 1 | 5 hamle |
| 2 | 4 hamle |
| 3 | 3 hamle |
| 4 | 2 hamle |
| 5 | 1 hamle |
| 6 | 0 hamle (anında) |

**Analiz:** Tier arttıkça eventler daha sık tetiklenir, oyun daha kaotik hale gelir.

---

## 🎁 Mini-Event Sistemi

Mini-eventler, tier'a göre daha sık tetiklenen kısa süreli bonuslardır.

### Mini-Event Türleri

| Mini-Event | Etki | Süre | Çarpan |
|------------|------|------|--------|
| FLUX_SURGE | Flux kazanımı 2x | 10 hamle | 2.0x |
| SCORE_RUSH | Skor kazanımı 1.5x | 10 hamle | 1.5x |
| CLEAR_BONUS | Satır temizleme 3x | 1 kullanım | 3.0x |
| COMBO_SHIELD | Combo koruması | 1 kullanım | - |
| PIECE_BLESSING | Daha iyi parçalar | 5 hamle | - |

### Tier Bazlı Mini-Event Frekansları

#### Tier 0-2 (Başlangıç)
| Mini-Event | Tetiklenme Aralığı |
|------------|-------------------|
| FLUX_SURGE | Her 50 hamlede |
| SCORE_RUSH | Her 100 hamlede |
| CLEAR_BONUS | Her 150 hamlede |
| COMBO_SHIELD | Her 200 hamlede |
| PIECE_BLESSING | Her 250 hamlede |

#### Tier 3-4 (Orta Seviye)
| Mini-Event | Tetiklenme Aralığı |
|------------|-------------------|
| FLUX_SURGE | Her 40 hamlede (-20%) |
| SCORE_RUSH | Her 80 hamlede (-20%) |
| CLEAR_BONUS | Her 120 hamlede (-20%) |
| COMBO_SHIELD | Her 160 hamlede (-20%) |
| PIECE_BLESSING | Her 200 hamlede (-20%) |

#### Tier 5-6 (İleri Seviye)
| Mini-Event | Tetiklenme Aralığı |
|------------|-------------------|
| FLUX_SURGE | Her 30 hamlede (-40%) |
| SCORE_RUSH | Her 60 hamlede (-40%) |
| CLEAR_BONUS | Her 90 hamlede (-40%) |
| COMBO_SHIELD | Her 120 hamlede (-40%) |
| PIECE_BLESSING | Her 150 hamlede (-40%) |

**Analiz:** Yüksek tier'larda mini-eventler çok daha sık tetiklenir, bu da oyuncuya zorluğa karşı daha fazla araç sağlar.

---

## 🛡️ Rescue (Kurtarma) Mekanizması

Rescue mekanizması, grid doluluk oranına göre oyuncuya yardım eder. Tier arttıkça kurtarma daha erken devreye girer.

### Tier Bazlı Rescue Eşikleri

| Tier Grubu | Doluluk Eşiği | Açıklama |
|------------|---------------|----------|
| Tier 0-2 | 75% | Grid %75 dolduğunda rescue |
| Tier 3-4 | 70% | Grid %70 dolduğunda rescue (daha erken) |
| Tier 5-6 | 65% | Grid %65 dolduğunda rescue (çok erken) |

**Tasarım Mantığı:** Yüksek tier'larda oyun daha zor olduğu için rescue mekanizması daha erken devreye girer ve oyuncuya daha fazla yardım eder.

---

## 📈 Tier Progresyon Eğrisi

### Skor Gereksinimleri Analizi

```
Tier 0→1: 1,000 puan gerekli
Tier 1→2: 2,000 puan gerekli (+100% artış)
Tier 2→3: 4,000 puan gerekli (+100% artış)
Tier 3→4: 7,000 puan gerekli (+75% artış)
Tier 4→5: 11,000 puan gerekli (+57% artış)
Tier 5→6: 20,000 puan gerekli (+82% artış)
```

### Logaritmik Progresyon

Tier sistemi **logaritmik progresyon** kullanır. Bu şu anlama gelir:
- İlk tier'lar hızlı geçilir (oyuncuyu motive eder)
- Orta tier'lar dengeli ilerler
- Son tier'lar uzun sürer (ustaları ödüllendirir)

### Ortalama Oyun Süresi Tahmini

Varsayımlar:
- Ortalama hamle başına 50 puan
- Ortalama tier çarpanı 1.5x

| Tier | Gerekli Skor | Tahmini Hamle | Tahmini Süre |
|------|-------------|---------------|--------------|
| 0→1 | 1,000 | ~20 hamle | 2-3 dakika |
| 1→2 | 2,000 | ~35 hamle | 3-5 dakika |
| 2→3 | 4,000 | ~60 hamle | 6-8 dakika |
| 3→4 | 7,000 | ~90 hamle | 10-12 dakika |
| 4→5 | 11,000 | ~120 hamle | 15-18 dakika |
| 5→6 | 20,000 | ~180 hamle | 25-30 dakika |

**Toplam Tier 6'ya ulaşma süresi:** ~50-75 dakika (uzman oyuncu için)

---

## 🎮 Oyun Modu İzolasyonu

Tier sistemi **sadece ENDLESS modunda** aktiftir. Diğer modlarda tier değeri 0 olarak geçilir.

### Mod Bazlı Tier Kullanımı

| Oyun Modu | Tier Aktif mi? | Açıklama |
|-----------|----------------|----------|
| ENDLESS | ✅ Evet | Tam tier sistemi aktif |
| TIMED | ❌ Hayır | Tier = 0, çarpanlar yok |
| DAILY_CHALLENGE | ❌ Hayır | Tier = 0, çarpanlar yok |
| ZEN | ❌ Hayır | Tier = 0, eventler yok |

**Kod Örneği:**
```typescript
// gameStore.ts içinde
const effectiveTier = gameMode === GameMode.ENDLESS ? difficultyTier : 0;
const scoreMultiplier = getTierScoreMultiplier(effectiveTier);
```

---

## 🔄 Tier Migration (Geçiş) Sistemi

Oyun güncellendiğinde eski save dosyalarındaki tier değerleri yeniden hesaplanır.

### Migration Süreci

1. **Eski save dosyası yüklenir**
2. **Skor korunur** (asla değişmez)
3. **Tier yeniden hesaplanır** (yeni eşiklere göre)
4. **Save version güncellenir** (v3)

### Örnek Migration Senaryoları

#### Senaryo 1: Tier Düşüşü
```
Eski sistem: 2000 puan = Tier 2
Yeni sistem: 2000 puan = Tier 1
Sonuç: Oyuncu Tier 1'e düşer (ama skoru korunur)
```

#### Senaryo 2: Tier Artışı
```
Eski sistem: 50000 puan = Tier 5
Yeni sistem: 50000 puan = Tier 6
Sonuç: Oyuncu Tier 6'ya yükselir
```

#### Senaryo 3: Eşik Değerinde
```
Skor: 7000 puan (tam Tier 3 eşiği)
Sonuç: Tier 3 olarak hesaplanır (>= kontrolü)
```

---

## 💡 Tasarım Önerileri ve İyileştirmeler

### 1. Tier İsimlendirme Sistemi

**Mevcut Durum:** Tier'lar sadece sayılarla ifade ediliyor (Tier 0, Tier 1, vb.)

**Öneri:** Her tier'a özel isimler ve temalar eklenebilir:

| Tier | Önerilen İsim | Tema | Renk |
|------|---------------|------|------|
| 0 | Novice (Acemi) | Öğrenme | 🟢 Yeşil |
| 1 | Apprentice (Çırak) | Gelişme | 🔵 Mavi |
| 2 | Adept (Usta Adayı) | Ustalık | 🟣 Mor |
| 3 | Expert (Uzman) | Hakimiyet | 🟠 Turuncu |
| 4 | Master (Usta) | Mükemmellik | 🔴 Kırmızı |
| 5 | Grandmaster (Büyük Usta) | Efsane | 🟡 Altın |
| 6 | Transcendent (Aşkın) | İmkansız | ⚫ Siyah |

### 2. Tier Geçiş Animasyonları

**Öneri:** Tier atlama anında:
- Ekran titremesi (screen shake)
- Parçacık efektleri
- Ses efekti
- "TIER UP!" bildirimi
- Yeni tier isminin gösterimi

### 3. Tier Bazlı Görsel Değişiklikler

**Öneri:** Her tier'da oyunun görünümü değişebilir:
- Grid renk paleti değişimi
- Arka plan efektleri
- Parça renkleri
- UI tema değişimi

### 4. Tier Ödül Sistemi

**Öneri:** Her tier'a ulaşıldığında ödül:
- Flux bonusu (örn: Tier 3'e ulaşınca +50 flux)
- Özel achievement
- Yeni yetenek kilidi açılması
- Kozmetik ödüller

### 5. Tier Zorluk Dengeleme

**Mevcut Sorunlar:**
- Tier 5-6 arası sıçrama çok büyük (20,000 puan)
- Tier 0-1 arası çok kolay (1,000 puan)

**Öneri: Yeniden Dengelenmiş Eşikler**
```typescript
// Daha dengeli progresyon
TIER_THRESHOLDS = [0, 1500, 4000, 9000, 18000, 32000, 55000]
```

Bu değişiklik:
- İlk tier'ı biraz zorlaştırır (1000→1500)
- Orta tier'ları dengeler
- Son tier'ları daha erişilebilir yapar

### 6. Dinamik Zorluk Ayarlama

**Öneri:** Oyuncunun performansına göre tier progresyonu:
- Çok iyi performans → Daha hızlı tier atlama
- Zayıf performans → Daha yavaş tier atlama
- Adaptive difficulty (uyarlanabilir zorluk)

### 7. Tier Bazlı Leaderboard

**Öneri:** Her tier için ayrı liderlik tablosu:
- "Tier 3'te En Yüksek Skor"
- "Tier 6'ya En Hızlı Ulaşan"
- "Tier 5'te En Uzun Süre Kalan"

### 8. Tier Downgrade Mekanizması

**Tartışmalı Öneri:** Oyuncu çok kötü performans gösterirse tier düşebilir mi?

**Artılar:**
- Daha dinamik oyun deneyimi
- Zorluk oyuncuya adapte olur
- Frustration azalır

**Eksiler:**
- Oyuncu motivasyonu düşebilir
- Progresyon hissi kaybolur
- Karmaşık implementasyon

**Karar:** Şu an için tier downgrade olmamalı, sadece yukarı doğru progresyon olmalı.

---

## 📊 Tier Sistemi Metrikleri

### Oyuncu Davranış Analizi İçin Öneriler

Aşağıdaki metrikleri takip ederek tier sistemini optimize edebilirsiniz:

1. **Tier Dağılımı**
   - Oyuncuların %kaçı hangi tier'a ulaşıyor?
   - Ortalama tier seviyesi nedir?

2. **Tier Geçiş Süreleri**
   - Her tier'a ulaşmak ortalama kaç dakika sürüyor?
   - Hangi tier'lar darboğaz oluşturuyor?

3. **Tier Bazlı Churn (Oyundan Ayrılma)**
   - Oyuncular hangi tier'da oyunu bırakıyor?
   - Tier 3-4 arası kritik mi?

4. **Tier Bazlı Retention (Oyunda Kalma)**
   - Hangi tier'daki oyuncular daha uzun süre oynuyor?
   - Tier 6'ya ulaşanlar ne kadar aktif?

5. **Event Etkileşimi**
   - Hangi tier eventleri en çok seviliy