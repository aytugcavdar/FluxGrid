/**
 * Performance System Type Definitions
 */

export interface DeviceCapabilities {
  classification: 'low' | 'medium' | 'high';
  ram: number; // GB
  cores: number;
  gpu: GPUInfo;
  screen: ScreenInfo;
  isMobile: boolean;
}

export interface GPUInfo {
  vendor: string;
  renderer: string;
  tier: number; // 1-3, estimated performance tier
}

export interface ScreenInfo {
  width: number;
  height: number;
  pixelRatio: number;
  refreshRate: number;
}

export interface QualityPreset {
  name: 'low' | 'medium' | 'high' | 'custom';
  liteMode: boolean;
  targetFPS: 30 | 60 | 'unlimited';
  meshQuality: 'low' | 'medium' | 'high';
  textureQuality: 512 | 1024 | 2048;
  particles: 'off' | 'reduced' | 'full';
  shadows: boolean;
  glow: boolean;
  screenShake: boolean;
  floatingText: boolean;
}

export interface PerformanceState {
  currentPreset: QualityPreset;
  deviceCapabilities: DeviceCapabilities;
  currentFPS: number;
  avgFPS: number;
  memoryUsage: number;
  autoAdjustEnabled: boolean;
}

export interface ObjectPool<T> {
  name: string;
  factory: () => T;
  reset: (obj: T) => void;
  initialSize: number;
  maxSize: number;
  active: Set<T>;
  inactive: T[];
}

export interface MemoryStats {
  totalUsage: number; // MB
  poolStats: Map<string, PoolStats>;
  disposedCount: number;
  gcHints: number;
}

export interface PoolStats {
  name: string;
  active: number;
  inactive: number;
  total: number;
  hits: number;
  misses: number;
}

export interface AssetManifest {
  critical: AssetDefinition[];
  nonCritical: AssetDefinition[];
}

export interface AssetDefinition {
  id: string;
  type: 'mesh' | 'texture' | 'material' | 'particle';
  path: string;
  quality: 'low' | 'medium' | 'high';
  priority: number;
  size: number; // bytes
}

export interface LoadingState {
  criticalLoaded: boolean;
  totalAssets: number;
  loadedAssets: number;
  failedAssets: string[];
  progress: number; // 0-100
}

export interface MetricsData {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  memory: number;
  memoryPercent: number;
  activeEffects: number;
  activeMeshes: number;
  drawCalls: number;
}

export interface PerformanceSettingsSaveData {
  version: number;
  deviceClassification: 'low' | 'medium' | 'high';
  qualityPreset: 'low' | 'medium' | 'high' | 'custom';
  customSettings: Partial<QualityPreset>;
  autoAdjust: boolean;
  reducedMotion: boolean;
  lastUpdated: number;
}

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  low: {
    name: 'low',
    liteMode: true,
    targetFPS: 30,
    meshQuality: 'low',
    textureQuality: 512,
    particles: 'off',
    shadows: false,
    glow: false,
    screenShake: true,
    floatingText: true
  },
  medium: {
    name: 'medium',
    liteMode: false,
    targetFPS: 60,
    meshQuality: 'medium',
    textureQuality: 1024,
    particles: 'reduced',
    shadows: false,
    glow: true,
    screenShake: true,
    floatingText: true
  },
  high: {
    name: 'high',
    liteMode: false,
    targetFPS: 60,
    meshQuality: 'high',
    textureQuality: 2048,
    particles: 'full',
    shadows: true,
    glow: true,
    screenShake: true,
    floatingText: true
  }
};
