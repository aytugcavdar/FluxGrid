/**
 * Home Screen Helper Functions
 * Utilities for determining user state and managing mode tracking for the home screen redesign
 */

import { GameMode, GameStats } from '@shared/types';

// Mode tracking interface for localStorage
export interface ModeStats {
  mode: GameMode;
  lastPlayed: number; // timestamp
  highScore: number;
  timesPlayed: number;
}

// Primary action button configuration
export interface PrimaryActionConfig {
  label: string;
  mode: GameMode;
  score?: number;
  showTutorialLink: boolean;
}

// LocalStorage key for mode tracking
const MODE_STATS_KEY = 'flux_mode_stats';

/**
 * Determine if user is new (never played before)
 */
export function isNewUser(stats: GameStats): boolean {
  return stats.gamesPlayed === 0;
}

/**
 * Determine if user should see stats block
 */
export function shouldShowStats(stats: GameStats): boolean {
  return stats.gamesPlayed > 2;
}

/**
 * Get all mode stats from localStorage
 */
export function getAllModeStats(): Record<string, ModeStats> {
  try {
    const stored = localStorage.getItem(MODE_STATS_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load mode stats', e);
    return {};
  }
}

/**
 * Save mode stats to localStorage
 */
export function saveModeStats(modeStats: Record<string, ModeStats>): void {
  try {
    localStorage.setItem(MODE_STATS_KEY, JSON.stringify(modeStats));
  } catch (e) {
    console.error('Failed to save mode stats', e);
  }
}

/**
 * Update stats for a specific mode
 */
export function updateModeStats(mode: GameMode, score: number): void {
  const allStats = getAllModeStats();
  const currentStats = allStats[mode] || {
    mode,
    lastPlayed: 0,
    highScore: 0,
    timesPlayed: 0,
  };

  currentStats.lastPlayed = Date.now();
  currentStats.timesPlayed += 1;
  currentStats.highScore = Math.max(currentStats.highScore, score);

  allStats[mode] = currentStats;
  saveModeStats(allStats);
}

/**
 * Get the last played mode
 */
export function getLastPlayedMode(): GameMode | null {
  const allStats = getAllModeStats();
  const modes = Object.values(allStats);
  
  if (modes.length === 0) return null;
  
  // Sort by lastPlayed timestamp (most recent first)
  modes.sort((a, b) => b.lastPlayed - a.lastPlayed);
  
  return modes[0].mode;
}

/**
 * Get the mode with the highest score
 */
export function getHighestScoringMode(): GameMode | null {
  const allStats = getAllModeStats();
  const modes = Object.values(allStats);
  
  if (modes.length === 0) return null;
  
  // Sort by highScore (highest first)
  modes.sort((a, b) => b.highScore - a.highScore);
  
  return modes[0].mode;
}

/**
 * Get high score for a specific mode
 */
export function getModeHighScore(mode: GameMode, highScores: { [key: string]: number }): number {
  return highScores[mode] || 0;
}

/**
 * Get the primary action button configuration based on user state
 */
export function getPrimaryAction(
  stats: GameStats,
  highScores: { [key: string]: number }
): PrimaryActionConfig {
  // New user: show simple "OYNA" button for ENDLESS mode
  if (isNewUser(stats)) {
    return {
      label: 'OYNA',
      mode: GameMode.ENDLESS,
      showTutorialLink: true,
    };
  }

  // Returning user: determine best mode to show
  const lastMode = getLastPlayedMode();
  const highestMode = getHighestScoringMode();
  
  // Prefer last played mode, fall back to highest scoring, then ENDLESS
  const selectedMode = lastMode || highestMode || GameMode.ENDLESS;
  const modeScore = getModeHighScore(selectedMode, highScores);

  return {
    label: modeScore > 0 ? 'TEKRAR OYNA' : 'DEVAM ET',
    mode: selectedMode,
    score: modeScore,
    showTutorialLink: false,
  };
}

/**
 * Get user-friendly mode name for display
 */
export function getModeName(mode: GameMode): string {
  const modeNames: Record<GameMode, string> = {
    [GameMode.ENDLESS]: 'Sonsuz',
    [GameMode.TIMED]: 'Zamanlı',
    [GameMode.BLITZ]: 'Blitz',
    [GameMode.ZEN]: 'Zen',
    [GameMode.DAILY_CHALLENGE]: 'Günlük',
    [GameMode.CAREER]: 'Kariyer',
    [GameMode.PUZZLE]: 'Bulmaca',
    [GameMode.SURVIVAL]: 'Hayatta Kalma',
  };
  
  return modeNames[mode] || mode;
}
