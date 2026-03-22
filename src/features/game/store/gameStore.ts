import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Piece, GRID_SIZE, GridCell, SkillType, CellType, Achievement } from '../types';
import { AppState, GameStats, GameMode } from '@shared/types';
import { POINTS, FLUX_COST, EXPANDED_ACHIEVEMENTS, ZEN_PALETTES, TIER_SCORE_MULTIPLIERS } from '../constants';
import { playPlace, playClear, playCombo, playSkill, playGameOver, playSurgeStart, playSurgeEnd, playHaptic } from '../../../utils/audio';
import { safeExecute, ErrorCategory } from '../../../utils/errorHandler';
import { debouncedSave, safeLocalStorageGet, safeParseInt, safeJSONParse } from './helpers/localStorage';
import { createEmptyGrid, processGrid } from './helpers/grid';
import { getRandomPiecesSync } from './helpers/pieces';
import { useThemeStore } from '@shared/store/themeStore';
import { useProfileStore } from '../../profile/store/profileStore';
import { checkAndUpdateStreak } from '@utils/streakManager';
import { tickTimerImpl } from './helpers/timerLogic';
import { checkTierEvent, tickActiveEvent } from './helpers/eventSystem';
import { updateAchievements, syncNewAchievement } from './helpers/achievementSystem';

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
  } | null;
  
  // Achievements State
  achievements: Achievement[];
  unlockedAchievementId: string | null;

  // Navigation & Persistence
  appState: AppState;
  gameMode: GameMode;
  timeLeft: number;
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
  activeEvent: 'ICE_STORM' | 'FOG' | 'QUAKE' | 'MIRROR' | null;
  eventMovesRemaining: number;

  // Timed Mode State
  timedBoostMovesLeft: number;
  maxCombo: number;
  chronoBonus: number;

  // Actions
  initGame: (mode?: GameMode) => void;
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
  
  // Achievements Initial State
  achievements: safeJSONParse(safeLocalStorageGet('flux_achievements', JSON.stringify(EXPANDED_ACHIEVEMENTS)), EXPANDED_ACHIEVEMENTS),
  unlockedAchievementId: null,

  // Navigation & Persistence
  appState: AppState.HOME,
  gameMode: GameMode.ENDLESS,
  timeLeft: 0,
  highScores: safeJSONParse(safeLocalStorageGet('flux_highscores', '{}'), {}),
  stats: safeJSONParse(safeLocalStorageGet('flux_stats', JSON.stringify(INITIAL_STATS)), INITIAL_STATS),
  maxLevelReached: safeParseInt(safeLocalStorageGet('flux_max_level', '0')),
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

  // Timed Mode Initial State
  timedBoostMovesLeft: 0,
  maxCombo: 0,
  chronoBonus: 0,

  initGame: (mode = GameMode.ENDLESS) => {
    const success = safeExecute(
      () => {
        const isTimed = mode === GameMode.TIMED;
        const isDaily = mode === GameMode.DAILY_CHALLENGE;
        const isZen = mode === GameMode.ZEN;
        const initialGrid = createEmptyGrid();
        
        set({
          grid: initialGrid,
          pieces: getRandomPiecesSync(3, initialGrid, isDaily, isZen ? ZEN_PALETTES[0] : useThemeStore.getState().getPieceColors(), 0, mode),
          score: 0,
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
          difficultyTier: 0,
          // ZEN mode initialization
          zenSessionTime: isZen ? 0 : get().zenSessionTime,
          zenBlocksPlaced: isZen ? 0 : get().zenBlocksPlaced,
          zenPaletteIndex: isZen ? 0 : get().zenPaletteIndex,
          // Daily Challenge initialization
          dailyClearHistory: [],
          // Event System initialization
          activeEvent: null,
          eventMovesRemaining: 0,
          // Timed Mode initialization
          timedBoostMovesLeft: 0,
          maxCombo: 0,
          chronoBonus: 0
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
    const { grid: newGrid, totalLinesCleared: linesCleared, chainCount, colorBonus, bombsExploded, iceBroken, actions } = processGrid(tempGrid);

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

    // 4. Puan hesaplama (ZEN modda skip edilir)
    // Combo: ZEN'de combo sıfırlanmaz, diğer modlarda satır temizlenmezse sıfırlanır
    let newCombo = gameMode === GameMode.ZEN 
      ? combo + (linesCleared > 0 ? 1 : 0)
      : (linesCleared > 0 ? combo + 1 : 0);
    
    // COMBO_RUSH logic for Timed mode
    const isTimedMode = gameMode === GameMode.TIMED;
    const isComboRushActive = get().timedBoostMovesLeft > 0;
    
    if (isTimedMode) {
      // Activate COMBO_RUSH when combo reaches 4
      if (newCombo >= 4 && !isComboRushActive) {
        set({ timedBoostMovesLeft: 3 });
      }
      
      // During COMBO_RUSH, prevent combo from dropping to 0
      if (isComboRushActive && linesCleared === 0) {
        newCombo = Math.max(combo, 1);
      }
      
      // Decrement COMBO_RUSH counter
      if (isComboRushActive) {
        set({ timedBoostMovesLeft: Math.max(0, get().timedBoostMovesLeft - 1) });
      }
    }
    
    const comboMultiplier = newCombo;

    // Renk bonusu: tek renk satır/sütun temizleme
    const colorBonusMultiplier = (linesCleared > 0 && colorBonus) ? POINTS.COLOR_BONUS_MULTIPLIER : 1;
    // Surge bonusu: flux=100 iken aktif
    const surgeMultiplier = (linesCleared > 0 && isSurgeActive) ? POINTS.SURGE_MULTIPLIER : 1;
    // Tier çarpanı: Endless modda zorluk seviyesine göre
    const tierMultiplier = gameMode === GameMode.ENDLESS
      ? (TIER_SCORE_MULTIPLIERS[get().difficultyTier] ?? 1.0)
      : 1.0;
    // Final seconds multiplier: Timed modda son 10 saniyede 1.5x
    const isFinalSeconds = gameMode === GameMode.TIMED && get().timeLeft <= 10;
    const finalSecondsMultiplier = isFinalSeconds ? 1.5 : 1.0;

    const basePoints = (blocksPlaced * POINTS.BLOCK_PLACED) +
                       (linesCleared * POINTS.LINE_CLEARED) +
                       (comboMultiplier * POINTS.COMBO_MULTIPLIER);
    const pointsGained = Math.floor(basePoints * colorBonusMultiplier * surgeMultiplier * tierMultiplier * finalSecondsMultiplier);
    
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

    // Save achievements (debounced)
    debouncedSave('flux_achievements', JSON.stringify(updatedAchievements));

    // Sync newly unlocked achievement to Firestore
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
      currentPieces = getRandomPiecesSync(3, newGrid, isDaily, zenPalette ?? useThemeStore.getState().getPieceColors(), currentTier, get().gameMode); // Use newGrid for density calculation
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
      // Add CHRONO bonus
      extraTime += chronoBonusSeconds;
      
      // Timer'ı 60 saniyede cap'le
      const newTimeLeft = Math.min(60, Math.max(0, get().timeLeft + extraTime));
      extraTime = newTimeLeft - get().timeLeft; // Gerçek değişimi hesapla
    }

    // Calculate new movesLeft - not used anymore

    // Update maxCombo
    const newMaxCombo = Math.max(get().maxCombo, newCombo);

    set({
      grid: newGrid,
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
      maxCombo: newMaxCombo
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

    // Check for tier events (Endless mode)
    const prevDifficultyTier = get().difficultyTier;
    
    // Check for tier events (Endless mode only)
    if (get().gameMode === GameMode.ENDLESS) {
      checkTierEvent(newScore, prevDifficultyTier, get, set);
    }

    // --- Aktif olay tick ---
    tickActiveEvent(get().grid, justPlacedPiece, get, set);

    get().checkGameOver();
    
    return true;
  },

  checkGameOver: () => {
    const { grid, pieces, activeSkill, gameMode } = get();
    
    // ZEN modda oyun hiç bitmez
    if (gameMode === GameMode.ZEN) return;
    
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
      
      playGameOver();
      set({ isGameOver: true });
    }
  },

  resetGame: () => {
    get().initGame();
  }
}));