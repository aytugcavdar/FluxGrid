/**
 * Piece generation utilities with smart RNG
 */
import { v4 as uuidv4 } from 'uuid';
import { Piece, PieceShape, GridState, GRID_SIZE, CellType } from '../../types';
import { ENDLESS_LOOP_SPECIAL_RATES, ENDLESS_TIER_SPECIAL_RATES, SHAPES, SPAWN_RATES } from '../../constants';
import { SeededRNG, getDailySeed } from '@features/game/utils/game/seededRng';
import { GameMode } from '@shared/types';
import { isPieceBlessingActive } from './miniEventSystem';
import { calculateEasyPieceRate } from './difficultyScaling';
import { calculateEndlessLoop } from './tierSystem';

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

function pickSpecialBlockType(
  rng: () => number,
  gameMode?: GameMode,
  difficultyTier = 0,
  score = 0
): CellType {
  if (gameMode === GameMode.TIMED) return CellType.NORMAL;

  const tier = Math.max(0, Math.min(6, difficultyTier));
  const loop = gameMode === GameMode.ENDLESS && tier >= 6
    ? Math.min(4, calculateEndlessLoop(score))
    : 0;
  const rates = gameMode === GameMode.ENDLESS
    ? (loop > 0 ? ENDLESS_LOOP_SPECIAL_RATES[loop] : ENDLESS_TIER_SPECIAL_RATES[tier])
    : SPAWN_RATES;
  const roll = rng();
  if (roll < rates.BOMB) return CellType.BOMB;
  if (roll < rates.BOMB + rates.ICE) return CellType.ICE;
  return CellType.NORMAL;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;

  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return null;

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function colorDistance(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return Number.POSITIVE_INFINITY;

  const dr = rgbA.r - rgbB.r;
  const dg = rgbA.g - rgbB.g;
  const db = rgbA.b - rgbB.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function colorSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickDistinctTrayColor(
  colors: string[] | undefined,
  pieceIndex: number,
  selectedShape: PieceShape,
  usedNormalColors: string[]
): string {
  if (!colors?.length) return selectedShape.color;

  const minimumDistance = 95;
  const startIndex = (colorSeed(selectedShape.id) + pieceIndex * 3) % colors.length;
  const orderedColors = colors.map((_, offset) => colors[(startIndex + offset) % colors.length]);
  const distinctColor = orderedColors.find(color =>
    usedNormalColors.every(usedColor => colorDistance(color, usedColor) >= minimumDistance)
  );

  if (distinctColor) return distinctColor;

  return orderedColors.reduce(
    (best, color) => {
      const score = usedNormalColors.reduce(
        (lowestDistance, usedColor) => Math.min(lowestDistance, colorDistance(color, usedColor)),
        Number.POSITIVE_INFINITY
      );
      return score > best.score ? { color, score } : best;
    },
    { color: orderedColors[0], score: -1 }
  ).color;
}

function getBlockCount(shape: PieceShape): number {
  return shape.shape.flat().filter(value => value === 1).length;
}

function isEasyShape(shape: PieceShape): boolean {
  return getBlockCount(shape) <= 3;
}

function isLargeShape(shape: PieceShape): boolean {
  return getBlockCount(shape) >= 4;
}

type EndlessShapeWeights = [number, number, number, number, number];

// 1-2, 3, 4, 5-6 and 8-9 occupied cells. These are the final shape rates;
// no second large-piece roll is applied on top of them.
const ENDLESS_SHAPE_WEIGHTS_BY_TIER: Record<number, EndlessShapeWeights> = {
  0: [26, 24, 36, 12, 2],
  1: [21, 21, 38, 17, 3],
  2: [16, 17, 39, 24, 4],
  3: [10, 10, 42, 32, 6],
  4: [7, 8, 41, 35, 9],
  5: [4, 6, 38, 39, 13],
  6: [3, 4, 36, 41, 16],
};

const ENDLESS_SHAPE_GROUPS = [
  SHAPES.filter(shape => getBlockCount(shape) <= 2),
  SHAPES.filter(shape => getBlockCount(shape) === 3),
  SHAPES.filter(shape => getBlockCount(shape) === 4),
  SHAPES.filter(shape => {
    const count = getBlockCount(shape);
    return count >= 5 && count <= 6;
  }),
  SHAPES.filter(shape => getBlockCount(shape) >= 8),
] as const;

function pickEndlessShape(tier: number, allowHeavy: boolean, rng: () => number): PieceShape {
  const weights = ENDLESS_SHAPE_WEIGHTS_BY_TIER[Math.max(0, Math.min(6, tier))];
  const shapes: PieceShape[] = [];
  const shapeWeights: number[] = [];

  ENDLESS_SHAPE_GROUPS.forEach((group, groupIndex) => {
    if (!allowHeavy && groupIndex === ENDLESS_SHAPE_GROUPS.length - 1) return;
    group.forEach(shape => {
      shapes.push(shape);
      shapeWeights.push(weights[groupIndex] / group.length);
    });
  });

  return weightedPick(shapes, shapeWeights, rng);
}

function isValidGrid(grid: GridState | undefined): grid is GridState {
  return Array.isArray(grid) &&
    grid.length === GRID_SIZE &&
    grid.every(row => Array.isArray(row) && row.length === GRID_SIZE);
}

function canPlaceShape(grid: GridState, shape: PieceShape, startX: number, startY: number): boolean {
  if (!isValidGrid(grid) || !shape.shape.length || !shape.shape[0]?.length) return false;

  for (let y = 0; y < shape.shape.length; y++) {
    for (let x = 0; x < shape.shape[y].length; x++) {
      if (shape.shape[y][x] !== 1) continue;

      const gridX = startX + x;
      const gridY = startY + y;

      if (
        gridX < 0 ||
        gridX >= GRID_SIZE ||
        gridY < 0 ||
        gridY >= GRID_SIZE ||
        grid[gridY][gridX]?.filled
      ) {
        return false;
      }
    }
  }

  return true;
}

function shapeFitsAnywhere(grid: GridState, shape: PieceShape): boolean {
  if (!isValidGrid(grid) || !shape.shape.length || !shape.shape[0]?.length) return false;

  for (let y = 0; y <= GRID_SIZE - shape.shape.length; y++) {
    for (let x = 0; x <= GRID_SIZE - shape.shape[0].length; x++) {
      if (canPlaceShape(grid, shape, x, y)) {
        return true;
      }
    }
  }

  return false;
}

function findEasyRescueShape(grid?: GridState): PieceShape {
  const easyShapes = SHAPES.filter(isEasyShape);
  if (!isValidGrid(grid)) return easyShapes[0] || SHAPES[0];

  return easyShapes.find(shape => shapeFitsAnywhere(grid, shape)) || SHAPES[0];
}

function replacePieceShape(piece: Piece, shape: PieceShape): Piece {
  return {
    ...shape,
    instanceId: piece.instanceId,
    type: piece.type,
    color: piece.color,
    traySlot: piece.traySlot,
  };
}

function recolorTrayPieces(pieces: Piece[], colors?: string[]): Piece[] {
  const usedNormalColors: string[] = [];

  return pieces.map((piece, index) => {
    if (piece.type === CellType.ICE) {
      return { ...piece, color: '#7dd3fc' };
    }

    if (piece.type === CellType.BOMB) {
      return { ...piece, color: '#fb7185' };
    }

    const color = pickDistinctTrayColor(colors, index, piece, usedNormalColors);
    usedNormalColors.push(color);
    return { ...piece, color };
  });
}

function improveTrayQuality(
  pieces: Piece[],
  grid?: GridState,
  colors?: string[],
  tier = 0,
  gameMode?: GameMode
): Piece[] {
  if (pieces.length < 2) return recolorTrayPieces(pieces, colors);

  const improved = [...pieces];
  const validGrid = isValidGrid(grid) ? grid : undefined;
  const easyRescueShape = findEasyRescueShape(validGrid);
  const replaceLargestPiece = () => {
    const largestIndex = improved.reduce((bestIndex, piece, index) => (
      getBlockCount(piece) > getBlockCount(improved[bestIndex]) ? index : bestIndex
    ), 0);

    improved[largestIndex] = replacePieceShape(improved[largestIndex], easyRescueShape);
  };

  const fittingPieces = validGrid
    ? improved.filter(piece => shapeFitsAnywhere(validGrid, piece))
    : improved;

  const shouldGuaranteeEasyPiece = gameMode !== GameMode.ENDLESS || tier <= 2;
  const hasEasyPlayablePiece = fittingPieces.some(isEasyShape);
  const hasAnyPlayablePiece = fittingPieces.length > 0;
  if ((!hasAnyPlayablePiece && validGrid) || (shouldGuaranteeEasyPiece && !hasEasyPlayablePiece)) {
    replaceLargestPiece();
  }

  if (shouldGuaranteeEasyPiece && improved.length >= 3 && improved.every(isLargeShape)) {
    replaceLargestPiece();
  }

  if (shouldGuaranteeEasyPiece) {
    const seenLargeShapeIds = new Set<string>();
    for (let i = 0; i < improved.length; i++) {
      const piece = improved[i];
      if (!isLargeShape(piece)) continue;

      if (seenLargeShapeIds.has(piece.id)) {
        improved[i] = replacePieceShape(piece, easyRescueShape);
        break;
      }

      seenLargeShapeIds.add(piece.id);
    }
  }

  return recolorTrayPieces(improved, colors);
}

/**
 * Initialize daily RNG with local seed
 */
function initializeDailyRNG(): number {
  if (currentDailyRNG) return 0;

  // Use local getDailySeed function
  const seed = getDailySeed();
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
  gameMode?: GameMode,
  miniEventState?: any,
  score?: number  // Add score parameter for difficulty scaling
): Piece[] => {
  const newPieces: Piece[] = [];
  const usedNormalColors: string[] = [];
  const tier = difficultyTier ?? 0;
  
  // PIECE_BLESSING: Sadece küçük parçalar (dot, h2, v2)
  const blessingActive = miniEventState ? isPieceBlessingActive(miniEventState) : false;
  const blessedShapes = blessingActive 
    ? SHAPES.filter(s => ['dot', 'h2', 'v2'].includes(s.id))
    : null;
  
  // For daily mode, try to use cached RNG, otherwise fall back to Math.random
  let useSeededRNG = false;
  if (isDaily) {
    if (!currentDailyRNG) {
      // Initialize from local seed
      initializeDailyRNG();
      useSeededRNG = true;
    } else {
      useSeededRNG = true;
    }
  }
  const rng = () => useSeededRNG && currentDailyRNG ? currentDailyRNG.next() : Math.random();
  let hasHeavyPiece = false;
  let heavySpecialPieceCount = 0;

  // Calculate grid density if grid is provided
  let density = 0;
  if (isValidGrid(grid)) {
    let filledCells = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x].filled) filledCells++;
      }
    }
    density = filledCells / (GRID_SIZE * GRID_SIZE);
  }

  // Legacy non-Endless generation still uses these compact groups.
  const S_TINY  = SHAPES.filter(s => s.shape.flat().filter(v => v === 1).length <= 2);
  const S_SMALL = SHAPES.filter(s => s.shape.flat().filter(v => v === 1).length === 3);
  const S_ASYM4 = ['l_shape', 'j_shape', 't_shape', 'z_shape', 's_shape'].map(id => SHAPES.find(s => s.id === id)!);
  const S_SYM4  = ['h4', 'v4', 'square'].map(id => SHAPES.find(s => s.id === id)!);
  const S_CROSS = SHAPES.filter(s => s.id === 'cross');

  for (let i = 0; i < count; i++) {
    let selectedShape: PieceShape = SHAPES[0]; // Initialize with fallback
    let attempts = 0;

    // Special block type selection - MUST happen before shape selection.
    // Timed mode stays clean and fast-paced.
    let type = pickSpecialBlockType(rng, gameMode, tier, score);

    // PIECE_BLESSING: Override all logic and use only blessed shapes
    if (blessingActive && blessedShapes) {
      const randVal = rng();
      selectedShape = blessedShapes[Math.floor(randVal * blessedShapes.length)] || SHAPES[0];
    }
    // TIMED MODE: Easy piece rate scaling (only for non-blessed, non-rescue scenarios)
    else if (gameMode === GameMode.TIMED && !isDaily) {
      const randVal = rng();
      const easyRate = calculateEasyPieceRate(score || 0);
      const easyShapes = SHAPES.filter(s => ['dot', 'h2', 'v2'].includes(s.id));
      const hardShapes = SHAPES.filter(s => !['dot', 'h2', 'v2'].includes(s.id));
      
      if (randVal < easyRate) {
        // Select from easy pieces only
        selectedShape = easyShapes[Math.floor(rng() * easyShapes.length)] || SHAPES[0];
      } else {
        // Select from hard pieces only (excluding easy pieces)
        selectedShape = hardShapes[Math.floor(rng() * hardShapes.length)] || SHAPES[0];
      }
    }
    // RESCUE MECHANISM: Tier-based density thresholds
    // Higher tiers get rescue earlier to prevent unfair game overs
    else if (density > (tier >= 5 ? 0.65 : tier >= 3 ? 0.70 : 0.75) && !isDaily && i === 0) {
      // İlk parçayı küçük yap - tier'a göre max blok sayısı
      const maxBlocks = tier >= 5 ? 3 : 2; // tier 5-6'da 3 bloğa kadar, tier 3-4'te 2 bloğa kadar
      const smallShapes = SHAPES.filter(s => {
        const count = s.shape.flat().filter(v => v === 1).length;
        return count <= maxBlocks;
      });
      const randVal = rng();
      selectedShape = smallShapes[Math.floor(randVal * smallShapes.length)] || SHAPES[0];
    }
    // Endless uses one explicit distribution from tier 0 onward.
    else if (gameMode === GameMode.ENDLESS && !isDaily) {
      selectedShape = pickEndlessShape(tier, !hasHeavyPiece, rng);
    }
    // Legacy tier logic for callers that provide a tier without Endless mode.
    else if (tier >= 6) {
      // Tier 6: VOID+ pressure, but rare small pieces keep the tray fair.
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 3 / S_TINY.length),
          ...S_SMALL.map(() => 6 / S_SMALL.length),
          ...S_ASYM4.map(() => 46 / S_ASYM4.length),
          ...S_SYM4.map(() => 30 / S_SYM4.length),
          ...S_CROSS.map(() => 15),
        ],
        rng
      );
    } else if (tier >= 5) {
      // Tier 5: high pressure, softened so rescue is not the only relief.
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 4 / S_TINY.length),
          ...S_SMALL.map(() => 8 / S_SMALL.length),
          ...S_ASYM4.map(() => 45 / S_ASYM4.length),
          ...S_SYM4.map(() => 28 / S_SYM4.length),
          ...S_CROSS.map(() => 15),
        ],
        rng
      );
    } else if (tier >= 4) {
      // Dağılım: %3 tiny | %5 small | %47 asym4 | %30 sym4 | %15 cross
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
      // Tier 2: 4+ block pieces more common, small pieces reduced
      const randVal = rng();
      if (randVal > 0.4) {
        const mediumLargeShapes = SHAPES.filter(s => {
          const blockCount = s.shape.flat().filter(v => v === 1).length;
          return blockCount >= 4;
        });
        selectedShape = mediumLargeShapes[Math.floor(rng() * mediumLargeShapes.length)] || SHAPES[0];
      } else {
        selectedShape = SHAPES[Math.floor(rng() * SHAPES.length)];
      }
    } else if (tier >= 1) {
      // Tier 1: Large pieces 20% more common
      const randVal = rng();
      if (randVal > 0.3) {
        const mediumShapes = SHAPES.filter(s => {
          const blockCount = s.shape.flat().filter(v => v === 1).length;
          return blockCount >= 3;
        });
        selectedShape = mediumShapes[Math.floor(rng() * mediumShapes.length)] || SHAPES[0];
      } else {
        selectedShape = SHAPES[Math.floor(rng() * SHAPES.length)];
      }
    } else {
      // Tier 0: Normal warm-up density-based logic
      // Smart RNG: Adjust probabilities based on density
      const randVal = rng();
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
            const candidate = mediumShapes[Math.floor(rng() * mediumShapes.length)];
            if (candidate) {
              selectedShape = candidate;
              break;
            }
          } else {
            selectedShape = SHAPES[Math.floor(rng() * SHAPES.length)];
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
    
    const selectedBlockCount = getBlockCount(selectedShape);
    if (selectedBlockCount >= 8) {
      hasHeavyPiece = true;
    }
    if (type !== CellType.NORMAL && selectedBlockCount >= 5) {
      if (heavySpecialPieceCount >= 2) {
        type = CellType.NORMAL;
      } else {
        heavySpecialPieceCount++;
      }
    }

    // Determine piece color based on type
    let pieceColor: string;
    if (type === CellType.ICE) {
      pieceColor = '#7dd3fc'; // Light blue
    } else if (type === CellType.BOMB) {
      pieceColor = '#fb7185';
    } else {
      // Use custom colors if provided, otherwise use the shape's default color
      pieceColor = pickDistinctTrayColor(colors, i, selectedShape, usedNormalColors);
      usedNormalColors.push(pieceColor);
    }

    newPieces.push({ 
        ...selectedShape,
        color: pieceColor,
        instanceId: uuidv4(),
        type: type,
        traySlot: i
    });
  }
  return improveTrayQuality(newPieces, grid, colors, tier, gameMode);
};

/**
 * Generate random pieces with smart RNG based on grid density
 * @param count Number of pieces to generate
 * @param grid Optional grid for density calculation
 * @param isDaily Whether to use seeded RNG for daily challenge
 * @param colors Optional color palette to use instead of default COLORS
 * @param difficultyTier Optional difficulty tier (0-6) for Endless mode
 * @param gameMode Optional game mode for mode-specific piece generation
 */
export const getRandomPieces = (
  count: number, 
  grid?: GridState, 
  isDaily?: boolean,
  colors?: string[],
  difficultyTier?: number,
  gameMode?: GameMode
): Piece[] => {
  const newPieces: Piece[] = [];
  const usedNormalColors: string[] = [];
  const tier = difficultyTier ?? 0;
  
  if (isDaily) {
    // Initialize daily RNG if needed
    initializeDailyRNG();
  }

  // Calculate grid density if grid is provided
  let density = 0;
  if (isValidGrid(grid)) {
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
  const rng = () => isDaily && currentDailyRNG ? currentDailyRNG.next() : Math.random();
  let hasHeavyPiece = false;
  let heavySpecialPieceCount = 0;

  for (let i = 0; i < count; i++) {
    let selectedShape: PieceShape = SHAPES[0]; // Initialize with fallback
    let attempts = 0;

    const randVal = rng();

    if (
      gameMode === GameMode.ENDLESS &&
      !isDaily &&
      density > (tier >= 5 ? 0.65 : tier >= 3 ? 0.70 : 0.75) &&
      i === 0
    ) {
      const maxBlocks = tier >= 5 ? 3 : 2;
      const smallShapes = SHAPES.filter(shape => getBlockCount(shape) <= maxBlocks);
      selectedShape = smallShapes[Math.floor(randVal * smallShapes.length)] || SHAPES[0];
    } else if (gameMode === GameMode.ENDLESS && !isDaily) {
      selectedShape = pickEndlessShape(tier, !hasHeavyPiece, rng);
    }
    // Legacy tier logic for callers that provide a tier without Endless mode.
    else if (tier >= 6) {
      // Tier 6: VOID+ pressure, but rare small pieces keep the tray fair.
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 3 / S_TINY.length),
          ...S_SMALL.map(() => 6 / S_SMALL.length),
          ...S_ASYM4.map(() => 46 / S_ASYM4.length),
          ...S_SYM4.map(() => 30 / S_SYM4.length),
          ...S_CROSS.map(() => 15),
        ],
        rng
      );
    } else if (tier >= 5) {
      // Tier 5: high pressure, softened so rescue is not the only relief.
      selectedShape = weightedPick(
        [...S_TINY, ...S_SMALL, ...S_ASYM4, ...S_SYM4, ...S_CROSS],
        [
          ...S_TINY.map(() => 4 / S_TINY.length),
          ...S_SMALL.map(() => 8 / S_SMALL.length),
          ...S_ASYM4.map(() => 45 / S_ASYM4.length),
          ...S_SYM4.map(() => 28 / S_SYM4.length),
          ...S_CROSS.map(() => 15),
        ],
        rng
      );
    } else if (tier >= 4) {
      // Dağılım: %3 tiny | %5 small | %47 asym4 | %30 sym4 | %15 cross
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
      // Tier 2: 4+ block pieces more common, small pieces reduced
      if (randVal > 0.4) {
        const mediumLargeShapes = SHAPES.filter(s => {
          const blockCount = s.shape.flat().filter(v => v === 1).length;
          return blockCount >= 4;
        });
        selectedShape = mediumLargeShapes[Math.floor(rng() * mediumLargeShapes.length)] || SHAPES[0];
      } else {
        selectedShape = SHAPES[Math.floor(rng() * SHAPES.length)];
      }
    } else if (tier >= 1) {
      // Tier 1: Large pieces 20% more common
      if (randVal > 0.3) {
        const mediumShapes = SHAPES.filter(s => {
          const blockCount = s.shape.flat().filter(v => v === 1).length;
          return blockCount >= 3;
        });
        selectedShape = mediumShapes[Math.floor(rng() * mediumShapes.length)] || SHAPES[0];
      } else {
        selectedShape = SHAPES[Math.floor(rng() * SHAPES.length)];
      }
    } else {
      // Tier 0: Normal warm-up density-based logic
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
            const candidate = mediumShapes[Math.floor(rng() * mediumShapes.length)];
            if (candidate) {
              selectedShape = candidate;
              break;
            }
          } else {
            selectedShape = SHAPES[Math.floor(rng() * SHAPES.length)];
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
    
    const selectedBlockCount = getBlockCount(selectedShape);
    if (selectedBlockCount >= 8) {
      hasHeavyPiece = true;
    }

    let type = pickSpecialBlockType(rng, gameMode, tier);
    if (type !== CellType.NORMAL && selectedBlockCount >= 5) {
      if (heavySpecialPieceCount >= 2) {
        type = CellType.NORMAL;
      } else {
        heavySpecialPieceCount++;
      }
    }

    // Determine piece color based on type
    let pieceColor: string;
    if (type === CellType.ICE) {
      pieceColor = '#7dd3fc'; // Light blue
    } else if (type === CellType.BOMB) {
      pieceColor = '#fb7185';
    } else {
      // Use custom colors if provided, otherwise use the shape's default color
      pieceColor = pickDistinctTrayColor(colors, i, selectedShape, usedNormalColors);
      usedNormalColors.push(pieceColor);
    }

    newPieces.push({ 
        ...selectedShape,
        color: pieceColor,
        instanceId: uuidv4(),
        type: type,
        traySlot: i
    });
  }
  return improveTrayQuality(newPieces, grid, colors, tier, gameMode);
};

/**
 * Reset daily RNG (for testing or when starting a new daily challenge)
 */
export const resetDailyRNG = () => {
  currentDailyRNG = null;
};
