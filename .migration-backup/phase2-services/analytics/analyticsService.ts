/**
 * Analytics Service
 * 
 * Firebase Analytics integration with event batching, user properties,
 * and automatic session tracking.
 * 
 * Features:
 * - Event logging with batching (10 events or 30 seconds)
 * - User properties and user ID management
 * - Automatic session tracking
 * - Event parameter validation
 * - Offline event queueing
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.9
 */

import { BaseService } from '../core/BaseService';

// Event parameter types
export interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

// User properties
export interface UserProperties {
  [key: string]: string | number | boolean | undefined;
}

// Event batch item
interface EventBatchItem {
  name: string;
  params: EventParams;
  timestamp: number;
}

// Analytics configuration
export interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number; // Maximum events before auto-flush
  batchTimeout: number; // Maximum time (ms) before auto-flush
  maxEventNameLength: number;
  maxParamNameLength: number;
  maxParamValueLength: number;
  maxUserPropertyNameLength: number;
  maxUserPropertyValueLength: number;
}

// Default configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  batchSize: 10,
  batchTimeout: 30000, // 30 seconds
  maxEventNameLength: 40,
  maxParamNameLength: 40,
  maxParamValueLength: 100,
  maxUserPropertyNameLength: 24,
  maxUserPropertyValueLength: 36,
};

/**
 * Analytics Service
 * Manages Firebase Analytics integration with batching and validation
 */
export class AnalyticsService extends BaseService {
  private config: AnalyticsConfig;
  private eventBatch: EventBatchItem[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private userProperties: UserProperties = {};
  private sessionStartTime: number = 0;
  private isFirebaseInitialized: boolean = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    super('AnalyticsService');
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the analytics service
   */
  protected async onInitialize(): Promise<void> {
    // Check if Firebase Analytics is available
    if (typeof window !== 'undefined' && (window as any).firebase) {
      try {
        const firebase = (window as any).firebase;
        if (firebase.analytics) {
          firebase.analytics();
          this.isFirebaseInitialized = true;
          this.logger.info('Firebase Analytics initialized');
        }
      } catch (error) {
        this.logger.warn('Firebase Analytics not available', { error });
      }
    }

    // Start session tracking
    this.sessionStartTime = Date.now();
    this.logEvent('session_start', {
      timestamp: this.sessionStartTime,
    });
  }

  /**
   * Start the analytics service
   */
  protected async onStart(): Promise<void> {
    // Start batch timer
    this.startBatchTimer();
  }

  /**
   * Stop the analytics service
   */
  protected async onStop(): Promise<void> {
    // Flush remaining events
    await this.flushEvents();

    // Stop batch timer
    this.stopBatchTimer();

    // Log session end
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.logEvent('session_end', {
      duration: Math.floor(sessionDuration / 1000), // seconds
    });
  }

  /**
   * Log an analytics event
   */
  public logEvent(eventName: string, params: EventParams = {}): void {
    if (!this.config.enabled) {
      return;
    }

    // Validate event name
    const validatedEventName = this.validateEventName(eventName);
    if (!validatedEventName) {
      this.logger.warn('Invalid event name', { eventName });
      return;
    }

    // Validate and sanitize parameters
    const validatedParams = this.validateEventParams(params);

    // Add to batch
    this.eventBatch.push({
      name: validatedEventName,
      params: validatedParams,
      timestamp: Date.now(),
    });

    this.logger.debug('Event logged', { eventName: validatedEventName, params: validatedParams });

    // Check if batch is full
    if (this.eventBatch.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Set user ID
   */
  public setUserId(userId: string | null): void {
    this.userId = userId;

    if (this.isFirebaseInitialized) {
      try {
        const firebase = (window as any).firebase;
        firebase.analytics().setUserId(userId);
        this.logger.info('User ID set', { userId });
      } catch (error) {
        this.logger.error('Failed to set user ID', { error, userId });
      }
    }
  }

  /**
   * Get current user ID
   */
  public getUserId(): string | null {
    return this.userId;
  }

  /**
   * Set user property
   */
  public setUserProperty(name: string, value: string | number | boolean | null): void {
    // Validate property name
    const validatedName = this.validateUserPropertyName(name);
    if (!validatedName) {
      this.logger.warn('Invalid user property name', { name });
      return;
    }

    // Validate property value
    const validatedValue = this.validateUserPropertyValue(value);

    // Store locally
    if (validatedValue === null) {
      delete this.userProperties[validatedName];
    } else {
      this.userProperties[validatedName] = validatedValue;
    }

    // Set in Firebase
    if (this.isFirebaseInitialized) {
      try {
        const firebase = (window as any).firebase;
        firebase.analytics().setUserProperties({
          [validatedName]: validatedValue,
        });
        this.logger.debug('User property set', { name: validatedName, value: validatedValue });
      } catch (error) {
        this.logger.error('Failed to set user property', { error, name: validatedName });
      }
    }
  }

  /**
   * Set A/B test variant as user property
   * @param testId - Test identifier
   * @param variant - Variant name
   */
  public setABTestVariant(testId: string, variant: string): void {
    this.setUserProperty(`ab_test_${testId}`, variant);
  }

  /**
   * Log A/B test conversion event
   * @param testId - Test identifier
   * @param variant - Variant name
   * @param metricName - Metric name
   * @param value - Optional numeric value
   */
  public logABTestConversion(
    testId: string,
    variant: string,
    metricName: string,
    value?: number
  ): void {
    const eventName = `ab_test_${metricName}`;
    const params: EventParams = {
      test_id: testId,
      variant: variant,
    };

    if (value !== undefined) {
      params.value = value;
    }

    this.logEvent(eventName, params);
  }

  /**
   * Set multiple user properties
   */
  public setUserProperties(properties: UserProperties): void {
    Object.entries(properties).forEach(([name, value]) => {
      this.setUserProperty(name, value ?? null);
    });
  }

  /**
   * Get user property
   */
  public getUserProperty(name: string): string | number | boolean | undefined {
    return this.userProperties[name];
  }

  /**
   * Get all user properties
   */
  public getUserProperties(): UserProperties {
    return { ...this.userProperties };
  }

  /**
   * Flush all pending events
   */
  public async flushEvents(): Promise<void> {
    if (this.eventBatch.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventBatch];
    this.eventBatch = [];

    // Reset batch timer
    this.stopBatchTimer();
    this.startBatchTimer();

    // Send events to Firebase
    if (this.isFirebaseInitialized) {
      try {
        const firebase = (window as any).firebase;
        const analytics = firebase.analytics();

        for (const event of eventsToFlush) {
          analytics.logEvent(event.name, event.params);
        }

        this.logger.info('Events flushed', { count: eventsToFlush.length });
      } catch (error) {
        this.logger.error('Failed to flush events', { error, count: eventsToFlush.length });
        // Re-add events to batch for retry
        this.eventBatch.unshift(...eventsToFlush);
      }
    } else {
      this.logger.warn('Firebase Analytics not initialized, events queued', {
        count: eventsToFlush.length,
      });
      // Re-add events to batch for retry
      this.eventBatch.unshift(...eventsToFlush);
    }
  }

  /**
   * Get current session duration in seconds
   */
  public getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }

  /**
   * Get pending event count
   */
  public getPendingEventCount(): number {
    return this.eventBatch.length;
  }

  /**
   * Get pending events count (alias for compatibility)
   */
  public getPendingEventsCount(): number {
    return this.getPendingEventCount();
  }

  /**
   * Log game start event
   * @param mode - Game mode
   * @param level - Starting level
   */
  public logGameStart(mode: string, level?: number): void {
    this.logEvent('game_start', {
      mode,
      level: level ?? 1,
    });
  }

  /**
   * Log game end event
   * @param mode - Game mode
   * @param score - Final score
   * @param duration - Game duration in seconds
   */
  public logGameEnd(mode: string, score: number, duration: number): void {
    this.logEvent('game_end', {
      mode,
      score,
      duration,
    });
  }

  /**
   * Log level complete event
   * @param level - Level number
   * @param score - Level score
   * @param duration - Level duration in seconds
   */
  public logLevelComplete(level: number, score: number, duration: number): void {
    this.logEvent('level_complete', {
      level,
      score,
      duration,
    });
  }

  /**
   * Log ability used event
   * @param abilityName - Name of the ability
   * @param level - Current level
   */
  public logAbilityUsed(abilityName: string, level: number): void {
    this.logEvent('ability_used', {
      ability: abilityName,
      level,
    });
  }

  /**
   * Start a new session
   */
  public startSession(): void {
    this.sessionStartTime = Date.now();
    this.logEvent('session_start', {
      timestamp: this.sessionStartTime,
    });
  }

  /**
   * End current session
   */
  public endSession(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.logEvent('session_end', {
      duration: Math.floor(sessionDuration / 1000),
    });
  }

  /**
   * Log ad impression event
   * @param adUnit - Ad unit identifier
   * @param adType - Type of ad (banner, interstitial, rewarded)
   */
  public logAdImpression(adUnit: string, adType: string): void {
    this.logEvent('ad_impression', {
      ad_unit: adUnit,
      ad_type: adType,
    });
  }

  /**
   * Log ad click event
   * @param adUnit - Ad unit identifier
   * @param adType - Type of ad
   */
  public logAdClick(adUnit: string, adType: string): void {
    this.logEvent('ad_click', {
      ad_unit: adUnit,
      ad_type: adType,
    });
  }

  /**
   * Log ad revenue event
   * @param adUnit - Ad unit identifier
   * @param revenue - Revenue amount
   * @param currency - Currency code (e.g., 'USD')
   */
  public logAdRevenue(adUnit: string, revenue: number, currency: string): void {
    this.logEvent('ad_revenue', {
      ad_unit: adUnit,
      revenue,
      currency,
    });
  }

  /**
   * Clear all pending events
   */
  public clearPendingEvents(): void {
    this.eventBatch = [];
    this.logger.info('Pending events cleared');
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Configuration updated', { config: this.config });

    // Restart batch timer with new timeout
    if (this.getState() === 'started') {
      this.stopBatchTimer();
      this.startBatchTimer();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  // Private methods

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      return;
    }

    this.batchTimer = setInterval(() => {
      if (this.eventBatch.length > 0) {
        this.flushEvents();
      }
    }, this.config.batchTimeout);
  }

  /**
   * Stop batch timer
   */
  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Validate event name
   */
  private validateEventName(name: string): string | null {
    if (!name || typeof name !== 'string') {
      return null;
    }

    // Trim and convert to lowercase
    let validated = name.trim().toLowerCase();

    // Replace spaces with underscores
    validated = validated.replace(/\s+/g, '_');

    // Remove invalid characters (only alphanumeric and underscore allowed)
    validated = validated.replace(/[^a-z0-9_]/g, '');

    // Ensure it starts with a letter
    if (!/^[a-z]/.test(validated)) {
      return null;
    }

    // Truncate to max length
    if (validated.length > this.config.maxEventNameLength) {
      validated = validated.substring(0, this.config.maxEventNameLength);
    }

    return validated;
  }

  /**
   * Validate event parameters
   */
  private validateEventParams(params: EventParams): EventParams {
    const validated: EventParams = {};

    Object.entries(params).forEach(([key, value]) => {
      // Validate parameter name
      const validatedKey = this.validateParamName(key);
      if (!validatedKey) {
        return;
      }

      // Validate parameter value
      const validatedValue = this.validateParamValue(value);
      if (validatedValue !== undefined) {
        validated[validatedKey] = validatedValue;
      }
    });

    return validated;
  }

  /**
   * Validate parameter name
   */
  private validateParamName(name: string): string | null {
    if (!name || typeof name !== 'string') {
      return null;
    }

    // Trim and convert to lowercase
    let validated = name.trim().toLowerCase();

    // Replace spaces with underscores
    validated = validated.replace(/\s+/g, '_');

    // Remove invalid characters
    validated = validated.replace(/[^a-z0-9_]/g, '');

    // Truncate to max length
    if (validated.length > this.config.maxParamNameLength) {
      validated = validated.substring(0, this.config.maxParamNameLength);
    }

    return validated || null;
  }

  /**
   * Validate parameter value
   */
  private validateParamValue(
    value: string | number | boolean | undefined
  ): string | number | boolean | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === 'string') {
      // Truncate string to max length
      if (value.length > this.config.maxParamValueLength) {
        return value.substring(0, this.config.maxParamValueLength);
      }
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    return undefined;
  }

  /**
   * Validate user property name
   */
  private validateUserPropertyName(name: string): string | null {
    if (!name || typeof name !== 'string') {
      return null;
    }

    // Trim and convert to lowercase
    let validated = name.trim().toLowerCase();

    // Replace spaces with underscores
    validated = validated.replace(/\s+/g, '_');

    // Remove invalid characters
    validated = validated.replace(/[^a-z0-9_]/g, '');

    // Truncate to max length
    if (validated.length > this.config.maxUserPropertyNameLength) {
      validated = validated.substring(0, this.config.maxUserPropertyNameLength);
    }

    return validated || null;
  }

  /**
   * Validate user property value
   */
  private validateUserPropertyValue(
    value: string | number | boolean | null
  ): string | number | boolean | null {
    if (value === null) {
      return null;
    }

    if (typeof value === 'string') {
      // Truncate string to max length
      if (value.length > this.config.maxUserPropertyValueLength) {
        return value.substring(0, this.config.maxUserPropertyValueLength);
      }
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    return null;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
