import { useEffect, useRef } from 'react';
import { AppState } from '@shared/types';
import { useGameStore } from '@features/game/store/gameStore';
import { useTranslation } from 'react-i18next';

export function useBrowserHistory() {
  const { appState, isGameOver, setAppState } = useGameStore();
  const { t } = useTranslation();
  const isHandlingPopState = useRef(false);
  const historyDepth = useRef(0);

  // Initialize history state with depth tracking
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ depth: 0, appState: AppState.HOME }, '');
      historyDepth.current = 0;
    } else if (window.history.state.depth !== undefined) {
      historyDepth.current = window.history.state.depth;
    }
  }, []);

  // Push state when appState changes (except HOME)
  useEffect(() => {
    if (appState !== AppState.HOME) {
      historyDepth.current += 1;
      window.history.pushState({ depth: historyDepth.current, appState }, '');
    } else {
      // When returning to HOME, reset depth
      historyDepth.current = 0;
      window.history.replaceState({ depth: 0, appState: AppState.HOME }, '');
    }
  }, [appState]);

  // Listen to popstate (back button)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent re-entrant handling
      if (isHandlingPopState.current) return;
      isHandlingPopState.current = true;
      
      try {
        // If in GAME state, show confirmation dialog
        if (appState === AppState.GAME && !isGameOver) {
          const confirmed = window.confirm(t('game.confirmExit'));
          if (confirmed) {
            setAppState(AppState.HOME);
          } else {
            // User cancelled, push state back
            window.history.pushState({ depth: historyDepth.current, appState: AppState.GAME }, '');
          }
        } else {
          // Navigate back to previous state or HOME
          const targetState = event.state?.appState || AppState.HOME;
          const targetDepth = event.state?.depth ?? 0;
          historyDepth.current = targetDepth;
          setAppState(targetState);
        }
      } finally {
        // Reset flag after a short delay to allow state updates
        setTimeout(() => {
          isHandlingPopState.current = false;
        }, 100);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [appState, isGameOver, setAppState, t]);
}
