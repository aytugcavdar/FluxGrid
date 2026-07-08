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
  | 'place'               // [40] - Legacy placement alias
  | 'line_clear_single'   // [30] - Single line clear
  | 'clear_single'        // [30] - Legacy single clear alias
  | 'line_clear_multi'    // [45, 30, 60] - Multiple lines
  | 'clear_multi'         // [45, 30, 60] - Legacy multi clear alias
  | 'ice_hit'             // First ICE damage
  | 'ice_break'           // ICE destroyed
  | 'gravity_land'        // Gravity movement settled
  | 'bomb_chain'          // One or more bombs detonated
  | 'combo_light'         // [20] - 3x combo
  | 'combo_medium'        // [40] - 5x+ combo
  | 'combo'               // [40] - Legacy combo alias
  | 'combo_milestone'     // [50, 30, 50] - Milestone reached
  | 'surge_activation'    // [30, 10, 40, 10, 50] - Surge mode start
  | 'surge'               // [30, 10, 40, 10, 50] - Legacy surge alias
  | 'perfect_clear'       // [50, 30, 50, 30, 70] - Perfect clear
  | 'rotation'            // [15] - Piece rotation
  | 'beat_light'          // [20] - Light beat pulse
  | 'beat_medium'         // [40] - Medium beat pulse (line clear on beat)
  | 'beat_heavy'          // [60] - Heavy beat pulse (combo milestone on beat)
  | 'hover'               // [4] - UI hover (legacy)
  | 'invalid'             // [12] - Invalid placement (legacy)
  | 'skill'               // [80, 50, 80] - Skill activation (legacy)
  | 'achievement'         // [20, 10, 20, 10, 80, 40, 120] - Achievement (legacy)
  | 'success'             // [30, 20, 40] - Success feedback
  | 'game_over';          // [200, 100, 200, 100, 300] - Game over (legacy)

interface HapticPatternConfig {
  vibration: number | number[]; // Vibration pattern in ms
  impactStyle: ImpactStyle;     // Capacitor impact style
  intensity?: number;           // Optional intensity multiplier
  cooldownMs: number;
  priority: HapticPriority;
  skipInReducedMotion?: boolean;
}

export type HapticPriority = 'ui' | 'beat' | 'gameplay' | 'high' | 'critical';
export type HapticIntensity = 'low' | 'normal' | 'strong';

const HAPTIC_STORAGE_KEYS = {
  canonical: 'flux_haptic_enabled',
  legacy: 'flux_haptics_enabled',
  intensity: 'flux_haptic_intensity',
  drag: 'flux_drag_haptics_enabled',
  beat: 'flux_beat_haptics_enabled',
} as const;

const PRIORITY_WEIGHT: Record<HapticPriority, number> = {
  ui: 1,
  beat: 1,
  gameplay: 2,
  high: 3,
  critical: 4,
};

const PRIORITY_MIN_GAP: Record<HapticPriority, number> = {
  ui: 80,
  beat: 120,
  gameplay: 90,
  high: 65,
  critical: 30,
};

const INTENSITY_MULTIPLIER: Record<HapticIntensity, number> = {
  low: 0.65,
  normal: 1,
  strong: 1.25,
};

const HAPTIC_PATTERNS: Record<HapticPattern, HapticPatternConfig> = {
  // New patterns for game juice
  placement: {
    vibration: [28],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 90,
    priority: 'gameplay'
  },
  place: {
    vibration: [28],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 90,
    priority: 'gameplay'
  },
  line_clear_single: {
    vibration: [44, 22, 56],
    impactStyle: ImpactStyle.Light,
    cooldownMs: 165,
    priority: 'gameplay'
  },
  clear_single: {
    vibration: [44, 22, 56],
    impactStyle: ImpactStyle.Light,
    cooldownMs: 165,
    priority: 'gameplay'
  },
  line_clear_multi: {
    vibration: [58, 26, 86],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 180,
    priority: 'high'
  },
  clear_multi: {
    vibration: [58, 26, 86],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 180,
    priority: 'high'
  },
  ice_hit: {
    vibration: [20],
    impactStyle: ImpactStyle.Light,
    cooldownMs: 160,
    priority: 'gameplay'
  },
  ice_break: {
    vibration: [28, 18, 42],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 190,
    priority: 'high'
  },
  gravity_land: {
    vibration: [30],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 160,
    priority: 'gameplay'
  },
  bomb_chain: {
    vibration: [38, 22, 62],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 240,
    priority: 'high'
  },
  combo_light: {
    vibration: [32, 18, 42],
    impactStyle: ImpactStyle.Light,
    cooldownMs: 220,
    priority: 'gameplay',
    skipInReducedMotion: true
  },
  combo_medium: {
    vibration: [45, 24, 62],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 250,
    priority: 'gameplay'
  },
  combo: {
    vibration: [45, 24, 62],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 250,
    priority: 'gameplay'
  },
  combo_milestone: {
    vibration: [76, 34, 108],
    impactStyle: ImpactStyle.Heavy,
    cooldownMs: 350,
    priority: 'high'
  },
  surge_activation: {
    vibration: [70, 25, 90, 25, 120],
    impactStyle: ImpactStyle.Heavy,
    cooldownMs: 500,
    priority: 'critical'
  },
  surge: {
    vibration: [70, 25, 90, 25, 120],
    impactStyle: ImpactStyle.Heavy,
    cooldownMs: 500,
    priority: 'critical'
  },
  perfect_clear: {
    vibration: [86, 36, 105, 46, 142],
    impactStyle: ImpactStyle.Heavy,
    cooldownMs: 700,
    priority: 'critical'
  },
  rotation: {
    vibration: [28],
    impactStyle: ImpactStyle.Light,
    cooldownMs: 120,
    priority: 'ui',
    skipInReducedMotion: true
  },
  
  // Beat synchronization patterns
  beat_light: {
    vibration: [30],
    impactStyle: ImpactStyle.Light,
    cooldownMs: 160,
    priority: 'beat',
    skipInReducedMotion: true
  },
  beat_medium: {
    vibration: [55],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 180,
    priority: 'beat',
    skipInReducedMotion: true
  },
  beat_heavy: {
    vibration: [75],
    impactStyle: ImpactStyle.Heavy,
    cooldownMs: 220,
    priority: 'beat',
    skipInReducedMotion: true
  },
  
  // Legacy patterns (for backward compatibility)
  hover: {
    vibration: [10],
    impactStyle: ImpactStyle.Light,
    cooldownMs: 70,
    priority: 'ui',
    skipInReducedMotion: true
  },
  invalid: {
    vibration: [18, 16, 30],
    impactStyle: ImpactStyle.Light,
    cooldownMs: 140,
    priority: 'high'
  },
  skill: {
    vibration: [90, 45, 110],
    impactStyle: ImpactStyle.Heavy,
    cooldownMs: 300,
    priority: 'high'
  },
  achievement: {
    vibration: [45, 25, 55, 35, 105, 45, 140],
    impactStyle: ImpactStyle.Heavy,
    cooldownMs: 700,
    priority: 'critical'
  },
  success: {
    vibration: [30, 20, 40],
    impactStyle: ImpactStyle.Medium,
    cooldownMs: 200,
    priority: 'gameplay'
  },
  game_over: {
    vibration: [200, 100, 200, 100, 300],
    impactStyle: ImpactStyle.Heavy,
    cooldownMs: 900,
    priority: 'critical'
  }
};

export class HapticManager {
  private isNative: boolean;
  private supportsVibrationAPI: boolean;
  private systemHapticsEnabled: boolean = true;
  private lastHapticTime: number = 0;
  private maxHapticsPerSecond: number = 10;
  private throttleResetInterval: number;
  private hapticHistory: Array<{ pattern: HapticPattern; timestamp: number; priority: HapticPriority }> = [];
  private lastPatternTimes: Map<HapticPattern, number> = new Map();
  private beatHapticsEnabled: boolean = true;
  private dragHapticsEnabled: boolean = true;
  private reducedMotionEnabled: boolean = false;
  private intensity: HapticIntensity = 'normal';
  
  constructor() {
    // Detect platform
    this.isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    this.supportsVibrationAPI = 'vibrate' in navigator;
    
    // Check system haptic settings
    this.checkSystemSettings();
    
    // Reset throttle counter every second
    this.throttleResetInterval = window.setInterval(() => {
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
      const userPref = localStorage.getItem(HAPTIC_STORAGE_KEYS.canonical)
        ?? localStorage.getItem(HAPTIC_STORAGE_KEYS.legacy);
      if (userPref !== null) {
        this.systemHapticsEnabled = JSON.parse(userPref) === true;
      }

      const intensity = localStorage.getItem(HAPTIC_STORAGE_KEYS.intensity) as HapticIntensity | null;
      if (intensity === 'low' || intensity === 'normal' || intensity === 'strong') {
        this.intensity = intensity;
      }

      const dragPref = localStorage.getItem(HAPTIC_STORAGE_KEYS.drag);
      if (dragPref !== null) {
        this.dragHapticsEnabled = JSON.parse(dragPref) === true;
      }

      const beatPref = localStorage.getItem(HAPTIC_STORAGE_KEYS.beat);
      if (beatPref !== null) {
        this.beatHapticsEnabled = JSON.parse(beatPref) === true;
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  
  /**
   * Play haptic pattern with priority support
   * Requirements: 1.3, 3.5, 5.1-5.8
   */
  async play(pattern: HapticPattern, intensity?: number, priority?: HapticPriority): Promise<void> {
    this.checkSystemSettings();

    const config = HAPTIC_PATTERNS[pattern];
    if (!config) {
      console.warn(`[HapticManager] Unknown pattern: ${pattern}`);
      return;
    }

    const effectivePriority = priority ?? config.priority;

    // Check if haptics are enabled
    if (!this.systemHapticsEnabled) {
      return;
    }
    
    // Check if beat haptics are disabled
    if (effectivePriority === 'beat' && !this.beatHapticsEnabled) {
      return;
    }

    if (pattern === 'hover' && !this.dragHapticsEnabled) {
      return;
    }

    if (this.reducedMotionEnabled && config.skipInReducedMotion) {
      return;
    }
    
    const now = Date.now();

    const lastPatternTime = this.lastPatternTimes.get(pattern) ?? 0;
    if (now - lastPatternTime < config.cooldownMs) {
      return;
    }
    
    // Throttle haptic events with priority (max 10 per second)
    // Requirements: 5.7
    if (this.hapticHistory.length >= this.maxHapticsPerSecond) {
      const lowestPriorityIndex = this.hapticHistory.reduce((lowestIndex, item, index, history) => (
        PRIORITY_WEIGHT[item.priority] < PRIORITY_WEIGHT[history[lowestIndex].priority]
          ? index
          : lowestIndex
      ), 0);

      const lowestPriority = this.hapticHistory[lowestPriorityIndex]?.priority;
      if (!lowestPriority || PRIORITY_WEIGHT[effectivePriority] <= PRIORITY_WEIGHT[lowestPriority]) {
        return;
      }

      this.hapticHistory.splice(lowestPriorityIndex, 1);
    }
    
    const minGap = PRIORITY_MIN_GAP[effectivePriority];
    if (now - this.lastHapticTime < minGap && effectivePriority !== 'critical') {
      return;
    }
    
    this.lastHapticTime = now;
    this.lastPatternTimes.set(pattern, now);
    
    // Add to history
    this.hapticHistory.push({
      pattern,
      timestamp: now,
      priority: effectivePriority,
    });

    const effectiveIntensity = (config.intensity ?? 1) * INTENSITY_MULTIPLIER[this.intensity] * (intensity ?? 1);
    
    try {
      if (this.isNative) {
        // Use Capacitor Haptics on native platform
        await this.playNativeHaptic(config, effectiveIntensity);
      } else if (this.supportsVibrationAPI) {
        // Fallback to web vibration API
        // Requirements: 5.8
        this.playWebVibration(config, effectiveIntensity);
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
    if (/Android/i.test(navigator.userAgent)) {
      await this.playAndroidVibration(config, intensity);
      return;
    }

    const style = this.resolveNativeStyle(config.impactStyle, intensity);
    const vibrationPattern = Array.isArray(config.vibration) ? config.vibration : [config.vibration];

    for (let i = 0; i < vibrationPattern.length; i += 2) {
      if (i > 0) {
        const pause = vibrationPattern[i - 1] ?? 35;
        await new Promise(resolve => setTimeout(resolve, pause));
      }

      await Haptics.impact({ style });
    }
  }

  private async playAndroidVibration(config: HapticPatternConfig, intensity: number = 1): Promise<void> {
    const pattern = Array.isArray(config.vibration) ? config.vibration : [config.vibration];

    for (let i = 0; i < pattern.length; i += 2) {
      if (i > 0) {
        const pause = Math.max(15, Math.floor((pattern[i - 1] ?? 35) * 0.85));
        await new Promise(resolve => setTimeout(resolve, pause));
      }

      const duration = Math.max(18, Math.min(180, Math.floor((pattern[i] ?? 30) * intensity)));
      await Haptics.vibrate({ duration });
    }
  }

  private resolveNativeStyle(style: ImpactStyle, intensity: number = 1): ImpactStyle {
    let resolved = style;

    if (intensity < 0.8 && style === ImpactStyle.Heavy) {
      resolved = ImpactStyle.Medium;
    } else if (intensity < 0.8 && style === ImpactStyle.Medium) {
      resolved = ImpactStyle.Light;
    } else if (intensity >= 1.2 && style === ImpactStyle.Light) {
      resolved = ImpactStyle.Medium;
    } else if (intensity >= 1.35 && style === ImpactStyle.Medium) {
      resolved = ImpactStyle.Heavy;
    }

    // Heavy impact is inconsistent on Android; Medium is more reliable.
    if (/Android/i.test(navigator.userAgent) && resolved === ImpactStyle.Heavy) {
      resolved = ImpactStyle.Medium;
    }

    return resolved;
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
    const intensity = Math.min(1.4, 1 + Math.max(0, clearedLines - 1) * 0.12);
    
    if (clearedLines === 1) {
      await this.play('line_clear_single', intensity);
    } else {
      await this.play('line_clear_multi', intensity);
    }
  }
  
  /**
   * Play combo haptic with intensity based on combo level
   * Requirements: 5.1, 5.2
   */
  async playCombo(comboLevel: number): Promise<void> {
    if (comboLevel >= 5) {
      await this.play('combo_milestone', Math.min(1.5, 1 + (comboLevel - 5) * 0.08), 'high');
    } else if (comboLevel >= 3) {
      const intensity = Math.min(1.25, 1.0 + (comboLevel - 3) * 0.1);
      await this.play('combo_medium', intensity);
    } else if (comboLevel >= 2) {
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
    await this.play('perfect_clear', 1.15, 'critical');
  }

  async onHover(): Promise<void> {
    await this.play('hover', 1, 'ui');
  }

  async onPlacement(): Promise<void> {
    await this.play('placement');
  }

  async onInvalidPlacement(): Promise<void> {
    await this.play('invalid', 1, 'high');
  }

  async onLineClear(clearedLines: number): Promise<void> {
    await this.playLineClear(clearedLines);
  }

  async onCombo(comboLevel: number): Promise<void> {
    await this.playCombo(comboLevel);
  }

  async onSurge(): Promise<void> {
    await this.playSurge();
  }

  async onAchievement(): Promise<void> {
    await this.play('achievement', 1.1, 'critical');
  }

  async onGameOver(): Promise<void> {
    await this.play('game_over', 1.1, 'critical');
  }

  async onSkill(): Promise<void> {
    await this.play('skill', 1, 'high');
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
      localStorage.setItem(HAPTIC_STORAGE_KEYS.canonical, JSON.stringify(enabled));
      localStorage.setItem(HAPTIC_STORAGE_KEYS.legacy, JSON.stringify(enabled));
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
    try {
      localStorage.setItem(HAPTIC_STORAGE_KEYS.beat, JSON.stringify(enabled));
    } catch {
      // Ignore localStorage errors
    }
  }

  setDragHapticsEnabled(enabled: boolean): void {
    this.dragHapticsEnabled = enabled;
    try {
      localStorage.setItem(HAPTIC_STORAGE_KEYS.drag, JSON.stringify(enabled));
    } catch {
      // Ignore localStorage errors
    }
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotionEnabled = enabled;
  }

  setIntensity(intensity: HapticIntensity): void {
    this.intensity = intensity;
    try {
      localStorage.setItem(HAPTIC_STORAGE_KEYS.intensity, intensity);
    } catch {
      // Ignore localStorage errors
    }
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

export const hapticEvents = {
  hover: () => getHapticManager().onHover(),
  placement: () => getHapticManager().onPlacement(),
  invalidPlacement: () => getHapticManager().onInvalidPlacement(),
  lineClear: (clearedLines: number) => getHapticManager().onLineClear(clearedLines),
  iceHit: () => getHapticManager().play('ice_hit'),
  iceBreak: () => getHapticManager().play('ice_break', 1, 'high'),
  gravityLand: (strength: number = 1) => getHapticManager().play('gravity_land', strength),
  bombChain: (bombCount: number) => getHapticManager().play(
    'bomb_chain',
    Math.min(1.35, 1 + (Math.max(1, bombCount) - 1) * 0.08),
    'high'
  ),
  combo: (comboLevel: number) => getHapticManager().onCombo(comboLevel),
  surge: () => getHapticManager().onSurge(),
  perfectClear: () => getHapticManager().playPerfectClear(),
  achievement: () => getHapticManager().onAchievement(),
  gameOver: () => getHapticManager().onGameOver(),
  skill: () => getHapticManager().onSkill(),
};
