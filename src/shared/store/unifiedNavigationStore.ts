import { create } from 'zustand';
import { App } from '@capacitor/app';

export type AppScreen = 'home' | 'game' | 'statistics' | 'settings';

export interface NavigationState {
  currentScreen: AppScreen;
  previousScreen: AppScreen | null;
  canGoBack: boolean;
}

export interface UnifiedNavigationStore extends NavigationState {
  nativeBackHandler: (() => boolean) | null;
  navigateTo: (screen: AppScreen) => void;
  goBack: () => void;
  handleBackButton: () => boolean;
  setNativeBackHandler: (handler: (() => boolean) | null) => void;
  registerBackButtonListener: () => () => void;
}

export const useUnifiedNavigationStore = create<UnifiedNavigationStore>((set, get) => ({
  currentScreen: 'home',
  previousScreen: null,
  canGoBack: false,
  nativeBackHandler: null,

  navigateTo: (screen: AppScreen) => {
    const current = get().currentScreen;
    
    // Don't navigate if already on the screen
    if (current === screen) return;
    
    set({
      currentScreen: screen,
      previousScreen: current,
      canGoBack: screen !== 'home',
    });
  },

  goBack: () => {
    const { previousScreen, currentScreen } = get();
    
    // Always go back to home
    if (currentScreen !== 'home') {
      set({
        currentScreen: 'home',
        previousScreen: currentScreen,
        canGoBack: false,
      });
    }
  },

  handleBackButton: () => {
    const { currentScreen, nativeBackHandler } = get();

    if (nativeBackHandler?.()) {
      return true;
    }
    
    // Home screen: exit app (return false)
    if (currentScreen === 'home') {
      return false;
    }
    
    // Other screens: navigate to home (return true)
    get().goBack();
    return true;
  },

  setNativeBackHandler: (handler) => {
    set({ nativeBackHandler: handler });
  },

  registerBackButtonListener: () => {
    let listenerHandle: any = null;
    
    App.addListener('backButton', () => {
      const handled = get().handleBackButton();
      
      // If not handled (on home screen), exit app
      if (!handled) {
        App.exitApp();
      }
    }).then(handle => {
      listenerHandle = handle;
    });
    
    // Return cleanup function
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  },
}));
