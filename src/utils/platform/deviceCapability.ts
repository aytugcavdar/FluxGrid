import { Capacitor } from '@capacitor/core';

export enum DeviceTier {
  LOW = 'low',
  MID = 'mid',
  HIGH = 'high'
}

export interface DeviceCapabilities {
  tier: DeviceTier;
  memory: number; // GB
  cores: number;
  dpi: number;
  gpuRenderer: string | null;
  isNative: boolean;
  isAndroid: boolean;
}

export interface PerformanceConfig {
  fragmentPoolSize: number;
  hardwareScaling: number;
  enableGlow: boolean;
  enableParticles: boolean;
  antialias: boolean;
  maxTextureSize: number;
}

/**
 * Get GPU renderer information from WebGL context
 * Returns null if WebGL is not available or GPU info cannot be detected
 */
function getGPURenderer(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return null;
    }
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return null;
    }
    
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return renderer || null;
  } catch (error) {
    console.warn('[DeviceCapability] GPU detection failed:', error);
    return null;
  }
}

/**
 * Classify device tier based on GPU renderer string
 * Conservative approach: Most devices are MID tier for stability
 * 
 * LOW: Very old/weak GPUs (Mali-4xx, Adreno 3xx, PowerVR SGX)
 * MID: Most modern devices (Mali-G5x, G6x, G7x, Adreno 5xx-6xx) - DEFAULT
 * HIGH: Only flagship GPUs (Adreno 7xx+, Mali-G7x+, Apple A14+)
 */
function classifyGPUTier(gpuRenderer: string | null): DeviceTier | null {
  if (!gpuRenderer) {
    return null;
  }
  
  const gpu = gpuRenderer.toLowerCase();
  
  // LOW-END: Only very old/weak GPUs
  if (
    gpu.includes('mali-4') ||
    gpu.includes('mali-g31') ||
    gpu.includes('adreno (tm) 3') ||
    gpu.includes('adreno 3') ||
    gpu.includes('powervr sgx') ||
    gpu.includes('videocore')
  ) {
    return DeviceTier.LOW;
  }
  
  // HIGH-END: Only flagship GPUs
  if (
    gpu.includes('adreno (tm) 7') ||
    gpu.includes('adreno 7') ||
    gpu.includes('mali-g78') ||
    gpu.includes('mali-g710') ||
    gpu.includes('mali-g715') ||
    gpu.includes('apple gpu')
  ) {
    return DeviceTier.HIGH;
  }
  
  // MID-RANGE: Everything else (default for stability)
  return DeviceTier.MID;
}

/**
 * Detect device hardware capabilities
 * Uses GPU renderer, navigator.deviceMemory and navigator.hardwareConcurrency
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // Memory detection with fallback
  const memory = (navigator as any).deviceMemory || 4; // Default to 4GB if unavailable
  
  // CPU cores detection with fallback
  const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores if unavailable
  
  // DPI density
  const dpi = window.devicePixelRatio || 1.0;
  
  // GPU renderer detection
  const gpuRenderer = getGPURenderer();
  
  // Platform detection
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  // Simple RAM-based tier classification for stability
  // LOW: 6GB and below (Honor 9X and similar)
  // MID: 7GB RAM (rare, but exists)
  // HIGH: 8GB+ RAM
  let tier: DeviceTier;
  
  if (memory <= 6) {
    tier = DeviceTier.LOW;
  } else if (memory >= 8) {
    tier = DeviceTier.HIGH;
  } else {
    tier = DeviceTier.MID;
  }
  
  console.log('[DeviceCapability] Detected:', {
    tier,
    memory: `${memory}GB`,
    cores,
    dpi,
    gpuRenderer,
    isNative,
    isAndroid
  });
  
  return {
    tier,
    memory,
    cores,
    dpi,
    gpuRenderer,
    isNative,
    isAndroid
  };
}

/**
 * Get performance configuration based on device tier
 * All tiers use full resolution (hardwareScaling: 1.0)
 * Only effects and features differ
 */
export function getPerformanceConfig(tier: DeviceTier): PerformanceConfig {
  switch (tier) {
    case DeviceTier.LOW:
      return {
        fragmentPoolSize: 3,
        hardwareScaling: 1.0, // Full resolution
        enableGlow: false,
        enableParticles: false,
        antialias: false,
        maxTextureSize: 512
      };
    
    case DeviceTier.MID:
      // Balanced settings - better visuals than LOW
      return {
        fragmentPoolSize: 10, // Increased from 8
        hardwareScaling: 1.0, // Full resolution
        enableGlow: false, // Still disabled for stability
        enableParticles: true,
        antialias: false, // Disabled for performance
        maxTextureSize: 1024
      };
    
    case DeviceTier.HIGH:
      // Premium visuals for flagship devices
      return {
        fragmentPoolSize: 20, // Increased from 15
        hardwareScaling: 1.0, // Full resolution
        enableGlow: true, // ENABLED for premium look
        enableParticles: true,
        antialias: true, // ENABLED for smooth edges
        maxTextureSize: 2048
      };
  }
}

/**
 * Helper to classify device tier from memory and cores
 * Used for property-based testing
 */
export function detectDeviceTier(memory: number, cores: number): DeviceTier {
  if (memory < 4 || cores <= 4) {
    return DeviceTier.LOW;
  } else if (memory >= 4 && memory < 6) {
    return DeviceTier.MID;
  } else {
    return DeviceTier.HIGH;
  }
}
