import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Piece, PieceShape, GRID_SIZE, GridCell, SkillType, CellType, ObjectiveType, LevelObjective, Achievement } from '../types';
import { AppState, GameStats, GameMode } from '@shared/types';
import { SHAPES, POINTS, FLUX_COST, COLORS, STONE_BLOCK, ACHIEVEMENTS } from '../constants';
import { generateLevel } from '../../career/utils/levelGenerator';
import { playPlace, playClear, playCombo, playSkill, playGameOver, playSurgeStart, playSurgeEnd } from '../../../utils/audio';
import { handleError, safeExecute, ErrorCategory, ErrorSeverity } from '../../../utils/errorHandler';
import { debouncedSave, safeLocalStorageGet, safeParseInt, safeJSONParse } from './helpers/localStorage';
import { createEmptyGrid, processGrid } from './helpers/grid';
import { getRandomPieces } from './helpers/pieces';

export interface GameStore {
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
  gameMode: GameMode;
  timeLeft: number;
  highScores: { [key: string]: number };
  stats: GameStats;
  maxLevelReached: number;

  // ZEN Mode State
  zenSessionTime: number;    // Saniye cinsinden oynama süresi
  zenBlocksPlaced: number;   // Bu oturumda yerleştirilen blok sayısı

  // SURVIVAL Mode State
  survivalTime: number;           // Hayatta kalma süresi (saniye)
  survivalPushInterval: number;   // Şu anki satır gelme aralığı (saniye)
  survivalNextPush: number;       // Sonraki satır ne zaman gelecek (countdown)
  survivalRowCount: number;       // Kaç taş satır geldi toplam
  survivalHighScore: number;      // En iyi hayatta kalma süresi (saniye)

  // Actions
  initGame: (mode?: GameMode) => void;
  nextLevel: () => void;
  startLevel: (levelIndex: number) => void;
  setAppState: (state: AppState) => void;
  setGameMode: (mode: GameMode) => void;
  tickTimer: () => void;
  pushSurvivalRow: () => void;
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
  highScore: safeParseInt(safeLocalStorageGet('flux_highscore', '0')),
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
  achievements: safeJSONParse(safeLocalStorageGet('flux_achievements', JSON.stringify(ACHIEVEMENTS)), ACHIEVEMENTS),
  isLevelComplete: false,
  unlockedAchievementId: null,

  // Navigation & Persistence
  appState: AppState.HOME,
  gameMode: GameMode.CAREER,
  timeLeft: 0,
  highScores: safeJSONParse(safeLocalStorageGet('flux_highscores', '{}'), {}),
  stats: safeJSONParse(safeLocalStorageGet('flux_stats', JSON.stringify(INITIAL_STATS)), INITIAL_STATS),
  maxLevelReached: safeParseInt(safeLocalStorageGet('flux_max_level', '0')),

  // ZEN Mode Initial State
  zenSessionTime: 0,
  zenBlocksPlaced: 0,

  // SURVIVAL Mode Initial State
  survivalTime: 0,
  survivalPushInterval: 10,
  survivalNextPush: 10,
  survivalRowCount: 0,
  survivalHighScore: safeParseInt(safeLocalStorageGet('flux_survival_highscore', '0')),

  initGame: (mode = GameMode.CAREER) => {
    const success = safeExecute(
      () => {
        const firstLevel = generateLevel(1);
        const isTimed = mode === GameMode.TIMED;
        const isDaily = mode === GameMode.DAILY_CHALLENGE;
        const isZen = mode === GameMode.ZEN;
        const isBlitz = mode === GameMode.BLITZ;
        const isSurvival = mode === GameMode.SURVIVAL;
        const initialGrid = createEmptyGrid();
        
        set({
          grid: initialGrid,
          pieces: getRandomPieces(3, initialGrid, isDaily),
          score: 0,
          flux: 50,
          combo: 0,
          isGameOver: false,
          isSurgeActive: false,
          activeSkill: null,
          lastAction: null,
          currentLevelIndex: 1,
          movesLeft: mode === GameMode.CAREER ? (firstLevel.movesLimit || 0) : 999,
          levelObjectives: mode === GameMode.CAREER ? firstLevel.objectives.map(o => ({ ...o })) : [],
          isLevelComplete: false,
          unlockedAchievementId: null,
          appState: AppState.GAME,
          gameMode: mode,
          timeLeft: isTimed ? 60 : isBlitz ? 30 : 0,
          // ZEN mode initialization
          zenSessionTime: isZen ? 0 : get().zenSessionTime,
          zenBlocksPlaced: isZen ? 0 : get().zenBlocksPlaced,
          // SURVIVAL mode initialization
          survivalTime: isSurvival ? 0 : get().survivalTime,
          survivalPushInterval: isSurvival ? 10 : get().survivalPushInterval,
          survivalNextPush: isSurvival ? 10 : get().survivalNextPush,
          survivalRowCount: isSurvival ? 0 : get().survivalRowCount
        });
        
        // Increment games played
        const newStats = { ...get().stats, gamesPlayed: get().stats.gamesPlayed + 1 };
        set({ stats: newStats });
        localStorage.setItem('flux_stats', JSON.stringify(newStats));
        
        return true;
      },
      false,
      ErrorCategory.GAME_STATE,
      { operation: 'initGame', mode }
    );
    
    // Hata durumunda varsayılan duruma dön
    if (!success) {
      set({
        grid: createEmptyGrid(),
        pieces: [],
        score: 0,
        isGameOver: false,
        appState: AppState.HOME
      });
    }
  },

  startLevel: (levelIndex) => {
    // levelIndex is 1-indexed here, or we convert it if previously 0-indexed
    const nextIdx = Math.max(1, levelIndex);
    const levelDef = generateLevel(nextIdx);

    const initialGrid = createEmptyGrid();

    set({
      grid: initialGrid,
      pieces: getRandomPieces(3, initialGrid),
      score: 0,
      flux: 50,
      combo: 0,
      isGameOver: false,
      isSurgeActive: false,
      activeSkill: null,
      lastAction: null,
      currentLevelIndex: nextIdx,
      movesLeft: levelDef.movesLimit || 0,
      levelObjectives: levelDef.objectives.map(o => ({ ...o })),
      isLevelComplete: false,
      unlockedAchievementId: null,
      appState: AppState.GAME,
      gameMode: GameMode.CAREER,
      timeLeft: 0
    });
  },

  setAppState: (state) => set({ appState: state }),
  setGameMode: (mode) => set({ gameMode: mode }),

  tickTimer: () => {
    const { timeLeft, isGameOver, gameMode, appState } = get();
    
    // Guard: Oyun bittiyse veya oyun ekranında değilse işlem yapma
    if (isGameOver || appState !== AppState.GAME) return;
    
    safeExecute(
      () => {
        // ZEN modda session time'ı artır
        if (gameMode === GameMode.ZEN) {
          const newTime = get().zenSessionTime + 1;
          // Guard: Makul bir üst limit (24 saat = 86400 saniye)
          if (newTime < 86400) {
            set({ zenSessionTime: newTime });
          }
          return;
        }
        
        // SURVIVAL modda survival time'ı artır ve satır push logic'i
        if (gameMode === GameMode.SURVIVAL) {
          const newSurvivalTime = get().survivalTime + 1;
          const newNextPush = get().survivalNextPush - 1;
          
          // Guard: Makul bir üst limit (24 saat)
          if (newSurvivalTime < 86400) {
            set({ survivalTime: newSurvivalTime });
          }
          
          // Satır push zamanı geldi mi?
          if (newNextPush <= 0) {
            get().pushSurvivalRow();
          } else {
            set({ survivalNextPush: newNextPush });
          }
          
          // Zorluk artışı kontrolü
          let newInterval = get().survivalPushInterval;
          if (newSurvivalTime === 60 && newInterval > 8) {
            newInterval = 8;
            set({ survivalPushInterval: newInterval });
            playSkill();
          } else if (newSurvivalTime === 120 && newInterval > 6) {
            newInterval = 6;
            set({ survivalPushInterval: newInterval });
            playSkill();
          } else if (newSurvivalTime === 180 && newInterval > 5) {
            newInterval = 5;
            set({ survivalPushInterval: newInterval });
            playSkill();
          } else if (newSurvivalTime === 200 && newInterval > 4) {
            newInterval = 4;
            set({ survivalPushInterval: newInterval });
            playSkill();
          }
          
          return;
        }
        
        // TIMED ve BLITZ modda timer'ı azalt
        if (gameMode === GameMode.TIMED || gameMode === GameMode.BLITZ) {
          if (timeLeft <= 1) {
            // BLITZ modda kalan süre bonusu ekle
            if (gameMode === GameMode.BLITZ && timeLeft > 0) {
              const timeBonus = timeLeft * POINTS.BLITZ_TIME_BONUS;
              const newScore = get().score + timeBonus;
              set({ score: newScore, highScore: Math.max(newScore, get().highScore) });
            }
            playGameOver();
            set({ timeLeft: 0, isGameOver: true });
          } else {
            set({ timeLeft: timeLeft - 1 });
          }
        }
      },
      undefined,
      ErrorCategory.GAME_STATE,
      { operation: 'tickTimer', gameMode, timeLeft }
    );
  },

  pushSurvivalRow: () => {
    const { grid, isGameOver } = get();
    
    // Guard: Oyun zaten bittiyse işlem yapma
    if (isGameOver) return;
    
    // Guard: Grid geçerli mi kontrol et
    if (!grid || grid.length !== GRID_SIZE) {
      handleError(
        new Error('Invalid grid state in SURVIVAL mode'),
        ErrorCategory.GAME_STATE,
        ErrorSeverity.HIGH,
        { gridLength: grid?.length, expected: GRID_SIZE }
      );
      return;
    }
    
    // 1. Üst satırda blok var mı kontrol et (game over)
    const topRowFilled = grid[0].some(cell => cell.filled);
    if (topRowFilled) {
      // High score güncelle
      const currentTime = get().survivalTime;
      const currentHighScore = get().survivalHighScore;
      if (currentTime > currentHighScore) {
        set({ survivalHighScore: currentTime });
        debouncedSave('flux_survival_highscore', currentTime.toString());
      }
      playGameOver();
      set({ isGameOver: true });
      return;
    }
    
    const success = safeExecute(
      () => {
        // 2. Grid'i yukarı kaydır
        const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
        for (let y = 0; y < GRID_SIZE - 1; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            newGrid[y][x] = newGrid[y + 1][x];
          }
        }
        
        // 3. Alt satıra taş satırı ekle (1-3 random boşluk ile)
        const gapCount = Math.floor(Math.random() * 3) + 1;
        const gapPositions = new Set<number>();
        
        // Guard: Sonsuz döngü önleme
        let attempts = 0;
        while (gapPositions.size < gapCount && attempts < 100) {
          gapPositions.add(Math.floor(Math.random() * GRID_SIZE));
          attempts++;
        }
        
        for (let x = 0; x < GRID_SIZE; x++) {
          if (gapPositions.has(x)) {
            newGrid[GRID_SIZE - 1][x] = { filled: false, color: '' };
          } else {
            newGrid[GRID_SIZE - 1][x] = {
              filled: true,
              color: STONE_BLOCK.color,
              id: uuidv4(),
              type: CellType.STONE
            };
          }
        }
        
        // 4. State'i güncelle
        const newRowCount = get().survivalRowCount + 1;
        const newNextPush = get().survivalPushInterval;
        
        set({
          grid: newGrid,
          survivalRowCount: newRowCount,
          survivalNextPush: newNextPush
        });
        
        // 5. Ses ve titreşim
        playClear(1);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        
        return true;
      },
      false,
      ErrorCategory.GAME_STATE,
      { operation: 'pushSurvivalRow', survivalTime: get().survivalTime }
    );
    
    // Hata durumunda oyunu bitir
    if (!success) {
      playGameOver();
      set({ isGameOver: true });
    }
  },

  nextLevel: () => {
    // If currentLevelIndex is somehow 0 from old saves, bump to 1
    const nextIdx = Math.max(1, get().currentLevelIndex + 1);

    const nextLevelDef = generateLevel(nextIdx);
    const initialGrid = createEmptyGrid();
    const isDaily = get().gameMode === GameMode.DAILY_CHALLENGE;
    
    set({
      grid: initialGrid,
      pieces: getRandomPieces(3, initialGrid, isDaily),
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
          pieces: getRandomPieces(3, get().grid, get().gameMode === GameMode.DAILY_CHALLENGE),
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
      debouncedSave('flux_highscore', newHighScore.toString());
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
      debouncedSave('flux_highscore', newHighScore.toString());
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
    const { grid, score, combo, flux, highScore, isSurgeActive, gameMode } = get();
    
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
    const { grid: newGrid, totalLinesCleared: linesCleared, chainCount, colorBonus, bombsExploded, iceBroken } = processGrid(tempGrid);

    // ZEN mode: Blok sayısını artır
    if (gameMode === GameMode.ZEN) {
      set({ zenBlocksPlaced: get().zenBlocksPlaced + 1 });
    }

    // 4. Puan hesaplama (ZEN modda skip edilir)
    // Combo: eğer satır temizlendiyse artır, yoksa 0
    const newCombo = linesCleared > 0 ? combo + 1 : 0;
    const comboMultiplier = newCombo;

    // Renk bonusu: tek renk satır/sütun temizleme
    const colorBonusMultiplier = (linesCleared > 0 && colorBonus) ? POINTS.COLOR_BONUS_MULTIPLIER : 1;
    // Surge bonusu: flux=100 iken aktif
    const surgeMultiplier = (linesCleared > 0 && isSurgeActive) ? POINTS.SURGE_MULTIPLIER : 1;

    const basePoints = (blocksPlaced * POINTS.BLOCK_PLACED) +
                       (linesCleared * POINTS.LINE_CLEARED) +
                       (comboMultiplier * POINTS.COMBO_MULTIPLIER);
    const pointsGained = Math.round(basePoints * colorBonusMultiplier * surgeMultiplier);
    
    // ZEN modda skor güncellenmez
    const newScore = gameMode === GameMode.ZEN ? 0 : (score + pointsGained);

    // 5. Update Objectives (TEK SEFERDE, yeni score ile)
    const updatedObjectives = get().levelObjectives.map(obj => {
      let current = obj.current;
      if (obj.type === ObjectiveType.SCORE) current = newScore;
      if (obj.type === ObjectiveType.CLEAR_LINES) current += linesCleared;
      if (obj.type === ObjectiveType.CHAIN_REACTION) current += chainCount;
      if (obj.type === ObjectiveType.USE_BOMB) current += bombsExploded;
      if (obj.type === ObjectiveType.BREAK_ICE) current += iceBroken;
      return { ...obj, current: Math.min(obj.target, current) };
    });

    const levelFinished = updatedObjectives.every(obj => obj.current >= obj.target);

    // Update Achievements
    const updatedAchievements = get().achievements.map(ach => {
      if (ach.unlocked) return ach;
      let val = ach.currentValue;
      if (ach.id === 'score_10k') val = Math.max(val, newScore);
      if (ach.id === 'combo_5') val = Math.max(val, newCombo);
      return { ...ach, currentValue: val, unlocked: val >= ach.targetValue };
    });

    // Save achievements (debounced)
    debouncedSave('flux_achievements', JSON.stringify(updatedAchievements));

    // Handle just unlocked achievement
    const newUnlock = updatedAchievements.find((ach, i) => ach.unlocked && !get().achievements[i].unlocked);

    // lastAction güncelle

    // Update Achievements
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

    if (surgeJustFilled) {
      playSurgeStart();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Haptic for surge start
    } else if (surgeWasUsed) {
      playSurgeEnd();
      // Optional haptic for surge end
    }

    // 5. Tepsi güncelle
    let currentPieces = get().pieces.filter(p => p.instanceId !== piece.instanceId);
    if (currentPieces.length === 0) {
      const isDaily = get().gameMode === GameMode.DAILY_CHALLENGE;
      currentPieces = getRandomPieces(3, newGrid, isDaily); // Use newGrid for density calculation
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

    const modeKey = get().gameMode;
    const currentHighs = get().highScores;
    const oldHigh = currentHighs[modeKey] || 0;
    
    if (newScore > oldHigh) {
      const newHighs = { ...currentHighs, [modeKey]: newScore };
      set({ highScores: newHighs });
      debouncedSave('flux_highscores', JSON.stringify(newHighs));
      debouncedSave('flux_highscore', newScore.toString());
    }

    // Time Reward logic
    let extraTime = 0;
    const previousCombo = combo; // Önceki combo değerini sakla
    
    if (get().gameMode === GameMode.TIMED && linesCleared > 0) {
      extraTime = linesCleared * 6; // 6 sec per line
      if (comboMultiplier > 1) extraTime += comboMultiplier * 3;
      if (isSurgeActive) extraTime *= 1.5;
    }
    
    // BLITZ mode time logic
    if (get().gameMode === GameMode.BLITZ) {
      if (linesCleared > 0) {
        extraTime = linesCleared * 2; // +2 saniye per line
        if (comboMultiplier > 1) extraTime += 0.5; // +0.5 saniye per combo
      }
      // Combo kırılma cezası: önceki combo > 0 ama şimdi 0 ise
      if (previousCombo > 0 && newCombo === 0) {
        extraTime = -1; // -1 saniye ceza
      }
      // Timer'ı 60 saniyede cap'le
      const newTimeLeft = Math.min(60, Math.max(0, get().timeLeft + extraTime));
      extraTime = newTimeLeft - get().timeLeft; // Gerçek değişimi hesapla
    }

    // Calculate new movesLeft - only decrement in CAREER mode
    const newMovesLeft = get().gameMode === GameMode.CAREER ? (get().movesLeft - 1) : get().movesLeft;

    set({
      grid: newGrid,
      score: newScore,
      highScore: Math.max(newScore, get().highScore),
      combo: newCombo, // Use newCombo instead of comboMultiplier
      flux: finalFlux,
      isSurgeActive: newIsSurgeActive,
      pieces: currentPieces,
      movesLeft: newMovesLeft,
      timeLeft: Math.min(99, get().timeLeft + extraTime),
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
      iceBroken: currentStats.iceBroken + iceBroken,
    };
    set({ stats: nextStats });
    debouncedSave('flux_stats', JSON.stringify(nextStats));

    if (levelFinished) {
      const nextMax = Math.max(get().maxLevelReached, get().currentLevelIndex + 1);
      set({ maxLevelReached: nextMax });
      debouncedSave('flux_max_level', nextMax.toString());
      
      // Apply reward flux
      const currentLevelDef = generateLevel(get().currentLevelIndex);
      if (currentLevelDef.rewardFlux) {
        const newFluxWithReward = Math.min(100, finalFlux + currentLevelDef.rewardFlux);
        set({ flux: newFluxWithReward });
      }
    }

    // Only check movesLeft for CAREER mode
    if (get().gameMode === GameMode.CAREER && get().movesLeft <= 0 && !levelFinished) {
      set({ isGameOver: true });
    }

    get().checkGameOver();
    return true;
  },

  checkGameOver: () => {
    const { grid, pieces, activeSkill, gameMode } = get();
    
    // ZEN modda oyun hiç bitmez
    if (gameMode === GameMode.ZEN) return;
    
    // SURVIVAL modda üst satır kontrolü pushSurvivalRow'da yapılıyor
    // Burada sadece piece placement kontrolü yapıyoruz
    
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
      // SURVIVAL modda high score güncelle
      if (gameMode === GameMode.SURVIVAL) {
        const currentTime = get().survivalTime;
        const currentHighScore = get().survivalHighScore;
        if (currentTime > currentHighScore) {
          set({ survivalHighScore: currentTime });
          debouncedSave('flux_survival_highscore', currentTime.toString());
        }
      }
      playGameOver();
      set({ isGameOver: true });
    }
  },

  resetGame: () => {
    get().initGame();
  }
}));