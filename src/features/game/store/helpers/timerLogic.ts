import { GameMode, AppState } from '@shared/types';
import { playGameOver, playTick } from '../../../../utils/audio';
import { safeExecute, ErrorCategory } from '../../../../utils/managers/errorHandler';
import { TIMED_MODE } from '../../constants';
import { shouldApplyPassiveDecay, getPassiveDecayRate, getPassiveDecayInterval } from './difficultyScaling';

/**
 * Timer tick logic for TIMED game mode
 * Also expires the combo timer as a store-level fallback.
 */
export const tickTimerImpl = (
  get: () => any,
  set: (partial: any) => void
): void => {
  const {
    timeLeft,
    isGameOver,
    gameMode,
    appState,
    timerExpectedEnd,
    comboTimerStartTime,
    comboTimerDuration,
    combo,
    score,
    lastPassiveDecayTime,
    timedLastChanceAvailable,
    timedFinalRushLocked,
  } = get();
  
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
        }
      }
      
      // TIMED modda timer'ı azalt (Date.now() bazlı)
      if (gameMode === GameMode.TIMED) {
        if (!timerExpectedEnd) return; // Guard: timer başlatılmamış
        
        const now = Date.now();
        let currentExpectedEnd = timerExpectedEnd;
        
        // Apply passive decay if active
        if (shouldApplyPassiveDecay(score)) {
          const lastDecay = lastPassiveDecayTime || now;
          const elapsed = now - lastDecay;
          
          if (elapsed >= getPassiveDecayInterval()) {
            const decayAmount = getPassiveDecayRate();
            currentExpectedEnd = currentExpectedEnd - (decayAmount * 1000);
            
            set({
              timerExpectedEnd: currentExpectedEnd,
              lastPassiveDecayTime: now,
            });
          }
        }
        
        // Gerçek kalan süreyi hesapla
        const remainingMs = currentExpectedEnd - now;
        const newTimeLeft = Math.max(0, Math.ceil(remainingMs / 1000));
        const shouldLockFinalRush = newTimeLeft > 0 &&
          newTimeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD;
        
        // Play tick sound for last 10 seconds
        if (newTimeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD && newTimeLeft > 0 && timeLeft !== newTimeLeft) {
          playTick();
        }
        
        if (newTimeLeft <= 0) {
          if (timedLastChanceAvailable) {
            set({
              timeLeft: 0,
              timerExpectedEnd: null,
              timedLastChanceAvailable: false,
              timedLastChanceActive: true,
              timedFinalRushLocked: true,
              lastTimedEvent: {
                id: now,
                type: 'LAST_CHANCE',
                label: 'SON ŞANS · CLEAR YAP',
              },
            });
          } else {
            playGameOver();
            set({ timeLeft: 0, isGameOver: true });
          }
        } else if (timeLeft !== newTimeLeft || (shouldLockFinalRush && !timedFinalRushLocked)) {
          set({
            timeLeft: newTimeLeft,
            ...(shouldLockFinalRush ? { timedFinalRushLocked: true } : {}),
          });
        }
      }
    },
    undefined,
    ErrorCategory.GAME_STATE,
    { operation: 'tickTimer', gameMode, timeLeft }
  );
};
