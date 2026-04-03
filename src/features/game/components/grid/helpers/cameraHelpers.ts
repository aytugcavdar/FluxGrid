/**
 * Camera Helpers
 * Camera shake and positioning utilities
 */

import * as BABYLON from 'babylonjs';

/**
 * Update camera shake in render loop
 */
export function updateCameraShake(
  camera: BABYLON.ArcRotateCamera,
  shakeIntensityRef: { current: number },
  deltaTime: number,
  prefersReducedMotion: boolean
): void {
  if (prefersReducedMotion) {
    // Ensure camera is at default position
    const isPortrait = window.innerHeight > window.innerWidth;
    camera.target.y = isPortrait ? -0.1 : -0.2;
    return;
  }
  
  if (shakeIntensityRef.current > 0) {
    const intensity = shakeIntensityRef.current;
    
    // Shake pattern: up → down → return (200ms cycle)
    const shakeTime = Date.now() % 200;
    let offset = 0;
    
    if (shakeTime < 50) {
      // Up phase (0-50ms)
      offset = (shakeTime / 50) * 0.1 * intensity;
    } else if (shakeTime < 100) {
      // Down phase (50-100ms)
      offset = 0.1 * intensity - ((shakeTime - 50) / 50) * 0.15 * intensity;
    } else {
      // Return phase (100-200ms)
      offset = -0.05 * intensity * (1 - (shakeTime - 100) / 100);
    }
    
    // Apply to camera target Y
    const isPortrait = window.innerHeight > window.innerWidth;
    const baseTargetY = isPortrait ? -0.1 : -0.2;
    camera.target.y = baseTargetY + offset;
    
    // Decay shake intensity (2 units/sec)
    shakeIntensityRef.current = Math.max(0, intensity - deltaTime * 2);
  } else {
    // Ensure camera is at default position
    const isPortrait = window.innerHeight > window.innerWidth;
    camera.target.y = isPortrait ? -0.1 : -0.2;
  }
}

/**
 * Trigger camera shake based on line count
 */
export function triggerCameraShake(
  lineCount: number,
  shakeIntensityRef: { current: number },
  prefersReducedMotion: boolean
): void {
  if (prefersReducedMotion) return;
  
  if (lineCount === 1) {
    shakeIntensityRef.current = 0.3;
  } else if (lineCount === 2) {
    shakeIntensityRef.current = 0.6;
  } else {
    shakeIntensityRef.current = 1.0;
  }
}

/**
 * Update camera settings based on screen size and orientation
 */
export function updateCameraSettings(
  camera: BABYLON.ArcRotateCamera,
  isNativeApp: boolean
): void {
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const isPortrait = screenH > screenW;
  const aspectRatio = screenW / screenH;

  if (isPortrait) {
    // Mobile portrait
    let fov: number;
    let radius: number;

    if (aspectRatio < 0.48) {
      fov = 1.05; radius = 12.0; // Very long screens
    } else if (aspectRatio < 0.55) {
      fov = 0.95; radius = 12.0; // Standard phone
    } else if (aspectRatio < 0.65) {
      fov = 0.88; radius = 12.5; // Wide phone
    } else {
      fov = 0.82; radius = 13.0; // Small tablet
    }
    
    // Native apps: make grid appear larger by moving camera closer
    if (isNativeApp) {
      radius = radius - 1.0;
    }

    camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
    camera.fov = fov;
    camera.radius = radius;
    
    // Adjust camera target for small screens
    const targetY = screenW < 390 ? -0.05 : -0.1;
    camera.target = new BABYLON.Vector3(0, targetY, 0);

  } else {
    // Desktop / landscape
    let fov: number;
    let radius: number;

    if (aspectRatio > 2.0) {
      fov = 0.58; radius = 17.0; // Ultra-wide
    } else if (aspectRatio > 1.5) {
      fov = 0.65; radius = 17.5; // 16:9 standard
    } else {
      fov = 0.70; radius = 18.0; // Laptop / square-ish
    }

    camera.fovMode = BABYLON.Camera.FOVMODE_VERTICAL_FIXED;
    camera.fov = fov;
    camera.radius = radius;
    camera.target = new BABYLON.Vector3(0, -0.2, 0);
  }
}
