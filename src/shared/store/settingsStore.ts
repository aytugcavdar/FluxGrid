import { create } from 'zustand';

export type LanguageType = 'tr' | 'en' | 'de' | 'fr' | 'es';

interface SettingsStore {
  // Audio & Haptic
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticEnabled: boolean;
  
  // Game Settings
  ghostBlockEnabled: boolean;
  performanceModeEnabled: boolean;
  
  // Accessibility
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  
  // Language
  language: LanguageType;
  
  // Actions
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setGhostBlockEnabled: (enabled: boolean) => void;
  setPerformanceModeEnabled: (enabled: boolean) => void;
  setColorBlindMode: (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => void;
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
  MUSIC_ENABLED: 'flux_music_enabled',
  HAPTIC_ENABLED: 'flux_haptic_enabled',
  GHOST_BLOCK: 'flux_ghost_block',
  PERFORMANCE_MODE: 'flux_performance_mode',
  COLOR_BLIND_MODE: 'flux_color_blind_mode',
  LANGUAGE: 'flux_language',
} as const;

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  musicEnabled: true,
  hapticEnabled: true,
  ghostBlockEnabled: true,
  performanceModeEnabled: false,
  colorBlindMode: 'none' as const,
  language: 'tr' as LanguageType,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  
  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(enabled));
  },
  
  setMusicEnabled: (enabled: boolean) => {
    set({ musicEnabled: enabled });
    localStorage.setItem(STORAGE_KEYS.MUSIC_ENABLED, JSON.stringify(enabled));
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
  
  setColorBlindMode: (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => {
    set({ colorBlindMode: mode });
    localStorage.setItem(STORAGE_KEYS.COLOR_BLIND_MODE, mode);
    
    // Apply color blind filter to document
    const root = document.documentElement;
    if (mode === 'none') {
      root.style.filter = '';
    } else if (mode === 'protanopia') {
      // Red-blind (most common)
      root.style.filter = 'url(#protanopia-filter)';
    } else if (mode === 'deuteranopia') {
      // Green-blind
      root.style.filter = 'url(#deuteranopia-filter)';
    } else if (mode === 'tritanopia') {
      // Blue-blind (rare)
      root.style.filter = 'url(#tritanopia-filter)';
    }
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
      const musicEnabled = localStorage.getItem(STORAGE_KEYS.MUSIC_ENABLED);
      const hapticEnabled = localStorage.getItem(STORAGE_KEYS.HAPTIC_ENABLED);
      const ghostBlockEnabled = localStorage.getItem(STORAGE_KEYS.GHOST_BLOCK);
      const performanceModeEnabled = localStorage.getItem(STORAGE_KEYS.PERFORMANCE_MODE);
      const colorBlindMode = localStorage.getItem(STORAGE_KEYS.COLOR_BLIND_MODE);
      const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      
      const loadedSettings = {
        soundEnabled: soundEnabled !== null ? JSON.parse(soundEnabled) : DEFAULT_SETTINGS.soundEnabled,
        musicEnabled: musicEnabled !== null ? JSON.parse(musicEnabled) : DEFAULT_SETTINGS.musicEnabled,
        hapticEnabled: hapticEnabled !== null ? JSON.parse(hapticEnabled) : DEFAULT_SETTINGS.hapticEnabled,
        ghostBlockEnabled: ghostBlockEnabled !== null ? JSON.parse(ghostBlockEnabled) : DEFAULT_SETTINGS.ghostBlockEnabled,
        performanceModeEnabled: performanceModeEnabled !== null ? JSON.parse(performanceModeEnabled) : DEFAULT_SETTINGS.performanceModeEnabled,
        colorBlindMode: (colorBlindMode as 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') || DEFAULT_SETTINGS.colorBlindMode,
        language: (language as LanguageType) || DEFAULT_SETTINGS.language,
      };
      
      set(loadedSettings);
      
      // Apply color blind mode if set
      if (loadedSettings.colorBlindMode !== 'none') {
        get().setColorBlindMode(loadedSettings.colorBlindMode);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set(DEFAULT_SETTINGS);
    }
  },
  
  saveSettings: () => {
    const state = get();
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(state.soundEnabled));
      localStorage.setItem(STORAGE_KEYS.MUSIC_ENABLED, JSON.stringify(state.musicEnabled));
      localStorage.setItem(STORAGE_KEYS.HAPTIC_ENABLED, JSON.stringify(state.hapticEnabled));
      localStorage.setItem(STORAGE_KEYS.GHOST_BLOCK, JSON.stringify(state.ghostBlockEnabled));
      localStorage.setItem(STORAGE_KEYS.PERFORMANCE_MODE, JSON.stringify(state.performanceModeEnabled));
      localStorage.setItem(STORAGE_KEYS.COLOR_BLIND_MODE, state.colorBlindMode);
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
        musicEnabled: state.musicEnabled,
        hapticEnabled: state.hapticEnabled,
        ghostBlockEnabled: state.ghostBlockEnabled,
        performanceModeEnabled: state.performanceModeEnabled,
        colorBlindMode: state.colorBlindMode,
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
