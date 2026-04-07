import * as BABYLON from 'babylonjs';
import { ParticlePoolManager, ParticleType, ActiveParticle } from './ParticlePoolManager';

/**
 * ParticleEmitter - Handles particle emission with various patterns
 * 
 * Requirements: 1.2, 4.5, 7.2
 * 
 * Emission Patterns:
 * - Radial: Impact particles radiating outward
 * - Downward: Confetti falling from top
 * - Outward: Line clear particles with spread
 */

export interface EmissionConfig {
  position: BABYLON.Vector3;
  count: number;
  velocityMin: number;
  velocityMax: number;
  lifetime: number;
  color?: BABYLON.Color3;
  applyGravity?: boolean;
  gravityDelay?: number;
}

export class ParticleEmitter {
  private poolManager: ParticlePoolManager;
  
  constructor(poolManager: ParticlePoolManager) {
    this.poolManager = poolManager;
  }
  
  /**
   * Emit particles with radial pattern (for impact)
   * Requirements: 1.2
   */
  emitRadial(type: ParticleType, config: EmissionConfig): number {
    let emittedCount = 0;
    
    for (let i = 0; i < config.count; i++) {
      const particle = this.poolManager.acquire(type);
      if (!particle) break;
      
      // Random angle for radial spread
      const angle = (Math.PI * 2 * i) / config.count + (Math.random() - 0.5) * 0.3;
      const speed = config.velocityMin + Math.random() * (config.velocityMax - config.velocityMin);
      
      // Set position
      particle.mesh.position.copyFrom(config.position);
      
      // Set velocity (radial outward)
      particle.velocity.set(
        Math.cos(angle) * speed,
        Math.random() * 100, // Slight upward
        Math.sin(angle) * speed
      );
      
      // Set properties
      particle.lifetime = config.lifetime;
      particle.startTime = Date.now();
      particle.applyGravity = config.applyGravity ?? false;
      particle.gravityDelay = config.gravityDelay ?? 0;
      
      // Set color
      if (config.color) {
        particle.color = config.color;
        const material = particle.mesh.material as BABYLON.StandardMaterial;
        if (material) {
          material.emissiveColor = config.color;
          material.alpha = 1.0;
        }
      }
      
      emittedCount++;
    }
    
    return emittedCount;
  }
  
  /**
   * Emit particles with downward pattern (for confetti)
   * Requirements: 7.2
   */
  emitDownward(type: ParticleType, config: EmissionConfig): number {
    let emittedCount = 0;
    
    for (let i = 0; i < config.count; i++) {
      const particle = this.poolManager.acquire(type);
      if (!particle) break;
      
      // Random position at top with horizontal spread
      const randomX = (Math.random() - 0.5) * 20;
      const randomZ = (Math.random() - 0.5) * 20;
      
      particle.mesh.position.set(
        config.position.x + randomX,
        config.position.y,
        config.position.z + randomZ
      );
      
      // Downward velocity with horizontal spread
      const horizontalSpeed = (Math.random() - 0.5) * 300;
      const downwardSpeed = -(200 + Math.random() * 200);
      
      particle.velocity.set(
        horizontalSpeed,
        downwardSpeed,
        (Math.random() - 0.5) * 300
      );
      
      // Set properties
      particle.lifetime = config.lifetime;
      particle.startTime = Date.now();
      particle.applyGravity = config.applyGravity ?? true;
      particle.gravityDelay = config.gravityDelay ?? 0;
      
      // Set color
      if (config.color) {
        particle.color = config.color;
        const material = particle.mesh.material as BABYLON.StandardMaterial;
        if (material) {
          material.emissiveColor = config.color;
          material.alpha = 1.0;
        }
      }
      
      emittedCount++;
    }
    
    return emittedCount;
  }
  
  /**
   * Emit particles with outward pattern (for line clear)
   * Requirements: 4.2, 4.3, 4.5
   */
  emitOutward(type: ParticleType, config: EmissionConfig): number {
    let emittedCount = 0;
    
    for (let i = 0; i < config.count; i++) {
      const particle = this.poolManager.acquire(type);
      if (!particle) break;
      
      // Random outward direction
      const angle = Math.random() * Math.PI * 2;
      const speed = config.velocityMin + Math.random() * (config.velocityMax - config.velocityMin);
      
      // Set position
      particle.mesh.position.copyFrom(config.position);
      
      // Set velocity (outward with upward component)
      particle.velocity.set(
        Math.cos(angle) * speed,
        Math.random() * 150, // Upward component
        Math.sin(angle) * speed
      );
      
      // Set properties
      particle.lifetime = config.lifetime;
      particle.startTime = Date.now();
      particle.applyGravity = config.applyGravity ?? true;
      particle.gravityDelay = config.gravityDelay ?? 100; // 100ms delay for gravity
      
      // Set color (from cleared piece)
      if (config.color) {
        particle.color = config.color;
        const material = particle.mesh.material as BABYLON.StandardMaterial;
        if (material) {
          material.emissiveColor = config.color;
          material.alpha = 1.0;
        }
      }
      
      emittedCount++;
    }
    
    return emittedCount;
  }
  
  /**
   * Emit particles from multiple positions (for line clear from cells)
   * Requirements: 4.1, 4.5
   */
  emitFromCells(
    type: ParticleType,
    cellPositions: BABYLON.Vector3[],
    particlesPerCell: number,
    config: Omit<EmissionConfig, 'position' | 'count'>
  ): number {
    let totalEmitted = 0;
    
    cellPositions.forEach(position => {
      const emitted = this.emitOutward(type, {
        ...config,
        position,
        count: particlesPerCell
      });
      totalEmitted += emitted;
    });
    
    return totalEmitted;
  }
  
  /**
   * Emit celebration particles (for milestones)
   * Requirements: 3.2-3.4
   */
  emitCelebration(count: number, colors: BABYLON.Color3[]): number {
    let emittedCount = 0;
    
    for (let i = 0; i < count; i++) {
      const particle = this.poolManager.acquire('confetti');
      if (!particle) break;
      
      // Random position across screen
      const randomX = (Math.random() - 0.5) * 15;
      const randomZ = (Math.random() - 0.5) * 15;
      
      particle.mesh.position.set(randomX, 8, randomZ);
      
      // Random velocity
      particle.velocity.set(
        (Math.random() - 0.5) * 200,
        -100 - Math.random() * 100,
        (Math.random() - 0.5) * 200
      );
      
      // Set properties
      particle.lifetime = 1500;
      particle.startTime = Date.now();
      particle.applyGravity = true;
      particle.gravityDelay = 0;
      
      // Random color from provided colors
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.color = color;
      const material = particle.mesh.material as BABYLON.StandardMaterial;
      if (material) {
        material.emissiveColor = color;
        material.alpha = 1.0;
      }
      
      emittedCount++;
    }
    
    return emittedCount;
  }
}
