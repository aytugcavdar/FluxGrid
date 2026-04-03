/**
 * Render Loop Helpers
 * Animation update logic for render loop
 */

import * as BABYLON from 'babylonjs';

/**
 * Update tier flash animation
 */
export function updateTierFlash(
  tierFlashRef: { current: any },
  meshMap: Map<string, BABYLON.Mesh>
): void {
  if (!tierFlashRef.current?.active) return;
  
  const flash = tierFlashRef.current;
  const elapsed = Date.now() - flash.startTime;
  
  if (elapsed < 400) {
    flash.progress = elapsed / 400;
    const intensity = 0.8 * (1 - flash.progress); // Fade from 0.8 to 0
    
    // Apply flash to all grid blocks
    meshMap.forEach((mesh) => {
      if (mesh.material) {
        const mat = mesh.material as BABYLON.StandardMaterial;
        
        // Store original emissive if not already stored
        if (!(mat as any)._tierFlashOriginal) {
          (mat as any)._tierFlashOriginal = mat.emissiveColor.clone();
        }
        
        // Apply tier color overlay
        const original = (mat as any)._tierFlashOriginal;
        mat.emissiveColor = BABYLON.Color3.Lerp(original, flash.color, intensity);
      }
    });
  } else {
    // Flash complete - restore original colors
    meshMap.forEach((mesh) => {
      if (mesh.material) {
        const mat = mesh.material as BABYLON.StandardMaterial;
        if ((mat as any)._tierFlashOriginal) {
          mat.emissiveColor = (mat as any)._tierFlashOriginal;
          delete (mat as any)._tierFlashOriginal;
        }
      }
    });
    
    tierFlashRef.current = null;
  }
}

/**
 * Update last 10 seconds atmosphere for timed mode
 */
export function updateTimedModeAtmosphere(
  timeLeft: number,
  meshMap: Map<string, BABYLON.Mesh>,
  gridBaseRef: { current: BABYLON.Mesh | null },
  light: BABYLON.HemisphericLight,
  isMobile: boolean
): void {
  if (timeLeft <= 10 && timeLeft > 0) {
    const intensity = (10 - timeLeft) / 10;
    const redTint = new BABYLON.Color3(1.0, 0.3, 0.3);
    
    // Apply to all grid blocks
    meshMap.forEach((mesh) => {
      if (mesh.material) {
        const mat = mesh.material as BABYLON.StandardMaterial;
        
        // Store original emissive if not already stored
        if (!(mat as any)._originalEmissive) {
          (mat as any)._originalEmissive = mat.emissiveColor.clone();
        }
        
        // Apply red tint overlay
        const originalEmissive = (mat as any)._originalEmissive;
        mat.emissiveColor = BABYLON.Color3.Lerp(
          originalEmissive,
          redTint,
          intensity * 0.5
        );
        
        // Increase emissive intensity
        (mat as any).emissiveIntensity = 1.0 + (intensity * 0.5);
      }
    });
    
    // Apply to grid base
    if (gridBaseRef.current?.material) {
      const mat = gridBaseRef.current.material as BABYLON.StandardMaterial;
      if (!(mat as any)._originalDiffuse) {
        (mat as any)._originalDiffuse = mat.diffuseColor.clone();
      }
      const originalDiffuse = (mat as any)._originalDiffuse;
      const darkRed = new BABYLON.Color3(0.3, 0.05, 0.05);
      mat.diffuseColor = BABYLON.Color3.Lerp(originalDiffuse, darkRed, intensity);
    }
    
    // Apply to ambient light
    if (light) {
      light.intensity = (isMobile ? 0.45 : 0.7) + (intensity * 0.3);
    }
  } else if (timeLeft > 10) {
    // Restore original colors when time > 10
    meshMap.forEach((mesh) => {
      if (mesh.material) {
        const mat = mesh.material as BABYLON.StandardMaterial;
        if ((mat as any)._originalEmissive) {
          mat.emissiveColor = (mat as any)._originalEmissive;
          (mat as any).emissiveIntensity = 1.0;
          delete (mat as any)._originalEmissive;
        }
      }
    });
    
    if (gridBaseRef.current?.material) {
      const mat = gridBaseRef.current.material as BABYLON.StandardMaterial;
      if ((mat as any)._originalDiffuse) {
        mat.diffuseColor = (mat as any)._originalDiffuse;
        delete (mat as any)._originalDiffuse;
      }
    }
    
    if (light) {
      light.intensity = isMobile ? 0.45 : 0.7;
    }
  }
}
