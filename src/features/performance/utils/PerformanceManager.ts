/**
 * Performance Manager
 * 
 * Manages quality presets and automatic performance adjustment
 */

import type { QualityPreset, PerformanceState, DeviceCapabilities } from '../types';
import { QUALITY_PRESETS } from '../types';

export class PerformanceManager {
  private state: PerformanceState;
  private babylonEngine: any | null;
  private fpsHistory: number[];
  private monitorInterval: NodeJS.Timeout | null;
  
  constructor() {
    this.state = {
      currentPreset: QUALITY_PRESETS.medium,
      deviceCapabilities: {
        classification: 'medium',
        ram: 4,
        cores: 4,
        gpu: { vendor: 'unknown', renderer: 'unknown', tier: 2 },
        screen: { width: 1920, height: 1080, pixelRatio: 1, refreshRate: 60 },
        isMobile: false
      },
      currentFPS: 60,
      avgFPS: 60,
      memoryUsage: 0,
      autoAdjustEnabled: false
    };
    this.babylonEngine = null;
    this.fpsHistory = [];
    this.monitorInterval = null;
  }
  
  /**
   * Initialize with Babylon.js engine
   */
  initialize(babylonEngine: any, deviceCapabilities: DeviceCapabilities): void {
    this.babylonEngine = babylonEngine;
    this.state.deviceCapabilities = deviceCapabilities;
    
    // Apply default preset based on device classification
    const presetName = deviceCapabilities.classification;
    this.applyPreset(QUALITY_PRESETS[presetName]);
    
    console.log(`[PerformanceManager] Initialized with ${presetName} preset`);
  }
  
  /**
   * Apply a quality preset
   */
  applyPreset(preset: QualityPreset): void {
    this.state.currentPreset = preset;
    
    if (!this.babylonEngine) {
      console.warn('[PerformanceManager] Babylon engine not initialized');
      return;
    }
    
    // Apply settings to Babylon.js engine
    this.applyBabylonSettings(preset);
    
    console.log(`[PerformanceManager] Applied ${preset.name} preset`);
  }
  
  /**
   * Apply custom settings
   */
  applyCustomSettings(settings: Partial<QualityPreset>): void {
    this.state.currentPreset = {
      ...this.state.currentPreset,
      ...settings,
      name: 'custom'
    };
    
    if (this.babylonEngine) {
      this.applyBabylonSettings(this.state.currentPreset);
    }
    
    console.log('[PerformanceManager] Applied custom settings');
  }
  
  /**
   * Apply settings to Babylon.js engine
   */
  private applyBabylonSettings(preset: QualityPreset): void {
    if (!this.babylonEngine) return;
    
    // Hardware scaling for Lite Mode
    const scalingLevel = preset.liteMode ? 2 : 1;
    this.babylonEngine.setHardwareScalingLevel(scalingLevel);
    
    // Frame rate target
    if (preset.targetFPS !== 'unlimited') {
      this.babylonEngine.fps = preset.targetFPS;
    }
    
    console.log(`[PerformanceManager] Babylon settings applied - scaling: ${scalingLevel}, fps: ${preset.targetFPS}`);
  }
  
  /**
   * Enable automatic quality adjustment
   */
  enableAutoAdjust(): void {
    if (this.state.autoAdjustEnabled) return;
    
    this.state.autoAdjustEnabled = true;
    
    // Start monitoring FPS
    this.monitorInterval = setInterval(() => {
      this.checkPerformance();
    }, 1000); // Check every second
    
    console.log('[PerformanceManager] Auto-adjust enabled');
  }
  
  /**
   * Disable automatic quality adjustment
   */
  disableAutoAdjust(): void {
    if (!this.state.autoAdjustEnabled) return;
    
    this.state.autoAdjustEnabled = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    console.log('[PerformanceManager] Auto-adjust disabled');
  }
  
  /**
   * Check performance and adjust quality if needed
   */
  private checkPerformance(): void {
    if (!this.babylonEngine) return;
    
    const currentFPS = this.babylonEngine.getFps();
    this.state.currentFPS = currentFPS;
    
    // Track FPS history (last 3 seconds)
    this.fpsHistory.push(currentFPS);
    if (this.fpsHistory.length > 3) {
      this.fpsHistory.shift();
    }
    
    // Calculate average FPS
    this.state.avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    
    // Check if we need to adjust quality
    const targetFPS = this.state.currentPreset.targetFPS;
    if (targetFPS !== 'unlimited' && this.fpsHistory.length === 3) {
      const avgFPS = this.state.avgFPS;
      
      // If FPS is consistently below target, reduce quality
      if (avgFPS < targetFPS * 0.8) {
        console.warn(`[PerformanceManager] FPS below target (${avgFPS.toFixed(1)} < ${targetFPS})`);
        this.adjustQuality('down');
      }
    }
  }
  
  /**
   * Adjust quality up or down
   */
  private adjustQuality(direction: 'up' | 'down'): void {
    const currentName = this.state.currentPreset.name;
    
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
  
  /**
   * Notify user of quality change
   */
  private notifyQualityChange(newQuality: string): void {
    console.log(`[PerformanceManager] Quality automatically adjusted to ${newQuality}`);
    // TODO: Show notification to user
  }
  
  /**
   * Get current state
   */
  getState(): PerformanceState {
    return { ...this.state };
  }
  
  /**
   * Update memory usage
   */
  updateMemoryUsage(usage: number): void {
    this.state.memoryUsage = usage;
  }
}

// Singleton instance
export const performanceManager = new PerformanceManager();
