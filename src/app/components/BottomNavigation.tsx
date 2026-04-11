import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../shared/store/themeStore';
import { NavigationTab } from '../../shared/store/navigationStore';

export interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation();
  const { getThemeColors, currentTheme } = useThemeStore();
  const colors = getThemeColors();
  
  const tabs: Array<{ id: NavigationTab; label: string; icon: string }> = [
    { id: 'home', label: t('navigation.home'), icon: '🏠' },
    { id: 'stats', label: t('navigation.stats'), icon: '📊' },
    { id: 'settings', label: t('navigation.settings'), icon: '⚙️' },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: currentTheme === 'light' 
          ? 'rgba(255,255,255,0.95)' 
          : 'rgba(10,14,26,0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${colors.cardBorderTransparent}`,
      }}
    >
      <div className="max-w-[448px] mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                aria-pressed={isActive}
                className="flex flex-col items-center gap-1 py-2 px-4 transition-all"
                style={{
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                <span className="text-xl">{tab.icon}</span>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: isActive ? colors.accentPrimary : colors.textSecondary,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
