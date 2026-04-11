/**
 * Performance Monitor Service
 * 
 * Monitors application performance metrics including FPS, memory usage,
 * and load times. Integrates with analytics for performance tracking.
 * 
 * Features:
 * - FPS tracking using requestAnimationFrame
 * - Memory tracking using performance.memory API
 * - Load time tracking using Performance API
 * - Automatic quality adjustment based on performance
 * - Performance alerts and warnings
 * 
 * Requirements: 3.10, 5.1, 5.2
 */

import { BaseService } from '../core/BaseService';
import { analyticsService } from '../analytics/analyticsService';

// Performance metrics
export interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  memoryUsed: number; // MB
  memoryLimit: number; // MB
  memoryPercent: number; // 0-100
  loadTime: number; // ms
  renderTime: number; // ms
}

// Performance thresholds
export interface PerformanceThresholds {
  minAcceptableFps: number;
  targetFps: number;
  maxMemoryPercent: number;
  maxLoadTime: number; // ms
  maxRenderTime: number; // ms
}

// Performance alert
export interface PerformanceAlert {
  type: 'fps' | 'memory' | 'load_time' | 'render_time';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// Performance configuration
export interface PerformanceConfig {
  enabled: boolean;
  fpsTrackingEnabled: boolean;
  memoryTrackingEnabled: boolean;
  loadTimeTrackingEnabled: boolean;
  sampleInterval: number; // ms between samples
  reportInterval: number; // ms between analytics reports
  thresholds: PerformanceThresholds;
}

// Default configuration
const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: true,
  fpsTrackingEnabled: true,
  memoryTrackingEnabled: true,
  loadTimeTrackingEnabled: true,
  sampleInterval: 1000, // 1 second
  reportInterval: 60000, // 1 minute
  thresholds: {
    minAcceptableFps: 30,
    targetFps: 60,
    maxMemoryPercent: 80,
    maxLoadTime: 3000, // 3 seconds
    maxRenderTime: 16.67, // ~60 FPS
  },
};

/**
 * Performance Monitor Service
 * Tracks and reports application performance metrics
 */
export class PerformanceMonitor extends BaseService {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private fpsHistory: number[] = [];
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private lastSampleTime: number = 0;
  private lastReportTime: number = 0;
  private animationFrameId: number | null = null;
  private sampleIntervalId: NodeJS.Timeout | null = null;
  private reportIntervalId: NodeJS.Timeout | null = null;
  private alerts: PerformanceAlert[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private warningCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    super('PerformanceMonitor');
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = this.getDefaultMetrics();
  }

  /**
   * Initialize the performance monitor
   */
  protected async onInitialize(): Promise<void> {
    // Track initial load time
    if (this.config.loadTimeTrackingEnabled && typeof window !== 'undefined') {
      this.trackLoadTime();
    }

    // Set up Performance Observer for navigation and resource timing
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.handleNavigationTiming(entry as PerformanceNavigationTiming);
            } else if (entry.entryType === 'resource') {
              this.handleResourceTiming(entry as PerformanceResourceTiming);
            }
          }
        });

        this.performanceObserver.observe({
          entryTypes: ['navigation', 'resource'],
        });
      } catch (error) {
        this.logger.warn('PerformanceObserver not supported', { error });
      }
    }
  }

  /**
   * Start the performance monitor
   */
  protected async onStart(): Promise<void> {
    // Start FPS tracking
    if (this.config.fpsTrackingEnabled) {
      this.startFpsTracking();
    }

    // Start periodic sampling
    this.startSampling();

    // Start periodic reporting
    this.startReporting();
  }

  /**
   * Stop the performance monitor
   */
  protected async onStop(): Promise<void> {
    // Stop FPS tracking
    this.stopFpsTracking();

    // Stop sampling
    this.stopSampling();

    // Stop reporting
    this.stopReporting();

    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    // Send final report
    this.reportMetrics();
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance alerts
   */
  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear performance alerts
   */
  public clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Check if performance is acceptable
   */
  public isPerformanceAcceptable(): boolean {
    const { thresholds } = this.config;
    return (
      this.metrics.avgFps >= thresholds.minAcceptableFps &&
      this.metrics.memoryPercent < thresholds.maxMemoryPercent
    );
  }

  /**
   * Get performance quality level
   */
  public getQualityLevel(): 'low' | 'medium' | 'high' {
    const { avgFps } = this.metrics;
    const { minAcceptableFps, targetFps } = this.config.thresholds;

    if (avgFps < minAcceptableFps) {
      return 'low';
    } else if (avgFps < targetFps * 0.8) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Configuration updated', { config: this.config });

    // Restart tracking if needed
    if (this.getState() === 'started') {
      this.stopFpsTracking();
      this.stopSampling();
      this.stopReporting();

      if (this.config.fpsTrackingEnabled) {
        this.startFpsTracking();
      }
      this.startSampling();
      this.startReporting();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Start FPS tracking (public method for tests)
   */
  public startFPSTracking(): void {
    this.startFpsTracking();
  }

  /**
   * Get memory usage in MB
   */
  public getMemoryUsage(): number {
    return this.metrics.memoryUsed;
  }

  /**
   * Get memory usage percentage
   */
  public getMemoryPercentage(): number {
    return this.metrics.memoryPercent;
  }

  /**
   * Get page load time in ms
   */
  public getPageLoadTime(): number {
    return this.metrics.loadTime;
  }

  /**
   * Get resource load times
   */
  public getResourceLoadTimes(): Array<{ name: string; duration: number; type: string }> {
    if (typeof window === 'undefined' || !window.performance) {
      return [];
    }

    try {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources.map((entry) => ({
        name: entry.name,
        duration: Math.round(entry.duration),
        type: entry.initiatorType,
      }));
    } catch (error) {
      this.logger.warn('Failed to get resource load times', { error });
      return [];
    }
  }

  /**
   * Get time to interactive (TTI)
   */
  public getTimeToInteractive(): number {
    if (typeof window === 'undefined' || !window.performance) {
      return 0;
    }

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        return Math.round(navigation.domInteractive - navigation.fetchStart);
      }
    } catch (error) {
      this.logger.warn('Failed to get time to interactive', { error });
    }

    return 0;
  }

  /**
   * Get all metrics (alias for getMetrics)
   */
  public getAllMetrics(): PerformanceMetrics {
    return this.getMetrics();
  }

  /**
   * Export metrics for analytics
   */
  public exportMetrics(): Record<string, any> {
    return {
      fps: this.metrics.fps,
      avgFps: this.metrics.avgFps,
      minFps: this.metrics.minFps,
      maxFps: this.metrics.maxFps,
      memoryUsed: this.metrics.memoryUsed,
      memoryLimit: this.metrics.memoryLimit,
      memoryPercent: this.metrics.memoryPercent,
      loadTime: this.metrics.loadTime,
      renderTime: this.metrics.renderTime,
      qualityLevel: this.getQualityLevel(),
      isAcceptable: this.isPerformanceAcceptable(),
      alertCount: this.alerts.length,
      timestamp: Date.now(),
    };
  }

  /**
   * Register performance warning callback
   */
  public onPerformanceWarning(callback: (alert: PerformanceAlert) => void): () => void {
    this.warningCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.warningCallbacks.indexOf(callback);
      if (index > -1) {
        this.warningCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if tracking is active
   */
  public isTracking(): boolean {
    return this.animationFrameId !== null;
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = this.getDefaultMetrics();
    this.fpsHistory = [];
    this.frameCount = 0;
    this.alerts = [];
    this.logger.info('Metrics reset');
  }

  /**
   * Record a frame (for manual FPS tracking in tests)
   */
  public recordFrame(): void {
    this.frameCount++;
  }

  /**
   * Check memory usage and trigger alerts if needed
   */
  public checkMemory(): void {
    this.sampleMemory();
  }

  // Private methods

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      avgFps: 0,
      minFps: Infinity,
      maxFps: 0,
      memoryUsed: 0,
      memoryLimit: 0,
      memoryPercent: 0,
      loadTime: 0,
      renderTime: 0,
    };
  }

  /**
   * Start FPS tracking
   */
  private startFpsTracking(): void {
    if (typeof window === 'undefined' || !window.requestAnimationFrame) {
      return;
    }

    this.lastFrameTime = performance.now();
    this.frameCount = 0;

    const trackFrame = (timestamp: number) => {
      if (!this.config.fpsTrackingEnabled) {
        return;
      }

      this.frameCount++;
      const delta = timestamp - this.lastFrameTime;

      if (delta >= 1000) {
        // Calculate FPS
        const fps = Math.round((this.frameCount * 1000) / delta);
        this.metrics.fps = fps;

        // Update FPS history
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }

        // Update FPS statistics
        this.metrics.avgFps = Math.round(
          this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
        );
        this.metrics.minFps = Math.min(...this.fpsHistory);
        this.metrics.maxFps = Math.max(...this.fpsHistory);

        // Check FPS threshold
        if (fps < this.config.thresholds.minAcceptableFps) {
          this.addAlert({
            type: 'fps',
            severity: 'critical',
            message: `FPS dropped below acceptable threshold: ${fps} < ${this.config.thresholds.minAcceptableFps}`,
            value: fps,
            threshold: this.config.thresholds.minAcceptableFps,
            timestamp: Date.now(),
          });
        }

        // Reset counters
        this.frameCount = 0;
        this.lastFrameTime = timestamp;
      }

      this.animationFrameId = requestAnimationFrame(trackFrame);
    };

    this.animationFrameId = requestAnimationFrame(trackFrame);
  }

  /**
   * Stop FPS tracking
   */
  private stopFpsTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Start periodic sampling
   */
  private startSampling(): void {
    this.sampleIntervalId = setInterval(() => {
      this.sampleMetrics();
    }, this.config.sampleInterval);
  }

  /**
   * Stop periodic sampling
   */
  private stopSampling(): void {
    if (this.sampleIntervalId) {
      clearInterval(this.sampleIntervalId);
      this.sampleIntervalId = null;
    }
  }

  /**
   * Start periodic reporting
   */
  private startReporting(): void {
    this.reportIntervalId = setInterval(() => {
      this.reportMetrics();
    }, this.config.reportInterval);
  }

  /**
   * Stop periodic reporting
   */
  private stopReporting(): void {
    if (this.reportIntervalId) {
      clearInterval(this.reportIntervalId);
      this.reportIntervalId = null;
    }
  }

  /**
   * Sample performance metrics
   */
  private sampleMetrics(): void {
    // Sample memory usage
    if (this.config.memoryTrackingEnabled) {
      this.sampleMemory();
    }

    // Sample render time
    this.sampleRenderTime();
  }

  /**
   * Sample memory usage
   */
  private sampleMemory(): void {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return;
    }

    try {
      const memory = (performance as any).memory;
      this.metrics.memoryUsed = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
      this.metrics.memoryLimit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024); // MB
      this.metrics.memoryPercent = Math.round(
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      );

      // Check memory threshold
      if (this.metrics.memoryPercent > this.config.thresholds.maxMemoryPercent) {
        this.addAlert({
          type: 'memory',
          severity: 'warning',
          message: `Memory usage exceeded threshold: ${this.metrics.memoryPercent}% > ${this.config.thresholds.maxMemoryPercent}%`,
          value: this.metrics.memoryPercent,
          threshold: this.config.thresholds.maxMemoryPercent,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      this.logger.warn('Failed to sample memory', { error });
    }
  }

  /**
   * Sample render time
   */
  private sampleRenderTime(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    try {
      const entries = performance.getEntriesByType('measure');
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        this.metrics.renderTime = lastEntry.duration;

        // Check render time threshold
        if (this.metrics.renderTime > this.config.thresholds.maxRenderTime) {
          this.addAlert({
            type: 'render_time',
            severity: 'warning',
            message: `Render time exceeded threshold: ${this.metrics.renderTime.toFixed(2)}ms > ${this.config.thresholds.maxRenderTime}ms`,
            value: this.metrics.renderTime,
            threshold: this.config.thresholds.maxRenderTime,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to sample render time', { error });
    }
  }

  /**
   * Track load time
   */
  private trackLoadTime(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.loadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);

        // Check load time threshold
        if (this.metrics.loadTime > this.config.thresholds.maxLoadTime) {
          this.addAlert({
            type: 'load_time',
            severity: 'warning',
            message: `Load time exceeded threshold: ${this.metrics.loadTime}ms > ${this.config.thresholds.maxLoadTime}ms`,
            value: this.metrics.loadTime,
            threshold: this.config.thresholds.maxLoadTime,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to track load time', { error });
    }
  }

  /**
   * Handle navigation timing
   */
  private handleNavigationTiming(entry: PerformanceNavigationTiming): void {
    this.logger.debug('Navigation timing', {
      loadTime: Math.round(entry.loadEventEnd - entry.fetchStart),
      domContentLoaded: Math.round(entry.domContentLoadedEventEnd - entry.fetchStart),
      domInteractive: Math.round(entry.domInteractive - entry.fetchStart),
    });
  }

  /**
   * Handle resource timing
   */
  private handleResourceTiming(entry: PerformanceResourceTiming): void {
    // Log slow resources
    const duration = entry.duration;
    if (duration > 1000) {
      this.logger.warn('Slow resource load', {
        name: entry.name,
        duration: Math.round(duration),
        type: entry.initiatorType,
      });
    }
  }

  /**
   * Report metrics to analytics
   */
  private reportMetrics(): void {
    if (!this.config.enabled) {
      return;
    }

    analyticsService.logEvent('performance_metrics', {
      fps: this.metrics.fps,
      avg_fps: this.metrics.avgFps,
      min_fps: this.metrics.minFps,
      max_fps: this.metrics.maxFps,
      memory_used: this.metrics.memoryUsed,
      memory_percent: this.metrics.memoryPercent,
      load_time: this.metrics.loadTime,
      render_time: Math.round(this.metrics.renderTime * 100) / 100,
      quality_level: this.getQualityLevel(),
      timestamp: Date.now(),
    });

    this.logger.debug('Performance metrics reported', { metrics: this.metrics });
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    this.logger.warn('Performance alert', alert);

    // Call warning callbacks
    this.warningCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        this.logger.error('Error in performance warning callback', { error });
      }
    });

    // Log to analytics
    analyticsService.logEvent('performance_alert', {
      type: alert.type,
      severity: alert.severity,
      value: alert.value,
      threshold: alert.threshold,
      timestamp: alert.timestamp,
    });
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
