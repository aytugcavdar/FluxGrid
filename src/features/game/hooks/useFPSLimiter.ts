import { useEffect, useState, useRef } from 'react';
import * as BABYLON from 'babylonjs';
import { isAndroid } from '../../../utils/platform/platform';
import { detectDeviceCapabilities, DeviceTier } from '../../../utils/platform/deviceCapability';
import { usePerformanceStore } from '../store/performanceStore';
import { getPlatformItem, setPlatformItem } from '../../../utils/platform/platformStorage';

interface FPSLimiterConfig {
  targetFPS: number;
  enabled: boolean;
}

interface FPSLimiterState {
  currentFPS: number;
  targetFPS: number;
  isIdle: boolean;
  batteryLevel: number | null;
  deviceTier: DeviceTier;
}

interface UseFPSLimiterReturn {
  state: FPSLimiterState;
  setManualFPS: (fps: 30 | 60 | 'auto') => void;
}

/**
 * FPSLimiter class - Controls frame rate limiting
 * Uses performance.now() for accurate frame timing
 */
class FPSLimiter {
  private lastFrameTime: number = 0;
  private targetFrameTime: number;
  private enabled: boolean;

  constructor(config: FPSLimiterConfig) {
    this.targetFrameTime = 1000 / config.targetFPS;
    this.enabled = config.enabled;
  }

  shouldRenderFrame(): boolean {
    if (!this.enabled) return true;

    const now = performance?.now?.() ?? Date.now();
    const elapsed = now - this.lastFrameTime;

    return elapsed >= this.targetFrameTime;
  }

  updateFrameTime(): void {
    if (!this.enabled) return;
    this.lastFrameTime = performance?.now?.() ?? Date.now();
  }

  setTargetFPS(fps: number): void {
    this.targetFrameTime = 1000 / fps;
  }
}

/**
 * useFPSLimiter Hook
 * 
 * Implements dynamic FPS limiting with:
 * - Device tier detection (LOW/MID/HIGH)
 * - Battery monitoring (30-second intervals)
 * - Idle detection (5-second timeout)
 * - Manual FPS settings with localStorage
 * - Error handling with graceful fallbacks
 * - Platform control (Android only)
 * 
 * @param engine - Babylon.js engine instance
 * @param enabled - Whether FPS limiting is enabled
 * @returns FPS limiter state and control functions
 */
export function useFPSLimiter(
  engine: BABYLON.Engine | null,
  enabled: boolean = true
): UseFPSLimiterReturn {
  const androidPlatform = isAndroid();
  const shouldEnable = enabled && androidPlatform;

  const [state, setState] = useState<FPSLimiterState>({
    currentFPS: 60,
    targetFPS: 60,
    isIdle: false,
    batteryLevel: null,
    deviceTier: DeviceTier.MID
  });

  const limiterRef = useRef<FPSLimiter | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const batteryCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTouchTimeRef = useRef<number>(Date.now());

  // Task 4.2: Device tier detection
  useEffect(() => {
    if (!shouldEnable) return;

    try {
      const capabilities = detectDeviceCapabilities();
      // FIXED: Set 30 FPS for LOW and MID tier devices for better performance
      const initialFPS = capabilities.tier === DeviceTier.HIGH ? 60 : 30;

      setState(prev => ({
        ...prev,
        deviceTier: capabilities.tier,
        targetFPS: initialFPS
      }));

      // Check for manual FPS setting (platform-specific)
      const manualFPS = getPlatformItem('fps-limit');
      if (manualFPS && manualFPS !== 'auto') {
        const fps = parseInt(manualFPS);
        if (fps === 30 || fps === 60) {
          setState(prev => ({ ...prev, targetFPS: fps }));
        }
      }

      console.log('[FPSLimiter] Device tier detected:', capabilities.tier, 'Initial FPS:', initialFPS);
    } catch (error) {
      console.warn('[FPSLimiter] Device tier detection failed, defaulting to mid-tier', error);
      setState(prev => ({ ...prev, deviceTier: DeviceTier.MID, targetFPS: 30 }));
      usePerformanceStore.getState().logError(error);
    }
  }, [shouldEnable]);

  // Task 4.1: Initialize FPS limiter
  useEffect(() => {
    if (!shouldEnable || !engine) return;

    limiterRef.current = new FPSLimiter({
      targetFPS: state.targetFPS,
      enabled: true
    });

    console.log('[FPSLimiter] Initialized with target FPS:', state.targetFPS);
  }, [shouldEnable, engine, state.targetFPS]);

  // Task 4.3: Battery monitoring (30-second intervals)
  useEffect(() => {
    if (!shouldEnable) return;

    const checkBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          const level = Math.floor(battery.level * 100);

          setState(prev => ({ ...prev, batteryLevel: level }));

          // Adjust FPS based on battery level (only if not manual mode)
          const manualFPS = getPlatformItem('fps-limit');
          if (!manualFPS || manualFPS === 'auto') {
            // FIXED: More aggressive battery-based FPS reduction
            let newFPS: number;
            if (level < 20) {
              newFPS = 30;
            } else if (level < 50 && state.deviceTier !== DeviceTier.HIGH) {
              // For LOW/MID tier devices, use 30 FPS even at medium battery
              newFPS = 30;
            } else {
              // Only HIGH tier devices get 60 FPS at good battery
              newFPS = state.deviceTier === DeviceTier.HIGH ? 60 : 30;
            }
            
            if (newFPS !== state.targetFPS && !state.isIdle) {
              const oldFPS = state.targetFPS;
              setState(prev => ({ ...prev, targetFPS: newFPS }));
              limiterRef.current?.setTargetFPS(newFPS);
              
              usePerformanceStore.getState().recordFPSChange(
                oldFPS,
                newFPS,
                'battery'
              );
              
              console.log(`[FPSLimiter] Battery level ${level}%, FPS changed: ${oldFPS} -> ${newFPS}`);
            }
          }
        }
      } catch (error) {
        console.warn('[FPSLimiter] Battery API not available, using default 60 FPS', error);
        setState(prev => ({ ...prev, targetFPS: 60 }));
        usePerformanceStore.getState().logError(error);
      }
    };

    // Initial check
    checkBattery();

    // Check every 30 seconds
    batteryCheckIntervalRef.current = setInterval(checkBattery, 30000);

    return () => {
      if (batteryCheckIntervalRef.current) {
        clearInterval(batteryCheckIntervalRef.current);
      }
    };
  }, [shouldEnable, state.targetFPS, state.isIdle]);

  // Task 4.4: Idle detection (5-second timeout with touch events)
  useEffect(() => {
    if (!shouldEnable) return;

    const resetIdleTimer = () => {
      lastTouchTimeRef.current = Date.now();

      // If was idle, restore FPS
      if (state.isIdle) {
        setState(prev => ({ ...prev, isIdle: false }));
        
        const manualFPS = getPlatformItem('fps-limit');
        let normalFPS: number;
        
        if (manualFPS && manualFPS !== 'auto') {
          normalFPS = parseInt(manualFPS);
        } else {
          // FIXED: Restore to device tier appropriate FPS
          if (state.batteryLevel !== null && state.batteryLevel < 20) {
            normalFPS = 30;
          } else if (state.batteryLevel !== null && state.batteryLevel < 50 && state.deviceTier !== DeviceTier.HIGH) {
            normalFPS = 30;
          } else {
            normalFPS = state.deviceTier === DeviceTier.HIGH ? 60 : 30;
          }
        }

        limiterRef.current?.setTargetFPS(normalFPS);
        setState(prev => ({ ...prev, targetFPS: normalFPS }));
        
        usePerformanceStore.getState().recordFPSChange(
          15,
          normalFPS,
          'idle'
        );
        
        console.log('[FPSLimiter] Idle ended, FPS restored to', normalFPS);
      }

      // Clear existing timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // Set new idle timer (5 seconds)
      idleTimerRef.current = setTimeout(() => {
        const oldFPS = state.targetFPS;
        setState(prev => ({ ...prev, isIdle: true, targetFPS: 15 }));
        limiterRef.current?.setTargetFPS(15);
        
        usePerformanceStore.getState().recordFPSChange(
          oldFPS,
          15,
          'idle'
        );
        
        console.log('[FPSLimiter] Idle detected, FPS reduced to 15');
      }, 5000);
    };

    // Listen to touch events
    const events = ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'pointermove'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Initial timer
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [shouldEnable, state.isIdle, state.targetFPS, state.batteryLevel]);

  // Task 4.5: Manual FPS settings with platform-specific localStorage
  const setManualFPS = (fps: 30 | 60 | 'auto') => {
    try {
      setPlatformItem('fps-limit', fps.toString());

      const oldFPS = state.targetFPS;
      let newFPS: number;

      if (fps === 'auto') {
        // FIXED: Use device tier appropriate FPS
        if (state.batteryLevel !== null && state.batteryLevel < 20) {
          newFPS = 30;
        } else if (state.batteryLevel !== null && state.batteryLevel < 50 && state.deviceTier !== DeviceTier.HIGH) {
          newFPS = 30;
        } else {
          newFPS = state.deviceTier === DeviceTier.HIGH ? 60 : 30;
        }
      } else {
        newFPS = fps;
      }

      setState(prev => ({ ...prev, targetFPS: newFPS }));
      limiterRef.current?.setTargetFPS(newFPS);

      usePerformanceStore.getState().recordFPSChange(
        oldFPS,
        newFPS,
        'manual'
      );

      console.log('[FPSLimiter] Manual FPS set:', fps, '(actual:', newFPS, ')');
    } catch (error) {
      console.error('[FPSLimiter] Failed to set manual FPS', error);
      usePerformanceStore.getState().logError(error);
    }
  };

  return {
    state,
    setManualFPS
  };
}
