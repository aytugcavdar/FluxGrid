# Analytics and Performance Monitoring

Bu modül, Firebase Analytics entegrasyonu, oyun event tracking, reklam event tracking ve performans izleme özelliklerini içerir.

## 📦 Modüller

### 1. Analytics Service (`analyticsService.ts`)
Firebase Analytics entegrasyonu ile event logging, user properties ve session tracking.

**Özellikler**:
- Event batching (10 event veya 30 saniye)
- User properties ve user ID yönetimi
- Otomatik session tracking
- Event parameter validasyonu
- Offline event queueing

**Kullanım**:
```typescript
import { analyticsService } from './services/analytics/analyticsService';

// Initialize
await analyticsService.initialize();
await analyticsService.start();

// Log event
analyticsService.logEvent('button_click', {
  button_name: 'play',
  screen: 'home',
});

// Set user ID
analyticsService.setUserId('user123');

// Set user property
analyticsService.setUserProperty('skill_level', 'advanced');
```

### 2. Game Events (`gameEvents.ts`)
Oyun-specific event tracking helpers.

**Event Türleri**:
- Game lifecycle: `game_start`, `game_end`, `game_pause`, `game_resume`
- Level events: `level_complete`, `level_up`, `score_milestone`, `high_score`
- Ability events: `ability_used`, `ability_unlocked`
- Game mechanics: `line_cleared`, `combo_achieved`, `chain_achieved`, `perfect_placement`

**Kullanım**:
```typescript
import { GameEventTracker, AbilityType } from './services/analytics/gameEvents';

// Log game start
GameEventTracker.logGameStart({
  difficulty: 'normal',
  mode: 'endless',
});

// Log game end
GameEventTracker.logGameEnd({
  score: 12500,
  duration: 180, // seconds
  linesCleared: 45,
  level: 8,
  reason: 'game_over',
});

// Log ability used
GameEventTracker.logAbilityUsed({
  abilityType: AbilityType.CHRONO,
  level: 5,
  score: 8000,
  success: true,
});

// Set game user properties
GameEventTracker.setGameUserProperties({
  totalGamesPlayed: 50,
  highScore: 25000,
  favoriteAbility: AbilityType.SURGE,
  skillLevel: 'advanced',
});
```

### 3. Ad Events (`adEvents.ts`)
Reklam event tracking ve revenue tracking.

**Event Türleri**:
- `ad_impression`: Reklam gösterimi
- `ad_click`: Reklam tıklaması
- `ad_revenue`: Reklam geliri
- `ad_load`: Reklam yükleme
- `ad_load_failed`: Reklam yükleme hatası
- `ad_dismissed`: Reklam kapatma
- `ad_rewarded`: Ödüllü reklam tamamlama

**Kullanım**:
```typescript
import { AdEventTracker, AdType, AdPlacement } from './services/analytics/adEvents';

// Log ad impression
AdEventTracker.logAdImpression({
  adType: AdType.INTERSTITIAL,
  adUnitId: 'ca-app-pub-xxx',
  placement: AdPlacement.GAME_END,
  adNetwork: 'admob',
});

// Log ad revenue
AdEventTracker.logAdRevenue({
  adType: AdType.REWARDED,
  adUnitId: 'ca-app-pub-xxx',
  placement: AdPlacement.CONTINUE_GAME,
  value: 0.05, // USD
  currency: 'USD',
  precision: 'estimated',
});

// Track ad metrics
AdEventTracker.updateAdMetrics({
  totalAdsViewed: 100,
  totalAdsClicked: 5,
  totalRewardedAdsViewed: 20,
  totalAdRevenue: 2.50,
});
```

### 4. Performance Monitor (`performanceMonitor.ts`)
FPS, memory ve load time tracking.

**Özellikler**:
- FPS tracking (requestAnimationFrame)
- Memory tracking (performance.memory API)
- Load time tracking (Performance API)
- Otomatik performans raporlama
- Performans alertleri

**Kullanım**:
```typescript
import { performanceMonitor } from './services/performance/performanceMonitor';

// Initialize and start
await performanceMonitor.initialize();
await performanceMonitor.start();

// Get metrics
const metrics = performanceMonitor.getMetrics();
console.log('FPS:', metrics.avgFps);
console.log('Memory:', metrics.memoryPercent + '%');

// Check performance
if (!performanceMonitor.isPerformanceAcceptable()) {
  console.warn('Poor performance detected');
}

// Get quality level
const quality = performanceMonitor.getQualityLevel(); // 'low' | 'medium' | 'high'
```

### 5. Quality Adjuster (`qualityAdjuster.ts`)
Otomatik grafik kalitesi ayarlama.

**Özellikler**:
- Device-based initial quality
- Performance-based auto adjustment
- Quality presets (low, medium, high, ultra)
- Quality change listeners

**Kullanım**:
```typescript
import { qualityAdjuster, QualityPresets } from './services/performance/qualityAdjuster';

// Start monitoring
qualityAdjuster.start();

// Get current settings
const settings = qualityAdjuster.getSettings();
console.log('Particle effects:', settings.particleEffects);
console.log('Shadows:', settings.shadows);

// Set preset
qualityAdjuster.setPreset('high');

// Listen to quality changes
qualityAdjuster.addListener((settings) => {
  console.log('Quality changed:', settings);
  // Apply settings to game engine
});

// Get recommended preset
const recommended = qualityAdjuster.getRecommendedPreset();
```

## 🚀 Entegrasyon

### App Başlangıcında

```typescript
import { analyticsService } from './services/analytics/analyticsService';
import { performanceMonitor } from './services/performance/performanceMonitor';
import { qualityAdjuster } from './services/performance/qualityAdjuster';
import { sessionTracker } from './services/analytics/gameEvents';

// Initialize services
await analyticsService.initialize();
await performanceMonitor.initialize();

// Start services
await analyticsService.start();
await performanceMonitor.start();
qualityAdjuster.start();
sessionTracker.start();
```

### Oyun Lifecycle'da

```typescript
import { GameEventTracker } from './services/analytics/gameEvents';

// Game start
function onGameStart() {
  GameEventTracker.logGameStart({
    difficulty: 'normal',
    mode: 'endless',
  });
}

// Game end
function onGameEnd(score: number, duration: number) {
  GameEventTracker.logGameEnd({
    score,
    duration,
    linesCleared: totalLines,
    level: currentLevel,
    reason: 'game_over',
  });
}

// Ability used
function onAbilityUsed(abilityType: string) {
  GameEventTracker.logAbilityUsed({
    abilityType,
    level: currentLevel,
    score: currentScore,
    success: true,
  });
}
```

### AdMob Entegrasyonu

```typescript
import { AdEventTracker, AdType, AdPlacement } from './services/analytics/adEvents';

// Ad impression
admob.on('impression', (ad) => {
  AdEventTracker.logAdImpression({
    adType: AdType.INTERSTITIAL,
    adUnitId: ad.adUnitId,
    placement: AdPlacement.GAME_END,
  });
});

// Ad revenue
admob.on('revenue', (ad, revenue) => {
  AdEventTracker.logAdRevenue({
    adType: ad.type,
    adUnitId: ad.adUnitId,
    placement: ad.placement,
    value: revenue.value,
    currency: revenue.currency,
  });
});
```

## 📊 Firebase Analytics Dashboard

### Önemli Metrikler

1. **Engagement**:
   - Session duration
   - Games played per session
   - Retention rate

2. **Performance**:
   - Average FPS
   - Memory usage
   - Load time

3. **Monetization**:
   - Ad impressions
   - Ad revenue
   - eCPM (effective cost per mille)

4. **Game Metrics**:
   - Average score
   - High scores
   - Level progression
   - Ability usage

### Custom Events

Tüm custom eventler Firebase Analytics dashboard'da görüntülenebilir:
- Events > All Events
- Custom definitions > Custom events

### User Properties

User properties ile segmentasyon yapabilirsiniz:
- Skill level (beginner, intermediate, advanced, expert)
- Device tier (low, mid, high)
- Total games played
- High score
- Favorite ability

## 🔧 Yapılandırma

### Analytics Service

```typescript
analyticsService.updateConfig({
  enabled: true,
  batchSize: 10,
  batchTimeout: 30000,
});
```

### Performance Monitor

```typescript
performanceMonitor.updateConfig({
  enabled: true,
  fpsTrackingEnabled: true,
  memoryTrackingEnabled: true,
  sampleInterval: 1000,
  reportInterval: 60000,
  thresholds: {
    minAcceptableFps: 30,
    targetFps: 60,
    maxMemoryPercent: 80,
  },
});
```

### Quality Adjuster

```typescript
qualityAdjuster.updateConfig({
  enabled: true,
  autoAdjust: true,
  checkInterval: 5000,
  adjustmentThreshold: 3,
});
```

## 📝 Best Practices

1. **Event Naming**: Küçük harf ve underscore kullanın (`game_start`, `ability_used`)
2. **Parameter Naming**: Küçük harf ve underscore kullanın (`ability_type`, `score`)
3. **Batching**: Event batching otomatik çalışır, manuel flush gerekmez
4. **User Properties**: Sık değişmeyen özellikleri user property olarak kaydedin
5. **Performance**: Performans metrikleri otomatik raporlanır
6. **Quality**: Quality adjuster otomatik çalışır, manuel müdahale gerekmez

## 🐛 Debugging

### Analytics Events

```typescript
// Enable debug logging
analyticsService.logger.setLevel('debug');

// Check pending events
const pendingCount = analyticsService.getPendingEventCount();
console.log('Pending events:', pendingCount);

// Flush events manually
await analyticsService.flushEvents();
```

### Performance Metrics

```typescript
// Get current metrics
const metrics = performanceMonitor.getMetrics();
console.log('Metrics:', metrics);

// Get alerts
const alerts = performanceMonitor.getAlerts();
console.log('Alerts:', alerts);

// Clear alerts
performanceMonitor.clearAlerts();
```

### Quality Settings

```typescript
// Get current settings
const settings = qualityAdjuster.getSettings();
console.log('Settings:', settings);

// Get device info
const deviceInfo = qualityAdjuster.getDeviceInfo();
console.log('Device:', deviceInfo);
```

## 📚 Kaynaklar

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [AdMob Integration](https://developers.google.com/admob/android/quick-start)
