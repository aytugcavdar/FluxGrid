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

// Performance System Initialization
import { 
  initializePerformanceMonitoring as initPerf,
  cleanupPerformanceMonitoring as cleanupPerf 
} from './store/performanceStore';

const isPerformanceDebugEnabled = (): boolean => {
  if (import.meta.env.DEV) return true;

  try {
    return localStorage.getItem('enablePerformanceOverlay') === 'true';
  } catch {
    return false;
  }
};

export const initializePerformanceSystem = () => {
  if (!isPerformanceDebugEnabled()) {
    console.log('[Performance] Debug monitoring disabled');
    return () => {};
  }

  console.log('[Performance] Initializing performance debug system');
  return initPerf();
};

export const cleanupPerformanceSystem = () => {
  console.log('[Performance] Cleaning up performance system');
  cleanupPerf();
};
