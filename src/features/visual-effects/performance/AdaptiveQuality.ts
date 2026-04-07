/**
 * AdaptiveQuality - Quality preset system with device tier detection
 * 
 * Requirements: 13.1-13.6, 14.1-14.6
 * 
 * Quality Presets:
 * - High: 3GB+ RAM, full effects
 * - Medium: 2-3GB RAM, reduced effects
 * - Low: <2GB RAM, minimal effects
 */

export interface QualityPreset {
  name: 'high' | 'medium' | 'low';
  particleMultiplier: number;        // 1.0, 0.6, 0.4
  animationDurationMultiplier: number; // 1.0, 0.8, 0.6
  enableGlow: boolean;
  enableTrails: boolean;
  updateFrequency: number;           // frames between updates (1, 2, 3)
}

export type DeviceTier = 'low' | 'mid' | 'high';

export interface DeviceInfo {
  tier: DeviceTier;
  memory: number;        // GB
  cores: number;
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

const QUALITY_PRESETS: Record<'high' | 'medium' | 'low', QualityPreset> = {
  high: {
    name: 'high',
    particleMultiplier: 1.0,
    animationDurationMultiplier: 1.0,
    enableGlow: true,
    enableTrails: true,
    updateFrequency: 1
  },
  medium: {
    name: 'medium',
    particleMultiplier: 0.6,
    animationDurationMultiplier: 0.8,
    enableGlow: true,
    enableTrails: false,
    updateFrequency: 2
  },
  low: {
    name: 'low',
    particleMultiplier: 0.4,
    animationDurationMultiplier: 0.6,
    enableGlow: false,
    enableTrails: false,
    updateFrequency: 3
  }
};

export class AdaptiveQuality {
  private deviceInfo: DeviceInfo;
  private currentPreset: QualityPreset;
  private autoAdjustEnabled: boolean = true;
  
  constructor() {
    this.deviceInfo = this.detectDevice();
    this.currentPreset = this.selectPresetForDevice(this.deviceInfo);
  }
  
  /**
   * Detect device capabilities
   * Requirements: 14.4
   */
  private detectDevice(): DeviceInfo {
    // Detect platform
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Detect memory (GB)
    let memory = 4; // Default assumption
    if ('deviceMemory' in navigator) {
      memory = (navigator as any).deviceMemory || 4;
    }
    
    // Detect CPU cores
    let cores = 4; // Default assumption
    if ('hardwareConcurrency' in navigator) {
      cores = navigator.hardwareConcurrency || 4;
    }
    
    // Determine tier based on memory and cores
    let tier: DeviceTier;
    if (memory >= 3 && cores >= 4) {
      tier = 'high';
    } else if (memory >= 2 && cores >= 2) {
      tier = 'mid';
    } else {
      tier = 'low';
    }
    
    return {
      tier,
      memory,
      cores,
      isNative,
      isAndroid,
      isIOS
    };
  }
  
  /**
   * Select appropriate preset for device
   * Requirements: 14.5
   */
  private selectPresetForDevice(device: DeviceInfo): QualityPreset {
    // Check for user override in localStorage
    try {
      const userPreset = localStorage.getItem('flux_quality_preset');
      if (userPreset && (userPreset === 'high' || userPreset === 'medium' || userPreset === 'low')) {
        return QUALITY_PRESETS[userPreset];
      }
    } catch {
      // Ignore localStorage errors
    }
    
    // Auto-select based on device tier
    switch (device.tier) {
      case 'high':
        return QUALITY_PRESETS.high;
      case 'mid':
        return QUALITY_PRESETS.medium;
      case 'low':
        return QUALITY_PRESETS.low;
    }
  }
  
  /**
   * Get current quality preset
   */
  getCurrentPreset(): QualityPreset {
    return this.currentPreset;
  }
  
  /**
   * Set quality preset manually
   * Requirements: 13.1-13.6
   */
  setPreset(preset: 'high' | 'medium' | 'low'): void {
    this.currentPreset = QUALITY_PRESETS[preset];
    
    // Persist to localStorage
    try {
      localStorage.setItem('flux_quality_preset', preset);
    } catch {
      // Ignore localStorage errors
    }
  }
  
  /**
   * Get device information
   */
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }
  
  /**
   * Adjust quality based on performance
   * Requirements: 13.4
   */
  adjustQualityForPerformance(currentFPS: number, targetFPS: number = 60): void {
    if (!this.autoAdjustEnabled) return;
    
    const fpsRatio = currentFPS / targetFPS;
    
    // If FPS is significantly below target, downgrade quality
    if (fpsRatio < 0.75) { // Below 45 FPS for 60 FPS target
      if (this.currentPreset.name === 'high') {
        console.log('[AdaptiveQuality] Downgrading to medium quality due to low FPS');
        this.setPreset('medium');
      } else if (this.currentPreset.name === 'medium') {
        console.log('[AdaptiveQuality] Downgrading to low quality due to low FPS');
        this.setPreset('low');
      }
    }
    // If FPS is consistently high, consider upgrading
    else if (fpsRatio > 0.95 && this.currentPreset.name !== 'high') {
      // Only upgrade if we've been at high FPS for a while
      // This prevents rapid quality changes
      if (this.currentPreset.name === 'low') {
        console.log('[AdaptiveQuality] Upgrading to medium quality');
        this.setPreset('medium');
      } else if (this.currentPreset.name === 'medium' && this.deviceInfo.tier === 'high') {
        console.log('[AdaptiveQuality] Upgrading to high quality');
        this.setPreset('high');
      }
    }
  }
  
  /**
   * Enable or disable auto-adjustment
   */
  setAutoAdjust(enabled: boolean): void {
    this.autoAdjustEnabled = enabled;
  }
  
  /**
   * Check if battery saver mode should be enabled
   * Requirements: 14.6
   */
  async checkBatterySaver(): Promise<boolean> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        
        // Enable battery saver if below 20%
        if (battery.level < 0.2) {
          console.log('[AdaptiveQuality] Low battery detected, enabling saver mode');
          this.setPreset('low');
          return true;
        }
      } catch (error) {
        console.debug('[AdaptiveQuality] Battery API not available');
      }
    }
    
    return false;
  }
  
  /**
   * Get recommended settings for native Android
   * Requirements: 14.1, 14.2, 14.3
   */
  getAndroidOptimizations(): {
    disableGlow: boolean;
    particleReduction: number;
    emissiveThrottle: number;
  } {
    if (!this.deviceInfo.isAndroid) {
      return {
        disableGlow: false,
        particleReduction: 0,
        emissiveThrottle: 1
      };
    }
    
    return {
      disableGlow: true,                                    // Requirement 14.1
      particleReduction: this.deviceInfo.memory < 3 ? 0.4 : 0, // Requirement 14.2
      emissiveThrottle: 3                                   // Requirement 14.3
    };
  }
}

// Singleton instance
let adaptiveQualityInstance: AdaptiveQuality | null = null;

/**
 * Get singleton AdaptiveQuality instance
 */
export const getAdaptiveQuality = (): AdaptiveQuality => {
  if (!adaptiveQualityInstance) {
    adaptiveQualityInstance = new AdaptiveQuality();
  }
  return adaptiveQualityInstance;
};
