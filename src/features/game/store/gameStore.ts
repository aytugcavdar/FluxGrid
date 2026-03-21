import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Piece, PieceShape, GRID_SIZE, GridCell, SkillType, CellType, ObjectiveType, LevelObjective, Achievement } from '../types';
import { AppState, GameStats, GameMode } from '@shared/types';
import { SHAPES, POINTS, FLUX_COST, COLORS, STONE_BLOCK, EXPANDED_ACHIEVEMENTS, ZEN_PALETTES, TIER_SCORE_MULTIPLIERS } from '../constants';
import { generateLevel } from '../../career/utils/levelGenerator';
import { playPlace, playClear, playCombo, playSkill, playGameOver, playSurgeStart, playSurgeEnd, playTick, playHaptic } from '../../../utils/audio';
import { handleError, safeExecute, ErrorCategory, ErrorSeverity } from '../../../utils/errorHandler';
import { debouncedSave, safeLocalStorageGet, safeParseInt, safeJSONParse } from './helpers/localStorage';
import { createEmptyGrid, processGrid } from './helpers/grid';
import { getRandomPieces, getRandomPiecesSync } from './helpers/pieces';
import { useThemeStore } from '@shared/store/themeStore';

// Difficulty tier constants for Endless mode
const DIFFICULTY_THRESHOLDS = [0, 2000, 5000, 10000, 20000];
const TIER_NAMES = ['Başlangıç', 'Orta', 'Zor', 'Uzman', 'Efsane'];

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
    type: 'PLACE' | 'CLEAR' | 'MILESTONE';
    lines?: number;
    combo?: number;
    chainCount?: number;            // Kaç zincir dalgası oluştu
    colorBonus?: boolean;           // Tek renkli temizleme bonusu mu?
    surgeBonus?: boolean;           // Surge modu aktif miydi?
    tier?: number;                  // Zorluk seviyesi (MILESTONE için)
    tierName?: string;              // Zorluk seviyesi adı (MILESTONE için)
  } | null;
  
  // Level & Achievements State
  currentLevelIndex: number;
  movesLeft: number;
  levelObjectives: LevelObjective[];
  achievements: Achievement[];
  isLevelComplete: boolean;
  unlockedAchievementId: string | null;
  earnedStars: number;              // Stars earned in current level

  // Navigation & Persistence
  appState: AppState;
  gameMode: GameMode;
  timeLeft: number;
  highScores: { [key: string]: number };
  stats: GameStats;
  maxLevelReached: number;
  difficultyTier: number;           // Endless mode zorluk seviyesi (0-4)

  // ZEN Mode State
  zenSessionTime: number;    // Saniye cinsinden oynama süresi
  zenBlocksPlaced: number;   // Bu oturumda yerleştirilen blok sayısı
  zenPaletteIndex: number;   // 0-3 arası, her 10 satırda değişir

  // SURVIVAL Mode State
  survivalTime: number;           // Hayatta kalma süresi (saniye)
  survivalPushInterval: number;   // Şu anki satır gelme aralığı (saniye)
  survivalNextPush: number;       // Sonraki satır ne zaman gelecek (countdown)
  survivalRowCount: number;       // Kaç taş satır geldi toplam
  survivalHighScore: number;      // En iyi hayatta kalma süresi (saniye)

  // Daily Challenge State
  dailyClearHistory: boolean[][]; // Her hamledeki temizleme pattern'i (true = o hücre temizlendi)

  // Guided Experience State (First-time player tutorial)
  isFirstGame: boolean;           // İlk oyun mu?
  guidedStep: number;             // 0 = kapalı, 1-4 = adım numarası
  guidedTarget: { x: number; y: number; pieceIndex: number } | null; // Hedef pozisyon

  // Boss Level State
  bossType: string | null;        // Aktif boss tipi
  bossMoveCounter: number;        // Boss mekanik sayacı

  // Event System State
  activeEvent: 'ICE_STORM' | 'DARKNESS' | 'QUAKE' | 'MIRROR' | null;
  eventMovesRemaining: number;
  darkZoneCells: Array<{row: number; col: number}>;

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
  advanceGuidedStep: () => void;
  completeGuidedMode: () => void;
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
  achievements: safeJSONParse(safeLocalStorageGet('flux_achievements', JSON.stringify(EXPANDED_ACHIEVEMENTS)), EXPANDED_ACHIEVEMENTS),
  isLevelComplete: false,
  unlockedAchievementId: null,
  earnedStars: 0,

  // Navigation & Persistence
  appState: AppState.HOME,
  gameMode: GameMode.CAREER,
  timeLeft: 0,
  highScores: safeJSONParse(safeLocalStorageGet('flux_highscores', '{}'), {}),
  stats: safeJSONParse(safeLocalStorageGet('flux_stats', JSON.stringify(INITIAL_STATS)), INITIAL_STATS),
  maxLevelReached: safeParseInt(safeLocalStorageGet('flux_max_level', '0')),
  difficultyTier: 0,

  // ZEN Mode Initial State
  zenSessionTime: 0,
  zenBlocksPlaced: 0,
  zenPaletteIndex: 0,

  // SURVIVAL Mode Initial State
  survivalTime: 0,
  survivalPushInterval: 10,
  survivalNextPush: 10,
  survivalRowCount: 0,
  survivalHighScore: safeParseInt(safeLocalStorageGet('flux_survival_highscore', '0')),

  // Daily Challenge Initial State
  dailyClearHistory: [],

  // Guided Experience Initial State
  isFirstGame: false,
  guidedStep: 0,
  guidedTarget: null,

  // Boss Level Initial State
  bossType: null,
  bossMoveCounter: 0,

  // Event System Initial State
  activeEvent: null,
  eventMovesRemaining: 0,
  darkZoneCells: [],

  initGame: (mode = GameMode.CAREER) => {
    const success = safeExecute(
      () => {
        const firstLevel = generateLevel(1);
        const isTimed = mode === GameMode.TIMED;
        const isDaily = mode === GameMode.DAILY_CHALLENGE;
        const isZen = mode === GameMode.ZEN;
        const isSurvival = mode === GameMode.SURVIVAL;
        const initialGrid = createEmptyGrid();
        
        // Check if this is the first game (onboarding)
        const isOnboarding = safeLocalStorageGet('flux_onboard_v1', '') !== 'true';
        
        set({
          grid: initialGrid,
          pieces: getRandomPiecesSync(3, initialGrid, isDaily, isZen ? ZEN_PALETTES[0] : useThemeStore.getState().getPieceColors(), 0),
          score: 0,
          flux: isZen ? 100 : 50,
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
          timeLeft: isTimed ? 60 : 0,
          difficultyTier: 0,
          // ZEN mode initialization
          zenSessionTime: isZen ? 0 : get().zenSessionTime,
          zenBlocksPlaced: isZen ? 0 : get().zenBlocksPlaced,
          zenPaletteIndex: isZen ? 0 : get().zenPaletteIndex,
          // SURVIVAL mode initialization
          survivalTime: isSurvival ? 0 : get().survivalTime,
          survivalPushInterval: isSurvival ? 10 : get().survivalPushInterval,
          survivalNextPush: isSurvival ? 10 : get().survivalNextPush,
          survivalRowCount: isSurvival ? 0 : get().survivalRowCount,
          // Daily Challenge initialization
          dailyClearHistory: [],
          // Guided Experience initialization
          isFirstGame: isOnboarding,
          guidedStep: isOnboarding ? 1 : 0,
          guidedTarget: null,
          // Boss Level initialization
          bossType: null,
          bossMoveCounter: 0,
          // Event System initialization
          activeEvent: null,
          eventMovesRemaining: 0,
          darkZoneCells: []
        });
        
        // Calculate guided target for first piece if this is onboarding
        if (isOnboarding) {
          const pieces = get().pieces;
          if (pieces.length > 0) {
            const targetPiece = pieces[0];
            // Find first valid position (bottom-left corner preferred)
            let target: { x: number; y: number; pieceIndex: number } | null = null;
            const canPlace = get().canPlacePiece;
            outer: for (let y = GRID_SIZE - 1; y >= 0; y--) {
              for (let x = 0; x < GRID_SIZE; x++) {
                if (canPlace(initialGrid, targetPiece, x, y)) {
                  target = { x, y, pieceIndex: 0 };
                  break outer;
                }
              }
            }
            set({ guidedTarget: target });
          }
        }
        
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
      pieces: getRandomPiecesSync(3, initialGrid, false, useThemeStore.getState().getPieceColors(), 0),
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
      timeLeft: 0,
      bossType: levelDef.bossType ?? null,
      bossMoveCounter: 0
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
        
        // TIMED modda timer'ı azalt
        if (gameMode === GameMode.TIMED) {
          // Play tick sound for last 10 seconds
          if (timeLeft <= 10 && timeLeft > 0) {
            playTick();
          }
          
          if (timeLeft <= 1) {
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
        playHaptic('clear');
        
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
      pieces: getRandomPiecesSync(3, initialGrid, isDaily, useThemeStore.getState().getPieceColors(), 0),
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
        const currentTier = get().gameMode === GameMode.ENDLESS ? get().difficultyTier : 0;
        set({
          flux: flux - FLUX_COST.REROLL,
          pieces: getRandomPiecesSync(3, get().grid, get().gameMode === GameMode.DAILY_CHALLENGE, useThemeStore.getState().getPieceColors(), currentTier),
          activeSkill: null
        });
        
        // Sync to profileStore
        import('../../profile/store/profileStore').then(({ useProfileStore }) => {
          useProfileStore.getState().incrementSkillUse('REROLL' as any);
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
    playHaptic('skill');

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
    
    // Sync to profileStore
    import('../../profile/store/profileStore').then(({ useProfileStore }) => {
      useProfileStore.getState().incrementSkillUse('SHATTER' as any);
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
    playHaptic('skill');

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
    
    // Sync to profileStore
    import('../../profile/store/profileStore').then(({ useProfileStore }) => {
      useProfileStore.getState().incrementSkillUse('BOMB' as any);
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
    
    // Store the placed piece for boss mechanics (before it's removed from pieces array)
    const justPlacedPiece = piece;
    
    // Grid validation
    if (!grid || grid.length !== GRID_SIZE) {
      console.error('placePiece: invalid grid state');
      return false;
    }
    
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
    // ZEN modda blok sayısını artır ve palette rotation kontrol et
    if (gameMode === GameMode.ZEN) {
      set({ zenBlocksPlaced: get().zenBlocksPlaced + 1 });
      
      // Palette rotation: her 10 satırda bir palet değiştir
      if (linesCleared > 0) {
        const currentStats = get().stats;
        const totalLines = currentStats.linesCleared + linesCleared;
        const newPaletteIndex = Math.floor(totalLines / 10) % ZEN_PALETTES.length;
        
        if (newPaletteIndex !== get().zenPaletteIndex) {
          set({ zenPaletteIndex: newPaletteIndex });
        }
      }
    }

    // 4. Puan hesaplama (ZEN modda skip edilir)
    // Combo: ZEN'de combo sıfırlanmaz, diğer modlarda satır temizlenmezse sıfırlanır
    const newCombo = gameMode === GameMode.ZEN 
      ? combo + (linesCleared > 0 ? 1 : 0)
      : (linesCleared > 0 ? combo + 1 : 0);
    const comboMultiplier = newCombo;

    // Renk bonusu: tek renk satır/sütun temizleme
    const colorBonusMultiplier = (linesCleared > 0 && colorBonus) ? POINTS.COLOR_BONUS_MULTIPLIER : 1;
    // Surge bonusu: flux=100 iken aktif
    const surgeMultiplier = (linesCleared > 0 && isSurgeActive) ? POINTS.SURGE_MULTIPLIER : 1;
    // Tier çarpanı: Endless modda zorluk seviyesine göre
    const tierMultiplier = gameMode === GameMode.ENDLESS
      ? (TIER_SCORE_MULTIPLIERS[get().difficultyTier] ?? 1.0)
      : 1.0;

    const basePoints = (blocksPlaced * POINTS.BLOCK_PLACED) +
                       (linesCleared * POINTS.LINE_CLEARED) +
                       (comboMultiplier * POINTS.COMBO_MULTIPLIER);
    const pointsGained = Math.round(basePoints * colorBonusMultiplier * surgeMultiplier * tierMultiplier);
    
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

    // Update Achievements - handle all categories
    const updatedAchievements = get().achievements.map(ach => {
      if (ach.unlocked) return ach;
      let val = ach.currentValue;
      
      // SCORE category
      if (ach.category === 'SCORE') {
        val = Math.max(val, newScore);
      }
      
      // COMBO category
      if (ach.category === 'COMBO') {
        val = Math.max(val, newCombo);
      }
      
      // SPECIAL_BLOCKS category
      if (ach.category === 'SPECIAL_BLOCKS') {
        if (ach.id === 'bomb_10') val += bombsExploded;
        if (ach.id === 'ice_50') val += iceBroken;
        // Add other special block tracking as needed
      }
      
      // PROGRESSION category
      if (ach.category === 'PROGRESSION') {
        if (ach.id === 'level_10' || ach.id === 'level_25' || ach.id === 'level_50') {
          val = Math.max(val, get().currentLevelIndex);
        }
      }
      
      // Legacy achievement IDs (for backward compatibility)
      if (ach.id === 'score_10k') val = Math.max(val, newScore);
      if (ach.id === 'combo_5') val = Math.max(val, newCombo);
      if (ach.id === 'bomb_expert') val += bombsExploded;
      
      return { ...ach, currentValue: val, unlocked: val >= ach.targetValue };
    });

    // Save achievements (debounced)
    debouncedSave('flux_achievements', JSON.stringify(updatedAchievements));

    // Handle just unlocked achievement
    const newUnlock = updatedAchievements.find((ach, i) => ach.unlocked && !get().achievements[i].unlocked);
    
    // Sync achievement to Firestore
    if (newUnlock) {
      import('../../../services/firebase/syncManager').then(({ syncAchievement }) => {
        import('../../auth/store/authStore').then(({ useAuthStore }) => {
          const user = useAuthStore.getState().user;
          if (user) {
            syncAchievement(user.uid, {
              ...newUnlock,
              unlockedAt: newUnlock.unlocked ? Date.now() : null,
            }).catch(console.error);
          }
        });
      });
    }

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
      
      // Daily Challenge: Track clear history for sharing
      if (gameMode === GameMode.DAILY_CHALLENGE) {
        const snapshot = new Array(linesCleared)
          .fill(null)
          .map(() => new Array(4).fill(null).map(() => Math.random() > 0.3));
        set({ dailyClearHistory: [...get().dailyClearHistory, ...snapshot].slice(-6) });
      }
    } else {
      set({ lastAction: { type: 'PLACE' } });
    }

    // Flux hesaplama
    const fluxGained = (blocksPlaced * 2) + (linesCleared * 10);
    const rawFlux = flux + fluxGained;
    const newFlux = Math.min(100, rawFlux);

    // Surge: flux 100'e ulaşırsa aktif et; eğer surge kullanıldıysa sıfırla
    // ZEN modda surge yok, flux her zaman 100
    const surgeWasUsed = isSurgeActive && linesCleared > 0;
    const surgeJustFilled = !isSurgeActive && rawFlux >= 100;
    const newIsSurgeActive = gameMode === GameMode.ZEN ? false : (surgeJustFilled ? true : (surgeWasUsed ? false : isSurgeActive));
    const finalFlux = gameMode === GameMode.ZEN ? 100 : (surgeWasUsed ? 0 : newFlux); // ZEN'de flux her zaman 100

    if (surgeJustFilled && gameMode !== GameMode.ZEN) {
      playSurgeStart();
      playHaptic('surge');
    } else if (surgeWasUsed) {
      playSurgeEnd();
    }

    // 5. Tepsi güncelle
    let currentPieces = get().pieces.filter(p => p.instanceId !== piece.instanceId);
    if (currentPieces.length === 0) {
      const isDaily = get().gameMode === GameMode.DAILY_CHALLENGE;
      const isZen = get().gameMode === GameMode.ZEN;
      const zenPalette = isZen ? ZEN_PALETTES[get().zenPaletteIndex] : undefined;
      const currentTier = get().gameMode === GameMode.ENDLESS ? get().difficultyTier : 0;
      currentPieces = getRandomPiecesSync(3, newGrid, isDaily, zenPalette ?? useThemeStore.getState().getPieceColors(), currentTier); // Use newGrid for density calculation
    }

    // Ses + Titresim
    if (linesCleared > 0) {
        playClear(linesCleared);
        if (comboMultiplier > 1) playCombo(comboMultiplier);
        playHaptic(linesCleared > 1 ? 'clear_multi' : 'clear');
    } else {
        playPlace();
        playHaptic('place');
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
    
    // TIMED mode time logic
    if (get().gameMode === GameMode.TIMED) {
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

    // Sync maxLevelReached to Firestore when level is completed
    if (levelFinished && gameMode === GameMode.CAREER) {
      const newMaxLevel = Math.max(get().currentLevelIndex, get().maxLevelReached);
      if (newMaxLevel > get().maxLevelReached) {
        set({ maxLevelReached: newMaxLevel });
        debouncedSave('flux_max_level', newMaxLevel.toString());
        
        // Sync to Firestore
        import('../../../services/firebase/syncManager').then(({ syncGameData }) => {
          import('../../auth/store/authStore').then(({ useAuthStore }) => {
            const user = useAuthStore.getState().user;
            if (user) {
              syncGameData(user.uid, { 
                progression: { 
                  maxLevelReached: newMaxLevel,
                  currentStreak: 0,
                  longestStreak: 0,
                  lastDailyDate: null,
                } 
              }).catch(err => 
                console.error('Failed to sync maxLevelReached:', err)
              );
            }
          });
        });
      }
    }

    // Check difficulty tier progression (Endless mode only)
    if (gameMode === GameMode.ENDLESS) {
      const newTier = DIFFICULTY_THRESHOLDS.filter(t => newScore >= t).length - 1;
      const currentTier = get().difficultyTier;
      
      if (newTier !== currentTier && newTier >= 0 && newTier < TIER_NAMES.length) {
        set({ 
          difficultyTier: newTier,
          lastAction: { 
            type: 'MILESTONE', 
            tier: newTier, 
            tierName: TIER_NAMES[newTier] 
          } 
        });
      }
    }

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
      const currentLevelDef = generateLevel(get().currentLevelIndex);
      const targetScore = currentLevelDef.objectives.find(o => o.type === ObjectiveType.SCORE)?.target ?? 1000;
      const thresholds = currentLevelDef.starThresholds ?? [targetScore, targetScore * 1.5, targetScore * 2];
      const [t1, t2, t3] = thresholds;
      const earnedStars = newScore >= t3 ? 3 : newScore >= t2 ? 2 : newScore >= t1 ? 1 : 0;
      
      // Update max level reached
      const nextMax = Math.max(get().maxLevelReached, get().currentLevelIndex + 1);
      set({ maxLevelReached: nextMax });
      debouncedSave('flux_max_level', nextMax.toString());
      
      // Save level stars progress
      const progressKey = `flux_level_${get().currentLevelIndex}_stars`;
      const existingStars = safeParseInt(safeLocalStorageGet(progressKey, '0'));
      if (earnedStars > existingStars) {
        debouncedSave(progressKey, earnedStars.toString());
      }
      
      // Set earned stars in state
      set({ earnedStars });
      
      // Apply reward flux
      if (currentLevelDef.rewardFlux) {
        const newFluxWithReward = Math.min(100, finalFlux + currentLevelDef.rewardFlux);
        set({ flux: newFluxWithReward });
      }
    }

    // Only check movesLeft for CAREER mode
    if (get().gameMode === GameMode.CAREER && get().movesLeft <= 0 && !levelFinished) {
      set({ isGameOver: true });
    }

    // Check for tier events (Endless mode)
    
    // checkTierEvent helper function (inline)
    const checkTierEvent = (score: number, currentTier: number) => {
      const TIER_THRESHOLDS = [0, 2000, 5000, 10000, 20000];
      const TIER_EVENTS = ['ICE_STORM', 'DARKNESS', 'QUAKE', 'MIRROR'];
      
      const newTier = TIER_THRESHOLDS.filter(t => score >= t).length - 1;
      
      if (newTier > currentTier && newTier >= 1 && newTier <= 4) {
        const eventName = TIER_EVENTS[newTier - 1];
        
        const duration = eventName === 'MIRROR' ? 15
          : eventName === 'DARKNESS' ? 8
          : eventName === 'QUAKE' ? 1
          : 5;  // ICE_STORM
        
        set({
          activeEvent: eventName as any,
          eventMovesRemaining: duration,
          difficultyTier: newTier
        });
        
        // QUAKE için anında uygula - temiz gravity-left algoritması
        if (eventName === 'QUAKE') {
          const quakeGrid = get().grid.map(row => row.map(cell => ({ ...cell })));
          
          // Her satır için ayrı ayrı işle
          for (let r = 0; r < GRID_SIZE; r++) {
            // 1. Sabit blokları (ICE/STONE) ve hareketli blokları ayır
            const fixedBlocks: Array<{ col: number; cell: any }> = [];
            const floatingBlocks: any[] = [];
            
            for (let c = 0; c < GRID_SIZE; c++) {
              const cell = quakeGrid[r][c];
              if (cell.filled) {
                if (cell.type === CellType.ICE || cell.type === CellType.STONE) {
                  fixedBlocks.push({ col: c, cell: { ...cell } });
                } else {
                  floatingBlocks.push({ ...cell });
                }
              }
            }
            
            // 2. Satırı temizle
            for (let c = 0; c < GRID_SIZE; c++) {
              quakeGrid[r][c] = { filled: false, color: '' };
            }
            
            // 3. Sabit blokları orijinal pozisyonlarına yerleştir
            fixedBlocks.forEach(({ col, cell }) => {
              quakeGrid[r][col] = cell;
            });
            
            // 4. Hareketli blokları soldan başlayarak doldur (sabit pozisyonları atla)
            let writeIndex = 0;
            for (const block of floatingBlocks) {
              // Bir sonraki boş pozisyonu bul
              while (writeIndex < GRID_SIZE && quakeGrid[r][writeIndex].filled) {
                writeIndex++;
              }
              
              // Eğer grid'in sonuna geldiyse, blok düşer (kaybolur)
              if (writeIndex >= GRID_SIZE) break;
              
              quakeGrid[r][writeIndex] = block;
              writeIndex++;
            }
          }
          
          set({ grid: quakeGrid });
        }
        
        // DARKNESS için karanlık zone belirle
        if (eventName === 'DARKNESS') {
          const startRow = Math.floor(Math.random() * 4);
          const startCol = Math.floor(Math.random() * 5);
          const cells: Array<{row: number; col: number}> = [];
          for (let r = startRow; r < startRow + 2; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
              cells.push({ row: r, col: c });
            }
          }
          set({ darkZoneCells: cells });
        }
      }
    };
    
    checkTierEvent(newScore, get().difficultyTier);

    // --- Aktif olay tick ---
    const { activeEvent, eventMovesRemaining } = get();
    if (activeEvent && eventMovesRemaining > 0) {
      if (activeEvent === 'ICE_STORM') {
        // Rastgele boş bir hücreye buz bloğu ekle
        const emptyPositions: {x: number; y: number}[] = [];
        const currentGrid = get().grid;
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (!currentGrid[y][x].filled) emptyPositions.push({ x, y });
          }
        }
        if (emptyPositions.length > 0) {
          const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
          const iceGrid = get().grid.map(row => row.map(c => ({ ...c })));
          iceGrid[pos.y][pos.x] = {
            filled: true,
            color: '#7dd3fc',
            id: uuidv4(),
            type: CellType.ICE,
            health: 2,
          };
          set({ grid: iceGrid });
        }
      }
      
      if (activeEvent === 'MIRROR') {
        const mirrorShape = piece.shape.map((row: number[]) => [...row].reverse());
        const currentGrid = get().grid;
        
        // Tüm geçerli pozisyonları bul, en alttaki + en sağdaki tercih et
        let bestPos: { x: number; y: number } | null = null;
        let bestScore = -1;
        
        for (let y = 0; y <= GRID_SIZE - mirrorShape.length; y++) {
          for (let x = 0; x <= GRID_SIZE - mirrorShape[0].length; x++) {
            // Basit çakışma kontrolü — canPlacePiece yerine elle kontrol
            let fits = true;
            for (let dy = 0; dy < mirrorShape.length && fits; dy++) {
              for (let dx = 0; dx < mirrorShape[0].length && fits; dx++) {
                if (mirrorShape[dy][dx] === 1) {
                  const gy = y + dy, gx = x + dx;
                  if (gy >= GRID_SIZE || gx >= GRID_SIZE || currentGrid[gy][gx].filled) {
                    fits = false;
                  }
                }
              }
            }
            
            if (!fits) continue;
            
            // Skor: aşağı ve sağda olması tercih edilsin (oyuncunun yerleştirdiği yerin uzağı)
            const score = y * 10 + x;
            if (score > bestScore) {
              bestScore = score;
              bestPos = { x, y };
            }
          }
        }
        
        if (bestPos) {
          const mirrorGrid = currentGrid.map((row: any[]) => row.map((c: any) => ({ ...c })));
          mirrorShape.forEach((row: number[], dy: number) =>
            row.forEach((v: number, dx: number) => {
              if (v) {
                mirrorGrid[bestPos!.y + dy][bestPos!.x + dx] = {
                  filled: true,
                  color: piece.color,
                  id: uuidv4(),
                  type: CellType.NORMAL,
                };
              }
            })
          );
          
          // processGrid çalıştır — satır temizleme olabilir
          const { grid: processedMirrorGrid } = processGrid(mirrorGrid);
          set({ grid: processedMirrorGrid });
        }
      }
      
      // Sayacı azalt, olay bittiyse temizle
      const newRemaining = eventMovesRemaining - 1;
      if (newRemaining <= 0) {
        set({ activeEvent: null, eventMovesRemaining: 0, darkZoneCells: [] });
      } else {
        set({ eventMovesRemaining: newRemaining });
      }
    }

    get().checkGameOver();
    
    // Boss Mechanics - Apply after piece placement
    const { bossType, bossMoveCounter, gameMode: currentGameMode } = get();
    if (bossType && currentGameMode === GameMode.CAREER) {
      const newBossCounter = bossMoveCounter + 1;
      set({ bossMoveCounter: newBossCounter });
      
      switch (bossType) {
        case 'ICE_STORM':
          // Her 2 hamlede bir rastgele hücreye buz bloğu düşür
          if (newBossCounter % 2 === 0) {
            const empty = findRandomEmptyCell(get().grid);
            if (empty) {
              const updatedGrid = get().grid.map(row => row.map(cell => ({ ...cell })));
              updatedGrid[empty.y][empty.x] = {
                filled: true,
                color: '#7dd3fc',
                id: uuidv4(),
                type: CellType.ICE,
                health: 2,
              };
              set({ grid: updatedGrid });
            }
          }
          break;
          
        case 'BOMB_RAIN':
          // Her 3 hamlede bir rastgele hücreye bomba düşür
          if (newBossCounter % 3 === 0) {
            const empty = findRandomEmptyCell(get().grid);
            if (empty) {
              const updatedGrid = get().grid.map(row => row.map(cell => ({ ...cell })));
              updatedGrid[empty.y][empty.x] = {
                filled: true,
                color: '#1c1917',
                id: uuidv4(),
                type: CellType.BOMB,
              };
              set({ grid: updatedGrid });
            }
          }
          break;
          
        case 'DARKNESS':
          // Parça renklerini gri yap (her hamlede)
          // Ama flux dolduğunda renkleri 1 saniye göster
          const { flux, isSurgeActive } = get();
          
          if (flux >= 100 || isSurgeActive) {
            // Flux dolu - renkleri göster (1 saniye sonra tekrar gizle)
            setTimeout(() => {
              if (get().bossType === 'DARKNESS') {
                const darkPieces = get().pieces.map(p => ({
                  ...p,
                  color: '#374151', // koyu gri — renk bilinmiyor hissi
                }));
                set({ pieces: darkPieces });
              }
            }, 1000);
          } else {
            // Flux dolu değil - renkleri gizle
            const darkPieces = get().pieces.map(p => ({
              ...p,
              color: '#374151', // koyu gri — renk bilinmiyor hissi
            }));
            set({ pieces: darkPieces });
          }
          break;
          
        case 'MIRROR':
          // Her yerleştirmede aynı parçanın yatay mirror'ını rastgele boş bir pozisyona yerleştir
          // Mirror parçayı oluştur (justPlacedPiece kullan - pieces[0] değil)
          if (!justPlacedPiece) break;
          
          const mirrorPiece = {
            ...justPlacedPiece,
            shape: justPlacedPiece.shape.map(row => [...row].reverse()), // Yatay mirror
            id: uuidv4(),
          };
          
          // Rastgele boş bir pozisyon bul
          const emptyPositions: { x: number; y: number }[] = [];
          for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
              if (get().canPlacePiece(get().grid, mirrorPiece, x, y)) {
                emptyPositions.push({ x, y });
              }
            }
          }
          
          // Eğer geçerli pozisyon varsa, rastgele birini seç ve yerleştir
          if (emptyPositions.length > 0) {
            const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            const mirrorGrid = get().grid.map(row => row.map(cell => ({ ...cell })));
            
            // Mirror parçayı yerleştir
            mirrorPiece.shape.forEach((row, dy) => {
              row.forEach((cell, dx) => {
                if (cell) {
                  const gridY = randomPos.y + dy;
                  const gridX = randomPos.x + dx;
                  if (gridY >= 0 && gridY < GRID_SIZE && gridX >= 0 && gridX < GRID_SIZE) {
                    mirrorGrid[gridY][gridX] = {
                      filled: true,
                      color: mirrorPiece.color,
                      id: uuidv4(),
                      type: CellType.NORMAL,
                    };
                  }
                }
              });
            });
            
            set({ grid: mirrorGrid });
          }
          break;
      }
    }
    
    // Advance guided step if in onboarding mode
    const { isFirstGame, guidedStep } = get();
    if (isFirstGame && guidedStep > 0 && guidedStep <= 3) {
      get().advanceGuidedStep();
    }
    
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
      
      // Daily Challenge tamamlandığında streak güncelle
      if (gameMode === GameMode.DAILY_CHALLENGE) {
        import('@utils/streakManager').then(({ checkAndUpdateStreak }) => {
          checkAndUpdateStreak();
        });
      }
      
      playGameOver();
      set({ isGameOver: true });
    }
  },

  resetGame: () => {
    get().initGame();
  },

  advanceGuidedStep: () => {
    const { guidedStep, pieces, grid, flux } = get();
    const nextStep = guidedStep + 1;
    
    // Step 1: İlk parçayı bırak
    // Step 2: Satır temizle (otomatik ilerler)
    // Step 3: Flux göster ve tamamla
    if (nextStep === 2) {
      // Adım 2: Satır doldurmaya yönlendir
      // Dolu olmaya en yakın satırı bul
      const rowFill = Array(GRID_SIZE).fill(0).map((_, y) => 
        grid[y].filter(c => c.filled).length
      );
      const bestRowIndex = rowFill.indexOf(Math.max(...rowFill));
      
      // O satırda boş olan ilk hücreye parça yerleştir
      const targetPiece = pieces[0];
      if (targetPiece) {
        let target: { x: number; y: number; pieceIndex: number } | null = null;
        
        // Önce en dolu satırda boş yer ara
        for (let x = 0; x < GRID_SIZE; x++) {
          if (get().canPlacePiece(grid, targetPiece, x, bestRowIndex)) {
            target = { x, y: bestRowIndex, pieceIndex: 0 };
            break;
          }
        }
        
        // Bulamazsa herhangi bir geçerli pozisyon bul
        if (!target) {
          outer: for (let y = GRID_SIZE - 1; y >= 0; y--) {
            for (let x = 0; x < GRID_SIZE; x++) {
              if (get().canPlacePiece(grid, targetPiece, x, y)) {
                target = { x, y, pieceIndex: 0 };
                break outer;
              }
            }
          }
        }
        
        set({ guidedStep: nextStep, guidedTarget: target });
      }
      return;
    }
    
    if (nextStep === 3) {
      // Adım 3: Flux barını göster ve tamamla
      set({ 
        guidedStep: nextStep,
        guidedTarget: null
      });
      
      // 2 saniye sonra tamamla
      setTimeout(() => {
        get().completeGuidedMode();
      }, 2000);
      return;
    }
    
    if (nextStep > 3) {
      get().completeGuidedMode();
      return;
    }
    
    // Calculate target for next step
    const targetPiece = pieces[0];
    if (targetPiece) {
      // Find first valid position (bottom-left corner preferred)
      let target: { x: number; y: number; pieceIndex: number } | null = null;
      outer: for (let y = GRID_SIZE - 1; y >= 0; y--) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (get().canPlacePiece(grid, targetPiece, x, y)) {
            target = { x, y, pieceIndex: 0 };
            break outer;
          }
        }
      }
      set({ guidedStep: nextStep, guidedTarget: target });
    }
  },

  completeGuidedMode: () => {
    try {
      localStorage.setItem('flux_onboard_v1', 'true');
    } catch {}
    set({ isFirstGame: false, guidedStep: 0, guidedTarget: null });
  },

  setGuidedHighlight: (x: number | null, y: number | null, shape: number[][] | null) => {
    if (x === null || y === null || shape === null) {
      set({ guidedTarget: null });
    } else {
      set({ guidedTarget: { x, y, pieceIndex: 0 } });
    }
  }
}));

// Helper Functions
const findRandomEmptyCell = (grid: GridState): { x: number; y: number } | null => {
  const empty: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!grid[y][x].filled) empty.push({ x, y });
    }
  }
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
};