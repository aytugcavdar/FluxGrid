/**
 * Haptic Feedback Service
 * Provides tactile feedback for user interactions
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Check if haptics are available on this device
 */
const isHapticsAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Haptic feedback patterns for different game events
 */
export const hapticFeedback = {
  /**
   * Light tap - for button presses, piece selection
   */
  light: async (): Promise<void> => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.warn('[Haptics] Light impact failed:', error);
    }
  },

  /**
   * Medium tap - for piece placement, menu navigation
   */
  medium: async (): Promise<void> => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.warn('[Haptics] Medium impact failed:', error);
    }
  },

  /**
   * Heavy tap - for important actions, game start
   */
  heavy: async (): Promise<void> => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn('[Haptics] Heavy impact failed:', error);
    }
  },

  /**
   * Success pattern - for completing rows, achievements
   */
  success: async (): Promise<void> => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.warn('[Haptics] Success notification failed:', error);
    }
  },

  /**
   * Warning pattern - for invalid moves, low time
   */
  warning: async (): Promise<void> => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.warn('[Haptics] Warning notification failed:', error);
    }
  },

  /**
   * Error pattern - for game over, failed actions
   */
  error: async (): Promise<void> => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.warn('[Haptics] Error notification failed:', error);
    }
  },

  /**
   * Custom vibration pattern
   * @param duration - Duration in milliseconds
   */
  vibrate: async (duration: number = 100): Promise<void> => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.warn('[Haptics] Vibrate failed:', error);
    }
  },

  /**
   * Selection changed - for scrolling through options
   */
  selectionChanged: async (): Promise<void> => {
    if (!isHapticsAvailable()) return;
    try {
      await Haptics.selectionStart();
      setTimeout(async () => {
        await Haptics.selectionEnd();
      }, 50);
    } catch (error) {
      console.warn('[Haptics] Selection changed failed:', error);
    }
  },
};

/**
 * Game-specific haptic patterns
 */
export const gameHaptics = {
  /**
   * Piece picked up
   */
  piecePicked: () => hapticFeedback.light(),

  /**
   * Piece placed successfully
   */
  piecePlaced: () => hapticFeedback.medium(),

  /**
   * Invalid placement attempt
   */
  invalidPlacement: () => hapticFeedback.warning(),

  /**
   * Row/column completed
   */
  lineCompleted: () => hapticFeedback.success(),

  /**
   * Multiple lines completed (combo)
   */
  comboCompleted: async () => {
    await hapticFeedback.success();
    setTimeout(() => hapticFeedback.success(), 100);
  },

  /**
   * Game over
   */
  gameOver: () => hapticFeedback.error(),

  /**
   * New high score
   */
  newHighScore: async () => {
    await hapticFeedback.success();
    setTimeout(() => hapticFeedback.success(), 150);
    setTimeout(() => hapticFeedback.success(), 300);
  },

  /**
   * Button press
   */
  buttonPress: () => hapticFeedback.light(),

  /**
   * Menu navigation
   */
  menuNavigate: () => hapticFeedback.light(),

  /**
   * Game start
   */
  gameStart: () => hapticFeedback.heavy(),

  /**
   * Achievement unlocked
   */
  achievementUnlocked: async () => {
    await hapticFeedback.success();
    setTimeout(() => hapticFeedback.medium(), 100);
  },

  /**
   * Time warning (10 seconds left in timed mode)
   */
  timeWarning: () => hapticFeedback.warning(),

  /**
   * Power-up activated
   */
  powerUpActivated: () => hapticFeedback.heavy(),
};

/**
 * Haptic settings manager
 */
class HapticSettings {
  private enabled: boolean = true;
  private readonly STORAGE_KEY = 'haptics_enabled';

  constructor() {
    this.loadSettings();
  }

  /**
   * Load haptic settings from storage
   */
  private loadSettings(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored !== null) {
      this.enabled = stored === 'true';
    }
  }

  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.enabled && isHapticsAvailable();
  }

  /**
   * Enable haptics
   */
  enable(): void {
    this.enabled = true;
    localStorage.setItem(this.STORAGE_KEY, 'true');
  }

  /**
   * Disable haptics
   */
  disable(): void {
    this.enabled = false;
    localStorage.setItem(this.STORAGE_KEY, 'false');
  }

  /**
   * Toggle haptics
   */
  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem(this.STORAGE_KEY, this.enabled.toString());
    return this.enabled;
  }
}

export const hapticSettings = new HapticSettings();

/**
 * Wrapper functions that check settings before triggering haptics
 */
export const haptic = {
  light: () => hapticSettings.isEnabled() && hapticFeedback.light(),
  medium: () => hapticSettings.isEnabled() && hapticFeedback.medium(),
  heavy: () => hapticSettings.isEnabled() && hapticFeedback.heavy(),
  success: () => hapticSettings.isEnabled() && hapticFeedback.success(),
  warning: () => hapticSettings.isEnabled() && hapticFeedback.warning(),
  error: () => hapticSettings.isEnabled() && hapticFeedback.error(),
  vibrate: (duration?: number) => hapticSettings.isEnabled() && hapticFeedback.vibrate(duration),
};

/**
 * Game haptics with settings check
 */
export const gameHaptic = {
  piecePicked: () => hapticSettings.isEnabled() && gameHaptics.piecePicked(),
  piecePlaced: () => hapticSettings.isEnabled() && gameHaptics.piecePlaced(),
  invalidPlacement: () => hapticSettings.isEnabled() && gameHaptics.invalidPlacement(),
  lineCompleted: () => hapticSettings.isEnabled() && gameHaptics.lineCompleted(),
  comboCompleted: () => hapticSettings.isEnabled() && gameHaptics.comboCompleted(),
  gameOver: () => hapticSettings.isEnabled() && gameHaptics.gameOver(),
  newHighScore: () => hapticSettings.isEnabled() && gameHaptics.newHighScore(),
  buttonPress: () => hapticSettings.isEnabled() && gameHaptics.buttonPress(),
  menuNavigate: () => hapticSettings.isEnabled() && gameHaptics.menuNavigate(),
  gameStart: () => hapticSettings.isEnabled() && gameHaptics.gameStart(),
  achievementUnlocked: () => hapticSettings.isEnabled() && gameHaptics.achievementUnlocked(),
  timeWarning: () => hapticSettings.isEnabled() && gameHaptics.timeWarning(),
  powerUpActivated: () => hapticSettings.isEnabled() && gameHaptics.powerUpActivated(),
};
