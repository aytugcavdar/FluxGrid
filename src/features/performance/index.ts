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
  // Allow in development OR if explicitly enabled in production
  const isProductionEnabled = typeof window !== 'undefined' && 
                               localStorage.getItem('enablePerformanceOverlay') === 'true';
  
  if (process.env.NODE_ENV === 'development' || isProductionEnabled) {
    console.log('[Performance] Initializing performance system');
    return initPerf();
  }
  return () => {}; // No-op cleanup
};

export const cleanupPerformanceSystem = () => {
  const isProductionEnabled = typeof window !== 'undefined' && 
                               localStorage.getItem('enablePerformanceOverlay') === 'true';
  
  if (process.env.NODE_ENV === 'development' || isProductionEnabled) {
    console.log('[Performance] Cleaning up performance system');
    cleanupPerf();
  }
};
