# 🎮 HİBRİD PERFORMANS SİSTEMİ

## 🎯 Felsefe

**2 Aşamalı Sistem:**
1. **Init Time (Oyun Başlarken):** Statik puanlama ile doğru baseline belirle
2. **Runtime (Oyun Sırasında):** SceneOptimizer ile dinamik optimizasyon

---

## 📊 AŞAMA 1: GELİŞMİŞ PUANLAMA SİSTEMİ

### Puanlama Kriterleri

#### 1. GPU Gücü (En Önemli - 0-3 Puan)
```typescript
GPU Tier:
├─ HIGH (Adreno 7xx, Mali-G78+, Apple GPU) → +3 puan
├─ MID (Adreno 6xx, Mali-G57/G68)          → +2 puan
└─ LOW (Mali-G52, Adreno 5xx ve altı)      → +1 puan
```

#### 2. RAM (Kritik - 0-2 Puan)
```typescript
RAM:
├─ ≥8GB  → +2 puan
├─ 6GB   → +1 puan
└─ ≤4GB  → +0 puan (KIRMIZI ÇİZGİ!)
```

#### 3. CPU Cores (Yardımcı - 0-1 Puan)
```typescript
CPU Cores:
├─ ≥8 cores → +1 puan
└─ <8 cores → +0 puan
```

#### 4. DPI/Screen Density (Bonus - 0-1 Puan)
```typescript
DPI (devicePixelRatio):
├─ ≥3.0 → +1 puan (Yüksek çözünürlük ekran)
└─ <3.0 → +0 puan
```

### 🚨 KIRMIZI ÇİZGİLER (Hard Limits)

#### Kural 1: RAM ≤4GB → Otomatik LOW
```typescript
if (memory <= 4) {
  return DeviceTier.LOW; // Puan ne olursa olsun!
}
```

#### Kural 2: GPU LOW + RAM ≤6GB → Otomatik LOW
```typescript
if (gpuTier === LOW && memory <= 6) {
  return DeviceTier.LOW; // Honor 9X gibi
}
```

### Tier Belirleme (Puan Bazlı)

```typescript
Toplam Puan:
├─ 6-7 puan → HIGH TIER (Sınırları zorla)
├─ 4-5 puan → MID TIER (Dengeli oyna)
└─ 1-3 puan → LOW TIER (Hayatta kal)
```

---

## 🎮 GERÇEK DÜNYA ÖRNEKLERİ

### Örnek 1: Samsung S23 (Flagship)
```
GPU: Adreno 740        → +3 puan (HIGH)
RAM: 8GB               → +2 puan
CPU: 8 cores           → +1 puan
DPI: 3.0               → +1 puan
─────────────────────────────────
TOPLAM:                  7 PUAN
TIER: HIGH ✅

Ayarlar:
├─ Çözünürlük: 1.0 (Tam)
├─ FPS Limit: 120 (Ekran destekliyorsa)
├─ Glow: ✅
├─ Antialias: ✅
├─ Particles: Max
└─ Shadows: ✅
```

### Örnek 2: Oppo A60 (Mid-Range)
```
GPU: Adreno 680        → +2 puan (MID)
RAM: 8GB               → +2 puan
CPU: 8 cores           → +1 puan
DPI: 2.5               → +0 puan
─────────────────────────────────
TOPLAM:                  5 PUAN
TIER: MID ✅

Ayarlar:
├─ Çözünürlük: 1.0 (Tam)
├─ FPS Limit: 60 (KİLİTLİ!)
├─ Glow: ❌
├─ Antialias: ❌
├─ Particles: Orta (%65)
└─ Shadows: Basit
```

### Örnek 3: Honor 9X (Budget)
```
GPU: Mali-G52          → +1 puan (LOW)
RAM: 6GB               → +1 puan
CPU: 8 cores           → +1 puan
DPI: 2.0               → +0 puan
─────────────────────────────────
TOPLAM:                  3 PUAN

🚨 KIRMIZI ÇİZGİ: GPU LOW + RAM ≤6GB
TIER: LOW ✅ (Puan göz ardı edildi)

Ayarlar:
├─ Çözünürlük: 1.0 (Tam - ama efekt yok)
├─ FPS Limit: 30-40
├─ Glow: ❌
├─ Antialias: ❌
├─ Particles: Minimum (%35)
└─ Shadows: ❌
```

### Örnek 4: Eski Telefon (2GB RAM)
```
GPU: Adreno 506        → +1 puan (LOW)
RAM: 2GB               → +0 puan
CPU: 8 cores           → +1 puan
DPI: 2.0               → +0 puan
─────────────────────────────────
TOPLAM:                  2 PUAN

🚨 KIRMIZI ÇİZGİ: RAM ≤4GB
TIER: LOW ✅ (Otomatik)

Ayarlar:
├─ Çözünürlük: 1.0 (Tam)
├─ FPS Limit: 30
├─ Glow: ❌
├─ Antialias: ❌
├─ Particles: ❌
└─ Shadows: ❌
```

---

## ⚡ AŞAMA 2: RUNTIME OPTİMİZASYON (SceneOptimizer)

### Ne Zaman Devreye Girer?

#### Senaryo 1: Thermal Throttling
```
Durum: Oppo A60, 20 dakika oynadı, ısındı
FPS: 60 → 45 (Düştü!)

SceneOptimizer Aksiyonu:
1. hardwareScalingLevel: 1.0 → 1.2 (Çözünürlük %20 düşür)
2. Particles: Orta → Düşük
3. FPS: 60'a geri döndü ✅
```

#### Senaryo 2: Ağır Sahne
```
Durum: 100 blok aynı anda patladı
FPS: 60 → 35 (Ani düşüş!)

SceneOptimizer Aksiyonu:
1. Particle count: Yarıya indir
2. Animation throttle: 2 → 4
3. FPS: 55'e çıktı ✅
```

#### Senaryo 3: Batarya Tasarrufu
```
Durum: Batarya %20'nin altına düştü
Sistem: Enerji tasarrufu modu aktif

SceneOptimizer Aksiyonu:
1. FPS Limit: 60 → 30
2. Glow: Kapat
3. Particles: Minimum
4. Batarya ömrü uzadı ✅
```

---

## 🎯 HİBRİD SİSTEM AKIŞI

```
┌─────────────────────────────────────┐
│  OYUN BAŞLIYOR (Init Time)          │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  1. GPU Detection (WebGL)           │
│     └─ Mali-G52 → LOW               │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  2. Puanlama Sistemi                │
│     ├─ GPU: +1 puan                 │
│     ├─ RAM: +1 puan                 │
│     ├─ CPU: +1 puan                 │
│     └─ TOPLAM: 3 puan               │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  3. Kırmızı Çizgi Kontrolü          │
│     └─ GPU LOW + RAM ≤6GB           │
│        → TIER: LOW (Zorla)          │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  4. Baseline Ayarlar Yükle          │
│     ├─ Çözünürlük: 1.0              │
│     ├─ FPS: 30-40                   │
│     ├─ Particles: %35               │
│     └─ Glow: ❌                      │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  OYUN BAŞLADI (Runtime)             │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  SceneOptimizer Beklemede...        │
│  (FPS monitör ediyor)               │
└─────────────────────────────────────┘
           │
           ▼
     FPS < 30?
           │
      ┌────┴────┐
      │   EVET  │
      └────┬────┘
           │
           ▼
┌─────────────────────────────────────┐
│  SceneOptimizer Devreye Girer!      │
│  ├─ Çözünürlük düşür                │
│  ├─ Particles azalt                 │
│  └─ FPS'i kurtar                    │
└─────────────────────────────────────┘
```

---

## 📊 TIER BAZLI AYARLAR (Baseline)

### 🔴 LOW TIER
```typescript
{
  // Çözünürlük
  hardwareScaling: 1.0,           // TAM (efekt yok zaten)
  
  // FPS
  targetFPS: 30,
  maxFPS: 40,
  
  // Görsel Efektler
  enableGlow: false,
  enableShadows: false,
  enableAntialias: false,
  enableParticles: false,
  
  // Particle Ayarları
  particleQuality: 0.35,          // %35
  spsCapacity: 500,
  maxParticlesPerExplosion: 3,
  
  // Mesh & Fragment
  meshPoolSize: 30,
  fragmentPoolSize: 3,
  
  // Optimizasyon
  animationThrottle: 10,          // Her 10 frame'de 1
  skipEdgeRendering: true,
  disableDirectionalLight: true,
  
  // SceneOptimizer
  sceneOptimizerEnabled: true,
  sceneOptimizerTarget: 30        // 30 FPS'in altına düşerse müdahale et
}
```

### 🟡 MID TIER
```typescript
{
  // Çözünürlük
  hardwareScaling: 1.0,           // TAM
  
  // FPS
  targetFPS: 60,
  maxFPS: 60,                     // KİLİTLİ! (Thermal throttling önlemi)
  
  // Görsel Efektler
  enableGlow: false,
  enableShadows: true,            // Basit shadows
  enableAntialias: false,
  enableParticles: true,
  
  // Particle Ayarları
  particleQuality: 0.65,          // %65
  spsCapacity: 1200,
  maxParticlesPerExplosion: 6,
  
  // Mesh & Fragment
  meshPoolSize: 50,
  fragmentPoolSize: 10,
  
  // Optimizasyon
  animationThrottle: 4,           // Her 4 frame'de 1
  skipEdgeRendering: false,
  disableDirectionalLight: false,
  
  // SceneOptimizer
  sceneOptimizerEnabled: true,
  sceneOptimizerTarget: 50        // 50 FPS'in altına düşerse müdahale et
}
```

### 🟢 HIGH TIER
```typescript
{
  // Çözünürlük
  hardwareScaling: 1.0,           // TAM
  
  // FPS
  targetFPS: 120,                 // Ekran destekliyorsa
  maxFPS: 120,                    // SINIRSIZ
  
  // Görsel Efektler
  enableGlow: true,               // ✨ Premium
  enableShadows: true,            // Gelişmiş shadows
  enableAntialias: true,          // 🎨 Smooth
  enableParticles: true,
  
  // Particle Ayarları
  particleQuality: 1.0,           // %100
  spsCapacity: 2000,
  maxParticlesPerExplosion: 12,
  
  // Mesh & Fragment
  meshPoolSize: 70,
  fragmentPoolSize: 20,
  
  // Optimizasyon
  animationThrottle: 2,           // Her 2 frame'de 1
  skipEdgeRendering: false,
  disableDirectionalLight: false,
  
  // SceneOptimizer
  sceneOptimizerEnabled: true,
  sceneOptimizerTarget: 60        // 60 FPS'in altına düşerse müdahale et
}
```

---

## 🎯 SONUÇ

### Avantajlar

1. **Doğru Başlangıç:** Cihaz kapasitesine uygun baseline ile başlar
2. **Kriz Yönetimi:** SceneOptimizer sadece gerektiğinde devreye girer
3. **Thermal Koruma:** MID tier 60 FPS'e kilitli (ısınma önlenir)
4. **Çözünürlük Korunur:** Tüm tier'larda tam çözünürlük (efektler değişir)
5. **Akıllı Puanlama:** GPU + RAM + CPU + DPI → Doğru tier

### Dezavantajlar

1. **Karmaşıklık:** İki sistem birden yönetilmeli
2. **Test Gereksinimi:** Her tier'da test edilmeli
3. **SceneOptimizer Tuning:** Doğru threshold'lar bulunmalı

---

## 🧪 TEST PLANI

### Test 1: Honor 9X (LOW)
- [ ] Oyun başlasın → LOW tier algılansın
- [ ] FPS 30-40 arasında olsun
- [ ] Particles minimum olsun
- [ ] 20 dakika oynansın → Thermal throttling testi

### Test 2: Oppo A60 (MID)
- [ ] Oyun başlasın → MID tier algılansın
- [ ] FPS 60'a kilitlensin
- [ ] Particles orta seviye olsun
- [ ] 20 dakika oynansın → SceneOptimizer devreye girsin mi?

### Test 3: Samsung S23 (HIGH)
- [ ] Oyun başlasın → HIGH tier algılansın
- [ ] FPS 120'ye çıksın (ekran destekliyorsa)
- [ ] Glow + Antialias açık olsun
- [ ] Particles maksimum olsun

---

**Hibrid sistem = Statik puanlama (Init) + Dinamik optimizasyon (Runtime)** 🎯
