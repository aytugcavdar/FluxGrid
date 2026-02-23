export type CellId = string; // Using UUID or coords string

export enum SkillType {
  REROLL = 'REROLL',
  SHATTER = 'SHATTER', // Destroy single block
  BOMB = 'BOMB', // Destroy 3x3
  GRAVITY_FLUSH = 'GRAVITY_FLUSH'
}

export enum CellType {
  NORMAL = 'NORMAL',
  ICE = 'ICE', // Needs 2 clears
  BOMB = 'BOMB' // Explodes 3x3 on clear
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