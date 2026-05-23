import { create } from 'zustand';
import { PlayerProfile, PlayerStats, ProgressionState } from '../types';
import { Achievement } from '@features/game/types';

interface ProfileStore {
  profile: PlayerProfile | null;
  
  // Actions
  initializeProfile: (username?: string) => void;
  updateStats: (updates: Partial<PlayerStats>) => void;
  incrementStat: (stat: keyof PlayerStats, amount: number) => void;
  incrementSkillUse: (skill: string) => void;
  updatePlaytime: (sessionDuration: number) => void;
  saveProfile: () => void;
  exportProfile: () => string;
  importProfile: (data: string) => boolean;
  calculateDerivedStats: () => {
    averageScore: number;
    averageCombo: string;
    playtimeHours: number;
    playtimeMinutes: number;
    achievementCompletion: string;
  };
}

const INITIAL_STATS: PlayerStats = {
  gamesPlayed: 0,
  blocksPlaced: 0,
  linesCleared: 0,
  totalScore: 0,
  bombsExploded: 0,
  iceBroken: 0,
  highestCombo: 0,
  longestSession: 0,
  totalPlaytime: 0,
  skillUses: {}
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,

  initializeProfile: (username = 'Player') => {
    const savedProfile = localStorage.getItem('flux_player_profile');
    
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        // skillUses is already a plain object from JSON
        // Convert achievements array back to Map
        if (parsed.achievements && Array.isArray(parsed.achievements)) {
          parsed.achievements = new Map(parsed.achievements);
        }
        // Convert unlockedAbilities array back to Set
        if (parsed.unlockedAbilities && Array.isArray(parsed.unlockedAbilities)) {
          parsed.unlockedAbilities = new Set(parsed.unlockedAbilities);
        }
        set({ profile: parsed });
        return;
      } catch (e) {
        console.error('Failed to parse profile', e);
      }
    }
    
    // Create new profile
    const newProfile: PlayerProfile = {
      username,
      createdAt: Date.now(),
      lastPlayed: Date.now(),
      stats: { ...INITIAL_STATS },
      progression: {
        level: 0,
        experience: 0
      },
      unlockedAbilities: new Set(),
      equippedPassives: [],
      achievements: new Map()
    };
    
    set({ profile: newProfile });
    get().saveProfile();
  },

  updateStats: (updates: Partial<PlayerStats>) => {
    const { profile } = get();
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        ...updates
      },
      lastPlayed: Date.now()
    };
    
    set({ profile: updatedProfile });
    get().saveProfile();
  },

  incrementStat: (stat: keyof PlayerStats, amount: number) => {
    const { profile } = get();
    if (!profile) return;
    
    const currentValue = profile.stats[stat];
    if (typeof currentValue === 'number') {
      const updatedProfile = {
        ...profile,
        stats: {
          ...profile.stats,
          [stat]: currentValue + amount
        },
        lastPlayed: Date.now()
      };
      
      set({ profile: updatedProfile });
      get().saveProfile();
    }
  },

  incrementSkillUse: (skill: string) => {
    const { profile } = get();
    if (!profile) return;
    
    const skillUses = { ...profile.stats.skillUses };
    const current = skillUses[skill] || 0;
    skillUses[skill] = current + 1;
    
    const updatedProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        skillUses
      },
      lastPlayed: Date.now()
    };
    
    set({ profile: updatedProfile });
    get().saveProfile();
  },

  updatePlaytime: (sessionDuration: number) => {
    const { profile } = get();
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        totalPlaytime: profile.stats.totalPlaytime + sessionDuration,
        longestSession: Math.max(profile.stats.longestSession, sessionDuration)
      },
      lastPlayed: Date.now()
    };
    
    set({ profile: updatedProfile });
    get().saveProfile();
  },

  calculateDerivedStats: () => {
    const { profile } = get();
    if (!profile || !profile.stats) {
      return {
        averageScore: 0,
        averageCombo: '0.00',
        playtimeHours: 0,
        playtimeMinutes: 0,
        achievementCompletion: '0.0',
        currentStreak: 0,
        longestStreak: 0,
      };
    }
    
    const averageScore = profile.stats.gamesPlayed > 0
      ? Math.floor(profile.stats.totalScore / profile.stats.gamesPlayed)
      : 0;
    
    const averageCombo = profile.stats.linesCleared > 0
      ? (profile.stats.highestCombo / profile.stats.linesCleared).toFixed(2)
      : '0.00';
    
    const playtimeHours = Math.floor((profile.stats.totalPlaytime || 0) / 3600000);
    const playtimeMinutes = Math.floor(((profile.stats.totalPlaytime || 0) % 3600000) / 60000);
    
    const unlockedCount = Array.from(profile.achievements.values()).filter(a => a.unlocked).length;
    const totalCount = profile.achievements.size;
    const achievementCompletion = totalCount > 0
      ? ((unlockedCount / totalCount) * 100).toFixed(1)
      : '0.0';
    
    return {
      averageScore,
      averageCombo,
      playtimeHours,
      playtimeMinutes,
      achievementCompletion,
      currentStreak: 0, // TODO: Get from Firebase
      longestStreak: 0, // TODO: Get from Firebase
    };
  },

  exportProfile: () => {
    const { profile } = get();
    if (!profile) return '{}';
    
    const exportData = {
      version: '1.0',
      exportedAt: Date.now(),
      profile: {
        username: profile.username,
        stats: {
          ...profile.stats,
          skillUses: profile.stats.skillUses // Already a plain object
        },
        progression: {
          level: profile.progression.level,
          experience: profile.progression.experience
        },
        achievements: Array.from(profile.achievements.values())
          .filter(a => a.unlocked)
          .map(a => a.id)
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  },

  importProfile: (data: string) => {
    try {
      const parsed = JSON.parse(data);
      // Validation and import logic would go here
      return true;
    } catch (e) {
      console.error('Failed to import profile', e);
      return false;
    }
  },

  saveProfile: () => {
    const { profile } = get();
    if (!profile) return;
    
    const serialized = {
      ...profile,
      stats: {
        ...profile.stats,
        skillUses: profile.stats.skillUses // Already a plain object
      },
      achievements: Array.from(profile.achievements.entries()),
      unlockedAbilities: Array.from(profile.unlockedAbilities)
    };
    
    localStorage.setItem('flux_player_profile', JSON.stringify(serialized));
  }
}));
