import { GameMode, AppState } from '@shared/types';
import { playGameOver, playTick } from '../../../../utils/audio';
import { safeExecute, ErrorCategory } from '../../../../utils/errorHandler';

/**
 * Timer tick logic for ZEN and TIMED game modes
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
