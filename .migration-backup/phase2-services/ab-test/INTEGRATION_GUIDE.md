# A/B Testing Integration Guide

This guide walks you through integrating the A/B Testing infrastructure into your FluxGrid application.

## Quick Start

### 1. Service Initialization

The A/B Test Manager is automatically initialized by the service initializer. No manual initialization required.

```typescript
import { initializeProductionServices } from './services/serviceInitializer';

// Initialize all services (including ABTestManager)
await initializeProductionServices();
```

### 2. Configure Firebase Remote Config

Add A/B test configurations to Firebase Remote Config:

1. Go to Firebase Console → Remote Config
2. Add parameters for your tests:

```json
{
  "test_tutorial": {
    "name": "Tutorial Length Test",
    "enabled": true,
    "variants": [
      { "name": "control", "value": "short", "weight": 50 },
      { "name": "variant_a", "value": "long", "weight": 50 }
    ]
  }
}
```

3. Publish changes

### 3. Use in Your Code

```typescript
import { abTestManager } from './services/ab-test';

// Get variant
const variant = abTestManager.getVariant('tutorial_test');

// Use variant
if (variant === 'control') {
  showShortTutorial();
} else {
  showLongTutorial();
}

// Log conversion
abTestManager.logConversion('tutorial_test', 'level_complete', 1);
```

## Integration Scenarios

### Scenario 1: Testing Tutorial Length

**Goal**: Determine if a longer tutorial improves retention

**Setup**:
```json
{
  "test_tutorial": {
    "name": "Tutorial Length Test",
    "enabled": true,
    "variants": [
      { "name": "control", "value": "short", "weight": 50 },
      { "name": "variant_a", "value": "long", "weight": 50 }
    ]
  }
}
```

**Implementation**:
```typescript
// In your tutorial component
const tutorialLength = abTestManager.getVariantValue('tutorial_test', 'short');

if (tutorialLength === 'short') {
  showTutorialSteps([1, 2, 3]);
} else {
  showTutorialSteps([1, 2, 3, 4, 5]);
}

// When tutorial completes
abTestManager.logConversion('tutorial_test', 'tutorial_complete', 1);

// When user completes first level
abTestManager.logConversion('tutorial_test', 'first_level_complete', 1);

// Track D1 retention
setTimeout(() => {
  abTestManager.logConversion('tutorial_test', 'd1_retention', 1);
}, 24 * 60 * 60 * 1000);
```

### Scenario 2: Testing Reward Amounts

**Goal**: Find optimal reward amount for ad watching

**Setup**:
```json
{
  "test_reward_amount": {
    "name": "Reward Amount Test",
    "enabled": true,
    "variants": [
      { "name": "control", "value": 100, "weight": 33 },
      { "name": "variant_a", "value": 150, "weight": 33 },
      { "name": "variant_b", "value": 200, "weight": 34 }
    ]
  }
}
```

**Implementation**:
```typescript
// When showing rewarded ad
const rewardAmount = abTestManager.getVariantValue('reward_amount_test', 100);

showRewardedAd({
  onRewarded: () => {
    giveUserCoins(rewardAmount);
    abTestManager.logConversion('reward_amount_test', 'ad_watched', 1);
  }
});

// Track if user watches more ads
abTestManager.logConversion('reward_amount_test', 'total_ads_watched', totalAdsWatched);
```

### Scenario 3: Feature Flag for New UI

**Goal**: Gradually roll out new UI to users

**Setup**:
```json
{
  "feature_new_ui": "false"  // Start with 0% rollout
}
```

**Implementation**:
```typescript
import { isFeatureEnabled, FeatureFlag } from './services/ab-test';

// In your app component
function App() {
  const isNewUIEnabled = isFeatureEnabled(FeatureFlag.NEW_UI);
  
  return isNewUIEnabled ? <NewUI /> : <OldUI />;
}

// Track engagement
if (isNewUIEnabled) {
  abTestManager.logConversion('new_ui_test', 'button_click', 1);
}
```

**Gradual Rollout**:
1. Start: `"feature_new_ui": "false"` (0%)
2. Week 1: Change to `"true"` for 10% of users (use Remote Config conditions)
3. Week 2: Increase to 25%
4. Week 3: Increase to 50%
5. Week 4: Full rollout 100%

### Scenario 4: Testing Ad Frequency

**Goal**: Optimize ad frequency for revenue vs UX

**Setup**:
```json
{
  "ad_interstitial_frequency": "3",  // Control: every 3 games
  "test_ad_frequency": {
    "name": "Ad Frequency Test",
    "enabled": true,
    "variants": [
      { "name": "control", "value": 3, "weight": 50 },
      { "name": "variant_a", "value": 5, "weight": 50 }
    ]
  }
}
```

**Implementation**:
```typescript
import { abTestManager } from './services/ab-test';
import { adManagerEnhanced } from './services/ads';

// On app startup
const adFrequency = abTestManager.getVariantValue('ad_frequency_test', 3);
adManagerEnhanced.updateConfig({ interstitialFrequency: adFrequency });

// Track metrics
abTestManager.logConversion('ad_frequency_test', 'ad_revenue', revenue);
abTestManager.logConversion('ad_frequency_test', 'session_length', sessionLength);
abTestManager.logConversion('ad_frequency_test', 'retention_d1', 1);
```

### Scenario 5: Testing Game Difficulty

**Goal**: Find optimal difficulty for engagement

**Setup**:
```json
{
  "test_difficulty": {
    "name": "Difficulty Test",
    "enabled": true,
    "variants": [
      { "name": "control", "value": "normal", "weight": 33 },
      { "name": "variant_a", "value": "easy", "weight": 33 },
      { "name": "variant_b", "value": "hard", "weight": 34 }
    ]
  }
}
```

**Implementation**:
```typescript
// In game initialization
const difficulty = abTestManager.getVariantValue('difficulty_test', 'normal');

const gameConfig = {
  normal: { speed: 1.0, complexity: 1.0 },
  easy: { speed: 0.8, complexity: 0.8 },
  hard: { speed: 1.2, complexity: 1.2 }
};

initializeGame(gameConfig[difficulty]);

// Track metrics
abTestManager.logConversion('difficulty_test', 'games_played', 1);
abTestManager.logConversion('difficulty_test', 'avg_score', score);
abTestManager.logConversion('difficulty_test', 'session_length', sessionLength);
```

## React Integration

### Using Feature Guards

```typescript
import { FeatureGuard, FeatureFlag } from './services/ab-test';

function GameScreen() {
  return (
    <div>
      <GameBoard />
      
      <FeatureGuard flag={FeatureFlag.DAILY_REWARD}>
        <DailyRewardButton />
      </FeatureGuard>
      
      <FeatureGuard flag={FeatureFlag.ACHIEVEMENTS}>
        <AchievementPanel />
      </FeatureGuard>
    </div>
  );
}
```

### Using Hooks

```typescript
import { useFeatureFlag, FeatureFlag } from './services/ab-test';

function SettingsScreen() {
  const isDarkModeEnabled = useFeatureFlag(FeatureFlag.DARK_MODE);
  const isHapticsEnabled = useFeatureFlag(FeatureFlag.HAPTIC_FEEDBACK);
  
  return (
    <div>
      {isDarkModeEnabled && <DarkModeToggle />}
      {isHapticsEnabled && <HapticsToggle />}
    </div>
  );
}
```

### Conditional Rendering

```typescript
import { isFeatureEnabled, FeatureFlag } from './services/ab-test';

function HomeScreen() {
  const showNewUI = isFeatureEnabled(FeatureFlag.NEW_UI);
  
  return showNewUI ? (
    <NewHomeScreen />
  ) : (
    <OldHomeScreen />
  );
}
```

## Analytics Integration

### Viewing Results in Firebase

1. Go to Firebase Console → Analytics → Events
2. Filter by event name: `ab_test_*`
3. View by user property: `ab_test_tutorial`, `ab_test_reward_amount`, etc.

### Creating Custom Reports

1. Go to Firebase Console → Analytics → Custom Definitions
2. Create custom dimensions for A/B test variants
3. Create custom metrics for conversion events
4. Build reports in Analytics dashboard

### Exporting Data

```typescript
// Export to BigQuery for advanced analysis
// Configure in Firebase Console → Project Settings → Integrations → BigQuery
```

## Testing and Debugging

### Force Variant for Testing

```typescript
// In development/testing
abTestManager.forceVariant('tutorial_test', 'variant_a');

// Test the variant
const variant = abTestManager.getVariant('tutorial_test');
console.log(variant); // 'variant_a'

// Reset
abTestManager.clearCache();
```

### View Active Tests

```typescript
const activeTests = abTestManager.getActiveTests();
console.log('Active A/B tests:', activeTests);
```

### Debug Logging

```typescript
// Enable debug logging in browser console
localStorage.setItem('debug', 'ab-test:*');

// View variant assignments
console.log('Variants:', abTestManager.getVariantCache());

// View user ID
console.log('User ID:', abTestManager.getUserId());
```

## Best Practices

### 1. Test Naming
- Use descriptive names: `tutorial_length_test`, not `test1`
- Include what you're testing: `reward_amount_test`
- Be consistent: `test_*` prefix for A/B tests

### 2. Variant Naming
- Use `control` for baseline
- Use `variant_a`, `variant_b` for alternatives
- Be descriptive: `short`, `long`, `easy`, `hard`

### 3. Conversion Tracking
- Track multiple metrics per test
- Include both primary and secondary metrics
- Track negative metrics (churn, uninstalls)

### 4. Sample Size
- Run tests for at least 1-2 weeks
- Aim for 1000+ users per variant
- Check statistical significance

### 5. Gradual Rollout
- Start with 10% of users
- Monitor for issues
- Gradually increase to 100%

### 6. Documentation
- Document test hypothesis
- Document expected impact
- Document results and learnings

## Troubleshooting

### Variant Not Changing

**Problem**: User always gets same variant even after changing Remote Config

**Solution**:
```typescript
// Clear cache to reset variant
abTestManager.clearCache();

// Force refresh Remote Config
await abTestManager.refresh();
```

### Remote Config Not Loading

**Problem**: Tests not loading from Firebase

**Solution**:
1. Check Firebase configuration in `.env`
2. Verify Remote Config is published in Firebase Console
3. Check network connectivity
4. Review browser console for errors

### Analytics Not Tracking

**Problem**: Conversion events not appearing in Firebase

**Solution**:
1. Verify Firebase Analytics is initialized
2. Check event names (must start with `ab_test_`)
3. Wait 24 hours for data to appear
4. Use DebugView in Firebase Console for real-time debugging

### Inconsistent Variants

**Problem**: User gets different variants across sessions

**Solution**:
- Check localStorage is enabled
- Verify user ID is persisted
- Don't clear cache unnecessarily

## Migration from Hardcoded Tests

### Before
```typescript
const showNewUI = Math.random() < 0.5;
```

### After
```typescript
const showNewUI = isFeatureEnabled(FeatureFlag.NEW_UI);
```

### Benefits
- Centralized configuration
- Runtime updates
- Analytics integration
- Consistent assignment

## Performance Considerations

- Variant assignment: O(1) after first calculation
- Cache lookup: O(1)
- Remote Config fetch: Async, non-blocking
- Storage: ~1KB per user

## Security Considerations

- User IDs are anonymous
- No PII stored
- Variants cached locally
- Server-side configuration

## Support

For issues or questions:
1. Check README.md
2. Review examples.ts
3. Check Firebase Console
4. Review implementation summary

## Next Steps

1. Configure your first A/B test in Firebase Remote Config
2. Implement variant logic in your code
3. Add conversion tracking
4. Monitor results in Firebase Analytics
5. Iterate and optimize

Happy testing! 🚀
