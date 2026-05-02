// Performance Store
export { 
  usePerformanceStore,
  startFPSTracker,
  stopFPSTracker,
  startMemoryTracker,
  stopMemoryTracker,
  initializePerformanceMonitoring,
  cleanupPerformanceMonitoring,
} from './store/performanceStore';

export type {
  PerformanceWarning,
  PerformanceExport,
} from './store/performanceStore';

// Performance Components
export { PerformanceMetricsDisplay } from './components';

// Performance System Initialization
import { 
  initializePerformanceMonitoring as initPerf,
  cleanupPerformanceMonitoring as cleanupPerf 
} from './store/performanceStore';

export const initializePerformanceSystem = () => {
  // Always enable in production for testing
  console.log('[Performance] Initializing performance system');
  return initPerf();
};

export const cleanupPerformanceSystem = () => {
  console.log('[Performance] Cleaning up performance system');
  cleanupPerf();
};
