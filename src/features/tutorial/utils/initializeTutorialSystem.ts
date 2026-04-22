/**
 * Tutorial System Initialization
 * 
 * Wires tutorial system into game flow
 */

import { useTutorialStore } from '../store/tutorialStore';

/**
 * Initialize tutorial system on game start
 * This should be called when the game actually starts (initGame), not on mount
 */
export function initializeTutorialSystem(): void {
  console.log('[TutorialSystem] Initializing...');
  
  const tutorialStore = useTutorialStore.getState();
  
  // Check if tutorial should be shown
  if (!tutorialStore.isCompleted) {
    console.log('[TutorialSystem] Starting tutorial for new player');
    tutorialStore.start();
  } else {
    console.log('[TutorialSystem] Tutorial already completed');
  }
  
  console.log('[TutorialSystem] Initialization complete');
}

/**
 * Handle game end - increment games completed
 */
export function handleGameEnd(): void {
  const tutorialStore = useTutorialStore.getState();
  
  // Increment games completed
  tutorialStore.incrementGamesCompleted();
  
  console.log(`[TutorialSystem] Game completed. Total games: ${tutorialStore.gamesCompleted}`);
  
  // Check for feature unlocks
  const features: Array<'comboTimer' | 'basicSkills' | 'allSkills' | 'events' | 'miniEvents'> = ['comboTimer', 'basicSkills', 'allSkills', 'events', 'miniEvents'];
  for (const feature of features) {
    if (tutorialStore.shouldShowFeature(feature)) {
      console.log(`[TutorialSystem] Feature unlocked: ${feature}`);
    }
  }
}

/**
 * Dispatch tutorial validation event
 */
export function dispatchTutorialValidation(type: string): void {
  window.dispatchEvent(new CustomEvent('tutorial-validation', {
    detail: { type }
  }));
}
