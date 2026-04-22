/**
 * ParticlePool - Simple object pooling for particle systems
 * 
 * Requirements: 2.3, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 * 
 * This class implements object pooling to reduce garbage collection
 * and improve performance by reusing particle objects.
 * 
 * Features:
 * - Pre-allocates 50 particles on initialization
 * - Maintains pool size between 50-100 objects
 * - Resets particle properties on reuse
 * - Provides acquire/release methods for pool management
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class ParticlePool {
  private static instance: ParticlePool;
  private pool: Particle[] = [];
  private active: Set<Particle> = new Set();
  private readonly minSize = 50;
  private readonly maxSize = 100;
  
  private constructor() {
    // Pre-allocate 50 particles (Requirement 15.2)
    for (let i = 0; i < this.minSize; i++) {
      this.pool.push(this.createParticle());
    }
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): ParticlePool {
    if (!ParticlePool.instance) {
      ParticlePool.instance = new ParticlePool();
    }
    return ParticlePool.instance;
  }
  
  /**
   * Acquire a particle from the pool
   * Requirements: 15.3
   * 
   * Returns a particle from the pool if available, or creates a new one
   * if the total size is below maxSize. Returns null if pool is exhausted.
   */
  acquire(): Particle | null {
    let particle = this.pool.pop();
    
    // If pool is empty but we haven't reached max size, create new particle
    if (!particle && this.active.size < this.maxSize) {
      particle = this.createParticle();
    }
    
    if (particle) {
      this.active.add(particle);
      this.resetParticle(particle); // Requirement 15.6
      return particle;
    }
    
    return null;
  }
  
  /**
   * Release a particle back to the pool
   * Requirements: 15.4
   * 
   * Returns the particle to the pool for reuse if pool size is below maxSize.
   */
  release(particle: Particle): void {
    this.active.delete(particle);
    
    // Only add back to pool if we haven't exceeded maxSize (Requirement 15.5)
    if (this.pool.length < this.maxSize) {
      this.pool.push(particle);
    }
  }
  
  /**
   * Create a new particle object
   */
  private createParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 1.0,
      color: '#fff'
    };
  }
  
  /**
   * Reset particle properties to default values
   * Requirements: 15.6
   */
  private resetParticle(particle: Particle): void {
    particle.x = 0;
    particle.y = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.life = 1.0;
    particle.color = '#fff';
  }
  
  /**
   * Get the total number of particles (active + pooled)
   * Requirements: 15.5
   */
  getTotalSize(): number {
    return this.pool.length + this.active.size;
  }
  
  /**
   * Get the number of active particles
   */
  getActiveCount(): number {
    return this.active.size;
  }
  
  /**
   * Get the number of available particles in the pool
   */
  getAvailableCount(): number {
    return this.pool.length;
  }
  
  /**
   * Clear all particles and reset the pool
   */
  clear(): void {
    this.active.clear();
    this.pool = [];
    
    // Re-initialize with minimum size
    for (let i = 0; i < this.minSize; i++) {
      this.pool.push(this.createParticle());
    }
  }
  
  /**
   * Resize the pool (for testing or performance adjustment)
   * Note: This is not part of the requirements but useful for testing
   */
  resize(minSize: number, maxSize: number): void {
    // Clear and reinitialize with new sizes
    this.active.clear();
    this.pool = [];
    
    for (let i = 0; i < minSize; i++) {
      this.pool.push(this.createParticle());
    }
  }
}
