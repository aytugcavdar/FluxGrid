import { create } from 'zustand';

interface PerformanceMetrics {
  currentFPS: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  fpsHistory: Array<{
    timestamp: number;
    fps: number;
  }>;
  fpsChanges: Array<{
    timestamp: number;
    oldFPS: number;
    newFPS: number;
    reason: 'battery' | 'idle' | 'background' | 'manual' | 'device-tier';
  }>;
  backgroundPauseDuration: number;
  backgroundPauseCount: number;
  touchResponseTimes: number[];
  averageTouchResponse: number;
  minTouchResponse: number;
  maxTouchResponse: number;
  estimatedBatterySavings: number;
  errors: Array<{
    timestamp: number;
    error: any;
  }>;
}

interface PerformanceStore {
  metrics: PerformanceMetrics;
  debugMode: boolean;

  // Actions
  recordFPS: (fps: number) => void;
  recordFPSChange: (oldFPS: number, newFPS: number, reason: string) => void;
  recordBackgroundPause: (duration: number) => void;
  recordTouchResponse: (responseTime: number) => void;
  setDebugMode: (enabled: boolean) => void;
  exportMetrics: () => string;
  clearMetrics: () => void;
  logError: (error: any) => void;
}

const INITIAL_METRICS: PerformanceMetrics = {
  currentFPS: 60,
  averageFPS: 60,
  minFPS: 60,
  maxFPS: 60,
  fpsHistory: [],
  fpsChanges: [],
  backgroundPauseDuration: 0,
  backgroundPauseCount: 0,
  touchResponseTimes: [],
  averageTouchResponse: 0,
  minTouchResponse: 0,
  maxTouchResponse: 0,
  estimatedBatterySavings: 0,
  errors: []
};

export const usePerformanceStore = create<PerformanceStore>((set, get) => ({
  metrics: INITIAL_METRICS,
  debugMode: false,

  recordFPS: (fps: number) => {
    set(state => {
      const now = Date.now();
      const newHistory = [
        ...state.metrics.fpsHistory,
        { timestamp: now, fps }
      ].filter(entry => now - entry.timestamp < 60000); // Keep last 60 seconds

      const averageFPS = newHistory.reduce((sum, entry) => sum + entry.fps, 0) / newHistory.length;
      const minFPS = Math.min(...newHistory.map(entry => entry.fps));
      const maxFPS = Math.max(...newHistory.map(entry => entry.fps));

      // Calculate battery savings (compared to 60 FPS)
      const estimatedBatterySavings = ((60 - averageFPS) / 60) * 100;

      return {
        metrics: {
          ...state.metrics,
          currentFPS: fps,
          averageFPS,
          minFPS,
          maxFPS,
          fpsHistory: newHistory,
          estimatedBatterySavings
        }
      };
    });
  },

  recordFPSChange: (oldFPS: number, newFPS: number, reason: string) => {
    set(state => ({
      metrics: {
        ...state.metrics,
        fpsChanges: [
          ...state.metrics.fpsChanges,
          {
            timestamp: Date.now(),
            oldFPS,
            newFPS,
            reason: reason as any
          }
        ]
      }
    }));

    if (get().debugMode) {
      console.log(`[PerformanceMetrics] FPS changed: ${oldFPS} -> ${newFPS} (${reason})`);
    }
  },

  recordBackgroundPause: (duration: number) => {
    set(state => ({
      metrics: {
        ...state.metrics,
        backgroundPauseDuration: state.metrics.backgroundPauseDuration + duration,
        backgroundPauseCount: state.metrics.backgroundPauseCount + 1
      }
    }));

    if (get().debugMode) {
      console.log(`[PerformanceMetrics] Background pause: ${duration}ms`);
    }
  },

  recordTouchResponse: (responseTime: number) => {
    set(state => {
      const newTouchTimes = [
        ...state.metrics.touchResponseTimes,
        responseTime
      ].slice(-100); // Keep last 100 touches

      const averageTouchResponse = newTouchTimes.reduce((sum, time) => sum + time, 0) / newTouchTimes.length;
      const minTouchResponse = Math.min(...newTouchTimes);
      const maxTouchResponse = Math.max(...newTouchTimes);

      return {
        metrics: {
          ...state.metrics,
          touchResponseTimes: newTouchTimes,
          averageTouchResponse,
          minTouchResponse,
          maxTouchResponse
        }
      };
    });
  },

  setDebugMode: (enabled: boolean) => {
    set({ debugMode: enabled });
    console.log(`[PerformanceMetrics] Debug mode: ${enabled ? 'enabled' : 'disabled'}`);
  },

  exportMetrics: () => {
    const metrics = get().metrics;
    return JSON.stringify(metrics, null, 2);
  },

  clearMetrics: () => {
    set({ metrics: INITIAL_METRICS });
    console.log('[PerformanceMetrics] Metrics cleared');
  },

  logError: (error: any) => {
    set(state => ({
      metrics: {
        ...state.metrics,
        errors: [
          ...state.metrics.errors,
          {
            timestamp: Date.now(),
            error
          }
        ]
      }
    }));

    console.error('[PerformanceMetrics] Error logged:', error);
  }
}));
