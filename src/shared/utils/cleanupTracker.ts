/**
 * CleanupTracker - Tracks and cleans up resources to prevent memory leaks
 * 
 * This class provides a centralized way to track timeouts, intervals, event listeners,
 * and animation frames, ensuring they are all properly cleaned up when no longer needed.
 * 
 * Each component instance should create its own CleanupTracker instance.
 * 
 * @example
 * ```typescript
 * const tracker = new CleanupTracker();
 * 
 * // Track a timeout
 * const timeoutId = setTimeout(() => console.log('Hello'), 1000);
 * tracker.trackTimeout(timeoutId);
 * 
 * // Track an event listener
 * const handler = () => console.log('Clicked');
 * element.addEventListener('click', handler);
 * tracker.trackListener(element, 'click', handler);
 * 
 * // Clean up all resources
 * tracker.cleanup();
 * ```
 */

// Type for timer IDs that works in both browser and Node.js environments
// In browser: number, In Node.js: NodeJS.Timeout
type TimerId = ReturnType<typeof setTimeout>;

export class CleanupTracker {
  private timeouts: Set<TimerId> = new Set();
  private intervals: Set<TimerId> = new Set();
  private listeners: Map<EventTarget, Map<string, EventListener>> = new Map();
  private animationFrames: Set<number> = new Set();

  /**
   * Track a setTimeout ID for cleanup
   * @param id - The timeout ID returned by setTimeout
   */
  trackTimeout(id: TimerId): void {
    this.timeouts.add(id);
  }

  /**
   * Track a setInterval ID for cleanup
   * @param id - The interval ID returned by setInterval
   */
  trackInterval(id: TimerId): void {
    this.intervals.add(id);
  }

  /**
   * Track an event listener for cleanup
   * @param element - The event target (e.g., DOM element, window, document)
   * @param event - The event name (e.g., 'click', 'resize')
   * @param handler - The event listener function
   */
  trackListener(element: EventTarget, event: string, handler: EventListener): void {
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    this.listeners.get(element)!.set(event, handler);
  }

  /**
   * Track a requestAnimationFrame ID for cleanup
   * @param id - The animation frame ID returned by requestAnimationFrame
   */
  trackAnimationFrame(id: number): void {
    this.animationFrames.add(id);
  }

  /**
   * Clean up all tracked resources
   * 
   * This method:
   * - Clears all timeouts with clearTimeout()
   * - Clears all intervals with clearInterval()
   * - Removes all event listeners with removeEventListener()
   * - Cancels all animation frames with cancelAnimationFrame()
   * - Clears internal storage after cleanup
   */
  cleanup(): void {
    // Clear timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();

    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();

    // Remove event listeners
    this.listeners.forEach((events, target) => {
      events.forEach((listener, event) => {
        target.removeEventListener(event, listener);
      });
    });
    this.listeners.clear();

    // Cancel animation frames
    this.animationFrames.forEach(id => cancelAnimationFrame(id));
    this.animationFrames.clear();
  }

  /**
   * Get the number of tracked timeouts (for testing/debugging)
   */
  getTrackedTimeoutsCount(): number {
    return this.timeouts.size;
  }

  /**
   * Get the number of tracked intervals (for testing/debugging)
   */
  getTrackedIntervalsCount(): number {
    return this.intervals.size;
  }

  /**
   * Get the number of tracked event listeners (for testing/debugging)
   */
  getTrackedListenersCount(): number {
    let count = 0;
    this.listeners.forEach(events => {
      count += events.size;
    });
    return count;
  }

  /**
   * Get the number of tracked animation frames (for testing/debugging)
   */
  getTrackedAnimationFramesCount(): number {
    return this.animationFrames.size;
  }
}
