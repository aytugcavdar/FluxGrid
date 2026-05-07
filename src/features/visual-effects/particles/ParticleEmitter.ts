import * as BABYLON from 'babylonjs';
import { ParticlePoolManager, ParticleType, ActiveParticle } from './ParticlePoolManager';
import { 
  DUST_PARTICLE_CONFIG,
  TRAIL_PARTICLE_CONFIG,
  EXPLOSION_PARTICLE_CONFIG,
  ICY_PARTICLE_CONFIG,
  QUALITY_MULTIPLIERS,
  REDUCED_MOTION_MULTIPLIERS,
} from '../juice/config/juice.config';
import type {
  DustEmissionConfig,
  TrailEmissionConfig,
  ExplosionEmissionConfig,
  IcyEmissionConfig,
} from '../juice/types';

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
  
  /**
   * Emit dust particles (for placement impact)
   * Requirements: 1.1-1.10
   */
  emitDust(config: DustEmissionConfig): number {
    // Calculate particle count based on drop height
    const dropHeightFactor = Math.max(0.5, Math.min(1.5, config.dropHeight / 10));
    let particleCount = Math.round(DUST_PARTICLE_CONFIG.baseCount * dropHeightFactor);
    
    // Clamp to min/max
    particleCount = Math.max(
      DUST_PARTICLE_CONFIG.minCount,
      Math.min(DUST_PARTICLE_CONFIG.maxCount, particleCount)
    );
    
    // Apply quality multiplier
    particleCount = Math.round(particleCount * config.qualityMultiplier);
    
    let emittedCount = 0;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.poolManager.acquire('impact');
      if (!particle) break;
      
      // Set position
      particle.mesh.position.copyFrom(config.position);
      
      // Random radial velocity (horizontal only)
      const angle = Math.random() * Math.PI * 2;
      const speed = DUST_PARTICLE_CONFIG.velocityMin + 
        Math.random() * (DUST_PARTICLE_CONFIG.velocityMax - DUST_PARTICLE_CONFIG.velocityMin);
      
      particle.velocity.set(
        Math.cos(angle) * speed,
        0, // No vertical velocity initially
        Math.sin(angle) * speed
      );
      
      // Set color with variation
      const baseColor = DUST_PARTICLE_CONFIG.color;
      const variation = DUST_PARTICLE_CONFIG.colorVariation;
      const color = new BABYLON.Color3(
        baseColor.r + (Math.random() - 0.5) * variation * 2,
        baseColor.g + (Math.random() - 0.5) * variation * 2,
        baseColor.b + (Math.random() - 0.5) * variation * 2
      );
      
      particle.color = color;
      const material = particle.mesh.material as BABYLON.StandardMaterial;
      if (material) {
        material.emissiveColor = color;
        material.alpha = 1.0;
      }
      
      // Set properties
      particle.lifetime = DUST_PARTICLE_CONFIG.lifetime;
      particle.startTime = Date.now();
      particle.applyGravity = true;
      particle.gravityDelay = DUST_PARTICLE_CONFIG.gravityDelay;
      
      emittedCount++;
    }
    
    return emittedCount;
  }
  
  /**
   * Emit trail particles (for combo chains)
   * Requirements: 2.1-2.11
   */
  emitTrail(config: TrailEmissionConfig): number {
    // Check combo threshold
    if (config.comboLevel < 5) {
      return 0;
    }
    
    // Determine trail config based on combo level
    let trailConfig;
    if (config.comboLevel >= 11) {
      trailConfig = TRAIL_PARTICLE_CONFIG.configs.high;
    } else if (config.comboLevel >= 8) {
      trailConfig = TRAIL_PARTICLE_CONFIG.configs.medium;
    } else {
      trailConfig = TRAIL_PARTICLE_CONFIG.configs.low;
    }
    
    // Calculate particle count based on emission rate
    const particleCount = Math.round(config.emissionRate);
    
    let emittedCount = 0;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.poolManager.acquire('impact');
      if (!particle) break;
      
      // Set position at current mesh position
      particle.mesh.position.copyFrom(config.position);
      
      // Stationary particles (no velocity)
      particle.velocity.set(0, 0, 0);
      
      // Set color with alpha from config
      const color = config.color.clone();
      particle.color = color;
      const material = particle.mesh.material as BABYLON.StandardMaterial;
      if (material) {
        material.emissiveColor = color.scale(trailConfig.emissive);
        material.alpha = trailConfig.alpha;
      }
      
      // Set properties
      particle.lifetime = TRAIL_PARTICLE_CONFIG.lifetime;
      particle.startTime = Date.now();
      particle.applyGravity = false; // Trails don't fall
      particle.gravityDelay = 0;
      
      emittedCount++;
    }
    
    return emittedCount;
  }
  
  /**
   * Emit explosion particles (for line clears)
   * Requirements: 3.1-3.10
   */
  emitExplosion(config: ExplosionEmissionConfig): number {
    // Determine particle count per block based on line count
    let particlesPerBlock: number;
    if (config.lineCount === 1) {
      particlesPerBlock = EXPLOSION_PARTICLE_CONFIG.countPerLine.single;
    } else if (config.lineCount === 2) {
      particlesPerBlock = EXPLOSION_PARTICLE_CONFIG.countPerLine.double;
    } else if (config.lineCount >= 5) {
      // 🎯 OPTIMIZATION: Use reduced particle count for large clears (5+ lines)
      particlesPerBlock = EXPLOSION_PARTICLE_CONFIG.countPerLine.large;
    } else {
      particlesPerBlock = EXPLOSION_PARTICLE_CONFIG.countPerLine.triple;
    }
    
    let emittedCount = 0;
    
    for (let i = 0; i < particlesPerBlock; i++) {
      const particle = this.poolManager.acquire('lineClear');
      if (!particle) break;
      
      // Set position
      particle.mesh.position.copyFrom(config.position);
      
      // Random radial velocity with elevation
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * (Math.PI / 4); // -45° to +45°
      const speed = EXPLOSION_PARTICLE_CONFIG.velocityMin + 
        Math.random() * (EXPLOSION_PARTICLE_CONFIG.velocityMax - EXPLOSION_PARTICLE_CONFIG.velocityMin);
      
      particle.velocity.set(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed,
        Math.sin(angle) * Math.cos(elevation) * speed
      );
      
      // Set color with emissive boost
      const color = config.color.clone();
      particle.color = color;
      const material = particle.mesh.material as BABYLON.StandardMaterial;
      if (material) {
        material.emissiveColor = color.scale(EXPLOSION_PARTICLE_CONFIG.emissiveBoost);
        material.alpha = 1.0;
      }
      
      // Set properties
      particle.lifetime = EXPLOSION_PARTICLE_CONFIG.lifetime;
      particle.startTime = Date.now();
      particle.applyGravity = true;
      particle.gravityDelay = EXPLOSION_PARTICLE_CONFIG.gravityDelay;
      
      emittedCount++;
    }
    
    return emittedCount;
  }
  
  /**
   * Emit icy particles (for ice block breaks)
   * Requirements: 4.1-4.11
   */
  emitIcy(config: IcyEmissionConfig): number {
    const particleCount = config.count;
    
    let emittedCount = 0;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.poolManager.acquire('lineClear');
      if (!particle) break;
      
      // Set position
      particle.mesh.position.copyFrom(config.position);
      
      // Random radial velocity with elevation
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * (Math.PI / 4); // -45° to +45°
      const speed = ICY_PARTICLE_CONFIG.velocityMin + 
        Math.random() * (ICY_PARTICLE_CONFIG.velocityMax - ICY_PARTICLE_CONFIG.velocityMin);
      
      particle.velocity.set(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed,
        Math.sin(angle) * Math.cos(elevation) * speed
      );
      
      // Set color: 30% white, 70% light blue
      const color = Math.random() < ICY_PARTICLE_CONFIG.highlightChance
        ? ICY_PARTICLE_CONFIG.highlightColor.clone()
        : ICY_PARTICLE_CONFIG.color.clone();
      
      particle.color = color;
      const material = particle.mesh.material as BABYLON.StandardMaterial;
      if (material) {
        material.emissiveColor = color.scale(ICY_PARTICLE_CONFIG.emissiveIntensity);
        material.alpha = 1.0;
      }
      
      // Set properties
      particle.lifetime = ICY_PARTICLE_CONFIG.lifetime;
      particle.startTime = Date.now();
      particle.applyGravity = true;
      particle.gravityDelay = ICY_PARTICLE_CONFIG.gravityDelay;
      
      emittedCount++;
    }
    
    return emittedCount;
  }
}
