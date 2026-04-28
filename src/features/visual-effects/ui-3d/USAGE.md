# 3D UI Effects - Kullanım Kılavuzu

## 🎯 Genel Bakış

3D UI Effects sistemi, oyunda görsel feedback için 4 farklı 3D UI elementi sağlar:

1. **Floating Score** - Skor kazanıldığında yukarı uçan 3D text
2. **Combo Meter** - Combo seviyesini gösteren dönen 3D halka
3. **Level Up Banner** - Level atladığında yan taraftan gelen 3D banner
4. **Achievement Popup** - Achievement kazanıldığında pop-up yapan 3D panel

## 🚀 Kurulum

### Grid.tsx'e Entegrasyon

```typescript
import { UI3DManager } from '@/features/visual-effects/ui-3d';

// Grid component içinde
const [ui3dManager, setUi3dManager] = useState<UI3DManager | null>(null);

// Scene hazır olduğunda
useEffect(() => {
  if (scene) {
    const manager = new UI3DManager(scene);
    
    // Combo meter'ı başlat (grid'in sağ üst köşesi)
    manager.initializeComboMeter(new BABYLON.Vector3(8, 15, 0));
    
    setUi3dManager(manager);
    
    return () => {
      manager.dispose();
    };
  }
}, [scene]);

// Update loop'ta
useEffect(() => {
  if (ui3dManager) {
    scene.onBeforeRenderObservable.add(() => {
      const deltaTime = engine.getDeltaTime();
      ui3dManager.update(deltaTime);
    });
  }
}, [ui3dManager]);
```

## 📝 Kullanım Örnekleri

### 1. Floating Score (Uçan Skor)

```typescript
// Line clear'da skor göster
function onLineClear(linesCleared: number, position: BABYLON.Vector3) {
  const score = linesCleared * 100;
  
  // Sarı renk (default)
  ui3dManager.showFloatingScore(score, position);
  
  // Özel renk
  ui3dManager.showFloatingScore(
    score,
    position,
    new BABYLON.Color3(1, 0, 0) // Kırmızı
  );
}

// Combo bonus
function onComboBonus(combo: number, position: BABYLON.Vector3) {
  const bonus = combo * 50;
  ui3dManager.showFloatingScore(
    bonus,
    position,
    new BABYLON.Color3(1, 0.5, 0) // Turuncu
  );
}

// Perfect clear
function onPerfectClear(position: BABYLON.Vector3) {
  ui3dManager.showFloatingScore(
    5000,
    position,
    new BABYLON.Color3(0, 1, 1) // Cyan
  );
}
```

### 2. Combo Meter (Combo Göstergesi)

```typescript
// Combo değiştiğinde
function onComboChange(newCombo: number) {
  // Combo meter'ı güncelle (max combo 10)
  ui3dManager.updateCombo(newCombo, 10);
  
  // Combo arttıkça renk değişir:
  // 0-2: Sarı
  // 3-6: Turuncu
  // 7+: Kırmızı
}

// Combo sıfırlandığında
function onComboBreak() {
  ui3dManager.updateCombo(0);
  // Meter otomatik gizlenir
}
```

### 3. Level Up Banner

```typescript
// Level atladığında
function onLevelUp(newLevel: number) {
  // Banner grid'in ortasında göster
  const centerPosition = new BABYLON.Vector3(5, 10, 0);
  ui3dManager.showLevelUp(newLevel, centerPosition);
}

// Örnek: Level 5'e geçiş
ui3dManager.showLevelUp(5, new BABYLON.Vector3(5, 10, 0));
```

### 4. Achievement Popup

```typescript
// Achievement kazanıldığında
function onAchievementUnlocked(title: string, icon: string) {
  // Popup sağ üst köşede göster
  const position = new BABYLON.Vector3(8, 12, 0);
  ui3dManager.showAchievement(title, icon, position);
}

// Örnekler
ui3dManager.showAchievement(
  'First Blood',
  '🎯',
  new BABYLON.Vector3(8, 12, 0)
);

ui3dManager.showAchievement(
  'Combo Master',
  '🔥',
  new BABYLON.Vector3(8, 12, 0)
);

ui3dManager.showAchievement(
  'Speed Demon',
  '⚡',
  new BABYLON.Vector3(8, 12, 0)
);

ui3dManager.showAchievement(
  'Perfect Clear',
  '✨',
  new BABYLON.Vector3(8, 12, 0)
);
```

## 🎮 Oyun Olaylarına Entegrasyon

### JuiceTriggers.ts'de Kullanım

```typescript
// Line clear
export function triggerLineClearEffects(
  lines: number,
  position: BABYLON.Vector3,
  ui3dManager: UI3DManager
) {
  // Skor göster
  const score = lines * 100;
  ui3dManager.showFloatingScore(score, position);
  
  // Combo güncelle
  const newCombo = getCurrentCombo() + 1;
  ui3dManager.updateCombo(newCombo);
}

// Perfect clear
export function triggerPerfectClearEffects(
  position: BABYLON.Vector3,
  ui3dManager: UI3DManager
) {
  // Büyük skor
  ui3dManager.showFloatingScore(
    5000,
    position,
    new BABYLON.Color3(0, 1, 1)
  );
  
  // Achievement
  ui3dManager.showAchievement(
    'Perfect Clear!',
    '✨',
    new BABYLON.Vector3(8, 12, 0)
  );
}

// Level up
export function triggerLevelUpEffects(
  newLevel: number,
  ui3dManager: UI3DManager
) {
  ui3dManager.showLevelUp(newLevel, new BABYLON.Vector3(5, 10, 0));
}
```

## 🎨 Özelleştirme

### Config Değerlerini Değiştir

```typescript
// src/features/visual-effects/ui-3d/config/ui3d.config.ts

export const UI3D_CONFIG = {
  floatingScore: {
    fontSize: 48,        // Text boyutu
    duration: 1000,      // Animasyon süresi (ms)
    floatDistance: 2.0,  // Uçma mesafesi
    fadeStart: 0.6,      // Fade başlangıcı (%)
  },
  
  comboMeter: {
    radius: 1.5,         // Halka yarıçapı
    thickness: 0.2,      // Halka kalınlığı
    pulseScale: 1.2,     // Pulse büyüklüğü
    rotationSpeed: Math.PI / 2, // Dönme hızı
  },
  
  // ... diğer ayarlar
};
```

## 🎯 Pozisyon Önerileri

```typescript
// Grid boyutları: 10x20 (genişlik x yükseklik)

// Floating Score: Blok pozisyonunda
const blockPos = new BABYLON.Vector3(x, y, 0);

// Combo Meter: Sağ üst köşe
const comboPos = new BABYLON.Vector3(8, 15, 0);

// Level Up Banner: Orta
const bannerPos = new BABYLON.Vector3(5, 10, 0);

// Achievement: Sağ üst (combo meter'ın altı)
const achievementPos = new BABYLON.Vector3(8, 12, 0);
```

## ⚡ Performans

- Tüm UI elementleri billboard mode kullanır (her zaman kameraya bakar)
- Dynamic texture'lar tek seferlik oluşturulur
- Animasyonlar CPU-based (GPU'ya yük yok)
- Otomatik cleanup (animasyon bitince dispose)
- Hafif ve optimize

## 🐛 Sorun Giderme

### UI elementleri görünmüyor
- Scene'in hazır olduğundan emin ol
- Pozisyonların kamera görüş alanında olduğunu kontrol et
- Billboard mode aktif mi kontrol et

### Text bulanık görünüyor
- DynamicTexture boyutunu artır (textureSize)
- Font size'ı ayarla

### Animasyon takılıyor
- update() metodunun her frame çağrıldığından emin ol
- deltaTime'ın doğru hesaplandığını kontrol et

## 📚 API Referansı

### UI3DManager

```typescript
// Initialization
const manager = new UI3DManager(scene);
manager.initializeComboMeter(position);

// Methods
manager.showFloatingScore(score, position, color?);
manager.updateCombo(combo, maxCombo?);
manager.showLevelUp(level, position);
manager.showAchievement(title, icon, position);
manager.update(deltaTime);
manager.dispose();
```

## 🎉 Örnek Senaryo

```typescript
// Oyun başlangıcı
const ui3d = new UI3DManager(scene);
ui3d.initializeComboMeter(new BABYLON.Vector3(8, 15, 0));

// Line clear (2 satır)
ui3d.showFloatingScore(200, blockPos);
ui3d.updateCombo(1);

// Bir satır daha
ui3d.showFloatingScore(100, blockPos);
ui3d.updateCombo(2);

// Combo bonus
ui3d.showFloatingScore(100, blockPos, new BABYLON.Color3(1, 0.5, 0));
ui3d.updateCombo(3);

// Level 2'ye geçiş
ui3d.showLevelUp(2, new BABYLON.Vector3(5, 10, 0));

// Achievement
ui3d.showAchievement('Combo Master', '🔥', new BABYLON.Vector3(8, 12, 0));

// Update loop
scene.onBeforeRenderObservable.add(() => {
  ui3d.update(engine.getDeltaTime());
});
```

Artık oyunun çok daha premium ve profesyonel görünmesi gerekiyor! 🎮✨
