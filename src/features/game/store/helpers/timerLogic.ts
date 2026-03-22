import { v4 as uuidv4 } from 'uuid';
import { GameMode, AppState } from '@shared/types';
import { GRID_SIZE, CellType } from '../../types';
import { STONE_BLOCK } from '../../constants';
import { playGameOver, playTick, playSkill, playClear, playHaptic } from '../../../../utils/audio';
import { handleError, safeExecute, ErrorCategory, ErrorSeverity } from '../../../../utils/errorHandler';
import { debouncedSave } from './localStorage';

// SURVIVAL mode difficulty thresholds (seconds)
const SURVIVAL_DIFFICULTY_THRESHOLDS = [
  { time: 60, interval: 8 },
  { time: 120, interval: 6 },
  { time: 180, interval: 5 },
  { time: 200, interval: 4 },
];

/**
 * Timer tick logic for ZEN, SURVIVAL, and TIMED game modes
 */
export const tickTimerImpl = (
  get: () => any,
  set: (partial: any) => void
): void => {
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
          pushSurvivalRowImpl(get, set);
        } else {
          set({ survivalNextPush: newNextPush });
        }
        
        // Zorluk artışı kontrolü
        let newInterval = get().survivalPushInterval;
        for (const threshold of SURVIVAL_DIFFICULTY_THRESHOLDS) {
          if (newSurvivalTime === threshold.time && newInterval > threshold.interval) {
            newInterval = threshold.interval;
            set({ survivalPushInterval: newInterval });
            playSkill();
            break;
          }
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
};

/**
 * Push a new stone row from bottom in SURVIVAL mode
 */
export const pushSurvivalRowImpl = (
  get: () => any,
  set: (partial: any) => void
): void => {
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
  const topRowFilled = grid[0].some((cell: any) => cell.filled);
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
      const newGrid = grid.map((row: any) => row.map((cell: any) => ({ ...cell })));
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
};
