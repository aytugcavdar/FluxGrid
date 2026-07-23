import React, { useEffect, useState } from 'react';
import { useTutorialStore } from '../../features/tutorial/store/tutorialStore';
import { useGameStore } from '@features/game/store/gameStore';
import { AdManager } from '@core/services/ads/AdManager';

export interface AdBannerProps {
  position: 'bottom';
}

export const AdBanner: React.FC<AdBannerProps> = React.memo(() => {
  const isTutorialActive = useTutorialStore(state => state.isActive);
  const isGameOver = useGameStore(state => state.isGameOver);
  const [consentAllowsAds, setConsentAllowsAds] = useState(() => AdManager.canRequestAds());

  useEffect(() => {
    const handleConsentUpdate = () => setConsentAllowsAds(AdManager.canRequestAds());
    window.addEventListener('fluxgrid-ad-consent-updated', handleConsentUpdate);
    return () => window.removeEventListener('fluxgrid-ad-consent-updated', handleConsentUpdate);
  }, []);

  // Detect native platform
  const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
  const shouldShowBanner =
    isNative &&
    consentAllowsAds &&
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
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    
    // Listen for pause/resume events
    const handlePause = () => {
      if (resumeTimer) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
      AdManager.hideBanner();
    };
    
    const handleResume = () => {
      // Delay banner show to ensure smooth transition
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        resumeTimer = null;
        AdManager.showBanner();
      }, 500);
    };
    
    window.addEventListener('fluxgrid-pause', handlePause);
    window.addEventListener('fluxgrid-resume', handleResume);
    
    return () => {
      clearTimeout(timer);
      if (resumeTimer) clearTimeout(resumeTimer);
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
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 'calc(var(--native-banner-reserve, clamp(76px, 10vh, 96px)) + max(env(safe-area-inset-bottom, 0px), var(--safe-area-bottom, 0px)))',
        minHeight: 'calc(var(--native-banner-reserve, clamp(76px, 10vh, 96px)) + max(env(safe-area-inset-bottom, 0px), var(--safe-area-bottom, 0px)))',
        maxHeight: 'calc(var(--native-banner-reserve, clamp(76px, 10vh, 96px)) + max(env(safe-area-inset-bottom, 0px), var(--safe-area-bottom, 0px)))',
        pointerEvents: 'none',
      }}
    />
  );
});
