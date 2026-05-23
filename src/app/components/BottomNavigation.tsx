import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../shared/store/themeStore';
import { NavigationTab } from '../../shared/store/navigationStore';
import { Home, BarChart2, Settings } from 'lucide-react';

export interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

const TAB_CONFIG: Array<{
  id: NavigationTab;
  labelKey: string;
  icon: React.FC<{ size: number; strokeWidth: number }>;
  activeColor: string;
}> = [
  {
    id: 'home',
    labelKey: 'navigation.home',
    icon: Home,
    activeColor: '#818cf8',
  },
  {
    id: 'stats',
    labelKey: 'navigation.stats',
    icon: BarChart2,
    activeColor: '#f472b6',
  },
  {
    id: 'settings',
    labelKey: 'navigation.settings',
    icon: Settings,
    activeColor: '#34d399',
  },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme !== 'light';

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: isDark
          ? 'rgba(5,5,12,0.88)'
          : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: isDark
          ? '0 -5px 18px rgba(0,0,0,0.24)'
          : '0 -5px 18px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{
        maxWidth: 448,
        margin: '0 auto',
        padding: '6px 16px 8px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}>
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const inactiveColor = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.45)';

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={t(tab.labelKey)}
              aria-pressed={isActive}
              whileTap={{ scale: 0.92 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 4px 8px',
                minHeight: 42,
                position: 'relative',
                zIndex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 10,
                color: isActive ? tab.activeColor : inactiveColor,
              }}
            >
              {/* Icon */}
              <motion.div
                animate={{
                  scale: isActive ? 1.12 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                style={{
                  width: 34,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: isActive ? `${tab.activeColor}14` : 'transparent',
                  boxShadow: isActive ? `0 0 14px ${tab.activeColor}22` : 'none',
                }}
              >
                <Icon
                  size={23}
                  strokeWidth={isActive ? 2.45 : 1.95}
                />
              </motion.div>

              {/* Active bottom dot */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: tab.activeColor,
                    boxShadow: `0 0 10px ${tab.activeColor}`,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
