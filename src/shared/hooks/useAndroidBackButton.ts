import { useEffect } from 'react';
import { App } from '@capacitor/app';

/**
 * Hook to handle Android back button navigation
 * Provides tab-aware navigation: home exits app, other tabs navigate to home
 */
export function useAndroidBackButton(
  activeTab: 'home' | 'game' | 'settings' | 'statistics',
  setActiveTab: (tab: 'home' | 'game' | 'settings' | 'statistics') => void
): void {
  useEffect(() => {
    // Only register listener on native platform
    const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
    if (!isNative) return;
    
    const backButtonListener = App.addListener('backButton', (event) => {
      event.preventDefault();
      
      if (activeTab === 'home') {
        // Exit app from home screen
        App.exitApp();
      } else {
        // Navigate to home from any other screen
        setActiveTab('home');
      }
    });
    
    // Cleanup listener on unmount
    return () => {
      backButtonListener.remove();
    };
  }, [activeTab, setActiveTab]);
}
