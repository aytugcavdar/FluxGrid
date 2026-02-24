import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Piece, PieceShape, GRID_SIZE, GridCell, SkillType, CellType, ObjectiveType, LevelObjective, Achievement, AppState, GameStats } from '../types';
import { SHAPES, POINTS, FLUX_COST, COLORS, LEVELS, ACHIEVEMENTS } from '../constants';
import { playPlace, playClear, playCombo, playSkill, playGameOver } from '../utils/audio';

interface GameStore {
  grid: GridState;
  pieces: Piece[];
  score: number;
  highScore: number;
  flux: number;
  combo: number;
  isGameOver: boolean;
  isSurgeActive: boolean;          // Flux dolunca tetiklenir, aşağıdaki temizlemede x2
  activeSkill: SkillType | null;
  draggedPiece: Piece | null;
  lastAction: {
    type: 'PLACE' | 'CLEAR';
    lines?: number;
    combo?: number;
    chainCount?: number;            // Kaç zincir dalgası oluştu
    colorBonus?: boolean;           // Tek renkli temizleme bonusu mu?
    surgeBonus?: boolean;           // Surge modu aktif miydi?
  } | null;
  
  // Level & Achievements State
  currentLevelIndex: number;
  movesLeft: number;
  levelObjectives: LevelObjective[];
  achievements: Achievement[];
  isLevelComplete: boolean;
  unlockedAchievementId: string | null;

  // Navigation & Persistence
  appState: AppState;
  stats: GameStats;
  maxLevelReached: number;

  // Actions
  initGame: () => void;
  nextLevel: () => void;
  startLevel: (levelIndex: number) => void;
  setAppState: (state: AppState) => void;
  clearAchievementNotification: () => void;
  placePiece: (piece: Piece, startX: number, startY: number) => boolean;
  canPlacePiece: (grid: GridState, piece: Piece, startX: number, startY: number) => boolean;
  activateSkill: (skill: SkillType) => void;
  useShatter: (x: number, y: number) => void;
  useBomb: (x: number, y: number) => void;
  setDraggedPiece: (piece: Piece | null) => void;
  checkGameOver: () => void;
  resetGame: () => void;
}

const createEmptyGrid = (): GridState => 
  Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => ({ filled: false, color: '' }))
  );

const getRandomPieces = (count: number): Piece[] => {
  const newPieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    
    // 15% chance for a special piece
    let type: CellType = CellType.NORMAL;
    const rng = Math.random();
    if (rng > 0.92) type = CellType.BOMB; // 8% chance
    else if (rng > 0.85) type = CellType.ICE; // 7% chance

    newPieces.push({ 
        ...randomShape, 
        instanceId: uuidv4(),
        type: type
    });
  }
  return newPieces;
};

const processGrid = (initialGrid: GridState): {
  grid: GridState;
  totalLinesCleared: number;
  chainCount: number;
  colorBonus: boolean;
  bombsExploded: number;
} => {
  let currentGrid = initialGrid.map(row => row.map(cell => ({ ...cell })));
  let totalLinesCleared = 0;
  let linesClearedInPass = 0;
  let chainCount = 0;      // Kaç dalga (do-while iteration) oluştu
  let colorBonus = false;  // Herhangi bir dalga tek renkli miydi?
  let bombsExploded = 0;

  do {
    linesClearedInPass = 0;
    
    // 1. Check Rows
    const fullRows: number[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      if (currentGrid[y].every(cell => cell.filled)) fullRows.push(y);
    }

    // 2. Check Cols
    const fullCols: number[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      let isFull = true;
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!currentGrid[y][x].filled) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(x);
    }

    linesClearedInPass = fullRows.length + fullCols.length;
    totalLinesCleared += linesClearedInPass;

    if (linesClearedInPass > 0) {
      chainCount++;

      // Renk Bonusu: Temizlenen satır/sütunların tamamı aynı renkte mi?
      const checkColorBonus = () => {
        for (const y of fullRows) {
          const rowColors = new Set(currentGrid[y].filter(c => c.filled).map(c => c.color));
          if (rowColors.size === 1) return true;
        }
        for (const x of fullCols) {
          const colColors = new Set<string>();
          for (let y = 0; y < GRID_SIZE; y++) {
            if (currentGrid[y][x].filled) colColors.add(currentGrid[y][x].color);
          }
          if (colColors.size === 1) return true;
        }
        return false;
      };
      if (checkColorBonus()) colorBonus = true;
      // Identify cells to clear (Set to avoid duplicates)
      const cellsToClear = new Set<string>(); // "x,y"
      const bombsTriggered: {x: number, y: number}[] = [];

      // Helper to mark cell for clearing
      const markForClear = (x: number, y: number) => {
        const key = `${x},${y}`;
        if (cellsToClear.has(key)) return;

        const cell = currentGrid[y][x];
        if (!cell.filled) return;

        // Handle ICE
        if (cell.type === CellType.ICE && (cell.health || 0) > 1) {
            // Ice takes damage but doesn't clear yet
            // We modify the grid directly here for health, but don't add to cellsToClear
            // Actually, we need to handle this carefully. 
            // If we don't add to cellsToClear, it stays. 
            // We should decrement health.
            // But we can't modify currentGrid safely while iterating? 
            // We are gathering what to clear first.
            // Let's store "damage" separately?
            // Simpler: If it's ICE and health > 1, we just decrement health and DO NOT add to cellsToClear.
            // We'll do the mutation in the application phase.
             cellsToClear.add(key); // Add it, but check health later?
             // No, let's separate "cells hit" from "cells cleared".
        } else {
             cellsToClear.add(key);
             if (cell.type === CellType.BOMB) {
                 bombsTriggered.push({x, y});
             }
        }
      };

      // Mark row cells
      fullRows.forEach(y => {
        for (let x = 0; x < GRID_SIZE; x++) markForClear(x, y);
      });
      // Mark col cells
      fullCols.forEach(x => {
        for (let y = 0; y < GRID_SIZE; y++) markForClear(x, y);
      });

      // Handle Bomb Explosions (Recursive?)
      // For simplicity, just one level of explosion for now, or loop until no new bombs
      let bombIndex = 0;
      while(bombIndex < bombsTriggered.length) {
          const bomb = bombsTriggered[bombIndex];
          bombIndex++;
          
          // Explode 3x3
          for(let dy = -1; dy <= 1; dy++) {
              for(let dx = -1; dx <= 1; dx++) {
                  const nx = bomb.x + dx;
                  const ny = bomb.y + dy;
                  if(nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                      const key = `${nx},${ny}`;
                      if(!cellsToClear.has(key) && currentGrid[ny][nx].filled) {
                          cellsToClear.add(key);
                          if(currentGrid[ny][nx].type === CellType.BOMB) {
                              bombsTriggered.push({x: nx, y: ny});
                          }
                      }
                  }
              }
          }
      }

      // Apply Clears and Damage
      // We need to re-iterate rows/cols to apply damage to ICE that wasn't fully cleared?
      // Actually, my markForClear logic above was a bit flawed.
      // Let's iterate all "Hit" cells.
      const cellsHit = new Set<string>();
      fullRows.forEach(y => {
        for (let x = 0; x < GRID_SIZE; x++) cellsHit.add(`${x},${y}`);
      });
      fullCols.forEach(x => {
        for (let y = 0; y < GRID_SIZE; y++) cellsHit.add(`${x},${y}`);
      });

      // Also add bomb radius to cellsHit?
      // Bombs only trigger if they are CLEARED.
      // So first we determine what is cleared.
      
      // Let's refine:
      // 1. Identify all cells that are part of a full line.
      // 2. For each such cell:
      //    - If ICE (health > 1): Decrement health. NOT CLEARED.
      //    - Else: Mark as CLEARED.
      //    - If BOMB and CLEARED: Add to explosion queue.
      // 3. Process explosion queue:
      //    - For each cell in radius:
      //      - If ICE (health > 1): Decrement health. NOT CLEARED.
      //      - Else: Mark as CLEARED.
      //      - If BOMB and CLEARED (and not visited): Add to queue.

      const finalCellsToClear = new Set<string>();
      const processedBombs = new Set<string>();
      const explosionQueue: {x: number, y: number}[] = [];

      const processHit = (x: number, y: number) => {
          const cell = currentGrid[y][x];
          if (!cell.filled) return;

          if (cell.type === CellType.ICE && (cell.health || 0) > 1) {
              cell.health = (cell.health || 2) - 1;
              // Visual feedback for crack? handled by renderer checking health
          } else {
              const key = `${x},${y}`;
              if (!finalCellsToClear.has(key)) {
                  finalCellsToClear.add(key);
                  if (cell.type === CellType.BOMB) {
                      explosionQueue.push({x, y});
                      bombsExploded++;
                  }
              }
          }
      };

      // Initial Hits
      cellsHit.forEach(key => {
          const [x, y] = key.split(',').map(Number);
          processHit(x, y);
      });

      // Process Explosions
      while (explosionQueue.length > 0) {
          const bomb = explosionQueue.pop()!;
          const bKey = `${bomb.x},${bomb.y}`;
          if (processedBombs.has(bKey)) continue;
          processedBombs.add(bKey);

          for(let dy = -1; dy <= 1; dy++) {
              for(let dx = -1; dx <= 1; dx++) {
                  const nx = bomb.x + dx;
                  const ny = bomb.y + dy;
                  if(nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                      processHit(nx, ny);
                  }
              }
          }
      }

      // Execute Clears
      finalCellsToClear.forEach(key => {
          const [x, y] = key.split(',').map(Number);
          currentGrid[y][x] = { filled: false, color: '' };
      });

      // Apply Gravity
      for (let x = 0; x < GRID_SIZE; x++) {
        const stack: GridCell[] = [];
        // Collect filled cells
        for (let y = 0; y < GRID_SIZE; y++) {
          if (currentGrid[y][x].filled) stack.push(currentGrid[y][x]);
        }
        // Fill from bottom up
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
          const popped = stack.pop();
          if (popped) {
            currentGrid[y][x] = popped;
          } else {
            currentGrid[y][x] = { filled: false, color: '' };
          }
        }
      }
    }
  } while (linesClearedInPass > 0);

  return { grid: currentGrid, totalLinesCleared, chainCount, colorBonus, bombsExploded };
};

const INITIAL_STATS: GameStats = {
  blocksPlaced: 0,
  linesCleared: 0,
  totalScore: 0,
  bombsExploded: 0,
  iceBroken: 0,
  gamesPlayed: 0,
  skillUses: {}
};

export const useGameStore = create<GameStore>((set, get) => ({
  grid: createEmptyGrid(),
  pieces: [],
  score: 0,
  highScore: parseInt(localStorage.getItem('flux_highscore') || '0'),
  flux: 100,
  combo: 0,
  isGameOver: false,
  isSurgeActive: false,
  activeSkill: null,
  draggedPiece: null,
  lastAction: null,
  
  // Level & Achievements Initial State
  currentLevelIndex: 0,
  movesLeft: 0,
  levelObjectives: [],
  achievements: JSON.parse(localStorage.getItem('flux_achievements') || JSON.stringify(ACHIEVEMENTS)),
  isLevelComplete: false,
  unlockedAchievementId: null,

  // Navigation & Stats Initial State
  appState: AppState.HOME,
  stats: JSON.parse(localStorage.getItem('flux_stats') || JSON.stringify(INITIAL_STATS)),
  maxLevelReached: parseInt(localStorage.getItem('flux_max_level') || '0'),

  initGame: () => {
    const firstLevel = LEVELS[0];
    set({
      grid: createEmptyGrid(),
      pieces: getRandomPieces(3),
      score: 0,
      flux: 50,
      combo: 0,
      isGameOver: false,
      isSurgeActive: false,
      activeSkill: null,
      lastAction: null,
      currentLevelIndex: 0,
      movesLeft: firstLevel.movesLimit || 0,
      levelObjectives: firstLevel.objectives.map(o => ({ ...o })),
      isLevelComplete: false,
      unlockedAchievementId: null,
      appState: AppState.GAME
    });
    
    // Increment games played
    const newStats = { ...get().stats, gamesPlayed: get().stats.gamesPlayed + 1 };
    set({ stats: newStats });
    localStorage.setItem('flux_stats', JSON.stringify(newStats));
  },

  startLevel: (idx) => {
    const levelDef = LEVELS[idx];
    if (!levelDef) return;

    set({
      grid: createEmptyGrid(),
      pieces: getRandomPieces(3),
      score: 0,
      flux: 50,
      combo: 0,
      isGameOver: false,
      isSurgeActive: false,
      activeSkill: null,
      lastAction: null,
      currentLevelIndex: idx,
      movesLeft: levelDef.movesLimit || 0,
      levelObjectives: levelDef.objectives.map(o => ({ ...o })),
      isLevelComplete: false,
      unlockedAchievementId: null,
      appState: AppState.GAME
    });
  },

  setAppState: (state) => set({ appState: state }),

  nextLevel: () => {
    const nextIdx = get().currentLevelIndex + 1;
    if (nextIdx >= LEVELS.length) return; // End of game

    const nextLevelDef = LEVELS[nextIdx];
    set({
      grid: createEmptyGrid(),
      pieces: getRandomPieces(3),
      flux: 50,
      currentLevelIndex: nextIdx,
      movesLeft: nextLevelDef.movesLimit || 0,
      levelObjectives: nextLevelDef.objectives.map(o => ({ ...o })),
      isLevelComplete: false,
      isGameOver: false,
      activeSkill: null
    });
  },

  clearAchievementNotification: () => set({ unlockedAchievementId: null }),

  setDraggedPiece: (piece) => set({ draggedPiece: piece }),

  activateSkill: (skill) => {
    const { flux, pieces, activeSkill } = get();
    
    if (activeSkill === skill) {
      set({ activeSkill: null }); // Toggle off
      return;
    }

    if (skill === SkillType.REROLL) {
      if (flux >= FLUX_COST.REROLL) {
        set({
          flux: flux - FLUX_COST.REROLL,
          pieces: getRandomPieces(3),
          activeSkill: null
        });
        get().checkGameOver();
      }
    } else if (skill === SkillType.SHATTER) {
      if (flux >= FLUX_COST.SHATTER) {
        set({ activeSkill: SkillType.SHATTER });
      }
    } else if (skill === SkillType.BOMB) {
      if (flux >= FLUX_COST.BOMB) {
        set({ activeSkill: SkillType.BOMB });
      }
    }
  },

  useShatter: (x, y) => {
    const { grid, flux, score } = get();
    if (!grid[y][x].filled) return;

    // Remove block
    const tempGrid = grid.map(row => row.map(cell => ({ ...cell })));
    tempGrid[y][x] = { filled: false, color: '' };

    // Apply gravity immediately for that column
    for (let row = y; row > 0; row--) {
      tempGrid[row][x] = tempGrid[row - 1][x];
    }
    tempGrid[0][x] = { filled: false, color: '' };

    // Process grid for chain reactions
    const { grid: finalGrid, totalLinesCleared } = processGrid(tempGrid);

    const newCombo = totalLinesCleared > 0 ? get().combo + 1 : get().combo; // Don't reset combo on skill use, just add if it clears
    const extraScore = totalLinesCleared * POINTS.LINE_CLEARED * (newCombo > 0 ? newCombo : 1);
    
    // Audio + Haptic Feedback for Skill
    playSkill();
    if (totalLinesCleared > 0) playClear(totalLinesCleared);
    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);

    const newScore = score + 5 + extraScore;
    const newHighScore = Math.max(newScore, get().highScore);
    if (newHighScore > get().highScore) {
      localStorage.setItem('flux_highscore', newHighScore.toString());
    }

    set({
      grid: finalGrid,
      flux: flux - FLUX_COST.SHATTER,
      score: newScore,
      highScore: newHighScore,
      combo: newCombo,
      activeSkill: null
    });
  },

  useBomb: (x, y) => {
    const { grid, flux, score } = get();
    
    const tempGrid = grid.map(row => row.map(cell => ({ ...cell })));
    let blocksDestroyed = 0;

    // Destroy 3x3 area
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
          if (tempGrid[ny][nx].filled) {
            tempGrid[ny][nx] = { filled: false, color: '' };
            blocksDestroyed++;
          }
        }
      }
    }

    if (blocksDestroyed === 0) return; // Don't use skill if nothing hit

    // Apply Gravity for all affected columns
    for (let col = Math.max(0, x - 1); col <= Math.min(GRID_SIZE - 1, x + 1); col++) {
       // Simple gravity for this column
       const stack: GridCell[] = [];
       for (let row = 0; row < GRID_SIZE; row++) {
         if (tempGrid[row][col].filled) stack.push(tempGrid[row][col]);
       }
       for (let row = GRID_SIZE - 1; row >= 0; row--) {
         const popped = stack.pop();
         if (popped) tempGrid[row][col] = popped;
         else tempGrid[row][col] = { filled: false, color: '' };
       }
    }

    // Process grid for chain reactions
    const { grid: finalGrid, totalLinesCleared } = processGrid(tempGrid);
    
    const newCombo = totalLinesCleared > 0 ? get().combo + 1 : get().combo;
    const extraScore = totalLinesCleared * POINTS.LINE_CLEARED * (newCombo > 0 ? newCombo : 1);

    // Audio + Haptic Feedback for Bomb
    playSkill();
    if (totalLinesCleared > 0) playClear(totalLinesCleared);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 150]);

    const newScore = score + (blocksDestroyed * 5) + extraScore;
    const newHighScore = Math.max(newScore, get().highScore);
    if (newHighScore > get().highScore) {
      localStorage.setItem('flux_highscore', newHighScore.toString());
    }

    set({
      grid: finalGrid,
      flux: flux - FLUX_COST.BOMB,
      score: newScore,
      highScore: newHighScore,
      combo: newCombo,
      activeSkill: null
    });
  },

  canPlacePiece: (grid, piece, startX, startY) => {
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col] === 1) {
          const gridY = startY + row;
          const gridX = startX + col;

          // Out of bounds
          if (gridY < 0 || gridY >= GRID_SIZE || gridX < 0 || gridX >= GRID_SIZE) {
            return false;
          }
          // Collision
          if (grid[gridY][gridX].filled) {
            return false;
          }
        }
      }
    }
    return true;
  },

  placePiece: (piece, startX, startY) => {
    const { grid, score, combo, flux, highScore, isSurgeActive } = get();
    
    // 1. Validate placement
    if (!get().canPlacePiece(grid, piece, startX, startY)) return false;

    // 2. Update Grid
    const tempGrid = grid.map(row => row.map(cell => ({ ...cell })));
    let blocksPlaced = 0;

    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col] === 1) {
          tempGrid[startY + row][startX + col] = {
            filled: true,
            color: piece.color,
            id: uuidv4(),
            type: piece.type || CellType.NORMAL,
            health: piece.type === CellType.ICE ? 2 : undefined
          };
          blocksPlaced++;
        }
      }
    }

    // 3. Process Grid
    const { grid: newGrid, totalLinesCleared: linesCleared, chainCount, colorBonus, bombsExploded } = processGrid(tempGrid);

    // Update Objectives
    const updatedObjectives = get().levelObjectives.map(obj => {
      let current = obj.current;
      if (obj.type === ObjectiveType.SCORE) current = score + Math.round(((blocksPlaced * POINTS.BLOCK_PLACED) + (linesCleared * POINTS.LINE_CLEARED)) * (linesCleared > 0 ? combo + 1 : 1));
      if (obj.type === ObjectiveType.CLEAR_LINES) current += linesCleared;
      if (obj.type === ObjectiveType.CHAIN_REACTION) current += chainCount;
      if (obj.type === ObjectiveType.USE_BOMB) current += bombsExploded;
      // Note: BREAK_ICE logic needs to be integrated into processGrid or here
      return { ...obj, current: Math.min(obj.target, current) };
    });

    const levelFinished = updatedObjectives.every(obj => obj.current >= obj.target);

    // Update Achievements
    const updatedAchievements = get().achievements.map(ach => {
      if (ach.unlocked) return ach;
      let val = ach.currentValue;
      if (ach.id === 'score_10k') val = Math.max(val, score);
      if (ach.id === 'combo_5') val = Math.max(val, combo > 0 ? combo + 1 : 0);
      return { ...ach, currentValue: val, unlocked: val >= ach.targetValue };
    });

    // Save achievements
    localStorage.setItem('flux_achievements', JSON.stringify(updatedAchievements));

    // Handle just unlocked achievement
    const newUnlock = updatedAchievements.find((ach, i) => ach.unlocked && !get().achievements[i].unlocked);

    // 4. Puan hesaplama
    const comboMultiplier = linesCleared > 0 ? combo + 1 : 0;

    // Renk bonusu: tek renk satır/sütun temizleme
    const colorBonusMultiplier = (linesCleared > 0 && colorBonus) ? POINTS.COLOR_BONUS_MULTIPLIER : 1;
    // Surge bonusu: flux=100 iken aktif
    const surgeMultiplier = (linesCleared > 0 && isSurgeActive) ? POINTS.SURGE_MULTIPLIER : 1;

    const basePoints = (blocksPlaced * POINTS.BLOCK_PLACED) +
                       (linesCleared * POINTS.LINE_CLEARED) +
                       (comboMultiplier * POINTS.COMBO_MULTIPLIER);
    const pointsGained = Math.round(basePoints * colorBonusMultiplier * surgeMultiplier);

    // lastAction güncelle
    if (linesCleared > 0) {
      set({ lastAction: {
        type: 'CLEAR',
        lines: linesCleared,
        combo: comboMultiplier,
        chainCount,
        colorBonus,
        surgeBonus: isSurgeActive,
      }});
    } else {
      set({ lastAction: { type: 'PLACE' } });
    }

    // Flux hesaplama
    const fluxGained = (blocksPlaced * 2) + (linesCleared * 10);
    const rawFlux = flux + fluxGained;
    const newFlux = Math.min(100, rawFlux);

    // Surge: flux 100'e ulaşırsa aktif et; eğer surge kullanıldıysa sıfırla
    const surgeWasUsed = isSurgeActive && linesCleared > 0;
    const surgeJustFilled = !isSurgeActive && rawFlux >= 100;
    const newIsSurgeActive = surgeJustFilled ? true : (surgeWasUsed ? false : isSurgeActive);
    const finalFlux = surgeWasUsed ? 0 : newFlux; // Surge kullanılınca flux sıfırlanır

    // 5. Tepsi güncelle
    let currentPieces = get().pieces.filter(p => p.instanceId !== piece.instanceId);
    if (currentPieces.length === 0) {
      currentPieces = getRandomPieces(3);
    }

    // Ses + Titresim
    if (linesCleared > 0) {
        playClear(linesCleared);
        if (comboMultiplier > 1) playCombo(comboMultiplier);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100]);
    } else {
        playPlace();
        if (navigator.vibrate) navigator.vibrate(20);
    }

    const newScore = score + pointsGained;
    if (newScore > highScore) {
      localStorage.setItem('flux_highscore', newScore.toString());
    }

    set({
      grid: newGrid,
      score: newScore,
      highScore: Math.max(newScore, highScore),
      combo: comboMultiplier,
      flux: finalFlux,
      isSurgeActive: newIsSurgeActive,
      pieces: currentPieces,
      movesLeft: get().movesLeft - 1,
      levelObjectives: updatedObjectives,
      isLevelComplete: levelFinished,
      achievements: updatedAchievements,
      unlockedAchievementId: newUnlock ? newUnlock.id : get().unlockedAchievementId
    });

    // Update Global Stats
    const currentStats = get().stats;
    const nextStats: GameStats = {
      ...currentStats,
      blocksPlaced: currentStats.blocksPlaced + blocksPlaced,
      linesCleared: currentStats.linesCleared + linesCleared,
      totalScore: currentStats.totalScore + pointsGained,
      bombsExploded: currentStats.bombsExploded + bombsExploded,
      // iceBroken: logic...
    };
    set({ stats: nextStats });
    localStorage.setItem('flux_stats', JSON.stringify(nextStats));

    if (levelFinished) {
      const nextMax = Math.max(get().maxLevelReached, get().currentLevelIndex + 1);
      set({ maxLevelReached: nextMax });
      localStorage.setItem('flux_max_level', nextMax.toString());
    }

    if (get().movesLeft <= 0 && !levelFinished) {
      set({ isGameOver: true });
    }

    get().checkGameOver();
    return true;
  },

  checkGameOver: () => {
    const { grid, pieces, activeSkill } = get();
    if (pieces.length === 0) return; // Should not happen due to refill logic

    // If we have a skill active (like Shatter), game is not over
    if (activeSkill === SkillType.SHATTER) return;

    // Check if ANY piece can fit ANYWHERE
    let canFitAny = false;
    for (const piece of pieces) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (get().canPlacePiece(grid, piece, x, y)) {
            canFitAny = true;
            break;
          }
        }
        if (canFitAny) break;
      }
      if (canFitAny) break;
    }

    if (!canFitAny) {
      playGameOver();
      set({ isGameOver: true });
    }
  },

  resetGame: () => {
    get().initGame();
  }
}));