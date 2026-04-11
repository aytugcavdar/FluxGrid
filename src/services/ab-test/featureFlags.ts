/**
 * Feature Flag Helpers
 * 
 * Convenient helpers for feature flag management and runtime toggling.
 * Provides type-safe access to feature flags with fallback values.
 * 
 * Requirements: 9.8, 9.10
 */

import { abTestManager } from './abTestManager';

/**
 * Known feature flags
 */
export enum FeatureFlag {
  DAILY_REWARD = 'daily_reward',
  ACHIEVEMENTS = 'achievements',
  NEW_UI = 'new_ui',
  SOCIAL_SHARING = 'social_sharing',
  CLOUD_BACKUP = 'cloud_backup',
  DARK_MODE = 'dark_mode',
  HAPTIC_FEEDBACK = 'haptic_feedback',
  PARTICLE_EFFECTS = 'particle_effects',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  BETA_FEATURES = 'beta_features',
}

/**
 * Feature flag configuration
 */
interface FeatureFlagConfig {
  name: string;
  description: string;
  defaultValue: boolean;
}

/**
 * Feature flag registry
 */
const FEATURE_FLAG_REGISTRY: Record<FeatureFlag, FeatureFlagConfig> = {
  [FeatureFlag.DAILY_REWARD]: {
    name: 'Daily Reward System',
    description: 'Enable daily reward check-in system',
    defaultValue: true,
  },
  [FeatureFlag.ACHIEVEMENTS]: {
    name: 'Achievement System',
    description: 'Enable achievement tracking and notifications',
    defaultValue: true,
  },
  [FeatureFlag.NEW_UI]: {
    name: 'New UI Design',
    description: 'Enable new UI design (A/B test)',
    defaultValue: false,
  },
  [FeatureFlag.SOCIAL_SHARING]: {
    name: 'Social Sharing',
    description: 'Enable score sharing to social media',
    defaultValue: true,
  },
  [FeatureFlag.CLOUD_BACKUP]: {
    name: 'Cloud Backup',
    description: 'Enable cloud backup for game progress',
    defaultValue: false,
  },
  [FeatureFlag.DARK_MODE]: {
    name: 'Dark Mode',
    description: 'Enable dark mode theme',
    defaultValue: true,
  },
  [FeatureFlag.HAPTIC_FEEDBACK]: {
    name: 'Haptic Feedback',
    description: 'Enable haptic feedback for interactions',
    defaultValue: true,
  },
  [FeatureFlag.PARTICLE_EFFECTS]: {
    name: 'Particle Effects',
    description: 'Enable particle effects (performance dependent)',
    defaultValue: true,
  },
  [FeatureFlag.ADVANCED_ANALYTICS]: {
    name: 'Advanced Analytics',
    description: 'Enable detailed analytics tracking',
    defaultValue: true,
  },
  [FeatureFlag.BETA_FEATURES]: {
    name: 'Beta Features',
    description: 'Enable experimental beta features',
    defaultValue: false,
  },
};

/**
 * Check if a feature flag is enabled
 * @param flag - Feature flag to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const config = FEATURE_FLAG_REGISTRY[flag];
  if (!config) {
    console.warn(`[FeatureFlags] Unknown feature flag: ${flag}`);
    return false;
  }

  return abTestManager.isFeatureEnabled(flag);
}

/**
 * Get feature flag value with type safety
 * @param flag - Feature flag to get
 * @param defaultValue - Default value if flag not found
 * @returns Feature flag value
 */
export function getFeatureValue<T>(flag: FeatureFlag, defaultValue: T): T {
  return abTestManager.getFeatureValue(flag, defaultValue);
}

/**
 * Get all feature flags with their current values
 * @returns Map of feature flags to their values
 */
export function getAllFeatureFlags(): Map<FeatureFlag, boolean> {
  const flags = new Map<FeatureFlag, boolean>();
  
  for (const flag of Object.values(FeatureFlag)) {
    flags.set(flag as FeatureFlag, isFeatureEnabled(flag as FeatureFlag));
  }
  
  return flags;
}

/**
 * Get feature flag configuration
 * @param flag - Feature flag
 * @returns Feature flag configuration
 */
export function getFeatureFlagConfig(flag: FeatureFlag): FeatureFlagConfig | null {
  return FEATURE_FLAG_REGISTRY[flag] || null;
}

/**
 * Get all feature flag configurations
 * @returns Array of feature flag configurations
 */
export function getAllFeatureFlagConfigs(): Array<FeatureFlagConfig & { flag: FeatureFlag }> {
  return Object.entries(FEATURE_FLAG_REGISTRY).map(([flag, config]) => ({
    flag: flag as FeatureFlag,
    ...config,
  }));
}

/**
 * React hook for feature flags (if using React)
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  // Note: This is a simple implementation
  // In a real React app, you'd want to use useState/useEffect to handle updates
  return isFeatureEnabled(flag);
}

/**
 * Feature flag guard component helper
 * @param flag - Feature flag to check
 * @param children - Content to render if flag is enabled
 * @param fallback - Content to render if flag is disabled
 */
export function FeatureGuard(props: {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactNode {
  const enabled = isFeatureEnabled(props.flag);
  return enabled ? props.children : (props.fallback || null);
}

/**
 * Conditional feature execution
 * @param flag - Feature flag to check
 * @param callback - Function to execute if flag is enabled
 */
export function withFeature(flag: FeatureFlag, callback: () => void): void {
  if (isFeatureEnabled(flag)) {
    callback();
  }
}

/**
 * Conditional feature execution with fallback
 * @param flag - Feature flag to check
 * @param onEnabled - Function to execute if flag is enabled
 * @param onDisabled - Function to execute if flag is disabled
 */
export function withFeatureOr(
  flag: FeatureFlag,
  onEnabled: () => void,
  onDisabled: () => void
): void {
  if (isFeatureEnabled(flag)) {
    onEnabled();
  } else {
    onDisabled();
  }
}

/**
 * Get feature flag value or execute callback
 * @param flag - Feature flag to check
 * @param getValue - Function to get value if flag is enabled
 * @param defaultValue - Default value if flag is disabled
 */
export function getFeatureValueOr<T>(
  flag: FeatureFlag,
  getValue: () => T,
  defaultValue: T
): T {
  return isFeatureEnabled(flag) ? getValue() : defaultValue;
}
