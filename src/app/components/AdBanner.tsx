import React, { useEffect } from 'react';
import { useTutorialStore } from '../../features/tutorial/store/tutorialStore';
import { useGameStore } from '@features/game/store/gameStore';
import { AdManager } from '@core/services/ads/AdManager';

export interface AdBannerProps {
  position: 'bottom';
}

export const AdBanner: React.FC<AdBannerProps> = React.memo(() => {
  const isTutorialActive = useTutorialStore(state => state.isActive);
  const isGameOver = useGameStore(state => state.isGameOver);

  // Detect native platform
  const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
  const shouldShowBanner =
    isNative &&
    !isTutorialActive &&
    !isGameOver &&
    !AdManager.isNoAdsActive();

  // Manage banner lifecycle on native platform
  useEffect(() => {
    if (!isNative) {
      return;
    }

    if (!shouldShowBanner) {
      AdManager.hideBanner();
      window.dispatchEvent(new CustomEvent('fluxgrid-banner-hidden', {
        detail: { height: 0 }
      }));
      return;
    }

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
  }, [isNative, shouldShowBanner]);

  if (!shouldShowBanner) {
    return null;
  }

  // Render native banner container
  return (
    <div
      className="w-full flex-shrink-0"
      style={{
        height: 'calc(60px + env(safe-area-inset-bottom, 0px) + 10px)',
        minHeight: 'calc(60px + env(safe-area-inset-bottom, 0px) + 10px)',
        maxHeight: 'calc(60px + env(safe-area-inset-bottom, 0px) + 10px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
        marginTop: '8px',
      }}
    />
  );
});
