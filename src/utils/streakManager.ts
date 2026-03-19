/**
 * Daily Streak Manager for FluxGrid
 * Tracks consecutive days of Daily Challenge completion
 * 
 * NOTE: Streak data is now managed by Firebase.
 * This module reads from localStorage cache (updated by Firebase sync).
 */

export const STREAK_KEY = 'flux_daily_streak';
export const STREAK_DATE_KEY = 'flux_daily_streak_date';
export const DAILY_PLAYED_KEY = 'flux_daily_played';

/**
 * Get current streak count from Firebase cache
 * This is a read-only cache updated by Firebase sync
 */
export const getStreak = (): number => {
  try {
    // Read from Firebase cache in localStorage
    const cached = localStorage.getItem(STREAK_KEY);
    return parseInt(cached || '0') || 0;
  } catch {
    return 0;
  }
};

/**
 * Check and update streak based on last play date
 * Call this when Daily Challenge is completed
 * 
 * NOTE: This now only updates local tracking.
 * Actual streak is calculated and stored in Firebase.
 */
export const checkAndUpdateStreak = (): number => {
  try {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(STREAK_DATE_KEY);
    
    // Update local date tracking
    localStorage.setItem(STREAK_DATE_KEY, today);
    localStorage.setItem(DAILY_PLAYED_KEY, today);

    // Return current streak from Firebase cache
    // The actual streak calculation happens in Firebase
    return getStreak();
  } catch {
    return 0;
  }
};

/**
 * Check if Daily Challenge was played today
 */
export const getDailyPlayedToday = (): boolean => {
  try {
    return localStorage.getItem(DAILY_PLAYED_KEY) === new Date().toDateString();
  } catch {
    return false;
  }
};

/**
 * Get current day number since epoch (2025-01-01)
 */
export const getDayNumber = (): number => {
  return Math.floor((Date.now() - new Date('2025-01-01').getTime()) / 86400000);
};
