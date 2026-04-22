/**
 * AnimationManager - Singleton class to manage concurrent Framer Motion animations
 * 
 * Prevents performance degradation by limiting the number of concurrent animations.
 * Max concurrent animations: 5
 * 
 * Usage:
 * ```typescript
 * import { animationManager } from './animationManager';
 * 
 * // Before starting an animation
 * if (animationManager.canAddAnimation()) {
 *   const animId = 'my-animation-123';
 *   animationManager.addAnimation(animId);
 *   
 *   // ... run animation ...
 *   
 *   // After animation completes
 *   animationManager.removeAnimation(animId);
 * }
 * ```
 */
export class AnimationManager {
  private activeAnimations: Set<string> = new Set();
  private readonly maxConcurrentAnimations = 5;

  /**
   * Check if a new animation can be added without exceeding the limit
   * @returns true if under the limit, false otherwise
   */
  canAddAnimation(): boolean {
    return this.activeAnimations.size < this.maxConcurrentAnimations;
  }

  /**
   * Add an animation to the active tracking set
   * @param id - Unique identifier for the animation
   * @returns true if animation was added, false if limit reached
   */
  addAnimation(id: string): boolean {
    if (!this.canAddAnimation()) {
      return false;
    }
    this.activeAnimations.add(id);
    return true;
  }

  /**
   * Remove an animation from the active tracking set
   * @param id - Unique identifier for the animation
   */
  removeAnimation(id: string): void {
    this.activeAnimations.delete(id);
  }

  /**
   * Get the current number of active animations
   * @returns Number of active animations
   */
  getActiveCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Clear all tracked animations (useful for cleanup/reset)
   */
  clearAll(): void {
    this.activeAnimations.clear();
  }
}

// Export singleton instance
export const animationManager = new AnimationManager();
