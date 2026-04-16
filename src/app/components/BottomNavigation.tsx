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
      className="fixed left-0 right-0 z-50"
      style={{
        bottom: '4px',
        left: '4px',
        right: '4px',
        background: currentTheme === 'light' 
          ? 'rgba(255,255,255,0.98)' 
          : 'rgba(15,12,29,0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${colors.cardBorderTransparent}`,
        borderRadius: '12px',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="max-w-[448px] mx-auto px-1 py-1.5">
        <div className="flex items-center justify-around relative" style={{ minHeight: '48px' }}>
          {/* Active indicator background */}
          <motion.div
            className="absolute top-0 bottom-0 rounded-2xl"
            animate={{
              left: activeTab === 'home' ? '4px' : activeTab === 'stats' ? 'calc(33.33% + 2px)' : 'calc(66.66%)',
              width: 'calc(33.33% - 8px)',
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            style={{
              background: currentTheme === 'light'
                ? 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(147,51,234,0.15) 100%)'
                : 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.2) 100%)',
              border: `1px solid ${colors.accentPrimary}40`,
            }}
          />
          
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                aria-pressed={isActive}
                className="flex flex-col items-center gap-0.5 py-1.5 px-2 transition-all relative z-10 flex-1"
                whileTap={{ scale: 0.95 }}
                style={{
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                <motion.span 
                  className="text-lg leading-none"
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                >
                  {tab.icon}
                </motion.span>
                <motion.span
                  className="text-[9px] font-semibold leading-tight whitespace-nowrap"
                  animate={{
                    scale: isActive ? 1 : 0.95,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                  style={{
                    color: isActive ? colors.accentPrimary : colors.textSecondary,
                  }}
                >
                  {tab.label}
                </motion.span>
                
                {/* Active dot indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-0.5 left-1/2 w-1 h-1 rounded-full"
                    style={{
                      background: colors.accentPrimary,
                      boxShadow: `0 0 8px ${colors.accentPrimary}`,
                      marginLeft: '-2px',
                    }}
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
