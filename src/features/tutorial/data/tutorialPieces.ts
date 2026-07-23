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
  targetCells?: Array<{ x: number; y: number }>;
  settledCells?: Array<{ x: number; y: number }>;
  targetLines?: Array<{ type: 'row' | 'column'; index: number }>;
  fallingCells?: Array<{ x: number; y: number }>;
  description?: string;
}

/**
 * Step 0: Place a 2-block piece without clearing the prepared row.
 */
const STEP_0_PIECES: Piece[] = [
  {
    id: 'line_2h',
    instanceId: uuidv4(),
    shape: [[1, 1]],
    color: '#60a5fa', // Blue
    type: CellType.NORMAL
  }
];

const CLEAR_LINE_PIECES: Piece[] = [
  {
    id: 'line_3h',
    instanceId: uuidv4(),
    shape: [[1, 1, 1]],
    color: '#fbbf24', // Amber
    type: CellType.NORMAL
  }
];

const STEP_0_GRID: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
];

/**
 * Step 1: First Clear - Complete a line.
 * Bottom row needs a 3-block piece. A few blocks above it will fall after clear,
 * so the player learns the 2D gravity drop during the tutorial.
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
 * Tutorial step data mapping
 */
export const TUTORIAL_STEP_DATA: Record<number, TutorialStepData> = {
  0: {
    pieces: STEP_0_PIECES,
    targetGrid: STEP_0_GRID,
    targetCells: [{ x: 5, y: 9 }, { x: 6, y: 9 }],
    description: 'Place the 2-block piece beside the prepared row'
  },
  1: {
    pieces: CLEAR_LINE_PIECES,
    targetGrid: STEP_1_GRID,
    targetCells: [{ x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 }],
    description: 'Complete the bottom row to clear it and show 2D gravity'
  },
  2: {
    pieces: [],
    settledCells: [
      { x: 1, y: 9 },
      { x: 4, y: 9 },
      { x: 8, y: 9 },
    ],
    description: 'After a clear, unsupported blocks drop down'
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

export function getTutorialGuidance(step: number): Pick<TutorialStepData, 'targetCells' | 'settledCells' | 'targetLines' | 'fallingCells'> {
  const stepData = TUTORIAL_STEP_DATA[step];
  return {
    targetCells: stepData?.targetCells || [],
    settledCells: stepData?.settledCells || [],
    targetLines: stepData?.targetLines || [],
    fallingCells: stepData?.fallingCells || [],
  };
}

export function isTutorialTargetFilled(step: number, grid: GridState): boolean {
  const targetCells = TUTORIAL_STEP_DATA[step]?.targetCells || [];
  return targetCells.length > 0 && targetCells.every(({ x, y }) => grid[y]?.[x]?.filled);
}

/**
 * Check if a step has predefined pieces
 */
export function hasTutorialPieces(step: number): boolean {
  return !!TUTORIAL_STEP_DATA[step]?.pieces;
}
