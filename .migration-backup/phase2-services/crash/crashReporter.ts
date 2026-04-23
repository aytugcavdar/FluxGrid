/**
 * Crash Reporter Service
 * 
 * Provides crash reporting and error tracking functionality using Firebase Crashlytics.
 * Logs fatal crashes, non-fatal errors, breadcrumbs, and custom data.
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */

import { BaseService, ServiceMetadata } from '../core/BaseService';

export enum CrashSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface CrashContext {
  userId?: string;
  gameState?: string;
  lastActions?: string[];
  deviceInfo?: DeviceInfo;
  customData?: Record<string, any>;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  screenSize: string;
  memory: number;
}

export interface Breadcrumb {
  message: string;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * CrashReporter Service
 * 
 * Manages error logging and crash reporting to Firebase Crashlytics.
 */
export class CrashReporter extends BaseService {
  private breadcrumbs: Breadcrumb[] = [];
  private readonly MAX_BREADCRUMBS = 20;
  private userId?: string;
  private customKeys: Map<string, string | number | boolean> = new Map();
  private errorCount = 0;
  private readonly MAX_ERRORS_PER_MINUTE = 100;
  private errorTimestamps: number[] = [];

  constructor() {
    const metadata: ServiceMetadata = {
      name: 'CrashReporter',
      version: '1.0.0',
      dependencies: []
    };
    super(metadata);
  }

  protected async onInitialize(): Promise<void> {
    // Collect device info
    const deviceInfo = await this.collectDeviceInfo();
    this.setCustomKey('platform', deviceInfo.platform);
    this.setCustomKey('osVersion', deviceInfo.osVersion);
    this.setCustomKey('appVersion', deviceInfo.appVersion);
    this.setCustomKey('deviceModel', deviceInfo.deviceModel);
    this.setCustomKey('screenSize', deviceInfo.screenSize);
    this.setCustomKey('memory', deviceInfo.memory);

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  protected async onStart(): Promise<void> {
    // Service is ready
    this.logBreadcrumb('CrashReporter service started');
  }

  protected async onStop(): Promise<void> {
    // Clean up
    this.breadcrumbs = [];
    this.customKeys.clear();
  }

  /**
   * Log non-fatal error
   * Requirement 2.4: Log handled errors as non-fatal
   */
  logError(error: Error, severity: CrashSeverity, context?: CrashContext): void {
    // Rate limiting check
    if (!this.checkRateLimit()) {
      console.warn('Error logging rate limit exceeded');
      return;
    }

    const errorData = {
      message: error.message,
      stack: error.stack,
      severity,
      timestamp: Date.now(),
      breadcrumbs: this.breadcrumbs,
      customKeys: Object.fromEntries(this.customKeys),
      ...context
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[CrashReporter] Non-fatal error:', errorData);
    }

    // Send to Firebase Crashlytics (web SDK doesn't support non-fatal errors directly)
    // We'll use custom logging instead
    this.logToFirebase('non_fatal_error', errorData);
  }

  /**
   * Log fatal crash
   * Requirement 2.2: Log crash reports with full context
   */
  logCrash(error: Error, context?: CrashContext): void {
    const crashData = {
      message: error.message,
      stack: error.stack,
      severity: CrashSeverity.FATAL,
      timestamp: Date.now(),
      breadcrumbs: this.breadcrumbs,
      customKeys: Object.fromEntries(this.customKeys),
      userId: this.userId,
      ...context
    };

    // Log to console
    console.error('[CrashReporter] Fatal crash:', crashData);

    // Send to Firebase Crashlytics
    this.logToFirebase('fatal_crash', crashData);

    // In production, this would throw to trigger native crash reporting
    if (!import.meta.env.DEV) {
      throw error;
    }
  }

  /**
   * Set user identifier (anonymous)
   * Requirement 2.5: Include user ID in crash reports
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.setCustomKey('userId', userId);
  }

  /**
   * Add custom key-value data
   * Requirement 2.3: Include custom data in crash reports
   */
  setCustomKey(key: string, value: string | number | boolean): void {
    this.customKeys.set(key, value);
  }

  /**
   * Log breadcrumb (user action trail)
   * Requirement 2.3: Include user actions in crash reports
   */
  logBreadcrumb(message: string, data?: Record<string, any>): void {
    const breadcrumb: Breadcrumb = {
      message,
      timestamp: Date.now(),
      data
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last 20 breadcrumbs
    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Force send pending crash reports
   */
  async sendUnsentReports(): Promise<void> {
    // In a real implementation, this would trigger Firebase Crashlytics to send pending reports
    // For web, we'll just log
    console.log('[CrashReporter] Sending unsent reports...');
  }

  /**
   * Get breadcrumbs for debugging
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Collect device information
   */
  private async collectDeviceInfo(): Promise<DeviceInfo> {
    const deviceInfo: DeviceInfo = {
      platform: this.getPlatform(),
      osVersion: this.getOSVersion(),
      appVersion: this.getAppVersion(),
      deviceModel: this.getDeviceModel(),
      screenSize: `${window.screen.width}x${window.screen.height}`,
      memory: this.getMemory()
    };

    return deviceInfo;
  }

  /**
   * Get platform
   */
  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'Android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
    return 'Web';
  }

  /**
   * Get OS version
   */
  private getOSVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/Android\s([0-9.]+)|OS\s([0-9_]+)/);
    return match ? (match[1] || match[2]?.replace(/_/g, '.') || 'Unknown') : 'Unknown';
  }

  /**
   * Get app version
   */
  private getAppVersion(): string {
    // This should come from package.json or build config
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  /**
   * Get device model
   */
  private getDeviceModel(): string {
    const userAgent = navigator.userAgent;
    // Extract device model from user agent (simplified)
    const match = userAgent.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Get available memory
   */
  private getMemory(): number {
    // @ts-ignore - performance.memory is not in TypeScript types
    if (performance.memory) {
      // @ts-ignore
      return Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024));
    }
    return 0;
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      this.logCrash(error, {
        customData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.logError(error, CrashSeverity.ERROR, {
        customData: {
          type: 'unhandled_promise_rejection'
        }
      });
    });
  }

  /**
   * Check rate limit for error logging
   * Requirement 2.8: Rate limiting to prevent log flooding
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove timestamps older than 1 minute
    this.errorTimestamps = this.errorTimestamps.filter(ts => ts > oneMinuteAgo);

    // Check if we've exceeded the limit
    if (this.errorTimestamps.length >= this.MAX_ERRORS_PER_MINUTE) {
      return false;
    }

    // Add current timestamp
    this.errorTimestamps.push(now);
    this.errorCount++;

    return true;
  }

  /**
   * Log to Firebase (placeholder for actual Firebase integration)
   */
  private logToFirebase(eventType: string, data: any): void {
    // In a real implementation, this would use Firebase Crashlytics SDK
    // For now, we'll use console logging
    
    if (import.meta.env.DEV) {
      console.log(`[Firebase Crashlytics] ${eventType}:`, data);
    }

    // TODO: Integrate with Firebase Crashlytics Web SDK when available
    // Note: Firebase Crashlytics Web SDK has limited functionality compared to native
    // For production, consider using Firebase Analytics custom events or
    // a third-party service like Sentry for web crash reporting
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { count: number; recentErrors: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentErrors = this.errorTimestamps.filter(ts => ts > oneMinuteAgo).length;

    return {
      count: this.errorCount,
      recentErrors
    };
  }
}

// Export singleton instance
export const crashReporter = new CrashReporter();
