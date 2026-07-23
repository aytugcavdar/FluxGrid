import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUnifiedNavigationStore, type AppScreen } from '../shared/store/unifiedNavigationStore';
import { useSettingsStore } from '@core/state/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { useGameStore } from '../features/game/store/gameStore';
import { useStreakStore } from '../shared/store/streakStore';
import { HomeScreen } from './HomeScreen';
import { StatisticsScreen } from './StatisticsScreen';
import { SettingsScreen } from './SettingsScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { ScreenErrorBoundary } from './ScreenErrorBoundary';
import { NavigationTab } from '../shared/store/navigationStore';
import { OfflineIndicator } from '../shared/components/OfflineIndicator';
import { initializeDeepLinkHandler, removeDeepLinkHandler } from '../utils/native/deepLinkHandler';
import '../utils/native/testWidgetSync'; // Load test helper
import { RemoteLogger } from '../utils/debug/RemoteLogger';
import { cleanupLegacyStorage } from '../utils/storage/cleanupLegacyStorage';

export const App: React.FC = () => {
  const hasMountedRef = useRef(false);
  const { i18n } = useTranslation();
  const { currentScreen, navigateTo } = useUnifiedNavigationStore();
  const { loadSettings, language } = useSettingsStore();
  const { getThemeColors } = useThemeStore();
  const { setGameMode } = useGameStore();
  const { initialize: initializeStreak, currentStreak, todayPlayed } = useStreakStore();
  const colors = getThemeColors();
  const didRunInitialWidgetSync = useRef(false);
  
  // Load settings and sync language on mount
  useEffect(() => {
    loadSettings();
    
    // Clean up legacy localStorage keys (one-time cleanup)
    cleanupLegacyStorage();
    
    // Initialize streak store
    initializeStreak();
    
    // Sync existing data to widgets on app start
    import('../utils/native/widgetHelper').then(({ syncAllWidgetData }) => {
      const gameState = useGameStore.getState();
      const streakState = useStreakStore.getState();
      const lastScore = gameState.gameLogs?.[0]?.score ?? 0;
      didRunInitialWidgetSync.current = true;
      syncAllWidgetData(gameState.highScores, streakState.currentStreak, lastScore, streakState.todayPlayed);
    }).catch(error => {
      console.error('[App] Failed to sync widget data:', error);
    });
  }, [loadSettings, initializeStreak]);

  // Keep widgets current when daily streak changes without rerunning app startup work.
  useEffect(() => {
    if (!didRunInitialWidgetSync.current) return;

    import('../utils/native/widgetHelper').then(({ syncAllWidgetData }) => {
      const gameState = useGameStore.getState();
      const lastScore = gameState.gameLogs?.[0]?.score ?? 0;
      syncAllWidgetData(gameState.highScores, currentStreak, lastScore, todayPlayed);
    }).catch(error => {
      console.error('[App] Failed to sync widget streak:', error);
    });
  }, [currentStreak, todayPlayed]);
  
  // Sync language with i18n
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);
  
  // Initialize deep link handler for app shortcuts
  useEffect(() => {
    initializeDeepLinkHandler((data) => {
      console.log('[App] Deep link received:', data);
      
      if (data.mode) {
        // Set game mode and navigate to home
        setGameMode(data.mode);
        navigateTo('home');
      } else if (data.screen) {
        // Navigate to specific screen
        navigateTo(data.screen);
      }
    });
    
    return () => {
      removeDeepLinkHandler();
    };
  }, [setGameMode, navigateTo]);
  
  // Listen for tutorial return home event as fallback
  useEffect(() => {
    const handleTutorialReturnHome = () => {
      navigateTo('home');
    };
    
    window.addEventListener('tutorial-return-home', handleTutorialReturnHome);
    return () => window.removeEventListener('tutorial-return-home', handleTutorialReturnHome);
  }, [navigateTo]);
  
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <ScreenErrorBoundary screenName="Ana Sayfa">
            <HomeScreen key="home" />
          </ScreenErrorBoundary>
        );
      case 'statistics':
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

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  // Check for reduced motion preference or use faster animations
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldAnimate = !prefersReducedMotion && hasMountedRef.current;

  return (
    <div 
      data-app-shell-ready="true"
      className="relative w-full h-full overflow-hidden" 
      style={{ 
        background: colors.background,
      }}
    >
      {/* Offline Indicator */}
      <OfflineIndicator position="top" showSlowConnection={true} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={shouldAnimate ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          exit={shouldAnimate ? { opacity: 0 } : {}}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          className="w-full h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      <BottomNavigation
        activeTab={currentScreen === 'statistics' ? 'stats' : (currentScreen === 'game' ? 'home' : currentScreen as NavigationTab)}
        onTabChange={(tab) => {
          const screen = tab === 'stats' ? 'statistics' : tab;
          navigateTo(screen as AppScreen);
        }}
      />

      {/* Remote Debug Logger - Toggle with 3-finger double-tap */}
      <RemoteLogger />
    </div>
  );
};
