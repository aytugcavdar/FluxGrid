/**
 * Tutorial Pieces - Predefined pieces for each tutorial step
 * 
 * Each step has specific pieces that guide the user through the tutorial
 */

import { Piece, CellType, GRID_SIZE, type GridState } from '../../game/types';
import { v4 as uuidv4 } from 'uuid';

export interface TutorialStepData {
  pieces: Piece[];
  targetGrid?: number[][]; // Optional pre-filled grid state (1 = filled, 0 = empty)
  description?: string;
}

/**
 * Step 0: Welcome - Place first piece
 * Simple 2x2 square piece
 */
const STEP_0_PIECES: Piece[] = [
  {
    id: 'square_2x2',
    instanceId: uuidv4(),
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#60a5fa', // Blue
    type: CellType.NORMAL
  },
  {
    id: 'line_3h',
    instanceId: uuidv4(),
    shape: [[1, 1, 1]],
    color: '#a78bfa', // Purple
    type: CellType.NORMAL
  },
  {
    id: 'line_2h',
    instanceId: uuidv4(),
    shape: [[1, 1]],
    color: '#34d399', // Green
    type: CellType.NORMAL
  }
];

const CLEAR_LINE_PIECES: Piece[] = [
  {
    id: 'line_3h',
    instanceId: uuidv4(),
    shape: [[1, 1, 1]],
    color: '#f59e0b', // Orange
    type: CellType.NORMAL
  },
  {
    id: 'line_3h_alt',
    instanceId: uuidv4(),
    shape: [[1, 1, 1]],
    color: '#ec4899', // Pink
    type: CellType.NORMAL
  },
  {
    id: 'line_3h_teal',
    instanceId: uuidv4(),
    shape: [[1, 1, 1]],
    color: '#34d399', // Green
    type: CellType.NORMAL
  }
];

/**
 * Step 1: First Clear - Complete a line.
 * Bottom row needs a 3-block piece. A few blocks above it will fall after clear,
 * so the player learns gravity during the tutorial.
 */
const STEP_1_GRID: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0]
];

/**
 * Step 2: Combo - Same simple setup, so the second clear happens quickly and
 * teaches that consecutive clears keep the combo alive.
 */
const STEP_2_GRID: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0]
];

/**
 * Tutorial step data mapping
 */
export const TUTORIAL_STEP_DATA: Record<number, TutorialStepData> = {
  0: {
    pieces: STEP_0_PIECES,
    description: 'Place your first piece on the board'
  },
  1: {
    pieces: CLEAR_LINE_PIECES,
    targetGrid: STEP_1_GRID,
    description: 'Complete the bottom row to clear it and show gravity'
  },
  2: {
    pieces: CLEAR_LINE_PIECES,
    targetGrid: STEP_2_GRID,
    description: 'Clear another line quickly to keep combo'
  }
};

/**
 * Get pieces for a specific tutorial step
 */
export function getTutorialPieces(step: number): Piece[] {
  const stepData = TUTORIAL_STEP_DATA[step];
  if (!stepData) {
    // Return default pieces for steps without predefined pieces
    return [];
  }
  
  // Generate new instance IDs for each piece to avoid conflicts
  return stepData.pieces.map(piece => ({
    ...piece,
    instanceId: uuidv4()
  }));
}

/**
 * Get target grid for a specific tutorial step
 */
export function getTutorialGrid(step: number): number[][] | null {
  const stepData = TUTORIAL_STEP_DATA[step];
  return stepData?.targetGrid || null;
}

/**
 * Get a playable GridState for a specific tutorial step.
 */
export function getTutorialGridState(step: number): GridState | null {
  const targetGrid = getTutorialGrid(step);
  if (!targetGrid) return null;

  return Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => {
      const filled = targetGrid[y]?.[x] === 1;

      return filled
        ? {
            filled: true,
            color: '#64748b',
            id: `tutorial-${step}-${x}-${y}-${uuidv4()}`,
            type: CellType.NORMAL,
          }
        : { filled: false, color: '' };
    })
  );
}

/**
 * Check if a step has predefined pieces
 */
export function hasTutorialPieces(step: number): boolean {
  return !!TUTORIAL_STEP_DATA[step]?.pieces;
}
