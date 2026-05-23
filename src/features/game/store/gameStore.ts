import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Piece, GRID_SIZE, GridCell, CellType, Achievement, MultiplierBreakdown, ProgressionState } from '../types';
import { AppState, GameStats, GameMode } from '@shared/types';
import { POINTS, EXPANDED_ACHIEVEMENTS, TIER_SCORE_MULTIPLIERS, TIMED_MODE, COMBO_TIMER } from '../constants';
import { playPlace, playInvalid, playClear, playCombo, playSkill, playGameOver, playSurgeStart, playSurgeEnd, playHaptic } from '../../../utils/audio';
import { safeExecute, ErrorCategory } from '../../../utils/managers/errorHandler';
import { safeLocalStorageGet, safeParseInt, safeJSONParse } from './helpers/localStorage';
import { createEmptyGrid, processGrid } from './helpers/grid';
import { getRandomPiecesSync } from './helpers/pieces';
import { useThemeStore } from '@shared/store/themeStore';
import { useProfileStore } from '../../profile/store/profileStore';
import { useTutorialStore } from '../../tutorial/store/tutorialStore';
import { getTutorialGridState, getTutorialPieces } from '../../tutorial/data/tutorialPieces';
import { tickTimerImpl } from './helpers/timerLogic';
import { checkTierEvent, tickActiveEvent } from './helpers/eventSystem';
import { updateAchievements, syncNewAchievement } from './helpers/achievementSystem';
import { createMiniEventState, checkMiniEvents, shouldPreventComboBreak, getMiniEventMultiplier, isPieceBlessingActive, tickMiniEvents } from './helpers/miniEventSystem';
import { createProgressionState, updateStreak, getStreakMultiplier, checkMilestones, checkTimedMilestones } from './helpers/progressionSystem';
import { JuiceTriggers } from '../../visual-effects/utils/juiceTriggers';
import { calculateScore } from './helpers/scoreCalculator';
import { migrateSaveData, SaveData } from './helpers/migration';
import { storageService as LocalStorageService } from '@core/services/storage/StorageService';
import { useVisualEffectStore } from '../../visual-effects/store/visualEffectStore';
import { saveGameState, loadGameState, clearGameSave, hasSavedGame } from './helpers/gameSaveSystem';
import { calculateTimeBonus, calculateComboBonus } from './helpers/difficultyScaling';

// Re-export slice types for consumers
export type { TimedModeSlice } from './slices/timedModeSlice';
export type { ProgressionSlice } from './slices/progressionSlice';

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
  draggedPiece: Piece | null;
  lastAction: {
    type: 'PLACE' | 'CLEAR' | 'MILESTONE';
    lines?: number;
    combo?: number;
    chainCount?: number;
    colorBonus?: boolean;
    tier?: number;
    tierName?: string;
    cellIds?: string[];
    dropHeight?: number;
  } | null;

  // ── Achievements ─────────────────────────────────────────────────────────────
  achievements: Achievement[];
  unlockedAchievementId: string | null;

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
    };
  }>;

  // ── Progression Slice ─────────────────────────────────────────────────────────
  difficultyTier: number;
  totalMovesPlayed: number;
  tierStartMove: number;
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
    draggedPiece: null,
    lastAction: null,

    achievements: normalizeStoredAchievements(safeLocalStorageGet('flux_achievements', JSON.stringify(EXPANDED_ACHIEVEMENTS))),
    unlockedAchievementId: null,

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
    totalMovesPlayed: 0,
    tierStartMove: 0,
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
            draggedPiece: null,
            lastAction: null,
            unlockedAchievementId: null,
            appState: AppState.GAME,
            gameMode: mode,
            // Timed mode slice
            timeLeft: isTimed ? 60 : 0,
            timerStartTime: null,
            timerExpectedEnd: null,
            timedBoostMovesLeft: 0,
            maxCombo: 0,
            finalSprintBonus: 0,
            timedMilestones: new Set<string>(),
            lastMilestoneShown: null,
            showNewRecordNotification: false,
            newRecordDiff: 0,
            comboTimerStartTime: null,
            comboTimeLeft: 0,
            // Progression slice
            difficultyTier: loadedTier,
            activeEvent: loadedActiveEvent,
            eventMovesRemaining: loadedEventMovesRemaining,
            miniEventState: loadedMiniEventState,
            totalMovesPlayed: loadedTotalMovesPlayed,
            tierStartMove: loadedTierStartMove,
            lastMultiplierBreakdown: null,
            // Daily challenge
            dailyClearHistory: [],
            // Piece state
            isPiecesLoading: false,
          });

          const newStats = { ...get().stats, gamesPlayed: get().stats.gamesPlayed + 1 };
          if (mode === GameMode.ENDLESS) {
            newStats.endlessGamesPlayed = (newStats.endlessGamesPlayed || 0) + 1;
          } else if (mode === GameMode.TIMED) {
            newStats.timedGamesPlayed = (newStats.timedGamesPlayed || 0) + 1;
          }
          set({ stats: newStats });
          syncSaveStats(newStats);

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

    clearAchievementNotification: () => set({ unlockedAchievementId: null }),

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

      if (!grid || grid.length !== GRID_SIZE) {
        console.error('placePiece: invalid grid state');
        return false;
      }

      if (!get().canPlacePiece(grid, piece, startX, startY)) {
        JuiceTriggers.onInvalidPlacement();
        playInvalid();
        playHaptic('invalid');
        return false;
      }

      JuiceTriggers.onValidPlacement();

      // Start timer on first piece placement (Timed mode)
      if (gameMode === GameMode.TIMED && timerStartTime === null && !useTutorialStore.getState().isActive) {
        const now = Date.now();
        set({
          timerStartTime: now,
          timerExpectedEnd: now + 60000,
          timeLeft: 60,
        });
      }

      const justPlacedPiece = piece;

      // Increment move counter (Endless only)
      if (gameMode === GameMode.ENDLESS) {
        set({ totalMovesPlayed: get().totalMovesPlayed + 1 });
      }

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

      // Process grid (line clear, bombs, ice)
      const { grid: newGrid, totalLinesCleared: linesCleared, chainCount, colorBonus, bombsExploded, iceBroken, actions } = processGrid(tempGrid);

      if (linesCleared > 0) {
        JuiceTriggers.onLinesCleared(actions as any, combo + linesCleared);
      }

      const isPerfectClear = newGrid.every(row => row.every(cell => !cell.filled));
      if (isPerfectClear) {
        set({ perfectClearDetected: true });
      }

      // Cell explosion effects (throttled by combo level)
      if (combo < 10) {
        const maxExplosions = combo >= 5 ? 2 : 3;
        actions.forEach(action => {
          if (action.type === 'CELL_CLEAR') {
            const clearAction = action as any;
            clearAction.cells.slice(0, maxExplosions).forEach((cell: any) => {
              setTimeout(() => {
                useVisualEffectStore.getState().addEffect({
                  type: 'explosion',
                  duration: 100,
                  target: `cell-${cell.x}-${cell.y}`,
                  props: { x: cell.x, y: cell.y, color: cell.color, blockSize: 20, cellType: cell.cellType },
                });
              }, 50);
            });
          }
        });
      }

      // Mini-events (Endless only)
      let updatedMiniEventState = get().miniEventState;
      if (gameMode === GameMode.ENDLESS) {
        updatedMiniEventState = checkMiniEvents(get().totalMovesPlayed, get().miniEventState, get().difficultyTier);
      } else {
        updatedMiniEventState = createMiniEventState();
      }

      // Combo timer logic
      const comboShieldPrevented = gameMode === GameMode.ENDLESS && shouldPreventComboBreak(updatedMiniEventState, linesCleared);
      const now = Date.now();
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
      const isTimedMode = gameMode === GameMode.TIMED;
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
      const colorBonusMultiplier = (linesCleared > 0 && colorBonus) ? POINTS.COLOR_BONUS_MULTIPLIER : 1;
      const isFinalSeconds = gameMode === GameMode.TIMED && get().timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD;

      const basePoints = (blocksPlaced * POINTS.BLOCK_PLACED) +
                         (linesCleared * POINTS.LINE_CLEARED) +
                         (comboMultiplier * POINTS.COMBO_MULTIPLIER);

      const { score: pointsGained, breakdown } = calculateScore(
        basePoints,
        colorBonus,
        1.0,
        gameMode === GameMode.ENDLESS ? get().difficultyTier : 0,
        gameMode === GameMode.ENDLESS ? get().activeEvent : null,
        updatedMiniEventState,
        linesCleared,
        1.0, // passiveScoreMultiplier — ZEN deprecated, always 1.0
        streakMultiplier
      );

      let sprintBonusGained = 0;
      if (isFinalSeconds && linesCleared > 0) {
        sprintBonusGained = Math.floor(basePoints * 0.5);
      }

      let newScore = score + pointsGained;

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
        set({ lastAction: { type: 'CLEAR', lines: linesCleared, combo: comboMultiplier, chainCount, colorBonus } });
        if (gameMode === GameMode.DAILY_CHALLENGE) {
          const snapshot = new Array(linesCleared).fill(null).map(() => new Array(4).fill(null).map(() => Math.random() > 0.3));
          set({ dailyClearHistory: [...get().dailyClearHistory, ...snapshot].slice(-6) });
        }
      } else {
        set({ lastAction: { type: 'PLACE', cellIds: placedCellIds, dropHeight } });
      }

      // Refill tray
      let currentPieces = get().pieces.filter(p => p.instanceId !== piece.instanceId);
      if (currentPieces.length === 0) {
        set({ isPiecesLoading: true });
        const isDaily = get().gameMode === GameMode.DAILY_CHALLENGE;
        const currentTier = get().gameMode === GameMode.ENDLESS ? get().difficultyTier : 0;
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
        playClear(linesCleared);
        if ([2, 5, 8].includes(comboMultiplier) || (comboMultiplier > 8 && comboMultiplier % 5 === 0)) {
          playCombo(comboMultiplier);
        }
        playHaptic(linesCleared > 1 ? 'clear_multi' : 'clear_single');
      } else {
        playPlace();
        playHaptic('place');
      }

      // High score
      const modeKey = get().gameMode;
      const currentHighs = get().highScores;
      const modeHighScore = currentHighs[modeKey] || 0;
      if (newScore > modeHighScore) {
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
      const previousCombo = combo;
      if (get().gameMode === GameMode.TIMED && linesCleared > 0) {
        const bonusPerLine = calculateTimeBonus(score, linesCleared);
        extraTime = linesCleared * bonusPerLine;
        if (comboMultiplier > 1) extraTime += calculateComboBonus(score);

        const currentExpectedEnd = get().timerExpectedEnd;
        if (currentExpectedEnd) {
          const nowTs = Date.now();
          const maxTime = nowTs + 60000;
          const newExpectedEnd = Math.min(maxTime, currentExpectedEnd + (extraTime * 1000));
          const newTimeLeft = Math.max(0, Math.ceil((newExpectedEnd - nowTs) / 1000));
          extraTime = newTimeLeft - get().timeLeft;
          set({ timerExpectedEnd: newExpectedEnd });
        }
      }

      const newMaxCombo = Math.max(get().maxCombo, newCombo);

      // Tier events (Endless)
      const prevDifficultyTier = get().difficultyTier;
      let tierResult: ReturnType<typeof checkTierEvent> | null = null;
      if (get().gameMode === GameMode.ENDLESS) {
        tierResult = checkTierEvent(newScore, prevDifficultyTier, get, set);
        if (tierResult) {
          (tierResult as any).tierStartMove = get().totalMovesPlayed;
        }
      }

      // Active event tick
      const eventUpdates = tickActiveEvent(newGrid, justPlacedPiece, get, set);
      const tierUpdates = tierResult ?? {};
      let finalGrid = (eventUpdates as any)?.grid ?? (tierUpdates as any)?.grid ?? newGrid;

      let eventLinesCleared = 0;
      let totalPointsGained = pointsGained;
      let totalLinesCleared = linesCleared;
      let totalBombsExploded = bombsExploded;
      let totalIceBroken = iceBroken;
      let totalColorBonus = colorBonus;
      let maxChainCount = chainCount;

      if ((eventUpdates as any)?.grid || (tierUpdates as any)?.grid) {
        const processResult = processGrid(finalGrid);
        finalGrid = processResult.grid;
        eventLinesCleared = processResult.totalLinesCleared;

        if (eventLinesCleared > 0) {
          newCombo += eventLinesCleared;
          JuiceTriggers.onLinesCleared(processResult.actions as any, newCombo);
          const eventBasePoints = (eventLinesCleared * POINTS.LINE_CLEARED) + (newCombo * POINTS.COMBO_MULTIPLIER);
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
            (eventUpdates as any).lastAction = {
              type: 'CLEAR', lines: eventLinesCleared,
              chainCount: processResult.chainCount, colorBonus: processResult.colorBonus,
            };
          }
        }
      }

      // Tick mini-events (Endless only)
      if (gameMode === GameMode.ENDLESS) {
        const comboWouldBreak = totalLinesCleared === 0 && combo > 0;
        updatedMiniEventState = tickMiniEvents(updatedMiniEventState, totalLinesCleared, comboWouldBreak);
      }

      const finalPerfectClear = finalGrid.every(row => row.every(cell => !cell.filled));

      set({
        ...tierUpdates,
        ...eventUpdates,
        grid: finalGrid,
        score: newScore,
        highScore: Math.max(newScore, get().highScore),
        combo: newCombo,
        pieces: currentPieces,
        timeLeft: Math.min(99, get().timeLeft + extraTime),
        finalSprintBonus: get().finalSprintBonus + sprintBonusGained,
        maxCombo: newMaxCombo,
        timedBoostMovesLeft: newTimedBoostMoves,
        miniEventState: updatedMiniEventState,
        progressionState: updatedProgressionState,
        comboTimerStartTime: newComboTimerStart,
        comboTimeLeft: newComboTimeLeft,
        lastMultiplierBreakdown: breakdown,
        perfectClearDetected: get().perfectClearDetected || finalPerfectClear,
      });

      // Timed milestones + personal best
      if (gameMode === GameMode.TIMED) {
        const reachedMilestones = get().timedMilestones;
        const newMilestone = checkTimedMilestones(newScore, reachedMilestones);
        if (newMilestone) {
          const updatedMilestones = new Set(reachedMilestones);
          updatedMilestones.add(newMilestone.id);
          set({ timedMilestones: updatedMilestones, lastMilestoneShown: newMilestone });
        }
        if (isNewPersonalBest(newScore)) {
          const diff = newScore - (get().stats.timedHighScore || 0);
          set({ showNewRecordNotification: true, newRecordDiff: diff });
          savePersonalBest(newScore);
        }
      }

      // Global stats
      const currentStats = get().stats;
      const nextStats: GameStats = {
        ...currentStats,
        blocksPlaced: currentStats.blocksPlaced + blocksPlaced,
        linesCleared: currentStats.linesCleared + totalLinesCleared,
        totalScore: currentStats.totalScore + totalPointsGained,
        bombsExploded: currentStats.bombsExploded + totalBombsExploded,
        iceBroken: currentStats.iceBroken + totalIceBroken,
        perfectClears: (currentStats.perfectClears || 0) + (finalPerfectClear ? 1 : 0),
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

      set({ stats: nextStats });
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
      const newUnlock = updatedAchievements.find((ach, i) => ach.unlocked && !previousAchievements[i]?.unlocked);
      set({ achievements: updatedAchievements, unlockedAchievementId: newUnlock ? newUnlock.id : get().unlockedAchievementId });
      syncNewAchievement(previousAchievements, updatedAchievements);

      get().checkGameOver();
      return true;
    },

    checkGameOver: () => {
      const { grid, pieces, gameMode } = get();
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
        if (gameMode === GameMode.DAILY_CHALLENGE) {
          import('@shared/store/streakStore').then(({ useStreakStore }) => {
            useStreakStore.getState().recordGameCompleted();
          });
        }

        const currentStats = get().stats;
        const finalScore = get().score;
        const updatedStats = { ...currentStats };

        if (gameMode === GameMode.ENDLESS) {
          updatedStats.endlessHighScore = Math.max(currentStats.endlessHighScore || 0, finalScore);
        } else if (gameMode === GameMode.TIMED) {
          updatedStats.timedHighScore = Math.max(currentStats.timedHighScore || 0, finalScore);
          const duration = 60 - get().timeLeft;
          updatedStats.timedMaxDuration = Math.max(currentStats.timedMaxDuration || 0, duration);
        }

        const gameStartTime = get().timerStartTime || Date.now() - 60000;
        const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
        const finalMaxCombo = get().maxCombo;
        const finalLinesCleared = currentStats.linesCleared || 0;

        let badge: 'new-record' | 'perfect' | 'comeback' | 'speedrun' | undefined;
        const previousHighScore = gameMode === GameMode.ENDLESS
          ? (currentStats.endlessHighScore || 0)
          : (currentStats.timedHighScore || 0);

        if (finalScore > previousHighScore && previousHighScore > 0) badge = 'new-record';
        else if (get().perfectClearDetected) badge = 'perfect';
        else if (gameMode === GameMode.TIMED && gameDuration < 30) badge = 'speedrun';

        if (badge === 'new-record') {
          updatedStats.recordsBroken = (currentStats.recordsBroken || 0) + 1;
        }

        const previousAchievements = get().achievements;
        const updatedAchievements = updateAchievements(previousAchievements, {
          newScore: finalScore, newCombo: get().maxCombo, previousCombo: get().maxCombo,
          totalBombsExploded: updatedStats.bombsExploded || 0,
          totalIceBroken: updatedStats.iceBroken || 0,
          stats: updatedStats, gameMode, difficultyTier: get().difficultyTier,
          isPerfectClear: false, colorBonus: false, chainCount: 0,
        });
        const finalUnlock = updatedAchievements.find((ach, i) => ach.unlocked && !previousAchievements[i]?.unlocked);

        set({ stats: updatedStats, achievements: updatedAchievements, unlockedAchievementId: finalUnlock ? finalUnlock.id : get().unlockedAchievementId });
        syncSaveStats(updatedStats);
        syncNewAchievement(previousAchievements, updatedAchievements);

        const newLog = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          mode: gameMode, score: finalScore, timestamp: Date.now(),
          duration: gameDuration, linesCleared: finalLinesCleared, maxCombo: finalMaxCombo, badge,
          metadata: { tier: gameMode === GameMode.ENDLESS ? get().difficultyTier : undefined },
        };

        const updatedLogs = [newLog, ...(get().gameLogs || [])].slice(0, 100);
        set({ gameLogs: updatedLogs });
        try {
          localStorage.setItem('flux_game_logs', JSON.stringify(updatedLogs));
        } catch (error) {
          console.error('[GameStore] Failed to save game logs:', error);
        }

        // Side effects via dynamic imports (avoids circular deps)
        import('../../../core/services/ads/AdManager').then(({ AdManager }) => {
          AdManager.recordGameEnd();
        }).catch(console.error);

        Promise.all([
          import('../../../shared/store/streakStore'),
          import('@utils/native/widgetHelper'),
        ]).then(([{ useStreakStore }, { syncAllWidgetData }]) => {
          useStreakStore.getState().recordGameCompleted();
          syncAllWidgetData(get().highScores, useStreakStore.getState().currentStreak);
        }).catch(console.error);

        import('../../../utils/native/dynamicShortcutHelper').then(({ saveRecentMode }) => {
          saveRecentMode(gameMode, finalScore);
        }).catch(console.error);

        playGameOver();

        // Save achievements before setting game over
        try {
          localStorage.setItem('flux_achievements', JSON.stringify(get().achievements));
        } catch (error) {
          console.error('[Achievement] Failed to save on game end:', error);
        }

        set({ isGameOver: true });
      }
    },

    resetGame: () => {
      get().initGame();
    },

    saveCurrentGame: () => {
      const state = get();
      if (state.isGameOver || state.appState !== AppState.GAME) return false;
      return saveGameState({
        grid: state.grid,
        pieces: state.pieces,
        score: state.score,
        combo: state.combo,
        gameMode: state.gameMode,
        difficultyTier: state.difficultyTier,
        timeLeft: state.timeLeft,
        timedBoostMovesLeft: state.timedBoostMovesLeft,
        maxCombo: state.maxCombo,
        activeEvent: state.activeEvent,
        eventMovesRemaining: state.eventMovesRemaining,
        miniEventState: state.miniEventState,
        progressionState: state.progressionState,
        totalMovesPlayed: state.totalMovesPlayed,
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
          }))
        );

        set({
          grid: restoredGrid,
          score: savedState.score,
          combo: savedState.combo,
          difficultyTier: savedState.difficultyTier,
          timeLeft: savedState.timeLeft,
          timedBoostMovesLeft: savedState.timedBoostMovesLeft,
          maxCombo: savedState.maxCombo,
          activeEvent: savedState.activeEvent,
          eventMovesRemaining: savedState.eventMovesRemaining,
          miniEventState: createMiniEventState(),
          progressionState: createProgressionState(),
          totalMovesPlayed: savedState.totalMovesPlayed,
          tierStartMove: savedState.tierStartMove ?? savedState.totalMovesPlayed,
          timerStartTime: isTimed ? now : null,
          timerExpectedEnd: isTimed ? now + (savedState.timeLeft * 1000) : null,
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
