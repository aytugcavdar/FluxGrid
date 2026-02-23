import { PieceShape } from './types';

// Modern Soft Palette — muted, warm tones
export const COLORS = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#a78bfa', // Lavender
  '#10b981', // Teal Green
  '#f472b6', // Pink
  '#6366f1', // Indigo
];

// 1010! style shapes
export const SHAPES: PieceShape[] = [
  { id: 'dot', shape: [[1]], color: COLORS[0] },
  { id: 'h2', shape: [[1, 1]], color: COLORS[1] },
  { id: 'v2', shape: [[1], [1]], color: COLORS[1] },
  { id: 'h3', shape: [[1, 1, 1]], color: COLORS[2] },
  { id: 'v3', shape: [[1], [1], [1]], color: COLORS[2] },
  { id: 'h4', shape: [[1, 1, 1, 1]], color: COLORS[3] },
  { id: 'v4', shape: [[1], [1], [1], [1]], color: COLORS[3] },
  { id: 'square', shape: [[1, 1], [1, 1]], color: COLORS[0] },
  { id: 'l_shape', shape: [[1, 0], [1, 0], [1, 1]], color: COLORS[4] },
  { id: 'j_shape', shape: [[0, 1], [0, 1], [1, 1]], color: COLORS[4] },
  { id: 't_shape', shape: [[1, 1, 1], [0, 1, 0]], color: COLORS[5] },
  { id: 'cross', shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: COLORS[2] },
  { id: 'z_shape', shape: [[1, 1, 0], [0, 1, 1]], color: COLORS[3] },
  { id: 's_shape', shape: [[0, 1, 1], [1, 1, 0]], color: COLORS[1] },
  { id: 'corner', shape: [[1, 1], [1, 0]], color: COLORS[5] },
];

export const FLUX_COST = {
  REROLL: 20,
  SHATTER: 40,
  BOMB: 75,
};

export const POINTS = {
  BLOCK_PLACED: 15,
  LINE_CLEARED: 150,
  COMBO_MULTIPLIER: 75,
  COLOR_BONUS_MULTIPLIER: 1.5, // %50 bonus for single-color line clear
  SURGE_MULTIPLIER: 2.0,       // x2 during Surge mode
};