import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUnifiedNavigationStore, type AppScreen } from '../shared/store/unifiedNavigationStore';
import { useSettingsStore } from '../shared/store/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { useGameStore } from '../features/game/store/gameStore';
import { HomeScreen } from './HomeScreen';
import { StatisticsScreen } from './StatisticsScreen';
import { SettingsScreen } from './SettingsScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { ScreenErrorBoundary } from './ScreenErrorBoundary';
import { NavigationTab } from '../shared/store/navigationStore';
import { ConsentModal } from './components/ConsentModal';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { initializeDeepLinkHandler, removeDeepLinkHandler } from '../utils/deepLinkHandler';
import { showAchievementNotification } from '../utils/notificationHelper';
import '../utils/testWidgetSync'; // Load test helper
import { AchievementNotification } from '../features/achievements';

export const App: React.FC = () => {
  const { i18n } = useTranslation();
  const { currentScreen, navigateTo } = useUnifiedNavigationStore();
  const { loadSettings, language } = useSettingsStore();
  const { getThemeColors } = useThemeStore();
  const { setGameMode, achievements: rawAchievements, unlockedAchievementId } = useGameStore();
  const colors = getThemeColors();
  
  // Ensure achievements is always an array
  const achievements = Array.isArray(rawAchievements) ? rawAchievements : [];
  
  // GDPR consent modal state
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Load settings and sync language on mount
  useEffect(() => {
    loadSettings();
    
    // Request notification permission on first launch (native only)
    import('../utils/notificationHelper').then(({ requestNotificationPermission }) => {
      requestNotificationPermission().then(granted => {
        console.log('[App] Notification permission:', granted ? 'granted' : 'denied');
      });
    });
    
    // Sync existing data to widgets on app start
    import('../utils/widgetHelper').then(({ syncAllWidgetData }) => {
      const gameState = useGameStore.getState();
      syncAllWidgetData(gameState.highScores, gameState.progression.streak);
    });
  }, [loadSettings]);
  
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
      }
    });
    
    return () => {
      removeDeepLinkHandler();
    };
  }, [setGameMode, navigateTo]);
  
  // Show notification when achievement is unlocked
  useEffect(() => {
    if (unlockedAchievementId) {
      const achievement = achievements.find(a => a.id === unlockedAchievementId);
      if (achievement) {
        showAchievementNotification(achievement);
      }
    }
  }, [unlockedAchievementId, achievements]);
  
  // Listen for tutorial return home event as fallback
  useEffect(() => {
    const handleTutorialReturnHome = () => {
      navigateTo('home');
    };
    
    window.addEventListener('tutorial-return-home', handleTutorialReturnHome);
    return () => window.removeEventListener('tutorial-return-home', handleTutorialReturnHome);
  }, [navigateTo]);
  
  // Listen for GDPR consent request
  useEffect(() => {
    const handleShowConsent = () => {
      console.log('[App] Showing GDPR consent modal');
      setShowConsentModal(true);
    };
    
    window.addEventListener('fluxgrid-show-consent', handleShowConsent);
    return () => window.removeEventListener('fluxgrid-show-consent', handleShowConsent);
  }, []);
  
  // Handle consent selection
  const handleConsent = (consentType: 'personalized' | 'non-personalized') => {
    console.log('[App] Consent selected:', consentType);
    setShowConsentModal(false);
    
    // Dispatch consent response event
    window.dispatchEvent(new CustomEvent('fluxgrid-consent-response', {
      detail: { consentType }
    }));
  };

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

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: colors.background }}>
      {/* Offline Indicator */}
      <OfflineIndicator position="top" showSlowConnection={true} />
      
      {/* Achievement Notification */}
      <AchievementNotification />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
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
        activeTab={currentScreen === 'statistics' ? 'stats' : (currentScreen === 'game' ? 'home' : currentScreen as NavigationTab)}
        onTabChange={(tab) => {
          const screen = tab === 'stats' ? 'statistics' : tab;
          navigateTo(screen as AppScreen);
        }}
      />
      
      {/* GDPR Consent Modal */}
      {showConsentModal && <ConsentModal onConsent={handleConsent} />}
    </div>
  );
};
