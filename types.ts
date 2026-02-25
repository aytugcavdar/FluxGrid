export type CellId = string; // Using UUID or coords string

export enum SkillType {
  REROLL = 'REROLL',
  SHATTER = 'SHATTER', // Destroy single block
  BOMB = 'BOMB', // Destroy 3x3
  GRAVITY_FLUSH = 'GRAVITY_FLUSH'
}

export enum GameMode {
  CAREER = 'CAREER',
  ENDLESS = 'ENDLESS',
  TIMED = 'TIMED'
}

export enum AppState {
  HOME = 'HOME',
  MAP = 'MAP',
  GAME = 'GAME',
  CAREER = 'CAREER',
  MODES = 'MODES' // Mode selection screen
}

export interface GameStats {
  blocksPlaced: number;
  linesCleared: number;
  totalScore: number;
  bombsExploded: number;
  iceBroken: number;
  gamesPlayed: number;
  skillUses: {
    [key in SkillType]?: number;
  };
}

export enum CellType {
  NORMAL = 'NORMAL',
  ICE = 'ICE', // Needs 2 clears
  BOMB = 'BOMB' // Explodes 3x3 on clear
}

export enum ObjectiveType {
  SCORE = 'SCORE',
  BREAK_ICE = 'BREAK_ICE',
  USE_BOMB = 'USE_BOMB',
  CLEAR_LINES = 'CLEAR_LINES',
  CHAIN_REACTION = 'CHAIN_REACTION'
}

export interface LevelObjective {
  type: ObjectiveType;
  target: number;
  current: number;
}

export interface LevelDef {
  index: number;
  name: string;
  objectives: LevelObjective[];
  movesLimit?: number;
  rewardFlux?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  targetValue: number;
  currentValue: number;
  hidden?: boolean;
}

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

export interface PieceShape {
  id: string;
  shape: number[][];
  color: string;
}

export interface Piece extends PieceShape {
  instanceId: string;
  type?: CellType;
}

export const GRID_SIZE = 10;