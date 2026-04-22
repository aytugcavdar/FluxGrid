/**
 * FrameScheduler - Manages requestAnimationFrame with adaptive frame rate control
 * 
 * Features:
 * - 60 FPS target with automatic 30 FPS fallback
 * - Frame skipping when behind schedule
 * - Delta time calculation for smooth animations
 * - Performance metrics tracking
 * 
 * Usage:
 * ```typescript
 * import { frameScheduler } from './frameScheduler';
 * 
 * const animId = frameScheduler.scheduleAnimation((deltaTime) => {
 *   // Update animation based on deltaTime (in seconds)
 *   position.x += velocity.x * deltaTime;
 * }, 60); // Optional: specify target FPS (default: 60)
 * 
 * // Cancel when done
 * frameScheduler.cancelAnimation(animId);
 * ```
 */

interface AnimationCallback {
  callback: (deltaTime: number) => void;
  targetFPS: number;
  lastFrameTime: number;
  id: number;
}

interface PerformanceMetrics {
  actualFPS: number;
  droppedFrames: number;
  averageFrameTime: number;
}

export class FrameScheduler {
  private animations: Map<number, AnimationCallback> = new Map();
  private nextId = 1;
  private rafId: number | null = null;
  private isRunning = false;
  
  // Performance tracking
  private frameCount = 0;
  private droppedFrames = 0;
  private lastFPSUpdate = performance.now();
  private frameTimes: number[] = [];
  private currentFPS = 60;
  
  // Frame rate thresholds (in milliseconds)
  private readonly TARGET_60FPS = 1000 / 60; // 16.67ms
  private readonly TARGET_30FPS = 1000 / 30; // 33.33ms
  private readonly FPS_SAMPLE_WINDOW = 1000; // 1 second
  private readonly FRAME_TIME_SAMPLES = 60; // Track last 60 frames
  
  // Adaptive frame rate
  private currentTargetFPS = 60;
  private consecutiveLowFPS = 0;
  private readonly LOW_FPS_THRESHOLD = 3; // Switch to 30 FPS after 3 consecutive low readings

  /**
   * Schedule an animation callback to run at the target frame rate
   * @param callback - Function to call each frame with deltaTime in seconds
   * @param targetFPS - Target frame rate (default: 60, can be 30 for lower performance)
   * @returns Animation ID for cancellation
   */
  scheduleAnimation(
    callback: (deltaTime: number) => void,
    targetFPS: number = 60
  ): number {
    const id = this.nextId++;
    const animation: AnimationCallback = {
      callback,
      targetFPS,
      lastFrameTime: performance.now(),
      id
    };
    
    this.animations.set(id, animation);
    
    // Start the animation loop if not already running
    if (!this.isRunning) {
      this.start();
    }
    
    return id;
  }

  /**
   * Cancel a scheduled animation
   * @param id - Animation ID returned from scheduleAnimation
   */
  cancelAnimation(id: number): void {
    this.animations.delete(id);
    
    // Stop the loop if no animations are active
    if (this.animations.size === 0) {
      this.stop();
    }
  }

  /**
   * Get current performance metrics
   * @returns Performance metrics including FPS and dropped frames
   */
  getMetrics(): PerformanceMetrics {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;
    
    return {
      actualFPS: this.currentFPS,
      droppedFrames: this.droppedFrames,
      averageFrameTime: avgFrameTime
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.frameTimes = [];
    this.lastFPSUpdate = performance.now();
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFPSUpdate = performance.now();
    this.loop();
  }

  /**
   * Stop the animation loop
   */
  private stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main animation loop
   */
  private loop = (): void => {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const frameStartTime = now;
    
    // Update FPS metrics
    this.updateFPSMetrics(now);
    
    // Determine adaptive frame rate
    this.updateAdaptiveFrameRate();
    
    // Get target frame time based on current adaptive FPS
    const targetFrameTime = this.currentTargetFPS === 60 
      ? this.TARGET_60FPS 
      : this.TARGET_30FPS;
    
    // Process each animation
    this.animations.forEach((animation) => {
      const timeSinceLastFrame = now - animation.lastFrameTime;
      const animTargetFrameTime = 1000 / animation.targetFPS;
      
      // Check if enough time has passed for this animation's target FPS
      if (timeSinceLastFrame >= animTargetFrameTime) {
        // Calculate delta time in seconds
        const deltaTime = timeSinceLastFrame / 1000;
        
        // Check if we need to skip frames (if we're way behind)
        const framesBehind = Math.floor(timeSinceLastFrame / animTargetFrameTime);
        if (framesBehind > 2) {
          // We're more than 2 frames behind, skip to catch up
          this.droppedFrames += framesBehind - 1;
        }
        
        // Execute the animation callback
        try {
          animation.callback(deltaTime);
        } catch (error) {
          console.error('[FrameScheduler] Animation callback error:', error);
        }
        
        // Update last frame time
        animation.lastFrameTime = now;
      }
    });
    
    // Track frame time
    const frameTime = performance.now() - frameStartTime;
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.FRAME_TIME_SAMPLES) {
      this.frameTimes.shift();
    }
    
    // Schedule next frame
    this.rafId = requestAnimationFrame(this.loop);
  };

  /**
   * Update FPS metrics
   */
  private updateFPSMetrics(now: number): void {
    this.frameCount++;
    
    const timeSinceLastUpdate = now - this.lastFPSUpdate;
    if (timeSinceLastUpdate >= this.FPS_SAMPLE_WINDOW) {
      // Calculate actual FPS
      this.currentFPS = Math.round((this.frameCount * 1000) / timeSinceLastUpdate);
      
      // Reset counters
      this.frameCount = 0;
      this.lastFPSUpdate = now;
    }
  }

  /**
   * Update adaptive frame rate based on performance
   */
  private updateAdaptiveFrameRate(): void {
    // Check if we're consistently below 60 FPS
    if (this.currentFPS < 55 && this.currentTargetFPS === 60) {
      this.consecutiveLowFPS++;
      
      // Switch to 30 FPS if consistently low
      if (this.consecutiveLowFPS >= this.LOW_FPS_THRESHOLD) {
        this.currentTargetFPS = 30;
        console.warn('[FrameScheduler] Switching to 30 FPS mode due to low performance');
      }
    } else if (this.currentFPS >= 58 && this.currentTargetFPS === 30) {
      // Switch back to 60 FPS if performance improves
      this.consecutiveLowFPS = 0;
      this.currentTargetFPS = 60;
      console.log('[FrameScheduler] Switching back to 60 FPS mode');
    } else if (this.currentFPS >= 55) {
      // Reset counter if FPS is good
      this.consecutiveLowFPS = 0;
    }
  }

  /**
   * Get current target FPS (60 or 30)
   */
  getCurrentTargetFPS(): number {
    return this.currentTargetFPS;
  }

  /**
   * Get number of active animations
   */
  getActiveAnimationCount(): number {
    return this.animations.size;
  }
}

// Export singleton instance
export const frameScheduler = new FrameScheduler();
