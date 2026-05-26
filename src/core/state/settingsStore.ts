/**
 * Unified Settings Store
 * 
 * Consolidates all application settings:
 * - Audio & Haptic settings
 * - Game settings
 * - Accessibility settings
 * - Language settings
 * - Performance settings
 * - Metrics display settings
 * 
 * This is the canonical settings store. All other settings stores are deprecated.
 */

import { create } from 'zustand';
import { performanceMonitor } from '@core/services/performance/PerformanceMonitor';
import type { QualityPreset } from '@core/services/performance/PerformanceMonitor';
import { QUALITY_PRESETS } from '@core/services/performance/PerformanceMonitor';
import { getHapticManager, type HapticIntensity } from '@utils/audio';

export type LanguageType = 'tr' | 'en' | 'de' | 'fr' | 'es';
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type MetricsPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface SettingsStore {
  // Audio & Haptic
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticEnabled: boolean;
  hapticIntensity: HapticIntensity;
  dragHapticsEnabled: boolean;
  
  // Game Settings
  ghostBlockEnabled: boolean;
  performanceModeEnabled: boolean;
  
  // Accessibility
  colorBlindMode: ColorBlindMode;
  
  // Language
  language: LanguageType;
  
  // Performance Settings
  qualityPreset: QualityPreset;
  customSettings: Partial<QualityPreset>;
  autoAdjust: boolean;
  reducedMotion: boolean;
  
  // Metrics Display
  showMetrics: boolean;
  metricsPosition: MetricsPosition;
  
  // Audio & Haptic Actions
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setHapticIntensity: (intensity: HapticIntensity) => void;
  setDragHapticsEnabled: (enabled: boolean) => void;
  
  // Game Settings Actions
  setGhostBlockEnabled: (enabled: boolean) => void;
  setPerformanceModeEnabled: (enabled: boolean) => void;
  
  // Accessibility Actions
  setColorBlindMode: (mode: ColorBlindMode) => void;
  
  // Language Actions
  setLanguage: (lang: LanguageType) => void;
  
  // Performance Actions
  setQualityPreset: (preset: 'low' | 'medium' | 'high') => void;
  setCustomSetting: (key: keyof QualityPreset, value: any) => void;
  toggleAutoAdjust: () => void;
  toggleReducedMotion: () => void;
  
  // Metrics Actions
  toggleMetrics: () => void;
  setMetricsPosition: (position: MetricsPosition) => void;
  
  // Persistence Actions
  loadSettings: () => void;
  saveSettings: () => void;
  
  // Data Management Actions
  exportData: () => Promise<string>;
  resetAllData: () => void;
  resetToDefaults: () => void;
}

const STORAGE_KEYS = {
  // Audio & Haptic
  SOUND_ENABLED: 'flux_sound_enabled',
  MUSIC_ENABLED: 'flux_music_enabled',
  HAPTIC_ENABLED: 'flux_haptic_enabled',
  HAPTIC_INTENSITY: 'flux_haptic_intensity',
  DRAG_HAPTICS_ENABLED: 'flux_drag_haptics_enabled',
  
  // Game Settings
  GHOST_BLOCK: 'flux_ghost_block',
  PERFORMANCE_MODE: 'flux_performance_mode',
  
  // Accessibility
  COLOR_BLIND_MODE: 'flux_color_blind_mode',
  
  // Language
  LANGUAGE: 'flux_language',
  
  // Performance Settings (unified key)
  PERFORMANCE_SETTINGS: 'flux_performance_v1',
} as const;

const DEFAULT_SETTINGS = {
  // Audio & Haptic
  soundEnabled: true,
  musicEnabled: true,
  hapticEnabled: true,
  hapticIntensity: 'normal' as HapticIntensity,
  dragHapticsEnabled: true,
  
  // Game Settings
  ghostBlockEnabled: true,
  performanceModeEnabled: false,
  
  // Accessibility
  colorBlindMode: 'none' as ColorBlindMode,
  
  // Language
  language: 'tr' as LanguageType,
  
  // Performance Settings
  qualityPreset: QUALITY_PRESETS.medium,
  customSettings: {} as Partial<QualityPreset>,
  autoAdjust: false,
  reducedMotion: false,
  
  // Metrics Display
  showMetrics: false,
  metricsPosition: 'top-right' as MetricsPosition,
};

/**
 * Load performance settings from localStorage
 */
function loadPerformanceSettings(): Partial<SettingsStore> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PERFORMANCE_SETTINGS);
    if (!stored) return {};
    
    const data = JSON.parse(stored);
    const presetName = data.qualityPreset;
    const preset = QUALITY_PRESETS[presetName] || QUALITY_PRESETS.medium;
    
    return {
      qualityPreset: { ...preset, ...data.customSettings },
      customSettings: data.customSettings,
      autoAdjust: data.autoAdjust,
      reducedMotion: data.reducedMotion,
    };
  } catch (error) {
    console.error('[SettingsStore] Failed to load performance settings:', error);
    return {};
  }
}

/**
 * Save performance settings to localStorage
 */
function savePerformanceSettings(state: SettingsStore): void {
  try {
    const data = {
      version: 1,
      deviceClassification: 'medium',
      qualityPreset: state.qualityPreset.name,
      customSettings: state.customSettings,
      autoAdjust: state.autoAdjust,
      reducedMotion: state.reducedMotion,
      lastUpdated: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE_SETTINGS, JSON.stringify(data));
  } catch (error) {
    console.error('[SettingsStore] Failed to save performance settings:', error);
  }
}

function syncHapticSettings(
  enabled: boolean,
  intensity: HapticIntensity,
  dragHapticsEnabled: boolean
): void {
  try {
    const hapticManager = getHapticManager();
    hapticManager.setEnabled(enabled);
    hapticManager.setIntensity(intensity);
    hapticManager.setDragHapticsEnabled(dragHapticsEnabled);
  } catch (error) {
    console.debug('[SettingsStore] Failed to sync haptic manager:', error);
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => {
  // Load saved performance settings
  const savedPerformanceSettings = loadPerformanceSettings();
  
  return {
    // Initial state
    ...DEFAULT_SETTINGS,
    ...savedPerformanceSettings,
    
    // Audio & Haptic Actions
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
      localStorage.setItem('flux_haptics_enabled', JSON.stringify(enabled));
      syncHapticSettings(enabled, get().hapticIntensity, get().dragHapticsEnabled);
    },

    setHapticIntensity: (intensity: HapticIntensity) => {
      set({ hapticIntensity: intensity });
      localStorage.setItem(STORAGE_KEYS.HAPTIC_INTENSITY, intensity);
      syncHapticSettings(get().hapticEnabled, intensity, get().dragHapticsEnabled);
    },

    setDragHapticsEnabled: (enabled: boolean) => {
      set({ dragHapticsEnabled: enabled });
      localStorage.setItem(STORAGE_KEYS.DRAG_HAPTICS_ENABLED, JSON.stringify(enabled));
      syncHapticSettings(get().hapticEnabled, get().hapticIntensity, enabled);
    },
    
    // Game Settings Actions
    setGhostBlockEnabled: (enabled: boolean) => {
      set({ ghostBlockEnabled: enabled });
      localStorage.setItem(STORAGE_KEYS.GHOST_BLOCK, JSON.stringify(enabled));
    },
    
    setPerformanceModeEnabled: (enabled: boolean) => {
      set({ performanceModeEnabled: enabled });
      localStorage.setItem(STORAGE_KEYS.PERFORMANCE_MODE, JSON.stringify(enabled));
    },
    
    // Accessibility Actions
    setColorBlindMode: (mode: ColorBlindMode) => {
      set({ colorBlindMode: mode });
      localStorage.setItem(STORAGE_KEYS.COLOR_BLIND_MODE, mode);
      
      // Apply color blind filter to document
      const root = document.documentElement;
      if (mode === 'none') {
        root.style.filter = '';
      } else if (mode === 'protanopia') {
        root.style.filter = 'url(#protanopia-filter)';
      } else if (mode === 'deuteranopia') {
        root.style.filter = 'url(#deuteranopia-filter)';
      } else if (mode === 'tritanopia') {
        root.style.filter = 'url(#tritanopia-filter)';
      }
    },
    
    // Language Actions
    setLanguage: (lang: LanguageType) => {
      set({ language: lang });
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      
      // Update i18n language
      if (typeof window !== 'undefined' && (window as any).i18n) {
        (window as any).i18n.changeLanguage(lang);
      }
    },
    
    // Performance Actions
    setQualityPreset: (presetName: 'low' | 'medium' | 'high') => {
      const preset = QUALITY_PRESETS[presetName];
      
      set({
        qualityPreset: preset,
        customSettings: {},
      });
      
      // Apply to performance monitor
      performanceMonitor.applyPreset(preset);
      
      savePerformanceSettings(get());
      console.log(`[SettingsStore] Quality preset set to ${presetName}`);
    },
    
    setCustomSetting: (key: keyof QualityPreset, value: any) => {
      const state = get();
      
      const newCustomSettings = {
        ...state.customSettings,
        [key]: value,
      };
      
      const newPreset: QualityPreset = {
        ...state.qualityPreset,
        ...newCustomSettings,
        name: 'custom',
      };
      
      set({
        qualityPreset: newPreset,
        customSettings: newCustomSettings,
      });
      
      // Apply to performance monitor
      performanceMonitor.applyPreset(newPreset);
      
      savePerformanceSettings(get());
      console.log(`[SettingsStore] Custom setting ${String(key)} = ${value}`);
    },
    
    toggleAutoAdjust: () => {
      const state = get();
      const newValue = !state.autoAdjust;
      
      set({ autoAdjust: newValue });
      
      if (newValue) {
        performanceMonitor.enableAutoAdjust();
      } else {
        performanceMonitor.disableAutoAdjust();
      }
      
      savePerformanceSettings(get());
      console.log(`[SettingsStore] Auto-adjust ${newValue ? 'enabled' : 'disabled'}`);
    },
    
    toggleReducedMotion: () => {
      const state = get();
      const newValue = !state.reducedMotion;
      
      set({ reducedMotion: newValue });
      
      savePerformanceSettings(get());
      console.log(`[SettingsStore] Reduced motion ${newValue ? 'enabled' : 'disabled'}`);
    },
    
    // Metrics Actions
    toggleMetrics: () => {
      const state = get();
      set({ showMetrics: !state.showMetrics });
      console.log(`[SettingsStore] Metrics ${!state.showMetrics ? 'shown' : 'hidden'}`);
    },
    
    setMetricsPosition: (position: MetricsPosition) => {
      set({ metricsPosition: position });
      console.log(`[SettingsStore] Metrics position set to ${position}`);
    },
    
    // Persistence Actions
    loadSettings: () => {
      try {
        const soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
        const musicEnabled = localStorage.getItem(STORAGE_KEYS.MUSIC_ENABLED);
        const hapticEnabled = localStorage.getItem(STORAGE_KEYS.HAPTIC_ENABLED);
        const hapticIntensity = localStorage.getItem(STORAGE_KEYS.HAPTIC_INTENSITY);
        const dragHapticsEnabled = localStorage.getItem(STORAGE_KEYS.DRAG_HAPTICS_ENABLED);
        const ghostBlockEnabled = localStorage.getItem(STORAGE_KEYS.GHOST_BLOCK);
        const performanceModeEnabled = localStorage.getItem(STORAGE_KEYS.PERFORMANCE_MODE);
        const colorBlindMode = localStorage.getItem(STORAGE_KEYS.COLOR_BLIND_MODE);
        const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
        
        const performanceSettings = loadPerformanceSettings();
        
        const loadedSettings = {
          soundEnabled: soundEnabled !== null ? JSON.parse(soundEnabled) : DEFAULT_SETTINGS.soundEnabled,
          musicEnabled: musicEnabled !== null ? JSON.parse(musicEnabled) : DEFAULT_SETTINGS.musicEnabled,
          hapticEnabled: hapticEnabled !== null ? JSON.parse(hapticEnabled) : DEFAULT_SETTINGS.hapticEnabled,
          hapticIntensity: (
            hapticIntensity === 'low' || hapticIntensity === 'normal' || hapticIntensity === 'strong'
              ? hapticIntensity
              : DEFAULT_SETTINGS.hapticIntensity
          ) as HapticIntensity,
          dragHapticsEnabled: dragHapticsEnabled !== null ? JSON.parse(dragHapticsEnabled) : DEFAULT_SETTINGS.dragHapticsEnabled,
          ghostBlockEnabled: ghostBlockEnabled !== null ? JSON.parse(ghostBlockEnabled) : DEFAULT_SETTINGS.ghostBlockEnabled,
          performanceModeEnabled: performanceModeEnabled !== null ? JSON.parse(performanceModeEnabled) : DEFAULT_SETTINGS.performanceModeEnabled,
          colorBlindMode: (colorBlindMode as ColorBlindMode) || DEFAULT_SETTINGS.colorBlindMode,
          language: (language as LanguageType) || DEFAULT_SETTINGS.language,
          ...performanceSettings,
        };
        
        set(loadedSettings);
        syncHapticSettings(
          loadedSettings.hapticEnabled,
          loadedSettings.hapticIntensity,
          loadedSettings.dragHapticsEnabled
        );
        
        // Apply color blind mode if set
        if (loadedSettings.colorBlindMode !== 'none') {
          get().setColorBlindMode(loadedSettings.colorBlindMode);
        }
        
        console.log('[SettingsStore] Settings loaded');
      } catch (error) {
        console.error('[SettingsStore] Failed to load settings:', error);
        set(DEFAULT_SETTINGS);
      }
    },
    
    saveSettings: () => {
      const state = get();
      try {
        localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(state.soundEnabled));
        localStorage.setItem(STORAGE_KEYS.MUSIC_ENABLED, JSON.stringify(state.musicEnabled));
        localStorage.setItem(STORAGE_KEYS.HAPTIC_ENABLED, JSON.stringify(state.hapticEnabled));
        localStorage.setItem(STORAGE_KEYS.HAPTIC_INTENSITY, state.hapticIntensity);
        localStorage.setItem(STORAGE_KEYS.DRAG_HAPTICS_ENABLED, JSON.stringify(state.dragHapticsEnabled));
        localStorage.setItem(STORAGE_KEYS.GHOST_BLOCK, JSON.stringify(state.ghostBlockEnabled));
        localStorage.setItem(STORAGE_KEYS.PERFORMANCE_MODE, JSON.stringify(state.performanceModeEnabled));
        localStorage.setItem(STORAGE_KEYS.COLOR_BLIND_MODE, state.colorBlindMode);
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, state.language);
        
        savePerformanceSettings(state);
        
        console.log('[SettingsStore] Settings saved');
      } catch (error) {
        console.error('[SettingsStore] Failed to save settings:', error);
      }
    },
    
    // Data Management Actions
    exportData: async (): Promise<string> => {
      const state = get();
      const exportData = {
        version: '1.0',
        exportedAt: Date.now(),
        settings: {
          soundEnabled: state.soundEnabled,
          musicEnabled: state.musicEnabled,
          hapticEnabled: state.hapticEnabled,
          hapticIntensity: state.hapticIntensity,
          dragHapticsEnabled: state.dragHapticsEnabled,
          ghostBlockEnabled: state.ghostBlockEnabled,
          performanceModeEnabled: state.performanceModeEnabled,
          colorBlindMode: state.colorBlindMode,
          language: state.language,
          qualityPreset: state.qualityPreset.name,
          customSettings: state.customSettings,
          autoAdjust: state.autoAdjust,
          reducedMotion: state.reducedMotion,
        },
      };
      
      return JSON.stringify(exportData, null, 2);
    },
    
    resetAllData: () => {
      // Clear ALL localStorage data (not just settings)
      const keysToKeep = ['ios_pwa_instructions_shown'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Reset settings to defaults
      set(DEFAULT_SETTINGS);
      syncHapticSettings(
        DEFAULT_SETTINGS.hapticEnabled,
        DEFAULT_SETTINGS.hapticIntensity,
        DEFAULT_SETTINGS.dragHapticsEnabled
      );
      
      // Force reload to reset all stores
      window.location.reload();
    },
    
    resetToDefaults: () => {
      set(DEFAULT_SETTINGS);
      syncHapticSettings(
        DEFAULT_SETTINGS.hapticEnabled,
        DEFAULT_SETTINGS.hapticIntensity,
        DEFAULT_SETTINGS.dragHapticsEnabled
      );
      
      performanceMonitor.applyPreset(QUALITY_PRESETS.medium);
      performanceMonitor.disableAutoAdjust();
      
      get().saveSettings();
      console.log('[SettingsStore] Reset to defaults');
    },
  };
});
