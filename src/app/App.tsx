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
import { ConsentModal } from '../shared/components/ConsentModal';
import { OfflineIndicator } from '../shared/components/OfflineIndicator';
import { initializeDeepLinkHandler, removeDeepLinkHandler } from '../utils/native/deepLinkHandler';
import { showAchievementNotification } from '../utils/native/notificationHelper';
import '../utils/native/testWidgetSync'; // Load test helper
import { AchievementNotification } from '../features/achievements';
import type { ConsentType } from '@services/gdpr';

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
    import('../utils/native/notificationHelper').then(({ requestNotificationPermission }) => {
      requestNotificationPermission().then(granted => {
        console.log('[App] Notification permission:', granted ? 'granted' : 'denied');
      }).catch(error => {
        console.error('[App] Notification permission error:', error);
      });
    }).catch(error => {
      console.error('[App] Failed to load notification helper:', error);
    });
    
    // Sync existing data to widgets on app start
    import('../utils/native/widgetHelper').then(({ syncAllWidgetData }) => {
      const gameState = useGameStore.getState();
      // Get daily challenge streak from localStorage (not in-game streak)
      const dailyStreak = parseInt(localStorage.getItem('flux_daily_streak') || '0');
      syncAllWidgetData(gameState.highScores, dailyStreak);
    }).catch(error => {
      console.error('[App] Failed to sync widget data:', error);
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
  const handleConsent = async (consentType: ConsentType) => {
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

  // Check for reduced motion preference or use faster animations
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldAnimate = !prefersReducedMotion;

  return (
    <div 
      className="relative w-full h-full overflow-hidden" 
      style={{ 
        background: colors.background,
      }}
    >
      {/* Offline Indicator */}
      <OfflineIndicator position="top" showSlowConnection={true} />
      
      {/* Achievement Notification */}
      <AchievementNotification />
      
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
      
      {/* GDPR Consent Modal */}
      {showConsentModal && <ConsentModal onConsent={handleConsent} />}
    </div>
  );
};
