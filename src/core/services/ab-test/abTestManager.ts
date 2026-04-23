/**
 * A/B Test Manager Service
 * 
 * Manages A/B testing using Firebase Remote Config with deterministic
 * variant assignment, caching, and analytics integration.
 * 
 * Features:
 * - Deterministic hash-based variant assignment
 * - Variant caching in localStorage
 * - Analytics integration for tracking
 * - Feature flag system
 * - Conversion tracking
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.5, 9.6, 9.8, 9.9, 9.10
 */

import { BaseService } from '../base/BaseService';
import { getFirebaseRemoteConfig } from '../../../services/firebase/firebaseConfig';
import { fetchAndActivate, getValue, getAll } from 'firebase/remote-config';
import type { RemoteConfig } from 'firebase/remote-config';

// A/B Test variant definition
export interface ABTestVariant {
  name: string;
  value: any;
  weight: number; // 0-100
}

// A/B Test definition
export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  enabled: boolean;
}

// A/B Test configuration
export interface ABTestConfig {
  enabled: boolean;
  fetchTimeoutMs: number;
  minimumFetchIntervalMs: number;
  cacheExpirationMs: number;
}

// Default configuration
const DEFAULT_CONFIG: ABTestConfig = {
  enabled: true,
  fetchTimeoutMs: 10000, // 10 seconds
  minimumFetchIntervalMs: 3600000, // 1 hour
  cacheExpirationMs: 43200000, // 12 hours
};

// Storage keys
const STORAGE_PREFIX = 'ab_test:';
const VARIANT_CACHE_KEY = `${STORAGE_PREFIX}variants`;
const USER_ID_KEY = `${STORAGE_PREFIX}user_id`;

/**
 * A/B Test Manager Service
 * Manages A/B testing with Firebase Remote Config
 */
export class ABTestManager extends BaseService {
  private config: ABTestConfig;
  private remoteConfig: RemoteConfig | null = null;
  private variantCache: Map<string, string> = new Map();
  private userId: string = '';
  private isRemoteConfigInitialized: boolean = false;

  constructor(config: Partial<ABTestConfig> = {}) {
    super({
      name: 'ABTestManager',
      version: '1.0.0',
      dependencies: ['StorageManager', 'AnalyticsService'],
    });
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the A/B test manager
   */
  protected async onInitialize(): Promise<void> {
    // Get or create user ID for consistent variant assignment
    this.userId = this.getUserId();

    // Load cached variants
    this.loadVariantCache();

    // Initialize Firebase Remote Config
    try {
      this.remoteConfig = getFirebaseRemoteConfig();
      
      if (this.remoteConfig) {
        // Configure Remote Config
        this.remoteConfig.settings.fetchTimeoutMillis = this.config.fetchTimeoutMs;
        this.remoteConfig.settings.minimumFetchIntervalMillis = this.config.minimumFetchIntervalMs;

        // Set default values
        this.remoteConfig.defaultConfig = this.getDefaultConfig();

        this.isRemoteConfigInitialized = true;
        console.log('[ABTestManager] Firebase Remote Config initialized');
      }
    } catch (error) {
      console.warn('[ABTestManager] Failed to initialize Remote Config', error);
    }
  }

  /**
   * Start the A/B test manager
   */
  protected async onStart(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[ABTestManager] A/B testing disabled');
      return;
    }

    // Fetch latest config from Firebase
    await this.fetchRemoteConfig();
  }

  /**
   * Stop the A/B test manager
   */
  protected async onStop(): Promise<void> {
    // Save variant cache
    this.saveVariantCache();
  }

  /**
   * Get variant for a test
   * @param testId - Test identifier
   * @returns Variant name
   */
  public getVariant(testId: string): string {
    // Check cache first
    if (this.variantCache.has(testId)) {
      return this.variantCache.get(testId)!;
    }

    // Get test configuration from Remote Config
    const test = this.getTestConfig(testId);
    
    if (!test || !test.enabled) {
      return 'control';
    }

    // Assign variant using deterministic hash
    const variant = this.assignVariant(testId, test.variants);
    
    // Cache the variant
    this.variantCache.set(testId, variant);
    this.saveVariantCache();

    // Track variant assignment in analytics
    this.trackVariantAssignment(testId, variant);

    return variant;
  }

  /**
   * Get variant value with type safety
   * @param testId - Test identifier
   * @param defaultValue - Default value if test not found
   * @returns Variant value
   */
  public getVariantValue<T>(testId: string, defaultValue: T): T {
    const variant = this.getVariant(testId);
    
    if (!this.isRemoteConfigInitialized || !this.remoteConfig) {
      return defaultValue;
    }

    try {
      const value = getValue(this.remoteConfig, `${testId}_${variant}`);
      
      if (!value) {
        return defaultValue;
      }

      // Parse value based on type
      const stringValue = value.asString();
      
      if (typeof defaultValue === 'boolean') {
        return (stringValue === 'true') as T;
      }
      
      if (typeof defaultValue === 'number') {
        return Number(stringValue) as T;
      }
      
      if (typeof defaultValue === 'object') {
        try {
          return JSON.parse(stringValue) as T;
        } catch {
          return defaultValue;
        }
      }
      
      return stringValue as T;
    } catch (error) {
      console.warn(`[ABTestManager] Failed to get variant value for ${testId}`, error);
      return defaultValue;
    }
  }

  /**
   * Log conversion event for A/B test
   * @param testId - Test identifier
   * @param metricName - Metric name (e.g., 'purchase', 'level_complete')
   * @param value - Optional numeric value
   */
  public logConversion(testId: string, metricName: string, value?: number): void {
    const variant = this.getVariant(testId);
    
    // Log to analytics with ab_test namespace
    const eventName = `ab_test_${metricName}`;
    const params: Record<string, any> = {
      test_id: testId,
      variant: variant,
    };
    
    if (value !== undefined) {
      params.value = value;
    }

    // Use window.firebase if available (will be picked up by AnalyticsService)
    if (typeof window !== 'undefined' && (window as any).firebase) {
      try {
        const firebase = (window as any).firebase;
        if (firebase.analytics) {
          firebase.analytics().logEvent(eventName, params);
        }
      } catch (error) {
        console.warn('[ABTestManager] Failed to log conversion', error);
      }
    }

    console.log(`[ABTestManager] Conversion logged: ${eventName}`, params);
  }

  /**
   * Force a specific variant (for testing)
   * @param testId - Test identifier
   * @param variantName - Variant name to force
   */
  public forceVariant(testId: string, variantName: string): void {
    this.variantCache.set(testId, variantName);
    this.saveVariantCache();
    console.log(`[ABTestManager] Forced variant: ${testId} = ${variantName}`);
  }

  /**
   * Get all active tests
   * @returns Array of active tests
   */
  public getActiveTests(): ABTest[] {
    if (!this.isRemoteConfigInitialized || !this.remoteConfig) {
      return [];
    }

    const tests: ABTest[] = [];
    
    try {
      const allValues = getAll(this.remoteConfig);
      const testIds = new Set<string>();

      // Extract test IDs from keys
      for (const key in allValues) {
        if (key.startsWith('test_')) {
          const testId = key.split('_')[1];
          testIds.add(testId);
        }
      }

      // Build test objects
      for (const testId of testIds) {
        const test = this.getTestConfig(testId);
        if (test) {
          tests.push(test);
        }
      }
    } catch (error) {
      console.warn('[ABTestManager] Failed to get active tests', error);
    }

    return tests;
  }

  /**
   * Check if a feature flag is enabled
   * @param flagName - Feature flag name
   * @returns Whether the feature is enabled
   */
  public isFeatureEnabled(flagName: string): boolean {
    return this.getVariantValue(`feature_${flagName}`, false);
  }

  /**
   * Get feature flag value
   * @param flagName - Feature flag name
   * @param defaultValue - Default value
   * @returns Feature flag value
   */
  public getFeatureValue<T>(flagName: string, defaultValue: T): T {
    return this.getVariantValue(`feature_${flagName}`, defaultValue);
  }

  /**
   * Refresh Remote Config
   */
  public async refresh(): Promise<void> {
    await this.fetchRemoteConfig();
  }

  /**
   * Clear variant cache
   */
  public clearCache(): void {
    this.variantCache.clear();
    this.saveVariantCache();
    console.log('[ABTestManager] Variant cache cleared');
  }

  /**
   * Get current user ID
   */
  public getUserId(): string {
    if (this.userId) {
      return this.userId;
    }

    // Try to load from storage
    try {
      const stored = localStorage.getItem(USER_ID_KEY);
      if (stored) {
        this.userId = stored;
        return this.userId;
      }
    } catch (error) {
      console.warn('[ABTestManager] Failed to load user ID from storage', error);
    }

    // Generate new user ID
    this.userId = this.generateUserId();
    
    // Save to storage
    try {
      localStorage.setItem(USER_ID_KEY, this.userId);
    } catch (error) {
      console.warn('[ABTestManager] Failed to save user ID to storage', error);
    }

    return this.userId;
  }

  /**
   * Get conversion rate for a test variant
   * @param testId - Test identifier
   * @param variantName - Variant name
   * @returns Conversion rate (0-1)
   */
  public getConversionRate(_testId: string, _variantName: string): number {
    // This would typically fetch from analytics backend
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Set a feature flag value
   * @param flagName - Feature flag name
   * @param enabled - Whether the feature is enabled
   */
  public setFeatureFlag(flagName: string, enabled: boolean): void {
    if (!this.isRemoteConfigInitialized || !this.remoteConfig) {
      console.warn('[ABTestManager] Remote Config not initialized');
      return;
    }

    // Store in default config
    this.remoteConfig.defaultConfig = {
      ...this.remoteConfig.defaultConfig,
      [`feature_${flagName}`]: enabled.toString(),
    };

    console.log(`[ABTestManager] Feature flag set: ${flagName} = ${enabled}`);
  }

  /**
   * Load remote config from Firebase
   */
  public async loadRemoteConfig(): Promise<void> {
    await this.fetchRemoteConfig();
  }

  /**
   * Hash user ID for deterministic variant assignment
   * @param userId - User identifier
   * @returns Hashed value
   */
  public hashUserId(userId: string): number {
    return this.hashString(userId);
  }

  // Private methods

  /**
   * Fetch Remote Config from Firebase
   */
  private async fetchRemoteConfig(): Promise<void> {
    if (!this.isRemoteConfigInitialized || !this.remoteConfig) {
      return;
    }

    try {
      const activated = await fetchAndActivate(this.remoteConfig);
      console.log(`[ABTestManager] Remote Config fetched and activated: ${activated}`);
    } catch (error) {
      console.warn('[ABTestManager] Failed to fetch Remote Config', error);
    }
  }

  /**
   * Get test configuration from Remote Config
   */
  private getTestConfig(testId: string): ABTest | null {
    if (!this.isRemoteConfigInitialized || !this.remoteConfig) {
      return null;
    }

    try {
      const configKey = `test_${testId}`;
      const value = getValue(this.remoteConfig, configKey);
      
      if (!value) {
        return null;
      }

      const config = JSON.parse(value.asString());
      return {
        id: testId,
        name: config.name || testId,
        variants: config.variants || [{ name: 'control', value: null, weight: 100 }],
        enabled: config.enabled !== false,
      };
    } catch (error) {
      console.warn(`[ABTestManager] Failed to get test config for ${testId}`, error);
      return null;
    }
  }

  /**
   * Assign variant using deterministic hash
   */
  private assignVariant(testId: string, variants: ABTestVariant[]): string {
    // Calculate hash from user ID and test ID
    const hash = this.hashString(`${this.userId}:${testId}`);
    
    // Normalize hash to 0-100 range
    const bucket = hash % 100;
    
    // Assign variant based on weights
    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (bucket < cumulativeWeight) {
        return variant.name;
      }
    }
    
    // Fallback to first variant
    return variants[0]?.name || 'control';
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Load variant cache from storage
   */
  private loadVariantCache(): void {
    try {
      const cached = localStorage.getItem(VARIANT_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.variantCache = new Map(Object.entries(parsed));
        console.log('[ABTestManager] Variant cache loaded', this.variantCache.size);
      }
    } catch (error) {
      console.warn('[ABTestManager] Failed to load variant cache', error);
    }
  }

  /**
   * Save variant cache to storage
   */
  private saveVariantCache(): void {
    try {
      const obj = Object.fromEntries(this.variantCache);
      localStorage.setItem(VARIANT_CACHE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.warn('[ABTestManager] Failed to save variant cache', error);
    }
  }

  /**
   * Track variant assignment in analytics
   */
  private trackVariantAssignment(testId: string, variant: string): void {
    // Set as user property for segmentation
    if (typeof window !== 'undefined' && (window as any).firebase) {
      try {
        const firebase = (window as any).firebase;
        if (firebase.analytics) {
          firebase.analytics().setUserProperties({
            [`ab_test_${testId}`]: variant,
          });
        }
      } catch (error) {
        console.warn('[ABTestManager] Failed to track variant assignment', error);
      }
    }

    console.log(`[ABTestManager] Variant assigned: ${testId} = ${variant}`);
  }

  /**
   * Get default Remote Config values
   */
  private getDefaultConfig(): Record<string, any> {
    return {
      // Example A/B test configurations
      test_tutorial: JSON.stringify({
        name: 'Tutorial Variant Test',
        enabled: true,
        variants: [
          { name: 'control', value: 'short', weight: 50 },
          { name: 'variant_a', value: 'long', weight: 50 },
        ],
      }),
      test_reward_amount: JSON.stringify({
        name: 'Reward Amount Test',
        enabled: true,
        variants: [
          { name: 'control', value: 100, weight: 50 },
          { name: 'variant_a', value: 150, weight: 50 },
        ],
      }),
      // Feature flags
      feature_daily_reward: 'true',
      feature_achievements: 'true',
      feature_new_ui: 'false',
    };
  }
}

// Export singleton instance
export const abTestManager = new ABTestManager();
