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

import { ObjectiveType, LevelDef, Achievement } from './types';

export const LEVELS: LevelDef[] = [
  {
    index: 1,
    name: "Başlangıç",
    objectives: [
      { type: ObjectiveType.SCORE, target: 1000, current: 0 },
      { type: ObjectiveType.CLEAR_LINES, target: 5, current: 0 }
    ],
    movesLimit: 20,
    rewardFlux: 30
  },
  {
    index: 2,
    name: "Buz Kıran",
    objectives: [
      { type: ObjectiveType.BREAK_ICE, target: 3, current: 0 },
      { type: ObjectiveType.SCORE, target: 2500, current: 0 }
    ],
    movesLimit: 25,
    rewardFlux: 40
  },
  {
    index: 3,
    name: "Zincir Reaksiyonu",
    objectives: [
      { type: ObjectiveType.CHAIN_REACTION, target: 2, current: 0 },
      { type: ObjectiveType.CLEAR_LINES, target: 10, current: 0 }
    ],
    movesLimit: 30,
    rewardFlux: 50
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'score_10k',
    name: 'Yüksek Skorcu',
    description: 'Tek bir oyunda 10,000 puana ulaş.',
    unlocked: false,
    targetValue: 10000,
    currentValue: 0
  },
  {
    id: 'combo_5',
    name: 'Kombo Ustası',
    description: '5x kombo yap.',
    unlocked: false,
    targetValue: 5,
    currentValue: 0
  },
  {
    id: 'bomb_expert',
    name: 'Bomba Uzmanı',
    description: '10 adet bomba bloğu patlat.',
    unlocked: false,
    targetValue: 10,
    currentValue: 0
  }
];