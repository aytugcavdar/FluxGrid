import { useEffect, useState } from 'react';
import { isAndroid } from '../../../utils/platform/platform';
import { useGameStore } from '../store/gameStore';

interface BackgroundPauseState {
  isBackground: boolean;
  totalPausedTime: number;
  pauseCount: number;
}

interface UseBackgroundPauseReturn {
  state: BackgroundPauseState;
}

/**
 * useBackgroundPause Hook
 * 
 * Simplified background pause implementation using custom events:
 * - Dispatches 'fluxgrid-pause' when app goes to background
 * - Dispatches 'fluxgrid-resume' with pause duration when app returns
 * - Adjusts TIMED mode timer by pause duration
 * - Android only
 * 
 * Grid.tsx listens to these events to control render loop
 * 
 * @param enabled - Whether background pause is enabled
 * @returns Background pause state
 */
export function useBackgroundPause(
  enabled: boolean = true
): UseBackgroundPauseReturn {
  const androidPlatform = isAndroid();
  const shouldEnable = enabled && androidPlatform;

  const [state, setState] = useState<BackgroundPauseState>({
    isBackground: false,
    totalPausedTime: 0,
    pauseCount: 0
  });

  useEffect(() => {
    if (!shouldEnable) {
      console.log('[BackgroundPause] Disabled (not Android platform)');
      return;
    }

    if (typeof document.hidden === 'undefined') {
      console.warn('[BackgroundPause] Page Visibility API not supported');
      return;
    }

    console.log('[BackgroundPause] Initialized');

    let pauseStartTimestamp: number | null = null;

    const handleVisibilityChange = () => {
      try {
        const isHidden = document.hidden;

        if (isHidden) {
          // App going to background
          console.log('[BackgroundPause] App going to background');
          
          pauseStartTimestamp = Date.now();
          
          setState(prev => ({
            ...prev,
            isBackground: true
          }));

          // Dispatch pause event for Grid.tsx to handle render loop
          window.dispatchEvent(new CustomEvent('fluxgrid-pause'));
          
          console.log('[BackgroundPause] Pause event dispatched');
        } else {
          // App returning to foreground
          console.log('[BackgroundPause] App returning to foreground');

          const pauseDurationMs = pauseStartTimestamp 
            ? Date.now() - pauseStartTimestamp 
            : 0;

          setState(prev => ({
            ...prev,
            isBackground: false,
            totalPausedTime: prev.totalPausedTime + pauseDurationMs,
            pauseCount: prev.pauseCount + 1
          }));

          // Adjust TIMED mode timer
          const { timerExpectedEnd } = useGameStore.getState();
          if (timerExpectedEnd) {
            useGameStore.setState({ 
              timerExpectedEnd: timerExpectedEnd + pauseDurationMs 
            });
            console.log(`[BackgroundPause] Timer adjusted by ${pauseDurationMs}ms`);
          }

          // Dispatch resume event with pause duration
          window.dispatchEvent(new CustomEvent('fluxgrid-resume', { 
            detail: { pauseDurationMs } 
          }));

          console.log(`[BackgroundPause] Resume event dispatched (paused for ${pauseDurationMs}ms)`);
          
          pauseStartTimestamp = null;
        }
      } catch (error) {
        console.error('[BackgroundPause] Error in visibility change handler', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log('[BackgroundPause] Visibility change listener added');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('[BackgroundPause] Cleanup: Visibility change listener removed');
    };
  }, [shouldEnable]);

  return {
    state
  };
}
