/**
 * Score Popup Object Pool
 */

import { memoryManager } from '../utils/MemoryManager';

interface ScorePopupElement {
  id: string;
  value: number;
  x: number;
  y: number;
  isActive: boolean;
  element: HTMLElement | null;
  reset(): void;
}

/**
 * Create a new score popup element
 */
function createScorePopup(): ScorePopupElement {
  return {
    id: '',
    value: 0,
    x: 0,
    y: 0,
    isActive: false,
    element: null,
    reset() {
      this.id = '';
      this.value = 0;
      this.x = 0;
      this.y = 0;
      this.isActive = false;
      if (this.element) {
        this.element.remove();
        this.element = null;
      }
    }
  };
}

/**
 * Reset score popup to default state
 */
function resetScorePopup(popup: ScorePopupElement): void {
  popup.reset();
}

/**
 * Initialize score popup pool
 */
export function initScorePopupPool(): void {
  memoryManager.createPool({
    name: 'scorePopups',
    factory: createScorePopup,
    reset: resetScorePopup,
    initialSize: 8,
    maxSize: 16
  });
  
  console.log('[ScorePopupPool] Initialized with 8 popups (max 16)');
}

/**
 * Acquire a score popup from the pool
 */
export function acquireScorePopup(): ScorePopupElement {
  return memoryManager.acquire<ScorePopupElement>('scorePopups');
}

/**
 * Release a score popup back to the pool
 */
export function releaseScorePopup(popup: ScorePopupElement): void {
  memoryManager.release('scorePopups', popup);
}
