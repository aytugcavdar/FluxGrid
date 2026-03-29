import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Piece, GRID_SIZE, GridCell, SkillType, CellType, Achievement, MiniEventState, MultiplierBreakdown } from '../types';
import { AppState, GameStats, GameMode } from '@shared/types';
import { POINTS, FLUX_COST, EXPANDED_ACHIEVEMENTS, ZEN_PALETTES, TIER_SCORE_MULTIPLIERS, TIMED_MODE } from '../constants';
import { playPlace, playClear, playCombo, playSkill, playGameOver, playSurgeStart, playSurgeEnd, playHaptic } from '../../../utils/audio';
import { safeExecute, ErrorCategory } from '../../../utils/errorHandler';
import { safeLocalStorageGet, safeParseInt, safeJSONParse } from './helpers/localStorage';
import { createEmptyGrid, processGrid } from './helpers/grid';
import { getRandomPiecesSync } from './helpers/pieces';
import { useThemeStore } from '@shared/store/themeStore';
import { useProfileStore } from '../../profile/store/profileStore';
import { checkAndUpdateStreak } from '@utils/streakManager';
import { tickTimerImpl } from './helpers/timerLogic';
import { checkTierEvent, tickActiveEvent } from './helpers/eventSystem';
import { updateAchievements, syncNewAchievement } from './helpers/achievementSystem';
import { usePassiveAbilityStore } from '../../abilities/store/passiveAbilityStore';
import { createMiniEventState, checkMiniEvents, tickMiniEvents } from './helpers/miniEventSystem';
import { calculateScore, calculateFluxGain } from './helpers/scoreCalculator';
import { migrateSaveData, SaveData } from './helpers/migration';
import { LocalStorageService } from '@services/local/localStorageService';
import { useVisualEffectStore } from '../../visual-effects/store/visualEffectStore';

export interface GameStore {
  grid: GridState;
  pieces: Piece[];
  score: number;
  highScore: number;
  flux: number;
  combo: number;
  isGameOver: boolean;
  isSurgeActive: boolean;
  activeSkill: SkillType | null;
  draggedPiece: Piece | null;
  lastAction: {
    type: 'PLACE' | 'CLEAR' | 'MILESTONE';
    lines?: number;
    combo?: number;
    chainCount?: number;
    colorBonus?: boolean;
    surgeBonus?: boolean;
    tier?: number;
    tierName?: string;
    chronoBonus?: number; // CHRONO bonus seconds
  } | null;
  
  // Achievements State
  achievements: Achievement[];
  unlockedAchievementId: string | null;

  // Navigation & Persistence
  appState: AppState;
  gameMode: GameMode;
  timeLeft: number;
  timerStartTime: number | null;
  timerExpectedEnd: number | null;
  highScores: { [key: string]: number };
  stats: GameStats;
  maxLevelReached: number;
  difficultyTier: number;

  // ZEN Mode State
  zenSessionTime: number;
  zenBlocksPlaced: number;
  zenPaletteIndex: number;

  // Daily Challenge State
  dailyClearHistory: boolean[][];

  // Event System State
  activeEvent: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  eventMovesRemaining: number;

  // Mini-Event System State
  miniEventState: MiniEventState;
  totalMovesPlayed: number;
  lastMultiplierBreakdown: MultiplierBreakdown | null;

  // Timed Mode State
  timedBoostMovesLeft: number;
  maxCombo: number;
  chronoBonus: number;
  finalSprintBonus: number;

  // Piece Loading State
  isPiecesLoading: boolean;

  // Actions
  initGame: (mode?: GameMode, savedData?: SaveData) => void;
  setAppState: (state: AppState) => void;
  setGameMode: (mode: GameMode) => void;
  tickTimer: () => void;
  clearAchievementNotification: () => void;
  placePiece: (piece: Piece, startX: number, startY: number) => boolean;
  canPlacePiece: (grid: GridState, piece: Piece, startX: number, startY: number) => boolean;
  activateSkill: (skill: SkillType) => void;
  useShatter: (x: number, y: number) => void;
  useBomb: (x: number, y: number) => void;
  setDraggedPiece: (piece: Piece | null) => void;
  checkGameOver: () => void;
  resetGame: () => void;
  setState: (update: Partial<GameStore>) => void;
}

const INITIAL_STATS: GameStats = {
  blocksPlaced: 0,
  linesCleared: 0,
  totalScore: 0,
  bombsExploded: 0,
  iceBroken: 0,
  gamesPlayed: 0,
  skillUses: {},
  
  // Endless mode stats
  endlessGamesPlayed: 0,
  endlessHighScore: 0,
  endlessMaxCombo: 0,
  endlessTotalLines: 0,
  endlessMaxTier: 0,
  endlessEventCount: 0,
  
  // Timed mode stats
  timedGamesPlayed: 0,
  timedHighScore: 0,
  timedMaxCombo: 0,
  timedTotalLines: 0,
  timedMaxDuration: 0,
  timedChronoBonus: 0,
  timedSprintBonusTotal: 0,
};

export const useGameStore = create<GameStore>((set, get) => {
  // Initial state: Load from localStorage via LocalStorageService
  const savedHighScores = LocalStorageService.loadHighScores();
  const savedStats = LocalStorageService.loadStats() || INITIAL_STATS;
  const savedMaxLevel = 0;
  const savedHighScore = 0;
  
  return {
  grid: createEmptyGrid(),
  pieces: [],
  score: 0,
  highScore: savedHighScore,
  flux: 100,
  combo: 0,
  isGameOver: false,
  isSurgeActive: false,
  activeSkill: null,
  draggedPiece: null,
  lastAction: null,
  
  // Achievements Initial State
  achievements: safeJSONParse(safeLocalStorageGet('flux_achievements', JSON.stringify(EXPANDED_ACHIEVEMENTS)), EXPANDED_ACHIEVEMENTS),
  unlockedAchievementId: null,

  // Navigation & Persistence
  appState: AppState.HOME,
  gameMode: GameMode.ENDLESS,
  timeLeft: 0,
  timerStartTime: null,
  timerExpectedEnd: null,
  highScores: savedHighScores,
  stats: savedStats,
  maxLevelReached: savedMaxLevel,
  difficultyTier: 0,

  // ZEN Mode Initial State
  zenSessionTime: 0,
  zenBlocksPlaced: 0,
  zenPaletteIndex: 0,

  // Daily Challenge Initial State
  dailyClearHistory: [],

  // Event System Initial State
  activeEvent: null,
  eventMovesRemaining: 0,

  // Mini-Event System Initial State
  miniEventState: createMiniEventState(),
  totalMovesPlayed: 0,
  lastMultiplierBreakdown: null,

  // Timed Mode Initial State
  timedBoostMovesLeft: 0,
  maxCombo: 0,
  chronoBonus: 0,
  finalSprintBonus: 0,

  // Piece Loading Initial State
  isPiecesLoading: false,

  initGame: (mode = GameMode.ENDLESS, savedData?: SaveData) => {
    const success = safeExecute(
      () => {
        const isTimed = mode === GameMode.TIMED;
        const isDaily = mode === GameMode.DAILY_CHALLENGE;
        const isZen = mode === GameMode.ZEN;
        const initialGrid = createEmptyGrid();
        
        const now = Date.now();
        
        // Run migration if saved data is provided
        let migratedData: SaveData | undefined = savedData;
        if (savedData) {
          migratedData = migrateSaveData(savedData);
        }
        
        // Use migrated data if available, otherwise use defaults
        const loadedScore = migratedData?.score ?? 0;
        const loadedTier = migratedData?.difficultyTier ?? 0;
        const loadedActiveEvent = migratedData?.activeEvent ?? null;
        const loadedEventMovesRemaining = migratedData?.eventMovesRemaining ?? 0;
        const loadedMiniEventState = migratedData?.miniEventState ?? createMiniEventState();
        const loadedTotalMovesPlayed = migratedData?.totalMovesPlayed ?? 0;
        
        set({
          grid: initialGrid,
          pieces: getRandomPiecesSync(3, initialGrid, isDaily, isZen ? ZEN_PALETTES[0] : useThemeStore.getState().getPieceColors(), loadedTier, mode),
          score: loadedScore,
          flux: isZen ? 100 : 50,
          combo: 0,
          isGameOver: false,
          isSurgeActive: false,
          activeSkill: null,
          lastAction: null,
          unlockedAchievementId: null,
          appState: AppState.GAME,
          gameMode: mode,
          timeLeft: isTimed ? 60 : 0,
          timerStartTime: isTimed ? now : null,
          timerExpectedEnd: isTimed ? now + 60000 : null,
          difficultyTier: loadedTier,
          // ZEN mode initialization
          zenSessionTime: isZen ? 0 : get().zenSessionTime,
          zenBlocksPlaced: isZen ? 0 : get().zenBlocksPlaced,
          zenPaletteIndex: isZen ? 0 : get().zenPaletteIndex,
          // Daily Challenge initialization
          dailyClearHistory: [],
          // Event System initialization
          activeEvent: loadedActiveEvent,
          eventMovesRemaining: loadedEventMovesRemaining,
          // Mini-Event System initialization
          miniEventState: loadedMiniEventState,
          totalMovesPlayed: loadedTotalMovesPlayed,
          lastMultiplierBreakdown: null,
          // Timed Mode initialization
          timedBoostMovesLeft: 0,
          maxCombo: 0,
          chronoBonus: 0,
          finalSprintBonus: 0,
          // Piece Loading initialization
          isPiecesLoading: false
        });
        
        // Increment games played (global and mode-specific)
        const newStats = { ...get().stats, gamesPlayed: get().stats.gamesPlayed + 1 };
        
        // Increment mode-specific games played
        if (mode === GameMode.ENDLESS) {
          newStats.endlessGamesPlayed = (newStats.endlessGamesPlayed || 0) + 1;
        } else if (mode === GameMode.TIMED) {
          newStats.timedGamesPlayed = (newStats.timedGamesPlayed || 0) + 1;
        }
        
        set({ stats: newStats });
        
        // Save stats to localStorage
        LocalStorageService.saveStats(newStats);
        
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

  setAppState: (state) => set({ appState: state }),
  setGameMode: (mode) => set({ gameMode: mode }),

  tickTimer: () => tickTimerImpl(get, set),

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
          pieces: getRandomPiecesSync(3, get().grid, get().gameMode === GameMode.DAILY_CHALLENGE, useThemeStore.getState().getPieceColors(), currentTier, get().gameMode),
          activeSkill: null
        });
        
        // Sync to profileStore
        useProfileStore.getState().incrementSkillUse('REROLL' as any);
        
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
    const { grid: finalGrid, totalLinesCleared, actions } = processGrid(tempGrid);

    const newCombo = totalLinesCleared > 0 ? get().combo + 1 : get().combo; // Don't reset combo on skill use, just add if it clears
    const extraScore = totalLinesCleared * POINTS.LINE_CLEARED * (newCombo > 0 ? newCombo : 1);
    
    // Audio + Haptic Feedback for Skill
    playSkill();
    if (totalLinesCleared > 0) playClear(totalLinesCleared);
    playHaptic('skill');

    const newScore = score + 5 + extraScore;
    const newHighScore = Math.max(newScore, get().highScore);

    set({
      grid: finalGrid,
      flux: flux - FLUX_COST.SHATTER,
      score: newScore,
      highScore: newHighScore,
      combo: newCombo,
      activeSkill: null
    });
    
    // Sync to profileStore
    useProfileStore.getState().incrementSkillUse('SHATTER' as any);
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
    const { grid: finalGrid, totalLinesCleared, actions } = processGrid(tempGrid);
    
    const newCombo = totalLinesCleared > 0 ? get().combo + 1 : get().combo;
    const extraScore = totalLinesCleared * POINTS.LINE_CLEARED * (newCombo > 0 ? newCombo : 1);

    // Audio + Haptic Feedback for Bomb
    playSkill();
    if (totalLinesCleared > 0) playClear(totalLinesCleared);
    playHaptic('skill');

    const newScore = score + (blocksDestroyed * 5) + extraScore;
    const newHighScore = Math.max(newScore, get().highScore);

    set({
      grid: finalGrid,
      flux: flux - FLUX_COST.BOMB,
      score: newScore,
      highScore: newHighScore,
      combo: newCombo,
      activeSkill: null
    });
    
    // Sync to profileStore
    useProfileStore.getState().incrementSkillUse('BOMB' as any);
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

    // Increment totalMovesPlayed (only for ENDLESS mode)
    if (gameMode === GameMode.ENDLESS) {
      set({ totalMovesPlayed: get().totalMovesPlayed + 1 });
    }

    // 2. Update Grid
    const tempGrid = grid.map(row => row.map(cell => ({ ...cell })));
    let blocksPlaced = 0;
    const placedBlockCoords: Array<{x: number, y: number, color: string}> = [];

    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col] === 1) {
          const gridX = startX + col;
          const gridY = startY + row;
          
          tempGrid[gridY][gridX] = {
            filled: true,
            color: piece.color,
            id: uuidv4(),
            type: piece.type || CellType.NORMAL,
            health: piece.type === CellType.ICE ? 2 : undefined
          };
          blocksPlaced++;
          
          // Track placed block coordinates for pulse effect
          placedBlockCoords.push({ x: gridX, y: gridY, color: piece.color });
        }
      }
    }
    
    // Pulse effect disabled for performance
    // const performanceMode = useVisualEffectStore.getState().performanceMode;
    // if (performanceMode !== 'low') {
    //   placedBlockCoords.forEach(block => {
    //     useVisualEffectStore.getState().addEffect({
    //       type: 'pulse',
    //       duration: 300,
    //       target: `cell-${block.x}-${block.y}`,
    //       props: {
    //         x: block.x,
    //         y: block.y,
    //         color: block.color
    //       }
    //     });
    //   });
    // }

    // 3. Process Grid
    const { grid: newGrid, totalLinesCleared: linesCleared, chainCount, colorBonus, bombsExploded, iceBroken, actions } = processGrid(tempGrid);

    // Handle CELL_CLEAR actions - trigger explosion effects
    actions.forEach(action => {
      if (action.type === 'CELL_CLEAR') {
        const clearAction = action as any; // Type assertion for CELL_CLEAR
        clearAction.cells.forEach((cell: any) => {
          // Add explosion effect for each cleared cell
          // Add delay based on chain index for chain reactions
          const delay = (clearAction.chainIndex - 1) * 200; // 200ms delay per chain step
          
          setTimeout(() => {
            useVisualEffectStore.getState().addEffect({
              type: 'explosion',
              duration: 180, // Faster: 180ms (was 250ms)
              target: `cell-${cell.x}-${cell.y}`,
              props: {
                x: cell.x,
                y: cell.y,
                color: cell.color,
                blockSize: 20,
                cellType: cell.cellType
              }
            });
          }, delay);
        });
      }
    });

    // Handle CHRONO_BONUS actions
    let chronoBonusSeconds = 0;
    actions.forEach(action => {
      if (action.type === 'CHRONO_BONUS') {
        chronoBonusSeconds += action.seconds;
      }
    });

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

    // Check and activate mini-events (only for ENDLESS mode, before score calculation)
    let updatedMiniEventState = get().miniEventState;
    if (gameMode === GameMode.ENDLESS) {
      updatedMiniEventState = checkMiniEvents(get().totalMovesPlayed, get().miniEventState);
    } else {
      // For non-ENDLESS modes, use empty mini-event state to skip multipliers
      updatedMiniEventState = createMiniEventState();
    }

    // 4. Puan hesaplama (ZEN modda skip edilir)
    // Combo: ZEN'de combo sıfırlanmaz, diğer modlarda satır temizlenmezse sıfırlanır
    let newCombo = gameMode === GameMode.ZEN 
      ? combo + (linesCleared > 0 ? 1 : 0)
      : (linesCleared > 0 ? combo + 1 : 0);
    
    // COMBO_RUSH logic for Timed mode
    const isTimedMode = gameMode === GameMode.TIMED;
    const prevTimedBoostMoves = get().timedBoostMovesLeft;
    let newTimedBoostMoves = prevTimedBoostMoves;
    
    // Aktivasyon: combo 4'e ulaştı ve rush aktif değilse
    if (isTimedMode && newCombo >= 4 && prevTimedBoostMoves === 0) {
      newTimedBoostMoves = 3;
    }
    // Dekreman: rush aktif ve yeni aktivasyon olmadıysa
    else if (isTimedMode && prevTimedBoostMoves > 0) {
      newTimedBoostMoves = Math.max(0, prevTimedBoostMoves - 1);
    }
    
    // Rush aktifken combo 0'a düşmesin
    const isRushActive = isTimedMode && newTimedBoostMoves > 0;
    if (isRushActive && linesCleared === 0) {
      newCombo = Math.max(combo, 1); // Combo kırılmasını engelle
    }
    
    // Combo multiplier: preserve previous combo when no lines cleared, use new combo when lines cleared
    const comboMultiplier = linesCleared > 0 ? newCombo : combo;

    // Renk bonusu: tek renk satır/sütun temizleme
    const colorBonusMultiplier = (linesCleared > 0 && colorBonus) ? POINTS.COLOR_BONUS_MULTIPLIER : 1;
    // Final seconds multiplier: Timed modda son 10 saniyede 1.5x
    const isFinalSeconds = gameMode === GameMode.TIMED && get().timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD;

    // Pasif yetenek çarpanları
    const passiveScoreMultiplier = usePassiveAbilityStore.getState().calculateScoreMultiplier();

    const basePoints = (blocksPlaced * POINTS.BLOCK_PLACED) +
                       (linesCleared * POINTS.LINE_CLEARED) +
                       (comboMultiplier * POINTS.COMBO_MULTIPLIER);
    
    // Calculate score using score calculator
    const { score: pointsGained, breakdown } = calculateScore(
      basePoints,
      colorBonus,
      isSurgeActive,
      gameMode === GameMode.ENDLESS ? get().difficultyTier : 0,
      gameMode === GameMode.ENDLESS ? get().activeEvent : null,
      updatedMiniEventState,
      linesCleared,
      passiveScoreMultiplier
    );
    
    // Track final sprint bonus for Timed mode
    let sprintBonusGained = 0;
    if (isFinalSeconds && linesCleared > 0) {
      const quakeMultiplier = get().activeEvent === 'QUAKE' && linesCleared > 0 ? 1.3 : 1.0;
      sprintBonusGained = Math.floor(basePoints * 0.5 * quakeMultiplier * passiveScoreMultiplier);
    }
    
    // ZEN modda skor güncellenmez
    const newScore = gameMode === GameMode.ZEN ? 0 : (score + pointsGained);

    // Update Achievements
    const previousAchievements = get().achievements;
    const updatedAchievements = updateAchievements(previousAchievements, {
      newScore,
      newCombo,
      bombsExploded,
      iceBroken,
      currentLevelIndex: 0,
    });

    // Sync newly unlocked achievement to localStorage
    syncNewAchievement(previousAchievements, updatedAchievements);
    
    // Handle just unlocked achievement
    const newUnlock = updatedAchievements.find((ach, i) => ach.unlocked && !previousAchievements[i].unlocked);

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
        chronoBonus: chronoBonusSeconds, // Add CHRONO bonus to lastAction
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
    const passiveFluxMultiplier = usePassiveAbilityStore.getState().calculateFluxMultiplier();
    
    // Calculate flux using flux calculator
    const fluxGained = calculateFluxGain(
      blocksPlaced,
      linesCleared,
      gameMode === GameMode.ENDLESS ? get().difficultyTier : 0,
      updatedMiniEventState,
      passiveFluxMultiplier
    );
    
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
      set({ isPiecesLoading: true });
      
      const pieceCount = 3;
      
      const isDaily = get().gameMode === GameMode.DAILY_CHALLENGE;
      const isZen = get().gameMode === GameMode.ZEN;
      const zenPalette = isZen ? ZEN_PALETTES[get().zenPaletteIndex] : undefined;
      const currentTier = get().gameMode === GameMode.ENDLESS ? get().difficultyTier : 0;
      currentPieces = getRandomPiecesSync(pieceCount, newGrid, isDaily, zenPalette ?? useThemeStore.getState().getPieceColors(), currentTier, get().gameMode);
      
      set({ isPiecesLoading: false });
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
    const modeHighScore = currentHighs[modeKey] || 0;
    
    if (newScore > modeHighScore) {
      const newHighs = { ...currentHighs, [modeKey]: newScore };
      set({ highScores: newHighs, highScore: newScore });
      
      // Save high score to localStorage
      LocalStorageService.saveHighScore(modeKey, newScore);
    }

    // Time Reward logic
    let extraTime = 0;
    const previousCombo = combo; // Önceki combo değerini sakla
    
    // TIMED mode time logic
    // Time bonus formula: +2 seconds per line cleared, +0.5 seconds for combo > 1
    // Combo break penalty: -1 second if previous combo > 0 but now 0 (only when rush is NOT active)
    // CHRONO bonus: additional seconds from CHRONO blocks
    // Cap at 60 seconds maximum
    if (get().gameMode === GameMode.TIMED) {
      if (linesCleared > 0) {
        extraTime = linesCleared * 2; // +2 saniye per line
        if (comboMultiplier > 1) extraTime += 0.5; // +0.5 saniye per combo
      }
      // Combo kırılma cezası: önceki combo > 0 ama şimdi 0 ise (rush aktif değilken)
      if (!isRushActive && previousCombo > 0 && newCombo === 0) {
        extraTime = -1; // -1 saniye ceza
      }
      // Add CHRONO bonus
      extraTime += chronoBonusSeconds;
      
      // Timer'ı 60 saniyede cap'le ve timerExpectedEnd'i güncelle
      const currentExpectedEnd = get().timerExpectedEnd;
      if (currentExpectedEnd) {
        const newExpectedEnd = Math.min(
          get().timerStartTime! + 60000, // Max 60 seconds from start
          currentExpectedEnd + (extraTime * 1000)
        );
        const newTimeLeft = Math.max(0, Math.ceil((newExpectedEnd - Date.now()) / 1000));
        extraTime = newTimeLeft - get().timeLeft; // Gerçek değişimi hesapla
        
        set({ timerExpectedEnd: newExpectedEnd });
      }
    }

    // Calculate new movesLeft - not used anymore

    // Update maxCombo
    const newMaxCombo = Math.max(get().maxCombo, newCombo);

    // Check for tier events (Endless mode) - BEFORE main set() call
    const prevDifficultyTier = get().difficultyTier;
    let tierResult: ReturnType<typeof checkTierEvent> | null = null;
    if (get().gameMode === GameMode.ENDLESS) {
      tierResult = checkTierEvent(newScore, prevDifficultyTier, get, set);
    }

    // --- Aktif olay tick ---
    // CRITICAL: Pass newGrid (with placed piece) instead of get().grid (old state)
    // to prevent event effects from overwriting the just-placed piece
    const eventUpdates = tickActiveEvent(newGrid, justPlacedPiece, get, set);
    
    // Merge grid updates: eventUpdates takes precedence over tierResult
    const tierUpdates = tierResult ?? {};
    let finalGrid = (eventUpdates as any)?.grid ?? (tierUpdates as any)?.grid ?? newGrid;
    
    // CRITICAL: After event effects (GRAVITY_RUSH, QUAKE, etc.), check for new line clears
    // Events can create new full rows/columns that need to be cleared
    // We process the grid again but don't add score (event effects are automatic, not player actions)
    // This applies to both tier activation (checkTierEvent) and ongoing events (tickActiveEvent)
    if ((eventUpdates && (eventUpdates as any).grid) || (tierUpdates && (tierUpdates as any).grid)) {
      const { grid: processedGrid } = processGrid(finalGrid);
      finalGrid = processedGrid;
    }
    
    // Tick mini-events after score calculation (only for ENDLESS mode)
    if (gameMode === GameMode.ENDLESS) {
      updatedMiniEventState = tickMiniEvents(updatedMiniEventState, linesCleared);
    }

    set({
      ...tierUpdates,
      ...eventUpdates,
      grid: finalGrid,
      score: newScore,
      highScore: Math.max(newScore, get().highScore),
      combo: newCombo, // Use newCombo instead of comboMultiplier
      flux: finalFlux,
      isSurgeActive: newIsSurgeActive,
      pieces: currentPieces,
      timeLeft: Math.min(99, get().timeLeft + extraTime),
      achievements: updatedAchievements,
      unlockedAchievementId: newUnlock ? newUnlock.id : get().unlockedAchievementId,
      chronoBonus: get().chronoBonus + chronoBonusSeconds,
      finalSprintBonus: get().finalSprintBonus + sprintBonusGained,
      maxCombo: newMaxCombo,
      timedBoostMovesLeft: newTimedBoostMoves,
      miniEventState: updatedMiniEventState,
      lastMultiplierBreakdown: breakdown,
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
    
    // Update mode-specific stats
    if (gameMode === GameMode.ENDLESS) {
      // Endless mode stats
      nextStats.endlessTotalLines = (currentStats.endlessTotalLines || 0) + linesCleared;
      nextStats.endlessMaxCombo = Math.max(currentStats.endlessMaxCombo || 0, newCombo);
      nextStats.endlessMaxTier = Math.max(currentStats.endlessMaxTier || 0, get().difficultyTier);
      
      // Track event count (increment when a new tier event is activated)
      if (tierResult && tierResult.activeEvent) {
        nextStats.endlessEventCount = (currentStats.endlessEventCount || 0) + 1;
      }
    } else if (gameMode === GameMode.TIMED) {
      // Timed mode stats
      nextStats.timedTotalLines = (currentStats.timedTotalLines || 0) + linesCleared;
      nextStats.timedMaxCombo = Math.max(currentStats.timedMaxCombo || 0, newCombo);
      nextStats.timedChronoBonus = (currentStats.timedChronoBonus || 0) + chronoBonusSeconds;
      nextStats.timedSprintBonusTotal = (currentStats.timedSprintBonusTotal || 0) + sprintBonusGained;
    }
    
    set({ stats: nextStats });
    
    // Save stats to localStorage
    LocalStorageService.saveStats(nextStats);

    get().checkGameOver();
    
    return true;
  },

  checkGameOver: () => {
    const { grid, pieces, activeSkill, gameMode } = get();
    
    // ZEN modda oyun hiç bitmez
    if (gameMode === GameMode.ZEN) return;
    
    // Don't check game over while pieces are loading
    if (get().isPiecesLoading) return;
    
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
      // Daily Challenge tamamlandığında streak güncelle
      if (gameMode === GameMode.DAILY_CHALLENGE) {
        checkAndUpdateStreak();
      }
      
      // Update mode-specific high scores and stats on game end
      const currentStats = get().stats;
      const finalScore = get().score;
      const updatedStats = { ...currentStats };
      
      if (gameMode === GameMode.ENDLESS) {
        updatedStats.endlessHighScore = Math.max(currentStats.endlessHighScore || 0, finalScore);
      } else if (gameMode === GameMode.TIMED) {
        updatedStats.timedHighScore = Math.max(currentStats.timedHighScore || 0, finalScore);
        
        // Calculate duration (60 seconds - timeLeft)
        const duration = 60 - get().timeLeft;
        updatedStats.timedMaxDuration = Math.max(currentStats.timedMaxDuration || 0, duration);
      }
      
      set({ stats: updatedStats });
      LocalStorageService.saveStats(updatedStats);
      
      playGameOver();
      set({ isGameOver: true });
    }
  },

  resetGame: () => {
    get().initGame();
  },

  setState: (update) => {
    set(update);
  }
};
});