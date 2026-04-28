/**
 * Performance Analytics Logger
 * 
 * Logs performance-related events for analytics tracking.
 * Integrates with the game's analytics system.
 */

import {
  PerformanceEvent,
  PerformanceEventType,
  PerformanceMetrics,
  PerformanceDegradationLevel,
} from './config/performance.config';

export class PerformanceAnalytics {
  private events: PerformanceEvent[] = [];
  private maxEvents: number = 100;

  /**
   * Log particle pool exhausted event
   * @param metrics Current performance metrics
   */
  public logParticlePoolExhausted(metrics: PerformanceMetrics): void {
    this.logEvent({
      type: PerformanceEventType.PARTICLE_POOL_EXHAUSTED,
      timestamp: Date.now(),
      metrics: {
        particleCount: metrics.particleCount,
        currentFPS: metrics.currentFPS,
      },
      message: 'Particle pool exhausted - no dead particles available',
    });
  }

  /**
   * Log performance degradation event
   * @param level Degradation level
   * @param metrics Current performance metrics
   */
  public logPerformanceDegradation(
    level: PerformanceDegradationLevel,
    metrics: PerformanceMetrics
  ): void {
    this.logEvent({
      type: PerformanceEventType.PERFORMANCE_DEGRADATION,
      timestamp: Date.now(),
      metrics: {
        averageFPS: metrics.averageFPS,
        particleCount: metrics.particleCount,
        trailCount: metrics.trailCount,
      },
      level,
      message: `Performance degradation detected: ${level}`,
    });
  }

  /**
   * Log performance mode enabled event
   * @param metrics Current performance metrics
   */
  public logPerformanceModeEnabled(metrics: PerformanceMetrics): void {
    this.logEvent({
      type: PerformanceEventType.PERFORMANCE_MODE_ENABLED,
      timestamp: Date.now(),
      metrics: {
        averageFPS: metrics.averageFPS,
        particleCount: metrics.particleCount,
      },
      message: 'Performance mode enabled due to severe degradation',
    });
  }

  /**
   * Log trail rendering slow event
   * @param frameTime Frame time in milliseconds
   */
  public logTrailRenderingSlow(frameTime: number): void {
    this.logEvent({
      type: PerformanceEventType.TRAIL_RENDERING_SLOW,
      timestamp: Date.now(),
      metrics: {
        frameTime,
      },
      message: `Trail rendering exceeded 16ms threshold: ${frameTime.toFixed(2)}ms`,
    });
  }

  /**
   * Log culling overhead high event
   * @param cullingTime Culling time in milliseconds
   */
  public logCullingOverheadHigh(cullingTime: number): void {
    this.logEvent({
      type: PerformanceEventType.CULLING_OVERHEAD_HIGH,
      timestamp: Date.now(),
      metrics: {
        frameTime: cullingTime,
      },
      message: `Frustum culling overhead exceeded 2ms threshold: ${cullingTime.toFixed(2)}ms`,
    });
  }

  /**
   * Log beat timing drift event
   * @param drift Drift in milliseconds
   */
  public logBeatTimingDrift(drift: number): void {
    this.logEvent({
      type: PerformanceEventType.BEAT_TIMING_DRIFT,
      timestamp: Date.now(),
      metrics: {},
      message: `Beat timing drift detected: ${drift.toFixed(2)}ms`,
    });
  }

  /**
   * Log quantization delay overflow event
   * @param delay Delay in milliseconds
   * @param tolerance Tolerance in milliseconds
   */
  public logQuantizationDelayOverflow(delay: number, tolerance: number): void {
    this.logEvent({
      type: PerformanceEventType.QUANTIZATION_DELAY_OVERFLOW,
      timestamp: Date.now(),
      metrics: {},
      message: `Quantization delay (${delay.toFixed(2)}ms) exceeded tolerance (${tolerance}ms)`,
    });
  }

  /**
   * Log audio layer load failed event
   * @param layerName Name of the layer that failed to load
   * @param error Error message
   */
  public logAudioLayerLoadFailed(layerName: string, error: string): void {
    this.logEvent({
      type: PerformanceEventType.AUDIO_LAYER_LOAD_FAILED,
      timestamp: Date.now(),
      metrics: {},
      message: `Audio layer '${layerName}' failed to load: ${error}`,
    });
  }

  /**
   * Log a performance event
   * @param event Performance event
   */
  private logEvent(event: PerformanceEvent): void {
    // Add to events array
    this.events.push(event);
    
    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[PerformanceAnalytics]', event.type, event.message, event.metrics);
    }
    
    // TODO: Send to analytics service
    // Example: analyticsService.track(event.type, { ...event.metrics, message: event.message });
  }

  /**
   * Get all logged events
   */
  public getEvents(): PerformanceEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  public getEventsByType(type: PerformanceEventType): PerformanceEvent[] {
    return this.events.filter(e => e.type === type);
  }

  /**
   * Clear all events
   */
  public clearEvents(): void {
    this.events = [];
  }

  /**
   * Get event summary
   */
  public getSummary(): Record<PerformanceEventType, number> {
    const summary: Record<string, number> = {};
    
    Object.values(PerformanceEventType).forEach(type => {
      summary[type] = 0;
    });
    
    this.events.forEach(event => {
      summary[event.type]++;
    });
    
    return summary as Record<PerformanceEventType, number>;
  }
}
