# Enhanced Particle Effects

SPSParticlePoolManager artık 5 yeni gelişmiş parçacık efekti içeriyor:

## 🔥 Fire Effect (Ateş)
**Kullanım:** `emitFire(position, count, config)`

- **Görünüm:** Kırmızı → Turuncu → Sarı renk geçişi
- **Hareket:** Yukarı doğru, hafif yanlara yayılma
- **Önerilen Kullanım:** Combo milestone (5, 10, 15), özel blok patlaması
- **Parçacık Sayısı:** 50-100
- **Süre:** 1 saniye

```typescript
particleManager.emitFire(position, 50, {
  color: new BABYLON.Color4(1, 0.5, 0, 1),
  lifetime: 1000,
  speed: 3.0,
  gravityDelay: 500,
  applyColorVariation: false,
});
```

## 💨 Smoke Effect (Duman)
**Kullanım:** `emitSmoke(position, count, config)`

- **Görünüm:** Gri-beyaz renk, yarı saydam
- **Hareket:** Yavaş yukarı, yanlara sürüklenme
- **Önerilen Kullanım:** Ateş efektinden sonra, blok yok olduğunda
- **Parçacık Sayısı:** 30-50
- **Süre:** 2 saniye

```typescript
particleManager.emitSmoke(position, 30, {
  color: new BABYLON.Color4(0.7, 0.7, 0.7, 0.6),
  lifetime: 2000,
  speed: 1.5,
  gravityDelay: 999999, // Yerçekimi yok
  applyColorVariation: false,
});
```

## ⭐ Star Burst (Yıldız Patlaması)
**Kullanım:** `emitStars(position, count, config)`

- **Görünüm:** Parlak renkler (sarı, cyan, magenta, turuncu, mor)
- **Hareket:** Radial patlama, az dikey hareket
- **Önerilen Kullanım:** Perfect clear, level up, büyük başarılar
- **Parçacık Sayısı:** 80-150
- **Süre:** 1.5 saniye

```typescript
particleManager.emitStars(position, 100, {
  color: new BABYLON.Color4(1, 1, 0, 1),
  lifetime: 1500,
  speed: 4.0,
  gravityDelay: 800,
  applyColorVariation: false,
});
```

## 🌀 Spiral Effect (Spiral)
**Kullanım:** `emitSpiral(position, count, config)`

- **Görünüm:** Gökkuşağı renkleri, spiral desen
- **Hareket:** Dönerek yukarı çıkma
- **Önerilen Kullanım:** Level up, özel mod aktivasyonu
- **Parçacık Sayısı:** 50-80
- **Süre:** 2 saniye

```typescript
particleManager.emitSpiral(position, 60, {
  color: new BABYLON.Color4(1, 0, 1, 1),
  lifetime: 2000,
  speed: 2.5,
  gravityDelay: 1000,
  applyColorVariation: false,
});
```

## ⚡ Lightning Effect (Şimşek)
**Kullanım:** `emitLightning(position, count, config)`

- **Görünüm:** Beyaz-mavi elektrik rengi
- **Hareket:** Hızlı zigzag, çok kısa ömür
- **Önerilen Kullanım:** Özel blok aktivasyonu, power-up
- **Parçacık Sayısı:** 30-50
- **Süre:** 0.3 saniye (çok hızlı)

```typescript
particleManager.emitLightning(position, 40, {
  color: new BABYLON.Color4(0.8, 0.8, 1, 1),
  lifetime: 300,
  speed: 8.0,
  gravityDelay: 999999, // Yerçekimi yok
  applyColorVariation: false,
});
```

## 🎯 Kombine Efektler

### Ateş + Duman
```typescript
// Ateş
particleManager.emitFire(position, 50, fireConfig);

// 500ms sonra duman
setTimeout(() => {
  particleManager.emitSmoke(position, 30, smokeConfig);
}, 500);
```

### Kutlama (Yıldız + Spiral)
```typescript
// Yıldız patlaması
particleManager.emitStars(position, 100, starConfig);

// 200ms sonra spiral
setTimeout(() => {
  particleManager.emitSpiral(position, 60, spiralConfig);
}, 200);
```

### Power-Up (Şimşek + Yıldız)
```typescript
// Şimşek
particleManager.emitLightning(position, 40, lightningConfig);

// 100ms sonra yıldızlar
setTimeout(() => {
  particleManager.emitStars(position, 50, starConfig);
}, 100);
```

## 📊 Performans

Tüm efektler aynı SPS sistemini kullanır:
- ✅ Tek draw call (tüm parçacıklar için)
- ✅ 2000 parçacık havuzu (paylaşımlı)
- ✅ CPU-based physics
- ✅ Frustum culling (500+ parçacık)
- ✅ Adaptive quality (performans düşerse otomatik azaltma)

## 🎮 Oyun Entegrasyonu

```typescript
// Grid.tsx veya JuiceTriggers.ts içinde

// Combo milestone
if (combo === 5) {
  particleManager.emitFire(blockPosition, 50, ENHANCED_PARTICLE_PRESETS.fire);
}

// Perfect clear
if (isPerfectClear) {
  particleManager.emitStars(centerPosition, 100, ENHANCED_PARTICLE_PRESETS.stars);
  setTimeout(() => {
    particleManager.emitSpiral(centerPosition, 60, ENHANCED_PARTICLE_PRESETS.spiral);
  }, 200);
}

// Special block
if (specialBlockActivated) {
  particleManager.emitLightning(blockPosition, 40, ENHANCED_PARTICLE_PRESETS.lightning);
}

// Level up
if (levelUp) {
  particleManager.emitSpiral(centerPosition, 60, ENHANCED_PARTICLE_PRESETS.spiral);
}
```

## 🎨 Renk Özelleştirme

Her efekt kendi renklerini oluşturur, ancak istersen özelleştirebilirsin:

```typescript
// Özel renk fire efekti (yeşil ateş!)
// Not: Fire efekti config.color'u kullanmaz, kendi renklerini oluşturur
// Ama kod içinde değiştirebilirsin

// Özel renk yıldızlar
// starColors dizisini SPSParticlePoolManager.ts içinde düzenle
```

## 📝 Notlar

- Tüm efektler `applyColorVariation: false` kullanır (kendi renklerini oluştururlar)
- Fire, smoke, stars, spiral, lightning kendi renk mantığına sahip
- Performans için parçacık sayısını ayarlayabilirsin
- Mobil cihazlarda otomatik olarak azaltılır (AdaptiveQualitySystem)

## 🚀 Örnek Kullanım

Detaylı örnekler için bak:
- `src/features/visual-effects/particles/examples/enhancedParticleExamples.ts`
