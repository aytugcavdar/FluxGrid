/**
 * Performance System Initialization
 * 
 * Wires all performance systems together on game startup
 */

import { deviceDetector } from './DeviceDetector';
import { performanceManager } from './PerformanceManager';
import { babylonOptimizer } from './BabylonOptimizer';
import { memoryManager } from './MemoryManager';
import { useSettingsStore } from '../store/settingsStore';
import { runMigrationIfNeeded } from './migration';

/**
 * Initialize performance system
 */
export async function initializePerformanceSystem(babylonEngine: any, babylonScene: any): Promise<void> {
  console.log('[PerformanceSystem] Initializing...');
  
  // Run migration if needed
  runMigrationIfNeeded();
  
  // Detect device capabilities
  const capabilities = await deviceDetector.detect();
  console.log('[PerformanceSystem] Device capabilities:', capabilities);
  
  // Store device classification
  localStorage.setItem('flux_device_classification', capabilities.classification);
  
  // Initialize performance manager
  performanceManager.initialize(babylonEngine, capabilities);
  
  // Initialize Babylon optimizer
  babylonOptimizer.initialize(babylonScene);
  
  // Get settings from store
  const settingsStore = useSettingsStore.getState();
  const { qualityPreset, autoAdjust } = settingsStore;
  
  // Apply quality preset
  const preset = settingsStore.getPreset(qualityPreset);
  if (preset) {
    performanceManager.applyPreset(preset);
    babylonOptimizer.applyQualityPreset(preset);
  }
  
  // Enable auto-adjust if enabled
  if (autoAdjust) {
    performanceManager.enableAutoAdjust();
  }
  
  // Start memory monitoring
  memoryManager.startMonitoring();
  
  console.log('[PerformanceSystem] Initialization complete');
}

/**
 * Cleanup performance system
 */
export function cleanupPerformanceSystem(): void {
  console.log('[PerformanceSystem] Cleaning up...');
  
  // Disable auto-adjust
  performanceManager.disableAutoAdjust();
  
  // Stop memory monitoring
  memoryManager.stopMonitoring();
  
  // Dispose Babylon optimizer
  babylonOptimizer.dispose();
  
  console.log('[PerformanceSystem] Cleanup complete');
}
