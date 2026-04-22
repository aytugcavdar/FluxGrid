/**
 * Settings Store
 * 
 * Manages performance settings and user preferences
 */

import { create } from 'zustand';
import type { QualityPreset, PerformanceSettingsSaveData } from '../types';
import { QUALITY_PRESETS } from '../types';
import { performanceManager } from '../utils/PerformanceManager';

interface SettingsStore {
  // Performance settings
  qualityPreset: QualityPreset;
  customSettings: Partial<QualityPreset>;
  autoAdjust: boolean;
  
  // Display settings
  reducedMotion: boolean;
  
  // Metrics
  showMetrics: boolean;
  metricsPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  // Actions
  setQualityPreset: (preset: 'low' | 'medium' | 'high') => void;
  setCustomSetting: (key: keyof QualityPreset, value: any) => void;
  toggleAutoAdjust: () => void;
  toggleReducedMotion: () => void;
  toggleMetrics: () => void;
  setMetricsPosition: (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => void;
}

const STORAGE_KEY = 'flux_performance_v1';

/**
 * Load settings from localStorage
 */
function loadSettings(): Partial<SettingsStore> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const data: PerformanceSettingsSaveData = JSON.parse(stored);
    
    const presetName = data.qualityPreset;
    const preset = QUALITY_PRESETS[presetName] || QUALITY_PRESETS.medium;
    
    return {
      qualityPreset: { ...preset, ...data.customSettings },
      customSettings: data.customSettings,
      autoAdjust: data.autoAdjust,
      reducedMotion: data.reducedMotion
    };
  } catch (error) {
    console.error('[SettingsStore] Failed to load settings:', error);
    return {};
  }
}

/**
 * Save settings to localStorage
 */
function saveSettings(state: SettingsStore): void {
  try {
    const data: PerformanceSettingsSaveData = {
      version: 1,
      deviceClassification: 'medium', // Will be updated by device detector
      qualityPreset: state.qualityPreset.name,
      customSettings: state.customSettings,
      autoAdjust: state.autoAdjust,
      reducedMotion: state.reducedMotion,
      lastUpdated: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[SettingsStore] Failed to save settings:', error);
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => {
  // Load saved settings
  const savedSettings = loadSettings();
  
  return {
    // Initial state
    qualityPreset: savedSettings.qualityPreset || QUALITY_PRESETS.medium,
    customSettings: savedSettings.customSettings || {},
    autoAdjust: savedSettings.autoAdjust !== undefined ? savedSettings.autoAdjust : false,
    reducedMotion: savedSettings.reducedMotion || false,
    showMetrics: false,
    metricsPosition: 'top-right',
    
    /**
     * Set quality preset
     */
    setQualityPreset: (presetName: 'low' | 'medium' | 'high') => {
      const preset = QUALITY_PRESETS[presetName];
      
      set({
        qualityPreset: preset,
        customSettings: {}
      });
      
      // Apply to performance manager
      performanceManager.applyPreset(preset);
      
      saveSettings(get());
      console.log(`[SettingsStore] Quality preset set to ${presetName}`);
    },
    
    /**
     * Set custom setting
     */
    setCustomSetting: (key: keyof QualityPreset, value: any) => {
      const state = get();
      
      const newCustomSettings = {
        ...state.customSettings,
        [key]: value
      };
      
      const newPreset: QualityPreset = {
        ...state.qualityPreset,
        ...newCustomSettings,
        name: 'custom'
      };
      
      set({
        qualityPreset: newPreset,
        customSettings: newCustomSettings
      });
      
      // Apply to performance manager
      performanceManager.applyCustomSettings(newCustomSettings);
      
      saveSettings(get());
      console.log(`[SettingsStore] Custom setting ${String(key)} = ${value}`);
    },
    
    /**
     * Toggle auto-adjust
     */
    toggleAutoAdjust: () => {
      const state = get();
      const newValue = !state.autoAdjust;
      
      set({ autoAdjust: newValue });
      
      if (newValue) {
        performanceManager.enableAutoAdjust();
      } else {
        performanceManager.disableAutoAdjust();
      }
      
      saveSettings(get());
      console.log(`[SettingsStore] Auto-adjust ${newValue ? 'enabled' : 'disabled'}`);
    },
    
    /**
     * Toggle reduced motion
     */
    toggleReducedMotion: () => {
      const state = get();
      const newValue = !state.reducedMotion;
      
      set({ reducedMotion: newValue });
      
      saveSettings(get());
      console.log(`[SettingsStore] Reduced motion ${newValue ? 'enabled' : 'disabled'}`);
    },
    
    /**
     * Toggle metrics display
     */
    toggleMetrics: () => {
      const state = get();
      set({ showMetrics: !state.showMetrics });
      console.log(`[SettingsStore] Metrics ${!state.showMetrics ? 'shown' : 'hidden'}`);
    },
    
    /**
     * Set metrics position
     */
    setMetricsPosition: (position) => {
      set({ metricsPosition: position });
      console.log(`[SettingsStore] Metrics position set to ${position}`);
    },
    
    /**
     * Reset to defaults
     */
    resetToDefaults: () => {
      set({
        qualityPreset: QUALITY_PRESETS.medium,
        customSettings: {},
        autoAdjust: false,
        reducedMotion: false,
        showMetrics: false,
        metricsPosition: 'top-right'
      });
      
      performanceManager.applyPreset(QUALITY_PRESETS.medium);
      performanceManager.disableAutoAdjust();
      
      saveSettings(get());
      console.log('[SettingsStore] Reset to defaults');
    },
    
    /**
     * Export settings as JSON
     */
    exportSettings: () => {
      const state = get();
      const data: PerformanceSettingsSaveData = {
        version: 1,
        deviceClassification: 'medium',
        qualityPreset: state.qualityPreset.name,
        customSettings: state.customSettings,
        autoAdjust: state.autoAdjust,
        reducedMotion: state.reducedMotion,
        lastUpdated: Date.now()
      };
      
      return JSON.stringify(data, null, 2);
    },
    
    /**
     * Import settings from JSON
     */
    importSettings: (json: string) => {
      try {
        const data: PerformanceSettingsSaveData = JSON.parse(json);
        
        const presetName = data.qualityPreset;
        const preset = QUALITY_PRESETS[presetName] || QUALITY_PRESETS.medium;
        
        set({
          qualityPreset: { ...preset, ...data.customSettings },
          customSettings: data.customSettings,
          autoAdjust: data.autoAdjust,
          reducedMotion: data.reducedMotion
        });
        
        performanceManager.applyPreset(preset);
        if (data.autoAdjust) {
          performanceManager.enableAutoAdjust();
        }
        
        saveSettings(get());
        console.log('[SettingsStore] Settings imported');
      } catch (error) {
        console.error('[SettingsStore] Failed to import settings:', error);
      }
    }
  };
});
