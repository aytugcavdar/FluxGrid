/**
 * Piece generation utilities with smart RNG
 */
import { v4 as uuidv4 } from 'uuid';
import { Piece, PieceShape, GridState, GRID_SIZE, CellType } from '../../types';
import { SHAPES } from '../../constants';
import { SeededRNG, getDailySeed } from '@utils/seededRng';

let currentDailyRNG: SeededRNG | null = null;

/**
 * Generate random pieces with smart RNG based on grid density
 * @param count Number of pieces to generate
 * @param grid Optional grid for density calculation
 * @param isDaily Whether to use seeded RNG for daily challenge
 * @param colors Optional color palette to use instead of default COLORS
 * @param difficultyTier Optional difficulty tier (0-4) for Endless mode
 */
export const getRandomPieces = (
  count: number, 
  grid?: GridState, 
  isDaily?: boolean,
  colors?: string[],
  difficultyTier?: number
): Piece[] => {
  const newPieces: Piece[] = [];
  const tier = difficultyTier ?? 0;
  
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
    let selectedShape: PieceShape = SHAPES[0]; // Initialize with fallback
    let attempts = 0;

    const randVal = isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random();

    // Difficulty tier logic (only for Endless mode, tier > 0)
    if (tier >= 4) {
      // Tier 4 (20000+): Only large and complex shapes
      const largeShapes = SHAPES.filter(s => {
        const blockCount = s.shape.flat().filter(v => v === 1).length;
        return blockCount >= 4;
      });
      selectedShape = largeShapes[Math.floor(randVal * largeShapes.length)] || SHAPES[0];
    } else if (tier >= 3) {
      // Tier 3 (10000-20000): L, J, T shapes dominant (70% chance)
      if (randVal > 0.3) {
        const complexShapes = SHAPES.filter(s => {
          const blockCount = s.shape.flat().filter(v => v === 1).length;
          return blockCount >= 3 && (s.shape.length > 1 && s.shape[0].length > 1);
        });
        selectedShape = complexShapes[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * complexShapes.length)] || SHAPES[0];
      } else {
        selectedShape = SHAPES[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * SHAPES.length)];
      }
    } else if (tier >= 2) {
      // Tier 2 (5000-10000): 4+ block pieces more common, small pieces reduced
      if (randVal > 0.4) {
        const mediumLargeShapes = SHAPES.filter(s => {
          const blockCount = s.shape.flat().filter(v => v === 1).length;
          return blockCount >= 4;
        });
        selectedShape = mediumLargeShapes[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * mediumLargeShapes.length)] || SHAPES[0];
      } else {
        selectedShape = SHAPES[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * SHAPES.length)];
      }
    } else if (tier >= 1) {
      // Tier 1 (2000-5000): Large pieces 20% more common
      if (randVal > 0.3) {
        const mediumShapes = SHAPES.filter(s => {
          const blockCount = s.shape.flat().filter(v => v === 1).length;
          return blockCount >= 3;
        });
        selectedShape = mediumShapes[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * mediumShapes.length)] || SHAPES[0];
      } else {
        selectedShape = SHAPES[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * SHAPES.length)];
      }
    } else {
      // Tier 0 (0-2000): Normal density-based logic
      // Smart RNG: Adjust probabilities based on density
      if (density > 0.7 && !isDaily) {
        // High density: Favor smaller pieces (1x1, 1x2, 2x1) to prevent unfair losses (Disabled in daily for consistency)
        const smallShapes = SHAPES.filter(s => s.shape.length * s.shape[0].length <= 2);
        selectedShape = smallShapes[Math.floor(randVal * smallShapes.length)] || SHAPES[0];
      } else if (density > 0.5 && !isDaily) {
        // Medium density: Mixed probabilities, slight bias against very large pieces
        while (attempts < 50) {
          attempts++;
          if (randVal > 0.3) {
            // 70% chance for medium/small
            const mediumShapes = SHAPES.filter(s => s.shape.length * s.shape[0].length <= 4);
            const candidate = mediumShapes[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * mediumShapes.length)];
            if (candidate) {
              selectedShape = candidate;
              break;
            }
          } else {
            selectedShape = SHAPES[Math.floor((isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * SHAPES.length)];
            break;
          }
        }
        // Fallback if attempts exceeded
        if (attempts >= 50) {
          selectedShape = SHAPES[0];
        }
      } else {
        // Low density or Daily mode: Completely random based on seed/Math.random
        selectedShape = SHAPES[Math.floor(randVal * SHAPES.length)];
      }
    }
    
    // 15% chance for a special piece
    let type: CellType = CellType.NORMAL;
    const specialRand = isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random();
    if (specialRand > 0.92) type = CellType.BOMB; // 8% chance
    else if (specialRand > 0.85) type = CellType.ICE; // 7% chance

    // Use custom colors if provided, otherwise use the shape's default color
    const pieceColor = colors ? colors[i % colors.length] : selectedShape.color;

    newPieces.push({ 
        ...selectedShape,
        color: pieceColor,
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
