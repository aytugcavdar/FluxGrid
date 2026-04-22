import { describe, it, expect, beforeEach } from 'vitest';
import { ParticlePool, Particle } from './particlePool';

describe('ParticlePool', () => {
  let pool: ParticlePool;
  
  beforeEach(() => {
    // Get fresh instance for each test
    pool = ParticlePool.getInstance();
    pool.clear(); // Reset to initial state
  });
  
  describe('Initialization', () => {
    it('should pre-allocate 50 particles on initialization', () => {
      const freshPool = ParticlePool.getInstance();
      freshPool.clear(); // Reset to initial state
      
      expect(freshPool.getAvailableCount()).toBe(50);
      expect(freshPool.getActiveCount()).toBe(0);
      expect(freshPool.getTotalSize()).toBe(50);
    });
  });
  
  describe('acquire()', () => {
    it('should return a particle from the pool', () => {
      const particle = pool.acquire();
      
      expect(particle).not.toBeNull();
      expect(particle).toHaveProperty('x');
      expect(particle).toHaveProperty('y');
      expect(particle).toHaveProperty('vx');
      expect(particle).toHaveProperty('vy');
      expect(particle).toHaveProperty('life');
      expect(particle).toHaveProperty('color');
    });
    
    it('should reset particle properties when acquired', () => {
      const particle = pool.acquire();
      
      expect(particle?.x).toBe(0);
      expect(particle?.y).toBe(0);
      expect(particle?.vx).toBe(0);
      expect(particle?.vy).toBe(0);
      expect(particle?.life).toBe(1.0);
      expect(particle?.color).toBe('#fff');
    });
    
    it('should move particle from pool to active set', () => {
      const initialAvailable = pool.getAvailableCount();
      const initialActive = pool.getActiveCount();
      
      pool.acquire();
      
      expect(pool.getAvailableCount()).toBe(initialAvailable - 1);
      expect(pool.getActiveCount()).toBe(initialActive + 1);
    });
    
    it('should create new particles up to maxSize when pool is empty', () => {
      // Acquire all 50 pre-allocated particles
      for (let i = 0; i < 50; i++) {
        pool.acquire();
      }
      
      expect(pool.getAvailableCount()).toBe(0);
      expect(pool.getActiveCount()).toBe(50);
      
      // Should create new particles up to maxSize (100)
      const particle = pool.acquire();
      expect(particle).not.toBeNull();
      expect(pool.getActiveCount()).toBe(51);
    });
    
    it('should return null when pool is exhausted (100 active)', () => {
      // Acquire 100 particles (max size)
      for (let i = 0; i < 100; i++) {
        const particle = pool.acquire();
        expect(particle).not.toBeNull();
      }
      
      expect(pool.getActiveCount()).toBe(100);
      
      // 101st particle should return null
      const particle = pool.acquire();
      expect(particle).toBeNull();
    });
  });
  
  describe('release()', () => {
    it('should return particle to the pool', () => {
      const particle = pool.acquire();
      expect(particle).not.toBeNull();
      
      const activeBeforeRelease = pool.getActiveCount();
      const availableBeforeRelease = pool.getAvailableCount();
      
      pool.release(particle!);
      
      expect(pool.getActiveCount()).toBe(activeBeforeRelease - 1);
      expect(pool.getAvailableCount()).toBe(availableBeforeRelease + 1);
    });
    
    it('should not exceed maxSize when releasing particles', () => {
      // Acquire and release many particles to test maxSize constraint
      const particles: Particle[] = [];
      
      // Acquire 100 particles
      for (let i = 0; i < 100; i++) {
        const particle = pool.acquire();
        if (particle) particles.push(particle);
      }
      
      // Release all particles
      particles.forEach(p => pool.release(p));
      
      // Total size should not exceed maxSize (100)
      expect(pool.getTotalSize()).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Pool Size Constraints', () => {
    it('should maintain pool size between 50-100', () => {
      // Initial state
      expect(pool.getTotalSize()).toBeGreaterThanOrEqual(50);
      expect(pool.getTotalSize()).toBeLessThanOrEqual(100);
      
      // Acquire some particles
      const particles: Particle[] = [];
      for (let i = 0; i < 30; i++) {
        const particle = pool.acquire();
        if (particle) particles.push(particle);
      }
      
      expect(pool.getTotalSize()).toBeGreaterThanOrEqual(50);
      expect(pool.getTotalSize()).toBeLessThanOrEqual(100);
      
      // Release particles
      particles.forEach(p => pool.release(p));
      
      expect(pool.getTotalSize()).toBeGreaterThanOrEqual(50);
      expect(pool.getTotalSize()).toBeLessThanOrEqual(100);
    });
    
    it('should maintain constraint after many acquire/release cycles', () => {
      // Simulate many acquire/release cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        const particles: Particle[] = [];
        
        // Acquire random number of particles
        const count = Math.floor(Math.random() * 50) + 10;
        for (let i = 0; i < count; i++) {
          const particle = pool.acquire();
          if (particle) particles.push(particle);
        }
        
        // Release half of them
        const releaseCount = Math.floor(particles.length / 2);
        for (let i = 0; i < releaseCount; i++) {
          pool.release(particles[i]);
        }
        
        // Check constraint
        expect(pool.getTotalSize()).toBeGreaterThanOrEqual(50);
        expect(pool.getTotalSize()).toBeLessThanOrEqual(100);
      }
    });
  });
  
  describe('Particle Reuse', () => {
    it('should reuse particles when available', () => {
      const particle1 = pool.acquire();
      expect(particle1).not.toBeNull();
      
      pool.release(particle1!);
      
      const particle2 = pool.acquire();
      expect(particle2).not.toBeNull();
      
      // Should be the same object reference (reused)
      expect(particle1).toBe(particle2);
    });
    
    it('should reset properties when reusing particles', () => {
      const particle = pool.acquire();
      expect(particle).not.toBeNull();
      
      // Modify particle properties
      particle!.x = 100;
      particle!.y = 200;
      particle!.vx = 50;
      particle!.vy = -30;
      particle!.life = 0.5;
      particle!.color = '#ff0000';
      
      // Release and reacquire
      pool.release(particle!);
      const reusedParticle = pool.acquire();
      
      // Properties should be reset
      expect(reusedParticle?.x).toBe(0);
      expect(reusedParticle?.y).toBe(0);
      expect(reusedParticle?.vx).toBe(0);
      expect(reusedParticle?.vy).toBe(0);
      expect(reusedParticle?.life).toBe(1.0);
      expect(reusedParticle?.color).toBe('#fff');
    });
  });
  
  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ParticlePool.getInstance();
      const instance2 = ParticlePool.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('clear()', () => {
    it('should reset pool to initial state', () => {
      // Acquire some particles
      for (let i = 0; i < 20; i++) {
        pool.acquire();
      }
      
      expect(pool.getActiveCount()).toBe(20);
      
      // Clear pool
      pool.clear();
      
      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(50);
      expect(pool.getTotalSize()).toBe(50);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle releasing the same particle multiple times gracefully', () => {
      const particle = pool.acquire();
      expect(particle).not.toBeNull();
      
      pool.release(particle!);
      pool.release(particle!); // Release again
      
      // Should not cause errors or exceed maxSize
      expect(pool.getTotalSize()).toBeLessThanOrEqual(100);
    });
    
    it('should handle acquiring all particles and releasing them', () => {
      const particles: Particle[] = [];
      
      // Acquire maximum particles
      for (let i = 0; i < 100; i++) {
        const particle = pool.acquire();
        if (particle) particles.push(particle);
      }
      
      expect(particles.length).toBe(100);
      expect(pool.getActiveCount()).toBe(100);
      expect(pool.getAvailableCount()).toBe(0);
      
      // Release all
      particles.forEach(p => pool.release(p));
      
      // Pool should be back to valid state
      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getTotalSize()).toBeLessThanOrEqual(100);
      expect(pool.getTotalSize()).toBeGreaterThanOrEqual(50);
    });
  });
});
