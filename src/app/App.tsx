import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigationStore } from '../shared/store/navigationStore';
import { useSettingsStore } from '../shared/store/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { HomeScreen } from './HomeScreen';
import { StatisticsScreen } from './StatisticsScreen';
import { SettingsScreen } from './SettingsScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { ScreenErrorBoundary } from './ScreenErrorBoundary';

export const App: React.FC = () => {
  const { i18n } = useTranslation();
  const { activeTab, setActiveTab } = useNavigationStore();
  const { loadSettings, language } = useSettingsStore();
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();

  // Load settings and sync language on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  
  // Sync language with i18n
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);
  
  // Listen for tutorial return home event as fallback
  useEffect(() => {
    const handleTutorialReturnHome = () => {
      setActiveTab('home');
    };
    
    window.addEventListener('tutorial-return-home', handleTutorialReturnHome);
    return () => window.removeEventListener('tutorial-return-home', handleTutorialReturnHome);
  }, [setActiveTab]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScreenErrorBoundary screenName="Ana Sayfa">
            <HomeScreen key="home" />
          </ScreenErrorBoundary>
        );
      case 'stats':
        return (
          <ScreenErrorBoundary screenName="İstatistikler">
            <StatisticsScreen key="stats" />
          </ScreenErrorBoundary>
        );
      case 'settings':
        return (
          <ScreenErrorBoundary screenName="Ayarlar">
            <SettingsScreen key="settings" />
          </ScreenErrorBoundary>
        );
      default:
        return (
          <ScreenErrorBoundary screenName="Ana Sayfa">
            <HomeScreen key="home" />
          </ScreenErrorBoundary>
        );
    }
  };

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: colors.background }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};
