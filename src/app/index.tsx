import '../i18n';
import './index.css';
import './newui.css'; // New UI styles
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App'; // New UI for menu
import AppWithErrorBoundary from './GameApp'; // Old App for game
import { useGameStore } from '../features/game/store/gameStore';
import { AppState } from '@shared/types';
import { AdManager } from '@utils/adManager';
import { useStreakStore } from '@shared/store/streakStore';
import { StatusBar, Style } from '@capacitor/status-bar';

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
  
  // Initialize monetization systems and StatusBar on mount
  useEffect(() => {
    AdManager.initialize();
    useStreakStore.getState().initialize();
    configureStatusBar();
  }, []);
  
  // Show game screen when in GAME state, otherwise show menu
  if (appState === AppState.GAME) {
    return <AppWithErrorBoundary />;
  }
  
  return <App />;
};

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

// React mount olduktan sonra splash kapat
// onMount değil, ilk render sonrası
setTimeout(() => {
  if (typeof (window as any).splashComplete === 'function') {
    (window as any).splashComplete();
  }
}, 100);