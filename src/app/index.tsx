import '../i18n';
import './index.css';
import './newui.css'; // New UI styles
import './performance.css'; // Performance optimizations
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App'; // New UI for menu
import AppWithErrorBoundary from './GameApp'; // Old App for game
import { useGameStore } from '../features/game/store/gameStore';
import { AppState } from '@shared/types';
import { AdManager } from '@/src/utils/managers/adManager';
import { useStreakStore } from '@shared/store/streakStore';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useUnifiedNavigationStore } from '@shared/store/unifiedNavigationStore';
import { applySafeAreaCSS } from '@/src/utils/device/safeAreaManager';
import { getSplashCoordinator } from '@/src/utils/performance/splashCoordinator';
import { initializeVersionChecker, checkVersionAndShowDialog, versionChecker } from '../services/version/versionChecker';
import { UpdateDialog } from '../shared/components/UpdateDialog';
import type { UpdateDialogConfig } from '../services/version/versionChecker';
import { useTranslation } from 'react-i18next';
import { initializeSentry, setUserContext, addBreadcrumb } from '../services/monitoring/sentryService';
import { SentryErrorBoundary } from '../shared/components/SentryErrorBoundary';
import { Capacitor } from '@capacitor/core';
import { initializePerformanceMonitoring, startGameLoadMeasure } from '../services/monitoring/performanceMonitoring';
import { pushNotificationService, notificationScheduler } from '../services/notifications/pushNotificationService';
import { initializeLazyLoading } from '../utils/performance/lazyLoader';
import { initializeMemoryOptimization } from '../utils/performance/memoryOptimizer';
import { PageTransition } from '../shared/components/PageTransition';
import { LoadingScreen } from '../shared/components/LoadingScreen';

// Get app version from package.json
const APP_VERSION = '1.0.0';

/**
 * Configure StatusBar for native Android app
 * Sets dark style with app theme background color
 */
const configureStatusBar = async () => {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0d1117' });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch (e) {
    // StatusBar not available on web, silently ignore
    console.log('[StatusBar] Not available:', e);
  }
};

// Root component that switches between menu and game
const RootApp: React.FC = () => {
  const appState = useGameStore(state => state.appState);
  const { i18n } = useTranslation();
  const [updateDialogConfig, setUpdateDialogConfig] = useState<UpdateDialogConfig | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 1.5 seconds loading
    
    return () => clearTimeout(timer);
  }, []);
  
  // Set user context for Sentry (anonymous ID)
  useEffect(() => {
    // Generate or retrieve anonymous user ID
    const userId = localStorage.getItem('anonymousUserId') || `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    if (!localStorage.getItem('anonymousUserId')) {
      localStorage.setItem('anonymousUserId', userId);
    }
    
    // Set user context in Sentry
    setUserContext(userId);
    
    // Add platform and app version as breadcrumbs
    addBreadcrumb('App initialized', 'lifecycle', {
      platform: Capacitor.getPlatform(),
      native: Capacitor.isNativePlatform(),
      appVersion: APP_VERSION,
    });
  }, []);
  
  // Track app state changes as breadcrumbs
  useEffect(() => {
    addBreadcrumb(`App state changed to ${appState}`, 'navigation', {
      appState,
    });
  }, [appState]);
  
  // Initialize version checker and check for updates
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Initialize version checker
        await initializeVersionChecker();
        
        // Check version and show dialog if needed
        const result = await checkVersionAndShowDialog(
          APP_VERSION,
          {
            minVersion: '1.0.0',
            recommendedVersion: '1.0.0',
            onUpdateRequired: () => {
              const config: UpdateDialogConfig = {
                title: i18n.language === 'tr' ? 'Güncelleme Gerekli' : 'Update Required',
                message: versionChecker.getUpdateMessage('required', i18n.language, {
                  currentVersion: APP_VERSION,
                  latestVersion: '1.0.0'
                }),
                updateButtonText: i18n.language === 'tr' ? 'Güncelle' : 'Update',
                updateUrl: versionChecker.getUpdateURL('android', 'com.fluxgrid.app'),
                canDismiss: false
              };
              setUpdateDialogConfig(config);
              setShowUpdateDialog(true);
            },
            onUpdateRecommended: () => {
              const config: UpdateDialogConfig = {
                title: i18n.language === 'tr' ? 'Güncelleme Mevcut' : 'Update Available',
                message: versionChecker.getUpdateMessage('recommended', i18n.language, {
                  currentVersion: APP_VERSION,
                  latestVersion: '1.0.0'
                }),
                updateButtonText: i18n.language === 'tr' ? 'Güncelle' : 'Update',
                cancelButtonText: i18n.language === 'tr' ? 'Daha Sonra' : 'Later',
                updateUrl: versionChecker.getUpdateURL('android', 'com.fluxgrid.app'),
                canDismiss: true
              };
              setUpdateDialogConfig(config);
              setShowUpdateDialog(true);
            }
          }
        );
      } catch (error) {
        console.error('[App] Version check failed:', error);
        // Continue without version check (graceful degradation)
      }
    };
    
    checkVersion();
  }, [i18n.language]);
  
  // Initialize monetization systems, StatusBar, and back button listener on mount
  useEffect(() => {
    AdManager.initialize();
    useStreakStore.getState().initialize();
    configureStatusBar();
    // applySafeAreaCSS() and splashCoordinator moved before React render (see below)
    
    // Initialize push notifications
    if (Capacitor.isNativePlatform()) {
      pushNotificationService.initialize()
        .then(() => {
          // Schedule daily reminders
          return Promise.all([
            notificationScheduler.scheduleDailyChallengeReminder(),
            notificationScheduler.scheduleDailyRewardReminder()
          ]);
        })
        .catch((error) => {
          console.error('[App] Failed to initialize push notifications:', error);
        });
    }
    
    // Initialize notification action listeners
    import('@/src/utils/native/notificationHelper').then(({ registerNotificationActions, addNotificationActionListener }) => {
      registerNotificationActions();
      addNotificationActionListener((action) => {
        console.log('[Notification] Action performed:', action);
        
        // Handle notification actions
        if (action.actionId === 'play_again') {
          // Navigate to game screen
          useGameStore.getState().setState({ appState: AppState.GAME });
        } else if (action.actionId === 'share') {
          // Open share dialog
          import('@/src/utils/sharing/shareHelper').then(({ shareScore }) => {
            const { score, gameMode } = useGameStore.getState();
            shareScore(score, gameMode);
          });
        } else if (action.actionId === 'view_stats') {
          // Navigate to statistics screen
          useGameStore.getState().setState({ appState: AppState.STATISTICS });
        }
      });
    }).catch((error) => {
      console.error('[App] Failed to initialize notification actions:', error);
    });
    
    // Register unified back button listener
    const cleanup = useUnifiedNavigationStore.getState().registerBackButtonListener();
    
    // Cleanup on unmount
    return cleanup;
  }, [appState]);
  
  // Show loading screen on initial load
  if (isLoading) {
    return <LoadingScreen message={i18n.language === 'tr' ? 'Yükleniyor...' : 'Loading...'} />;
  }
  
  // Show game screen when in GAME state, otherwise show menu
  if (appState === AppState.GAME) {
    return (
      <>
        <PageTransition pageKey="game">
          <AppWithErrorBoundary />
        </PageTransition>
        {updateDialogConfig && (
          <UpdateDialog
            isVisible={showUpdateDialog}
            config={updateDialogConfig}
            onUpdate={() => {
              window.open(updateDialogConfig.updateUrl, '_blank');
              if (updateDialogConfig.canDismiss) {
                setShowUpdateDialog(false);
              }
            }}
            onDismiss={updateDialogConfig.canDismiss ? () => setShowUpdateDialog(false) : undefined}
          />
        )}
      </>
    );
  }
  
  return (
    <>
      <PageTransition pageKey="menu">
        <App />
      </PageTransition>
      {updateDialogConfig && (
        <UpdateDialog
          isVisible={showUpdateDialog}
          config={updateDialogConfig}
          onUpdate={() => {
            window.open(updateDialogConfig.updateUrl, '_blank');
            if (updateDialogConfig.canDismiss) {
              setShowUpdateDialog(false);
            }
          }}
          onDismiss={updateDialogConfig.canDismiss ? () => setShowUpdateDialog(false) : undefined}
        />
      )}
    </>
  );
};

// Initialize Sentry for error tracking (before React render)
initializeSentry();

// Initialize performance monitoring
initializePerformanceMonitoring();

// Start measuring game load time
startGameLoadMeasure();

// Initialize lazy loading for non-critical resources
initializeLazyLoading();

// Initialize memory optimization
initializeMemoryOptimization();

// Set up global error handlers
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  addBreadcrumb('Unhandled error', 'error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
  addBreadcrumb('Unhandled promise rejection', 'error', {
    reason: event.reason?.toString(),
  });
});

// Apply safe area CSS synchronously before React render (prevents layout jump)
applySafeAreaCSS();

// Initialize splash coordinator before React render
const splashCoordinator = getSplashCoordinator();
splashCoordinator.initialize();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SentryErrorBoundary>
      <RootApp />
    </SentryErrorBoundary>
  </React.StrictMode>
);

// Dismiss splash screen after React renders (for menu screen)
// For game screen, Grid component will handle it via Babylon.js ready event
setTimeout(() => {
  const coordinator = getSplashCoordinator();
  coordinator.dismissWebSplash();
}, 1500); // Increased from 500ms to 1500ms to ensure full initialization