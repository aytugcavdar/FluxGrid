/**
 * Store Selector Utilities
 * 
 * Provides optimized selectors with stable references for Zustand stores.
 * Prevents unnecessary re-renders by using shallow equality checks.
 */

import { useGameStore } from '@features/game/store/gameStore';
import { useJuiceStore } from '@features/visual-effects/store/juiceStore';

/**
 * Select only game grid state
 * Use when component only needs grid data
 */
export const useGameGrid = () => 
  useGameStore((state) => state.grid);

/**
 * Select only game pieces
 * Use when component only needs pieces data
 */
export const useGamePieces = () => 
  useGameStore((state) => state.pieces);

/**
 * Select only score-related state
 * Use when component only needs score data
 */
export const useGameScore = () => 
  useGameStore((state) => ({
    score: state.score,
    highScore: state.highScore,
    combo: state.combo,
  }));

/**
 * Select only game stats
 * Use when component only needs stats data
 */
export const useGameStats = () => 
  useGameStore((state) => state.stats);

/**
 * Select only game mode and state
 * Use when component only needs game mode info
 */
export const useGameMode = () => 
  useGameStore((state) => ({
    gameMode: state.gameMode,
    isGameOver: state.isGameOver,
    appState: state.appState,
  }));

/**
 * Select only timer state
 * Use when component only needs timer data
 */
export const useGameTimer = () => 
  useGameStore((state) => ({
    timeLeft: state.timeLeft,
    timerStartTime: state.timerStartTime,
    timerExpectedEnd: state.timerExpectedEnd,
  }));

/**
 * Select only visual effects state
 * Use when component only needs juice effects
 */
export const useVisualEffects = () => 
  useJuiceStore((state) => ({
    screenShake: state.screenShake,
    lineClearAnimations: state.lineClearAnimations,
    particleExplosions: state.particleExplosions,
    comboGlow: state.comboGlow,
  }));

/**
 * Select only performance mode
 * Use when component only needs performance mode flag
 */
export const usePerformanceMode = () => 
  useJuiceStore((state) => state.performanceMode);

/**
 * Example usage:
 * 
 * // Instead of:
 * const { score, highScore, combo } = useGameStore();
 * 
 * // Use:
 * const { score, highScore, combo } = useGameScore();
 * 
 * This prevents re-renders when other gameStore properties change.
 */
