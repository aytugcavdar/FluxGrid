/**
 * Performance Monitoring Configuration
 * 
 * Configuration for adaptive performance monitoring and quality adjustment.
 * Monitors FPS and automatically adjusts visual quality to maintain smooth gameplay.
 */

/**
 * Performance metrics tracked by the monitor
 */
export interface PerformanceMetrics {
  /** Current instantaneous FPS */
  currentFPS: number;
  
  /** Average FPS over measurement window */
  averageFPS: number;
  
  /** Frame time in milliseconds */
  frameTime: number;
  
  /** Active particle count */
  particleCount: number;
  
  /** Active trail count */
  trailCount: number;
  
  /** Approximate draw call count */
  drawCalls: number;
}

/**
 * Performance degradation thresholds
 */
export interface PerformanceThresholds {
  /** FPS threshold for reducing particle count (default: 50) */
  reduceParticles: number;
  
  /** FPS threshold for disabling trails (default: 40) */
  disableTrails: number;
  
  /** FPS threshold for enabling performance mode (default: 30) */
  performanceMode: number;
  
  /** FPS threshold for restoring effects (default: 55) */
  restore: number;
  
  /** Number of frames to average for FPS calculation (default: 60) */
  measurementWindow: number;
  
  /** Consecutive measurements required to trigger degradation (default: 3) */
  consecutiveRequired: number;
  
  /** Consecutive measurements required to restore effects (default: 10) */
  restoreRequired: number;
}

/**
 * Default performance thresholds
 */
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  reduceParticles: 50,
  disableTrails: 40,
  performanceMode: 30,
  restore: 55,
  measurementWindow: 60,
  consecutiveRequired: 3,
  restoreRequired: 10,
};

/**
 * Performance degradation levels
 */
export type PerformanceDegradationLevel = 'mild' | 'moderate' | 'severe';

/**
 * Performance event types for analytics
 */
export enum PerformanceEventType {
  PARTICLE_POOL_EXHAUSTED = 'particle_pool_exhausted',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  PERFORMANCE_MODE_ENABLED = 'performance_mode_enabled',
  TRAIL_RENDERING_SLOW = 'trail_rendering_slow',
  CULLING_OVERHEAD_HIGH = 'culling_overhead_high',
  BEAT_TIMING_DRIFT = 'beat_timing_drift',
  QUANTIZATION_DELAY_OVERFLOW = 'quantization_delay_overflow',
  AUDIO_LAYER_LOAD_FAILED = 'audio_layer_load_failed',
}

/**
 * Performance event data
 */
export interface PerformanceEvent {
  type: PerformanceEventType;
  timestamp: number;
  metrics: Partial<PerformanceMetrics>;
  level?: PerformanceDegradationLevel;
  message?: string;
}
