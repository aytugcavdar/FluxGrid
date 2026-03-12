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

// Skills
export enum SkillType {
  REROLL = 'REROLL',
  SHATTER = 'SHATTER',
  BOMB = 'BOMB',
  GRAVITY_FLUSH = 'GRAVITY_FLUSH',
}

// Objectives
export enum ObjectiveType {
  SCORE = 'SCORE',
  BREAK_ICE = 'BREAK_ICE',
  USE_BOMB = 'USE_BOMB',
  CLEAR_LINES = 'CLEAR_LINES',
  CHAIN_REACTION = 'CHAIN_REACTION',
}

export interface LevelObjective {
  type: ObjectiveType;
  target: number;
  current: number;
}

// Level Definition
export interface LevelDef {
  index: number;
  name: string;
  objectives: LevelObjective[];
  movesLimit?: number;
  rewardFlux?: number;
  isPuzzle?: boolean;
  initialGrid?: GridState;
  fixedPieces?: PieceShape[];
  targetRows?: number[];
  targetCols?: number[];
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
