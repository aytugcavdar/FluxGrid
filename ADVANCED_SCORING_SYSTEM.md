# 🎯 GELİŞMİŞ PUANLAMA SİSTEMİ (1-15 Barem)

## 📊 PUANLAMA KRİTERLERİ

### 1. GPU Gücü (0-5 Puan) - EN ÖNEMLİ
```typescript
GPU Tier:
├─ HIGH (Adreno 7xx, Mali-G78+, Apple GPU)     → +5 puan
├─ MID-HIGH (Adreno 6xx üst, Mali-G68/G76)     → +4 puan
├─ MID (Adreno 6xx alt, Mali-G57)              → +3 puan
├─ LOW-MID (Adreno 5xx üst, Mali-G52)          → +2 puan
└─ LOW (Adreno 5xx alt, Mali-4xx, Adreno 3xx)  → +1 puan
```

**Detaylı GPU Sınıflandırması:**
- **+5 puan:** Adreno 730-750, Mali-G78/G710/G715, Apple A14+, NVIDIA, AMD
- **+4 puan:** Adreno 650-690, Mali-G68, Mali-G76
- **+3 puan:** Adreno 610-640, Mali-G57, Mali-G72
- **+2 puan:** Adreno 530-610, Mali-G52, Mali-G51
- **+1 puan:** Adreno 3xx-5xx alt, Mali-4xx, PowerVR SGX

---

### 2. RAM (0-4 Puan) - KRİTİK
```typescript
RAM:
├─ ≥12GB → +4 puan (Flagship)
├─ 8-11GB → +3 puan (Premium)
├─ 6-7GB → +2 puan (Orta)
├─ 4-5GB → +1 puan (Düşük)
└─ ≤3GB → +0 puan (Çok düşük)
```

---

### 3. CPU Cores (0-3 Puan) - YARDIMCI
```typescript
CPU Cores:
├─ ≥10 cores → +3 puan (Flagship - Snapdragon 8 Gen 3)
├─ 8-9 cores → +2 puan (Modern)
├─ 6-7 cores → +1 puan (Orta)
└─ ≤5 cores → +0 puan (Eski)
```

---

### 4. Ekran Yenileme Hızı (0-2 Puan) - BONUS
```typescript
Screen Refresh Rate:
├─ ≥120Hz → +2 puan (Premium)
├─ 90Hz → +1 puan (İyi)
└─ ≤60Hz → +0 puan (Standart)
```

**Not:** `window.screen` API'sinden alınabilir (bazı tarayıcılarda)

---

### 5. DPI/Pixel Density (0-1 Puan) - BONUS
```typescript
DPI (devicePixelRatio):
├─ ≥3.0 → +1 puan (Yüksek çözünürlük)
└─ <3.0 → +0 puan (Normal)
```

---

## 🚨 KIRMIZI ÇİZGİLER (Hard Limits)

### Kural 1: RAM ≤3GB → Otomatik LOW
```typescript
if (memory <= 3) {
  return DeviceTier.LOW; // Puan ne olursa olsun!
}
```

### Kural 2: GPU LOW (1 puan) + RAM ≤6GB → Otomatik LOW
```typescript
if (gpuScore === 1 && memory <= 6) {
  return DeviceTier.LOW; // Honor 9X gibi
}
```

### Kural 3: GPU LOW (1-2 puan) + RAM 4GB → Otomatik LOW
```typescript
if (gpuScore <= 2 && memory === 4) {
  return DeviceTier.LOW; // Eski telefonlar
}
```

---

## 🎯 TIER BELİRLEME (15 Puan Üzerinden)

```typescript
Toplam Puan:
├─ 12-15 puan → HIGH TIER (Canavar cihazlar)
├─ 8-11 puan → MID TIER (Dengeli cihazlar)
└─ 1-7 puan → LOW TIER (Bütçe/eski cihazlar)
```

---

## 📱 GERÇEK DÜNYA ÖRNEKLERİ

### Örnek 1: Samsung S23 Ultra (Flagship)
```
GPU: Adreno 740        → +5 puan (HIGH)
RAM: 12GB              → +4 puan (Flagship)
CPU: 8 cores           → +2 puan (Modern)
Screen: 120Hz          → +2 puan (Premium)
DPI: 3.0               → +1 puan (Yüksek)
─────────────────────────────────────────
TOPLAM:                  14 PUAN
TIER: HIGH ✅

Ayarlar:
├─ Çözünürlük: 1.0 (Tam)
├─ FPS Limit: 120
├─ Glow: ✅
├─ Antialias: ✅
├─ Particles: Max (100%)
└─ Shadows: ✅
```

---

### Örnek 2: Oppo A60 (Mid-Range)
```
GPU: Adreno 680        → +4 puan (MID-HIGH)
RAM: 8GB               → +3 puan (Premium)
CPU: 8 cores           → +2 puan (Modern)
Screen: 90Hz           → +1 puan (İyi)
DPI: 2.5               → +0 puan (Normal)
─────────────────────────────────────────
TOPLAM:                  10 PUAN
TIER: MID ✅

Ayarlar:
├─ Çözünürlük: 1.0 (Tam)
├─ FPS Limit: 90 (Ekran yenileme hızına göre)
├─ Glow: ❌
├─ Antialias: ❌
├─ Particles: Orta (65%)
└─ Shadows: Basit
```

---

### Örnek 3: Poco X3 (Budget Mid-Range)
```
GPU: Adreno 618        → +3 puan (MID)
RAM: 6GB               → +2 puan (Orta)
CPU: 8 cores           → +2 puan (Modern)
Screen: 120Hz          → +2 puan (Premium)
DPI: 2.3               → +0 puan (Normal)
─────────────────────────────────────────
TOPLAM:                  9 PUAN
TIER: MID ✅

Ayarlar:
├─ Çözünürlük: 1.0 (Tam)
├─ FPS Limit: 90 (Thermal koruma için 120 değil)
├─ Glow: ❌
├─ Antialias: ❌
├─ Particles: Orta (65%)
└─ Shadows: Basit
```

---

### Örnek 4: Honor 9X (Budget)
```
GPU: Mali-G52          → +2 puan (LOW-MID)
RAM: 6GB               → +2 puan (Orta)
CPU: 8 cores           → +2 puan (Modern)
Screen: 60Hz           → +0 puan (Standart)
DPI: 2.0               → +0 puan (Normal)
─────────────────────────────────────────
TOPLAM:                  6 PUAN

🚨 KIRMIZI ÇİZGİ: GPU LOW-MID (2 puan) + RAM 6GB
TIER: LOW ✅ (Zorla)

Ayarlar:
├─ Çözünürlük: 1.0 (Tam - DÜŞME YOK!)
├─ FPS Limit: 30-40
├─ Glow: ❌
├─ Antialias: ❌
├─ Particles: Minimum (35%)
└─ Shadows: ❌
```

---

### Örnek 5: Redmi Note 9 (Entry-Level)
```
GPU: Mali-G52          → +2 puan (LOW-MID)
RAM: 4GB               → +1 puan (Düşük)
CPU: 8 cores           → +2 puan (Modern)
Screen: 60Hz           → +0 puan (Standart)
DPI: 2.0               → +0 puan (Normal)
─────────────────────────────────────────
TOPLAM:                  5 PUAN

🚨 KIRMIZI ÇİZGİ: GPU LOW-MID (2 puan) + RAM 4GB
TIER: LOW ✅ (Zorla)

Ayarlar:
├─ Çözünürlük: 1.0 (Tam - DÜŞME YOK!)
├─ FPS Limit: 30
├─ Glow: ❌
├─ Antialias: ❌
├─ Particles: ❌
└─ Shadows: ❌
```

---

### Örnek 6: iPhone 14 (Apple Flagship)
```
GPU: Apple A15 GPU     → +5 puan (HIGH)
RAM: 6GB               → +2 puan (Orta)
CPU: 6 cores           → +1 puan (Orta)
Screen: 60Hz           → +0 puan (Standart)
DPI: 3.0               → +1 puan (Yüksek)
─────────────────────────────────────────
TOPLAM:                  9 PUAN
TIER: MID ✅

⚠️ NOT: Apple GPU çok güçlü ama ekran 60Hz
Ayarlar:
├─ Çözünürlük: 1.0 (Tam)
├─ FPS Limit: 60 (Ekran limiti)
├─ Glow: ❌ (MID tier)
├─ Antialias: ❌
├─ Particles: Orta (65%)
└─ Shadows: Basit
```

---

### Örnek 7: iPhone 14 Pro (Apple Flagship Pro)
```
GPU: Apple A16 GPU     → +5 puan (HIGH)
RAM: 6GB               → +2 puan (Orta)
CPU: 6 cores           → +1 puan (Orta)
Screen: 120Hz          → +2 puan (Premium)
DPI: 3.0               → +1 puan (Yüksek)
─────────────────────────────────────────
TOPLAM:                  11 PUAN
TIER: MID ✅ (Sınırda HIGH)

Ayarlar:
├─ Çözünürlük: 1.0 (Tam)
├─ FPS Limit: 120
├─ Glow: ❌ (MID tier ama sınırda)
├─ Antialias: ❌
├─ Particles: Orta-Yüksek (80%)
└─ Shadows: Gelişmiş
```

---

## 🎮 TIER BAZLI FPS LİMİTLERİ

### 🔴 LOW TIER (1-7 puan)
```typescript
FPS Strategy:
├─ Target: 30 FPS
├─ Max: 40 FPS
└─ Çözünürlük: 1.0 (TAM - DÜŞME YOK!)
```

### 🟡 MID TIER (8-11 puan)
```typescript
FPS Strategy:
├─ Ekran 60Hz → FPS: 60
├─ Ekran 90Hz → FPS: 90 (TEST EDİLECEK!)
├─ Ekran 120Hz → FPS: 90 (Thermal koruma)
└─ Çözünürlük: 1.0 (TAM)
```

**Not:** MID tier'da 120Hz ekranlarda 90 FPS'e kilitliyoruz (thermal throttling önlemi)

### 🟢 HIGH TIER (12-15 puan)
```typescript
FPS Strategy:
├─ Ekran 60Hz → FPS: 60
├─ Ekran 90Hz → FPS: 90
├─ Ekran 120Hz → FPS: 120 (SINIRSIZ!)
└─ Çözünürlük: 1.0 (TAM)
```

---

## 📊 PUANLAMA DAĞILIMI

| Puan | Tier | Cihaz Örnekleri | FPS Stratejisi |
|------|------|-----------------|----------------|
| 14-15 | HIGH | S23 Ultra, S24 Ultra | 120 FPS |
| 12-13 | HIGH | S23, Xiaomi 13 | 120 FPS |
| 10-11 | MID | Oppo A60, iPhone 14 Pro | 90 FPS (120Hz ekranda) |
| 8-9 | MID | Poco X3, Realme 8 Pro | 90 FPS |
| 6-7 | LOW | Honor 9X (zorla) | 30-40 FPS |
| 4-5 | LOW | Redmi Note 9 | 30 FPS |
| 1-3 | LOW | Eski telefonlar | 30 FPS |

---

## 🧪 TEST PLANI

### Test 1: MID Tier 90Hz Testi
**Cihaz:** Oppo A60 (90Hz ekran)
- [ ] FPS 90'a çıksın
- [ ] 20 dakika oynansın
- [ ] Thermal throttling olur mu?
- [ ] FPS stabil kalır mı?

**Karar:**
- ✅ Stabil → MID tier 90Hz destekler
- ❌ Kasma → MID tier 60 FPS'e kilitlenir

### Test 2: MID Tier 120Hz Testi
**Cihaz:** Poco X3 (120Hz ekran)
- [ ] FPS 90'a kilitlensin (120 değil!)
- [ ] 20 dakika oynansın
- [ ] Thermal throttling olur mu?

**Karar:**
- ✅ Stabil → MID tier 90 FPS uygun
- ❌ Kasma → MID tier 60 FPS'e düşürülür

### Test 3: LOW Tier Çözünürlük Testi
**Cihaz:** Honor 9X
- [ ] Çözünürlük 1.0 kalmalı
- [ ] FPS 30-40 arasında olmalı
- [ ] SceneOptimizer çözünürlüğü düşürmemeli

---

## ✅ SONUÇ

**Yeni Sistem:**
- ✅ 1-15 puan baremi (daha detaylı)
- ✅ MID tier 90Hz/120Hz test edilecek
- ✅ LOW tier çözünürlük tam kalacak (DÜŞME YOK!)
- ✅ Ekran yenileme hızı puanlamaya dahil
- ✅ Daha akıllı GPU sınıflandırması (5 seviye)

**Kırmızı Çizgiler:**
- RAM ≤3GB → LOW
- GPU LOW + RAM ≤6GB → LOW
- GPU LOW + RAM 4GB → LOW

**FPS Stratejisi:**
- LOW: 30-40 FPS
- MID: 60-90 FPS (ekrana göre, test edilecek)
- HIGH: 60-120 FPS (ekrana göre)
