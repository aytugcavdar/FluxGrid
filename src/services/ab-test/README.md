# A/B Testing Infrastructure

This module provides A/B testing capabilities using Firebase Remote Config with deterministic variant assignment, caching, and analytics integration.

## Features

- **Deterministic Variant Assignment**: Hash-based assignment ensures users always get the same variant
- **Variant Caching**: Variants are cached in localStorage for consistency across sessions
- **Analytics Integration**: Automatic tracking of variant assignments and conversions
- **Feature Flags**: Runtime feature toggling with type-safe helpers
- **Remote Config Integration**: Fetch test configurations from Firebase Remote Config

## Requirements

Implements requirements: 9.1, 9.2, 9.3, 9.5, 9.6, 9.8, 9.9, 9.10

## Usage

### Basic A/B Testing

```typescript
import { abTestManager } from './services/ab-test';

// Get variant for a test
const variant = abTestManager.getVariant('tutorial_test');
// Returns: 'control' or 'variant_a'

// Get variant value with type safety
const tutorialLength = abTestManager.getVariantValue('tutorial_test', 'short');
// Returns: 'short' or 'long' based on variant

// Log conversion event
abTestManager.logConversion('tutorial_test', 'level_complete', 1);
```

### Feature Flags

```typescript
import { isFeatureEnabled, FeatureFlag } from './services/ab-test';

// Check if feature is enabled
if (isFeatureEnabled(FeatureFlag.DAILY_REWARD)) {
  // Show daily reward UI
}

// Get feature value
const rewardAmount = getFeatureValue(FeatureFlag.DAILY_REWARD, 100);

// Conditional execution
withFeature(FeatureFlag.ACHIEVEMENTS, () => {
  // Initialize achievement system
});
```

### React Integration

```typescript
import { FeatureGuard, useFeatureFlag } from './services/ab-test';

// Using FeatureGuard component
<FeatureGuard flag={FeatureFlag.NEW_UI}>
  <NewUIComponent />
</FeatureGuard>

// Using hook
function MyComponent() {
  const isNewUIEnabled = useFeatureFlag(FeatureFlag.NEW_UI);
  
  return isNewUIEnabled ? <NewUI /> : <OldUI />;
}
```

### Remote Config Setup

Configure A/B tests in Firebase Remote Config:

```json
{
  "test_tutorial": {
    "name": "Tutorial Variant Test",
    "enabled": true,
    "variants": [
      { "name": "control", "value": "short", "weight": 50 },
      { "name": "variant_a", "value": "long", "weight": 50 }
    ]
  },
  "test_reward_amount": {
    "name": "Reward Amount Test",
    "enabled": true,
    "variants": [
      { "name": "control", "value": 100, "weight": 50 },
      { "name": "variant_a", "value": 150, "weight": 50 }
    ]
  }
}
```

Feature flags:

```json
{
  "feature_daily_reward": "true",
  "feature_achievements": "true",
  "feature_new_ui": "false"
}
```

### Ad Manager Integration

```typescript
import { abTestManager } from './services/ab-test';
import { adManagerEnhanced } from './services/ads';

// Load ad configuration from A/B tests
adManagerEnhanced.loadConfigFromABTest(abTestManager);
```

## API Reference

### ABTestManager

#### Methods

- `getVariant(testId: string): string` - Get variant for a test
- `getVariantValue<T>(testId: string, defaultValue: T): T` - Get variant value with type safety
- `logConversion(testId: string, metricName: string, value?: number): void` - Log conversion event
- `forceVariant(testId: string, variantName: string): void` - Force a specific variant (testing)
- `getActiveTests(): ABTest[]` - Get all active tests
- `isFeatureEnabled(flagName: string): boolean` - Check if feature flag is enabled
- `getFeatureValue<T>(flagName: string, defaultValue: T): T` - Get feature flag value
- `refresh(): Promise<void>` - Refresh Remote Config
- `clearCache(): void` - Clear variant cache

### Feature Flag Helpers

#### Functions

- `isFeatureEnabled(flag: FeatureFlag): boolean` - Check if feature is enabled
- `getFeatureValue<T>(flag: FeatureFlag, defaultValue: T): T` - Get feature value
- `getAllFeatureFlags(): Map<FeatureFlag, boolean>` - Get all feature flags
- `withFeature(flag: FeatureFlag, callback: () => void): void` - Conditional execution
- `withFeatureOr(flag: FeatureFlag, onEnabled: () => void, onDisabled: () => void): void` - Conditional execution with fallback

#### React Helpers

- `useFeatureFlag(flag: FeatureFlag): boolean` - React hook for feature flags
- `FeatureGuard` - React component for conditional rendering

## Architecture

### Variant Assignment

Variants are assigned using a deterministic hash function:

1. Hash is calculated from `userId:testId`
2. Hash is normalized to 0-100 range
3. Variant is selected based on cumulative weights

This ensures:
- Same user always gets same variant
- Distribution matches configured weights
- No server-side state required

### Caching Strategy

Variants are cached in localStorage:

```typescript
{
  "ab_test:variants": {
    "tutorial_test": "control",
    "reward_amount": "variant_a"
  },
  "ab_test:user_id": "user_1234567890_abc123"
}
```

### Analytics Integration

Variant assignments are tracked as user properties:

```typescript
firebase.analytics().setUserProperties({
  'ab_test_tutorial': 'control',
  'ab_test_reward_amount': 'variant_a'
});
```

Conversions are logged as events:

```typescript
firebase.analytics().logEvent('ab_test_level_complete', {
  test_id: 'tutorial_test',
  variant: 'control',
  value: 1
});
```

## Testing

### Force Variant

```typescript
// Force a specific variant for testing
abTestManager.forceVariant('tutorial_test', 'variant_a');

// Clear cache to reset
abTestManager.clearCache();
```

### Mock Remote Config

```typescript
// In tests, mock Remote Config values
const mockConfig = {
  test_tutorial: JSON.stringify({
    name: 'Tutorial Test',
    enabled: true,
    variants: [
      { name: 'control', value: 'short', weight: 100 }
    ]
  })
};
```

## Best Practices

1. **Test Naming**: Use descriptive test IDs (e.g., `tutorial_variant`, `reward_amount`)
2. **Variant Weights**: Ensure weights sum to 100 for predictable distribution
3. **Conversion Tracking**: Log conversions for all key metrics
4. **Feature Flags**: Use feature flags for gradual rollouts
5. **Cache Management**: Clear cache when changing test configurations
6. **Analytics**: Set user properties for segmentation in analytics

## Troubleshooting

### Variant Not Changing

- Check if variant is cached in localStorage
- Clear cache using `abTestManager.clearCache()`
- Verify Remote Config is fetched and activated

### Remote Config Not Loading

- Check Firebase configuration in `.env`
- Verify Remote Config is initialized
- Check network connectivity
- Review console logs for errors

### Analytics Not Tracking

- Verify Firebase Analytics is initialized
- Check that events are being logged in Firebase console
- Ensure user properties are set correctly

## Migration Guide

### From Manual Feature Flags

Before:
```typescript
const FEATURE_DAILY_REWARD = true;

if (FEATURE_DAILY_REWARD) {
  // Show daily reward
}
```

After:
```typescript
import { isFeatureEnabled, FeatureFlag } from './services/ab-test';

if (isFeatureEnabled(FeatureFlag.DAILY_REWARD)) {
  // Show daily reward
}
```

### From Hardcoded A/B Tests

Before:
```typescript
const variant = Math.random() < 0.5 ? 'control' : 'variant_a';
```

After:
```typescript
import { abTestManager } from './services/ab-test';

const variant = abTestManager.getVariant('my_test');
```

## Related Services

- **Analytics Service**: Tracks variant assignments and conversions
- **Storage Manager**: Persists variant cache
- **Remote Config**: Provides test configurations
- **Ad Manager**: Uses A/B tests for ad configuration
