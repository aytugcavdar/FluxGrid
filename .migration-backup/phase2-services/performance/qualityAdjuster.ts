/**
 * Quality Adjuster
 * 
 * Automatically adjusts graphics quality based on device capabilities
 * and performance metrics. Disables particle effects and shadows on
 * low-end devices.
 * 
 * Requirements: 5.5, 3.10
 */

import { detectDevice, DeviceInfo, DeviceTier } from '../../utils/platform/deviceDetector';
import { performanceMonitor } from './performanceMonitor';
import { analyticsService } from '../analytics/analyticsService';

/**
 * Graphics quality settings
 */
export interface QualitySettings {
  particleEffects: boolean;
  shadows: boolean;
  antialiasing: boolean;
  textureQuality: 'low' | 'medium' | 'high';
  renderScale: number; // 0.5 to 1.0
  maxParticles: number;
  targetFps: number;
}

/**
 * Quality presets
 */
export const QualityPresets: Record<'low' | 'medium' | 'high' | 'ultra', QualitySettings> = {
  low: {
    particleEffects: false,
    shadows: false,
    antialiasing: false,
    textureQuality: 'low',
    renderScale: 0.75,
    maxParticles: 10,
    targetFps: 30,
  },
  medium: {
    particleEffects: true,
    shadows: false,
    antialiasing: false,
    textureQuality: 'medium',
    renderScale: 0.85,
    maxParticles: 50,
    targetFps: 45,
  },
  high: {
    particleEffects: true,
    shadows: true,
    antialiasing: true,
    textureQuality: 'high',
    renderScale: 1.0,
    maxParticles: 100,
    targetFps: 60,
  },
  ultra: {
    particleEffects: true,
    shadows: true,
    antialiasing: true,
    textureQuality: 'high',
    renderScale: 1.0,
    maxParticles: 200,
    targetFps: 60,
  },
};

/**
 * Quality adjustment configuration
 */
export interface QualityAdjusterConfig {
  enabled: boolean;
  autoAdjust: boolean; // Automatically adjust based on performance
  checkInterval: number; // ms between performance checks
  adjustmentThreshold: number; // Number of consecutive poor performance samples before adjusting
}

/**
 * Quality Adjuster
 * Manages graphics quality settings based on device and performance
 */
export class QualityAdjuster {
  private config: QualityAdjusterConfig;
  private currentSettings: QualitySettings;
  private deviceInfo: DeviceInfo;
  private poorPerformanceCount: number = 0;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private listeners: Set<(settings: QualitySettings) => void> = new Set();

  constructor(config: Partial<QualityAdjusterConfig> = {}) {
    this.config = {
      enabled: true,
      autoAdjust: true,
      checkInterval: 5000, // 5 seconds
      adjustmentThreshold: 3, // 3 consecutive poor performance samples
      ...config,
    };

    // Detect device
    this.deviceInfo = detectDevice();

    // Set initial quality based on device
    this.currentSettings = this.getInitialQuality();

    // Log initial quality
    this.logQualityChange('initial', this.currentSettings);
  }

  /**
   * Start quality monitoring
   */
  public start(): void {
    if (!this.config.enabled || !this.config.autoAdjust) {
      return;
    }

    // Start periodic performance checks
    this.checkIntervalId = setInterval(() => {
      this.checkPerformance();
    }, this.config.checkInterval);
  }

  /**
   * Stop quality monitoring
   */
  public stop(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  /**
   * Get current quality settings
   */
  public getSettings(): QualitySettings {
    return { ...this.currentSettings };
  }

  /**
   * Set quality settings manually
   */
  public setSettings(settings: Partial<QualitySettings>): void {
    const oldSettings = { ...this.currentSettings };
    this.currentSettings = { ...this.currentSettings, ...settings };

    // Notify listeners
    this.notifyListeners();

    // Log quality change
    this.logQualityChange('manual', this.currentSettings, oldSettings);
  }

  /**
   * Set quality preset
   */
  public setPreset(preset: 'low' | 'medium' | 'high' | 'ultra'): void {
    const oldSettings = { ...this.currentSettings };
    this.currentSettings = { ...QualityPresets[preset] };

    // Notify listeners
    this.notifyListeners();

    // Log quality change
    this.logQualityChange('preset', this.currentSettings, oldSettings);

    // Log to analytics
    analyticsService.logEvent('quality_preset_changed', {
      preset,
      device_tier: this.deviceInfo.tier,
      timestamp: Date.now(),
    });
  }

  /**
   * Get recommended quality preset based on device
   */
  public getRecommendedPreset(): 'low' | 'medium' | 'high' | 'ultra' {
    switch (this.deviceInfo.tier) {
      case DeviceTier.LOW:
        return 'low';
      case DeviceTier.MID:
        return 'medium';
      case DeviceTier.HIGH:
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Get device information
   */
  public getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * Add quality change listener
   */
  public addListener(listener: (settings: QualitySettings) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove quality change listener
   */
  public removeListener(listener: (settings: QualitySettings) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<QualityAdjusterConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart monitoring if needed
    if (this.checkIntervalId) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): QualityAdjusterConfig {
    return { ...this.config };
  }

  // Private methods

  /**
   * Get initial quality based on device
   */
  private getInitialQuality(): QualitySettings {
    const preset = this.getRecommendedPreset();
    return { ...QualityPresets[preset] };
  }

  /**
   * Check performance and adjust quality if needed
   */
  private checkPerformance(): void {
    const metrics = performanceMonitor.getMetrics();
    const isAcceptable = performanceMonitor.isPerformanceAcceptable();

    if (!isAcceptable) {
      this.poorPerformanceCount++;

      // Check if we should adjust quality
      if (this.poorPerformanceCount >= this.config.adjustmentThreshold) {
        this.adjustQualityDown();
        this.poorPerformanceCount = 0;
      }
    } else {
      // Reset counter if performance is good
      this.poorPerformanceCount = 0;
    }
  }

  /**
   * Adjust quality down (reduce settings)
   */
  private adjustQualityDown(): void {
    const oldSettings = { ...this.currentSettings };
    let adjusted = false;

    // Priority order for reducing quality:
    // 1. Reduce particle count
    // 2. Disable shadows
    // 3. Disable antialiasing
    // 4. Reduce render scale
    // 5. Disable particle effects
    // 6. Reduce texture quality

    if (this.currentSettings.maxParticles > 10) {
      this.currentSettings.maxParticles = Math.max(10, Math.floor(this.currentSettings.maxParticles * 0.5));
      adjusted = true;
    } else if (this.currentSettings.shadows) {
      this.currentSettings.shadows = false;
      adjusted = true;
    } else if (this.currentSettings.antialiasing) {
      this.currentSettings.antialiasing = false;
      adjusted = true;
    } else if (this.currentSettings.renderScale > 0.5) {
      this.currentSettings.renderScale = Math.max(0.5, this.currentSettings.renderScale - 0.1);
      adjusted = true;
    } else if (this.currentSettings.particleEffects) {
      this.currentSettings.particleEffects = false;
      adjusted = true;
    } else if (this.currentSettings.textureQuality !== 'low') {
      this.currentSettings.textureQuality = this.currentSettings.textureQuality === 'high' ? 'medium' : 'low';
      adjusted = true;
    }

    if (adjusted) {
      // Notify listeners
      this.notifyListeners();

      // Log quality change
      this.logQualityChange('auto_down', this.currentSettings, oldSettings);

      // Log to analytics
      analyticsService.logEvent('quality_adjusted_down', {
        reason: 'poor_performance',
        old_settings: JSON.stringify(oldSettings),
        new_settings: JSON.stringify(this.currentSettings),
        device_tier: this.deviceInfo.tier,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Notify all listeners of quality change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentSettings);
      } catch (error) {
        console.error('Error in quality change listener:', error);
      }
    });
  }

  /**
   * Log quality change
   */
  private logQualityChange(
    reason: string,
    newSettings: QualitySettings,
    oldSettings?: QualitySettings
  ): void {
    console.log(`[QualityAdjuster] Quality changed (${reason}):`, {
      old: oldSettings,
      new: newSettings,
      device: this.deviceInfo.tier,
    });
  }
}

/**
 * Apply quality settings to game engine
 * This is a helper function that should be called when quality settings change
 */
export function applyQualitySettings(settings: QualitySettings): void {
  // This function should be implemented in the game engine integration
  // It will apply the quality settings to Babylon.js or other rendering engine
  
  console.log('[QualityAdjuster] Applying quality settings:', settings);

  // Example implementation (to be customized for your game engine):
  // - Set particle system max particles
  // - Enable/disable shadows
  // - Set antialiasing
  // - Set texture quality
  // - Set render scale

  // Log to analytics
  analyticsService.logEvent('quality_settings_applied', {
    particle_effects: settings.particleEffects,
    shadows: settings.shadows,
    antialiasing: settings.antialiasing,
    texture_quality: settings.textureQuality,
    render_scale: settings.renderScale,
    max_particles: settings.maxParticles,
    target_fps: settings.targetFps,
    timestamp: Date.now(),
  });
}

// Export singleton instance
export const qualityAdjuster = new QualityAdjuster();

// Auto-apply quality settings when they change
qualityAdjuster.addListener((settings) => {
  applyQualitySettings(settings);
});
