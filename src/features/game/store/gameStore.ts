import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Piece, GRID_SIZE, GridCell, CellType, Achievement, MultiplierBreakdown, ProgressionState } from '../types';
import { AppState, GameStats, GameMode } from '@shared/types';
import { POINTS, EXPANDED_ACHIEVEMENTS, TIER_SCORE_MULTIPLIERS, TIMED_MODE, COMBO_TIMER, FIXED_GRID_TIER } from '../constants';
import {
  playPlace,
  playInvalid,
  playClear,
  playCombo,
  playIceHit,
  playIceBreak,
  playBombChain,
  playSkill,
  playSurgeStart,
  playSurgeEnd,
  gameFeelEvents,
} from '../../../utils/audio';
import { safeExecute, ErrorCategory } from '../../../utils/managers/errorHandler';
import { safeLocalStorageGet, safeParseInt, safeJSONParse } from './helpers/localStorage';
import { createEmptyGrid, processGrid } from './helpers/grid';
import { getRandomPiecesSync } from './helpers/pieces';
import { useThemeStore } from '@shared/store/themeStore';
import { useProfileStore } from '../../profile/store/profileStore';
import { useTutorialStore } from '../../tutorial/store/tutorialStore';
import { getTutorialGridState, getTutorialPieces } from '../../tutorial/data/tutorialPieces';
import { tickTimerImpl } from './helpers/timerLogic';
import {
  applyTier2FireSpreadPlans,
  checkTierEvent,
  createTier2FireSpreadPlans,
  ensureLateGameFireMinimumWithFeedback,
  getFireSpreadPendingTurns,
  type FireFeedbackCell,
  type FireSpreadPlan,
  isTier2FireSpreadPlanValid,
  removeVoidZones,
  spawnTier2FireWithFeedback,
  tickActiveEvent,
} from './helpers/eventSystem';
import {
  mergeAchievementNotificationQueue,
  updateAchievements,
  syncNewAchievement,
} from './helpers/achievementSystem';
import { createMiniEventState, checkMiniEvents, shouldPreventComboBreak, getMiniEventMultiplier, isPieceBlessingActive, tickMiniEvents } from './helpers/miniEventSystem';
import { createProgressionState, updateStreak, getStreakMultiplier, checkMilestones, checkTimedMilestones } from './helpers/progressionSystem';
import { JuiceTriggers } from '../../visual-effects/utils/juiceTriggers';
import {
  calculateComboScorePoints,
  calculateScore,
  calculateTurnScore,
  createEmptyTimedScoreBreakdown,
  type TimedScoreBreakdown
} from './helpers/scoreCalculator';
import { migrateSaveData, SaveData } from './helpers/migration';
import { storageService as LocalStorageService } from '@core/services/storage/StorageService';
import { saveGameState, loadGameState, clearGameSave, hasSavedGame } from './helpers/gameSaveSystem';
import { getTimedClearBonusSeconds } from './helpers/difficultyScaling';
import { finalizeGameRun } from './helpers/runFinalizer';
import {
  clampTier6GravityCharge,
  countImmediateCompletedLines,
  getNextTier6GravityCharge,
  shouldApplyGravityForTurn,
} from './helpers/tier6Gravity';
import {
  getNextTimedMomentum,
  resolveTimedTimeReward,
} from './helpers/timedInnovations';

// Re-export slice types for consumers
export type { TimedModeSlice } from './slices/timedModeSlice';
export type { ProgressionSlice } from './slices/progressionSlice';

export interface TimedEventFeedback {
  id: number;
  type: 'TARGET' | 'FREEZE' | 'LAST_CHANCE' | 'FINAL_RUSH' | 'CLEAR_TIME';
  label: string;
  seconds?: number;
  score?: number;
  targetCount?: number;
}

interface PendingCorruption {
  plans: FireSpreadPlan[];
  turnsRemaining: number;
}

/**
 * Synchronous stats save — ensures stats persist even when async
 * StorageService calls are interrupted by app exit/navigation.
 * Writes in StorageValue format so loadStats() can read it.
 */
function syncSaveStats(stats: GameStats): void {
  try {
    localStorage.setItem('fluxgrid_stats', JSON.stringify({
      version: 1,
      timestamp: Date.now(),
      data: stats,
    }));
  } catch {}
  // Also fire async for Capacitor Preferences
  LocalStorageService.saveStats(stats).catch(() => {});
}

function normalizeStoredAchievements(stored: string | null): Achievement[] {
  const parsed = safeJSONParse(stored || JSON.stringify(EXPANDED_ACHIEVEMENTS), EXPANDED_ACHIEVEMENTS);
  const savedList = Array.isArray(parsed)
    ? parsed
    : Object.values(parsed || {}).map((legacy: any) => ({
        id: legacy.id === 'score_1000' ? 'score_1k'
          : legacy.id === 'score_5000' ? 'score_5k'
          : legacy.id === 'score_10000' ? 'score_10k'
          : legacy.id === 'combo_master' ? 'combo_5'
          : legacy.id === 'first_game' ? 'games_1'
          : legacy.id,
        currentValue: legacy.currentValue ?? legacy.progress ?? 0,
        unlocked: Boolean(legacy.unlocked),
      }));

  return EXPANDED_ACHIEVEMENTS.map(def => {
    const saved = savedList.find((ach: any) => ach?.id === def.id);
    if (!saved) return { ...def };

    return {
      ...def,
      currentValue: Math.max(def.currentValue, Number(saved.currentValue) || 0),
      unlocked: Boolean(saved.unlocked) || (Number(saved.currentValue) || 0) >= def.targetValue,
    };
  });
}

export interface GameStore {
  // ── Core State ──────────────────────────────────────────────────────────────
  grid: GridState;
  pieces: Piece[];
  score: number;
  highScore: number;
  combo: number;
  isGameOver: boolean;
  gameOverFinalized: boolean;
  reviveUsedThisRun: boolean;
  draggedPiece: Piece | null;
  lastAction: {
    type: 'PLACE' | 'CLEAR' | 'MILESTONE';
    lines?: number;
    combo?: number;
    chainCount?: number;
    colorBonus?: boolean;
    clearedCells?: Array<{
      x: number;
      y: number;
      id?: string;
      color: string;
      cellType?: CellType;
    }>;
    clearedRows?: number[];
    clearedCols?: number[];
    movedCells?: Array<{
      id?: string;
      x: number;
      fromY: number;
      toY: number;
      cellType?: CellType;
    }>;
    lockedIceCells?: Array<{
      id?: string;
      x: number;
      y: number;
      color: string;
      health?: number;
    }>;
    damagedIceCells?: Array<{
      id?: string;
      x: number;
      y: number;
      color: string;
      health: number;
    }>;
    damagedFireCells?: Array<{
      id?: string;
      x: number;
      y: number;
      color: string;
      health: number;
    }>;
    fireSpawnedCells?: FireFeedbackCell[];
    fireSpreadCells?: FireFeedbackCell[];
    bombCells?: Array<{
      id?: string;
      x: number;
      y: number;
      color: string;
    }>;
    isPerfectClear?: boolean;
    tier6GravityTriggered?: boolean;
    tier?: number;
    tierName?: string;
    unlockLabel?: string;
    cellIds?: string[];
    dropHeight?: number;
  } | null;

  // ── Achievements ─────────────────────────────────────────────────────────────
  achievements: Achievement[];
  unlockedAchievementId: string | null;
  achievementNotificationQueue: string[];

  // ── Navigation & Persistence ─────────────────────────────────────────────────
  appState: AppState;
  gameMode: GameMode;
  highScores: { [key: string]: number };
  stats: GameStats;

  // ── Daily Challenge ───────────────────────────────────────────────────────────
  dailyClearHistory: boolean[][];

  // ── Piece State ───────────────────────────────────────────────────────────────
  isPiecesLoading: boolean;
  perfectClearDetected: boolean;

  // ── Game Logs ─────────────────────────────────────────────────────────────────
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
      skillsUsed?: string[];
      statsVersion?: number;
    };
  }>;

  // ── Progression Slice ─────────────────────────────────────────────────────────
  difficultyTier: number;
  tier6GravityCharge: number;
  totalMovesPlayed: number;
  runLinesCleared: number;
  tierStartMove: number;
  pendingCorruption: PendingCorruption | null;
  activeEvent: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  eventMovesRemaining: number;
  miniEventState: ReturnType<typeof createMiniEventState>;
  progressionState: ProgressionState;
  lastMultiplierBreakdown: MultiplierBreakdown | null;

  // ── Timed Mode Slice ──────────────────────────────────────────────────────────
  timeLeft: number;
  timerStartTime: number | null;
  timerExpectedEnd: number | null;
  timedBoostMovesLeft: number;
  maxCombo: number;
  finalSprintBonus: number;
  timedScoreBreakdown: TimedScoreBreakdown;
  timedTargets: Array<{ x: number; y: number }>;
  timedMomentum: number;
  timedLastClearAt: number | null;
  timedFreezeUntil: number | null;
  timedLastChanceAvailable: boolean;
  timedLastChanceActive: boolean;
  timedBonusSecondsEarned: number;
  timedFinalRushLocked: boolean;
  lastTimedEvent: TimedEventFeedback | null;
  timedMilestones: Set<string>;
  lastMilestoneShown: { id: string; label: string } | null;
  showNewRecordNotification: boolean;
  newRecordDiff: number;
  comboTimerStartTime: number | null;
  comboTimerDuration: number;
  comboTimeLeft: number;

  // ── Actions ───────────────────────────────────────────────────────────────────
  initGame: (mode?: GameMode, savedData?: SaveData) => void;
  setAppState: (state: AppState) => void;
  setGameMode: (mode: GameMode) => void;
  tickTimer: () => void;
  clearAchievementNotification: () => void;
  placePiece: (piece: Piece, startX: number, startY: number) => boolean;
  canPlacePiece: (grid: GridState, piece: Piece, startX: number, startY: number) => boolean;
  setDraggedPiece: (piece: Piece | null) => void;
  checkGameOver: () => void;
  finalizeGameOver: () => void;
  markReviveUsed: () => void;
  resetGame: () => void;
  setState: (update: Partial<GameStore>) => void;

  // ── Save/Load ─────────────────────────────────────────────────────────────────
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
  endlessGamesPlayed: 0,
  endlessHighScore: 0,
  endlessMaxCombo: 0,
  endlessTotalLines: 0,
  endlessMaxTier: 0,
  endlessEventCount: 0,
  timedGamesPlayed: 0,
  timedHighScore: 0,
  timedMaxCombo: 0,
  timedTotalLines: 0,
  timedMaxDuration: 0,
  timedSprintBonusTotal: 0,
  perfectClears: 0,
  recordsBroken: 0,
  largePiecesPlaced: 0,
  lineFivePiecesPlaced: 0,
  hollow3x3PiecesPlaced: 0,
  square3x3PiecesPlaced: 0,
  largePieceClears: 0,
};

export const useGameStore = create<GameStore>((set, get) => {
  const savedHighScores = LocalStorageService.loadHighScores();
  const savedStats = LocalStorageService.loadStats() || INITIAL_STATS;

  // ── Personal Best Helpers (Timed Mode) ────────────────────────────────────────
  const loadPersonalBest = (): number => {
    try {
      return LocalStorageService.loadStats()?.timedHighScore || 0;
    } catch {
      return 0;
    }
  };

  const savePersonalBest = (score: number): void => {
    try {
      const currentStats = get().stats;
      const updatedStats = {
        ...currentStats,
        timedHighScore: Math.max(currentStats.timedHighScore || 0, score),
      };
      set({ stats: updatedStats });
      syncSaveStats(updatedStats);
    } catch (error) {
      console.error('[PersonalBest] Failed to save:', error);
    }
  };

  const isNewPersonalBest = (currentScore: number): boolean => {
    return currentScore > (get().stats.timedHighScore || 0);
  };

  return {
    // ── Core Initial State ─────────────────────────────────────────────────────
    grid: createEmptyGrid(),
    pieces: [],
    score: 0,
    highScore: 0,
    combo: 0,
    isGameOver: false,
    gameOverFinalized: false,
    reviveUsedThisRun: false,
    draggedPiece: null,
    lastAction: null,

    achievements: normalizeStoredAchievements(safeLocalStorageGet('flux_achievements', JSON.stringify(EXPANDED_ACHIEVEMENTS))),
    unlockedAchievementId: null,
    achievementNotificationQueue: [],

    appState: AppState.HOME,
    gameMode: GameMode.ENDLESS,
    highScores: savedHighScores,
    stats: savedStats,

    dailyClearHistory: [],
    isPiecesLoading: false,
    perfectClearDetected: false,

    gameLogs: (() => {
      if (typeof window === 'undefined') return [];
      try {
        const stored = localStorage.getItem('flux_game_logs');
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),

    // ── Progression Slice Initial State ───────────────────────────────────────
    difficultyTier: 0,
    tier6GravityCharge: 0,
    totalMovesPlayed: 0,
    runLinesCleared: 0,
    tierStartMove: 0,
    pendingCorruption: null,
    activeEvent: null,
    eventMovesRemaining: 0,
    miniEventState: createMiniEventState(),
    progressionState: createProgressionState(),
    lastMultiplierBreakdown: null,

    // ── Timed Mode Slice Initial State ────────────────────────────────────────
    timeLeft: 0,
    timerStartTime: null,
    timerExpectedEnd: null,
    timedBoostMovesLeft: 0,
    maxCombo: 0,
    finalSprintBonus: 0,
    timedScoreBreakdown: createEmptyTimedScoreBreakdown(),
    timedTargets: [],
    timedMomentum: 0,
    timedLastClearAt: null,
    timedFreezeUntil: null,
    timedLastChanceAvailable: true,
    timedLastChanceActive: false,
    timedBonusSecondsEarned: 0,
    timedFinalRushLocked: false,
    lastTimedEvent: null,
    timedMilestones: new Set<string>(),
    lastMilestoneShown: null,
    showNewRecordNotification: false,
    newRecordDiff: 0,
    comboTimerStartTime: null,
    comboTimerDuration: COMBO_TIMER.DURATION,
    comboTimeLeft: 0,

    // ── Actions ───────────────────────────────────────────────────────────────
    initGame: (mode = GameMode.ENDLESS, savedData?: SaveData) => {
      const success = safeExecute(
        () => {
          if (!savedData) {
            clearGameSave();
          }

          const isTimed = mode === GameMode.TIMED;
          const isDaily = mode === GameMode.DAILY_CHALLENGE;
          const tutorialStore = useTutorialStore.getState();
          const shouldStartTutorial = !savedData && !tutorialStore.isCompleted;
          const tutorialGrid = shouldStartTutorial ? getTutorialGridState(0) : null;
          const tutorialPieces = shouldStartTutorial ? getTutorialPieces(0) : [];
          const initialGrid = tutorialGrid || createEmptyGrid();

          let migratedData: SaveData | undefined = savedData;
          if (savedData) {
            migratedData = migrateSaveData(savedData);
          }

          const loadedScore = migratedData?.score ?? 0;
          const loadedTier = migratedData?.difficultyTier ?? 0;
          const loadedTier6GravityCharge = loadedTier >= FIXED_GRID_TIER
            ? clampTier6GravityCharge(migratedData?.tier6GravityCharge ?? 0)
            : 0;
          const savedActiveEvent = migratedData?.activeEvent;
          const loadedActiveEvent =
            savedActiveEvent === 'ICE_STORM' ||
            savedActiveEvent === 'QUAKE' ||
            savedActiveEvent === 'MIRROR' ||
            savedActiveEvent === 'CHAOS' ||
            savedActiveEvent === 'VOID'
              ? savedActiveEvent
              : null;
          const loadedEventMovesRemaining = migratedData?.eventMovesRemaining ?? 0;
          const loadedMiniEventState = migratedData?.miniEventState ?? createMiniEventState();
          const loadedTotalMovesPlayed = migratedData?.totalMovesPlayed ?? 0;
          const loadedRunLinesCleared = migratedData?.runLinesCleared ?? 0;
          const loadedTierStartMove = migratedData?.tierStartMove ?? loadedTotalMovesPlayed;

          const currentHighScores = get().highScores;
          let modeHighScore = currentHighScores[mode] || 0;
          if (isTimed) {
            modeHighScore = loadPersonalBest();
          }

          set({
            grid: initialGrid,
            pieces: tutorialPieces.length > 0
              ? tutorialPieces
              : getRandomPiecesSync(
                  3,
                  initialGrid,
                  isDaily,
                  useThemeStore.getState().getPieceColors(),
                  loadedTier,
                  mode,
                  loadedMiniEventState,
                  loadedScore
                ),
            score: loadedScore,
            highScore: modeHighScore,
            combo: 0,
            isGameOver: false,
            gameOverFinalized: false,
            reviveUsedThisRun: false,
            draggedPiece: null,
            lastAction: null,
            unlockedAchievementId: null,
            achievementNotificationQueue: [],
            appState: AppState.GAME,
            gameMode: mode,
            // Timed mode slice
            timeLeft: isTimed ? TIMED_MODE.DURATION_SECONDS : 0,
            timerStartTime: null,
            timerExpectedEnd: null,
            timedBoostMovesLeft: 0,
            maxCombo: 0,
            finalSprintBonus: 0,
            timedScoreBreakdown: createEmptyTimedScoreBreakdown(),
            timedTargets: [],
            timedMomentum: 0,
            timedLastClearAt: null,
            timedFreezeUntil: null,
            timedLastChanceAvailable: isTimed,
            timedLastChanceActive: false,
            timedBonusSecondsEarned: 0,
            timedFinalRushLocked: false,
            lastTimedEvent: null,
            timedMilestones: new Set<string>(),
            lastMilestoneShown: null,
            showNewRecordNotification: false,
            newRecordDiff: 0,
            comboTimerStartTime: null,
            comboTimeLeft: 0,
            // Progression slice
            difficultyTier: loadedTier,
            tier6GravityCharge: loadedTier6GravityCharge,
            activeEvent: loadedActiveEvent,
            eventMovesRemaining: loadedEventMovesRemaining,
            miniEventState: loadedMiniEventState,
            totalMovesPlayed: loadedTotalMovesPlayed,
            runLinesCleared: loadedRunLinesCleared,
            tierStartMove: loadedTierStartMove,
            pendingCorruption: null,
            lastMultiplierBreakdown: null,
            // Daily challenge
            dailyClearHistory: [],
            // Piece state
            isPiecesLoading: false,
          });

          if (shouldStartTutorial) {
            tutorialStore.start();
          }

          return true;
        },
        false,
        ErrorCategory.GAME_STATE,
        { operation: 'initGame', mode }
      );

      if (!success) {
        set({
          grid: createEmptyGrid(),
          pieces: [],
          score: 0,
          isGameOver: false,
          gameOverFinalized: false,
          reviveUsedThisRun: false,
          tier6GravityCharge: 0,
          appState: AppState.HOME
        });
      }
    },

    setAppState: (state) => {
      // Save achievements when leaving game screen
      if (get().appState === AppState.GAME && state !== AppState.GAME) {
        try {
          localStorage.setItem('flux_achievements', JSON.stringify(get().achievements));
        } catch (error) {
          console.error('[Achievement] Failed to save on app state change:', error);
        }
      }
      set({ appState: state });
    },

    setGameMode: (mode) => set({ gameMode: mode }),

    tickTimer: () => tickTimerImpl(get, set),

    clearAchievementNotification: () => set(state => {
      const remainingQueue = state.achievementNotificationQueue.slice(1);
      return {
        achievementNotificationQueue: remainingQueue,
        unlockedAchievementId: remainingQueue[0] ?? null,
      };
    }),

    setDraggedPiece: (piece) => set({ draggedPiece: piece }),

    canPlacePiece: (grid, piece, startX, startY) => {
      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col] === 1) {
            const gridY = startY + row;
            const gridX = startX + col;
            if (gridY < 0 || gridY >= GRID_SIZE || gridX < 0 || gridX >= GRID_SIZE) return false;
            if (grid[gridY][gridX].filled) return false;
          }
        }
      }
      return true;
    },

    placePiece: (piece, startX, startY) => {
      const { grid, score, combo, highScore, gameMode, timerStartTime } = get();
      const isTimedMode = gameMode === GameMode.TIMED;
      const isTutorialActive = useTutorialStore.getState().isActive;
      const wasTimedLastChanceActive = isTimedMode && get().timedLastChanceActive;

      if (!grid || grid.length !== GRID_SIZE) {
        console.error('placePiece: invalid grid state');
        return false;
      }

      if (!get().canPlacePiece(grid, piece, startX, startY)) {
        JuiceTriggers.onInvalidPlacement();
        playInvalid();
        gameFeelEvents.invalidPlacement();
        return false;
      }

      JuiceTriggers.onValidPlacement();

      // Track real run duration in every mode; Timed also needs its deadline.
      if (timerStartTime === null && !isTutorialActive) {
        const now = Date.now();
        set(gameMode === GameMode.TIMED
          ? {
              timerStartTime: now,
              timerExpectedEnd: now + TIMED_MODE.DURATION_SECONDS * 1000,
              timeLeft: TIMED_MODE.DURATION_SECONDS,
            }
          : { timerStartTime: now });
      }

      const justPlacedPiece = piece;

      // Increment move counter for streak eligibility and Endless progression.
      set({ totalMovesPlayed: get().totalMovesPlayed + 1 });

      // Update grid
      const tempGrid = grid.map(row => row.map(cell => ({ ...cell })));
      let blocksPlaced = 0;
      const placedBlockCoords: Array<{x: number, y: number, color: string}> = [];
      const placedCellIds: string[] = [];

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
              health: piece.type === CellType.ICE ? 2 : undefined,
            };
            blocksPlaced++;
            placedCellIds.push(cellId);
            placedBlockCoords.push({ x: gridX, y: gridY, color: piece.color });
          }
        }
      }

      const dropHeight = startY;

      // Tier 6 uses a predictable charge: the third successful clear gets gravity.
      const turnDifficultyTier = get().difficultyTier;
      const currentTier6GravityCharge = get().tier6GravityCharge;
      const immediateCompletedLines = countImmediateCompletedLines(tempGrid);
      const gravityEnabled = shouldApplyGravityForTurn(
        gameMode,
        turnDifficultyTier,
        currentTier6GravityCharge,
        immediateCompletedLines
      );
      const { grid: newGrid, totalLinesCleared: linesCleared, chainCount, colorBonus, bombsExploded, iceBroken, actions } = processGrid(tempGrid, {
        applyGravity: gravityEnabled,
      });
      const nextTier6GravityCharge = getNextTier6GravityCharge(
        gameMode,
        turnDifficultyTier,
        currentTier6GravityCharge,
        immediateCompletedLines
      );
      const tier6GravityTriggered = gameMode === GameMode.ENDLESS
        && turnDifficultyTier >= FIXED_GRID_TIER
        && immediateCompletedLines > 0
        && gravityEnabled;
      const feedbackClearActions = actions.filter(action => action.type === 'CELL_CLEAR');
      const damagedIceCount = feedbackClearActions.reduce(
        (total, action) => total + (action.damagedIceCells?.length || 0),
        0
      );
      const bombChainCount = feedbackClearActions.reduce(
        (total, action) => total + (action.bombCells?.length || 0),
        0
      );
      const now = Date.now();
      const hitTimedTargets: Array<{ x: number; y: number }> = [];
      const nextTimedTargets: Array<{ x: number; y: number }> = [];
      const timedTargetReward = { seconds: 0, scoreMultiplier: 1 };
      const timedMomentumResult = isTimedMode
        ? getNextTimedMomentum(
            get().timedMomentum,
            linesCleared,
            get().timedLastClearAt,
            now
          )
        : {
            momentum: get().timedMomentum,
            lastClearAt: get().timedLastClearAt,
            freezeTriggered: false,
          };

      if (linesCleared > 0) {
        JuiceTriggers.onLinesCleared(actions as any, combo + linesCleared);
      }

      const isPerfectClear = newGrid.every(row =>
        row.every(cell => !cell.filled || cell.type === CellType.VOID)
      );
      if (isPerfectClear) {
        set({ perfectClearDetected: true });
      }
      const largeAchievementShapeIds = new Set([
        'rect_2x3',
        'rect_3x2',
        'h5',
        'v5',
        'big_l_shape',
        'big_j_shape',
        'hollow_3x3',
        'square_3x3',
      ]);
      const isLargeAchievementPiece = largeAchievementShapeIds.has(piece.id);
      const isLineFivePiece = piece.id === 'h5' || piece.id === 'v5';

      // Mini-events (Endless only)
      let updatedMiniEventState = get().miniEventState;
      if (gameMode === GameMode.ENDLESS) {
        updatedMiniEventState = checkMiniEvents(get().totalMovesPlayed, get().miniEventState, get().difficultyTier);
      } else {
        updatedMiniEventState = createMiniEventState();
      }

      // Combo timer logic
      const comboShieldPrevented = gameMode === GameMode.ENDLESS && shouldPreventComboBreak(updatedMiniEventState, linesCleared);
      const currentComboTimer = get().comboTimerStartTime;
      const comboTimerDuration = get().comboTimerDuration;

      let newCombo: number;
      let newComboTimerStart: number | null = null;

      if (linesCleared > 0) {
        newCombo = combo + linesCleared;
        newComboTimerStart = now;
      } else if (comboShieldPrevented) {
        newCombo = combo;
        newComboTimerStart = currentComboTimer;
      } else {
        if (currentComboTimer !== null && now - currentComboTimer >= comboTimerDuration) {
          newCombo = 0;
          newComboTimerStart = null;
        } else {
          newCombo = combo;
          newComboTimerStart = currentComboTimer;
        }
      }

      const shouldUpdateTimeLeft = linesCleared > 0 || newComboTimerStart === null || newComboTimerStart !== currentComboTimer;
      const newComboTimeLeft = shouldUpdateTimeLeft
        ? (newComboTimerStart !== null
            ? Math.max(0, (comboTimerDuration - (now - newComboTimerStart)) / 1000)
            : 0)
        : get().comboTimeLeft;

      // Streak (Endless only)
      let updatedProgressionState = get().progressionState;
      let streakMultiplier = 1.0;
      if (gameMode === GameMode.ENDLESS) {
        const newStreak = updateStreak(updatedProgressionState.currentStreak, linesCleared, comboShieldPrevented);
        streakMultiplier = getStreakMultiplier(newStreak);
        updatedProgressionState = { ...updatedProgressionState, currentStreak: newStreak };
      }

      // COMBO_RUSH (Timed mode)
      const prevTimedBoostMoves = get().timedBoostMovesLeft;
      let newTimedBoostMoves = prevTimedBoostMoves;

      if (isTimedMode && newCombo >= 4 && prevTimedBoostMoves === 0) {
        newTimedBoostMoves = 3;
      } else if (isTimedMode && prevTimedBoostMoves > 0) {
        newTimedBoostMoves = Math.max(0, prevTimedBoostMoves - 1);
      }

      const isRushActive = isTimedMode && newTimedBoostMoves > 0;
      if (isRushActive && linesCleared === 0) {
        newCombo = Math.max(combo, 1);
      }

      const comboMultiplier = linesCleared > 0 ? newCombo : combo;
      const finalRushLockedForTurn = isTimedMode && (
        get().timedFinalRushLocked ||
        get().timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD
      );
      const clearTimeBonus = isTimedMode && linesCleared > 0
        ? (wasTimedLastChanceActive
            ? TIMED_MODE.LAST_CHANCE_SECONDS
            : getTimedClearBonusSeconds(linesCleared, isPerfectClear, isRushActive))
        : 0;
      const freezeTimeBonus = timedMomentumResult.freezeTriggered
        ? TIMED_MODE.MOMENTUM_FREEZE_SECONDS
        : 0;
      const requestedTimeReward = clearTimeBonus + freezeTimeBonus;
      const timedTimeReward = isTimedMode
        ? resolveTimedTimeReward(
            requestedTimeReward,
            get().timedBonusSecondsEarned,
            finalRushLockedForTurn,
            get().timedLastChanceAvailable,
            wasTimedLastChanceActive
          )
        : { grantedSeconds: 0, convertedScore: 0, totalBonusSeconds: 0 };
      const isFinalSeconds = finalRushLockedForTurn;

      const {
        pointsGained,
        scoreDelta: baseTimedScoreDelta,
        sprintBonusGained,
        timedScoreBreakdown: baseTimedScoreBreakdown,
        breakdown,
      } = calculateTurnScore({
        blocksPlaced,
        linesCleared,
        comboMultiplier,
        colorBonus,
        tier: gameMode === GameMode.ENDLESS ? get().difficultyTier : 0,
        activeEvent: gameMode === GameMode.ENDLESS ? get().activeEvent : null,
        miniEventState: updatedMiniEventState,
        streakMultiplier,
        isTimedMode,
        isFinalSeconds,
        previousTimedBreakdown: get().timedScoreBreakdown,
      });

      const timedTargetScoreBonus = 0;
      const timedRewardScoreBonus = timedTimeReward.convertedScore;
      const timedScoreDelta = baseTimedScoreDelta + timedRewardScoreBonus;
      const timedScoreBreakdown = timedRewardScoreBonus > 0
        ? {
            ...baseTimedScoreBreakdown,
            bonus: baseTimedScoreBreakdown.bonus + timedRewardScoreBonus,
            total: baseTimedScoreBreakdown.total + timedRewardScoreBonus,
          }
        : baseTimedScoreBreakdown;
      let newScore = score + timedScoreDelta;

      // Milestones (Endless only)
      if (gameMode === GameMode.ENDLESS) {
        const { milestones, newMilestone } = checkMilestones(newScore, updatedProgressionState.milestones);
        updatedProgressionState = {
          ...updatedProgressionState,
          milestones,
          lastMilestoneShown: newMilestone?.id ?? updatedProgressionState.lastMilestoneShown,
        };
      }

      // lastAction
      if (linesCleared > 0) {
        const clearActions = actions.filter(action => action.type === 'CELL_CLEAR');
        const clearedCells = clearActions.flatMap(action => action.cells || []);
        const clearedRows = Array.from(new Set(clearActions.flatMap(action => action.rows || [])));
        const clearedCols = Array.from(new Set(clearActions.flatMap(action => action.cols || [])));
        const movedCells = clearActions.flatMap(action => action.movedCells || []);
        const lockedIceCells = clearActions.flatMap(action => action.lockedIceCells || []);
        const damagedIceCells = clearActions.flatMap(action => action.damagedIceCells || []);
        const damagedFireCells = clearActions.flatMap(action => action.damagedFireCells || []);
        const bombCells = clearActions.flatMap(action => action.bombCells || []);

        set({
          lastAction: {
            type: 'CLEAR',
            lines: linesCleared,
            combo: comboMultiplier,
            chainCount,
            colorBonus,
            clearedCells,
            clearedRows,
            clearedCols,
            movedCells,
            lockedIceCells,
            damagedIceCells,
            damagedFireCells,
            bombCells,
            isPerfectClear,
            tier6GravityTriggered,
          }
        });
        if (gameMode === GameMode.DAILY_CHALLENGE) {
          const snapshot = new Array(linesCleared).fill(null).map(() => new Array(4).fill(null).map(() => Math.random() > 0.3));
          set({ dailyClearHistory: [...get().dailyClearHistory, ...snapshot].slice(-6) });
        }
      } else {
        set({ lastAction: { type: 'PLACE', cellIds: placedCellIds, dropHeight } });
      }

      // Tier events (Endless). Calculate before tray refill so newly unlocked
      // ICE/BOMB rates can affect the replacement tray immediately.
      const prevDifficultyTier = get().difficultyTier;
      let tierResult: ReturnType<typeof checkTierEvent> | null = null;
      if (get().gameMode === GameMode.ENDLESS) {
        tierResult = checkTierEvent(newScore, prevDifficultyTier, get, set);
        if (tierResult) {
          (tierResult as any).tierStartMove = get().totalMovesPlayed;
        }
      }

      // Refill tray
      let currentPieces = get().pieces.filter(p => p.instanceId !== piece.instanceId);
      if (currentPieces.length === 0 && !isTutorialActive) {
        set({ isPiecesLoading: true });
        const isDaily = get().gameMode === GameMode.DAILY_CHALLENGE;
        const currentTier = get().gameMode === GameMode.ENDLESS
          ? tierResult?.difficultyTier ?? get().difficultyTier
          : 0;
        try {
          currentPieces = getRandomPiecesSync(
            3, newGrid, isDaily,
            useThemeStore.getState().getPieceColors(),
            currentTier, get().gameMode, updatedMiniEventState, newScore
          );
        } catch {
          currentPieces = getRandomPiecesSync(3, undefined, false, useThemeStore.getState().getPieceColors(), 0, get().gameMode, createMiniEventState(), newScore);
        } finally {
          set({ isPiecesLoading: false });
        }
      }

      // Sounds
      if (linesCleared > 0) {
        playClear(linesCleared, comboMultiplier);
        if (iceBroken > 0) {
          playIceBreak();
          gameFeelEvents.iceHit(true);
        } else if (damagedIceCount > 0) {
          playIceHit();
          gameFeelEvents.iceHit(false);
        }
        if (bombChainCount > 0) {
          playBombChain(bombChainCount);
          gameFeelEvents.bombChain(bombChainCount);
        }
        if ([2, 5, 8].includes(comboMultiplier) || (comboMultiplier > 8 && comboMultiplier % 5 === 0)) {
          playCombo(comboMultiplier);
        }
        gameFeelEvents.linesCleared(linesCleared, comboMultiplier);
      } else {
        playPlace();
        gameFeelEvents.placement();
      }

      // High score
      const modeKey = get().gameMode;
      const currentHighs = get().highScores;
      const modeHighScore = currentHighs[modeKey] || 0;
      if (!isTutorialActive && newScore > modeHighScore) {
        const newHighs = { ...currentHighs, [modeKey]: newScore };
        set({ highScores: newHighs, highScore: newScore });
        try {
          const storageKey = 'fluxgrid_high_scores';
          const existing = localStorage.getItem(storageKey);
          let parsed: any = {};
          if (existing) {
            try {
              const sv = JSON.parse(existing);
              parsed = (sv && sv.data && typeof sv.data === 'object') ? sv.data : (typeof sv === 'object' ? sv : {});
            } catch { parsed = {}; }
          }
          parsed[modeKey] = newScore;
          localStorage.setItem(storageKey, JSON.stringify({ version: 1, timestamp: Date.now(), data: parsed }));
        } catch {}
        LocalStorageService.saveHighScore(modeKey, newScore).catch(() => {});
      }

      // Timed mode time reward
      let extraTime = 0;
      let timedTimeLeft = get().timeLeft;
      let nextTimerExpectedEnd = get().timerExpectedEnd;
      let nextTimedLastChanceActive = get().timedLastChanceActive;
      let timedRunEndsAfterMove = false;
      let nextTimedFreezeUntil = get().timedFreezeUntil;
      let nextTimedEvent = get().lastTimedEvent;

      if (isTimedMode && linesCleared > 0) {
        extraTime = timedTimeReward.grantedSeconds;

        const rewardNow = Date.now();
        const currentExpectedEnd = wasTimedLastChanceActive
          ? rewardNow
          : nextTimerExpectedEnd;
        if (currentExpectedEnd) {
          nextTimerExpectedEnd = currentExpectedEnd + (extraTime * 1000);
          timedTimeLeft = Math.max(0, Math.ceil((nextTimerExpectedEnd - rewardNow) / 1000));
        }

        if (wasTimedLastChanceActive) {
          nextTimedLastChanceActive = false;
          nextTimedEvent = {
            id: now,
            type: 'LAST_CHANCE',
            seconds: timedTimeReward.grantedSeconds,
            label: `SON ŞANS · +${TIMED_MODE.LAST_CHANCE_SECONDS} sn`,
          };
        } else if (hitTimedTargets.length > 0) {
          const scoreLabel = timedTargetReward.scoreMultiplier > 1 ? ' · 2× SKOR' : '';
          const timeLabel = timedTimeReward.grantedSeconds > 0
            ? ` · +${timedTimeReward.grantedSeconds} sn`
            : '';
          const convertedLabel = timedTimeReward.convertedScore > 0
            ? ` · +${timedTimeReward.convertedScore} SKOR`
            : '';
          nextTimedEvent = {
            id: now,
            type: 'TARGET',
            seconds: timedTimeReward.grantedSeconds,
            score: timedTimeReward.convertedScore + timedTargetScoreBonus,
            targetCount: hitTimedTargets.length,
            label: `${hitTimedTargets.length} ZAMAN HEDEFİ${timeLabel}${convertedLabel}${scoreLabel}`,
          };
        } else if (timedMomentumResult.freezeTriggered && timedTimeReward.grantedSeconds > 0) {
          nextTimedEvent = {
            id: now,
            type: 'FREEZE',
            seconds: timedTimeReward.grantedSeconds,
            label: `BOOST DOLDU · +${timedTimeReward.grantedSeconds} sn`,
          };
        } else if (timedTimeReward.grantedSeconds > 0) {
          nextTimedEvent = {
            id: now,
            type: 'CLEAR_TIME',
            seconds: timedTimeReward.grantedSeconds,
            label: `+${timedTimeReward.grantedSeconds} sn`,
          };
        } else if (timedTimeReward.convertedScore > 0) {
          nextTimedEvent = {
            id: now,
            type: 'FINAL_RUSH',
            score: timedTimeReward.convertedScore,
            label: `FINAL RUSH · +${timedTimeReward.convertedScore} SKOR`,
          };
        }

        if (
          timedMomentumResult.freezeTriggered &&
          !finalRushLockedForTurn &&
          timedTimeReward.grantedSeconds > 0
        ) {
          nextTimedFreezeUntil = now + (TIMED_MODE.MOMENTUM_FREEZE_SECONDS * 1000);
        }
      } else if (wasTimedLastChanceActive) {
        nextTimedLastChanceActive = false;
        nextTimerExpectedEnd = null;
        timedTimeLeft = 0;
        timedRunEndsAfterMove = true;
      }

      const newMaxCombo = Math.max(get().maxCombo, newCombo);

      // Active event tick
      // Tier 6 is a fixed-grid challenge only. End any previous event instead
      // of carrying VOID/CHAOS effects into the final tier.
      const eventUpdates = tierResult?.difficultyTier === 6
        ? (get().activeEvent === 'VOID' ? { grid: removeVoidZones(newGrid) } : null)
        : tickActiveEvent(newGrid, justPlacedPiece, get, set, currentPieces);
      const tierUpdates = tierResult ?? {};
      let finalGrid = (eventUpdates as any)?.grid ?? (tierUpdates as any)?.grid ?? newGrid;

      let eventLinesCleared = 0;
      let totalPointsGained = timedScoreDelta;
      let totalLinesCleared = linesCleared;
      let totalBombsExploded = bombsExploded;
      let totalIceBroken = iceBroken;
      let totalColorBonus = colorBonus;
      let maxChainCount = chainCount;

      if ((eventUpdates as any)?.grid || (tierUpdates as any)?.grid) {
        const effectiveTier = (tierResult as any)?.difficultyTier ?? get().difficultyTier;
        const eventGravityEnabled = gameMode !== GameMode.ENDLESS || effectiveTier < FIXED_GRID_TIER;
        const processResult = processGrid(finalGrid, { applyGravity: eventGravityEnabled });
        finalGrid = processResult.grid;
        eventLinesCleared = processResult.totalLinesCleared;

        if (eventLinesCleared > 0) {
          newCombo += eventLinesCleared;
          JuiceTriggers.onLinesCleared(processResult.actions as any, newCombo);
          const eventBasePoints = (eventLinesCleared * POINTS.LINE_CLEARED) + calculateComboScorePoints(newCombo);
          const { score: eventScore } = calculateScore(
            eventBasePoints, processResult.colorBonus, 1.0,
            gameMode === GameMode.ENDLESS ? get().difficultyTier : 0,
            gameMode === GameMode.ENDLESS ? get().activeEvent : null,
            updatedMiniEventState, eventLinesCleared, 1.0, streakMultiplier
          );
          totalPointsGained += eventScore;
          newScore += eventScore;
          totalLinesCleared += eventLinesCleared;
          totalBombsExploded += processResult.bombsExploded;
          totalIceBroken += processResult.iceBroken;
          totalColorBonus = totalColorBonus || processResult.colorBonus;
          maxChainCount = Math.max(maxChainCount, processResult.chainCount);
          if (eventUpdates) {
            const eventClearActions = processResult.actions.filter(action => action.type === 'CELL_CLEAR');
            (eventUpdates as any).lastAction = {
              type: 'CLEAR', lines: eventLinesCleared,
              chainCount: processResult.chainCount, colorBonus: processResult.colorBonus,
              clearedCells: eventClearActions.flatMap(action => action.cells || []),
              clearedRows: Array.from(new Set(eventClearActions.flatMap(action => action.rows || []))),
              clearedCols: Array.from(new Set(eventClearActions.flatMap(action => action.cols || []))),
              movedCells: eventClearActions.flatMap(action => action.movedCells || []),
              lockedIceCells: eventClearActions.flatMap(action => action.lockedIceCells || []),
              damagedIceCells: eventClearActions.flatMap(action => action.damagedIceCells || []),
              damagedFireCells: eventClearActions.flatMap(action => action.damagedFireCells || []),
              bombCells: eventClearActions.flatMap(action => action.bombCells || []),
            };
          }
        }
      }

      let fireSpawnedCells: FireFeedbackCell[] = [];
      let fireSpreadCells: FireFeedbackCell[] = [];
      let nextPendingCorruption = get().pendingCorruption;

      if (gameMode === GameMode.ENDLESS) {
        const effectiveTier = tierResult?.difficultyTier ?? get().difficultyTier;
        const spreadPendingTurns = getFireSpreadPendingTurns(newScore);
        if (tierResult?.difficultyTier === 2) {
          const fireResult = spawnTier2FireWithFeedback(finalGrid);
          finalGrid = fireResult.grid;
          fireSpawnedCells = fireResult.cells;
          const plans = createTier2FireSpreadPlans(finalGrid);
          nextPendingCorruption = plans.length > 0
            ? { plans, turnsRemaining: spreadPendingTurns }
            : null;
        } else if (tierResult?.difficultyTier === 5 || tierResult?.difficultyTier === 6) {
          const minimumFireCount = tierResult.difficultyTier === 5 ? 2 : 3;
          const fireResult = ensureLateGameFireMinimumWithFeedback(finalGrid, minimumFireCount);
          finalGrid = fireResult.grid;
          fireSpawnedCells = fireResult.cells;
          const plans = createTier2FireSpreadPlans(finalGrid);
          nextPendingCorruption = plans.length > 0
            ? { plans, turnsRemaining: spreadPendingTurns }
            : null;
        } else if (effectiveTier >= 2) {
          const pending = get().pendingCorruption;
          const validPlans = pending?.plans.filter(plan => (
            isTier2FireSpreadPlanValid(finalGrid, plan)
          )) ?? [];
          if (pending && validPlans.length > 0) {
            if (pending.turnsRemaining > 0) {
              nextPendingCorruption = {
                plans: validPlans,
                turnsRemaining: pending.turnsRemaining - 1,
              };
            } else {
              const fireResult = applyTier2FireSpreadPlans(finalGrid, validPlans);
              finalGrid = fireResult.grid;
              fireSpreadCells = fireResult.cells;
              const nextPlans = createTier2FireSpreadPlans(finalGrid);
              nextPendingCorruption = nextPlans.length > 0
                ? { plans: nextPlans, turnsRemaining: spreadPendingTurns }
                : null;
            }
          } else {
            const plans = createTier2FireSpreadPlans(finalGrid);
            nextPendingCorruption = plans.length > 0
              ? { plans, turnsRemaining: spreadPendingTurns }
              : null;
          }
        }
      }

      // Tick mini-events (Endless only)
      if (gameMode === GameMode.ENDLESS) {
        const comboWouldBreak = totalLinesCleared === 0 && combo > 0;
        updatedMiniEventState = tickMiniEvents(updatedMiniEventState, totalLinesCleared, comboWouldBreak);
      }

      const finalPerfectClear = finalGrid.every(row =>
        row.every(cell => !cell.filled || cell.type === CellType.VOID)
      );
      const fireFeedbackLastAction = fireSpawnedCells.length > 0 || fireSpreadCells.length > 0
        ? {
            ...((eventUpdates as any)?.lastAction ?? (tierUpdates as any)?.lastAction ?? get().lastAction ?? { type: 'PLACE' as const }),
            fireSpawnedCells,
            fireSpreadCells,
          }
        : null;

      set({
        ...tierUpdates,
        ...eventUpdates,
        ...(fireFeedbackLastAction ? { lastAction: fireFeedbackLastAction } : {}),
        grid: finalGrid,
        pendingCorruption: nextPendingCorruption,
        score: newScore,
        highScore: isTutorialActive ? get().highScore : Math.max(newScore, get().highScore),
        combo: newCombo,
        pieces: currentPieces,
        timeLeft: timedTimeLeft,
        finalSprintBonus: get().finalSprintBonus + sprintBonusGained,
        timedScoreBreakdown,
        maxCombo: newMaxCombo,
        timedBoostMovesLeft: newTimedBoostMoves,
        timedTargets: nextTimedTargets,
        timedMomentum: timedMomentumResult.momentum,
        timedLastClearAt: timedMomentumResult.lastClearAt,
        timedFreezeUntil: nextTimedFreezeUntil,
        timedLastChanceActive: nextTimedLastChanceActive,
        timedBonusSecondsEarned: timedTimeReward.totalBonusSeconds,
        timedFinalRushLocked: finalRushLockedForTurn,
        lastTimedEvent: nextTimedEvent,
        timerExpectedEnd: nextTimerExpectedEnd,
        miniEventState: updatedMiniEventState,
        progressionState: updatedProgressionState,
        comboTimerStartTime: newComboTimerStart,
        comboTimeLeft: newComboTimeLeft,
        lastMultiplierBreakdown: breakdown,
        perfectClearDetected: get().perfectClearDetected || finalPerfectClear,
        tier6GravityCharge: tierResult?.difficultyTier === FIXED_GRID_TIER
          ? 0
          : nextTier6GravityCharge,
        ...(timedRunEndsAfterMove ? { isGameOver: true } : {}),
      });

      // Timed milestones + personal best
      if (gameMode === GameMode.TIMED && !isTutorialActive) {
        const reachedMilestones = get().timedMilestones;
        const newMilestone = checkTimedMilestones(newScore, reachedMilestones);
        if (newMilestone) {
          const updatedMilestones = new Set(reachedMilestones);
          updatedMilestones.add(newMilestone.id);
          set({ timedMilestones: updatedMilestones, lastMilestoneShown: newMilestone });
        }
        if (isNewPersonalBest(newScore)) {
          savePersonalBest(newScore);
        }
      }

      if (!isTutorialActive) {
        // Tutorial actions are practice and must not alter lifetime stats or
        // unlock real achievements.
        const currentStats = get().stats;
        const nextStats: GameStats = {
          ...currentStats,
          blocksPlaced: currentStats.blocksPlaced + blocksPlaced,
          linesCleared: currentStats.linesCleared + totalLinesCleared,
          totalScore: currentStats.totalScore + totalPointsGained,
          bombsExploded: currentStats.bombsExploded + totalBombsExploded,
          iceBroken: currentStats.iceBroken + totalIceBroken,
          perfectClears: (currentStats.perfectClears || 0) + (finalPerfectClear ? 1 : 0),
          largePiecesPlaced: (currentStats.largePiecesPlaced || 0) + (isLargeAchievementPiece ? 1 : 0),
          lineFivePiecesPlaced: (currentStats.lineFivePiecesPlaced || 0) + (isLineFivePiece ? 1 : 0),
          hollow3x3PiecesPlaced: (currentStats.hollow3x3PiecesPlaced || 0) + (piece.id === 'hollow_3x3' ? 1 : 0),
          square3x3PiecesPlaced: (currentStats.square3x3PiecesPlaced || 0) + (piece.id === 'square_3x3' ? 1 : 0),
          largePieceClears: (currentStats.largePieceClears || 0) + (isLargeAchievementPiece && totalLinesCleared > 0 ? 1 : 0),
        };

        if (gameMode === GameMode.ENDLESS) {
          nextStats.endlessTotalLines = (currentStats.endlessTotalLines || 0) + totalLinesCleared;
          nextStats.endlessMaxCombo = Math.max(currentStats.endlessMaxCombo || 0, newCombo);
          nextStats.endlessMaxTier = Math.max(currentStats.endlessMaxTier || 0, get().difficultyTier);
          if (tierResult && (tierResult as any).activeEvent) {
            nextStats.endlessEventCount = (currentStats.endlessEventCount || 0) + 1;
          }
        } else if (gameMode === GameMode.TIMED) {
          nextStats.timedTotalLines = (currentStats.timedTotalLines || 0) + linesCleared;
          nextStats.timedMaxCombo = Math.max(currentStats.timedMaxCombo || 0, newCombo);
          nextStats.timedSprintBonusTotal = (currentStats.timedSprintBonusTotal || 0) + sprintBonusGained;
        }

        set({
          stats: nextStats,
          runLinesCleared: get().runLinesCleared + totalLinesCleared,
        });
        syncSaveStats(nextStats);

        const previousAchievements = get().achievements;
        const updatedAchievements = updateAchievements(previousAchievements, {
          newScore, newCombo, previousCombo: combo,
          totalBombsExploded: nextStats.bombsExploded || 0,
          totalIceBroken: nextStats.iceBroken || 0,
          stats: nextStats, gameMode,
          difficultyTier: get().difficultyTier,
          isPerfectClear: finalPerfectClear,
          colorBonus: totalColorBonus, chainCount: maxChainCount,
        });
        const currentQueue = get().achievementNotificationQueue;
        const notificationQueue = mergeAchievementNotificationQueue(
          currentQueue,
          previousAchievements,
          updatedAchievements
        );
        set({
          achievements: updatedAchievements,
          achievementNotificationQueue: notificationQueue,
          unlockedAchievementId: get().unlockedAchievementId ?? notificationQueue[0] ?? null,
        });
        syncNewAchievement(previousAchievements, updatedAchievements);
      }

      get().checkGameOver();
      return true;
    },

    finalizeGameOver: () => {
      finalizeGameRun(get, set, syncSaveStats);
    },

    markReviveUsed: () => {
      set({ reviveUsedThisRun: true, gameOverFinalized: false });
    },

    checkGameOver: () => {
      const { grid, pieces } = get();
      if (get().isPiecesLoading) return;
      if (pieces.length === 0) return;

      let canFitAny = false;
      outer: for (const piece of pieces) {
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (get().canPlacePiece(grid, piece, x, y)) {
              canFitAny = true;
              break outer;
            }
          }
        }
      }

      if (!canFitAny) {
        set({ isGameOver: true });
      }
    },

    resetGame: () => {
      get().initGame();
    },

    saveCurrentGame: () => {
      const state = get();
      if (state.isGameOver || state.appState !== AppState.GAME || useTutorialStore.getState().isActive) return false;
      return saveGameState({
        grid: state.grid,
        pieces: state.pieces,
        score: state.score,
        combo: state.combo,
        gameMode: state.gameMode,
        difficultyTier: state.difficultyTier,
        tier6GravityCharge: state.tier6GravityCharge,
        timeLeft: state.timeLeft,
        timedBoostMovesLeft: state.timedBoostMovesLeft,
        maxCombo: state.maxCombo,
        timedTargets: state.timedTargets,
        timedMomentum: state.timedMomentum,
        timedLastClearAt: state.timedLastClearAt,
        timedLastChanceAvailable: state.timedLastChanceAvailable,
        timedLastChanceActive: state.timedLastChanceActive,
        timedBonusSecondsEarned: state.timedBonusSecondsEarned,
        timedFinalRushLocked: state.timedFinalRushLocked,
        timedScoreBreakdown: state.timedScoreBreakdown,
        activeEvent: state.activeEvent,
        eventMovesRemaining: state.eventMovesRemaining,
        miniEventState: state.miniEventState,
        progressionState: state.progressionState,
        totalMovesPlayed: state.totalMovesPlayed,
        runLinesCleared: state.runLinesCleared,
        runElapsedSeconds: state.timerStartTime
          ? Math.max(0, Math.floor((Date.now() - state.timerStartTime) / 1000))
          : 0,
        tierStartMove: state.tierStartMove,
        savedAt: Date.now(),
      });
    },

    loadSavedGame: () => {
      const savedState = loadGameState();
      if (!savedState) return false;

      console.log('[GameStore] Starting game load...');
      get().initGame(savedState.gameMode);

      setTimeout(() => {
        const now = Date.now();
        const isTimed = savedState.gameMode === GameMode.TIMED;

        const restoredGrid = savedState.grid.map(row =>
          row.map(cell => ({
            filled: Boolean(cell.filled),
            color: cell.color || '',
            id: cell.filled ? uuidv4() : '',
            isClearing: false,
            type: cell.type,
            health: cell.health,
            voidTurns: cell.voidTurns,
          }))
        );

        set({
          grid: restoredGrid,
          score: savedState.score,
          combo: savedState.combo,
          difficultyTier: savedState.difficultyTier,
          tier6GravityCharge: savedState.difficultyTier >= FIXED_GRID_TIER
            ? clampTier6GravityCharge(savedState.tier6GravityCharge ?? 0)
            : 0,
          timeLeft: savedState.timeLeft,
          timedBoostMovesLeft: savedState.timedBoostMovesLeft,
          maxCombo: savedState.maxCombo,
          timedTargets: [],
          timedMomentum: isTimed ? (savedState.timedMomentum ?? 0) : 0,
          timedLastClearAt: isTimed ? (savedState.timedLastClearAt ?? null) : null,
          timedFreezeUntil: null,
          timedLastChanceAvailable: isTimed
            ? (savedState.timedLastChanceAvailable ?? true)
            : false,
          timedLastChanceActive: isTimed
            ? (savedState.timedLastChanceActive ?? false)
            : false,
          timedBonusSecondsEarned: isTimed
            ? (savedState.timedBonusSecondsEarned ?? 0)
            : 0,
          timedFinalRushLocked: isTimed
            ? (savedState.timedFinalRushLocked ?? savedState.timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD)
            : false,
          lastTimedEvent: null,
          activeEvent: savedState.activeEvent,
          eventMovesRemaining: savedState.eventMovesRemaining,
          miniEventState: createMiniEventState(),
          progressionState: createProgressionState(),
          totalMovesPlayed: savedState.totalMovesPlayed,
          runLinesCleared: savedState.runLinesCleared ?? 0,
          tierStartMove: savedState.tierStartMove ?? savedState.totalMovesPlayed,
          timerStartTime: savedState.totalMovesPlayed > 0
            ? now - ((savedState.runElapsedSeconds ?? 0) * 1000)
            : null,
          timerExpectedEnd: isTimed && !savedState.timedLastChanceActive
            ? now + (savedState.timeLeft * 1000)
            : null,
          timedScoreBreakdown: savedState.timedScoreBreakdown ?? createEmptyTimedScoreBreakdown(),
          isGameOver: false,
          draggedPiece: null,
        });

        setTimeout(() => {
          get().checkGameOver();
        }, 300);
      }, 250);

      clearGameSave();
      return true;
    },

    hasSavedGame: () => hasSavedGame(),

    setState: (update) => set(update),
  };
});
