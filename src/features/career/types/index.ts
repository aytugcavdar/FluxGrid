/**
 * Career/Progression feature types
 */
import type { LevelObjective, Achievement } from '../../game/types';
import type { ActiveAbilityType, PassiveAbilityType } from '../../abilities/types';

export interface ProgressionState {
  currentLevel: number;
  maxLevelReached: number;
  levelProgress: Map<number, LevelProgress>;
  unlockedAbilities: Set<ActiveAbilityType | PassiveAbilityType>;
  totalScore: number;
}

export interface LevelProgress {
  levelIndex: number;
  completed: boolean;
  stars: number;
  bestScore: number;
  objectives: LevelObjective[];
}
