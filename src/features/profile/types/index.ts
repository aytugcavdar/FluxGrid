/**
 * Profile feature types
 */
import type { ActiveAbilityType, PassiveAbilityType } from '../../abilities/types';
import type { Achievement } from '../../game/types';
import type { ProgressionState } from '../../career/types';

export interface PlayerProfile {
  username: string;
  createdAt: number;
  lastPlayed: number;
  stats: PlayerStats;
  progression: ProgressionState;
  unlockedAbilities: Set<ActiveAbilityType | PassiveAbilityType>;
  equippedPassives: PassiveAbilityType[];
  achievements: Map<string, Achievement>;
}

export interface PlayerStats {
  gamesPlayed: number;
  blocksPlaced: number;
  linesCleared: number;
  totalScore: number;
  bombsExploded: number;
  iceBroken: number;
  highestCombo: number;
  longestSession: number;
  totalPlaytime: number;
  skillUses: Map<ActiveAbilityType, number>;
}

// Special Block Types
export enum SpecialBlockType {
  NORMAL = 'NORMAL',
  ICE = 'ICE',
  BOMB = 'BOMB',
  RAINBOW = 'RAINBOW',
  LOCK = 'LOCK',
  PORTAL = 'PORTAL',
  MULTIPLIER = 'MULTIPLIER',
  FLUX_GEN = 'FLUX_GEN',
}

export interface SpecialBlock {
  filled: boolean;
  color: string;
  id?: string;
  specialType: SpecialBlockType;
  lockHealth?: number;
  health?: number;
  metadata?: {
    spawnedAt?: number;
    clearedCount?: number;
    [key: string]: any;
  };
}
