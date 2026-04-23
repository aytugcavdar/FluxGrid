/**
 * Performance Manager (DEPRECATED)
 * 
 * @deprecated This file is deprecated. Use @core/services/performance/PerformanceMonitor instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration path:
 * - Old: import { performanceManager } from '@/features/performance/utils/PerformanceManager'
 * - New: import { performanceMonitor } from '@core/services/performance/PerformanceMonitor'
 * 
 * Note: The new PerformanceMonitor includes all functionality from PerformanceManager
 * plus additional features. Use initializeBabylon() instead of initialize().
 */

// Re-export from canonical location
export {
  PerformanceMonitor as PerformanceManager,
  performanceMonitor as performanceManager,
  type QualityPreset,
  type DeviceCapabilities,
  QUALITY_PRESETS,
} from '../../../core/services/performance/PerformanceMonitor';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] features/performance/utils/PerformanceManager is deprecated. ' +
    'Use @core/services/performance/PerformanceMonitor instead.'
  );
}


