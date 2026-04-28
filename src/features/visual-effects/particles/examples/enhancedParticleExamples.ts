/**
 * Enhanced Particle Effects Examples
 * 
 * Usage examples for the new particle emission methods:
 * - emitFire: Fire effect with red/orange/yellow gradient
 * - emitSmoke: Smoke effect with slow upward drift
 * - emitStars: Star burst with bright colors
 * - emitSpiral: Spiral pattern with rainbow colors
 * - emitLightning: Fast zigzag lightning effect
 */

import * as BABYLON from 'babylonjs';
import { SPSParticlePoolManager } from '../SPSParticlePoolManager';
import { EmissionConfig } from '../config/particles.config';

/**
 * Example: Fire effect on combo milestone
 */
export function triggerFireEffect(
  particleManager: SPSParticlePoolManager,
  position: BABYLON.Vector3
): void {
  const fireConfig: EmissionConfig = {
    color: new BABYLON.Color4(1, 0.5, 0, 1), // Base color (not used, fire generates its own)
    lifetime: 1000, // 1 second
    speed: 3.0,
    gravityDelay: 500, // Gravity after 0.5s
    applyColorVariation: false,
  };
  
  particleManager.emitFire(position, 50, fireConfig);
}

/**
 * Example: Smoke effect after fire
 */
export function triggerSmokeEffect(
  particleManager: SPSParticlePoolManager,
  position: BABYLON.Vector3
): void {
  const smokeConfig: EmissionConfig = {
    color: new BABYLON.Color4(0.7, 0.7, 0.7, 0.6), // Gray (not used, smoke generates its own)
    lifetime: 2000, // 2 seconds
    speed: 1.5,
    gravityDelay: 999999, // No gravity
    applyColorVariation: false,
  };
  
  particleManager.emitSmoke(position, 30, smokeConfig);
}

/**
 * Example: Star burst on perfect clear
 */
export function triggerStarBurst(
  particleManager: SPSParticlePoolManager,
  position: BABYLON.Vector3
): void {
  const starConfig: EmissionConfig = {
    color: new BABYLON.Color4(1, 1, 0, 1), // Base color (not used, stars generate their own)
    lifetime: 1500, // 1.5 seconds
    speed: 4.0,
    gravityDelay: 800, // Gravity after 0.8s
    applyColorVariation: false,
  };
  
  particleManager.emitStars(position, 100, starConfig);
}

/**
 * Example: Spiral effect on level up
 */
export function triggerSpiralEffect(
  particleManager: SPSParticlePoolManager,
  position: BABYLON.Vector3
): void {
  const spiralConfig: EmissionConfig = {
    color: new BABYLON.Color4(1, 0, 1, 1), // Base color (not used, spiral generates rainbow)
    lifetime: 2000, // 2 seconds
    speed: 2.5,
    gravityDelay: 1000, // Gravity after 1s
    applyColorVariation: false,
  };
  
  particleManager.emitSpiral(position, 60, spiralConfig);
}

/**
 * Example: Lightning effect on special block activation
 */
export function triggerLightningEffect(
  particleManager: SPSParticlePoolManager,
  position: BABYLON.Vector3
): void {
  const lightningConfig: EmissionConfig = {
    color: new BABYLON.Color4(0.8, 0.8, 1, 1), // Base color (not used, lightning generates its own)
    lifetime: 300, // 0.3 seconds (very fast)
    speed: 8.0, // Very fast
    gravityDelay: 999999, // No gravity
    applyColorVariation: false,
  };
  
  particleManager.emitLightning(position, 40, lightningConfig);
}

/**
 * Example: Combined effect - Fire followed by smoke
 */
export function triggerFireAndSmoke(
  particleManager: SPSParticlePoolManager,
  position: BABYLON.Vector3
): void {
  // Trigger fire immediately
  triggerFireEffect(particleManager, position);
  
  // Trigger smoke after 500ms
  setTimeout(() => {
    triggerSmokeEffect(particleManager, position);
  }, 500);
}

/**
 * Example: Celebration combo - Stars + Spiral
 */
export function triggerCelebrationCombo(
  particleManager: SPSParticlePoolManager,
  position: BABYLON.Vector3
): void {
  // Trigger star burst
  triggerStarBurst(particleManager, position);
  
  // Trigger spiral after 200ms
  setTimeout(() => {
    triggerSpiralEffect(particleManager, position);
  }, 200);
}

/**
 * Example: Power-up effect - Lightning + Stars
 */
export function triggerPowerUpEffect(
  particleManager: SPSParticlePoolManager,
  position: BABYLON.Vector3
): void {
  // Trigger lightning
  triggerLightningEffect(particleManager, position);
  
  // Trigger stars after 100ms
  setTimeout(() => {
    const starConfig: EmissionConfig = {
      color: new BABYLON.Color4(1, 1, 0, 1),
      lifetime: 1000,
      speed: 3.0,
      gravityDelay: 500,
      applyColorVariation: false,
    };
    particleManager.emitStars(position, 50, starConfig);
  }, 100);
}

/**
 * Usage in game code:
 * 
 * // Initialize particle manager
 * const particleManager = new SPSParticlePoolManager({
 *   scene: babylonScene,
 *   capacity: 2000,
 *   particleSize: 0.1,
 * });
 * 
 * // Trigger effects based on game events
 * 
 * // On combo milestone (e.g., combo 5, 10, 15)
 * if (combo === 5) {
 *   triggerFireEffect(particleManager, blockPosition);
 * }
 * 
 * // On perfect clear
 * if (isPerfectClear) {
 *   triggerCelebrationCombo(particleManager, centerPosition);
 * }
 * 
 * // On special block activation
 * if (specialBlockActivated) {
 *   triggerPowerUpEffect(particleManager, blockPosition);
 * }
 * 
 * // On level up
 * if (levelUp) {
 *   triggerSpiralEffect(particleManager, centerPosition);
 * }
 * 
 * // Update particle manager each frame
 * particleManager.update(deltaTime, camera);
 */
