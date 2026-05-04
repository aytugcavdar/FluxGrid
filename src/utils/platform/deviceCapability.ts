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
  refreshRate: number; // Hz (60, 90, 120, 144)
  gpuRenderer: string | null;
  isNative: boolean;
  isAndroid: boolean;
  score?: number; // Total score (1-30)
  scoreBreakdown?: string; // Score breakdown for debugging
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
 * Get screen refresh rate (if available)
 * Returns 60 as default if not detectable
 */
function getScreenRefreshRate(): number {
  try {
    // Try to get from screen API (not widely supported yet)
    if ('screen' in window && 'refreshRate' in (window.screen as any)) {
      const rate = (window.screen as any).refreshRate;
      if (rate && rate > 0) {
        return rate;
      }
    }
    
    // Fallback: Default to 60Hz
    return 60;
  } catch (error) {
    return 60;
  }
}

/**
 * Classify GPU tier with 5 levels (0-5 points)
 * More granular classification for better scoring
 */
function classifyGPUTier(gpuRenderer: string | null): { tier: DeviceTier | null; score: number } {
  if (!gpuRenderer) {
    return { tier: null, score: 0 };
  }
  
  const gpu = gpuRenderer.toLowerCase();
  
  // ═══════════════════════════════════════════════════════════
  // 🟢 HIGH-END GPUs (+5 points) - 2021+ flagship
  // ═══════════════════════════════════════════════════════════
  
  // Adreno 8xx series (Snapdragon 8 Gen 4/Elite - 2024+)
  if (gpu.match(/adreno.*8[0-9]\d/) || gpu.includes('adreno (tm) 8')) {
    return { tier: DeviceTier.HIGH, score: 5 };
  }
  
  // Adreno 7xx series (Snapdragon 8 Gen 1/2/3)
  if (gpu.match(/adreno.*7[3-9]\d/) || gpu.includes('adreno (tm) 7')) {
    return { tier: DeviceTier.HIGH, score: 5 };
  }
  
  // Mali-G78+ (flagship)
  if (gpu.match(/mali-g(78|710|715|720)/)) {
    return { tier: DeviceTier.HIGH, score: 5 };
  }
  
  // Immortalis (ARM flagship)
  if (gpu.includes('immortalis')) {
    return { tier: DeviceTier.HIGH, score: 5 };
  }
  
  // Apple GPU (A14+, M1+)
  if (gpu.includes('apple') && (gpu.includes('gpu') || gpu.includes('a1') || gpu.includes('m1') || gpu.includes('m2'))) {
    return { tier: DeviceTier.HIGH, score: 5 };
  }
  
  // Desktop GPUs
  if (gpu.includes('nvidia') || gpu.includes('geforce') || gpu.includes('amd') || gpu.includes('radeon')) {
    return { tier: DeviceTier.HIGH, score: 5 };
  }
  
  // ═══════════════════════════════════════════════════════════
  // � MID-HIGH GPUs (+4 points) - Upper mid-range
  // ═══════════════════════════════════════════════════════════
  
  // Adreno 6xx upper (650-690)
  if (gpu.match(/adreno.*(6[5-9]\d)/) || gpu.match(/adreno \(tm\) 6[5-9]/)) {
    return { tier: DeviceTier.MID, score: 4 };
  }
  
  // Mali-G68, G76 (older flagship)
  if (gpu.match(/mali-g(68|76)/)) {
    return { tier: DeviceTier.MID, score: 4 };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🟡 MID GPUs (+3 points) - Mid-range
  // ═══════════════════════════════════════════════════════════
  
  // Adreno 6xx lower (610-640)
  if (gpu.match(/adreno.*(6[0-4]\d)/) || gpu.match(/adreno \(tm\) 6[0-4]/)) {
    return { tier: DeviceTier.MID, score: 3 };
  }
  
  // Mali-G57, G72
  if (gpu.match(/mali-g(57|72)/)) {
    return { tier: DeviceTier.MID, score: 3 };
  }
  
  // Intel Iris
  if (gpu.includes('intel') && gpu.includes('iris')) {
    return { tier: DeviceTier.MID, score: 3 };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🔴 LOW-MID GPUs (+2 points) - Entry mid-range
  // ═══════════════════════════════════════════════════════════
  
  // Adreno 5xx upper (530-610)
  if (gpu.match(/adreno.*(5[3-9]\d|610)/) || gpu.match(/adreno \(tm\) 5[3-9]/)) {
    return { tier: DeviceTier.LOW, score: 2 };
  }
  
  // Mali-G52, G51 (Honor 9X, Redmi Note 9)
  if (gpu.match(/mali-g5[12]/)) {
    return { tier: DeviceTier.LOW, score: 2 };
  }
  
  // Mali-G71
  if (gpu.includes('mali-g71')) {
    return { tier: DeviceTier.LOW, score: 2 };
  }
  
  // PowerVR Rogue
  if (gpu.includes('powervr rogue')) {
    return { tier: DeviceTier.LOW, score: 2 };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🔴 LOW GPUs (+1 point) - Old/weak
  // ═══════════════════════════════════════════════════════════
  
  // Adreno 5xx lower (500-520)
  if (gpu.match(/adreno.*(5[0-2]\d)/) || gpu.match(/adreno \(tm\) 5[0-2]/)) {
    return { tier: DeviceTier.LOW, score: 1 };
  }
  
  // Adreno 4xx
  if (gpu.match(/adreno.*4\d{2}/) || gpu.includes('adreno (tm) 4')) {
    return { tier: DeviceTier.LOW, score: 1 };
  }
  
  // Adreno 3xx
  if (gpu.match(/adreno.*3\d{2}/) || gpu.includes('adreno (tm) 3')) {
    return { tier: DeviceTier.LOW, score: 1 };
  }
  
  // Mali-4xx, Mali-G31
  if (gpu.match(/mali-4\d{2}/) || gpu.includes('mali-g31')) {
    return { tier: DeviceTier.LOW, score: 1 };
  }
  
  // PowerVR SGX
  if (gpu.includes('powervr sgx')) {
    return { tier: DeviceTier.LOW, score: 1 };
  }
  
  // VideoCore
  if (gpu.includes('videocore')) {
    return { tier: DeviceTier.LOW, score: 1 };
  }
  
  // Intel HD (old)
  if (gpu.match(/intel.*hd.*[2-5]\d{3}/)) {
    return { tier: DeviceTier.LOW, score: 1 };
  }
  
  // Default: Unknown GPU → MID (safe)
  return { tier: DeviceTier.MID, score: 3 };
}

/**
 * Advanced scoring system (1-30 points)
 * Focused on core performance: GPU, RAM, CPU only
 * Screen refresh rate and DPI removed as they don't affect game performance significantly
 */
function calculateDeviceScore(
  gpuScore: number,
  memory: number,
  cores: number
): { score: number; breakdown: string } {
  let totalScore = 0;
  const breakdown: string[] = [];
  
  // 1. GPU Score (0-15 points) - MOST IMPORTANT (50% weight)
  // Triple the GPU score importance
  const finalGpuScore = gpuScore * 3;
  totalScore += finalGpuScore;
  breakdown.push(`GPU:+${finalGpuScore}`);
  
  // 2. RAM Score (0-10 points) - SECOND MOST IMPORTANT (33% weight)
  let ramScore = 0;
  if (memory >= 16) {
    ramScore = 10; // Extreme flagship
  } else if (memory >= 12) {
    ramScore = 8; // Flagship
  } else if (memory >= 8) {
    ramScore = 6; // Premium
  } else if (memory >= 6) {
    ramScore = 4; // Mid
  } else if (memory >= 4) {
    ramScore = 2; // Low
  } else {
    ramScore = 0; // Very low
  }
  totalScore += ramScore;
  breakdown.push(`RAM:+${ramScore}`);
  
  // 3. CPU Cores Score (0-5 points) - THIRD (17% weight)
  let coresScore = 0;
  if (cores >= 10) {
    coresScore = 5; // Flagship (Snapdragon 8 Gen 3, 8 Elite - 10 cores)
  } else if (cores >= 8) {
    coresScore = 4; // Modern (8 cores)
  } else if (cores >= 6) {
    coresScore = 2; // Mid (6 cores)
  } else if (cores >= 4) {
    coresScore = 1; // Old (4 cores)
  } else {
    coresScore = 0; // Very old (2 cores)
  }
  totalScore += coresScore;
  breakdown.push(`CPU:+${coresScore}`);
  
  return {
    score: totalScore,
    breakdown: breakdown.join(', ')
  };
}

/**
 * Determine tier from score with hard limits
 * Updated for 30-point scale
 */
function determineTierFromScore(
  score: number,
  gpuScore: number,
  memory: number
): DeviceTier {
  // 🚨 HARD LIMIT 1: RAM ≤3GB → Automatic LOW
  if (memory <= 3) {
    console.warn('[DeviceCapability] 🚨 Hard limit: RAM ≤3GB → LOW tier');
    return DeviceTier.LOW;
  }
  
  // 🚨 HARD LIMIT 2: GPU LOW (1 point) + RAM ≤6GB → Automatic LOW
  if (gpuScore === 1 && memory <= 6) {
    console.warn('[DeviceCapability] 🚨 Hard limit: GPU LOW + RAM ≤6GB → LOW tier');
    return DeviceTier.LOW;
  }
  
  // 🚨 HARD LIMIT 3: GPU LOW-MID (2 points) + RAM ≤6GB → Automatic LOW
  // This catches Honor 9X (Mali-G52, 6GB)
  if (gpuScore === 2 && memory <= 6) {
    console.warn('[DeviceCapability] 🚨 Hard limit: GPU LOW-MID + RAM ≤6GB → LOW tier (Honor 9X)');
    return DeviceTier.LOW;
  }
  
  // 🚨 HARD LIMIT 4: GPU LOW/LOW-MID (1-2 points) + RAM 4GB → Automatic LOW
  if (gpuScore <= 2 && memory === 4) {
    console.warn('[DeviceCapability] 🚨 Hard limit: GPU LOW + RAM 4GB → LOW tier');
    return DeviceTier.LOW;
  }
  
  // 🚨 HARD LIMIT 5: GPU MID (3 points) + RAM ≤8GB → Force MID (Oppo A60)
  // Prevents mid-range devices from being classified as HIGH
  if (gpuScore === 3 && memory <= 8) {
    console.warn('[DeviceCapability] 🚨 Hard limit: GPU MID + RAM ≤8GB → MID tier (Oppo A60)');
    return DeviceTier.MID;
  }
  
  // Score-based tier determination (updated for 30-point scale)
  if (score >= 22) {
    return DeviceTier.HIGH; // 22-30 points (top ~27%)
  } else if (score >= 14) {
    return DeviceTier.MID; // 14-21 points (middle ~47%)
  } else {
    return DeviceTier.LOW; // 1-13 points (bottom ~26%)
  }
}

/**
 * Get total device RAM from native Android bridge
 * Returns actual RAM value, not browser-limited value
 */
async function getNativeRAM(): Promise<number | null> {
  try {
    console.log('[DeviceCapability] Checking for native bridge...');
    console.log('[DeviceCapability] window.FluxGridNative:', typeof (window as any).FluxGridNative);
    
    // Check if native bridge is available (Android only)
    if (typeof (window as any).FluxGridNative !== 'undefined') {
      console.log('[DeviceCapability] Native bridge found! Calling getTotalRAM()...');
      const ramGB = (window as any).FluxGridNative.getTotalRAM();
      console.log('[DeviceCapability] Native RAM response:', ramGB);
      
      if (ramGB && ramGB > 0) {
        console.log('[DeviceCapability] ✅ Native RAM detected:', ramGB, 'GB');
        return ramGB;
      } else {
        console.warn('[DeviceCapability] Native bridge returned invalid value:', ramGB);
      }
    } else {
      console.log('[DeviceCapability] Native bridge not available (web or iOS)');
    }
  } catch (error) {
    console.error('[DeviceCapability] Failed to get native RAM:', error);
  }
  return null;
}

/**
 * Detect device hardware capabilities
 * Uses advanced scoring system (1-30 points)
 */
export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  // Try to get real memory from native bridge first (Android only)
  let memory = 4; // Default fallback
  
  // 1. Try native Android bridge (most accurate)
  const nativeRAM = await getNativeRAM();
  if (nativeRAM !== null) {
    memory = nativeRAM;
    console.log('[DeviceCapability] ✅ Using native RAM:', memory, 'GB');
  } else {
    // 2. Fallback to navigator.deviceMemory (browser API, limited to 8GB)
    const webMemory = (navigator as any).deviceMemory;
    if (webMemory && webMemory > 0) {
      memory = webMemory;
      console.log('[DeviceCapability] ⚠️ Using web API RAM (may be capped at 8GB):', memory, 'GB');
    }
  }
  
  // GPU renderer detection
  const gpuRenderer = getGPURenderer();
  
  // GPU classification with score
  const gpuResult = classifyGPUTier(gpuRenderer);
  const gpuScore = gpuResult.score;
  
  // 🔥 SMART RAM ESTIMATION: If web API reports 8GB but GPU suggests flagship
  // Only apply if we didn't get native RAM value
  if (nativeRAM === null && memory === 8 && gpuScore >= 4) {
    // High-end GPU (score 4-5) usually paired with 12GB+ RAM in flagship devices
    memory = 12; // Estimate 12GB for flagship devices
    console.log('[DeviceCapability] 🎯 Smart RAM estimation: 8GB → 12GB (flagship GPU detected)');
  }
  
  // CPU cores detection with fallback
  const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores if unavailable
  
  // DPI density
  const dpi = window.devicePixelRatio || 1.0;
  
  // Screen refresh rate
  const refreshRate = getScreenRefreshRate();
  
  // Platform detection
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  // Calculate total device score (1-30 points)
  const scoreResult = calculateDeviceScore(gpuScore, memory, cores);
  
  // Determine tier with hard limits
  const tier = determineTierFromScore(scoreResult.score, gpuScore, memory);
  
  console.log('[DeviceCapability] 🎯 Device Analysis:', {
    tier,
    score: `${scoreResult.score}/30`,
    breakdown: scoreResult.breakdown,
    memory: `${memory}GB`,
    cores,
    dpi,
    refreshRate: `${refreshRate}Hz`,
    gpuRenderer,
    isNative,
    isAndroid
  });
  
  return {
    tier,
    memory,
    cores,
    dpi,
    refreshRate,
    gpuRenderer,
    isNative,
    isAndroid,
    score: scoreResult.score,
    scoreBreakdown: scoreResult.breakdown
  };
}

/**
 * Get performance configuration based on device tier and score
 * All tiers use full resolution (hardwareScaling: 1.0)
 * Only effects and features differ
 * MID tier is split into three sub-tiers: MID-LOW (14-16), MID (17-19), MID-HIGH (20-21)
 */
export function getPerformanceConfig(tier: DeviceTier, score?: number): PerformanceConfig {
  switch (tier) {
    case DeviceTier.LOW:
      return {
        fragmentPoolSize: 3,
        hardwareScaling: 1.0, // Full resolution - NO DOWNSCALING!
        enableGlow: false,
        enableParticles: false,
        antialias: false,
        maxTextureSize: 512
      };
    
    case DeviceTier.MID:
      // Split MID into three sub-tiers based on score (30-point scale)
      if (score && score >= 20) {
        // MID-HIGH: Best MID performance (20-21 points)
        return {
          fragmentPoolSize: 15,
          hardwareScaling: 1.0,
          enableGlow: false,
          enableParticles: true,
          antialias: false,
          maxTextureSize: 1536
        };
      } else if (score && score >= 17) {
        // MID: Standard MID performance (17-19 points)
        return {
          fragmentPoolSize: 12,
          hardwareScaling: 1.0,
          enableGlow: false,
          enableParticles: true,
          antialias: false,
          maxTextureSize: 1280
        };
      } else {
        // MID-LOW: Conservative MID settings (14-16 points)
        return {
          fragmentPoolSize: 8,
          hardwareScaling: 1.0,
          enableGlow: false,
          enableParticles: true,
          antialias: false,
          maxTextureSize: 1024
        };
      }
    
    case DeviceTier.HIGH:
      // Premium visuals for flagship devices
      return {
        fragmentPoolSize: 20,
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
