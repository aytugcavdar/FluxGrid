/**
 * BatterySaverManager - Battery saver mode implementation
 * 
 * Requirements: 14.6
 * 
 * Features:
 * - Monitor battery level using Battery API
 * - Enable saver mode at <20% battery
 * - Switch to low quality preset
 * - Disable haptics
 * - Reduce FPS target to 30
 * - Persist battery saver state in localStorage
 * - Handle browsers that don't support Battery API gracefully
 */

import { getAdaptiveQuality } from './AdaptiveQuality';
import { getHapticManager } from '../../../utils/audio/haptics';

export interface BatterySaverState {
  isActive: boolean;
  batteryLevel: number | null;
  isCharging: boolean | null;
  batteryAPISupported: boolean;
}

export interface BatterySaverCallbacks {
  onQualityChange?: (preset: 'high' | 'medium' | 'low') => void;
  onFPSChange?: (targetFPS: number) => void;
  onHapticsChange?: (enabled: boolean) => void;
}

export class BatterySaverManager {
  private isActive: boolean = false;
  private batteryLevel: number | null = null;
  private isCharging: boolean | null = null;
  private batteryAPISupported: boolean = false;
  private battery: any = null;
  private checkInterval: number | null = null;
  private callbacks: BatterySaverCallbacks = {};
  
  // Thresholds
  private readonly LOW_BATTERY_THRESHOLD = 0.2; // 20%
  private readonly CHECK_INTERVAL_MS = 30000; // 30 seconds
  
  constructor(callbacks?: BatterySaverCallbacks) {
    this.callbacks = callbacks || {};
    this.checkBatteryAPISupport();
    this.loadPersistedState();
  }
  
  /**
   * Check if Battery API is supported
   */
  private checkBatteryAPISupport(): void {
    this.batteryAPISupported = 'getBattery' in navigator;
    
    if (!this.batteryAPISupported) {
      console.debug('[BatterySaverManager] Battery API not supported in this browser');
    }
  }
  
  /**
   * Load persisted battery saver state from localStorage
   */
  private loadPersistedState(): void {
    try {
      const persisted = localStorage.getItem('flux_battery_saver_active');
      if (persisted === 'true') {
        console.log('[BatterySaverManager] Restoring battery saver mode from localStorage');
        // Don't auto-enable, just note it was previously active
        // We'll check actual battery level on initialization
      }
    } catch (error) {
      console.debug('[BatterySaverManager] Could not load persisted state:', error);
    }
  }
  
  /**
   * Persist battery saver state to localStorage
   */
  private persistState(): void {
    try {
      localStorage.setItem('flux_battery_saver_active', String(this.isActive));
    } catch (error) {
      console.debug('[BatterySaverManager] Could not persist state:', error);
    }
  }
  
  /**
   * Initialize battery monitoring
   * Requirements: 14.6
   */
  async initialize(): Promise<void> {
    if (!this.batteryAPISupported) {
      console.debug('[BatterySaverManager] Battery API not available, battery saver disabled');
      return;
    }
    
    try {
      // Get battery object
      this.battery = await (navigator as any).getBattery();
      
      // Read initial state
      this.batteryLevel = this.battery.level;
      this.isCharging = this.battery.charging;
      
      const percentage = this.batteryLevel !== null ? Math.floor(this.batteryLevel * 100) : 0;
      console.log('[BatterySaverManager] Battery initialized:', {
        level: percentage + '%',
        charging: this.isCharging
      });
      
      // Check if we should enable battery saver immediately
      this.checkBatteryLevel();
      
      // Set up event listeners for battery changes
      this.battery.addEventListener('levelchange', this.handleBatteryChange);
      this.battery.addEventListener('chargingchange', this.handleChargingChange);
      
      // Set up periodic check (backup in case events don't fire)
      this.checkInterval = window.setInterval(() => {
        this.checkBatteryLevel();
      }, this.CHECK_INTERVAL_MS);
      
    } catch (error) {
      console.warn('[BatterySaverManager] Failed to initialize Battery API:', error);
      this.batteryAPISupported = false;
    }
  }
  
  /**
   * Handle battery level change event
   */
  private handleBatteryChange = (): void => {
    if (!this.battery) return;
    
    this.batteryLevel = this.battery.level;
    
    const percentage = this.batteryLevel !== null ? Math.floor(this.batteryLevel * 100) : 0;
    console.log('[BatterySaverManager] Battery level changed:', percentage + '%');
    
    this.checkBatteryLevel();
  };
  
  /**
   * Handle charging state change event
   */
  private handleChargingChange = (): void => {
    if (!this.battery) return;
    
    this.isCharging = this.battery.charging;
    
    console.log('[BatterySaverManager] Charging state changed:', this.isCharging);
    
    // If started charging and battery saver is active, consider disabling it
    if (this.isCharging && this.isActive) {
      // Wait a bit to see if battery level increases
      setTimeout(() => {
        this.checkBatteryLevel();
      }, 5000);
    }
  };
  
  /**
   * Check battery level and enable/disable battery saver mode
   * Requirements: 14.6
   */
  private checkBatteryLevel(): void {
    if (this.batteryLevel === null) return;
    
    const shouldBeActive = this.batteryLevel < this.LOW_BATTERY_THRESHOLD && !this.isCharging;
    
    if (shouldBeActive && !this.isActive) {
      this.enableBatterySaver();
    } else if (!shouldBeActive && this.isActive) {
      this.disableBatterySaver();
    }
  }
  
  /**
   * Enable battery saver mode
   * Requirements: 14.6
   * - Switch to low quality preset
   * - Disable haptics
   * - Reduce FPS target to 30
   */
  private enableBatterySaver(): void {
    console.log('[BatterySaverManager] Enabling battery saver mode');
    
    this.isActive = true;
    this.persistState();
    
    // 1. Switch to low quality preset
    const adaptiveQuality = getAdaptiveQuality();
    adaptiveQuality.setPreset('low');
    
    if (this.callbacks.onQualityChange) {
      this.callbacks.onQualityChange('low');
    }
    
    // 2. Disable haptics
    const hapticManager = getHapticManager();
    hapticManager.setEnabled(false);
    
    if (this.callbacks.onHapticsChange) {
      this.callbacks.onHapticsChange(false);
    }
    
    // 3. Reduce FPS target to 30
    if (this.callbacks.onFPSChange) {
      this.callbacks.onFPSChange(30);
    }
    
    console.log('[BatterySaverManager] Battery saver mode enabled:', {
      quality: 'low',
      haptics: false,
      targetFPS: 30
    });
  }
  
  /**
   * Disable battery saver mode
   * Requirements: 14.6
   */
  private disableBatterySaver(): void {
    console.log('[BatterySaverManager] Disabling battery saver mode');
    
    this.isActive = false;
    this.persistState();
    
    // Restore settings to defaults
    // Note: We don't automatically restore to high quality,
    // let AdaptiveQuality determine the appropriate preset
    const adaptiveQuality = getAdaptiveQuality();
    const deviceInfo = adaptiveQuality.getDeviceInfo();
    
    // Select preset based on device tier
    let preset: 'high' | 'medium' | 'low';
    switch (deviceInfo.tier) {
      case 'high':
        preset = 'high';
        break;
      case 'mid':
        preset = 'medium';
        break;
      case 'low':
        preset = 'low';
        break;
    }
    
    adaptiveQuality.setPreset(preset);
    
    if (this.callbacks.onQualityChange) {
      this.callbacks.onQualityChange(preset);
    }
    
    // Re-enable haptics
    const hapticManager = getHapticManager();
    hapticManager.setEnabled(true);
    
    if (this.callbacks.onHapticsChange) {
      this.callbacks.onHapticsChange(true);
    }
    
    // Restore FPS to 60
    if (this.callbacks.onFPSChange) {
      this.callbacks.onFPSChange(60);
    }
    
    console.log('[BatterySaverManager] Battery saver mode disabled:', {
      quality: preset,
      haptics: true,
      targetFPS: 60
    });
  }
  
  /**
   * Manually enable battery saver mode (for testing or user preference)
   */
  enableManual(): void {
    console.log('[BatterySaverManager] Manually enabling battery saver mode');
    this.enableBatterySaver();
  }
  
  /**
   * Manually disable battery saver mode (for testing or user preference)
   */
  disableManual(): void {
    console.log('[BatterySaverManager] Manually disabling battery saver mode');
    this.disableBatterySaver();
  }
  
  /**
   * Get current battery saver state
   */
  getState(): BatterySaverState {
    return {
      isActive: this.isActive,
      batteryLevel: this.batteryLevel,
      isCharging: this.isCharging,
      batteryAPISupported: this.batteryAPISupported
    };
  }
  
  /**
   * Check if battery saver is currently active
   */
  isEnabled(): boolean {
    return this.isActive;
  }
  
  /**
   * Get battery level as percentage (0-100)
   */
  getBatteryPercentage(): number | null {
    if (this.batteryLevel === null) return null;
    return Math.floor(this.batteryLevel * 100);
  }
  
  /**
   * Dispose and cleanup
   */
  dispose(): void {
    // Remove event listeners
    if (this.battery) {
      this.battery.removeEventListener('levelchange', this.handleBatteryChange);
      this.battery.removeEventListener('chargingchange', this.handleChargingChange);
      this.battery = null;
    }
    
    // Clear interval
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    console.log('[BatterySaverManager] Disposed');
  }
}

// Singleton instance
let batterySaverManagerInstance: BatterySaverManager | null = null;

/**
 * Get singleton BatterySaverManager instance
 */
export const getBatterySaverManager = (callbacks?: BatterySaverCallbacks): BatterySaverManager => {
  if (!batterySaverManagerInstance) {
    batterySaverManagerInstance = new BatterySaverManager(callbacks);
  }
  return batterySaverManagerInstance;
};

/**
 * Reset singleton instance (for testing)
 */
export const resetBatterySaverManager = (): void => {
  if (batterySaverManagerInstance) {
    batterySaverManagerInstance.dispose();
    batterySaverManagerInstance = null;
  }
};
