/**
 * Explosion Effect Object Pool
 */

import { memoryManager } from '../utils/MemoryManager';

interface ExplosionEffect {
  id: string;
  x: number;
  y: number;
  color: string;
  isActive: boolean;
  particles: any[];
  reset(): void;
  dispose(): void;
}

/**
 * Create a new explosion effect
 */
function createExplosionEffect(): ExplosionEffect {
  return {
    id: '',
    x: 0,
    y: 0,
    color: '#ffffff',
    isActive: false,
    particles: [],
    reset() {
      this.id = '';
      this.x = 0;
      this.y = 0;
      this.color = '#ffffff';
      this.isActive = false;
      this.particles = [];
    },
    dispose() {
      // Cleanup any Babylon.js resources
      this.particles.forEach(p => {
        if (p && 'dispose' in p) {
          p.dispose();
        }
      });
      this.particles = [];
      this.isActive = false;
    }
  };
}

/**
 * Reset explosion effect to default state
 */
function resetExplosionEffect(effect: ExplosionEffect): void {
  effect.reset();
}

/**
 * Initialize explosion effect pool
 */
export function initExplosionPool(): void {
  memoryManager.createPool({
    name: 'explosionEffects',
    factory: createExplosionEffect,
    reset: resetExplosionEffect,
    initialSize: 5,
    maxSize: 10
  });
  
  console.log('[ExplosionPool] Initialized with 5 effects (max 10)');
}

/**
 * Acquire an explosion effect from the pool
 */
export function acquireExplosionEffect(): ExplosionEffect {
  return memoryManager.acquire<ExplosionEffect>('explosionEffects');
}

/**
 * Release an explosion effect back to the pool
 */
export function releaseExplosionEffect(effect: ExplosionEffect): void {
  memoryManager.release('explosionEffects', effect);
}
