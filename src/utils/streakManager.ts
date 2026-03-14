/**
 * Daily Streak Manager for FluxGrid
 * Tracks consecutive days of Daily Challenge completion
 */

export const STREAK_KEY = 'flux_daily_streak';
export const STREAK_DATE_KEY = 'flux_daily_streak_date';
export const DAILY_PLAYED_KEY = 'flux_daily_played';

/**
 * Get current streak count
 */
export const getStreak = (): number => {
  try {
    return parseInt(localStorage.getItem(STREAK_KEY) || '0') || 0;
  } catch {
    return 0;
  }
};

/**
 * Check and update streak based on last play date
 * Call this when Daily Challenge is completed
 */
export const checkAndUpdateStreak = (): number => {
  try {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(STREAK_DATE_KEY);
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let currentStreak = getStreak();

    if (lastDate === today) {
      // Already played today, streak unchanged
      return currentStreak;
    }

    if (lastDate === yesterday) {
      // Continuing from yesterday
      currentStreak += 1;
    } else if (lastDate !== today) {
      // Missed 1+ days, reset to 1
      currentStreak = 1;
    }

    localStorage.setItem(STREAK_KEY, currentStreak.toString());
    localStorage.setItem(STREAK_DATE_KEY, today);
    localStorage.setItem(DAILY_PLAYED_KEY, today);

    return currentStreak;
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
