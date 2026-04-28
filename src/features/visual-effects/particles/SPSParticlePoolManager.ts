/**
 * SPS Particle Pool Manager
 * 
 * High-performance particle system using Babylon.js Solid Particle System (SPS).
 * Combines all particles into a single mesh for optimal rendering (1 draw call).
 * 
 * Key features:
 * - 2000 particle capacity with single draw call
 * - Dead/active particle lifecycle management
 * - CPU-based physics updates
 * - Frustum culling for off-screen particles
 * - Color variation for visual richness
 */

import * as BABYLON from 'babylonjs';

import {
  PARTICLE_CONFIG,
  SPSParticle,
  SPSParticlePoolConfig,
  EmissionConfig,
} from './config/particles.config';

export class SPSParticlePoolManager {
  private scene: BABYLON.Scene;
  private sps: BABYLON.SolidParticleSystem;
  private particles: SPSParticle[];
  private deadParticles: number[]; // Stack of dead particle indices
  private activeParticles: number[]; // List of active particle indices
  private capacity: number;
  private gravity: number;
  private particleSize: number;
  
  // Performance tracking
  private cullingEnabled: boolean = false;
  private lastCullingTime: number = 0;
  
  constructor(config: SPSParticlePoolConfig) {
    this.scene = config.scene;
    this.capacity = config.capacity ?? PARTICLE_CONFIG.spsCapacity;
    this.particleSize = config.particleSize ?? PARTICLE_CONFIG.particleSize;
    this.gravity = PARTICLE_CONFIG.gravity;
    
    // Initialize particle arrays
    this.particles = [];
    this.deadParticles = [];
    this.activeParticles = [];
    
    // Create the SPS
    this.initializeSPS();
  }
  
  /**
   * Initialize the Solid Particle System
   */
  private initializeSPS(): void {
    // Create SPS with configured capacity
    this.sps = new BABYLON.SolidParticleSystem('particleSPS', this.scene, {
      updatable: true,
      isPickable: false,
    });
    
    // Create a box model for particles
    const box = BABYLON.MeshBuilder.CreateBox('particleModel', {
      size: this.particleSize,
    }, this.scene);
    
    // Add particles to SPS
    this.sps.addShape(box, this.capacity);
    
    // Dispose the model (SPS has copied it)
    box.dispose();
    
    // Build the SPS mesh
    const spsMesh = this.sps.buildMesh();
    
    // Create material
    const material = new BABYLON.StandardMaterial('particleMaterial', this.scene);
    material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    material.disableLighting = true;
    spsMesh.material = material;
    
    // Disable vertex computation (we update on CPU)
    this.sps.computeParticleVertex = false;
    
    // Initialize particle data structures
    for (let i = 0; i < this.capacity; i++) {
      const particle: SPSParticle = {
        idx: i,
        position: new BABYLON.Vector3(0, -100, 0), // Off-screen initially
        velocity: new BABYLON.Vector3(0, 0, 0),
        color: new BABYLON.Color4(1, 1, 1, 1),
        lifetime: 0,
        age: 0,
        gravityDelay: 0,
        isDead: true,
      };
      
      this.particles.push(particle);
      this.deadParticles.push(i); // All particles start dead
    }
    
    // Set up SPS update callback
    this.sps.updateParticle = (particle: BABYLON.SolidParticle) => {
      const p = this.particles[particle.idx];
      
      // Update SPS particle from our data
      particle.position.copyFrom(p.position);
      particle.color = p.color;
      particle.isVisible = !p.isDead;
      
      return particle;
    };
  }
  
  /**
   * Acquire a particle from the dead list
   * @returns Particle index or null if pool exhausted
   */
  private acquireParticle(): number | null {
    if (this.deadParticles.length === 0) {
      return null; // Pool exhausted
    }
    
    const idx = this.deadParticles.pop()!;
    const particle = this.particles[idx];
    
    // Mark as active
    particle.isDead = false;
    this.activeParticles.push(idx);
    
    return idx;
  }
  
  /**
   * Release a particle back to the dead list
   * @param idx Particle index
   */
  private releaseParticle(idx: number): void {
    const particle = this.particles[idx];
    
    // Mark as dead
    particle.isDead = true;
    
    // Remove from active list
    const activeIdx = this.activeParticles.indexOf(idx);
    if (activeIdx !== -1) {
      this.activeParticles.splice(activeIdx, 1);
    }
    
    // Add to dead list
    this.deadParticles.push(idx);
    
    // Move off-screen
    particle.position.set(0, -100, 0);
    particle.color.a = 0;
  }
  
  /**
   * Get count of active particles
   */
  public getActiveCount(): number {
    return this.activeParticles.length;
  }
  
  /**
   * Get count of dead (available) particles
   */
  public getDeadCount(): number {
    return this.deadParticles.length;
  }
  
  /**
   * Get total particle capacity
   */
  public getCapacity(): number {
    return this.capacity;
  }
  
  /**
   * Reduce particle count by percentage (for performance mode)
   * @param percentage Percentage to reduce (0-1)
   */
  public reduceParticleCount(percentage: number): void {
    const countToRemove = Math.floor(this.activeParticles.length * percentage);
    
    for (let i = 0; i < countToRemove; i++) {
      if (this.activeParticles.length > 0) {
        const idx = this.activeParticles[0];
        this.releaseParticle(idx);
      }
    }
  }
  
  /**
   * Set SPS capacity (for performance mode)
   * @param newCapacity New capacity limit
   */
  public setCapacity(newCapacity: number): void {
    // Release particles beyond new capacity
    while (this.activeParticles.length > newCapacity) {
      const idx = this.activeParticles[0];
      this.releaseParticle(idx);
    }
  }
  
  /**
   * Update all particles (called each frame)
   * @param deltaTime Time since last frame in milliseconds
   * @param camera Optional camera for frustum culling
   */
  public update(deltaTime: number, camera?: BABYLON.Camera): void {
    const deltaSeconds = deltaTime / 1000;
    
    // Update each active particle
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const idx = this.activeParticles[i];
      const particle = this.particles[idx];
      
      // Update age
      particle.age += deltaTime;
      
      // Check lifetime expiration
      if (particle.age >= particle.lifetime) {
        this.releaseParticle(idx);
        continue;
      }
      
      // Apply velocity to position
      particle.position.x += particle.velocity.x * deltaSeconds;
      particle.position.y += particle.velocity.y * deltaSeconds;
      particle.position.z += particle.velocity.z * deltaSeconds;
      
      // Apply gravity after delay
      if (particle.age >= particle.gravityDelay) {
        particle.velocity.y -= this.gravity * deltaSeconds;
      }
      
      // Fade alpha in last 20% of lifetime
      const lifetimeProgress = particle.age / particle.lifetime;
      if (lifetimeProgress > PARTICLE_CONFIG.fadeStartPercent) {
        const fadeProgress = (lifetimeProgress - PARTICLE_CONFIG.fadeStartPercent) / 
                            (1 - PARTICLE_CONFIG.fadeStartPercent);
        particle.color.a = 1.0 - fadeProgress;
      }
    }
    
    // Perform frustum culling if enabled and camera provided
    if (camera && this.activeParticles.length > PARTICLE_CONFIG.frustumCullingThreshold) {
      this.cullOffscreenParticles(camera);
    }
    
    // Update SPS mesh (single call per frame)
    this.sps.setParticles();
  }
  
  /**
   * Cull off-screen particles for performance
   * @param camera Camera for frustum testing
   */
  private cullOffscreenParticles(camera: BABYLON.Camera): void {
    const startTime = performance.now();
    
    // Simplified frustum culling using bounding sphere test
    const maxViewDistance = 50; // Adjust based on game scale
    const fovMargin = 0.2; // Extra margin for FOV
    
    for (const idx of this.activeParticles) {
      const particle = this.particles[idx];
      const spsParticle = this.sps.particles[idx];
      
      // Calculate distance from camera
      const viewVector = particle.position.subtract(camera.position);
      const distance = viewVector.length();
      
      // Check if within view distance
      if (distance > maxViewDistance) {
        spsParticle.isVisible = false;
        continue;
      }
      
      // Check if within view angle
      const forward = camera.getForwardRay().direction;
      const angle = Math.acos(
        BABYLON.Vector3.Dot(viewVector.normalize(), forward)
      );
      
      const fov = camera.fov || Math.PI / 4;
      if (angle > fov / 2 + fovMargin) {
        spsParticle.isVisible = false;
      } else {
        spsParticle.isVisible = true;
      }
    }
    
    // Measure culling overhead
    const cullingTime = performance.now() - startTime;
    this.lastCullingTime = cullingTime;
    
    // Disable culling if overhead too high
    if (cullingTime > PARTICLE_CONFIG.maxCullingOverhead) {
      this.cullingEnabled = false;
      console.warn(`Frustum culling disabled: overhead ${cullingTime.toFixed(2)}ms > ${PARTICLE_CONFIG.maxCullingOverhead}ms`);
    }
  }
  
  /**
   * Emit particles in a radial explosion pattern
   * @param position Center position for emission
   * @param count Number of particles to emit
   * @param config Emission configuration
   * @returns Number of particles successfully emitted
   */
  public emitRadial(position: BABYLON.Vector3, count: number, config: EmissionConfig): number {
    let emitted = 0;
    
    for (let i = 0; i < count; i++) {
      const idx = this.acquireParticle();
      if (idx === null) {
        break; // Pool exhausted
      }
      
      const particle = this.particles[idx];
      
      // Reset particle properties
      particle.position.copyFrom(position);
      particle.lifetime = config.lifetime;
      particle.age = 0;
      particle.gravityDelay = config.gravityDelay;
      
      // Generate random radial direction
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
      
      particle.velocity.set(
        Math.cos(angle) * Math.cos(elevation) * config.speed,
        Math.sin(elevation) * config.speed,
        Math.sin(angle) * Math.cos(elevation) * config.speed
      );
      
      // Apply color with variation
      if (config.applyColorVariation !== false) {
        particle.color = this.applyColorVariation(config.color, idx);
      } else {
        particle.color = config.color.clone();
      }
      
      emitted++;
    }
    
    return emitted;
  }
  
  /**
   * Emit particles in a downward pattern
   * @param position Center position for emission
   * @param count Number of particles to emit
   * @param config Emission configuration
   * @returns Number of particles successfully emitted
   */
  public emitDownward(position: BABYLON.Vector3, count: number, config: EmissionConfig): number {
    let emitted = 0;
    
    for (let i = 0; i < count; i++) {
      const idx = this.acquireParticle();
      if (idx === null) {
        break; // Pool exhausted
      }
      
      const particle = this.particles[idx];
      
      // Reset particle properties
      particle.position.copyFrom(position);
      particle.lifetime = config.lifetime;
      particle.age = 0;
      particle.gravityDelay = config.gravityDelay;
      
      // Generate downward velocity with slight horizontal spread
      const spreadX = (Math.random() - 0.5) * config.speed * 0.3;
      const spreadZ = (Math.random() - 0.5) * config.speed * 0.3;
      
      particle.velocity.set(
        spreadX,
        -config.speed,
        spreadZ
      );
      
      // Apply color with variation (only for confetti)
      if (config.applyColorVariation !== false) {
        particle.color = this.applyColorVariation(config.color, idx);
      } else {
        particle.color = config.color.clone();
      }
      
      emitted++;
    }
    
    return emitted;
  }
  
  /**
   * Apply color variation to base color
   * @param baseColor Base color
   * @param particleIdx Particle index for deterministic randomness
   * @returns Varied color
   */
  private applyColorVariation(baseColor: BABYLON.Color4, particleIdx: number): BABYLON.Color4 {
    // Deterministic pseudo-random based on particle index
    const seed1 = this.pseudoRandom(particleIdx * 12345);
    const seed2 = this.pseudoRandom(particleIdx * 12345 + 1);
    
    // Convert RGB to HSV
    const hsv = this.rgbToHsv(baseColor);
    
    // Apply hue variation (±15 degrees)
    const hueVariation = (seed1 - 0.5) * 2 * PARTICLE_CONFIG.colorVariation.hue;
    hsv.h = (hsv.h + hueVariation + 360) % 360;
    
    // Apply brightness variation (±20%)
    const brightnessVariation = (seed2 - 0.5) * 2 * PARTICLE_CONFIG.colorVariation.brightness;
    hsv.v = Math.max(0, Math.min(1, hsv.v + brightnessVariation));
    
    // Convert back to RGB
    const variedColor = this.hsvToRgb(hsv);
    variedColor.a = baseColor.a;
    
    return variedColor;
  }
  
  /**
   * Pseudo-random number generator (deterministic)
   * @param seed Seed value
   * @returns Random number between 0 and 1
   */
  private pseudoRandom(seed: number): number {
    // Linear congruential generator
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    const result = (a * seed + c) % m;
    return result / m;
  }
  
  /**
   * Convert RGB to HSV
   */
  private rgbToHsv(color: BABYLON.Color4): { h: number; s: number; v: number } {
    const r = color.r;
    const g = color.g;
    const b = color.b;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : delta / max;
    const v = max;
    
    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6;
      } else {
        h = ((r - g) / delta + 4) / 6;
      }
    }
    
    return { h: h * 360, s, v };
  }
  
  /**
   * Convert HSV to RGB
   */
  private hsvToRgb(hsv: { h: number; s: number; v: number }): BABYLON.Color4 {
    const h = hsv.h / 360;
    const s = hsv.s;
    const v = hsv.v;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    let r = 0, g = 0, b = 0;
    
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    
    return new BABYLON.Color4(r, g, b, 1);
  }
  
  /**
   * Emit particles in a fire effect pattern
   * @param position Center position for emission
   * @param count Number of particles to emit
   * @param config Emission configuration
   * @returns Number of particles successfully emitted
   */
  public emitFire(position: BABYLON.Vector3, count: number, config: EmissionConfig): number {
    let emitted = 0;
    
    for (let i = 0; i < count; i++) {
      const idx = this.acquireParticle();
      if (idx === null) {
        break; // Pool exhausted
      }
      
      const particle = this.particles[idx];
      
      // Reset particle properties
      particle.position.copyFrom(position);
      particle.lifetime = config.lifetime;
      particle.age = 0;
      particle.gravityDelay = config.gravityDelay;
      
      // Generate upward velocity with slight horizontal spread
      const spreadX = (Math.random() - 0.5) * config.speed * 0.4;
      const spreadZ = (Math.random() - 0.5) * config.speed * 0.4;
      const upwardSpeed = config.speed * (0.8 + Math.random() * 0.4); // 80-120% of base speed
      
      particle.velocity.set(
        spreadX,
        upwardSpeed,
        spreadZ
      );
      
      // Fire color gradient: red -> orange -> yellow
      const colorPhase = Math.random();
      let fireColor: BABYLON.Color4;
      
      if (colorPhase < 0.33) {
        // Red
        fireColor = new BABYLON.Color4(1.0, 0.2, 0.0, 1.0);
      } else if (colorPhase < 0.66) {
        // Orange
        fireColor = new BABYLON.Color4(1.0, 0.5, 0.0, 1.0);
      } else {
        // Yellow
        fireColor = new BABYLON.Color4(1.0, 0.8, 0.0, 1.0);
      }
      
      particle.color = fireColor;
      
      emitted++;
    }
    
    return emitted;
  }
  
  /**
   * Emit particles in a smoke effect pattern
   * @param position Center position for emission
   * @param count Number of particles to emit
   * @param config Emission configuration
   * @returns Number of particles successfully emitted
   */
  public emitSmoke(position: BABYLON.Vector3, count: number, config: EmissionConfig): number {
    let emitted = 0;
    
    for (let i = 0; i < count; i++) {
      const idx = this.acquireParticle();
      if (idx === null) {
        break; // Pool exhausted
      }
      
      const particle = this.particles[idx];
      
      // Reset particle properties
      particle.position.copyFrom(position);
      particle.lifetime = config.lifetime;
      particle.age = 0;
      particle.gravityDelay = 999999; // No gravity for smoke
      
      // Generate slow upward velocity with horizontal drift
      const driftX = (Math.random() - 0.5) * config.speed * 0.6;
      const driftZ = (Math.random() - 0.5) * config.speed * 0.6;
      const upwardSpeed = config.speed * 0.3; // Slow rise
      
      particle.velocity.set(
        driftX,
        upwardSpeed,
        driftZ
      );
      
      // Smoke color: gray to white gradient
      const grayValue = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
      particle.color = new BABYLON.Color4(grayValue, grayValue, grayValue, 0.6);
      
      emitted++;
    }
    
    return emitted;
  }
  
  /**
   * Emit particles in a star effect pattern
   * @param position Center position for emission
   * @param count Number of particles to emit
   * @param config Emission configuration
   * @returns Number of particles successfully emitted
   */
  public emitStars(position: BABYLON.Vector3, count: number, config: EmissionConfig): number {
    let emitted = 0;
    
    for (let i = 0; i < count; i++) {
      const idx = this.acquireParticle();
      if (idx === null) {
        break; // Pool exhausted
      }
      
      const particle = this.particles[idx];
      
      // Reset particle properties
      particle.position.copyFrom(position);
      particle.lifetime = config.lifetime;
      particle.age = 0;
      particle.gravityDelay = config.gravityDelay;
      
      // Generate radial direction with consistent speed
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI * 0.3; // Less vertical spread
      
      particle.velocity.set(
        Math.cos(angle) * Math.cos(elevation) * config.speed,
        Math.sin(elevation) * config.speed * 0.5, // Less vertical movement
        Math.sin(angle) * Math.cos(elevation) * config.speed
      );
      
      // Bright, saturated colors for stars
      const starColors = [
        new BABYLON.Color4(1.0, 1.0, 0.0, 1.0),  // Yellow
        new BABYLON.Color4(0.0, 1.0, 1.0, 1.0),  // Cyan
        new BABYLON.Color4(1.0, 0.0, 1.0, 1.0),  // Magenta
        new BABYLON.Color4(1.0, 0.5, 0.0, 1.0),  // Orange
        new BABYLON.Color4(0.5, 0.0, 1.0, 1.0),  // Purple
      ];
      
      particle.color = starColors[Math.floor(Math.random() * starColors.length)];
      
      emitted++;
    }
    
    return emitted;
  }
  
  /**
   * Emit particles in a spiral effect pattern
   * @param position Center position for emission
   * @param count Number of particles to emit
   * @param config Emission configuration
   * @returns Number of particles successfully emitted
   */
  public emitSpiral(position: BABYLON.Vector3, count: number, config: EmissionConfig): number {
    let emitted = 0;
    const angleStep = (Math.PI * 2) / count; // Distribute evenly in spiral
    
    for (let i = 0; i < count; i++) {
      const idx = this.acquireParticle();
      if (idx === null) {
        break; // Pool exhausted
      }
      
      const particle = this.particles[idx];
      
      // Reset particle properties
      particle.position.copyFrom(position);
      particle.lifetime = config.lifetime;
      particle.age = 0;
      particle.gravityDelay = config.gravityDelay;
      
      // Generate spiral trajectory
      const angle = i * angleStep;
      const radius = config.speed;
      const spiralSpeed = 0.5; // Rotation speed
      
      // Initial velocity in spiral direction
      particle.velocity.set(
        Math.cos(angle) * radius,
        config.speed * 0.3, // Upward component
        Math.sin(angle) * radius
      );
      
      // Rainbow colors based on position in spiral
      const hue = (i / count) * 360;
      const hsv = { h: hue, s: 1.0, v: 1.0 };
      particle.color = this.hsvToRgb(hsv);
      
      emitted++;
    }
    
    return emitted;
  }
  
  /**
   * Emit particles in a lightning effect pattern
   * @param position Center position for emission
   * @param count Number of particles to emit
   * @param config Emission configuration
   * @returns Number of particles successfully emitted
   */
  public emitLightning(position: BABYLON.Vector3, count: number, config: EmissionConfig): number {
    let emitted = 0;
    
    for (let i = 0; i < count; i++) {
      const idx = this.acquireParticle();
      if (idx === null) {
        break; // Pool exhausted
      }
      
      const particle = this.particles[idx];
      
      // Reset particle properties
      particle.position.copyFrom(position);
      particle.lifetime = config.lifetime * 0.5; // Shorter lifetime for lightning
      particle.age = 0;
      particle.gravityDelay = 999999; // No gravity
      
      // Generate fast, erratic zigzag movement
      const direction = Math.random() < 0.5 ? 1 : -1;
      const zigzagX = direction * config.speed * (2 + Math.random() * 2);
      const zigzagY = (Math.random() - 0.5) * config.speed * 0.5;
      const zigzagZ = (Math.random() - 0.5) * config.speed * 0.5;
      
      particle.velocity.set(
        zigzagX,
        zigzagY,
        zigzagZ
      );
      
      // Lightning colors: white to electric blue
      const blueIntensity = Math.random();
      particle.color = new BABYLON.Color4(
        0.8 + blueIntensity * 0.2,  // R: 0.8-1.0
        0.8 + blueIntensity * 0.2,  // G: 0.8-1.0
        1.0,                         // B: 1.0 (full blue)
        1.0
      );
      
      emitted++;
    }
    
    return emitted;
  }
  
  /**
   * Dispose the particle system
   */
  public dispose(): void {
    this.sps.dispose();
    this.particles = [];
    this.deadParticles = [];
    this.activeParticles = [];
  }
}
