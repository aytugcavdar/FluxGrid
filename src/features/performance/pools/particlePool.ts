/**
 * Particle Emitter Object Pool
 */

import { memoryManager } from '../utils/MemoryManager';

// Placeholder particle emitter interface
// Will be replaced with actual Babylon.js ParticleSystem
interface ParticleEmitter {
  isActive: boolean;
  position: { x: number; y: number; z: number };
  color: string;
  particleCount: number;
  dispose(): void;
  reset(): void;
}

/**
 * Create a new particle emitter
 */
function createParticleEmitter(): ParticleEmitter {
  return {
    isActive: false,
    position: { x: 0, y: 0, z: 0 },
    color: '#ffffff',
    particleCount: 0,
    dispose() {
      // Cleanup Babylon.js resources
      this.isActive = false;
    },
    reset() {
      this.isActive = false;
      this.position = { x: 0, y: 0, z: 0 };
      this.color = '#ffffff';
      this.particleCount = 0;
    }
  };
}

/**
 * Reset particle emitter to default state
 */
function resetParticleEmitter(emitter: ParticleEmitter): void {
  emitter.reset();
}

/**
 * Initialize particle emitter pool
 */
export function initParticlePool(): void {
  memoryManager.createPool({
    name: 'particleEmitters',
    factory: createParticleEmitter,
    reset: resetParticleEmitter,
    initialSize: 10,
    maxSize: 20
  });
  
  console.log('[ParticlePool] Initialized with 10 emitters (max 20)');
}

/**
 * Acquire a particle emitter from the pool
 */
export function acquireParticleEmitter(): ParticleEmitter {
  return memoryManager.acquire<ParticleEmitter>('particleEmitters');
}

/**
 * Release a particle emitter back to the pool
 */
export function releaseParticleEmitter(emitter: ParticleEmitter): void {
  memoryManager.release('particleEmitters', emitter);
}
