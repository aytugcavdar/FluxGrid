import React, { useEffect } from 'react';
import { useTutorialStore } from '@shared/store/tutorialStore';
import { AdManager } from '@utils/adManager';

export interface AdBannerProps {
  position: 'bottom';
}

export const AdBanner: React.FC<AdBannerProps> = () => {
  const isTutorialActive = useTutorialStore(state => state.isActive);

  // Detect native platform
  const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

  // Manage banner lifecycle on native platform
  useEffect(() => {
    if (isNative) {
      AdManager.showBanner();
      
      return () => {
        AdManager.hideBanner();
      };
    }
  }, [isNative]);

  // Don't show during tutorial
  if (isTutorialActive) {
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
        height: '50px',
        minHeight: '50px',
        maxHeight: '50px',
      }}
    />
  );
};
