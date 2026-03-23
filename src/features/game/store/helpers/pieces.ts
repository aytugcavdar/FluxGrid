/**
 * Piece generation utilities with smart RNG
 */
import { v4 as uuidv4 } from 'uuid';
import { Piece, PieceShape, GridState, GRID_SIZE, CellType } from '../../types';
import { SHAPES } from '../../constants';
import { SeededRNG, getDailySeed } from '@utils/seededRng';
import { getDailySeedFromServer, getCachedDailySeed, cacheDailySeed } from '../../../../services/firebase/dailyChallengeService';
import { GameMode } from '@shared/types';

function weightedPick(
  shapes: PieceShape[],
  weights: number[],
  rng: () => number
): PieceShape {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < shapes.length; i++) {
    r -= weights[i];
    if (r <= 0) return shapes[i];
  }
  return shapes[shapes.length - 1];
}

let currentDailyRNG: SeededRNG | null = null;
let dailySeedPromise: Promise<number> | null = null;

/**
 * Initialize daily RNG with server seed
 */
async function initializeDailyRNG(): Promise<number> {
  if (currentDailyRNG) return 0;

  // Check cache first
  const cached = getCachedDailySeed();
  if (cached) {
    currentDailyRNG = new SeededRNG(cached.seed);
    return cached.seed;
  }

  // Fetch from server
  const seed = await getDailySeedFromServer();
  const today = new Date().toISOString().split('T')[0];
  cacheDailySeed(seed, today);
  currentDailyRNG = new SeededRNG(seed);
  return seed;
}

/**
 * Synchronous version of getRandomPieces that uses cached daily seed if available
 * Falls back to Math.random() if daily seed is not yet initialized
 * Use this for synchronous contexts like gameStore
 */
export const getRandomPiecesSync = (
  count: number, 
  grid?: GridState, 
  isDaily?: boolean,
  colors?: string[],
  difficultyTier?: number,
  gameMode?: GameMode
): Piece[] => {
  const newPieces: Piece[] = [];
  const tier = difficultyTier ?? 0;
  
  // For daily mode, try to use cached RNG, otherwise fall back to Math.random
  let useSeededRNG = false;
  if (isDaily) {
    if (!currentDailyRNG) {
      // Try to initialize from cache synchronously
      const cached = getCachedDailySeed();
      if (cached) {
        currentDailyRNG = new SeededRNG(cached.seed);
        useSeededRNG = true;
      }
    } else {
      useSeededRNG = true;
    }
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

  const S_TINY  = SHAPES.filter(s => s.shape.flat().filter(v => v === 1).length <= 2);
  const S_SMALL = SHAPES.filter(s => s.shape.flat().filter(v => v === 1).length === 3);
  const S_ASYM4 = ['l_shape', 'j_shape', 't_shape', 'z_shape', 's_shape'].map(id => SHAPES.find(s => s.id === id)!);
  const S_SYM4  = ['h4', 'v4', 'square'].map(id => SHAPES.find(s => s.id === id)!);
  const S_CROSS = SHAPES.filter(s => s.id === 'cross');

  for (let i = 0; i < count; i++) {
    let selectedShape: PieceShape = SHAPES[0]; // Initialize with fallback
    let attempts = 0;

    const randVal = useSeededRNG && currentDailyRNG ? currentDailyRNG.next() : Math.random();

    // RESCUE MECHANISM: Tüm tier'larda yoğunluk >75% olunca küçük parça zorla
    const RESCUE_DENSITY_THRESHOLD = 0.75;
    if (density > RESCUE_DENSITY_THRESHOLD && !isDaily && i === 0) {
      // İlk parçayı küçük yap (1-2 blok)
      const smallShapes = SHAPES.filter(s => s.shape.flat().filter(v => v === 1).length <= 2);
      selectedShape = smallShapes[Math.floor(randVal * smallShapes.length)] || SHAPES[0];
    }
    // Difficulty tier logic (only for Endless mode, tier > 0)
    else if (tier >= 6) {
      // Tier 6 (70k+): Sadece büyük asimetrik parçalar ve cross
      const rng = useSeededRNG && currentDailyRNG
        ? () => currentDailyRNG!.next()
        : Math.random;
      
      selectedShape = weightedPick(
        [...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_ASYM4.map(() => 55 / S_ASYM4.length),
          ...S_SYM4.map(() => 30 / S_SYM4.length),
          ...S_CROSS.map(() => 15),
        ],
        rng
      );
    } else if (tier >= 5) {
      // Tier 5 (40k-70k): Tier 4'e benzer ama daha az tiny
      const rng = useSeededRNG && currentDailyRNG
        ? () => currentDailyRNG!.next()
        : Math.random;
      
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 1 / S_TINY.length),   // Neredeyse yok
          ...S_SMALL.map(() => 3 / S_SMALL.length),
          ...S_ASYM4.map(() => 50 / S_ASYM4.length),
          ...S_SYM4.map(() => 30 / S_SYM4.length),
          ...S_CROSS.map(() => 16),
        ],
        rng
      );
    } else if (tier >= 4) {
      // Dağılım: %3 tiny | %5 small | %47 asym4 | %30 sym4 | %15 cross
      const rng = useSeededRNG && currentDailyRNG
        ? () => currentDailyRNG!.next()
        : Math.random;
      
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 3 / S_TINY.length),
          ...S_SMALL.map(() => 5 / S_SMALL.length),
          ...S_ASYM4.map(() => 47 / S_ASYM4.length),
          ...S_SYM4.map(() => 30 / S_SYM4.length),
          ...S_CROSS.map(() => 15),
        ],
        rng
      );
    } else if (tier >= 3) {
      // Dağılım: %5 tiny | %10 small | %55 asym4 | %20 sym4 | %10 cross
      const rng = useSeededRNG && currentDailyRNG
        ? () => currentDailyRNG!.next()
        : Math.random;
      
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 5 / S_TINY.length),
          ...S_SMALL.map(() => 10 / S_SMALL.length),
          ...S_ASYM4.map(() => 55 / S_ASYM4.length),
          ...S_SYM4.map(() => 20 / S_SYM4.length),
          ...S_CROSS.map(() => 10),
        ],
        rng
      );
    } else if (tier >= 2) {
      // Tier 2 (5000-10000): 4+ block pieces more common, small pieces reduced
      if (randVal > 0.4) {
        const mediumLargeShapes = SHAPES.filter(s => {
          const blockCount = s.shape.flat().filter(v => v === 1).length;
          return blockCount >= 4;
        });
        selectedShape = mediumLargeShapes[Math.floor((useSeededRNG && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * mediumLargeShapes.length)] || SHAPES[0];
      } else {
        selectedShape = SHAPES[Math.floor((useSeededRNG && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * SHAPES.length)];
      }
    } else if (tier >= 1) {
      // Tier 1 (2000-5000): Large pieces 20% more common
      if (randVal > 0.3) {
        const mediumShapes = SHAPES.filter(s => {
          const blockCount = s.shape.flat().filter(v => v === 1).length;
          return blockCount >= 3;
        });
        selectedShape = mediumShapes[Math.floor((useSeededRNG && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * mediumShapes.length)] || SHAPES[0];
      } else {
        selectedShape = SHAPES[Math.floor((useSeededRNG && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * SHAPES.length)];
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
            const candidate = mediumShapes[Math.floor((useSeededRNG && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * mediumShapes.length)];
            if (candidate) {
              selectedShape = candidate;
              break;
            }
          } else {
            selectedShape = SHAPES[Math.floor((useSeededRNG && currentDailyRNG ? currentDailyRNG.next() : Math.random()) * SHAPES.length)];
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
    
    // Special block type selection
    let type: CellType = CellType.NORMAL;
    const specialRand = useSeededRNG && currentDailyRNG ? currentDailyRNG.next() : Math.random();
    
    // TIMED MODE: 15% chance for CHRONO blocks (replaces normal special blocks)
    if (gameMode === GameMode.TIMED) {
      if (specialRand > 0.85) {
        type = CellType.CHRONO;  // 15% chance
      }
    } else {
      // OTHER MODES: Original special block logic
      if (specialRand > 0.92) type = CellType.BOMB;      // 8% chance
      else if (specialRand > 0.85) type = CellType.ICE;  // 7% chance
    }

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
 * Generate random pieces with smart RNG based on grid density
 * @param count Number of pieces to generate
 * @param grid Optional grid for density calculation
 * @param isDaily Whether to use seeded RNG for daily challenge
 * @param colors Optional color palette to use instead of default COLORS
 * @param difficultyTier Optional difficulty tier (0-4) for Endless mode
 * @param gameMode Optional game mode for mode-specific piece generation
 */
export const getRandomPieces = async (
  count: number, 
  grid?: GridState, 
  isDaily?: boolean,
  colors?: string[],
  difficultyTier?: number,
  gameMode?: GameMode
): Promise<Piece[]> => {
  const newPieces: Piece[] = [];
  const tier = difficultyTier ?? 0;
  
  if (isDaily) {
    // Initialize daily RNG if needed (with caching)
    if (!dailySeedPromise) {
      dailySeedPromise = initializeDailyRNG();
    }
    await dailySeedPromise;
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

  const S_TINY  = SHAPES.filter(s => s.shape.flat().filter(v => v === 1).length <= 2);
  const S_SMALL = SHAPES.filter(s => s.shape.flat().filter(v => v === 1).length === 3);
  const S_ASYM4 = ['l_shape', 'j_shape', 't_shape', 'z_shape', 's_shape'].map(id => SHAPES.find(s => s.id === id)!);
  const S_SYM4  = ['h4', 'v4', 'square'].map(id => SHAPES.find(s => s.id === id)!);
  const S_CROSS = SHAPES.filter(s => s.id === 'cross');

  for (let i = 0; i < count; i++) {
    let selectedShape: PieceShape = SHAPES[0]; // Initialize with fallback
    let attempts = 0;

    const randVal = isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random();

    // Difficulty tier logic (only for Endless mode, tier > 0)
    if (tier >= 6) {
      // Tier 6 (70k+): Sadece büyük asimetrik parçalar ve cross
      const rng = isDaily && currentDailyRNG
        ? () => currentDailyRNG!.next()
        : Math.random;
      
      selectedShape = weightedPick(
        [...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_ASYM4.map(() => 55 / S_ASYM4.length),
          ...S_SYM4.map(() => 30 / S_SYM4.length),
          ...S_CROSS.map(() => 15),
        ],
        rng
      );
    } else if (tier >= 5) {
      // Tier 5 (40k-70k): Tier 4'e benzer ama daha az tiny
      const rng = isDaily && currentDailyRNG
        ? () => currentDailyRNG!.next()
        : Math.random;
      
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 1 / S_TINY.length),   // Neredeyse yok
          ...S_SMALL.map(() => 3 / S_SMALL.length),
          ...S_ASYM4.map(() => 50 / S_ASYM4.length),
          ...S_SYM4.map(() => 30 / S_SYM4.length),
          ...S_CROSS.map(() => 16),
        ],
        rng
      );
    } else if (tier >= 4) {
      // Dağılım: %3 tiny | %5 small | %47 asym4 | %30 sym4 | %15 cross
      const rng = isDaily && currentDailyRNG
        ? () => currentDailyRNG!.next()
        : Math.random;
      
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 3 / S_TINY.length),
          ...S_SMALL.map(() => 5 / S_SMALL.length),
          ...S_ASYM4.map(() => 47 / S_ASYM4.length),
          ...S_SYM4.map(() => 30 / S_SYM4.length),
          ...S_CROSS.map(() => 15),
        ],
        rng
      );
    } else if (tier >= 3) {
      // Dağılım: %5 tiny | %10 small | %55 asym4 | %20 sym4 | %10 cross
      const rng = isDaily && currentDailyRNG
        ? () => currentDailyRNG!.next()
        : Math.random;
      
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 5 / S_TINY.length),
          ...S_SMALL.map(() => 10 / S_SMALL.length),
          ...S_ASYM4.map(() => 55 / S_ASYM4.length),
          ...S_SYM4.map(() => 20 / S_SYM4.length),
          ...S_CROSS.map(() => 10),
        ],
        rng
      );
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
    
    // Special block type selection
    let type: CellType = CellType.NORMAL;
    const specialRand = isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random();
    
    // TIMED MODE: 15% chance for CHRONO blocks (replaces normal special blocks)
    if (gameMode === GameMode.TIMED) {
      if (specialRand > 0.85) {
        type = CellType.CHRONO;  // 15% chance
      }
    } else {
      // OTHER MODES: Original special block logic
      if (specialRand > 0.92) type = CellType.BOMB;      // 8% chance
      else if (specialRand > 0.85) type = CellType.ICE;  // 7% chance
    }

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
