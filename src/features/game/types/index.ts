/**
 * Game feature types - Core game mechanics
 */

export type CellId = string;

export const GRID_SIZE = 10;

// Cell Types
export enum CellType {
  NORMAL = 'NORMAL',
  ICE = 'ICE',
  BOMB = 'BOMB',
  STONE = 'STONE',
}

// Grid & Cells
export interface GridCell {
  filled: boolean;
  color: string;
  id?: string;
  isClearing?: boolean;
  type?: CellType;
  health?: number;
}

export type GridState = GridCell[][];

export interface Coord {
  x: number;
  y: number;
}

// Pieces
export interface PieceShape {
  id: string;
  shape: number[][];
  color: string;
}

export interface Piece extends PieceShape {
  instanceId: string;
  type?: CellType;
}

// Skills enum removed - skill system deprecated

// Achievements
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  targetValue: number;
  currentValue: number;
  hidden?: boolean;
  rarity?: 'BRONZE' | 'SILVER' | 'GOLD' | 'MYTHIC';
  category?: 'SCORE' | 'COMBO' | 'SPECIAL_BLOCKS' | 'ABILITIES' | 'PROGRESSION' | 'SPEED' | 'MASTERY';
}

// Mini-event system removed - types deprecated

// Multiplier breakdown for UI (mini-events removed)
export interface MultiplierBreakdown {
  tier: number;
  event: number;
  miniEvents: any[]; // Deprecated, kept for compatibility
  total: number;
}

// Milestone tanımı
export interface Milestone {
  id: string;
  threshold: number;
  label: string;
  reached: boolean;
}

// Progression state
export interface ProgressionState {
  currentStreak: number;        // Ardışık satır temizleme sayısı
  milestones: Milestone[];      // Milestone listesi
  lastMilestoneShown: string | null;  // Son gösterilen milestone
  streak: number;               // Alias for currentStreak (for widget compatibility)
}
