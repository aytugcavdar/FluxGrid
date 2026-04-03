import { useEffect } from 'react';
import { App } from '@capacitor/app';

/**
 * Hook to handle Android back button navigation
 * Provides tab-aware navigation: home exits app, other tabs navigate to home
 */
export function useAndroidBackButton(
  activeTab: 'home' | 'stats' | 'settings',
  setActiveTab: (tab: 'home' | 'stats' | 'settings') => void
): void {
  useEffect(() => {
    // Only register listener on native platform
    const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
    if (!isNative) return;
    
    let listenerHandle: any = null;
    
    // Register listener asynchronously
    App.addListener('backButton', (event) => {
      if (activeTab === 'home') {
        // Exit app from home screen
        App.exitApp();
      } else {
        // Navigate to home from any other screen
        setActiveTab('home');
      }
    }).then((handle) => {
      listenerHandle = handle;
    });
    
    // Cleanup listener on unmount
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [activeTab, setActiveTab]);
}
