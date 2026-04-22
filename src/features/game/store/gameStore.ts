import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Piece, GRID_SIZE, GridCell, CellType, Achievement, MultiplierBreakdown, ProgressionState } from '../types';
import { AppState, GameStats, GameMode } from '@shared/types';
import { POINTS, EXPANDED_ACHIEVEMENTS, TIER_SCORE_MULTIPLIERS, TIMED_MODE, COMBO_TIMER } from '../constants';
import { playPlace, playClear, playCombo, playSkill, playGameOver, playSurgeStart, playSurgeEnd, playHaptic } from '../../../utils/audio';
import { safeExecute, ErrorCategory } from '../../../utils/managers/errorHandler';
import { safeLocalStorageGet, safeParseInt, safeJSONParse } from './helpers/localStorage';
import { createEmptyGrid, processGrid } from './helpers/grid';
import { getRandomPiecesSync } from './helpers/pieces';
import { useThemeStore } from '@shared/store/themeStore';
import { useProfileStore } from '../../profile/store/profileStore';
import { useTutorialStore } from '../../tutorial/store/tutorialStore';
import { tickTimerImpl } from './helpers/timerLogic';
import { checkTierEvent, tickActiveEvent } from './helpers/eventSystem';
import { updateAchievements, syncNewAchievement } from './helpers/achievementSystem';
import { createMiniEventState, checkMiniEvents, shouldPreventComboBreak, getMiniEventMultiplier, isPieceBlessingActive } from './helpers/miniEventSystem';
import { createProgressionState, updateStreak, getStreakMultiplier, checkMilestones } from './helpers/progressionSystem';
import { JuiceTriggers } from '../../visual-effects/utils/juiceTriggers';
import { calculateScore } from './helpers/scoreCalculator';
import { migrateSaveData, SaveData } from './helpers/migration';
import { LocalStorageService } from '@services/local/localStorageService';
import { useVisualEffectStore } from '../../visual-effects/store/visualEffectStore';
import { useAchievementStore } from '../../achievements/achievementStore';
import { saveGameState, loadGameState, clearGameSave, hasSavedGame } from './helpers/gameSaveSystem';

export interface GameStore {
  grid: GridState;
  pieces: Piece[];
  score: number;
  highScore: number;
  combo: number;
  isGameOver: boolean;
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
    cellIds?: string[]; // Placed cell IDs for placement animations
    dropHeight?: number; // Drop height for placement impact
  } | null;
  
  // Bonus Skills (Daily Reward System)
  bonusRerolls: number;
  bonusShatter: number;
  bonusBomb: number;
  

  
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

  // ZEN Mode State removed - ZEN mode deprecated

  // Daily Challenge State
  dailyClearHistory: boolean[][];

  // Event System State
  activeEvent: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  eventMovesRemaining: number;

  // Mini-Event System State
  miniEventState: MiniEventState;
  totalMovesPlayed: number;
  lastMultiplierBreakdown: MultiplierBreakdown | null;

  // Progression System State
  progressionState: ProgressionState;
  progression: ProgressionState; // Alias for progressionState

  // Timed Mode State
  timedBoostMovesLeft: number;
  maxCombo: number;
  chronoBonus: number;
  finalSprintBonus: number;

  // Piece Loading State
  isPiecesLoading: boolean;
  
  // Perfect Clear State
  perfectClearDetected: boolean;
  
  // Combo Timer State
  comboTimerStartTime: number | null;
  comboTimerDuration: number; // milliseconds (default 5000 = 5 seconds)
  comboTimeLeft: number; // remaining time in seconds for UI
  
  // Game Logs State (for analytics)
  gameLogs: Array<{
    id: string;
    mode: GameMode;
    score: number;
    timestamp: number;
    duration: number;
    linesCleared: number;
    maxCombo: number;
    badge?: 'new-record' | 'perfect' | 'comeback' | 'speedrun';
    metadata?: {
      tier?: number;
      chronoBonus?: number;
      skillsUsed?: string[];
    };
  }>;

  // Actions
  initGame: (mode?: GameMode, savedData?: SaveData) => void;
  setAppState: (state: AppState) => void;
  setGameMode: (mode: GameMode) => void;
  tickTimer: () => void;
  clearAchievementNotification: () => void;
  placePiece: (piece: Piece, startX: number, startY: number) => boolean;
  canPlacePiece: (grid: GridState, piece: Piece, startX: number, startY: number) => boolean;
  setDraggedPiece: (piece: Piece | null) => void;
  checkGameOver: () => void;
  resetGame: () => void;
  setState: (update: Partial<GameStore>) => void;
  
  // Save/Load system
  saveCurrentGame: () => boolean;
  loadSavedGame: () => boolean;
  hasSavedGame: () => boolean;
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
  combo: 0,
  isGameOver: false,
  draggedPiece: null,
  lastAction: null,
  
  // Bonus Skills Initial State
  bonusRerolls: 0,
  bonusShatter: 0,
  bonusBomb: 0,
  
  // Achievements Initial State - ensure it's always an array
  achievements: (() => {
    const parsed = safeJSONParse(safeLocalStorageGet('flux_achievements', JSON.stringify(EXPANDED_ACHIEVEMENTS)), EXPANDED_ACHIEVEMENTS);
    return Array.isArray(parsed) ? parsed : EXPANDED_ACHIEVEMENTS;
  })(),
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

  // ZEN Mode Initial State removed - ZEN mode deprecated

  // Daily Challenge Initial State
  dailyClearHistory: [],

  // Event System Initial State
  activeEvent: null,
  eventMovesRemaining: 0,

  // Mini-Event System Initial State
  miniEventState: createMiniEventState(),
  totalMovesPlayed: 0,
  lastMultiplierBreakdown: null,

  // Progression System Initial State
  progressionState: createProgressionState(),
  get progression() { return this.progressionState; }, // Alias getter

  // Timed Mode Initial State
  timedBoostMovesLeft: 0,
  maxCombo: 0,
  chronoBonus: 0,
  finalSprintBonus: 0,

  // Piece Loading Initial State
  isPiecesLoading: false,
  
  // Perfect Clear Initial State
  perfectClearDetected: false,
  
  // Combo Timer Initial State
  comboTimerStartTime: null,
  comboTimerDuration: COMBO_TIMER.DURATION, // 5 seconds
  comboTimeLeft: 0,
  
  // Game Logs Initial State
  gameLogs: (() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('flux_game_logs');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('[GameStore] Failed to load game logs:', error);
      return [];
    }
  })(),

  initGame: (mode = GameMode.ENDLESS, savedData?: SaveData) => {
    const success = safeExecute(
      () => {
        // If starting a NEW game (not loading saved), clear any existing save
        if (!savedData) {
          console.log('[GameStore] Starting new game, clearing saved game...');
          clearGameSave();
        }
        
        const isTimed = mode === GameMode.TIMED;
        const isDaily = mode === GameMode.DAILY_CHALLENGE;
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
          pieces: getRandomPiecesSync(
            3, 
            initialGrid, 
            isDaily, 
            useThemeStore.getState().getPieceColors(), 
            loadedTier, 
            mode,
            loadedMiniEventState
          ),
          score: loadedScore,
          combo: 0,
          isGameOver: false,
          lastAction: null,
          unlockedAchievementId: null,
          appState: AppState.GAME,
          gameMode: mode,
          timeLeft: isTimed ? 60 : 0,
          timerStartTime: isTimed ? now : null,
          timerExpectedEnd: isTimed ? now + 60000 : null,
          difficultyTier: loadedTier,
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
          isPiecesLoading: false,
          // Combo Timer initialization
          comboTimerStartTime: null,
          comboTimeLeft: 0
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
        
        // Initialize tutorial system if this is a new game (not loading saved)
        if (!savedData) {
          const tutorialStore = useTutorialStore.getState();
          if (!tutorialStore.isCompleted) {
            console.log('[GameStore] Starting tutorial for new player');
            tutorialStore.start();
          }
        }
        
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
    const { grid, score, combo, highScore, gameMode } = get();
    
    // Grid validation
    if (!grid || grid.length !== GRID_SIZE) {
      console.error('placePiece: invalid grid state');
      return false;
    }
    
    // 1. Validate placement
    if (!get().canPlacePiece(grid, piece, startX, startY)) {
      // Trigger invalid placement feedback
      JuiceTriggers.onInvalidPlacement();
      return false;
    }
    
    // Trigger valid placement feedback
    JuiceTriggers.onValidPlacement();
    
    // Store the placed piece for boss mechanics (before it's removed from pieces array)
    const justPlacedPiece = piece;

    // Increment totalMovesPlayed (only for ENDLESS mode)
    if (gameMode === GameMode.ENDLESS) {
      set({ totalMovesPlayed: get().totalMovesPlayed + 1 });
    }

    // 2. Update Grid
    const tempGrid = grid.map(row => row.map(cell => ({ ...cell })));
    let blocksPlaced = 0;
    const placedBlockCoords: Array<{x: number, y: number, color: string}> = [];
    const placedCellIds: string[] = []; // Track cell IDs for animation

    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col] === 1) {
          const gridX = startX + col;
          const gridY = startY + row;
          
          const cellId = uuidv4();
          tempGrid[gridY][gridX] = {
            filled: true,
            color: piece.color,
            id: cellId,
            type: piece.type || CellType.NORMAL,
            health: piece.type === CellType.ICE ? 2 : undefined
          };
          blocksPlaced++;
          placedCellIds.push(cellId); // Track for animation
          
          // Track placed block coordinates for pulse effect
          placedBlockCoords.push({ x: gridX, y: gridY, color: piece.color });
        }
      }
    }
    
    // Calculate drop height (distance from top of grid to placement position)
    const dropHeight = startY;
    
    
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

    // Trigger juice effects for line clears
    if (linesCleared > 0) {
      const newCombo = combo + linesCleared;
      JuiceTriggers.onLinesCleared(actions as any, newCombo);
    }

    // Check for perfect clear (all cells empty after processing)
    const isPerfectClear = newGrid.every(row => row.every(cell => !cell.filled));
    if (isPerfectClear) {
      set({ perfectClearDetected: true });
    }

    // Handle CELL_CLEAR actions - COMPLETELY DISABLED at combo >= 10 for performance
    // At combo 5-9: max 2 explosions, at combo < 5: max 3 explosions
    if (combo < 10) {
      const maxExplosions = combo >= 5 ? 2 : 3;
      
      actions.forEach(action => {
        if (action.type === 'CELL_CLEAR') {
          const clearAction = action as any;
          
          // Limit explosions based on combo
          const cellsToExplode = clearAction.cells.slice(0, maxExplosions);
          
          cellsToExplode.forEach((cell: any) => {
            setTimeout(() => {
              useVisualEffectStore.getState().addEffect({
                type: 'explosion',
                duration: 100,
                target: `cell-${cell.x}-${cell.y}`,
                props: {
                  x: cell.x,
                  y: cell.y,
                  color: cell.color,
                  blockSize: 20,
                  cellType: cell.cellType
                }
              });
            }, 50);
          });
        }
      });
    }

    // Handle CHRONO_BONUS actions
    let chronoBonusSeconds = 0;
    actions.forEach(action => {
      if (action.type === 'CHRONO_BONUS') {
        chronoBonusSeconds += action.seconds;
      }
    });

    // Check and activate mini-events (only for ENDLESS mode, before score calculation)
    let updatedMiniEventState = get().miniEventState;
    if (gameMode === GameMode.ENDLESS) {
      updatedMiniEventState = checkMiniEvents(get().totalMovesPlayed, get().miniEventState, get().difficultyTier);
    } else {
      // For non-ENDLESS modes, use empty mini-event state to skip multipliers
      updatedMiniEventState = createMiniEventState();
    }

    // 4. Puan hesaplama
    // Combo Timer System: SADECE satır temizlendiğinde timer başlar/sıfırlanır
    // Timer bitmeden yeni satır temizlenirse combo devam eder
    // Timer biterse combo 0'a düşer
    const comboShieldPrevented = gameMode === GameMode.ENDLESS && shouldPreventComboBreak(updatedMiniEventState, linesCleared);
    
    const now = Date.now();
    const currentComboTimer = get().comboTimerStartTime;
    const comboTimerDuration = get().comboTimerDuration;
    
    let newCombo: number;
    let newComboTimerStart: number | null = null;
    
    if (linesCleared > 0) {
      // Lines cleared: increase combo by number of lines cleared and reset/start timer
      newCombo = combo + linesCleared;
      newComboTimerStart = now; // Reset timer ONLY when lines are cleared
    } else if (comboShieldPrevented) {
      // COMBO_SHIELD active: preserve combo and timer
      newCombo = combo;
      newComboTimerStart = currentComboTimer;
    } else {
      // No lines cleared: check if timer expired (timer only runs if it was started)
      if (currentComboTimer !== null && now - currentComboTimer >= comboTimerDuration) {
        // Timer expired: reset combo
        newCombo = 0;
        newComboTimerStart = null;
      } else {
        // Timer still active OR no timer (no lines cleared yet): preserve combo
        newCombo = combo;
        newComboTimerStart = currentComboTimer; // Keep existing timer, don't reset
      }
    }
    
    // Calculate remaining time for UI ONLY when timer changes (lines cleared or expired)
    // Don't recalculate on every block placement to avoid UI jitter
    const shouldUpdateTimeLeft = linesCleared > 0 || newComboTimerStart === null || newComboTimerStart !== currentComboTimer;
    const newComboTimeLeft = shouldUpdateTimeLeft
      ? (newComboTimerStart !== null 
          ? Math.max(0, (comboTimerDuration - (now - newComboTimerStart)) / 1000)
          : 0)
      : get().comboTimeLeft; // Keep existing value if timer didn't change
    
    // Update streak (Endless mode only)
    let updatedProgressionState = get().progressionState;
    let streakMultiplier = 1.0;
    if (gameMode === GameMode.ENDLESS) {
      const newStreak = updateStreak(
        updatedProgressionState.currentStreak,
        linesCleared,
        comboShieldPrevented
      );
      streakMultiplier = getStreakMultiplier(newStreak);
      updatedProgressionState = {
        ...updatedProgressionState,
        currentStreak: newStreak,
      };
    }
    
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

    // Pasif yetenek çarpanları kaldırıldı (ZEN mode deprecated)
    const passiveScoreMultiplier = 1.0;

    const basePoints = (blocksPlaced * POINTS.BLOCK_PLACED) +
                       (linesCleared * POINTS.LINE_CLEARED) +
                       (comboMultiplier * POINTS.COMBO_MULTIPLIER);
    
    // Calculate score using score calculator (NO flux multiplier)
    const { score: pointsGained, breakdown } = calculateScore(
      basePoints,
      colorBonus,
      1.0, // No flux multiplier - removed completely
      gameMode === GameMode.ENDLESS ? get().difficultyTier : 0,
      gameMode === GameMode.ENDLESS ? get().activeEvent : null,
      updatedMiniEventState,
      linesCleared,
      passiveScoreMultiplier,
      streakMultiplier
    );
    
    // Track final sprint bonus for Timed mode
    let sprintBonusGained = 0;
    if (isFinalSeconds && linesCleared > 0) {
      const quakeMultiplier = get().activeEvent === 'QUAKE' && linesCleared > 0 ? 1.3 : 1.0;
      sprintBonusGained = Math.floor(basePoints * 0.5 * quakeMultiplier * passiveScoreMultiplier);
    }
    
    const newScore = score + pointsGained;

    // Check milestones (Endless mode only)
    if (gameMode === GameMode.ENDLESS) {
      const { milestones, newMilestone } = checkMilestones(newScore, updatedProgressionState.milestones);
      updatedProgressionState = {
        ...updatedProgressionState,
        milestones,
        lastMilestoneShown: newMilestone?.id ?? updatedProgressionState.lastMilestoneShown,
      };
      
      // Trigger milestone popup in HUD (will be handled by HUD component)
      if (newMilestone) {
        // Store milestone for HUD to display
        // HUD will read from progressionState.lastMilestoneShown
      }
    }

    // Update Achievements
    const previousAchievements = get().achievements;
    const statsForAchievements = get().stats;
    const updatedAchievements = updateAchievements(previousAchievements, {
      newScore,
      newCombo,
      totalBombsExploded: (statsForAchievements.bombsExploded || 0) + bombsExploded,
      totalIceBroken: (statsForAchievements.iceBroken || 0) + iceBroken,
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
        surgeBonus: false, // Removed surge system
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
      set({ lastAction: { 
        type: 'PLACE',
        cellIds: placedCellIds,
        dropHeight: dropHeight
      }});
    }

    // 5. Tepsi güncelle
    let currentPieces = get().pieces.filter(p => p.instanceId !== piece.instanceId);
    if (currentPieces.length === 0) {
      set({ isPiecesLoading: true });
      
      const pieceCount = 3;
      
      const isDaily = get().gameMode === GameMode.DAILY_CHALLENGE;
      const currentTier = get().gameMode === GameMode.ENDLESS ? get().difficultyTier : 0;
      
      // Get tutorial step if tutorial is active
      const tutorialState = useTutorialStore.getState();
      const tutorialStep = tutorialState.isActive ? tutorialState.currentStep : undefined;
      
      currentPieces = getRandomPiecesSync(
        pieceCount, 
        newGrid, 
        isDaily, 
        useThemeStore.getState().getPieceColors(), 
        currentTier, 
        get().gameMode,
        updatedMiniEventState
      );
      
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
      
      // Timer'ı güncelle - CHRONO bonus için cap'i geçici olarak kaldır
      const currentExpectedEnd = get().timerExpectedEnd;
      if (currentExpectedEnd) {
        // CHRONO bonus varsa, 60 saniye cap'ini geçici olarak yükselt
        const maxTime = chronoBonusSeconds > 0 
          ? get().timerStartTime! + 75000  // CHRONO bonus için 75 saniye cap
          : get().timerStartTime! + 60000; // Normal 60 saniye cap
          
        const newExpectedEnd = Math.min(
          maxTime,
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
    
    // BUG FIX: Event effects artık kendi içlerinde processGrid çağırmıyor
    // Bu yüzden burada tekrar processGrid çağırmaya gerek yok
    // Double processing score jump ve freeze'e neden oluyordu
    
    // Tick mini-events after score calculation (only for ENDLESS mode)
    if (gameMode === GameMode.ENDLESS) {
      // Calculate if combo would break (no lines cleared and no COMBO_SHIELD)
      const comboWouldBreak = linesCleared === 0 && combo > 0;
      updatedMiniEventState = tickMiniEvents(updatedMiniEventState, linesCleared, comboWouldBreak);
    }

    set({
      ...tierUpdates,
      ...eventUpdates,
      grid: finalGrid,
      score: newScore,
      highScore: Math.max(newScore, get().highScore),
      combo: newCombo, // Use newCombo instead of comboMultiplier
      pieces: currentPieces,
      timeLeft: Math.min(99, get().timeLeft + extraTime),
      achievements: updatedAchievements,
      unlockedAchievementId: newUnlock ? newUnlock.id : get().unlockedAchievementId,
      chronoBonus: get().chronoBonus + chronoBonusSeconds,
      finalSprintBonus: get().finalSprintBonus + sprintBonusGained,
      maxCombo: newMaxCombo,
      timedBoostMovesLeft: newTimedBoostMoves,
      miniEventState: updatedMiniEventState,
      progressionState: updatedProgressionState,
      comboTimerStartTime: newComboTimerStart,
      comboTimeLeft: newComboTimeLeft,
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
    
    // Check achievements (new achievement system)
    const achievementStore = useAchievementStore.getState();
    
    // Check score achievements
    achievementStore.checkAchievement('score_1000', newScore);
    achievementStore.checkAchievement('score_5000', newScore);
    achievementStore.checkAchievement('score_10000', newScore);
    
    // Check line clear achievements
    achievementStore.checkAchievement('lines_10', nextStats.linesCleared);
    achievementStore.checkAchievement('lines_50', nextStats.linesCleared);
    achievementStore.checkAchievement('lines_100', nextStats.linesCleared);
    
    // Check first game achievement
    if (nextStats.gamesPlayed >= 1) {
      achievementStore.checkAchievement('first_game', 1);
    }
    
    // Check combo achievements
    if (newCombo >= 5) {
      achievementStore.checkAchievement('combo_master', newCombo);
    }
    
    // Check streak achievements (from progression system)
    if (gameMode === GameMode.ENDLESS) {
      const currentStreak = updatedProgressionState.currentStreak;
      achievementStore.checkAchievement('streak_3', currentStreak);
      achievementStore.checkAchievement('streak_7', currentStreak);
      achievementStore.checkAchievement('streak_30', currentStreak);
    }
    
    // Check flux master achievement (removed - no flux system)
    
    return true;
  },

  checkGameOver: () => {
    const { grid, pieces, gameMode } = get();
    
    // Don't check game over while pieces are loading
    if (get().isPiecesLoading) return;
    
    if (pieces.length === 0) return; // Should not happen due to refill logic

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
        // Use streakStore instead of checkAndUpdateStreak
        import('@/src/shared/store/streakStore').then(({ useStreakStore }) => {
          useStreakStore.getState().recordGameCompleted();
        });
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
      
      // Save game log for analytics
      const gameStartTime = get().timerStartTime || Date.now() - 60000; // Fallback to 1 min ago
      const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000); // seconds
      const finalMaxCombo = get().maxCombo;
      const finalLinesCleared = currentStats.linesCleared || 0;
      
      // Detect badges
      let badge: 'new-record' | 'perfect' | 'comeback' | 'speedrun' | undefined;
      const previousHighScore = gameMode === GameMode.ENDLESS 
        ? (currentStats.endlessHighScore || 0)
        : (currentStats.timedHighScore || 0);
      
      if (finalScore > previousHighScore && previousHighScore > 0) {
        badge = 'new-record';
      } else if (get().perfectClearDetected) {
        badge = 'perfect';
      } else if (gameMode === GameMode.TIMED && gameDuration < 30) {
        badge = 'speedrun';
      }
      
      const newLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mode: gameMode,
        score: finalScore,
        timestamp: Date.now(),
        duration: gameDuration,
        linesCleared: finalLinesCleared,
        maxCombo: finalMaxCombo,
        badge,
        metadata: {
          tier: gameMode === GameMode.ENDLESS ? get().difficultyTier : undefined,
          chronoBonus: gameMode === GameMode.TIMED ? get().chronoBonus : undefined,
        },
      };
      
      // Add to logs (keep last 100)
      const currentLogs = get().gameLogs || [];
      const updatedLogs = [newLog, ...currentLogs].slice(0, 100);
      set({ gameLogs: updatedLogs });
      
      // Save to localStorage
      try {
        localStorage.setItem('flux_game_logs', JSON.stringify(updatedLogs));
      } catch (error) {
        console.error('[GameStore] Failed to save game logs:', error);
      }
      
      // Monetization integration: Record game end and streak
      try {
        // Dynamic import to avoid circular dependency
        import('../../../utils/managers/adManager').then(({ AdManager }) => {
          AdManager.recordGameEnd();
        }).catch((error) => {
          console.error('[GameStore] Failed to record game end:', error);
        });
      } catch (error) {
        console.error('[GameStore] Failed to record game end:', error);
      }
      
      try {
        // Dynamic import to avoid circular dependency
        import('../../../shared/store/streakStore').then(({ useStreakStore }) => {
          useStreakStore.getState().recordGameCompleted();
        }).catch((error) => {
          console.error('[GameStore] Failed to record game completion:', error);
        });
      } catch (error) {
        console.error('[GameStore] Failed to record game completion:', error);
      }
      
      playGameOver();
      set({ isGameOver: true });
      
      // Update dynamic shortcuts with recent mode
      try {
        import('../../../utils/native/dynamicShortcutHelper').then(({ saveRecentMode }) => {
          saveRecentMode(gameMode, finalScore);
        }).catch((error) => {
          console.error('[GameStore] Failed to update dynamic shortcuts:', error);
        });
      } catch (error) {
        console.error('[GameStore] Failed to update dynamic shortcuts:', error);
      }
      
      // Sync data to widgets and update
      const state = get();
      import('@/src/utils/native/widgetHelper').then(({ syncAllWidgetData }) => {
        // Get streak from streakStore instead of localStorage
        import('@/src/shared/store/streakStore').then(({ useStreakStore }) => {
          const currentStreak = useStreakStore.getState().currentStreak;
          syncAllWidgetData(state.highScores, currentStreak);
        });
      });
    }
  },

  resetGame: () => {
    get().initGame();
  },

  // Save current game state
  saveCurrentGame: () => {
    const state = get();
    
    // Don't save if game is over or not in game state
    if (state.isGameOver || state.appState !== AppState.GAME) {
      return false;
    }
    
    return saveGameState({
      grid: state.grid,
      pieces: state.pieces,
      score: state.score,
      combo: state.combo,
      flux: state.flux,
      gameMode: state.gameMode,
      difficultyTier: state.difficultyTier,
      timeLeft: state.timeLeft,
      timedBoostMovesLeft: state.timedBoostMovesLeft,
      maxCombo: state.maxCombo,
      chronoBonus: state.chronoBonus,
      activeEvent: state.activeEvent,
      eventMovesRemaining: state.eventMovesRemaining,
      miniEventState: state.miniEventState,
      progressionState: state.progressionState,
      totalMovesPlayed: state.totalMovesPlayed,
      isSurgeActive: state.isSurgeActive,
      savedAt: Date.now(),
    });
  },

  // Load saved game state
  loadSavedGame: () => {
    const savedState = loadGameState();
    
    if (!savedState) {
      return false;
    }
    
    console.log('[GameStore] Starting game load...');
    
    // First, initialize a fresh game with the saved mode
    // This ensures all components mount properly and pieces are fresh
    get().initGame(savedState.gameMode);
    
    // Wait longer for components to fully mount
    setTimeout(() => {
      const now = Date.now();
      const isTimed = savedState.gameMode === GameMode.TIMED;
      
      console.log('[GameStore] Components mounted, restoring state...');
      
      // Properly restore grid with all cell properties
      const restoredGrid = savedState.grid.map(row => 
        row.map(cell => ({
          filled: Boolean(cell.filled),
          color: cell.color || '',
          id: cell.filled ? uuidv4() : '',
          isClearing: false,
          type: cell.type,
          health: cell.health,
        }))
      );
      
      console.log('[GameStore] Grid cells restored:', restoredGrid.length, 'x', restoredGrid[0].length);
      console.log('[GameStore] Filled cells:', restoredGrid.flat().filter(c => c.filled).length);
      
      set({
        grid: restoredGrid,
        score: savedState.score,
        combo: savedState.combo,
        difficultyTier: savedState.difficultyTier,
        timeLeft: savedState.timeLeft,
        timedBoostMovesLeft: savedState.timedBoostMovesLeft,
        maxCombo: savedState.maxCombo,
        chronoBonus: savedState.chronoBonus,
        activeEvent: savedState.activeEvent,
        eventMovesRemaining: savedState.eventMovesRemaining,
        // IMPORTANT: Recreate mini event state instead of restoring
        // This prevents "not iterable" errors with Sets
        miniEventState: createMiniEventState(),
        // IMPORTANT: Recreate progression state instead of restoring
        progressionState: createProgressionState(),
        totalMovesPlayed: savedState.totalMovesPlayed,
        timerStartTime: isTimed ? now : null,
        timerExpectedEnd: isTimed ? now + (savedState.timeLeft * 1000) : null,
        isGameOver: false,
        draggedPiece: null,
      });
      
      console.log('[GameStore] State set complete');
      console.log('[GameStore] Current pieces count:', get().pieces.length);
      console.log('[GameStore] Is game over?', get().isGameOver);
      
      // Check game over after grid is restored
      setTimeout(() => {
        console.log('[GameStore] Running game over check...');
        get().checkGameOver();
        console.log('[GameStore] Game over check complete. Is game over?', get().isGameOver);
      }, 300);
    }, 250); // Increased delay
    
    // Clear the save after loading
    clearGameSave();
    
    return true;
  },

  // Check if saved game exists
  hasSavedGame: () => {
    return hasSavedGame();
  },

  setState: (update) => {
    set(update);
  }
};
});