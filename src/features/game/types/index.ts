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
  CHRONO = 'CHRONO',
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

// Skills
export enum SkillType {
  REROLL = 'REROLL',
  SHATTER = 'SHATTER',
  BOMB = 'BOMB',
  GRAVITY_FLUSH = 'GRAVITY_FLUSH',
}

// Achievements
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  targetValue: number;
  currentValue: number;
  hidden?: boolean;
  category?: 'SCORE' | 'COMBO' | 'SPECIAL_BLOCKS' | 'ABILITIES' | 'PROGRESSION';
  fluxReward?: number;
}

// Mini-event types
export enum MiniEventType {
  FLUX_SURGE = 'FLUX_SURGE',
  SCORE_RUSH = 'SCORE_RUSH',
  CLEAR_BONUS = 'CLEAR_BONUS',
  COMBO_SHIELD = 'COMBO_SHIELD',     // YENİ
  PIECE_BLESSING = 'PIECE_BLESSING', // YENİ
}

// Mini-event state
export interface MiniEventState {
  activeEvents: Set<MiniEventType>;
  moveCounters: {
    [MiniEventType.FLUX_SURGE]: number;
    [MiniEventType.SCORE_RUSH]: number;
    [MiniEventType.CLEAR_BONUS]: number;
    [MiniEventType.COMBO_SHIELD]: number;     // YENİ
    [MiniEventType.PIECE_BLESSING]: number;   // YENİ
  };
  lastActivation: {
    [MiniEventType.FLUX_SURGE]: number;
    [MiniEventType.SCORE_RUSH]: number;
    [MiniEventType.CLEAR_BONUS]: number;
    [MiniEventType.COMBO_SHIELD]: number;     // YENİ
    [MiniEventType.PIECE_BLESSING]: number;   // YENİ
  };
  comboShieldActive: boolean;  // YENİ - COMBO_SHIELD kullanılabilir mi?
}

// Tier configuration
export interface TierConfig {
  thresholds: readonly number[];
  scoreMultipliers: readonly number[];
  fluxMultipliers: readonly number[];
}

// Event configuration
export interface EventConfig {
  durations: Record<string, number>;
  triggerIntervals: Record<string, number>;
  scoreMultipliers: Record<string, number>;
}

// Multiplier breakdown for UI
export interface MultiplierBreakdown {
  tier: number;
  event: number;
  miniEvents: { type: MiniEventType; multiplier: number }[];
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
