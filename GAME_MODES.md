# Oyun Modları - Teknik Dokümantasyon

Bu dokümantasyon, oyundaki tüm modların özelliklerini, mekaniklerini ve sistemlerini detaylı bir şekilde açıklar.

---

## 📋 İçindekiler

1. [Oyun Modları](#oyun-modları)
2. [Özel Bloklar](#özel-bloklar)
3. [Event Sistemi](#event-sistemi)
4. [Tier Sistemi](#tier-sistemi)
5. [Combo ve Streak Sistemi](#combo-ve-streak-sistemi)
6. [Skor Hesaplama](#skor-hesaplama)
7. [Başarımlar](#başarımlar)

---

## 🎮 Oyun Modları

### 1. ENDLESS Mode (Sonsuz Mod)

**Açıklama**: Ana oyun modu. Oyuncu yer kalmadığı sürece oynar, tier sistemi ile zorluk artar.

**Özellikler**:
- ✅ Tier progression (0-6 arası zorluk seviyeleri)
- ✅ Event sistemi (ICE_STORM, GRAVITY_RUSH, QUAKE, MIRROR, CHAOS, VOID)
- ✅ Özel bloklar (BOMB, ICE, LIGHTNING, TARGET, DIAMOND)
- ✅ Streak sistemi (ardışık satır temizleme bonusu)
- ✅ Milestone sistemi (10K, 25K, 50K, 100K)
- ✅ Combo timer (10 saniye içinde yeni satır temizle)
- ✅ Rescue mechanism (yüksek tier'larda daha erken kurtarma)

**Skor Çarpanları**:
- Tier multiplier: 1.0x → 3.0x (Tier 0-6)
- Event multiplier: 1.2x (default), 1.3x (QUAKE)
- Streak multiplier: 1.0x → 4.0x (0-4 streak)
- Color bonus: 1.5x (tek renk satır/sütun)

**Tier Thresholds**:
```
Tier 0: 0 puan
Tier 1: 5,000 puan
Tier 2: 15,000 puan
Tier 3: 30,000 puan
Tier 4: 55,000 puan
Tier 5: 90,000 puan
Tier 6: 140,000 puan
```

**Rescue Density Thresholds**:
```
Tier 0-2: 75% dolulukta kurtarma
Tier 3-4: 70% dolulukta kurtarma
Tier 5-6: 65% dolulukta kurtarma
```

---

### 2. TIMED Mode (Zamana Karşı Mod)

**Açıklama**: 60 saniye içinde maksimum skor yapma modu. Hız ve combo odaklı.

**Özellikler**:
- ⏱️ 60 saniye başlangıç süresi
- ⚡ CHRONO blokları (+5 saniye bonus)
- 🔥 COMBO_RUSH sistemi (combo 4'te aktif, 3 hamle sürer)
- 🏃 Final Sprint Bonus (son 10 saniyede 1.5x çarpan)
- ⏰ Combo Timer (10 saniye içinde yeni satır temizle)
- ❌ Tier sistemi YOK
- ❌ Event sistemi YOK
- ❌ Streak sistemi YOK

**Zaman Mekanikleri**:
- **Satır temizleme**: +2 saniye per satır
- **Combo bonusu**: +0.5 saniye (combo > 1)
- **Combo kırılma cezası**: -1 saniye (önceki combo > 0, şimdi 0)
- **CHRONO bonus**: +5 saniye per CHRONO bloğu
- **Maksimum süre**: 60 saniye (CHRONO ile 75 saniye)

**COMBO_RUSH Sistemi**:
```
Aktivasyon: Combo 4'e ulaştığında
Süre: 3 hamle
Etki: Combo kırılmaz (minimum 1'de kalır)
```

**Final Sprint Bonus**:
```
Aktivasyon: Son 10 saniye
Çarpan: 1.5x
Hesaplama: basePoints × 0.5 × quakeMultiplier × passiveMultiplier
```

**CHRONO Blok**:
```typescript
{
  color: '#fde68a',  // Altın sarısı
  icon: '⏱',
  glowColor: '#fbbf24',
  type: 'CHRONO',
  bonusSeconds: 5
}
```

---

### 3. DAILY_CHALLENGE Mode (Günlük Meydan Okuma)

**Açıklama**: Günlük puzzle modu. Herkes aynı puzzle'ı çözer.

**Özellikler**:
- 📅 Günlük yenilenen puzzle
- 🎯 Sabit piece dizilimi (seed-based)
- 📊 Clear history tracking (paylaşım için)
- ❌ Tier sistemi YOK
- ❌ Event sistemi YOK
- ❌ Özel bloklar YOK (sadece normal bloklar)

**Clear History**:
- Son 6 satır temizleme kaydedilir
- Paylaşım için snapshot alınır
- 4x4 grid formatında saklanır

---

## 🎲 Özel Bloklar

### Spawn Rates (Toplam 40%)

```typescript
NORMAL: 60%    // Normal bloklar
ICE: 7%        // Buz blokları
BOMB: 8%       // Bomba blokları
LIGHTNING: 5%  // Yıldırım blokları
TARGET: 10%    // Hedef blokları
DIAMOND: 10%   // Elmas blokları
```

---

### 1. BOMB (Bomba Bloğu)

**Açıklama**: Satır/sütun temizlendiğinde 3x3 alanda patlar.

**Özellikler**:
```typescript
{
  type: 'BOMB',
  explosionRadius: 1,  // 3x3 alan (radius 1)
  spawnRate: 0.08      // 8%
}
```

**Mekanik**:
- Satır/sütun temizlendiğinde tetiklenir
- Etrafındaki 3x3 alandaki tüm blokları temizler
- Chain reaction oluşturabilir
- Bomba patlaması stats'a kaydedilir

---

### 2. ICE (Buz Bloğu)

**Açıklama**: 2 kez vurulması gereken dayanıklı blok.

**Özellikler**:
```typescript
{
  type: 'ICE',
  health: 2,           // 2 kez vurulmalı
  spawnRate: 0.07      // 7%
}
```

**Mekanik**:
- İlk vuruşta health 2 → 1
- İkinci vuruşta temizlenir
- Görsel olarak çatlak gösterir
- Buz kırma stats'a kaydedilir

---

### 3. LIGHTNING (Yıldırım Bloğu)

**Açıklama**: Satır/sütun temizlendiğinde tüm satır VE sütunu temizler.

**Özellikler**:
```typescript
{
  color: '#fbbf24',        // Altın/Sarı
  icon: '⚡',
  glowColor: '#f59e0b',
  type: 'LIGHTNING',
  spawnRate: 0.05          // 5%
}
```

**Mekanik**:
- Satır temizlendiğinde → tüm sütunu temizler
- Sütun temizlendiğinde → tüm satırı temizler
- Çapraz temizleme etkisi
- Massive chain reaction potansiyeli

---

### 4. TARGET (Hedef Bloğu)

**Açıklama**: Satır/sütun temizlendiğinde 3x3 alanda temizlik yapar.

**Özellikler**:
```typescript
{
  color: '#f97316',        // Turuncu
  icon: '🎯',
  glowColor: '#ea580c',
  type: 'TARGET',
  spawnRate: 0.10,         // 10%
  clearRadius: 1           // 3x3 alan
}
```

**Mekanik**:
- BOMB'a benzer ama daha kontrollü
- 3x3 alanda temizlik
- Chain reaction oluşturabilir

---

### 5. DIAMOND (Elmas Bloğu)

**Açıklama**: Temizlendiğinde 2x skor bonusu verir.

**Özellikler**:
```typescript
{
  color: '#d946ef',        // Fuşya/Pembe
  icon: '💎',
  glowColor: '#c026d3',
  type: 'DIAMOND',
  spawnRate: 0.10,         // 10%
  scoreMultiplier: 2.0     // 2x skor
}
```

**Mekanik**:
- Temizlendiğinde skor 2x olur
- Sadece o satır/sütun için geçerli
- Combo ile birleşince massive skor

---

### 6. CHRONO (Zaman Bloğu) - SADECE TIMED MODE

**Açıklama**: Temizlendiğinde +5 saniye bonus verir.

**Özellikler**:
```typescript
{
  color: '#fde68a',        // Altın sarısı
  icon: '⏱',
  glowColor: '#fbbf24',
  type: 'CHRONO',
  bonusSeconds: 5
}
```

**Mekanik**:
- Sadece TIMED modda spawn olur
- Temizlendiğinde +5 saniye
- 60 saniye cap'i geçici olarak 75'e çıkar
- Birden fazla CHRONO birikebilir

---

## 🌪️ Event Sistemi (SADECE ENDLESS MODE)

### Event Activation

**Tier-based Cooldown**:
```typescript
Tier 1: 5 hamle cooldown
Tier 2: 4 hamle cooldown
Tier 3: 3 hamle cooldown
Tier 4: 2 hamle cooldown
Tier 5: 1 hamle cooldown
Tier 6: 0 hamle cooldown (anında yeni event)
```

**Event Duration**:
```typescript
ICE_STORM: 10 hamle
GRAVITY_RUSH: 10 hamle
QUAKE: 8 hamle
MIRROR: 10 hamle
CHAOS: 12 hamle
VOID: 10 hamle
```

---

### 1. ICE_STORM (Buz Fırtınası)

**Açıklama**: Rastgele 2 hücreye buz bloğu spawn eder.

**Mekanik**:
- Her hamle 2 rastgele boş hücreye ICE bloğu
- 10 hamle sürer
- Toplam ~20 buz bloğu spawn olur
- Zorluk artar, strateji gerektirir

**Spawn Count**: 2 blok per hamle

---

### 2. GRAVITY_RUSH (Yerçekimi Dalgası)

**Açıklama**: Tüm bloklar aşağı kayar (Tetris gibi).

**Mekanik**:
- Her hamle sonunda bloklar aşağı düşer
- Boşluklar dolar
- Yeni kombinasyonlar oluşur
- 10 hamle sürer

**Etki**: Grid sürekli değişir, planlama zorlaşır

---

### 3. QUAKE (Deprem)

**Açıklama**: Skor çarpanı 1.3x olur.

**Mekanik**:
- Tüm skorlar 1.3x çarpan alır
- 8 hamle sürer
- En kısa event
- Skor farming için ideal

**Score Multiplier**: 1.3x

---

### 4. MIRROR (Ayna)

**Açıklama**: Grid yatay olarak aynalar (simetrik hale gelir).

**Mekanik**:
- Her hamle sonunda grid yatay aynalar
- Sol taraf → sağ tarafa kopyalanır
- Simetrik pattern oluşur
- 10 hamle sürer

**Etki**: Stratejik yerleştirme gerektirir

---

### 5. CHAOS (Kaos)

**Açıklama**: Her 4 hamlede 1 rastgele event tetiklenir.

**Mekanik**:
- 12 hamle sürer
- Her 4 hamlede 1 mini-event
- Rastgele event seçilir (ICE_STORM, GRAVITY_RUSH, MIRROR)
- Toplam 3 mini-event

**Trigger Interval**: 4 hamle

---

### 6. VOID (Boşluk)

**Açıklama**: Her 5 hamlede 1 rastgele dolu hücre silinir.

**Mekanik**:
- 10 hamle sürer
- Her 5 hamlede 1 rastgele dolu hücre silinir
- Toplam 2 hücre silinir
- Kurtarma mekanizması

**Trigger Interval**: 5 hamle

---

## 📊 Tier Sistemi (SADECE ENDLESS MODE)

### Tier Progression

```typescript
Tier 0: 0 - 5,000 puan       (Multiplier: 1.0x)
Tier 1: 5,000 - 15,000       (Multiplier: 1.2x)
Tier 2: 15,000 - 30,000      (Multiplier: 1.5x)
Tier 3: 30,000 - 55,000      (Multiplier: 1.8x)
Tier 4: 55,000 - 90,000      (Multiplier: 2.2x)
Tier 5: 90,000 - 140,000     (Multiplier: 2.6x)
Tier 6: 140,000+             (Multiplier: 3.0x)
```

### Tier Effects

**Zorluk Artışı**:
- Daha karmaşık piece'ler
- Daha fazla özel blok
- Event sıklığı artar
- Rescue threshold düşer

**Skor Bonusu**:
- Her tier skor çarpanını artırır
- Tier 6'da 3x çarpan
- Exponential growth

---

## 🔥 Combo ve Streak Sistemi

### Combo System

**Combo Timer**: 10 saniye
- Satır temizlendiğinde timer başlar/sıfırlanır
- 10 saniye içinde yeni satır temizlenmezse combo 0'a düşer
- Timer sadece satır temizlendiğinde aktif olur

**Combo Calculation**:
```typescript
newCombo = currentCombo + linesCleared
comboMultiplier = newCombo × 75 puan
```

**Combo Timer Thresholds**:
```typescript
WARNING: < 4 saniye (sarı)
CRITICAL: < 2 saniye (kırmızı)
```

**Combo Break**:
- Timer biterse combo 0'a düşer
- COMBO_SHIELD (mini-event) kırılmayı engeller
- COMBO_RUSH (TIMED mode) kırılmayı engeller

---

### Streak System (SADECE ENDLESS MODE)

**Streak Multipliers**:
```typescript
0 streak: 1.0x
1 streak: 1.0x
2 streak: 2.0x
3 streak: 3.0x
4+ streak: 4.0x (max)
```

**Streak Mekanikleri**:
- Ardışık satır temizleme sayısı
- Her satır temizleme streak'i artırır
- Satır temizlenmezse streak 0'a düşer
- COMBO_SHIELD streak'i korur

---

## 💯 Skor Hesaplama

### Base Points

```typescript
BLOCK_PLACED: 15 puan
LINE_CLEARED: 150 puan
COMBO_MULTIPLIER: 75 puan per combo
COLOR_BONUS_MULTIPLIER: 1.5x (tek renk satır/sütun)
```

### Score Formula

```typescript
basePoints = (blocksPlaced × 15) + 
             (linesCleared × 150) + 
             (combo × 75)

finalScore = basePoints × 
             colorBonus × 
             tierMultiplier × 
             eventMultiplier × 
             streakMultiplier × 
             passiveMultiplier
```

### Multiplier Breakdown

**ENDLESS Mode**:
- Tier Multiplier: 1.0x - 3.0x
- Event Multiplier: 1.2x - 1.3x
- Streak Multiplier: 1.0x - 4.0x
- Color Bonus: 1.5x

**TIMED Mode**:
- Final Sprint: 1.5x (son 10 saniye)
- Color Bonus: 1.5x
- COMBO_RUSH: Combo koruması

**Maksimum Çarpan (ENDLESS)**:
```
3.0 (tier) × 1.3 (event) × 4.0 (streak) × 1.5 (color) = 23.4x
```

---

## 🏆 Başarımlar

### Achievement Categories

1. **SCORE** (10 başarım): 1K - 1M puan
2. **COMBO** (8 başarım): 3x - 30x combo
3. **SPECIAL_BLOCKS** (10 başarım): Bomba, buz, özel bloklar
4. **ABILITIES** (8 başarım): Yetenek kullanımı
5. **PROGRESSION** (10 başarım): Oyun sayısı, blok yerleştirme
6. **SPEED** (6 başarım): Hız, zaman, sprint
7. **MASTERY** (8 başarım): Mükemmellik, verimlilik

### Notable Achievements

**Score Milestones**:
```
score_1k: 1,000 puan
score_10k: 10,000 puan
score_100k: 100,000 puan (hidden)
score_1m: 1,000,000 puan (hidden)
```

**Combo Mastery**:
```
combo_3: 3x kombo
combo_10: 10x kombo
combo_30: 30x kombo (hidden)
```

**Speed Challenges**:
```
speed_demon: 60 saniyede 5000 puan
timed_master: Timed modda 10,000 puan
sprint_master: Final sprint bonusu 5000+ puan (hidden)
```

**Perfect Play**:
```
perfect_clear: Tahtayı tamamen temizle
no_mistakes: Hiç yanlış hamle yapma (hidden)
efficiency: 50 hamle ile 10,000 puan (hidden)
```

---

## 📈 Stats Tracking

### Global Stats

```typescript
blocksPlaced: number
linesCleared: number
totalScore: number
bombsExploded: number
iceBroken: number
gamesPlayed: number
skillUses: { [key: string]: number }
```

### Mode-Specific Stats

**ENDLESS Mode**:
```typescript
endlessGamesPlayed: number
endlessHighScore: number
endlessMaxCombo: number
endlessTotalLines: number
endlessMaxTier: number
endlessEventCount: number
```

**TIMED Mode**:
```typescript
timedGamesPlayed: number
timedHighScore: number
timedMaxCombo: number
timedTotalLines: number
timedMaxDuration: number
timedChronoBonus: number
timedSprintBonusTotal: number
```

---

## 🎯 Milestone System (SADECE ENDLESS MODE)

### Milestones

```typescript
milestone_10k: 10,000 puan - "İlk 10K!"
milestone_25k: 25,000 puan - "Çeyrek Yol!"
milestone_50k: 50,000 puan - "Yarı Yol!"
milestone_100k: 100,000 puan - "100K Efsane!"
```

**Mekanik**:
- Milestone'a ulaşıldığında popup gösterilir
- Sadece bir kez tetiklenir
- Progression state'de saklanır
- HUD'da gösterilir

---

## 🎨 Piece System

### Piece Shapes (18 adet)

```typescript
dot: 1x1
h2, v2: 2x1, 1x2
h3, v3: 3x1, 1x3
h4, v4: 4x1, 1x4
square: 2x2
l_shape, j_shape: L ve J şekilleri
t_shape: T şekli
cross: Artı şekli
z_shape, s_shape: Z ve S şekilleri
corner: Köşe şekli
diagonal_2, diagonal_2_rev: Çapraz şekiller
small_plus: Küçük artı
```

### Piece Colors (6 renk)

```typescript
'#f59e0b' // Amber
'#3b82f6' // Blue
'#a78bfa' // Lavender
'#10b981' // Teal Green
'#f472b6' // Pink
'#6366f1' // Indigo
```

---

## 🔧 Technical Details

### Grid System

```typescript
GRID_SIZE: 10x10
Cell Types: NORMAL, BOMB, ICE, LIGHTNING, TARGET, DIAMOND, CHRONO
Cell Properties: filled, color, id, type, health, isClearing
```

### Game Loop

1. **Piece Placement**: Kullanıcı piece yerleştirir
2. **Grid Processing**: Satır/sütun kontrolü, özel blok tetikleme
3. **Score Calculation**: Multiplier'lar uygulanır
4. **Event Tick**: Aktif event efekti uygulanır
5. **Tier Check**: Tier progression kontrolü
6. **Piece Refill**: Yeni piece'ler spawn olur
7. **Game Over Check**: Yerleştirilebilir piece var mı?

### Save System

**Auto-save**: Her hamle sonrası
**Save Data**:
```typescript
grid, pieces, score, combo, gameMode, difficultyTier,
timeLeft, activeEvent, miniEventState, progressionState
```

---

## 🎮 Game Modes Comparison

| Feature | ENDLESS | TIMED | DAILY_CHALLENGE |
|---------|---------|-------|-----------------|
| Tier System | ✅ | ❌ | ❌ |
| Event System | ✅ | ❌ | ❌ |
| Special Blocks | ✅ | ✅ (+ CHRONO) | ❌ |
| Streak System | ✅ | ❌ | ❌ |
| Combo Timer | ✅ | ✅ | ❌ |
| Time Limit | ❌ | ✅ (60s) | ❌ |
| COMBO_RUSH | ❌ | ✅ | ❌ |
| Final Sprint | ❌ | ✅ | ❌ |
| Seed-based | ❌ | ❌ | ✅ |

---

## 📝 Notes

- **Performance**: Combo >= 10'da explosion efektleri devre dışı (performans)
- **Particle Optimization**: Tier-based particle reduction (MID/MID-LOW cihazlar için)
- **Auto-save**: Her hamle sonrası otomatik kayıt
- **Widget Integration**: High score ve streak widget'lara senkronize edilir
- **Analytics**: Game logs son 100 oyun için saklanır

---

**Son Güncelleme**: 2024
**Versiyon**: 1.0
**Mod Sayısı**: 3 (ENDLESS, TIMED, DAILY_CHALLENGE)
**Özel Blok Sayısı**: 6 (BOMB, ICE, LIGHTNING, TARGET, DIAMOND, CHRONO)
**Event Sayısı**: 6 (ICE_STORM, GRAVITY_RUSH, QUAKE, MIRROR, CHAOS, VOID)
**Tier Sayısı**: 7 (0-6)
**Başarım Sayısı**: 60
