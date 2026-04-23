/**
 * Device Performance Detection
 * 
 * Detects device capability to automatically enable performance mode on low-end devices
 */

export type DevicePerformance = 'high' | 'medium' | 'low';

/**
 * Detect device performance capability based on hardware specs
 */
export function detectDevicePerformance(): DevicePerformance {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;
  
  // Check device memory (if available)
  const memory = (navigator as any).deviceMemory || 4;
  
  // Check if mobile device
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // High-end: 8+ cores, 8+ GB RAM, desktop
  if (cores >= 8 && memory >= 8 && !isMobile) {
    return 'high';
  }
  
  // Medium: 4+ cores, 4+ GB RAM
  if (cores >= 4 && memory >= 4) {
    return 'medium';
  }
  
  // Low-end: everything else
  return 'low';
}

/**
 * Check if performance mode should be enabled automatically
 */
export function shouldEnablePerformanceMode(): boolean {
  return detectDevicePerformance() === 'low';
}
