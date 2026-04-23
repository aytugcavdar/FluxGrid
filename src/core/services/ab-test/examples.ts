/**
 * A/B Testing Examples
 * 
 * Demonstrates how to use the A/B Test Manager and Feature Flags
 * in various scenarios.
 */

import { abTestManager } from './abTestManager';
import { isFeatureEnabled, FeatureFlag, withFeature } from './featureFlags';

/**
 * Example 1: Basic A/B Test Usage
 * 
 * Test different tutorial lengths to see which leads to better retention
 */
export function exampleTutorialTest() {
  // Get variant for tutorial test
  const variant = abTestManager.getVariant('tutorial_test');
  
  if (variant === 'control') {
    // Show short tutorial (3 steps)
    console.log('Showing short tutorial');
  } else if (variant === 'variant_a') {
    // Show long tutorial (5 steps)
    console.log('Showing long tutorial');
  }
  
  // Log conversion when user completes first level
  abTestManager.logConversion('tutorial_test', 'level_complete', 1);
}

/**
 * Example 2: Typed Variant Values
 * 
 * Test different reward amounts to optimize engagement
 */
export function exampleRewardAmountTest() {
  // Get reward amount with type safety
  const rewardAmount = abTestManager.getVariantValue('reward_amount_test', 100);
  
  console.log(`Giving user ${rewardAmount} coins as reward`);
  
  // Log conversion when user watches rewarded ad
  abTestManager.logConversion('reward_amount_test', 'ad_watched', rewardAmount);
}

/**
 * Example 3: Feature Flags
 * 
 * Enable/disable features at runtime
 */
export function exampleFeatureFlags() {
  // Check if daily reward is enabled
  if (isFeatureEnabled(FeatureFlag.DAILY_REWARD)) {
    console.log('Daily reward system is enabled');
    // Initialize daily reward UI
  }
  
  // Check if achievements are enabled
  if (isFeatureEnabled(FeatureFlag.ACHIEVEMENTS)) {
    console.log('Achievement system is enabled');
    // Initialize achievement tracking
  }
  
  // Conditional execution
  withFeature(FeatureFlag.PARTICLE_EFFECTS, () => {
    console.log('Enabling particle effects');
    // Enable particle system
  });
}

/**
 * Example 4: Ad Configuration via A/B Test
 * 
 * Test different ad frequencies to optimize revenue vs UX
 */
export function exampleAdConfigTest() {
  // Get ad frequency from A/B test
  const interstitialFrequency = abTestManager.getFeatureValue('ad_interstitial_frequency', 3);
  const rewardedDailyLimit = abTestManager.getFeatureValue('ad_rewarded_daily_limit', 3);
  
  console.log(`Interstitial frequency: every ${interstitialFrequency} games`);
  console.log(`Rewarded daily limit: ${rewardedDailyLimit} ads`);
  
  // Apply configuration to ad manager
  // adManagerEnhanced.updateConfig({ interstitialFrequency, rewardedDailyLimit });
}

/**
 * Example 5: Gradual Feature Rollout
 * 
 * Roll out new UI to a percentage of users
 */
export function exampleGradualRollout() {
  // Check if new UI is enabled for this user
  const isNewUIEnabled = isFeatureEnabled(FeatureFlag.NEW_UI);
  
  if (isNewUIEnabled) {
    console.log('User is in new UI test group');
    // Load new UI components
  } else {
    console.log('User is in control group (old UI)');
    // Load old UI components
  }
  
  // Log conversion when user completes action
  if (isNewUIEnabled) {
    abTestManager.logConversion('new_ui_test', 'button_click', 1);
  }
}

/**
 * Example 6: Multi-Variant Test
 * 
 * Test multiple variants (A/B/C test)
 */
export function exampleMultiVariantTest() {
  const variant = abTestManager.getVariant('difficulty_test');
  
  switch (variant) {
    case 'control':
      console.log('Normal difficulty');
      break;
    case 'variant_a':
      console.log('Easy difficulty');
      break;
    case 'variant_b':
      console.log('Hard difficulty');
      break;
  }
  
  // Log conversion with difficulty-specific metric
  abTestManager.logConversion('difficulty_test', 'game_complete', 1);
}

/**
 * Example 7: Testing and Debugging
 * 
 * Force specific variants for testing
 */
export function exampleTestingAndDebugging() {
  // Force a specific variant for testing
  abTestManager.forceVariant('tutorial_test', 'variant_a');
  
  // Get all active tests
  const activeTests = abTestManager.getActiveTests();
  console.log('Active A/B tests:', activeTests);
  
  // Clear cache to reset variants
  abTestManager.clearCache();
  
  // Refresh Remote Config
  abTestManager.refresh();
}

/**
 * Example 8: Integration with Analytics
 * 
 * Track A/B test performance in analytics
 */
export function exampleAnalyticsIntegration() {
  // Get variant
  const variant = abTestManager.getVariant('onboarding_test');
  
  // Variant is automatically set as user property in analytics
  // You can now segment analytics by A/B test variant
  
  // Log custom events with variant context
  abTestManager.logConversion('onboarding_test', 'signup_complete', 1);
  abTestManager.logConversion('onboarding_test', 'first_purchase', 9.99);
}

/**
 * Example 9: React Component Integration
 * 
 * Use feature flags in React components
 */
export function exampleReactIntegration() {
  // Example React component (pseudo-code)
  /*
  import { FeatureGuard, useFeatureFlag } from './services/ab-test';
  
  function MyComponent() {
    const isDailyRewardEnabled = useFeatureFlag(FeatureFlag.DAILY_REWARD);
    
    return (
      <div>
        {isDailyRewardEnabled && <DailyRewardButton />}
        
        <FeatureGuard flag={FeatureFlag.ACHIEVEMENTS}>
          <AchievementPanel />
        </FeatureGuard>
      </div>
    );
  }
  */
}

/**
 * Example 10: Remote Config Setup
 * 
 * Configure A/B tests in Firebase Remote Config
 */
export function exampleRemoteConfigSetup() {
  /*
  Firebase Remote Config parameters:
  
  test_tutorial:
  {
    "name": "Tutorial Length Test",
    "enabled": true,
    "variants": [
      { "name": "control", "value": "short", "weight": 50 },
      { "name": "variant_a", "value": "long", "weight": 50 }
    ]
  }
  
  test_reward_amount:
  {
    "name": "Reward Amount Test",
    "enabled": true,
    "variants": [
      { "name": "control", "value": 100, "weight": 33 },
      { "name": "variant_a", "value": 150, "weight": 33 },
      { "name": "variant_b", "value": 200, "weight": 34 }
    ]
  }
  
  feature_daily_reward: "true"
  feature_achievements: "true"
  feature_new_ui: "false"
  
  ad_interstitial_frequency: "3"
  ad_rewarded_daily_limit: "3"
  */
}
