/**
 * Performance Monitor
 * 
 * Monitors FPS and frame time to detect performance degradation.
 * Triggers callbacks when performance drops below thresholds.
 */

import {
  PerformanceMetrics,
  PerformanceThresholds,
  PerformanceDegradationLevel,
  DEFAULT_PERFORMANCE_THRESHOLDS,
} from './config/performance.config';

export class PerformanceMonitor {
  private thresholds: PerformanceThresholds;
  private metrics: PerformanceMetrics;
  private fpsHistory: number[] = [];
  private degradationCount: number = 0;
  private restoreCount: number = 0;
  private currentDegradationLevel: PerformanceDegradationLevel | null = null;
  
  // Event callbacks
  public onPerformanceDegradation: ((level: PerformanceDegradationLevel) => void) | null = null;
  public onPerformanceRestored: (() => void) | null = null;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      ...DEFAULT_PERFORMANCE_THRESHOLDS,
      ...thresholds,
    };
    
    this.metrics = {
      currentFPS: 60,
      averageFPS: 60,
      frameTime: 16.67,
      particleCount: 0,
      trailCount: 0,
      drawCalls: 0,
    };
  }

  /**
   * Update performance metrics
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Calculate current FPS
    const currentFPS = deltaTime > 0 ? 1 / deltaTime : 60;
    this.metrics.currentFPS = currentFPS;
    this.metrics.frameTime = deltaTime * 1000; // Convert to milliseconds
    
    // Add to FPS history
    this.fpsHistory.push(currentFPS);
    
    // Maintain window size
    if (this.fpsHistory.length > this.thresholds.measurementWindow) {
      this.fpsHistory.shift();
    }
    
    // Calculate average FPS
    if (this.fpsHistory.length > 0) {
      const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
      this.metrics.averageFPS = sum / this.fpsHistory.length;
    }
    
    // Check for performance degradation or restoration
    this.checkPerformance();
  }

  /**
   * Check for performance degradation or restoration
   */
  private checkPerformance(): void {
    const avgFPS = this.metrics.averageFPS;
    
    // Check for severe degradation (< 30 FPS)
    if (avgFPS < this.thresholds.performanceMode) {
      this.degradationCount++;
      this.restoreCount = 0;
      
      if (this.degradationCount >= this.thresholds.consecutiveRequired) {
        if (this.currentDegradationLevel !== 'severe') {
          this.currentDegradationLevel = 'severe';
          this.triggerDegradation('severe');
        }
      }
    }
    // Check for moderate degradation (< 40 FPS)
    else if (avgFPS < this.thresholds.disableTrails) {
      this.degradationCount++;
      this.restoreCount = 0;
      
      if (this.degradationCount >= this.thresholds.consecutiveRequired) {
        if (this.currentDegradationLevel !== 'moderate' && this.currentDegradationLevel !== 'severe') {
          this.currentDegradationLevel = 'moderate';
          this.triggerDegradation('moderate');
        }
      }
    }
    // Check for mild degradation (< 50 FPS)
    else if (avgFPS < this.thresholds.reduceParticles) {
      this.degradationCount++;
      this.restoreCount = 0;
      
      if (this.degradationCount >= this.thresholds.consecutiveRequired) {
        if (!this.currentDegradationLevel) {
          this.currentDegradationLevel = 'mild';
          this.triggerDegradation('mild');
        }
      }
    }
    // Check for restoration (> 55 FPS)
    else if (avgFPS > this.thresholds.restore) {
      this.restoreCount++;
      this.degradationCount = 0;
      
      if (this.restoreCount >= this.thresholds.restoreRequired) {
        if (this.currentDegradationLevel) {
          this.currentDegradationLevel = null;
          this.triggerRestoration();
        }
      }
    }
    // In between thresholds - reset counters
    else {
      this.degradationCount = 0;
      this.restoreCount = 0;
    }
  }

  /**
   * Trigger performance degradation callback
   */
  private triggerDegradation(level: PerformanceDegradationLevel): void {
    console.warn(`[PerformanceMonitor] Performance degradation detected: ${level}`, {
      averageFPS: this.metrics.averageFPS.toFixed(2),
      particleCount: this.metrics.particleCount,
      trailCount: this.metrics.trailCount,
    });
    
    if (this.onPerformanceDegradation) {
      this.onPerformanceDegradation(level);
    }
  }

  /**
   * Trigger performance restoration callback
   */
  private triggerRestoration(): void {
    console.log('[PerformanceMonitor] Performance restored', {
      averageFPS: this.metrics.averageFPS.toFixed(2),
    });
    
    if (this.onPerformanceRestored) {
      this.onPerformanceRestored();
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Update particle count metric
   */
  public setParticleCount(count: number): void {
    this.metrics.particleCount = count;
  }

  /**
   * Update trail count metric
   */
  public setTrailCount(count: number): void {
    this.metrics.trailCount = count;
  }

  /**
   * Update draw call count metric
   */
  public setDrawCalls(count: number): void {
    this.metrics.drawCalls = count;
  }

  /**
   * Reset performance monitor state
   */
  public reset(): void {
    this.fpsHistory = [];
    this.degradationCount = 0;
    this.restoreCount = 0;
    this.currentDegradationLevel = null;
    
    this.metrics = {
      currentFPS: 60,
      averageFPS: 60,
      frameTime: 16.67,
      particleCount: 0,
      trailCount: 0,
      drawCalls: 0,
    };
  }
}
