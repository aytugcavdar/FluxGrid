/**
 * Game Simplification
 * 
 * Simplifies game mechanics for first-time players
 */

import { useTutorialStore } from '../store/tutorialStore';

export class GameSimplification {
  /**
   * Check if this is the first game
   */
  static isFirstGame(): boolean {
    const { gamesCompleted } = useTutorialStore.getState();
    return gamesCompleted === 0;
  }
  
  /**
   * Check if this is the second game
   */
  static isSecondGame(): boolean {
    const { gamesCompleted } = useTutorialStore.getState();
    return gamesCompleted === 1;
  }
  
  /**
   * Get combo timer duration based on game number
   */
  static getComboTimerDuration(): number {
    const { gamesCompleted } = useTutorialStore.getState();
    
    if (gamesCompleted === 0) {
      // First game: 10 seconds, no break on expiration
      return 10;
    } else if (gamesCompleted === 1) {
      // Second game: 7 seconds
      return 7;
    } else {
      // Third game onwards: 5 seconds (standard)
      return 5;
    }
  }
  
  /**
   * Check if combo should break on timer expiration
   */
  static shouldBreakComboOnExpiration(): boolean {
    const { gamesCompleted } = useTutorialStore.getState();
    // Don't break combo in first game
    return gamesCompleted > 0;
  }
  
  /**
   * Check if events should be enabled
   */
  static shouldEnableEvents(): boolean {
    const { shouldShowFeature } = useTutorialStore.getState();
    return shouldShowFeature('events');
  }
  
  /**
   * Check if mini-events should be enabled
   */
  static shouldEnableMiniEvents(): boolean {
    const { shouldShowFeature } = useTutorialStore.getState();
    return shouldShowFeature('miniEvents');
  }
  
  /**
   * Check if skills should be enabled
   */
  static shouldEnableSkills(): boolean {
    const { shouldShowFeature } = useTutorialStore.getState();
    return shouldShowFeature('basicSkills') || shouldShowFeature('allSkills');
  }
  
  /**
   * Get allowed piece shapes for current game
   */
  static getAllowedPieceShapes(): string[] {
    const { gamesCompleted } = useTutorialStore.getState();
    
    if (gamesCompleted === 0) {
      // First game: only basic shapes
      return ['I', 'O', 'L', 'T'];
    } else {
      // All games after: all shapes
      return ['I', 'O', 'L', 'T', 'S', 'Z', 'J'];
    }
  }
  
  /**
   * Show congratulations message at end of first game
   */
  static showFirstGameComplete(): void {
    const { gamesCompleted } = useTutorialStore.getState();
    
    if (gamesCompleted === 1) {
      // Just completed first game
      console.log('[GameSimplification] First game completed!');
      
      // Dispatch custom event for UI to show congratulations
      window.dispatchEvent(new CustomEvent('first-game-complete'));
    }
  }
}
