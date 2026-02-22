export type CellId = string; // Using UUID or coords string

export enum SkillType {
  REROLL = 'REROLL',
  SHATTER = 'SHATTER', // Destroy single block
  BOMB = 'BOMB', // Destroy 3x3
  GRAVITY_FLUSH = 'GRAVITY_FLUSH' // Force gravity immediately (if needed, or maybe something else)
}

export enum CellType {
  NORMAL = 'NORMAL',
  ICE = 'ICE', // Needs 2 clears
  BOMB = 'BOMB' // Explodes 3x3 on clear
}

export interface GridCell {
  filled: boolean;
  color: string; // Hex or tailwind class reference
  id?: string; // Unique ID for Framer Motion layoutId
  isClearing?: boolean; // For animation state
  type?: CellType;
  health?: number; // For ICE (starts at 2)
}

export type GridState = GridCell[][];

export interface Coord {
  x: number;
  y: number;
}

export interface PieceShape {
  id: string;
  shape: number[][]; // 0/1 matrix
  color: string;
}

export interface Piece extends PieceShape {
  instanceId: string; // Unique ID for this specific instance in the tray
  type?: CellType; // If the whole piece is special
}

export const GRID_SIZE = 10;