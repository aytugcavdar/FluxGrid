import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export enum DeviceTier {
  LOW = 'low',
  LOW_MID = 'low-mid',
  MID_LOW = 'mid-low',
  MID = 'mid',
  MID_HIGH = 'mid-high',
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
  score?: number; // Total score (0-100)
  scoreBreakdown?: string; // Score breakdown for debugging
  isVIP?: boolean; // VIP flagship device
  deviceModel?: string; // Device model name
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
 * VIP Device List - Flagship models that are automatically HIGH tier
 * These devices are recognized by model name/number regardless of specs
 */
const VIP_FLAGSHIP_MODELS = [
  // Samsung Galaxy S Series (2023-2025)
  'SM-S911', 'SM-S916', 'SM-S918', // S23, S23+, S23 Ultra
  'SM-S921', 'SM-S926', 'SM-S928', // S24, S24+, S24 Ultra
  'SM-S931', 'SM-S936', 'SM-S938', // S25, S25+, S25 Ultra
  
  // Samsung Galaxy Z Fold/Flip (2023-2025)
  'SM-F946', 'SM-F731', // Z Fold 5, Z Flip 5
  'SM-F956', 'SM-F741', // Z Fold 6, Z Flip 6
  
  // Samsung Galaxy Tab S9/S10 Series
  'SM-X910', 'SM-X916', // Tab S9, S9+
  'SM-X110', 'SM-X116', // Tab S10, S10+
  
  // Xiaomi Flagship (2023-2025)
  '23127PN0C', '2312DRA50C', // Xiaomi 14, 14 Pro
  '24031PN0DC', '2405CPX3DG', // Xiaomi 14 Ultra, 15
  '2407FPN8EG', // Xiaomi 15 Pro
  
  // POCO Flagship
  '23124PC75G', '23113RKC6G', // POCO F6, F6 Pro
  '24069PC21G', // POCO X7 Pro
  
  // OnePlus Flagship (2023-2025)
  'CPH2581', 'CPH2609', // OnePlus 12, 12R
  'CPH2617', 'CPH2619', // OnePlus 13, 13 Pro
  
  // Google Pixel (2023-2025)
  'Pixel 8', 'Pixel 8 Pro', 'Pixel 8a',
  'Pixel 9', 'Pixel 9 Pro', 'Pixel 9 Pro XL',
  
  // iPhone (2023-2025)
  'iPhone15', 'iPhone16', 'iPhone17', // All variants
  
  // Oppo Find X Series
  'CPH2525', 'CPH2581', // Find X7, X7 Pro
  'CPH2609', // Find X8
  
  // Vivo X Series
  'V2309A', 'V2324A', // X100, X100 Pro
  'V2352A', // X200
  
  // Realme GT Series
  'RMX3700', 'RMX3708', // GT 5, GT 5 Pro
  'RMX3800', // GT 6
  
  // ASUS ROG Phone
  'ASUS_AI2401', 'ASUS_AI2501', // ROG Phone 8, 9
  
  // Nothing Phone
  'A065', 'A142', // Nothing Phone (2), (2a)
];

/**
 * Check if device model is in VIP flagship list
 * Returns true if device should be automatically classified as HIGH tier
 */
async function isVIPFlagship(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return false; // Web doesn't have device model info
    }
    
    const deviceInfo = await Device.getInfo();
    const model = deviceInfo.model || '';
    
    console.log('[DeviceCapability] Device model:', model);
    
    // Check if model matches any VIP pattern
    const isVIP = VIP_FLAGSHIP_MODELS.some(vipModel => 
      model.includes(vipModel) || model.startsWith(vipModel)
    );
    
    if (isVIP) {
      console.log('[DeviceCapability] 🌟 VIP FLAGSHIP DETECTED:', model, '→ AUTO HIGH TIER');
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('[DeviceCapability] VIP check failed:', error);
    return false;
  }
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
 * Specs-based scoring system (0-100 points)
 * Used as fallback or combined with benchmark results
 * GPU: 0-50, RAM: 0-30, CPU: 0-20
 */
function calculateSpecsScore(
  gpuScore: number,
  memory: number,
  cores: number
): { score: number; breakdown: string } {
  let totalScore = 0;
  const breakdown: string[] = [];
  
  // 1. GPU Score (0-50 points) - MOST IMPORTANT (50% weight)
  // Map GPU tier (0-5) to 0-50 scale
  const finalGpuScore = gpuScore * 10; // 0→0, 1→10, 2→20, 3→30, 4→40, 5→50
  totalScore += finalGpuScore;
  breakdown.push(`GPU:${finalGpuScore}`);
  
  // 2. RAM Score (0-30 points) - SECOND MOST IMPORTANT (30% weight)
  let ramScore = 0;
  if (memory >= 16) {
    ramScore = 30; // Extreme flagship
  } else if (memory >= 12) {
    ramScore = 25; // Flagship
  } else if (memory >= 8) {
    ramScore = 20; // Premium
  } else if (memory >= 6) {
    ramScore = 15; // Mid
  } else if (memory >= 4) {
    ramScore = 10; // Low
  } else if (memory >= 3) {
    ramScore = 5; // Very low
  } else {
    ramScore = 0; // Extremely low
  }
  totalScore += ramScore;
  breakdown.push(`RAM:${ramScore}`);
  
  // 3. CPU Cores Score (0-20 points) - THIRD (20% weight)
  let coresScore = 0;
  if (cores >= 10) {
    coresScore = 20; // Flagship (Snapdragon 8 Gen 3, 8 Elite - 10 cores)
  } else if (cores >= 8) {
    coresScore = 15; // Modern (8 cores)
  } else if (cores >= 6) {
    coresScore = 10; // Mid (6 cores)
  } else if (cores >= 4) {
    coresScore = 5; // Old (4 cores)
  } else {
    coresScore = 0; // Very old (2 cores)
  }
  totalScore += coresScore;
  breakdown.push(`CPU:${coresScore}`);
  
  return {
    score: totalScore,
    breakdown: breakdown.join(', ')
  };
}

/**
 * Determine tier from score (0-100 scale)
 * 6-tier system: LOW, LOW_MID, MID_LOW, MID, MID_HIGH, HIGH
 */
function determineTierFromScore(score: number): DeviceTier {
  if (score >= 81) {
    return DeviceTier.HIGH; // 81-100: Flagship devices
  } else if (score >= 71) {
    return DeviceTier.MID_HIGH; // 71-80: Upper mid-range
  } else if (score >= 61) {
    return DeviceTier.MID; // 61-70: Mid-range
  } else if (score >= 46) {
    return DeviceTier.MID_LOW; // 46-60: Lower mid-range
  } else if (score >= 31) {
    return DeviceTier.LOW_MID; // 31-45: Entry mid-range
  } else {
    return DeviceTier.LOW; // 0-30: Low-end devices
  }
}

/**
 * Get total device RAM from native sources
 * Priority: 1) Android Native Bridge, 2) Capacitor Device API, 3) Web API
 */
async function getNativeRAM(): Promise<number | null> {
  try {
    console.log('[DeviceCapability] Checking for native RAM sources...');
    
    // Method 1: Android Native Bridge (most accurate for total RAM)
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
      console.log('[DeviceCapability] Native bridge not available');
    }
    
    // Method 2: Capacitor Device API (available memory, not total)
    if (Capacitor.isNativePlatform()) {
      try {
        const deviceInfo = await Device.getInfo();
        console.log('[DeviceCapability] Capacitor Device info:', deviceInfo);
        
        // Note: Device.getInfo() doesn't provide total RAM directly
        // It only provides memUsed (used memory) which is not useful for our purpose
        // But we log it for debugging
      } catch (error) {
        console.warn('[DeviceCapability] Capacitor Device.getInfo() failed:', error);
      }
    }
    
  } catch (error) {
    console.error('[DeviceCapability] Failed to get native RAM:', error);
  }
  return null;
}

/**
 * Detect device hardware capabilities
 * Uses specs-based scoring only (GPU, RAM, CPU)
 * Priority: VIP List → Specs
 */

// Module-level cache — detectDeviceCapabilities is called multiple times (Grid mount,
// remount after Play Again, etc.). Cache ensures subsequent calls resolve instantly
// instead of re-running native Capacitor APIs each time.
let _deviceCapabilitiesCache: Promise<DeviceCapabilities> | null = null;

export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  if (_deviceCapabilitiesCache) {
    return _deviceCapabilitiesCache;
  }
  _deviceCapabilitiesCache = _detectDeviceCapabilitiesImpl();
  return _deviceCapabilitiesCache;
}

async function _detectDeviceCapabilitiesImpl(): Promise<DeviceCapabilities> {

  // 🌟 STEP 1: VIP FLAGSHIP CHECK (Highest Priority)
  const isVIP = await isVIPFlagship();
  
  // Get device model for display
  let deviceModel = 'Unknown';
  try {
    if (Capacitor.isNativePlatform()) {
      const deviceInfo = await Device.getInfo();
      deviceModel = deviceInfo.model || 'Unknown';
    }
  } catch (error) {
    console.warn('[DeviceCapability] Failed to get device model:', error);
  }
  
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
  
  // Calculate specs-based score (0-100 scale)
  const specsResult = calculateSpecsScore(gpuScore, memory, cores);
  const finalScore = specsResult.score;
  const scoreBreakdown = specsResult.breakdown;
  
  // 🌟 STEP 2: Determine tier (VIP overrides everything)
  let tier: DeviceTier;
  
  if (isVIP) {
    // VIP flagship → Always HIGH tier with 100 points
    tier = DeviceTier.HIGH;
    console.log('[DeviceCapability] 🌟 VIP OVERRIDE: Tier set to HIGH, Score = 100');
  } else {
    // Normal tier determination from score
    tier = determineTierFromScore(finalScore);
  }
  
  console.log('[DeviceCapability] 🎯 Device Analysis:', {
    isVIP,
    deviceModel,
    tier,
    score: `${finalScore}/100`,
    breakdown: scoreBreakdown,
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
    score: isVIP ? 100 : finalScore,
    scoreBreakdown: isVIP ? 'VIP Flagship (Auto HIGH)' : scoreBreakdown,
    isVIP,
    deviceModel
  };
}

/**
 * Get performance configuration based on device tier
 * All tiers use full resolution (hardwareScaling: 1.0)
 * 6-tier system with progressive feature enablement
 */
export function getPerformanceConfig(tier: DeviceTier): PerformanceConfig {
  switch (tier) {
    case DeviceTier.LOW:
      // 0-30 points: Minimal features, no particles
      return {
        fragmentPoolSize: 3,
        hardwareScaling: 1.0,
        enableGlow: false,
        enableParticles: false,
        antialias: false,
        maxTextureSize: 512
      };
    
    case DeviceTier.LOW_MID:
      // 31-45 points: Entry mid-range, basic particles
      return {
        fragmentPoolSize: 6,
        hardwareScaling: 1.0,
        enableGlow: false,
        enableParticles: true,
        antialias: false,
        maxTextureSize: 768
      };
    
    case DeviceTier.MID_LOW:
      // 46-60 points: Lower mid-range, more particles
      return {
        fragmentPoolSize: 10,
        hardwareScaling: 1.0,
        enableGlow: false,
        enableParticles: true,
        antialias: false,
        maxTextureSize: 1024
      };
    
    case DeviceTier.MID:
      // 61-70 points: Standard mid-range
      return {
        fragmentPoolSize: 14,
        hardwareScaling: 1.0,
        enableGlow: false,
        enableParticles: true,
        antialias: false,
        maxTextureSize: 1280
      };
    
    case DeviceTier.MID_HIGH:
      // 71-80 points: Upper mid-range, enable antialias
      return {
        fragmentPoolSize: 18,
        hardwareScaling: 1.0,
        enableGlow: false,
        enableParticles: true,
        antialias: true,
        maxTextureSize: 1536
      };
    
    case DeviceTier.HIGH:
      // 81-100 points: Flagship, all features enabled
      return {
        fragmentPoolSize: 22,
        hardwareScaling: 1.0,
        enableGlow: true,
        enableParticles: true,
        antialias: true,
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
