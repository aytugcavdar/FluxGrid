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
 * Low-end GPUs: Mali-4xx, Adreno 3xx, PowerVR SGX
 * Mid-range GPUs: Mali-Gxx, Adreno 4xx-5xx
 * High-end GPUs: Mali-Gxx (7xx+), Adreno 6xx+
 */
function classifyGPUTier(gpuRenderer: string | null): DeviceTier | null {
  if (!gpuRenderer) {
    return null;
  }
  
  const gpu = gpuRenderer.toLowerCase();
  
  // Low-end GPU patterns
  if (
    gpu.includes('mali-4') ||
    gpu.includes('adreno (tm) 3') ||
    gpu.includes('powervr sgx') ||
    gpu.includes('adreno 3')
  ) {
    return DeviceTier.LOW;
  }
  
  // High-end GPU patterns
  if (
    gpu.includes('adreno (tm) 6') ||
    gpu.includes('adreno 6') ||
    gpu.includes('adreno (tm) 7') ||
    gpu.includes('adreno 7') ||
    gpu.includes('mali-g7') ||
    gpu.includes('mali-g8') ||
    gpu.includes('mali-g9')
  ) {
    return DeviceTier.HIGH;
  }
  
  // Mid-range by default (Adreno 4xx-5xx, Mali-Gxx)
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
  
  // Tier classification based on GPU, memory, and cores
  let tier: DeviceTier;
  
  // Start with GPU-based classification if available
  const gpuTier = classifyGPUTier(gpuRenderer);
  
  // Combine GPU, memory, and cores for final tier
  if (gpuTier === DeviceTier.LOW || memory < 4 || cores <= 4) {
    tier = DeviceTier.LOW;
  } else if (gpuTier === DeviceTier.HIGH && memory >= 6 && cores > 4) {
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
 */
export function getPerformanceConfig(tier: DeviceTier): PerformanceConfig {
  switch (tier) {
    case DeviceTier.LOW:
      return {
        fragmentPoolSize: 15,
        hardwareScaling: 2.0, // Lower resolution for better performance
        enableGlow: false,
        enableParticles: false,
        antialias: false,
        maxTextureSize: 1024
      };
    
    case DeviceTier.MID:
      return {
        fragmentPoolSize: 25,
        hardwareScaling: 1.2, // Balanced quality/performance
        enableGlow: true,
        enableParticles: true,
        antialias: false,
        maxTextureSize: 2048
      };
    
    case DeviceTier.HIGH:
      return {
        fragmentPoolSize: 50,
        hardwareScaling: 1.0, // Full resolution
        enableGlow: true,
        enableParticles: true,
        antialias: true,
        maxTextureSize: 4096
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
