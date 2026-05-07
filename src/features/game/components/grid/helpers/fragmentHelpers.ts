/**
 * Fragment Helpers
 * Break apart fragment animation utilities
 */

import * as BABYLON from 'babylonjs';
import { CellType } from '../../../types';
import { FragmentPool } from '../types';
import { FRAGMENT_LIFETIME } from '../constants';
import { getVectorPos } from './positionHelpers';

/**
 * Update active fragments in render loop
 */
export function updateFragments(
  fragmentPool: FragmentPool,
  currentTime: number
): void {
  const GRAVITY = -0.015;
  
  fragmentPool.activeFragments.forEach((data, key) => {
    const elapsed = currentTime - data.startTime;
    
    if (elapsed > (data.lifetime ?? FRAGMENT_LIFETIME)) {
      // Fade out complete, return fragment to pool
      data.mesh.isVisible = false;
      fragmentPool.activeFragments.delete(key);
      return;
    }
    
    // Physics update
    data.velocity.y += GRAVITY;
    data.mesh.position.addInPlace(data.velocity);
    data.mesh.rotation.addInPlace(data.rotationVelocity);
    
    // Fade out
    const fadeProgress = elapsed / (data.lifetime ?? FRAGMENT_LIFETIME);
    if (data.mesh.material) {
      const mat = data.mesh.material as BABYLON.StandardMaterial;
      mat.alpha = data.startAlpha * (1 - fadeProgress);
    }
  });
}

/**
 * Create break apart fragments for a cell
 */
export function createBreakApartFragments(
  cellX: number,
  cellY: number,
  color: string,
  cellType: CellType,
  fragmentPool: FragmentPool,
  isMobile: boolean,
  isNativeApp: boolean,
  isLowEndDevice: boolean,
  prefersReducedMotion: boolean,
  deviceTier: 'low' | 'low-mid' | 'mid-low' | 'mid' | 'mid-high' | 'high' = 'mid'
): void {
  // Skip entirely for low / low-mid tiers and native apps on low-end
  if (prefersReducedMotion) return;
  if (isLowEndDevice) return; // low tier
  if (deviceTier === 'low-mid') return; // low-mid: no fragments
  // Fragment count by tier: mid-low=2, mid=3, mid-high/high=5
  const fragmentCount = deviceTier === 'mid-low' ? 2
    : deviceTier === 'mid' ? 3
    : isMobile ? 4 : 5;

  // Lifetime by tier: shorter on weaker devices saves GPU time
  const lifetime = deviceTier === 'mid-low' ? 220
    : deviceTier === 'mid' ? 300
    : FRAGMENT_LIFETIME; // 400ms for high tiers

  const worldPos = getVectorPos(cellX, cellY);
  
  // Get fragments from pool
  let fragmentsCreated = 0;
  for (let i = 0; i < fragmentPool.pool.length && fragmentsCreated < fragmentCount; i++) {
    const fragment = fragmentPool.pool[i];
    if (!fragment.isVisible) {
      // Activate fragment
      fragment.position = worldPos.clone();
      fragment.position.y = 0; // Grid level
      
      // Random outward velocity
      const angle = (Math.PI * 2 * fragmentsCreated) / fragmentCount;
      const speed = 0.3 + Math.random() * 0.5; // 0.3-0.8
      const velocity = new BABYLON.Vector3(
        Math.cos(angle) * speed,
        0.5 + Math.random() * 0.3, // Upward launch
        Math.sin(angle) * speed
      );
      
      // Random rotation
      const rotationVelocity = new BABYLON.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );
      
      // Material setup
      const mat = fragment.material as BABYLON.StandardMaterial;
      mat.diffuseColor = BABYLON.Color3.FromHexString(color);
      mat.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.3);
      mat.alpha = 1.0;
      
      fragment.isVisible = true;
      
      // Add to active fragments list
      fragmentPool.activeFragments.set(`fragment-${i}`, {
        mesh: fragment,
        velocity,
        rotationVelocity,
        startTime: Date.now(),
        startAlpha: 1.0,
        lifetime,
      });
      
      fragmentsCreated++;
    }
  }
}
