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
 * Detect device hardware capabilities
 * Uses navigator.deviceMemory and navigator.hardwareConcurrency
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // Memory detection with fallback
  const memory = (navigator as any).deviceMemory || 4; // Default to 4GB if unavailable
  
  // CPU cores detection with fallback
  const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores if unavailable
  
  // DPI density
  const dpi = window.devicePixelRatio || 1.0;
  
  // Platform detection
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  // Tier classification
  let tier: DeviceTier;
  if (memory < 4 || cores <= 4) {
    tier = DeviceTier.LOW;
  } else if (memory >= 4 && memory < 6) {
    tier = DeviceTier.MID;
  } else {
    tier = DeviceTier.HIGH;
  }
  
  console.log('[DeviceCapability] Detected:', {
    tier,
    memory: `${memory}GB`,
    cores,
    dpi,
    isNative,
    isAndroid
  });
  
  return {
    tier,
    memory,
    cores,
    dpi,
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
