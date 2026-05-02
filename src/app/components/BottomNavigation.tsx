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
  activeBg: string;
  activeBorder: string;
  glow: string;
}> = [
  {
    id: 'home',
    labelKey: 'navigation.home',
    icon: Home,
    activeColor: '#818cf8',
    activeBg: 'rgba(99,102,241,0.16)',
    activeBorder: 'rgba(99,102,241,0.35)',
    glow: '0 0 16px rgba(99,102,241,0.3)',
  },
  {
    id: 'stats',
    labelKey: 'navigation.stats',
    icon: BarChart2,
    activeColor: '#f472b6',
    activeBg: 'rgba(244,114,182,0.14)',
    activeBorder: 'rgba(244,114,182,0.32)',
    glow: '0 0 16px rgba(244,114,182,0.28)',
  },
  {
    id: 'settings',
    labelKey: 'navigation.settings',
    icon: Settings,
    activeColor: '#34d399',
    activeBg: 'rgba(52,211,153,0.14)',
    activeBorder: 'rgba(52,211,153,0.32)',
    glow: '0 0 16px rgba(52,211,153,0.28)',
  },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation();
  const { currentTheme } = useThemeStore();
  const isDark = currentTheme !== 'light';

  const activeConfig = TAB_CONFIG.find(t => t.id === activeTab) ?? TAB_CONFIG[0];

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: 6,
        left: 8,
        right: 8,
        borderRadius: 22,
        background: isDark
          ? 'rgba(10,8,22,0.92)'
          : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: isDark
          ? `0 -2px 32px rgba(0,0,0,0.4), ${activeConfig.glow}`
          : '0 -2px 24px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.4s ease',
      }}
    >
      <div style={{
        maxWidth: 448,
        margin: '0 auto',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* Sliding active background pill */}
        <motion.div
          animate={{
            left: activeTab === 'home'
              ? 8
              : activeTab === 'stats'
              ? 'calc(33.33% + 5px)'
              : 'calc(66.66% + 2px)',
            width: 'calc(33.33% - 13px)',
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{
            position: 'absolute',
            top: 6, bottom: 6,
            borderRadius: 16,
            background: activeConfig.activeBg,
            border: `1px solid ${activeConfig.activeBorder}`,
            boxShadow: activeConfig.glow,
          }}
        />

        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

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
                gap: 3,
                padding: '8px 4px',
                position: 'relative',
                zIndex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 14,
              }}
            >
              {/* Icon */}
              <motion.div
                animate={{
                  scale: isActive ? 1.08 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{ scale: isActive ? 1.02 : 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                style={{
                  fontSize: 9,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive
                    ? tab.activeColor
                    : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)',
                  letterSpacing: isActive ? '0.04em' : 0,
                  lineHeight: 1,
                  transition: 'color 0.2s, font-weight 0.1s',
                }}
              >
                {t(tab.labelKey)}
              </motion.span>

              {/* Override icon color via inline wrapper */}
              <style>{`
                button[aria-label="${t(tab.labelKey)}"] svg {
                  color: ${isActive ? tab.activeColor : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'};
                  transition: color 0.2s;
                }
              `}</style>

              {/* Active bottom dot */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4, height: 4,
                    borderRadius: '50%',
                    background: tab.activeColor,
                    boxShadow: `0 0 8px ${tab.activeColor}`,
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
