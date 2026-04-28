## 💣 Bomb Block
- **Efekt:** Patlama + shockwave ring
- **Etki:** 2 hücre yarıçapında blokları yok eder
- **Parçacıklar:** Radial explosion + fire
- **Süre:** 500ms

```typescript
specialBlockManager.triggerBombExplosion(
  position,
  (x, y) => {
    // Destroy block at (x, y)
    destroyBlockAt(x, y);
  }
);
```

## ❄️ Ice Block
- **Efekt:** Frost overlay + ice particles
- **Etki:** Yakındaki blokları 3 saniye dondurur
- **Parçacıklar:** Radial ice particles
- **Süre:** 3000ms

```typescript
const affectedBlocks = getBlocksInRadius(position, 1);
specialBlockManager.triggerIceFreeze(position, affectedBlocks);
```

## 🔥 Fire Block
- **Efekt:** Flame mesh + fire particles
- **Etki:** 2 saniye yanar, %30 şansla yayılır
- **Parçacıklar:** Fire particles
- **Süre:** 2000ms

```typescript
specialBlockManager.triggerFireBurn(position, gridX, gridY);
```

## ⚡ Lightning Block
- **Efekt:** Chain lightning + electric particles
- **Etki:** 3 bloğa zincir şimşek
- **Parçacıklar:** Lightning particles
- **Süre:** 100ms delay per chain

```typescript
const targets = [pos1, pos2, pos3];
specialBlockManager.triggerLightningChain(startPos, targets);
```

## 🎮 Oyuna Entegrasyon

```typescript
// Grid.tsx içinde
const specialBlockManager = new SpecialBlockEffectsManager(scene, particleManager);

// Update loop
scene.onBeforeRenderObservable.add(() => {
  specialBlockManager.update(engine.getDeltaTime());
});

// Özel blok aktivasyonu
function activateSpecialBlock(type: SpecialBlockType, position: Vector3) {
  switch (type) {
    case SpecialBlockType.Bomb:
      specialBlockManager.triggerBombExplosion(position, destroyBlock);
      break;
    case SpecialBlockType.Ice:
      const blocks = getAdjacentBlocks(position);
      specialBlockManager.triggerIceFreeze(position, blocks);
      break;
    case SpecialBlockType.Fire:
      specialBlockManager.triggerFireBurn(position, x, y);
      break;
    case SpecialBlockType.Lightning:
      const targets = findLightningTargets(position);
      specialBlockManager.triggerLightningChain(position, targets);
      break;
  }
}
```

Artık oyunda 4 farklı özel blok efekti var! 💥❄️🔥⚡
