/**
 * Performance Monitor Service
 * 
 * Consolidated performance monitoring service that combines:
 * - FPS tracking and memory monitoring
 * - Quality preset management and auto-adjustment
 * - Babylon.js engine integration
 * - Analytics integration
 * 
 * Requirements: 3.10, 5.1, 5.2
 */

import { BaseService } from '../base/BaseService';
import { analyticsService } from '../../../services/analytics/analyticsService';

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

// Quality preset
export interface QualityPreset {
  name: string;
  targetFPS: number | 'unlimited';
  liteMode: boolean;
  particleCount?: number;
  shadowQuality?: 'low' | 'medium' | 'high';
  antialiasing?: boolean;
}

// Device capabilities
export interface DeviceCapabilities {
  classification: 'low' | 'medium' | 'high';
  ram: number;
  cores: number;
  gpu: { vendor: string; renderer: string; tier: number };
  screen: { width: number; height: number; pixelRatio: number; refreshRate: number };
  isMobile: boolean;
}

// Performance configuration
export interface PerformanceConfig {
  enabled: boolean;
  fpsTrackingEnabled: boolean;
  memoryTrackingEnabled: boolean;
  loadTimeTrackingEnabled: boolean;
  autoAdjustEnabled: boolean;
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
  autoAdjustEnabled: false,
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

// Default quality presets
export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  low: {
    name: 'low',
    targetFPS: 30,
    liteMode: true,
    particleCount: 50,
    shadowQuality: 'low',
    antialiasing: false,
  },
  medium: {
    name: 'medium',
    targetFPS: 60,
    liteMode: false,
    particleCount: 100,
    shadowQuality: 'medium',
    antialiasing: true,
  },
  high: {
    name: 'high',
    targetFPS: 60,
    liteMode: false,
    particleCount: 200,
    shadowQuality: 'high',
    antialiasing: true,
  },
};

/**
 * Performance Monitor Service
 * Tracks and reports application performance metrics with quality management
 */
export class PerformanceMonitor extends BaseService {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private fpsHistory: number[] = [];
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private sampleIntervalId: NodeJS.Timeout | null = null;
  private reportIntervalId: NodeJS.Timeout | null = null;
  private autoAdjustIntervalId: NodeJS.Timeout | null = null;
  private alerts: PerformanceAlert[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private warningCallbacks: Array<(alert: PerformanceAlert) => void> = [];
  
  // Quality management
  private currentPreset: QualityPreset;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private babylonEngine: any | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    super('PerformanceMonitor');
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = this.getDefaultMetrics();
    this.currentPreset = QUALITY_PRESETS.medium;
  }

  /**
   * Initialize the performance monitor
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Track initial load time
    if (this.config.loadTimeTrackingEnabled && typeof window !== 'undefined') {
      this.trackLoadTime();
    }

    // Set up Performance Observer
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
        this.warn('PerformanceObserver not supported', error);
      }
    }

    // Start FPS tracking
    if (this.config.fpsTrackingEnabled) {
      this.startFpsTracking();
    }

    // Start periodic sampling
    this.startSampling();

    // Start periodic reporting
    this.startReporting();

    // Start auto-adjust if enabled
    if (this.config.autoAdjustEnabled) {
      this.enableAutoAdjust();
    }

    this.markInitialized();
  }

  /**
   * Cleanup service resources
   */
  cleanup(): void {
    this.stopFpsTracking();
    this.stopSampling();
    this.stopReporting();
    this.disableAutoAdjust();

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    this.reportMetrics();
    this.initialized = false;
    this.log('Service cleaned up');
  }

  // === Metrics API ===

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get all metrics (alias)
   */
  getAllMetrics(): PerformanceMetrics {
    return this.getMetrics();
  }

  /**
   * Export metrics for analytics
   */
  exportMetrics(): Record<string, any> {
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
      qualityPreset: this.currentPreset.name,
      isAcceptable: this.isPerformanceAcceptable(),
      alertCount: this.alerts.length,
      timestamp: Date.now(),
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.getDefaultMetrics();
    this.fpsHistory = [];
    this.frameCount = 0;
    this.alerts = [];
    this.log('Metrics reset');
  }

  // === FPS Tracking ===

  /**
   * Get memory usage in MB
   */
  getMemoryUsage(): number {
    return this.metrics.memoryUsed;
  }

  /**
   * Get memory usage percentage
   */
  getMemoryPercentage(): number {
    return this.metrics.memoryPercent;
  }

  /**
   * Get page load time in ms
   */
  getPageLoadTime(): number {
    return this.metrics.loadTime;
  }

  /**
   * Check memory usage
   */
  checkMemory(): void {
    this.sampleMemory();
  }

  /**
   * Record a frame (for manual tracking)
   */
  recordFrame(): void {
    this.frameCount++;
  }

  /**
   * Check if tracking is active
   */
  isTracking(): boolean {
    return this.animationFrameId !== null;
  }

  /**
   * Start FPS tracking (public method)
   */
  startFPSTracking(): void {
    this.startFpsTracking();
  }

  // === Performance Analysis ===

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(): boolean {
    const { thresholds } = this.config;
    return (
      this.metrics.avgFps >= thresholds.minAcceptableFps &&
      this.metrics.memoryPercent < thresholds.maxMemoryPercent
    );
  }

  /**
   * Get performance quality level
   */
  getQualityLevel(): 'low' | 'medium' | 'high' {
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

  // === Alerts ===

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear performance alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Register performance warning callback
   */
  onPerformanceWarning(callback: (alert: PerformanceAlert) => void): () => void {
    this.warningCallbacks.push(callback);
    return () => {
      const index = this.warningCallbacks.indexOf(callback);
      if (index > -1) {
        this.warningCallbacks.splice(index, 1);
      }
    };
  }

  // === Configuration ===

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('Configuration updated', this.config);

    if (this.initialized) {
      this.stopFpsTracking();
      this.stopSampling();
      this.stopReporting();

      if (this.config.fpsTrackingEnabled) {
        this.startFpsTracking();
      }
      this.startSampling();
      this.startReporting();

      if (this.config.autoAdjustEnabled) {
        this.enableAutoAdjust();
      } else {
        this.disableAutoAdjust();
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // === Quality Management ===

  /**
   * Initialize with Babylon.js engine
   */
  initializeBabylon(babylonEngine: any, deviceCapabilities: DeviceCapabilities): void {
    this.babylonEngine = babylonEngine;
    this.deviceCapabilities = deviceCapabilities;
    
    const presetName = deviceCapabilities.classification;
    this.applyPreset(QUALITY_PRESETS[presetName]);
    
    this.log(`Initialized with ${presetName} preset`);
  }

  /**
   * Apply a quality preset
   */
  applyPreset(preset: QualityPreset): void {
    this.currentPreset = preset;
    
    if (this.babylonEngine) {
      this.applyBabylonSettings(preset);
    }
    
    this.log(`Applied ${preset.name} preset`);
  }

  /**
   * Apply custom settings
   */
  applyCustomSettings(settings: Partial<QualityPreset>): void {
    this.currentPreset = {
      ...this.currentPreset,
      ...settings,
      name: 'custom'
    };
    
    if (this.babylonEngine) {
      this.applyBabylonSettings(this.currentPreset);
    }
    
    this.log('Applied custom settings');
  }

  /**
   * Get current quality preset
   */
  getCurrentPreset(): QualityPreset {
    return { ...this.currentPreset };
  }

  /**
   * Enable automatic quality adjustment
   */
  enableAutoAdjust(): void {
    if (this.autoAdjustIntervalId) return;
    
    this.config.autoAdjustEnabled = true;
    this.autoAdjustIntervalId = setInterval(() => {
      this.checkAndAdjustQuality();
    }, 1000);
    
    this.log('Auto-adjust enabled');
  }

  /**
   * Disable automatic quality adjustment
   */
  disableAutoAdjust(): void {
    if (!this.autoAdjustIntervalId) return;
    
    this.config.autoAdjustEnabled = false;
    clearInterval(this.autoAdjustIntervalId);
    this.autoAdjustIntervalId = null;
    
    this.log('Auto-adjust disabled');
  }

  // === Resource Timing ===

  /**
   * Get resource load times
   */
  getResourceLoadTimes(): Array<{ name: string; duration: number; type: string }> {
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
      this.warn('Failed to get resource load times', error);
      return [];
    }
  }

  /**
   * Get time to interactive (TTI)
   */
  getTimeToInteractive(): number {
    if (typeof window === 'undefined' || !window.performance) {
      return 0;
    }

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        return Math.round(navigation.domInteractive - navigation.fetchStart);
      }
    } catch (error) {
      this.warn('Failed to get time to interactive', error);
    }

    return 0;
  }

  // === Private Methods ===

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
        const fps = Math.round((this.frameCount * 1000) / delta);
        this.metrics.fps = fps;

        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }

        this.metrics.avgFps = Math.round(
          this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
        );
        this.metrics.minFps = Math.min(...this.fpsHistory);
        this.metrics.maxFps = Math.max(...this.fpsHistory);

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

        this.frameCount = 0;
        this.lastFrameTime = timestamp;
      }

      this.animationFrameId = requestAnimationFrame(trackFrame);
    };

    this.animationFrameId = requestAnimationFrame(trackFrame);
  }

  private stopFpsTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private startSampling(): void {
    this.sampleIntervalId = setInterval(() => {
      this.sampleMetrics();
    }, this.config.sampleInterval);
  }

  private stopSampling(): void {
    if (this.sampleIntervalId) {
      clearInterval(this.sampleIntervalId);
      this.sampleIntervalId = null;
    }
  }

  private startReporting(): void {
    this.reportIntervalId = setInterval(() => {
      this.reportMetrics();
    }, this.config.reportInterval);
  }

  private stopReporting(): void {
    if (this.reportIntervalId) {
      clearInterval(this.reportIntervalId);
      this.reportIntervalId = null;
    }
  }

  private sampleMetrics(): void {
    if (this.config.memoryTrackingEnabled) {
      this.sampleMemory();
    }
    this.sampleRenderTime();
  }

  private sampleMemory(): void {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return;
    }

    try {
      const memory = (performance as any).memory;
      this.metrics.memoryUsed = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      this.metrics.memoryLimit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      this.metrics.memoryPercent = Math.round(
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      );

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
      this.warn('Failed to sample memory', error);
    }
  }

  private sampleRenderTime(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    try {
      const entries = performance.getEntriesByType('measure');
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        this.metrics.renderTime = lastEntry.duration;

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
      this.warn('Failed to sample render time', error);
    }
  }

  private trackLoadTime(): void {
    if (typeof window === 'undefined' || !window.performance) {
      return;
    }

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.loadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);

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
      this.warn('Failed to track load time', error);
    }
  }

  private handleNavigationTiming(entry: PerformanceNavigationTiming): void {
    this.log('Navigation timing', {
      loadTime: Math.round(entry.loadEventEnd - entry.fetchStart),
      domContentLoaded: Math.round(entry.domContentLoadedEventEnd - entry.fetchStart),
      domInteractive: Math.round(entry.domInteractive - entry.fetchStart),
    });
  }

  private handleResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.duration;
    if (duration > 1000) {
      this.warn('Slow resource load', {
        name: entry.name,
        duration: Math.round(duration),
        type: entry.initiatorType,
      });
    }
  }

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
      quality_preset: this.currentPreset.name,
      timestamp: Date.now(),
    });
  }

  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    this.warn('Performance alert', alert);

    this.warningCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        this.error('Error in performance warning callback', error as Error);
      }
    });

    analyticsService.logEvent('performance_alert', {
      type: alert.type,
      severity: alert.severity,
      value: alert.value,
      threshold: alert.threshold,
      timestamp: alert.timestamp,
    });
  }

  private applyBabylonSettings(preset: QualityPreset): void {
    if (!this.babylonEngine) return;
    
    const scalingLevel = preset.liteMode ? 2 : 1;
    this.babylonEngine.setHardwareScalingLevel(scalingLevel);
    
    if (preset.targetFPS !== 'unlimited') {
      this.babylonEngine.fps = preset.targetFPS;
    }
    
    this.log(`Babylon settings applied - scaling: ${scalingLevel}, fps: ${preset.targetFPS}`);
  }

  private checkAndAdjustQuality(): void {
    if (!this.babylonEngine || this.fpsHistory.length < 3) return;
    
    const avgFPS = this.metrics.avgFps;
    const targetFPS = this.currentPreset.targetFPS;
    
    if (targetFPS !== 'unlimited' && avgFPS < targetFPS * 0.8) {
      this.warn(`FPS below target (${avgFPS.toFixed(1)} < ${targetFPS})`);
      this.adjustQuality('down');
    }
  }

  private adjustQuality(direction: 'up' | 'down'): void {
    const currentName = this.currentPreset.name;
    
    if (direction === 'down') {
      if (currentName === 'high') {
        this.applyPreset(QUALITY_PRESETS.medium);
        this.notifyQualityChange('medium');
      } else if (currentName === 'medium') {
        this.applyPreset(QUALITY_PRESETS.low);
        this.notifyQualityChange('low');
      }
    } else {
      if (currentName === 'low') {
        this.applyPreset(QUALITY_PRESETS.medium);
        this.notifyQualityChange('medium');
      } else if (currentName === 'medium') {
        this.applyPreset(QUALITY_PRESETS.high);
        this.notifyQualityChange('high');
      }
    }
  }

  private notifyQualityChange(newQuality: string): void {
    this.log(`Quality automatically adjusted to ${newQuality}`);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
