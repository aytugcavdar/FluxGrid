import { GameMode, AppState } from '@shared/types';
import { playGameOver, playTick } from '../../../../utils/audio';
import { safeExecute, ErrorCategory } from '../../../../utils/errorHandler';
import { TIMED_MODE } from '../../constants';

/**
 * Timer tick logic for ZEN and TIMED game modes
 * Also updates combo timer for all modes
 */
export const tickTimerImpl = (
  get: () => any,
  set: (partial: any) => void
): void => {
  const { timeLeft, isGameOver, gameMode, appState, timerExpectedEnd, comboTimerStartTime, comboTimerDuration, combo } = get();
  
  // Guard: Oyun bittiyse veya oyun ekranında değilse işlem yapma
  if (isGameOver || appState !== AppState.GAME) return;
  
  safeExecute(
    () => {
      // Update combo timer for all modes (except when combo is 0)
      if (comboTimerStartTime !== null && combo > 0) {
        const now = Date.now();
        const elapsed = now - comboTimerStartTime;
        const remaining = Math.max(0, (comboTimerDuration - elapsed) / 1000);
        
        // If timer expired, reset combo
        if (remaining <= 0) {
          set({ 
            combo: 0, 
            comboTimerStartTime: null, 
            comboTimeLeft: 0 
          });
        } else {
          set({ comboTimeLeft: remaining });
        }
      }
      
      // ZEN modda session time'ı artır
      if (gameMode === GameMode.ZEN) {
        const newTime = get().zenSessionTime + 1;
        // Guard: Makul bir üst limit (24 saat = 86400 saniye)
        if (newTime < 86400) {
          set({ zenSessionTime: newTime });
        }
        return;
      }
      
      // TIMED modda timer'ı azalt (Date.now() bazlı)
      if (gameMode === GameMode.TIMED) {
        if (!timerExpectedEnd) return; // Guard: timer başlatılmamış
        
        // Gerçek kalan süreyi hesapla
        const now = Date.now();
        const remainingMs = timerExpectedEnd - now;
        const newTimeLeft = Math.max(0, Math.ceil(remainingMs / 1000));
        
        // Play tick sound for last 10 seconds
        if (newTimeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD && newTimeLeft > 0 && timeLeft !== newTimeLeft) {
          playTick();
        }
        
        if (newTimeLeft <= 0) {
          playGameOver();
          set({ timeLeft: 0, isGameOver: true });
        } else {
          set({ timeLeft: newTimeLeft });
        }
      }
    },
    undefined,
    ErrorCategory.GAME_STATE,
    { operation: 'tickTimer', gameMode, timeLeft }
  );
};
