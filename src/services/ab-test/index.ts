/**
 * A/B Testing Module
 * 
 * Exports A/B testing functionality including:
 * - A/B Test Manager for variant assignment and tracking
 * - Feature flag helpers for runtime feature toggling
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.5, 9.6, 9.8, 9.9, 9.10
 */

export { ABTestManager, abTestManager } from './abTestManager';
export type { ABTestVariant, ABTest, ABTestConfig } from './abTestManager';

export {
  FeatureFlag,
  isFeatureEnabled,
  getFeatureValue,
  getAllFeatureFlags,
  getFeatureFlagConfig,
  getAllFeatureFlagConfigs,
  useFeatureFlag,
  FeatureGuard,
  withFeature,
  withFeatureOr,
  getFeatureValueOr,
} from './featureFlags';
