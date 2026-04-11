import React, { useEffect } from 'react';
import { useTutorialStore } from '@shared/store/tutorialStore';
import { useGameStore } from '@features/game/store/gameStore';
import { AdManager } from '@utils/adManager';

export interface AdBannerProps {
  position: 'bottom';
}

export const AdBanner: React.FC<AdBannerProps> = () => {
  const isTutorialActive = useTutorialStore(state => state.isActive);
  const isGameOver = useGameStore(state => state.isGameOver);

  // Detect native platform
  const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

  // Manage banner lifecycle on native platform
  useEffect(() => {
    if (isNative) {
      // Delay banner display to ensure Activity is fully loaded
      // This prevents NullPointerException when ViewGroup is not ready
      const timer = setTimeout(() => {
        AdManager.showBanner();
      }, 1500); // 1500ms delay for Activity stabilization
      
      // Listen for pause/resume events
      const handlePause = () => {
        AdManager.hideBanner();
      };
      
      const handleResume = () => {
        // Delay banner show to ensure smooth transition
        setTimeout(() => {
          AdManager.showBanner();
        }, 500);
      };
      
      window.addEventListener('fluxgrid-pause', handlePause);
      window.addEventListener('fluxgrid-resume', handleResume);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('fluxgrid-pause', handlePause);
        window.removeEventListener('fluxgrid-resume', handleResume);
        AdManager.hideBanner();
      };
    }
  }, [isNative]);

  // Don't show during tutorial
  if (isTutorialActive) {
    return null;
  }
  
  // Don't show during game over
  if (isGameOver) {
    return null;
  }

  // Don't show on small screens
  if (typeof window !== 'undefined' && window.innerWidth < 390) {
    return null;
  }

  // Don't show if no-ads is active
  if (AdManager.isNoAdsActive()) {
    return null;
  }

  // Only show on native platform
  if (!isNative) {
    return null;
  }

  // Render native banner container
  return (
    <div
      className="w-full"
      style={{
        height: 'calc(50px + env(safe-area-inset-bottom, 0px) + 10px)',
        minHeight: 'calc(50px + env(safe-area-inset-bottom, 0px) + 10px)',
        maxHeight: 'calc(50px + env(safe-area-inset-bottom, 0px) + 10px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
      }}
    />
  );
};
