# 🎮 FINAL GPU TIER CLASSIFICATION

## 📊 GPU Sınıflandırması (Güncellenmiş)

### 🔴 LOW TIER (2015-2019)
**Hedef:** Eski ve zayıf cihazlar

#### Mali Series
- `Mali-4xx` → Çok eski (2012-2015)
- `Mali-G31` → Entry-level
- `Mali-G51` → Low-mid range
- **`Mali-G52`** → **Honor 9X, Redmi Note 9** ✅

#### Adreno Series
- `Adreno 3xx` → Snapdragon 400/600 (2013-2016)
- `Adreno 4xx` → Snapdragon 600/800 (2014-2017)
- **`Adreno 5xx`** → Snapdragon 600/700 (2017-2019) ✅

#### Others
- `PowerVR SGX` → Çok eski
- `VideoCore` → Raspberry Pi
- `Intel HD 2000-5000` → Eski integrated

**Örnek Cihazlar:**
- **Honor 9X** (Mali-G52, 6GB) → LOW ✅
- **Redmi Note 9** (Mali-G52, 4GB) → LOW ✅
- Xiaomi Redmi 5 (Adreno 506) → LOW
- Samsung Galaxy J7 (Mali-T830) → LOW
- Poco M3 (Adreno 610) → LOW

---

### 🟡 MID TIER (2019-2021)
**Hedef:** Orta seviye modern cihazlar

#### Adreno Series
- **`Adreno 6xx`** → Snapdragon 700/800 (2018-2020)

#### Mali Series
- `Mali-G57` → Dimensity 700/800
- `Mali-G68` → Exynos 1280
- `Mali-G71/G72/G76` → Eski flagship

#### Others
- `PowerVR Rogue` → Mid-range
- `Intel Iris` → Integrated

**Örnek Cihazlar:**
- Poco X3 (Adreno 618, 6GB) → MID
- Samsung A52 (Adreno 618, 6GB) → MID
- Realme 8 Pro (Adreno 618) → MID
- Redmi Note 10 Pro (Adreno 618) → MID

---

### 🟢 HIGH TIER (2021+)
**Hedef:** Flagship ve premium cihazlar

#### Adreno Series
- `Adreno 7xx` → Snapdragon 8 Gen 1/2/3
- `Adreno 730` → Snapdragon 8 Gen 1
- `Adreno 740` → Snapdragon 8 Gen 2/3

#### Mali Series
- `Mali-G78` → Exynos 2100, Dimensity 1200
- `Mali-G710` → Exynos 2200, Dimensity 9000
- `Mali-G715` → Dimensity 9200
- `Mali-G720` → Latest
- `Immortalis` → ARM flagship

#### Apple & Desktop
- `Apple GPU` → A14+, M1+, M2+
- `NVIDIA GeForce` → Desktop/laptop
- `AMD Radeon` → Desktop/laptop

**Örnek Cihazlar:**
- Samsung S23 (Adreno 740, 8GB) → HIGH
- iPhone 14 (Apple A15, 6GB) → HIGH
- Xiaomi 13 (Adreno 740, 8GB) → HIGH
- OnePlus 11 (Adreno 740, 12GB) → HIGH

---

## 🎯 Tier Belirleme Kuralları

### 1. GPU-First (Öncelik)
```typescript
const gpuTier = classifyGPUTier(gpuRenderer);
tier = gpuTier; // GPU'ya güven!
```

### 2. RAM Sanity Checks
```typescript
// Downgrade: HIGH GPU + Very Low RAM
if (gpuTier === HIGH && memory < 4GB) {
  tier = MID;
}

// Upgrade: LOW GPU + Very High RAM
if (gpuTier === LOW && memory >= 8GB) {
  tier = MID;
}
```

### 3. Fallback (GPU bulunamazsa)
```typescript
if (!gpuTier) {
  if (memory <= 4GB) tier = LOW;
  else if (memory >= 8GB) tier = HIGH;
  else tier = MID;
}
```

---

## 📱 Gerçek Dünya Örnekleri

### ✅ Honor 9X
```
GPU: Mali-G52
RAM: 6GB
Cores: 8

GPU Tier: LOW (Mali-G52 → LOW)
RAM Check: 6GB (OK)
Final Tier: LOW ✅
```

### ✅ Poco X3
```
GPU: Adreno (TM) 618
RAM: 6GB
Cores: 8

GPU Tier: MID (Adreno 6xx → MID)
RAM Check: 6GB (OK)
Final Tier: MID ✅
```

### ✅ Samsung S23
```
GPU: Adreno (TM) 740
RAM: 8GB
Cores: 8

GPU Tier: HIGH (Adreno 740 → HIGH)
RAM Check: 8GB (OK)
Final Tier: HIGH ✅
```

### ✅ Redmi Note 9
```
GPU: Mali-G52
RAM: 4GB
Cores: 8

GPU Tier: LOW (Mali-G52 → LOW)
RAM Check: 4GB (OK)
Final Tier: LOW ✅
```

### ✅ iPhone 14
```
GPU: Apple A15 GPU
RAM: 6GB
Cores: 6

GPU Tier: HIGH (Apple GPU → HIGH)
RAM Check: 6GB (OK)
Final Tier: HIGH ✅
```

---

## 📊 Tier Dağılımı

| Tier | GPU Örnekleri | RAM Range | Cihaz Örnekleri |
|------|---------------|-----------|-----------------|
| **LOW** | Mali-G52, Adreno 5xx, Mali-4xx | 2-6GB | Honor 9X, Redmi Note 9, Poco M3 |
| **MID** | Adreno 6xx, Mali-G57, Mali-G68 | 4-8GB | Poco X3, Samsung A52, Realme 8 Pro |
| **HIGH** | Adreno 7xx, Mali-G78+, Apple GPU | 6-16GB | Samsung S23, iPhone 14, Xiaomi 13 |

---

## 🎮 Performans Ayarları

### 🔴 LOW TIER
```typescript
{
  fragmentPoolSize: 3,
  hardwareScaling: 1.0,        // Tam çözünürlük
  enableGlow: false,
  enableParticles: false,
  antialias: false,
  particleQuality: 0.35,       // %35
  spsCapacity: 500,
  meshPoolSize: 30
}
```
**Hedef:** 30-40 FPS

### 🟡 MID TIER
```typescript
{
  fragmentPoolSize: 10,
  hardwareScaling: 1.0,        // Tam çözünürlük
  enableGlow: false,
  enableParticles: true,
  antialias: false,
  particleQuality: 0.65,       // %65
  spsCapacity: 1200,
  meshPoolSize: 50
}
```
**Hedef:** 45-50 FPS

### 🟢 HIGH TIER
```typescript
{
  fragmentPoolSize: 20,
  hardwareScaling: 1.0,        // Tam çözünürlük
  enableGlow: true,            // ✨ Premium
  enableParticles: true,
  antialias: true,             // 🎨 Smooth
  particleQuality: 1.0,        // %100
  spsCapacity: 2000,
  meshPoolSize: 70
}
```
**Hedef:** 55-60 FPS

---

## ✅ SONUÇ

**Honor 9X → LOW TIER** ✅
- Mali-G52 GPU → LOW
- 6GB RAM → OK
- Minimum efekt, tam çözünürlük
- 30-40 FPS hedefi

**GPU asla yalan söylemez!** 🎯
