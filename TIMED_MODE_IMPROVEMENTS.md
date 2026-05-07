# Timed Mode - Geliştirme Önerileri

Timed mod için kapsamlı iyileştirme ve yeni özellik önerileri.

---

## 📋 Mevcut Durum Analizi

### Şu Anki Özellikler
- ✅ 60 saniye süre
- ✅ CHRONO blokları (+5 saniye)
- ✅ Combo timer (10 saniye)
- ✅ Final sprint bonus (son 10 saniye 1.5x)
- ✅ Zaman bonusları (+2s per satır, +0.5s combo)
- ✅ Combo kırılma cezası (-1s)

### Eksikler ve İyileştirme Alanları
- ❌ Çeşitlilik az (tek mod varyasyonu)
- ❌ Progression sistemi yok
- ❌ Zorluk seviyeleri yok
- ❌ Özel mekanikler az
- ❌ Replayability düşük
- ❌ Sosyal özellikler yok

---

## 🎮 Yeni Mekanikler

### 1. Time Attack Varyasyonları

#### Sprint Mode (30 saniye)
**Konsept**: Hızlı, yoğun oyun
```typescript
{
  duration: 30,
  chronoBonus: 3, // +3 saniye (daha az)
  finalSprintThreshold: 5, // Son 5 saniye
  multiplier: 2.0, // 2x skor (daha yüksek)
  targetScore: 5000
}
```

#### Marathon Mode (120 saniye)
**Konsept**: Uzun, stratejik oyun
```typescript
{
  duration: 120,
  chronoBonus: 7, // +7 saniye (daha fazla)
  finalSprintThreshold: 20, // Son 20 saniye
  multiplier: 1.2, // 1.2x skor (daha düşük)
  targetScore: 25000
}
```

#### Blitz Mode (15 saniye)
**Konsept**: Ekstrem hız
```typescript
{
  duration: 15,
  chronoBonus: 2, // +2 saniye
  finalSprintThreshold: 3, // Son 3 saniye
  multiplier: 3.0, // 3x skor
  targetScore: 2000
}
```

---

### 2. Time Freeze Power-Up

**Konsept**: Zamanı dondur, rahat düşün

**Mekanik**:
- Her 10 satır temizlemede 1 freeze charge
- Kullanınca 5 saniye süre durur
- Maksimum 3 charge biriktirilebilir
- Görsel: Mavi glow + "FROZEN" yazısı

**Kullanım**:
```typescript
interface TimeFreezeState {
  charges: number; // 0-3
  isActive: boolean;
  remainingDuration: number; // ms
}
```

---

### 3. Time Multiplier Zones

**Konsept**: Grid'de özel bölgeler spawn olur

**Zone Türleri**:
```typescript
SPEED_ZONE: {
  color: '#ef4444', // Kırmızı
  effect: 'Zaman 2x hızlı akar ama skor 2x',
  duration: 10, // saniye
  size: '3x3'
}

SLOW_ZONE: {
  color: '#3b82f6', // Mavi
  effect: 'Zaman 0.5x yavaş akar ama skor 0.5x',
  duration: 10,
  size: '3x3'
}

BONUS_ZONE: {
  color: '#fbbf24', // Altın
  effect: 'Normal zaman ama skor 3x',
  duration: 8,
  size: '2x2'
}
```

**Spawn Mekanizması**:
- Her 15 saniyede 1 zone spawn
- Rastgele pozisyon
- Görsel glow efekti

---

### 4. Checkpoint System

**Konsept**: Belirli skorlarda zaman bonusu

**Checkpoints**:
```typescript
const CHECKPOINTS = [
  { score: 2000, bonus: 5, label: 'İlk Checkpoint!' },
  { score: 5000, bonus: 8, label: 'Harika Gidiyorsun!' },
  { score: 10000, bonus: 12, label: 'Efsane!' },
  { score: 20000, bonus: 15, label: 'İnanılmaz!' },
];
```

**Görsel Feedback**:
- Checkpoint'e ulaşınca ekran flash
- "+5 SN" popup
- Ses efekti
- Kısa slow-motion (0.5s)

---

### 5. Streak Bonus System

**Konsept**: Ardışık satır temizleme bonusu

**Streak Levels**:
```typescript
STREAK_3: +1 saniye
STREAK_5: +2 saniye
STREAK_7: +3 saniye
STREAK_10: +5 saniye + "STREAK MASTER" badge
```

**Mekanik**:
- Her hamle satır temizlemeli
- Temizlemezsen streak sıfırlanır
- Görsel: Streak counter + ateş efekti

---

## 📊 Progression Sistemi

### 1. Timed Mode Levels

**Konsept**: Timed modda seviye sistemi

**Level Benefits**:
```
Level 1: Başlangıç (60s)
Level 5: +5 saniye başlangıç (65s)
Level 10: Time freeze unlock
Level 15: +10 saniye başlangıç (70s)
Level 20: Checkpoint bonusları +50%
Level 25: Sprint mode unlock
Level 30: Marathon mode unlock
```

**XP Kaynakları**:
```typescript
Oyun bitişi: score / 10 XP
Checkpoint: 100 XP
Streak 10+: 200 XP
Perfect clear: 500 XP
```

---

### 2. Timed Mode Tiers

**Konsept**: Performansa göre tier

**Tier Sistemi**:
```
Bronze: 0-3000 puan
Silver: 3000-7000 puan
Gold: 7000-12000 puan
Platinum: 12000-20000 puan
Diamond: 20000+ puan
```

**Tier Rewards**:
- Badge (profilde gösterilir)
- Özel theme unlock
- Leaderboard'da tier gösterilir

---

### 3. Personal Best Tracking

**Konsept**: Kişisel rekorları takip et

**Tracked Stats**:
```typescript
interface TimedModeStats {
  highScore: number;
  fastestTime: number; // 10K'ya ulaşma süresi
  maxCombo: number;
  maxStreak: number;
  totalChronoBonus: number;
  totalCheckpoints: number;
  averageScore: number;
  gamesPlayed: number;
}
```

**Görsel**:
- Stats ekranında grafik
- Trend analizi (son 10 oyun)
- Comparison (arkadaşlarla)

---

## 🎯 Zorluk Seviyeleri

### 1. Easy Mode

**Özellikler**:
```typescript
{
  startTime: 90, // 90 saniye
  chronoBonus: 7, // +7 saniye
  comboTimer: 15, // 15 saniye
  finalSprintThreshold: 15,
  chronoSpawnRate: 0.15, // 15% (daha fazla)
  targetScore: 5000
}
```

**Hedef Kitle**: Yeni oyuncular, casual

---

### 2. Normal Mode (Mevcut)

**Özellikler**:
```typescript
{
  startTime: 60,
  chronoBonus: 5,
  comboTimer: 10,
  finalSprintThreshold: 10,
  chronoSpawnRate: 0.10, // 10%
  targetScore: 10000
}
```

---

### 3. Hard Mode

**Özellikler**:
```typescript
{
  startTime: 45, // 45 saniye
  chronoBonus: 3, // +3 saniye
  comboTimer: 7, // 7 saniye
  finalSprintThreshold: 8,
  chronoSpawnRate: 0.07, // 7% (daha az)
  targetScore: 15000,
  penalties: {
    comboBreak: -2, // -2 saniye (daha sert)
    noLinesClear: -0.5 // Her hamle satır temizlemezsen -0.5s
  }
}
```

**Hedef Kitle**: Pro oyuncular

---

### 4. Extreme Mode

**Özellikler**:
```typescript
{
  startTime: 30, // 30 saniye
  chronoBonus: 2, // +2 saniye
  comboTimer: 5, // 5 saniye
  finalSprintThreshold: 5,
  chronoSpawnRate: 0.05, // 5%
  targetScore: 20000,
  penalties: {
    comboBreak: -3,
    noLinesClear: -1
  },
  specialRules: {
    mustClearEveryMove: true, // Her hamle satır temizlemeli
    timeDecay: 0.5 // Her saniye -0.5s (hızlanıyor)
  }
}
```

**Hedef Kitle**: Hardcore oyuncular

---

## 🏆 Challenge Modes

### 1. Daily Time Trial

**Konsept**: Her gün farklı challenge

**Challenge Türleri**:
```
"Speed Demon": 30 saniyede 5000 puan
"Marathon Master": 120 saniyede 30000 puan
"Combo King": 10x combo yap (zaman sınırsız)
"No CHRONO": CHRONO kullanmadan 10000 puan
"Perfect Run": Hiç combo kırma
```

**Ödüller**:
- Daily challenge tamamlama: +500 XP
- Leaderboard'da özel badge
- Streak bonus (7 gün üst üste)

---

### 2. Weekly Tournament

**Konsept**: Haftalık turnuva

**Format**:
- Herkes aynı seed ile oynar
- Aynı piece'ler, aynı CHRONO spawn
- En yüksek skor kazanır

**Ödüller**:
```
1st: 5000 XP + exclusive badge + title
2nd-3rd: 2000 XP + badge
4th-10th: 1000 XP
```

---

### 3. Time Attack Gauntlet

**Konsept**: Ardışık zorluk seviyeleri

**Format**:
```
Round 1: Easy (90s) → 5000 puan hedef
Round 2: Normal (60s) → 10000 puan hedef
Round 3: Hard (45s) → 15000 puan hedef
Round 4: Extreme (30s) → 20000 puan hedef
```

**Mekanik**:
- Tüm round'ları geçersen massive reward
- Bir round fail olursa baştan başla
- Kalan süre bir sonraki round'a taşınır (+bonus)

---

## 🎨 Görsel İyileştirmeler

### 1. Dynamic Time Visualization

**Konsept**: Süreye göre değişen görsel

**Time Zones**:
```
60-40s: Yeşil (sakin)
40-20s: Sarı (dikkat)
20-10s: Turuncu (hızlan)
10-0s: Kırmızı (kritik)
```

**Efektler**:
- Arka plan rengi değişir
- Vignette efekti artar
- Particle hızı artar
- Müzik tempo artar

---

### 2. Time Bar Enhancements

**Özellikler**:
- Checkpoint marker'ları
- Bonus time göstergesi
- Pulse animasyonu (kritik)
- Glow efekti (bonus kazanınca)

---

### 3. Slow Motion Moments

**Konsept**: Önemli anlarda slow-motion

**Trigger'lar**:
```
Checkpoint ulaşma: 0.5s slow-mo
10x combo: 0.8s slow-mo
Perfect clear: 1.0s slow-mo
Son 3 saniye: Sürekli 0.7x slow-mo
```

---

## 🔊 Ses İyileştirmeleri

### 1. Dynamic Music

**Konsept**: Süreye göre müzik değişir

**Music Layers**:
```
60-40s: Base track (sakin)
40-20s: + Drums (tempo artar)
20-10s: + Bass (yoğunlaşır)
10-0s: + Synth (epik)
```

---

### 2. Time-Based SFX

**Yeni Sesler**:
```
Checkpoint: "Ding!" + fanfare
Time freeze: "Whoosh" + freeze sound
Bonus time: "Cha-ching!"
Final 10s: Heartbeat sound
Time's up: Buzzer
```

---

## 👥 Sosyal Özellikler

### 1. Ghost Racing

**Konsept**: Arkadaşının ghost'u ile yarış

**Mekanik**:
- Arkadaşın en iyi oyununu ghost olarak görürsün
- Onun skorunu real-time takip edersin
- Geçersen "OVERTAKE!" mesajı
- Sonunda comparison gösterilir

---

### 2. Head-to-Head Mode

**Konsept**: 1v1 real-time yarış

**Format**:
- 2 oyuncu aynı anda oynar
- Split-screen veya side-by-side
- Aynı piece'ler spawn olur
- İlk 10K'ya ulaşan kazanır

---

### 3. Leaderboard Enhancements

**Yeni Leaderboard'lar**:
```
- Daily (günlük reset)
- Weekly (haftalık reset)
- All-Time (tüm zamanlar)
- Friends (arkadaşlar)
- Country (ülke)
- Difficulty-Based (zorluk seviyesine göre)
```

---

## 💡 Özel Mekanikler

### 1. Time Bank

**Konsept**: Zamanı biriktir, sonra kullan

**Mekanik**:
```typescript
interface TimeBank {
  stored: number; // Birikmiş saniye (max 30)
  rate: number; // Birikme hızı (0.1s per satır)
}
```

**Kullanım**:
- Satır temizleyince 0.1s bank'a gider
- İstediğin zaman "Withdraw" yaparsın
- Tüm birikmiş süre timer'a eklenir

---

### 2. Time Roulette

**Konsept**: Risk/reward mekanizması

**Mekanik**:
- Her 20 saniyede 1 roulette spawn
- Tıklarsan random bonus:
  - 50% şans: +5 saniye
  - 30% şans: +10 saniye
  - 15% şans: -3 saniye
  - 5% şans: +20 saniye

---

### 3. Combo Chain Time Bonus

**Konsept**: Combo chain'e göre zaman bonusu

**Formula**:
```typescript
timeBonus = (combo * combo) / 10

Combo 5: +2.5s
Combo 10: +10s
Combo 15: +22.5s
Combo 20: +40s
```

---

## 📱 UI/UX İyileştirmeleri

### 1. Pre-Game Setup

**Özellikler**:
- Zorluk seçimi (Easy/Normal/Hard/Extreme)
- Mod seçimi (Sprint/Marathon/Blitz)
- Power-up seçimi (Time freeze, Time bank)
- Target score gösterimi

---

### 2. In-Game HUD

**Yeni Elemanlar**:
```
- Time bank göstergesi
- Checkpoint progress bar
- Streak counter
- Power-up charges
- Next checkpoint indicator
```

---

### 3. Post-Game Summary

**Detaylı İstatistikler**:
```
- Final score
- Time survived
- Max combo
- Max streak
- Checkpoints reached
- CHRONO bonus total
- Comparison (previous best)
- Tier achieved
- XP gained
```

---

## 🎯 Öncelik Sıralaması

### Kısa Vadeli (1-2 hafta)

**Yüksek Öncelik**:
1. ✅ Checkpoint system
2. ✅ Streak bonus
3. ✅ Time freeze power-up
4. ✅ Zorluk seviyeleri (Easy/Hard)
5. ✅ Görsel iyileştirmeler (time bar, colors)

**Orta Öncelik**:
6. Daily time trial
7. Personal best tracking
8. Dynamic music
9. Post-game summary iyileştirme

---

### Orta Vadeli (2-4 hafta)

1. Sprint/Marathon/Blitz modları
2. Time bank mekanik
3. Timed mode levels
4. Ghost racing
5. Weekly tournament
6. Time multiplier zones
7. Slow motion moments

---

### Uzun Vadeli (1-2 ay)

1. Head-to-head mode
2. Time attack gauntlet
3. Extreme mode
4. Time roulette
5. Advanced leaderboards

---

## 📊 Başarı Metrikleri

### Engagement KPI'lar
```
- Timed mode play rate (% of total games)
- Average session duration
- Retry rate (kaç kez tekrar oynar)
- Difficulty distribution (Easy/Normal/Hard)
```

### Performance KPI'lar
```
- Average score
- Checkpoint reach rate
- CHRONO usage rate
- Time freeze usage rate
```

### Retention KPI'lar
```
- D1 retention (Timed mode)
- D7 retention
- Daily challenge completion rate
- Tournament participation rate
```

---

## 💰 Monetization Opportunities

### 1. Premium Time Modes

**Opsiyonel Satın Alma**:
```
- Extreme mode unlock: $0.99
- Custom time settings: $1.99
- Exclusive themes: $0.99 each
```

---

### 2. Power-Up Packs

**Satılabilir Paketler**:
```
Starter: 5 time freeze = $0.99
Pro: 20 time freeze = $2.99
Ultimate: 100 time freeze = $9.99
```

---

### 3. Ad Rewards

**Reklam İzle Bonusları**:
```
- Continue game (game over'dan devam): 1 ad
- 2x XP (30 dakika): 1 ad
- Time freeze ×3: 1 ad
- Daily challenge retry: 1 ad
```

---

## 🔧 Teknik Gereksinimler

### Yeni State'ler
```typescript
interface TimedModeState {
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  mode: 'standard' | 'sprint' | 'marathon' | 'blitz';
  checkpoints: Checkpoint[];
  streak: number;
  timeFreezeCharges: number;
  timeBank: number;
  personalBest: TimedModeStats;
  level: number;
  xp: number;
}
```

### Yeni Constants
```typescript
const TIMED_DIFFICULTIES = {
  EASY: { startTime: 90, chronoBonus: 7, ... },
  NORMAL: { startTime: 60, chronoBonus: 5, ... },
  HARD: { startTime: 45, chronoBonus: 3, ... },
  EXTREME: { startTime: 30, chronoBonus: 2, ... },
};

const CHECKPOINTS = [
  { score: 2000, bonus: 5 },
  { score: 5000, bonus: 8 },
  ...
];
```

---

**Toplam Öneri**: 40+ yeni özellik
**Tahmini Geliştirme Süresi**: 4-8 hafta
**Öncelik**: Checkpoint ve streak sistemleri ile başla
**Hedef**: Timed mode engagement'ı 2x artır
