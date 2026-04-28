import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * HapticManager - Enhanced haptic feedback system
 * 
 * Requirements: 1.3, 3.5, 5.1-5.8
 * 
 * Features:
 * - Rich haptic patterns for all game events
 * - Throttling (max 10 per second)
 * - System settings respect
 * - Platform detection (native vs web)
 * - Vibration API fallback
 */

export type HapticPattern = 
  | 'placement'           // [40] - Piece placement
  | 'line_clear_single'   // [30] - Single line clear
  | 'line_clear_multi'    // [45, 30, 60] - Multiple lines
  | 'combo_light'         // [20] - 3x combo
  | 'combo_medium'        // [40] - 5x+ combo
  | 'combo_milestone'     // [50, 30, 50] - Milestone reached
  | 'surge_activation'    // [30, 10, 40, 10, 50] - Surge mode start
  | 'perfect_clear'       // [50, 30, 50, 30, 70] - Perfect clear
  | 'rotation'            // [15] - Piece rotation
  | 'beat_light'          // [20] - Light beat pulse
  | 'beat_medium'         // [40] - Medium beat pulse (line clear on beat)
  | 'beat_heavy'          // [60] - Heavy beat pulse (combo milestone on beat)
  | 'hover'               // [4] - UI hover (legacy)
  | 'skill'               // [80, 50, 80] - Skill activation (legacy)
  | 'success'             // [30, 20, 40] - Success feedback
  | 'game_over';          // [200, 100, 200, 100, 300] - Game over (legacy)

interface HapticPatternConfig {
  vibration: number | number[]; // Vibration pattern in ms
  impactStyle: ImpactStyle;     // Capacitor impact style
  intensity?: number;           // Optional intensity multiplier
}

const HAPTIC_PATTERNS: Record<HapticPattern, HapticPatternConfig> = {
  // New patterns for game juice
  placement: {
    vibration: [40],
    impactStyle: ImpactStyle.Medium
  },
  line_clear_single: {
    vibration: [30],
    impactStyle: ImpactStyle.Light
  },
  line_clear_multi: {
    vibration: [45, 30, 60],
    impactStyle: ImpactStyle.Medium
  },
  combo_light: {
    vibration: [20],
    impactStyle: ImpactStyle.Light
  },
  combo_medium: {
    vibration: [40],
    impactStyle: ImpactStyle.Medium
  },
  combo_milestone: {
    vibration: [50, 30, 50],
    impactStyle: ImpactStyle.Heavy
  },
  surge_activation: {
    vibration: [30, 10, 40, 10, 50],
    impactStyle: ImpactStyle.Heavy
  },
  perfect_clear: {
    vibration: [50, 30, 50, 30, 70],
    impactStyle: ImpactStyle.Heavy
  },
  rotation: {
    vibration: [15],
    impactStyle: ImpactStyle.Light
  },
  
  // Beat synchronization patterns
  beat_light: {
    vibration: [20],
    impactStyle: ImpactStyle.Light
  },
  beat_medium: {
    vibration: [40],
    impactStyle: ImpactStyle.Medium
  },
  beat_heavy: {
    vibration: [60],
    impactStyle: ImpactStyle.Heavy
  },
  
  // Legacy patterns (for backward compatibility)
  hover: {
    vibration: [4],
    impactStyle: ImpactStyle.Light
  },
  skill: {
    vibration: [80, 50, 80],
    impactStyle: ImpactStyle.Heavy
  },
  success: {
    vibration: [30, 20, 40],
    impactStyle: ImpactStyle.Medium
  },
  game_over: {
    vibration: [200, 100, 200, 100, 300],
    impactStyle: ImpactStyle.Heavy
  }
};

export class HapticManager {
  private isNative: boolean;
  private supportsVibrationAPI: boolean;
  private systemHapticsEnabled: boolean = true;
  private lastHapticTime: number = 0;
  private maxHapticsPerSecond: number = 10;
  private hapticCount: number = 0;
  private throttleResetInterval: number;
  private hapticHistory: Array<{ pattern: HapticPattern; timestamp: number; priority: 'gameplay' | 'beat' }> = [];
  private beatHapticsEnabled: boolean = true;
  
  constructor() {
    // Detect platform
    this.isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    this.supportsVibrationAPI = 'vibrate' in navigator;
    
    // Check system haptic settings
    this.checkSystemSettings();
    
    // Reset throttle counter every second
    this.throttleResetInterval = window.setInterval(() => {
      this.hapticCount = 0;
      // Clean up old haptic history (older than 1 second)
      const now = Date.now();
      this.hapticHistory = this.hapticHistory.filter(h => now - h.timestamp < 1000);
    }, 1000);
  }
  
  /**
   * Check system-level haptic settings
   * Requirements: 5.6
   */
  private checkSystemSettings(): void {
    // On web, we can't directly check system settings
    // On native, Capacitor will respect system settings automatically
    this.systemHapticsEnabled = true;
    
    // Check localStorage for user preference
    try {
      const userPref = localStorage.getItem('flux_haptics_enabled');
      if (userPref !== null) {
        this.systemHapticsEnabled = userPref === 'true';
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  
  /**
   * Play haptic pattern with priority support
   * Requirements: 1.3, 3.5, 5.1-5.8
   */
  async play(pattern: HapticPattern, intensity?: number, priority: 'gameplay' | 'beat' = 'gameplay'): Promise<void> {
    // Check if haptics are enabled
    if (!this.systemHapticsEnabled) {
      return;
    }
    
    // Check if beat haptics are disabled
    if (priority === 'beat' && !this.beatHapticsEnabled) {
      return;
    }
    
    const now = Date.now();
    
    // Throttle haptic events with priority (max 10 per second)
    // Requirements: 5.7
    if (this.hapticHistory.length >= this.maxHapticsPerSecond) {
      // Check if we can drop a beat haptic to make room for gameplay haptic
      if (priority === 'gameplay') {
        const beatHapticIndex = this.hapticHistory.findIndex(h => h.priority === 'beat');
        if (beatHapticIndex !== -1) {
          // Remove lowest priority haptic (beat)
          this.hapticHistory.splice(beatHapticIndex, 1);
        } else {
          // All haptics are gameplay, drop this one
          return;
        }
      } else {
        // Beat haptic, drop it
        return;
      }
    }
    
    const timeSinceLastHaptic = now - this.lastHapticTime;
    
    // Minimum 100ms between haptics
    if (timeSinceLastHaptic < 100) {
      return;
    }
    
    this.lastHapticTime = now;
    this.hapticCount++;
    
    // Add to history
    this.hapticHistory.push({
      pattern,
      timestamp: now,
      priority,
    });
    
    const config = HAPTIC_PATTERNS[pattern];
    if (!config) {
      console.warn(`[HapticManager] Unknown pattern: ${pattern}`);
      return;
    }
    
    try {
      if (this.isNative) {
        // Use Capacitor Haptics on native platform
        await this.playNativeHaptic(config, intensity);
      } else if (this.supportsVibrationAPI) {
        // Fallback to web vibration API
        // Requirements: 5.8
        this.playWebVibration(config, intensity);
      }
    } catch (error) {
      // Silently fail - haptics are non-critical
      console.debug('[HapticManager] Haptic failed:', error);
    }
  }
  
  /**
   * Play native haptic using Capacitor
   */
  private async playNativeHaptic(config: HapticPatternConfig, intensity?: number): Promise<void> {
    // For Android, use Medium instead of Heavy for better compatibility
    // Heavy impact requires API 29+ and may not work on all devices
    const isAndroid = /Android/i.test(navigator.userAgent);
    let style = config.impactStyle;
    
    if (isAndroid && style === ImpactStyle.Heavy) {
      style = ImpactStyle.Medium;
    }
    
    await Haptics.impact({ style });
  }
  
  /**
   * Play web vibration using Vibration API
   * Requirements: 5.8
   */
  private playWebVibration(config: HapticPatternConfig, intensity?: number): void {
    let pattern = config.vibration;
    
    // Apply intensity multiplier if provided
    if (intensity !== undefined) {
      if (Array.isArray(pattern)) {
        pattern = pattern.map(v => Math.floor(v * intensity));
      } else {
        pattern = Math.floor(pattern * intensity);
      }
    }
    
    navigator.vibrate(pattern);
  }
  
  /**
   * Play line clear haptic with intensity based on cleared lines
   * Requirements: 5.3
   */
  async playLineClear(clearedLines: number): Promise<void> {
    // Calculate intensity: (cleared_lines × 15ms) capped at 60ms
    const intensity = Math.min(60, clearedLines * 15);
    
    if (clearedLines === 1) {
      await this.play('line_clear_single');
    } else {
      await this.play('line_clear_multi');
    }
  }
  
  /**
   * Play combo haptic with intensity based on combo level
   * Requirements: 5.1, 5.2
   */
  async playCombo(comboLevel: number): Promise<void> {
    if (comboLevel >= 5) {
      // Medium pulse with intensity proportional to combo level
      const intensity = Math.min(2.0, 1.0 + (comboLevel - 5) * 0.1);
      await this.play('combo_medium', intensity);
    } else if (comboLevel >= 3) {
      // Light pulse
      await this.play('combo_light');
    }
  }
  
  /**
   * Play surge activation haptic
   * Requirements: 5.4
   */
  async playSurge(): Promise<void> {
    await this.play('surge_activation');
  }
  
  /**
   * Play perfect clear haptic
   * Requirements: 5.5
   */
  async playPerfectClear(): Promise<void> {
    await this.play('perfect_clear');
  }
  
  /**
   * Set maximum haptics per second (throttling)
   * Requirements: 5.7
   */
  setThrottle(maxPerSecond: number): void {
    this.maxHapticsPerSecond = maxPerSecond;
  }
  
  /**
   * Enable or disable haptics
   * Requirements: 5.6
   */
  setEnabled(enabled: boolean): void {
    this.systemHapticsEnabled = enabled;
    
    // Persist to localStorage
    try {
      localStorage.setItem('flux_haptics_enabled', String(enabled));
    } catch {
      // Ignore localStorage errors
    }
  }
  
  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.systemHapticsEnabled;
  }
  
  /**
   * Check if system respects haptic settings
   * Requirements: 5.6
   */
  respectSystemSettings(): boolean {
    return this.systemHapticsEnabled;
  }
  
  /**
   * Enable or disable beat haptics
   */
  setBeatHapticsEnabled(enabled: boolean): void {
    this.beatHapticsEnabled = enabled;
  }
  
  /**
   * Dispose and cleanup
   */
  dispose(): void {
    if (this.throttleResetInterval) {
      clearInterval(this.throttleResetInterval);
    }
  }
}

// Singleton instance
let hapticManagerInstance: HapticManager | null = null;

/**
 * Get singleton HapticManager instance
 */
export const getHapticManager = (): HapticManager => {
  if (!hapticManagerInstance) {
    hapticManagerInstance = new HapticManager();
  }
  return hapticManagerInstance;
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use HapticManager.play() instead
 */
export const playHaptic = async (pattern: HapticPattern): Promise<void> => {
  const manager = getHapticManager();
  await manager.play(pattern);
};
