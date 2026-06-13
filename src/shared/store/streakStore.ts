import { create } from 'zustand';

// Types
interface StreakStore {
  // State
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null; // ISO 8601: YYYY-MM-DD
  todayPlayed: boolean;
  streakShields: number; // 0-2
  streakBroken: boolean; // UI notification flag
  
  // Actions
  initialize: () => void;
  recordGameCompleted: () => void;
  addStreakShield: () => void;
  clearStreakBroken: () => void;
  loadStreak: () => void;
}

// Constants
const STORAGE_KEY = 'flux_streak';

const DEFAULT_STATE = {
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
  todayPlayed: false,
  streakShields: 0,
  streakBroken: false,
};

// Date Utility Functions
function formatLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayISO(): string {
  try {
    return formatLocalISODate(new Date());
  } catch (error) {
    console.error('[StreakStore] Failed to get today\'s date:', error);
    return '1970-01-01';
  }
}

export function getYesterdayISO(): string {
  try {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return formatLocalISODate(now);
  } catch (error) {
    console.error('[StreakStore] Failed to get yesterday\'s date:', error);
    return '1970-01-01';
  }
}

export function isValidISODate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// localStorage Persistence
interface StreakStorageData {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  streakShields: number;
}

function loadFromLocalStorage(): StreakStorageData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    
    // Validate structure
    if (typeof parsed.currentStreak !== 'number' || parsed.currentStreak < 0) {
      console.warn('[StreakStore] Invalid currentStreak in localStorage, using defaults');
      return null;
    }
    
    if (typeof parsed.longestStreak !== 'number' || parsed.longestStreak < 0) {
      console.warn('[StreakStore] Invalid longestStreak in localStorage, using defaults');
      return null;
    }
    
    if (typeof parsed.streakShields !== 'number' || parsed.streakShields < 0) {
      console.warn('[StreakStore] Invalid streakShields in localStorage, clamping to 0');
      parsed.streakShields = 0;
    } else if (parsed.streakShields > 2) {
      console.warn('[StreakStore] streakShields > 2 in localStorage, clamping to 2');
      parsed.streakShields = 2;
    }
    
    // Validate date format
    if (parsed.lastPlayedDate !== null && !isValidISODate(parsed.lastPlayedDate)) {
      console.warn('[StreakStore] Invalid lastPlayedDate format, treating as null');
      parsed.lastPlayedDate = null;
    }
    
    // Validate invariant: longestStreak >= currentStreak
    if (parsed.longestStreak < parsed.currentStreak) {
      console.warn('[StreakStore] Invariant violation: longestStreak < currentStreak, using defaults');
      return null;
    }
    
    return {
      currentStreak: parsed.currentStreak,
      longestStreak: parsed.longestStreak,
      lastPlayedDate: parsed.lastPlayedDate,
      streakShields: parsed.streakShields,
    };
  } catch (error) {
    console.error('[StreakStore] Failed to load streak state:', error);
    return null;
  }
}

function saveToLocalStorage(state: StreakStorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastPlayedDate: state.lastPlayedDate,
      streakShields: state.streakShields,
    }));
  } catch (error) {
    console.error('[StreakStore] Failed to save streak state:', error);
  }
}

// Create Store
export const useStreakStore = create<StreakStore>((set, get) => ({
  ...DEFAULT_STATE,
  
  initialize: () => {
    const store = get();
    store.loadStreak();
  },
  
  loadStreak: () => {
    const saved = loadFromLocalStorage();
    
    if (saved) {
      const today = getTodayISO();
      const todayPlayed = saved.lastPlayedDate === today;
      
      set({
        currentStreak: saved.currentStreak,
        longestStreak: saved.longestStreak,
        lastPlayedDate: saved.lastPlayedDate,
        streakShields: saved.streakShields,
        todayPlayed: todayPlayed,
        streakBroken: false,
      });
    } else {
      // Use defaults
      set({
        ...DEFAULT_STATE,
      });
    }
  },
  
  recordGameCompleted: () => {
    try {
      const state = get();
      
      // Guard: already played today
      if (state.todayPlayed) return;
      
      const today = getTodayISO();
      const yesterday = getYesterdayISO();
      const lastPlayed = state.lastPlayedDate;
      
      let newStreak = 1;
      let newShields = state.streakShields;
      let broken = false;
      
      if (lastPlayed === yesterday) {
        // Consecutive day - increment streak
        newStreak = Math.min(999, state.currentStreak + 1);
      } else if (lastPlayed && lastPlayed !== today) {
        // Gap detected (2+ days)
        if (state.streakShields > 0) {
          // Use shield to protect streak
          newStreak = state.currentStreak;
          newShields = state.streakShields - 1;
        } else {
          // No shield - break streak
          newStreak = 1;
          broken = true;
        }
      } else if (!lastPlayed) {
        // First game ever
        newStreak = 1;
      }
      
      // Update longest streak if needed
      const newLongest = Math.max(state.longestStreak, newStreak);
      
      // Persist to localStorage
      saveToLocalStorage({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastPlayedDate: today,
        streakShields: newShields,
      });
      
      // Update state
      set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastPlayedDate: today,
        todayPlayed: true,
        streakShields: newShields,
        streakBroken: broken,
      });
    } catch (error) {
      console.error('[StreakStore] Failed to record game completion:', error);
      // Don't throw - preserve existing state
    }
  },
  
  addStreakShield: () => {
    const state = get();
    
    // Guard: max 2 shields
    if (state.streakShields >= 2) return;
    
    const newShields = state.streakShields + 1;
    
    // Persist to localStorage
    saveToLocalStorage({
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastPlayedDate: state.lastPlayedDate,
      streakShields: newShields,
    });
    
    // Update state
    set({
      streakShields: newShields,
    });
  },
  
  clearStreakBroken: () => {
    set({ streakBroken: false });
  },
}));
