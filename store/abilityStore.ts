import { create } from 'zustand';
import { ActiveAbilityType, PassiveAbilityType, ActiveAbility, AbilityState, GridState, Piece, Coord, GRID_SIZE } from '../types';
import { FLUX_COST } from '../constants';

interface AbilityStore extends AbilityState {
  // Actions
  initializeAbilities: () => void;
  activateAbility: (type: ActiveAbilityType) => boolean;
  deactivateAbility: () => void;
  canAffordAbility: (type: ActiveAbilityType) => boolean;
  incrementUsageCount: (type: ActiveAbilityType) => void;
  
  // Ability Functions
  rotatePiece: (piece: Piece) => Piece;
  swapPieces: (pieces: Piece[], idx1: number, idx2: number) => Piece[];
  findOptimalPlacement: (grid: GridState, piece: Piece) => Coord | null;
  pushToHistory: (grid: GridState) => void;
  popFromHistory: () => GridState | null;
  decrementFreezeCounter: () => void;
}

// Helper: Rotate piece 90° clockwise
const rotatePieceClockwise = (piece: Piece): Piece => {
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;
  const rotated: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = piece.shape[r][c];
    }
  }
  
  return { ...piece, shape: rotated };
};

// Helper: Swap two pieces
const swapPiecesHelper = (pieces: Piece[], idx1: number, idx2: number): Piece[] => {
  if (idx1 < 0 || idx1 >= pieces.length || idx2 < 0 || idx2 >= pieces.length) {
    return pieces;
  }
  const newPieces = [...pieces];
  [newPieces[idx1], newPieces[idx2]] = [newPieces[idx2], newPieces[idx1]];
  return newPieces;
};

// Helper: Check if piece can be placed
const canPlacePiece = (grid: GridState, piece: Piece, x: number, y: number): boolean => {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] === 1) {
        const gridY = y + row;
        const gridX = x + col;
        
        if (gridY < 0 || gridY >= GRID_SIZE || gridX < 0 || gridX >= GRID_SIZE) {
          return false;
        }
        if (grid[gridY][gridX].filled) {
          return false;
        }
      }
    }
  }
  return true;
};

// Helper: Count adjacent filled cells
const countAdjacentFilled = (grid: GridState, piece: Piece, x: number, y: number): number => {
  let count = 0;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] === 1) {
        const gridY = y + row;
        const gridX = x + col;
        
        for (const [dy, dx] of directions) {
          const ny = gridY + dy;
          const nx = gridX + dx;
          if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
            if (grid[ny][nx].filled) count++;
          }
        }
      }
    }
  }
  return count;
};

// Helper: Simulate placement and count lines
const simulatePlacement = (grid: GridState, piece: Piece, x: number, y: number): GridState => {
  const tempGrid = grid.map(row => row.map(cell => ({ ...cell })));
  
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] === 1) {
        tempGrid[y + row][x + col] = { filled: true, color: piece.color };
      }
    }
  }
  
  return tempGrid;
};

// Helper: Count potential lines cleared
const countPotentialLines = (grid: GridState): number => {
  let lines = 0;
  
  // Check rows
  for (let y = 0; y < GRID_SIZE; y++) {
    if (grid[y].every(cell => cell.filled)) lines++;
  }
  
  // Check columns
  for (let x = 0; x < GRID_SIZE; x++) {
    let isFull = true;
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!grid[y][x].filled) {
        isFull = false;
        break;
      }
    }
    if (isFull) lines++;
  }
  
  return lines;
};

// Helper: Evaluate placement quality
const evaluatePlacement = (grid: GridState, piece: Piece, x: number, y: number): number => {
  let score = 0;
  
  // Prefer placements that complete lines
  const tempGrid = simulatePlacement(grid, piece, x, y);
  const linesCleared = countPotentialLines(tempGrid);
  score += linesCleared * 100;
  
  // Prefer placements that fill gaps
  score += countAdjacentFilled(grid, piece, x, y) * 10;
  
  // Prefer lower positions (gravity-friendly)
  score += (GRID_SIZE - y) * 2;
  
  return score;
};

// Helper: Find optimal placement
const findOptimalPlacementHelper = (grid: GridState, piece: Piece): Coord | null => {
  let bestScore = -1;
  let bestPos: Coord | null = null;
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (canPlacePiece(grid, piece, x, y)) {
        const score = evaluatePlacement(grid, piece, x, y);
        if (score > bestScore) {
          bestScore = score;
          bestPos = { x, y };
        }
      }
    }
  }
  
  return bestPos;
};

export const useAbilityStore = create<AbilityStore>((set, get) => ({
  activeAbilities: new Map<ActiveAbilityType, ActiveAbility>(),
  activeSkill: null,
  freezeMovesRemaining: 0,
  historyStack: [],

  initializeAbilities: () => {
    const abilities = new Map<ActiveAbilityType, ActiveAbility>();
    
    // Initialize all abilities as locked
    Object.values(ActiveAbilityType).forEach(type => {
      abilities.set(type, {
        type,
        fluxCost: FLUX_COST[type] || 0,
        unlocked: false,
        usageCount: 0
      });
    });
    
    // Unlock default abilities (existing ones)
    abilities.get(ActiveAbilityType.REROLL)!.unlocked = true;
    abilities.get(ActiveAbilityType.SHATTER)!.unlocked = true;
    abilities.get(ActiveAbilityType.BOMB)!.unlocked = true;
    
    set({ activeAbilities: abilities });
  },

  activateAbility: (type: ActiveAbilityType) => {
    const { activeSkill } = get();
    
    // Toggle off if already active
    if (activeSkill === type) {
      set({ activeSkill: null });
      return true;
    }
    
    // Activate new ability
    set({ activeSkill: type });
    return true;
  },

  deactivateAbility: () => {
    set({ activeSkill: null });
  },

  canAffordAbility: (type: ActiveAbilityType) => {
    const ability = get().activeAbilities.get(type);
    if (!ability || !ability.unlocked) return false;
    return true; // Flux check will be done in gameStore
  },

  incrementUsageCount: (type: ActiveAbilityType) => {
    const abilities = new Map(get().activeAbilities);
    const ability = abilities.get(type);
    if (ability) {
      ability.usageCount++;
      abilities.set(type, ability);
      set({ activeAbilities: abilities });
    }
  },

  rotatePiece: (piece: Piece) => {
    return rotatePieceClockwise(piece);
  },

  swapPieces: (pieces: Piece[], idx1: number, idx2: number) => {
    return swapPiecesHelper(pieces, idx1, idx2);
  },

  findOptimalPlacement: (grid: GridState, piece: Piece) => {
    return findOptimalPlacementHelper(grid, piece);
  },

  pushToHistory: (grid: GridState) => {
    const history = [...get().historyStack];
    history.push(grid.map(row => row.map(cell => ({ ...cell }))));
    
    // Limit history to last 10 moves
    if (history.length > 10) {
      history.shift();
    }
    
    set({ historyStack: history });
  },

  popFromHistory: () => {
    const history = [...get().historyStack];
    const lastState = history.pop();
    set({ historyStack: history });
    return lastState || null;
  },

  decrementFreezeCounter: () => {
    const { freezeMovesRemaining } = get();
    if (freezeMovesRemaining > 0) {
      set({ freezeMovesRemaining: freezeMovesRemaining - 1 });
    }
  }
}));
