/**
 * Performance Monitor Service (DEPRECATED)
 * 
 * @deprecated This file is deprecated. Use @core/services/performance/PerformanceMonitor instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration path:
 * - Old: import { performanceMonitor } from '@/services/performance/performanceMonitor'
 * - New: import { performanceMonitor } from '@core/services/performance/PerformanceMonitor'
 */

// Re-export from canonical location
export {
  PerformanceMonitor,
  performanceMonitor,
  type PerformanceMetrics,
  type PerformanceThresholds,
  type PerformanceAlert,
  type PerformanceConfig,
  QUALITY_PRESETS,
  type QualityPreset,
  type DeviceCapabilities,
} from '../../core/services/performance/PerformanceMonitor';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] services/performance/performanceMonitor is deprecated. ' +
    'Use @core/services/performance/PerformanceMonitor instead.'
  );
}


