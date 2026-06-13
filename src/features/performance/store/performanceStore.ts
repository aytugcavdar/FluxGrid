/**
 * Performance Monitoring Store
 * 
 * Tracks FPS, memory usage, render counts, and performance warnings
 */

import { create } from 'zustand';

export interface PerformanceWarning {
  type: 'fps' | 'memory' | 'frameTime' | 'render';
  message: string;
  timestamp: number;
  componentName?: string;
}

export interface PerformanceExport {
  timestamp: number;
  metrics: {
    fps: { current: number; avg: number; min: number; max: number };
    memory: { current: number; avg: number; peak: number };
    renderCount: number;
    renderLoop: { rafFps: number; renderFps: number; skippedFps: number; cap: number };
    renderLoopState: { active: boolean; idle: boolean; activeAnimations: number; lastTouchAgeMs: number; reason: string };
    device: { tier: string; model: string; score: number; gpu: string; native: boolean };
    frameTime: { current: number; avg: number; max: number };
  };
  warnings: PerformanceWarning[];
}

interface PerformanceState {
  // Current metrics
  fps: number;
  memory: number;
  renderCount: number;
  renderFps: number;
  rafFps: number;
  skippedFps: number;
  nativeFpsCap: number;
  renderLoopActive: boolean;
  renderLoopIdle: boolean;
  activeAnimationCount: number;
  lastTouchAgeMs: number;
  renderLoopReason: string;
  deviceTier: string;
  deviceModel: string;
  deviceScore: number;
  deviceGpu: string;
  deviceIsNative: boolean;
  frameTime: number;
  
  // Historical data
  fpsHistory: number[];
  memoryHistory: number[];
  frameTimeHistory: number[];
  
  // Warnings
  warnings: PerformanceWarning[];
  
  // Configuration
  isMonitoring: boolean;
  isOverlayVisible: boolean;
  
  // Actions
  updateFPS: (fps: number) => void;
  updateMemory: (memory: number) => void;
  updateRenderLoopMetrics: (metrics: {
    renderFps: number;
    rafFps: number;
    skippedFps: number;
    nativeFpsCap: number;
  }) => void;
  updateRenderLoopState: (state: {
    active: boolean;
    idle: boolean;
    activeAnimations: number;
    lastTouchAgeMs: number;
    reason: string;
  }) => void;
  updateDeviceInfo: (device: {
    tier: string;
    model?: string | null;
    score?: number | null;
    gpu?: string | null;
    native?: boolean;
  }) => void;
  incrementRenderCount: () => void;
  updateFrameTime: (frameTime: number) => void;
  addWarning: (warning: PerformanceWarning) => void;
  clearWarnings: () => void;
  toggleMonitoring: () => void;
  toggleOverlay: () => void;
  exportMetrics: () => PerformanceExport;
  resetMetrics: () => void;
}

const MAX_HISTORY_LENGTH = 100;
const FPS_WARNING_THRESHOLD = 50;
const MEMORY_WARNING_THRESHOLD = 150 * 1024 * 1024; // 150MB
const FRAME_TIME_WARNING_THRESHOLD = 20; // 20ms

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  // Initial state
  fps: 60,
  memory: 0,
  renderCount: 0,
  renderFps: 0,
  rafFps: 0,
  skippedFps: 0,
  nativeFpsCap: 0,
  renderLoopActive: false,
  renderLoopIdle: false,
  activeAnimationCount: 0,
  lastTouchAgeMs: 0,
  renderLoopReason: 'not-started',
  deviceTier: 'unknown',
  deviceModel: 'unknown',
  deviceScore: 0,
  deviceGpu: 'unknown',
  deviceIsNative: false,
  frameTime: 0,
  fpsHistory: [],
  memoryHistory: [],
  frameTimeHistory: [],
  warnings: [],
  isMonitoring: false,
  isOverlayVisible: false, // Back to false - toggle with 5 taps

  // Update FPS
  updateFPS: (fps: number) => {
    set((state) => {
      const newHistory = [...state.fpsHistory, fps].slice(-MAX_HISTORY_LENGTH);
      
      // Check for FPS warning
      if (fps < FPS_WARNING_THRESHOLD && state.isMonitoring) {
        const warning: PerformanceWarning = {
          type: 'fps',
          message: `FPS dropped to ${fps.toFixed(1)} (threshold: ${FPS_WARNING_THRESHOLD})`,
          timestamp: Date.now(),
        };
        console.warn('[Performance]', warning.message);
        
        return {
          fps,
          fpsHistory: newHistory,
          warnings: [...state.warnings, warning].slice(-10), // Keep last 10 warnings
        };
      }
      
      return {
        fps,
        fpsHistory: newHistory,
      };
    });
  },

  // Update memory
  updateMemory: (memory: number) => {
    set((state) => {
      const newHistory = [...state.memoryHistory, memory].slice(-MAX_HISTORY_LENGTH);
      
      // Check for memory warning
      if (memory > MEMORY_WARNING_THRESHOLD && state.isMonitoring) {
        const warning: PerformanceWarning = {
          type: 'memory',
          message: `Memory usage: ${(memory / 1024 / 1024).toFixed(1)}MB (threshold: ${MEMORY_WARNING_THRESHOLD / 1024 / 1024}MB)`,
          timestamp: Date.now(),
        };
        console.warn('[Performance]', warning.message);
        
        return {
          memory,
          memoryHistory: newHistory,
          warnings: [...state.warnings, warning].slice(-10),
        };
      }
      
      return {
        memory,
        memoryHistory: newHistory,
      };
    });
  },

  updateRenderLoopMetrics: ({ renderFps, rafFps, skippedFps, nativeFpsCap }) => {
    set({
      renderFps,
      rafFps,
      skippedFps,
      nativeFpsCap,
    });
  },

  updateRenderLoopState: ({ active, idle, activeAnimations, lastTouchAgeMs, reason }) => {
    set({
      renderLoopActive: active,
      renderLoopIdle: idle,
      activeAnimationCount: activeAnimations,
      lastTouchAgeMs,
      renderLoopReason: reason,
    });
  },

  updateDeviceInfo: ({ tier, model, score, gpu, native }) => {
    set({
      deviceTier: tier,
      deviceModel: model || 'unknown',
      deviceScore: score ?? 0,
      deviceGpu: gpu || 'unknown',
      deviceIsNative: native ?? false,
    });
  },

  // Increment render count
  incrementRenderCount: () => {
    set((state) => {
      // Throttle updates - only update every 10 renders to avoid infinite loops
      const newCount = state.renderCount + 1;
      
      // Only trigger state update every 10 renders
      if (newCount % 10 === 0) {
        return { renderCount: newCount };
      }
      
      // Update internal counter without triggering re-render
      // This is a hack but necessary to avoid infinite loops
      (state as any)._internalRenderCount = newCount;
      
      return state; // Return same state to avoid re-render
    });
  },

  // Update frame time
  updateFrameTime: (frameTime: number) => {
    set((state) => {
      const newHistory = [...state.frameTimeHistory, frameTime].slice(-MAX_HISTORY_LENGTH);
      
      // Check for frame time warning
      if (frameTime > FRAME_TIME_WARNING_THRESHOLD && state.isMonitoring) {
        const warning: PerformanceWarning = {
          type: 'frameTime',
          message: `Frame time: ${frameTime.toFixed(2)}ms (threshold: ${FRAME_TIME_WARNING_THRESHOLD}ms)`,
          timestamp: Date.now(),
        };
        console.warn('[Performance]', warning.message);
        
        return {
          frameTime,
          frameTimeHistory: newHistory,
          warnings: [...state.warnings, warning].slice(-10),
        };
      }
      
      return {
        frameTime,
        frameTimeHistory: newHistory,
      };
    });
  },

  // Add warning
  addWarning: (warning: PerformanceWarning) => {
    set((state) => ({
      warnings: [...state.warnings, warning].slice(-10),
    }));
    console.warn('[Performance]', warning.message);
  },

  // Clear warnings
  clearWarnings: () => {
    set({ warnings: [] });
  },

  // Toggle monitoring
  toggleMonitoring: () => {
    set((state) => ({
      isMonitoring: !state.isMonitoring,
    }));
  },

  // Toggle overlay
  toggleOverlay: () => {
    set((state) => ({
      isOverlayVisible: !state.isOverlayVisible,
    }));
  },

  // Export metrics
  exportMetrics: (): PerformanceExport => {
    const state = get();
    
    const calculateStats = (history: number[]) => {
      if (history.length === 0) return { current: 0, avg: 0, min: 0, max: 0 };
      const current = history[history.length - 1];
      const avg = history.reduce((a, b) => a + b, 0) / history.length;
      const min = Math.min(...history);
      const max = Math.max(...history);
      return { current, avg, min, max };
    };

    return {
      timestamp: Date.now(),
      metrics: {
        fps: calculateStats(state.fpsHistory),
        memory: {
          current: state.memory,
          avg: state.memoryHistory.reduce((a, b) => a + b, 0) / (state.memoryHistory.length || 1),
          peak: Math.max(...state.memoryHistory, 0),
        },
        renderCount: state.renderCount,
        renderLoop: {
          rafFps: state.rafFps,
          renderFps: state.renderFps,
          skippedFps: state.skippedFps,
          cap: state.nativeFpsCap,
        },
        renderLoopState: {
          active: state.renderLoopActive,
          idle: state.renderLoopIdle,
          activeAnimations: state.activeAnimationCount,
          lastTouchAgeMs: state.lastTouchAgeMs,
          reason: state.renderLoopReason,
        },
        device: {
          tier: state.deviceTier,
          model: state.deviceModel,
          score: state.deviceScore,
          gpu: state.deviceGpu,
          native: state.deviceIsNative,
        },
        frameTime: calculateStats(state.frameTimeHistory),
      },
      warnings: state.warnings,
    };
  },

  // Reset metrics
  resetMetrics: () => {
    set({
      fps: 60,
      memory: 0,
      renderCount: 0,
      renderFps: 0,
      rafFps: 0,
      skippedFps: 0,
      nativeFpsCap: 0,
      renderLoopActive: false,
      renderLoopIdle: false,
      activeAnimationCount: 0,
      lastTouchAgeMs: 0,
      renderLoopReason: 'reset',
      deviceTier: 'unknown',
      deviceModel: 'unknown',
      deviceScore: 0,
      deviceGpu: 'unknown',
      deviceIsNative: false,
      frameTime: 0,
      fpsHistory: [],
      memoryHistory: [],
      frameTimeHistory: [],
      warnings: [],
    });
  },
}));

// FPS Tracker using requestAnimationFrame
let fpsTrackerRunning = false;
let lastFrameTime = performance.now();
let frameCount = 0;

export const startFPSTracker = () => {
  if (fpsTrackerRunning) return;
  
  fpsTrackerRunning = true;
  lastFrameTime = performance.now();
  frameCount = 0;

  const trackFPS = () => {
    if (!fpsTrackerRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    frameCount++;

    // Update FPS every second
    if (deltaTime >= 1000) {
      const fps = (frameCount / deltaTime) * 1000;
      usePerformanceStore.getState().updateFPS(fps);
      usePerformanceStore.getState().updateFrameTime(deltaTime / frameCount);
      
      frameCount = 0;
      lastFrameTime = currentTime;
    }

    requestAnimationFrame(trackFPS);
  };

  requestAnimationFrame(trackFPS);
};

export const stopFPSTracker = () => {
  fpsTrackerRunning = false;
};

// Memory Tracker using performance.memory API or estimation
let memoryTrackerInterval: NodeJS.Timeout | null = null;

export const startMemoryTracker = () => {
  if (memoryTrackerInterval) return;
  
  // Check if performance.memory is available (Chrome desktop)
  const hasMemoryAPI = typeof window !== 'undefined' && 
                       'performance' in window && 
                       'memory' in (window.performance as any);
  
  if (hasMemoryAPI) {
    console.log('[Performance] Using performance.memory API');
    memoryTrackerInterval = setInterval(() => {
      const memory = (performance as any).memory.usedJSHeapSize;
      usePerformanceStore.getState().updateMemory(memory);
    }, 1000);
  } else {
    // Fallback: Estimate memory based on DOM nodes and other factors
    console.log('[Performance] performance.memory not available, using estimation');
    memoryTrackerInterval = setInterval(() => {
      // Rough estimation based on DOM complexity
      const domNodes = document.getElementsByTagName('*').length;
      const estimatedMemory = domNodes * 1000 + 20 * 1024 * 1024; // Base 20MB + 1KB per node
      usePerformanceStore.getState().updateMemory(estimatedMemory);
    }, 2000); // Update every 2 seconds for estimation
  }
};

export const stopMemoryTracker = () => {
  if (memoryTrackerInterval) {
    clearInterval(memoryTrackerInterval);
    memoryTrackerInterval = null;
  }
};

// Initialize performance monitoring system
export const initializePerformanceMonitoring = () => {
  console.log('[Performance] Initializing performance monitoring system');

  if (!usePerformanceStore.getState().isMonitoring) {
    usePerformanceStore.getState().toggleMonitoring();
  }
  
  return () => {
    stopFPSTracker();
    stopMemoryTracker();
  };
};

// Cleanup performance monitoring system
export const cleanupPerformanceMonitoring = () => {
  console.log('[Performance] Cleaning up performance monitoring system');
  
  stopFPSTracker();
  stopMemoryTracker();
  if (usePerformanceStore.getState().isMonitoring) {
    usePerformanceStore.getState().toggleMonitoring();
  }
};
