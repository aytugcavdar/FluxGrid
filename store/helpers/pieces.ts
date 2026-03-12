/**
 * Piece generation utilities with smart RNG
 */
import { v4 as uuidv4 } from 'uuid';
import { Piece, PieceShape, GridState, GRID_SIZE, CellType } from '../../types';
import { SHAPES } from '../../constants';
import { SeededRNG, getDailySeed } from '../../utils/seededRng';

let currentDailyRNG: SeededRNG | null = null;

/**
 * Generate random pieces with smart RNG based on grid density
 * @param count Number of pieces to generate
 * @param grid Optional grid for density calculation
 * @param isDaily Whether to use seeded RNG for daily challenge
 */
export const getRandomPieces = (count: number, grid?: GridState, isDaily?: boolean): Piece[] => {
  const newPieces: Piece[] = [];
  
  if (isDaily && !currentDailyRNG) {
    currentDailyRNG = new SeededRNG(getDailySeed());
  }

  // Calculate grid density if grid is provided
  let density = 0;
  if (grid) {
    let filledCells = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x].filled) filledCells++;
      }
    }
    density = filledCells / (GRID_SIZE * GRID_SIZE);
  }

  for (let i = 0; i < count; i++) {
    let selectedShape: PieceShape;

    const randVal = isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random();

    // Smart RNG: Adjust probabilities based on density
    if (density > 0.7 && !isDaily) {
      // High density: Favor smaller pieces (1x1, 1x2, 2x1) to prevent unfair losses (Disabled in daily for consistency)
      const smallShapes = SHAPES.filter(s => s.shape.length * s.shape[0].length <= 2);
      selectedShape = smallShapes[Math.floor(randVal * smallShapes.length)];
    } else if (density > 0.5 && !isDaily) {
      // Medium density: Mixed probabilities, slight bias against very large pieces
      if (randVal > 0.3) {
        // 70% chance for medium/small
        const mediumShapes = SHAPES.filter(s => s.shape.length * s.shape[0].length <= 4);
        selectedShape = mediumShapes[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * mediumShapes.length)];
      } else {
        selectedShape = SHAPES[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * SHAPES.length)];
      }
    } else {
      // Low density or Daily mode: Completely random based on seed/Math.random
      selectedShape = SHAPES[Math.floor(randVal * SHAPES.length)];
    }
    
    // 15% chance for a special piece
    let type: CellType = CellType.NORMAL;
    const specialRand = isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random();
    if (specialRand > 0.92) type = CellType.BOMB; // 8% chance
    else if (specialRand > 0.85) type = CellType.ICE; // 7% chance

    newPieces.push({ 
        ...selectedShape, 
        instanceId: uuidv4(),
        type: type
    });
  }
  return newPieces;
};

/**
 * Reset daily RNG (for testing or when starting a new daily challenge)
 */
export const resetDailyRNG = () => {
  currentDailyRNG = null;
};
