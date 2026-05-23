/**
 * Profile feature types
 */
import type { Achievement } from '../../game/types';

// Simple progression state (career removed)
export interface ProgressionState {
  level: number;
  experience: number;
}

export interface PlayerProfile {
  username: string;
  createdAt: number;
  lastPlayed: number;
  stats: PlayerStats;
  progression: ProgressionState;
  unlockedAbilities: Set<string>;
  equippedPassives: string[];
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
  skillUses: Record<string, number>;
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
