import { create } from 'zustand';

export type LanguageType = 'tr' | 'en';

interface SettingsStore {
  // Audio & Haptic
  soundEnabled: boolean;
  hapticEnabled: boolean;
  
  // Game Settings
  ghostBlockEnabled: boolean;
  performanceModeEnabled: boolean;
  
  // Language
  language: LanguageType;
  
  // Actions
  setSoundEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setGhostBlockEnabled: (enabled: boolean) => void;
  setPerformanceModeEnabled: (enabled: boolean) => void;
  setLanguage: (lang: LanguageType) => void;
  
  // Persistence
  loadSettings: () => void;
  saveSettings: () => void;
  
  // Data Management
  exportData: () => Promise<string>;
  resetAllData: () => void;
}

const STORAGE_KEYS = {
  SOUND_ENABLED: 'flux_sound_enabled',
  HAPTIC_ENABLED: 'flux_haptic_enabled',
  GHOST_BLOCK: 'flux_ghost_block',
  PERFORMANCE_MODE: 'flux_performance_mode',
  LANGUAGE: 'flux_language',
} as const;

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  hapticEnabled: true,
  ghostBlockEnabled: true,
  performanceModeEnabled: false,
  language: 'tr' as LanguageType,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  
  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(enabled));
  },
  
  setHapticEnabled: (enabled: boolean) => {
    set({ hapticEnabled: enabled });
    localStorage.setItem(STORAGE_KEYS.HAPTIC_ENABLED, JSON.stringify(enabled));
  },
  
  setGhostBlockEnabled: (enabled: boolean) => {
    set({ ghostBlockEnabled: enabled });
    localStorage.setItem(STORAGE_KEYS.GHOST_BLOCK, JSON.stringify(enabled));
  },
  
  setPerformanceModeEnabled: (enabled: boolean) => {
    set({ performanceModeEnabled: enabled });
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE_MODE, JSON.stringify(enabled));
  },
  
  setLanguage: (lang: LanguageType) => {
    set({ language: lang });
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    
    // Update i18n language
    if (typeof window !== 'undefined' && (window as any).i18n) {
      (window as any).i18n.changeLanguage(lang);
    }
  },
  
  loadSettings: () => {
    try {
      const soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      const hapticEnabled = localStorage.getItem(STORAGE_KEYS.HAPTIC_ENABLED);
      const ghostBlockEnabled = localStorage.getItem(STORAGE_KEYS.GHOST_BLOCK);
      const performanceModeEnabled = localStorage.getItem(STORAGE_KEYS.PERFORMANCE_MODE);
      const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      
      set({
        soundEnabled: soundEnabled !== null ? JSON.parse(soundEnabled) : DEFAULT_SETTINGS.soundEnabled,
        hapticEnabled: hapticEnabled !== null ? JSON.parse(hapticEnabled) : DEFAULT_SETTINGS.hapticEnabled,
        ghostBlockEnabled: ghostBlockEnabled !== null ? JSON.parse(ghostBlockEnabled) : DEFAULT_SETTINGS.ghostBlockEnabled,
        performanceModeEnabled: performanceModeEnabled !== null ? JSON.parse(performanceModeEnabled) : DEFAULT_SETTINGS.performanceModeEnabled,
        language: (language as LanguageType) || DEFAULT_SETTINGS.language,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set(DEFAULT_SETTINGS);
    }
  },
  
  saveSettings: () => {
    const state = get();
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(state.soundEnabled));
      localStorage.setItem(STORAGE_KEYS.HAPTIC_ENABLED, JSON.stringify(state.hapticEnabled));
      localStorage.setItem(STORAGE_KEYS.GHOST_BLOCK, JSON.stringify(state.ghostBlockEnabled));
      localStorage.setItem(STORAGE_KEYS.PERFORMANCE_MODE, JSON.stringify(state.performanceModeEnabled));
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, state.language);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
  
  exportData: async (): Promise<string> => {
    const state = get();
    const exportData = {
      version: '1.0',
      exportedAt: Date.now(),
      settings: {
        soundEnabled: state.soundEnabled,
        hapticEnabled: state.hapticEnabled,
        ghostBlockEnabled: state.ghostBlockEnabled,
        performanceModeEnabled: state.performanceModeEnabled,
        language: state.language,
      },
    };
    
    return JSON.stringify(exportData, null, 2);
  },
  
  resetAllData: () => {
    // Clear ALL localStorage data (not just settings)
    const keysToKeep = ['ios_pwa_instructions_shown']; // Keep only PWA instruction flag
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Reset settings to defaults
    set(DEFAULT_SETTINGS);
    
    // Force reload to reset all stores
    window.location.reload();
  },
}));
