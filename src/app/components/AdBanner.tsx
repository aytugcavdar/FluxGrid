import React from 'react';
import { useThemeStore } from '@shared/store/themeStore';
import { useTutorialStore } from '@shared/store/tutorialStore';
import { AdManager } from '@utils/adManager';

export interface AdBannerProps {
  position: 'bottom';
}

export const AdBanner: React.FC<AdBannerProps> = () => {
  const { getColors } = useThemeStore();
  const colors = getColors();
  const isTutorialActive = useTutorialStore(state => state.isActive);

  // Don't show during tutorial
  if (isTutorialActive) {
    return null;
  }

  // Don't show on small screens (mobile)
  if (typeof window !== 'undefined' && window.innerWidth < 390) {
    return null;
  }

  // Don't show if no-ads is active
  if (AdManager.isNoAdsActive()) {
    return null;
  }

  return (
    <div
      className="w-full flex items-center justify-center"
      style={{
        height: '50px',
        minHeight: '50px',
        maxHeight: '50px',
        backgroundColor: colors.cardBackground,
        borderTop: `1px solid ${colors.cardBorder}`,
      }}
    >
      <span
        className="text-xs font-medium"
        style={{ color: colors.textTertiary }}
      >
        REKLAM
      </span>
      {/* TODO: Replace with Admob banner integration */}
      {/* <AdMobBanner adUnitId={AdManager.AD_IDS.banner} /> */}
    </div>
  );
};
