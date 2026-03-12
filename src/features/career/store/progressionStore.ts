import { create } from 'zustand';
import { ProgressionState, LevelProgress } from '../types';
import { ActiveAbilityType, PassiveAbilityType } from '@features/abilities/types';
import { LevelObjective } from '@features/game/types';
import { ABILITY_UNLOCKS } from '@features/abilities/constants';
import { generateLevel } from '../utils/levelGenerator';

interface ProgressionStore extends ProgressionState {
  // Actions
  initializeProgression: () => void;
  completeLevel: (levelIndex: number, score: number, stars: number) => void;
  unlockNextLevel: () => void;
  updateObjectiveProgress: (levelIndex: number, objectives: LevelObjective[]) => void;
  checkUnlocks: () => Set<ActiveAbilityType | PassiveAbilityType>;
  addToTotalScore: (score: number) => void;
  getUnlockedAbilities: () => (ActiveAbilityType | PassiveAbilityType)[];
  isLevelUnlocked: (levelIndex: number) => boolean;
  getLevelProgress: (levelIndex: number) => LevelProgress | undefined;
}

export const useProgressionStore = create<ProgressionStore>((set, get) => ({
  currentLevel: 0,
  maxLevelReached: parseInt(localStorage.getItem('flux_max_level') || '0'),
  levelProgress: new Map<number, LevelProgress>(),
  unlockedAbilities: new Set<ActiveAbilityType | PassiveAbilityType>(),
  totalScore: parseInt(localStorage.getItem('flux_total_score') || '0'),

  initializeProgression: () => {
    const savedMaxLevel = parseInt(localStorage.getItem('flux_max_level') || '0');
    const savedTotalScore = parseInt(localStorage.getItem('flux_total_score') || '0');
    const savedProgress = localStorage.getItem('flux_level_progress');
    
    let progressMap = new Map<number, LevelProgress>();
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        progressMap = new Map(Object.entries(parsed).map(([k, v]) => [parseInt(k), v as LevelProgress]));
      } catch (e) {
        console.error('Failed to parse level progress', e);
      }
    }
    
    // Initialize progress for all levels up to the next available level
    const maxLevelToCheck = Math.max(1, savedMaxLevel + 1);
    for (let i = 1; i <= maxLevelToCheck; i++) {
      if (!progressMap.has(i)) {
        const levelDef = generateLevel(i);
        progressMap.set(i, {
          levelIndex: i,
          completed: false,
          stars: 0,
          bestScore: 0,
          objectives: levelDef.objectives.map(o => ({ ...o }))
        });
      }
    }
    
    set({
      maxLevelReached: savedMaxLevel,
      totalScore: savedTotalScore,
      levelProgress: progressMap
    });
    
    // Check for unlocks
    get().checkUnlocks();
  },

  completeLevel: (levelIndex: number, score: number, stars: number) => {
    const { levelProgress, maxLevelReached } = get();
    const progress = levelProgress.get(levelIndex);
    
    if (!progress) return;
    
    const updatedProgress = {
      ...progress,
      completed: true,
      stars: Math.max(progress.stars, stars),
      bestScore: Math.max(progress.bestScore, score)
    };
    
    const newProgressMap = new Map(levelProgress);
    newProgressMap.set(levelIndex, updatedProgress);
    
    const newMaxLevel = Math.max(maxLevelReached, levelIndex + 1);
    
    set({
      levelProgress: newProgressMap,
      maxLevelReached: newMaxLevel
    });
    
    // Save to localStorage
    localStorage.setItem('flux_max_level', newMaxLevel.toString());
    const progressObj = Object.fromEntries(newProgressMap);
    localStorage.setItem('flux_level_progress', JSON.stringify(progressObj));
    
    // Check for new unlocks
    get().checkUnlocks();
  },

  unlockNextLevel: () => {
    const { currentLevel } = get();
    set({ currentLevel: currentLevel + 1 });
  },

  updateObjectiveProgress: (levelIndex: number, objectives: LevelObjective[]) => {
    const { levelProgress } = get();
    const progress = levelProgress.get(levelIndex);
    
    if (!progress) return;
    
    const updatedProgress = {
      ...progress,
      objectives: objectives.map(o => ({ ...o }))
    };
    
    const newProgressMap = new Map(levelProgress);
    newProgressMap.set(levelIndex, updatedProgress);
    
    set({ levelProgress: newProgressMap });
  },

  checkUnlocks: () => {
    const { maxLevelReached, unlockedAbilities, totalScore, levelProgress } = get();
    const newUnlocks = new Set<ActiveAbilityType | PassiveAbilityType>();
    
    ABILITY_UNLOCKS.forEach(unlock => {
      if (unlockedAbilities.has(unlock.abilityType)) return;
      
      let shouldUnlock = false;
      
      switch (unlock.condition.type) {
        case 'LEVEL':
          shouldUnlock = maxLevelReached >= unlock.condition.value;
          break;
        case 'SCORE':
          shouldUnlock = totalScore >= unlock.condition.value;
          break;
        case 'FLUX':
          // Flux-based unlocks would need flux store integration
          shouldUnlock = false;
          break;
        case 'ACHIEVEMENT':
          // Achievement-based unlocks would need achievement store integration
          shouldUnlock = false;
          break;
      }
      
      if (shouldUnlock) {
        newUnlocks.add(unlock.abilityType);
      }
    });
    
    if (newUnlocks.size > 0) {
      const updatedUnlocked = new Set([...unlockedAbilities, ...newUnlocks]);
      set({ unlockedAbilities: updatedUnlocked });
    }
    
    return newUnlocks;
  },

  addToTotalScore: (score: number) => {
    const newTotal = get().totalScore + score;
    set({ totalScore: newTotal });
    localStorage.setItem('flux_total_score', newTotal.toString());
    
    // Check for score-based unlocks
    get().checkUnlocks();
  },

  getUnlockedAbilities: () => {
    return Array.from(get().unlockedAbilities);
  },

  isLevelUnlocked: (levelIndex: number) => {
    return levelIndex <= get().maxLevelReached;
  },

  getLevelProgress: (levelIndex: number) => {
    return get().levelProgress.get(levelIndex);
  }
}));
