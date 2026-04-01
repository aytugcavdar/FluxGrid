import { create } from 'zustand';

// Types
export type RewardType = 'flux' | 'reroll' | 'shatter' | 'bomb';

export interface RewardDefinition {
  day: number;
  type: RewardType;
  amount: number;
  icon: string;
  label: string;
}

interface DailyRewardStore {
  // State
  currentStreak: number;
  lastClaimDate: string | null;
  weeklyRewards: RewardDefinition[];
  streakBroken: boolean;
  
  // Derived State
  canClaimToday: boolean;
  currentReward: RewardDefinition;
  
  // Actions
  initializeRewards: () => void;
  claimDailyReward: () => void;
  getWeeklyPlan: () => RewardDefinition[];
  clearStreakBrokenFlag: () => void;
}

// Constants
const STORAGE_KEY = 'flux_daily_reward';

export const WEEKLY_REWARDS: RewardDefinition[] = [
  { day: 1, type: 'flux', amount: 30, icon: '⚡', label: '30 Flux' },
  { day: 2, type: 'reroll', amount: 1, icon: '🔄', label: '1 Reroll' },
  { day: 3, type: 'flux', amount: 50, icon: '⚡', label: '50 Flux' },
  { day: 4, type: 'shatter', amount: 1, icon: '💎', label: '1 Shatter' },
  { day: 5, type: 'flux', amount: 75, icon: '⚡', label: '75 Flux' },
  { day: 6, type: 'bomb', amount: 1, icon: '💣', label: '1 Bomb' },
  { day: 7, type: 'flux', amount: 150, icon: '⚡', label: '150 Flux' },
];

const DEFAULT_STATE = {
  currentStreak: 0,
  lastClaimDate: null,
  weeklyRewards: WEEKLY_REWARDS,
  streakBroken: false,
};

// Date Utility Functions
export function getTodayUTC(): string {
  try {
    const now = new Date();
    return now.toISOString().split('T')[0];
  } catch (error) {
    console.error('Failed to get today\'s date:', error);
    return '1970-01-01';
  }
}

export function getYesterdayUTC(): string {
  try {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - 1);
    return now.toISOString().split('T')[0];
  } catch (error) {
    console.error('Failed to get yesterday\'s date:', error);
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
function loadFromLocalStorage(): { currentStreak: number; lastClaimDate: string | null } | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    
    // Validate structure
    if (typeof parsed.currentStreak !== 'number' || parsed.currentStreak < 0) {
      console.warn('Invalid currentStreak in localStorage, using defaults');
      return null;
    }
    
    if (parsed.lastClaimDate !== null && !isValidISODate(parsed.lastClaimDate)) {
      console.warn('Invalid lastClaimDate format, using defaults');
      return null;
    }
    
    return {
      currentStreak: parsed.currentStreak,
      lastClaimDate: parsed.lastClaimDate,
    };
  } catch (error) {
    console.error('Failed to load daily reward state:', error);
    return null;
  }
}

function saveToLocalStorage(state: { currentStreak: number; lastClaimDate: string | null }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentStreak: state.currentStreak,
      lastClaimDate: state.lastClaimDate,
    }));
  } catch (error) {
    console.error('Failed to save daily reward state:', error);
  }
}

// Compute derived state
function computeCanClaimToday(lastClaimDate: string | null): boolean {
  if (!lastClaimDate) return true;
  const today = getTodayUTC();
  return lastClaimDate !== today;
}

function computeCurrentReward(currentStreak: number): RewardDefinition {
  if (currentStreak === 0) {
    return WEEKLY_REWARDS[0]; // Default to day 1
  }
  const rewardIndex = (currentStreak - 1) % 7;
  return WEEKLY_REWARDS[rewardIndex];
}

// Apply reward to game store
function applyReward(reward: RewardDefinition): void {
  try {
    // Import gameStore dynamically to avoid circular dependency
    import('../../features/game/store/gameStore').then(({ useGameStore }) => {
      const gameStore = useGameStore.getState();
      
      if (!gameStore) {
        console.error('Game store not available');
        return;
      }
      
      if (reward.type === 'flux') {
        const newFlux = Math.min(100, gameStore.flux + reward.amount);
        gameStore.setState({ flux: newFlux });
      } else if (reward.type === 'reroll') {
        gameStore.setState({ bonusRerolls: gameStore.bonusRerolls + reward.amount });
      } else if (reward.type === 'shatter') {
        gameStore.setState({ bonusShatter: gameStore.bonusShatter + reward.amount });
      } else if (reward.type === 'bomb') {
        gameStore.setState({ bonusBomb: gameStore.bonusBomb + reward.amount });
      }
    }).catch((error) => {
      console.error('Failed to import game store:', error);
    });
  } catch (error) {
    console.error('Failed to apply reward:', error);
  }
}

// Create Store
export const useDailyRewardStore = create<DailyRewardStore>((set, get) => ({
  ...DEFAULT_STATE,
  canClaimToday: true,
  currentReward: WEEKLY_REWARDS[0],
  
  initializeRewards: () => {
    const saved = loadFromLocalStorage();
    
    if (saved) {
      const canClaim = computeCanClaimToday(saved.lastClaimDate);
      const reward = computeCurrentReward(saved.currentStreak);
      
      set({
        currentStreak: saved.currentStreak,
        lastClaimDate: saved.lastClaimDate,
        canClaimToday: canClaim,
        currentReward: reward,
      });
    } else {
      // Use defaults
      set({
        ...DEFAULT_STATE,
        canClaimToday: true,
        currentReward: WEEKLY_REWARDS[0],
      });
    }
  },
  
  claimDailyReward: () => {
    const state = get();
    
    // Guard: can't claim if already claimed today
    if (!state.canClaimToday) return;
    
    const today = getTodayUTC();
    const yesterday = getYesterdayUTC();
    const lastClaim = state.lastClaimDate;
    
    // Calculate new streak
    let newStreak = 1;
    let broken = false;
    
    if (lastClaim === yesterday) {
      // Consecutive day
      newStreak = Math.min(999, state.currentStreak + 1);
    } else if (lastClaim && lastClaim !== today) {
      // Gap detected (2+ days)
      newStreak = 1;
      broken = true;
    } else if (!lastClaim) {
      // First claim ever
      newStreak = 1;
    }
    
    // Get reward for new streak
    const reward = computeCurrentReward(newStreak);
    
    // Apply reward to game store
    applyReward(reward);
    
    // Update state
    const newState = {
      currentStreak: newStreak,
      lastClaimDate: today,
      canClaimToday: false,
      streakBroken: broken,
      currentReward: reward,
    };
    
    set(newState);
    
    // Persist
    saveToLocalStorage({
      currentStreak: newState.currentStreak,
      lastClaimDate: newState.lastClaimDate,
    });
  },
  
  getWeeklyPlan: () => {
    return WEEKLY_REWARDS;
  },
  
  clearStreakBrokenFlag: () => {
    set({ streakBroken: false });
  },
}));
