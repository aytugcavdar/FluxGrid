import '../i18n';
import './index.css';
import './newui.css'; // New UI styles
import './performance.css'; // Performance optimizations
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App'; // New UI for menu
import AppWithErrorBoundary from './GameApp'; // Old App for game
import { MarketingSite } from './MarketingSite';
import { useGameStore } from '../features/game/store/gameStore';
import { AppState, GameMode } from '@shared/types';
import { AdManager } from '@core/services/ads/AdManager';
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
import {
  getNotificationActionTarget,
  pushNotificationService,
  notificationScheduler,
} from '../services/notifications/pushNotificationService';
import { initializeLazyLoading } from '../utils/performance/lazyLoader';
import { initializeMemoryOptimization } from '../utils/performance/memoryOptimizer';
import { PageTransition } from '../shared/components/PageTransition';

// Get app version from package.json
const APP_VERSION = '1.0.0';

const getNormalizedPath = () => {
  const path = window.location.pathname.replace(/\/+$/, '');
  return path || '/';
};

const MARKETING_ROUTES = new Set(['/', '/privacy', '/privacy-policy', '/support', '/contact']);
const isNativeRuntime = Capacitor.isNativePlatform();
const normalizedPath = getNormalizedPath();
const isMarketingRoute = !isNativeRuntime && MARKETING_ROUTES.has(normalizedPath);

/**
 * Configure StatusBar for native Android app
 * Sets dark style with app theme background color
 */
const configureStatusBar = async () => {
  try {
    await StatusBar.setStyle({ style: Style.Dark }); // light icons on dark background
    await StatusBar.setBackgroundColor({ color: '#0d1117' }); // matches splash screen, prevents flash on launch
    await StatusBar.setOverlaysWebView({ overlay: true }); // fully transparent overlay
  } catch (e) {
    // StatusBar not available on web, silently ignore
    console.log('[StatusBar] Not available:', e);
  }
};

const getNotificationContext = () => {
  const gameState = useGameStore.getState();
  const streakState = useStreakStore.getState();
  const gameLogs = gameState.gameLogs || [];
  const lastLog = gameLogs[0];
  const lastTimedLog = gameLogs.find(log => log.mode === GameMode.TIMED);
  const bestScore = lastLog?.mode === GameMode.TIMED
    ? (gameState.stats?.timedHighScore || gameState.highScores?.[GameMode.TIMED] || 0)
    : (lastLog ? gameState.highScores?.[lastLog.mode] || 0 : 0);

  return {
    currentStreak: streakState.currentStreak,
    todayPlayed: streakState.todayPlayed,
    lastPlayedAt: lastLog?.timestamp,
    lastScore: lastLog?.score,
    bestScore,
    lastTimedPlayedAt: lastTimedLog?.timestamp,
  };
};

// Root component that switches between menu and game
const RuntimeApp: React.FC = () => {
  const appState = useGameStore(state => state.appState);
  const { i18n } = useTranslation();
  const [updateDialogConfig, setUpdateDialogConfig] = useState<UpdateDialogConfig | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  
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
    
    // Phone reminders are scheduled locally. Remove any token left by older
    // builds so retired server schedules cannot duplicate local reminders.
    if (Capacitor.isNativePlatform()) {
      pushNotificationService.disableRemoteNotifications()
        .then(() => {
          return notificationScheduler.scheduleEngagementNotifications(getNotificationContext(), { requestPermission: false });
        })
        .catch((error) => {
          console.error('[App] Failed to initialize push notifications:', error);
        });
    }
    
    // Initialize notification action listeners
    import('@/src/utils/native/notificationHelper').then(({ addNotificationActionListener }) => {
      addNotificationActionListener((action) => {
        console.log('[Notification] Action performed:', action);

        const extra = action.notification?.extra || action.notification?.data || {};
        const target = getNotificationActionTarget(extra);
        const gameStore = useGameStore.getState();

        if (target.target === 'game') {
          const mode = target.mode === 'timed'
            ? GameMode.TIMED
            : target.mode === 'daily'
              ? GameMode.DAILY_CHALLENGE
              : GameMode.ENDLESS;

          gameStore.setGameMode(mode);
          gameStore.setState({ appState: AppState.GAME });
        } else if (target.target === 'statistics') {
          gameStore.setState({ appState: AppState.HOME });
          useUnifiedNavigationStore.getState().navigateTo('statistics');
        } else if (target.target === 'settings') {
          gameStore.setState({ appState: AppState.HOME });
          useUnifiedNavigationStore.getState().navigateTo('settings');
        } else if (action.actionId === 'play_again') {
          gameStore.setState({ appState: AppState.GAME });
        }
      });
    }).catch((error) => {
      console.error('[App] Failed to initialize notification actions:', error);
    });
    
    // Register unified back button listener
    const cleanup = useUnifiedNavigationStore.getState().registerBackButtonListener();
    const refreshNotificationsBeforeBackground = () => {
      void notificationScheduler.scheduleEngagementNotifications(
        getNotificationContext(),
        { requestPermission: false }
      );
    };
    document.addEventListener('pause', refreshNotificationsBeforeBackground);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('pause', refreshNotificationsBeforeBackground);
      cleanup();
    };
  }, []);
  
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

const RootRouter: React.FC = () => {
  if (isMarketingRoute) {
    return <MarketingSite />;
  }

  return <RuntimeApp />;
};

// Initialize Sentry for error tracking (before React render)
initializeSentry();

if (!isMarketingRoute) {
  // Web vitals add background observers with little value in the native WebView.
  if (!isNativeRuntime || import.meta.env.DEV) {
    initializePerformanceMonitoring();
  }

  // Start measuring game load time
  startGameLoadMeasure();

  // Initialize lazy loading for non-critical resources
  initializeLazyLoading();

  if (!isNativeRuntime) {
    initializeMemoryOptimization();
  }
}

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

if (!isMarketingRoute) {
  // Apply safe area CSS synchronously before React render (prevents layout jump)
  applySafeAreaCSS();
}

// Initialize splash coordinator before React render
const splashCoordinator = getSplashCoordinator();
if (!isMarketingRoute) {
  splashCoordinator.initialize();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SentryErrorBoundary>
      <RootRouter />
    </SentryErrorBoundary>
  </React.StrictMode>
);

if (isMarketingRoute) {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.style.display = 'none';
  }
} else {
  const splashStartedAt = Date.now();
  const minSplashMs = 2200;
  const maxSplashMs = 3000;
  let splashDismissed = false;

  const releaseNativeSplash = () => {
    const splashBridge = (window as any).FluxGridSplash;
    if (splashBridge && typeof splashBridge.hide === 'function') {
      splashBridge.hide();
    }
  };

  const dismissSplash = () => {
    if (splashDismissed) return;
    splashDismissed = true;
    getSplashCoordinator().dismissWebSplash();
    window.setTimeout(releaseNativeSplash, 180);
  };

  const dismissWhenReady = () => {
    if (!document.querySelector('[data-app-shell-ready="true"], [data-game-screen-ready="true"]')) {
      window.setTimeout(dismissWhenReady, 50);
      return;
    }

    const elapsed = Date.now() - splashStartedAt;
    const delay = Math.max(0, minSplashMs - elapsed);
    window.setTimeout(dismissSplash, delay);
  };

  window.setTimeout(dismissSplash, maxSplashMs);
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(dismissWhenReady);
  });
}
