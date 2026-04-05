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
  // Camera shake completely disabled
  shakeIntensityRef.current = 0;
  
  // Ensure camera is at default position
  const isPortrait = window.innerHeight > window.innerWidth;
  camera.target.y = isPortrait ? -0.02 : -0.08;
}

/**
 * Trigger camera shake based on line count
 */
export function triggerCameraShake(
  lineCount: number,
  shakeIntensityRef: { current: number },
  prefersReducedMotion: boolean
): void {
  // Camera shake disabled - no shake effect
  shakeIntensityRef.current = 0;
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

  console.log('[CameraSettings] Screen:', screenW, 'x', screenH, 'Portrait:', isPortrait, 'AspectRatio:', aspectRatio, 'Native:', isNativeApp);

  if (isPortrait) {
    // Mobile portrait - aspect ratio based radius selection
    let fov: number;
    let radius: number;

    if (aspectRatio < 0.48) {
      fov = 1.05; 
      radius = 13.0; // Very long screens
    } else if (aspectRatio < 0.55) {
      fov = 0.95; 
      radius = 13.5; // Standard phone
    } else if (aspectRatio < 0.65) {
      fov = 0.88; 
      radius = 14.0; // Wide phone
    } else {
      fov = 0.82; 
      radius = 14.5; // Small tablet
    }
    
    // Native app +2.0 adjustment REMOVED - using aspect ratio based values only
    // FOV is now adjusted based on canvas size instead of fixed offsets

    console.log('[CameraSettings] Portrait - FOV:', fov, 'Radius:', radius);

    camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
    camera.fov = fov;
    camera.radius = radius;
    
    // Adjust camera target for small screens - move grid slightly UP
    const targetY = screenW < 390 ? -0.02 : -0.08;
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
