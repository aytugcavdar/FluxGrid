import '../i18n';
import './index.css';
import './newui.css'; // New UI styles
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App'; // New UI for menu
import AppWithErrorBoundary from './GameApp'; // Old App for game
import { useGameStore } from '../features/game/store/gameStore';
import { AppState } from '@shared/types';
import { AdManager } from '@utils/adManager';
import { useStreakStore } from '@shared/store/streakStore';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useUnifiedNavigationStore } from '@shared/store/unifiedNavigationStore';
import { applySafeAreaCSS } from '@utils/safeAreaManager';
import { getSplashCoordinator } from '@utils/splashCoordinator';
import { initializeVersionChecker, checkVersionAndShowDialog } from '../services/version/versionChecker';
import { UpdateDialog } from '../components/UpdateDialog';
import type { UpdateDialogConfig } from '../services/version/versionChecker';
import { useTranslation } from 'react-i18next';

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
  
  // Initialize version checker and check for updates
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Initialize version checker
        await initializeVersionChecker(APP_VERSION);
        
        // Check version and show dialog if needed
        await checkVersionAndShowDialog(
          APP_VERSION,
          i18n.language,
          (config) => {
            setUpdateDialogConfig(config);
            setShowUpdateDialog(true);
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
    
    // Initialize notification action listeners
    import('@utils/notificationHelper').then(({ registerNotificationActions, addNotificationActionListener }) => {
      registerNotificationActions();
      addNotificationActionListener((action) => {
        console.log('[Notification] Action performed:', action);
        
        // Handle notification actions
        if (action.actionId === 'play_again') {
          // Navigate to game screen
          useGameStore.getState().setState({ appState: AppState.GAME });
        } else if (action.actionId === 'share') {
          // Open share dialog
          import('@utils/shareHelper').then(({ shareScore }) => {
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
    
    // For menu screen, dismiss splash after a short delay
    // For game screen, Grid component will handle it
    if (appState !== AppState.GAME) {
      setTimeout(() => {
        const coordinator = getSplashCoordinator();
        coordinator.dismissWebSplash();
      }, 100);
    }
    
    // Cleanup on unmount
    return cleanup;
  }, [appState]);
  
  // Show game screen when in GAME state, otherwise show menu
  if (appState === AppState.GAME) {
    return (
      <>
        <AppWithErrorBoundary />
        {updateDialogConfig && (
          <UpdateDialog
            isVisible={showUpdateDialog}
            config={updateDialogConfig}
            onUpdate={() => {
              window.open(updateDialogConfig.updateUrl, '_blank');
            }}
            onDismiss={updateDialogConfig.canDismiss ? () => setShowUpdateDialog(false) : undefined}
          />
        )}
      </>
    );
  }
  
  return (
    <>
      <App />
      {updateDialogConfig && (
        <UpdateDialog
          isVisible={showUpdateDialog}
          config={updateDialogConfig}
          onUpdate={() => {
            window.open(updateDialogConfig.updateUrl, '_blank');
          }}
          onDismiss={updateDialogConfig.canDismiss ? () => setShowUpdateDialog(false) : undefined}
        />
      )}
    </>
  );
};

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
    <RootApp />
  </React.StrictMode>
);

// Splash coordinator will handle dismissal when ready
// Do NOT call splashComplete() here - let the coordinator manage it