/**
 * Android Back Button Handler Hook
 * Handles hardware/software back button on Android devices using Capacitor
 */

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { AppState } from '@shared/types';

interface UseAndroidBackButtonOptions {
  appState: AppState;
  isGameOver: boolean;
  setAppState: (state: AppState) => void;
  onBack?: () => boolean; // Return true to prevent default behavior
}

/**
 * Hook to handle Android back button behavior
 * - On non-home screens: Navigate to home
 * - On home screen: Minimize app
 * - During game (not game over): Show confirmation dialog
 * - Custom handlers can override default behavior
 */
export function useAndroidBackButton({
  appState,
  isGameOver,
  setAppState,
  onBack,
}: UseAndroidBackButtonOptions): void {
  useEffect(() => {
    // Only register on Capacitor native platform
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    if (!isNative) return;

    const handleBackButton = async () => {
      // If custom handler provided and returns true, stop
      if (onBack && onBack()) {
        return;
      }

      // If in game and not game over, show confirmation
      if (appState === AppState.GAME && !isGameOver) {
        const confirmed = window.confirm('Oyundan çıkmak istediğinize emin misiniz?');
        if (confirmed) {
          setAppState(AppState.HOME);
        }
        return;
      }

      // If not on home screen, navigate to home
      if (appState !== AppState.HOME) {
        setAppState(AppState.HOME);
        return;
      }

      // If on home screen, minimize app
      await App.minimizeApp();
    };

    // Register back button listener
    const listener = App.addListener('backButton', handleBackButton);

    // Cleanup on unmount
    return () => {
      listener.then(handle => handle.remove());
    };
  }, [appState, isGameOver, setAppState, onBack]);
}
