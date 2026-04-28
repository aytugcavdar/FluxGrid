# Design Document: Advanced Animation Juice Effects

## Overview

This feature enhances the visual feedback and game feel of the Babylon.js-based 10x10 block puzzle game by adding advanced particle effects and mesh deformations. The system integrates seamlessly with existing animation infrastructure (ParticlePoolManager, SPSParticlePoolManager, KineticAnimationController, PlacementImpactSystem, LineClearAnimationSystem, ComboMilestoneSystem) while respecting quality presets and accessibility preferences.

### Key Enhancements

1. **Dust Particles on Placement**: Ground impact debris that scales with drop height
2. **Colorful Trail Particles**: Dynamic trails during high combo chains (5+)
3. **Dramatic Explosion Patterns**: Radial particle bursts on line clears with secondary bursts for 3+ lines
4. **Icy Particles**: Crystalline effects for ice block destruction
5. **Ripple Effect**: Wave-like mesh deformation propagating from placement impact
6. **Implode Animation**: Blocks collapse inward with rotation before disappearing
7. **Grid Pulse**: Synchronized scale animation of all filled cells during combos

### Design Principles

- **Performance First**: All effects use object pooling and respect quality presets (high 1.0x, medium 0.6x, low 0.4x)
- **Accessibility**: Full support for reduced motion preferences with graceful degradation
- **Integration**: Leverages existing systems without disrupting current functionality
- **Scalability**: Adaptive quality system automatically reduces effects when frame rate drops

## Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Grid Component                            │
│  (Babylon.js Scene, Camera, Render Loop)                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──────────────────────────────────────────────────┐
             │                                                   │
             ▼                                                   ▼
┌────────────────────────────┐                  ┌────────────────────────────┐
│  AnimationCoordinator      │                  │  Performance Systems       │
│  - Central coordination    │◄─────────────────┤  - PerformanceMonitor     │
│  - Quality management      │                  │  - AdaptiveQualitySystem  │
│  - Reduced motion support  │                  │  - BatterySaverManager    │
└────────────┬───────────────┘                  └────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┬──────────────┐
             │              │              │              │              │
             ▼              ▼              ▼              ▼              ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Placement        │ │ LineClear    │ │ Combo        │ │ Kinetic      │ │ NEW:         │
│ ImpactSystem     │ │ Animation    │ │ Milestone    │ │ Animation    │ │ JuiceEffects │
│                  │ │ System       │ │ System       │ │ Controller   │ │ Manager      │
│ - Scale anim     │ │ - Flash      │ │ - Milestone  │ │ - Squash     │ │ - Dust       │
│ - Haptics        │ │ - Cascade    │ │   flash      │ │ - Stretch    │ │ - Ripple     │
│ - Audio          │ │ - Rainbow    │ │ - Particles  │ │ - Trails     │ │ - Implode    │
│ + Dust particles │ │ + Explosion  │ │ + Grid pulse │ │ + Trail FX   │ │ - Grid pulse │
└──────────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
             │              │              │              │              │
             └──────────────┴──────────────┴──────────────┴──────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────┐
                        │  Particle & Mesh Systems        │
                        ├─────────────────────────────────┤
                        │  - SPSParticlePoolManager       │
                        │  - ParticlePoolManager          │
                        │  - ParticleEmitter              │
                        │  - TrailMeshManager             │
                        │  - MeshDeformationManager (NEW) │
                        └─────────────────────────────────┘
```


### Integration Points

1. **PlacementImpactSystem**: Triggers dust particles after scale animation starts
2. **KineticAnimationController**: Manages trail particles alongside existing trail system
3. **LineClearAnimationSystem**: Triggers explosion particles before flash effect
4. **ComboMilestoneSystem**: Coordinates grid pulse when combo milestones reached
5. **SPSParticlePoolManager**: Renders all particles in single draw call
6. **AnimationCoordinator**: Central quality and reduced motion management

## Components and Interfaces

### 1. JuiceEffectsManager (NEW)

Central manager for all new juice effects. Coordinates particle emissions and mesh deformations.

```typescript
interface JuiceEffectsConfig {
  scene: BABYLON.Scene;
  particlePoolManager: ParticlePoolManager;
  spsParticleManager: SPSParticlePoolManager;
  qualityPreset: 'high' | 'medium' | 'low';
  prefersReducedMotion: boolean;
}

class JuiceEffectsManager {
  private scene: BABYLON.Scene;
  private particlePoolManager: ParticlePoolManager;
  private spsParticleManager: SPSParticlePoolManager;
  private meshDeformationManager: MeshDeformationManager;
  private qualityPreset: 'high' | 'medium' | 'low';
  private prefersReducedMotion: boolean;
  
  constructor(config: JuiceEffectsConfig);
  
  // Dust particles
  emitDustParticles(positions: BABYLON.Vector3[], dropHeight: number): void;
  
  // Trail particles
  enableTrailParticles(pieceId: string, mesh: BABYLON.Mesh, color: BABYLON.Color3, comboLevel: number): void;
  disableTrailParticles(pieceId: string): void;
  
  // Explosion particles
  emitExplosionParticles(positions: BABYLON.Vector3[], colors: BABYLON.Color3[], lineCount: number): void;
  
  // Icy particles
  emitIcyParticles(positions: BABYLON.Vector3[]): void;
  
  // Ripple effect
  triggerRippleEffect(epicenter: BABYLON.Vector3, meshMap: Map<string, BABYLON.Mesh>, dropHeight: number): void;
  
  // Implode animation
  triggerImplodeAnimation(meshes: BABYLON.Mesh[], lineIndices: number[]): void;
  
  // Grid pulse
  startGridPulse(meshMap: Map<string, BABYLON.Mesh>, comboLevel: number): void;
  stopGridPulse(): void;
  
  // Configuration
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void;
  setReducedMotion(enabled: boolean): void;
  
  // Update loop
  update(deltaTime: number): void;
  
  // Cleanup
  dispose(): void;
}
```

### 2. MeshDeformationManager (NEW)

Manages all mesh deformation effects (ripple, implode, grid pulse).

```typescript
interface RippleConfig {
  propagationSpeed: number;      // 8 grid units/second
  amplitudeDistance1: number;    // 1.08
  amplitudeDistance2: number;    // 1.04
  duration: number;              // 200ms per wave
  easingFunction: (t: number) => number;
}

interface ImplodeConfig {
  duration: number;              // 300ms
  rotationDegrees: number;       // 180 degrees
  emissiveBoost: number;         // 2.5
  staggerPerBlock: number;       // 30ms
  staggerPerLine: number;        // 50ms
  easingFunction: (t: number) => number;
}

interface GridPulseConfig {
  scaleAmplitude: number;        // 1.05
  duration: number;              // 400ms
  frequency: number;             // 1-2 pulses/second
  easingFunction: (t: number) => number;
}

class MeshDeformationManager {
  private scene: BABYLON.Scene;
  private activeRipples: Map<string, RippleAnimation>;
  private activeImplodes: Map<string, ImplodeAnimation>;
  private gridPulseState: GridPulseState | null;
  private qualityPreset: 'high' | 'medium' | 'low';
  private prefersReducedMotion: boolean;
  
  constructor(scene: BABYLON.Scene, qualityPreset: 'high' | 'medium' | 'low', prefersReducedMotion: boolean);
  
  // Ripple effect
  triggerRipple(epicenter: BABYLON.Vector3, meshMap: Map<string, BABYLON.Mesh>, dropHeight: number): void;
  
  // Implode animation
  triggerImplode(meshes: BABYLON.Mesh[], lineIndices: number[]): void;
  
  // Grid pulse
  startPulse(meshMap: Map<string, BABYLON.Mesh>, comboLevel: number): void;
  stopPulse(): void;
  
  // Update loop
  update(deltaTime: number): void;
  
  // Configuration
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void;
  setReducedMotion(enabled: boolean): void;
  
  // Cleanup
  dispose(): void;
}
```


### 3. Enhanced ParticleEmitter

Extends existing ParticleEmitter with new emission patterns.

```typescript
interface DustEmissionConfig {
  position: BABYLON.Vector3;
  dropHeight: number;
  qualityMultiplier: number;
}

interface TrailEmissionConfig {
  position: BABYLON.Vector3;
  color: BABYLON.Color3;
  comboLevel: number;
  emissionRate: number;  // 3 particles per 100ms
}

interface ExplosionEmissionConfig {
  position: BABYLON.Vector3;
  color: BABYLON.Color3;
  lineCount: number;
  isSecondaryBurst: boolean;
}

interface IcyEmissionConfig {
  position: BABYLON.Vector3;
  count: number;  // 10 per ice block
}

// Extend existing ParticleEmitter class
class ParticleEmitter {
  // ... existing methods ...
  
  // NEW: Dust particles
  emitDust(config: DustEmissionConfig): void;
  
  // NEW: Trail particles
  emitTrail(config: TrailEmissionConfig): void;
  
  // NEW: Explosion particles
  emitExplosion(config: ExplosionEmissionConfig): void;
  
  // NEW: Icy particles
  emitIcy(config: IcyEmissionConfig): void;
}
```

### 4. Integration with Existing Systems

#### PlacementImpactSystem Enhancement

```typescript
class PlacementImpactSystem {
  // ... existing code ...
  
  private juiceEffectsManager?: JuiceEffectsManager;
  
  setJuiceEffectsManager(manager: JuiceEffectsManager): void {
    this.juiceEffectsManager = manager;
  }
  
  trigger(cellIds: string[], meshMap: Map<string, BABYLON.Mesh>, dropHeight: number): void {
    // 1. Existing scale animation
    this.animateScale(cellIds, meshMap);
    
    // 2. NEW: Dust particles (if not reduced motion)
    if (this.juiceEffectsManager && !this.prefersReducedMotion) {
      const positions = cellIds.map(id => meshMap.get(id)?.position).filter(Boolean);
      this.juiceEffectsManager.emitDustParticles(positions, dropHeight);
    }
    
    // 3. NEW: Ripple effect
    if (this.juiceEffectsManager) {
      const epicenter = this.calculateEpicenter(cellIds, meshMap);
      this.juiceEffectsManager.triggerRippleEffect(epicenter, meshMap, dropHeight);
    }
    
    // 4. Existing haptic feedback
    this.hapticManager.play('placement');
  }
}
```

#### KineticAnimationController Enhancement

```typescript
class KineticAnimationController {
  // ... existing code ...
  
  private juiceEffectsManager?: JuiceEffectsManager;
  
  setJuiceEffectsManager(manager: JuiceEffectsManager): void {
    this.juiceEffectsManager = manager;
  }
  
  enableTrail(pieceId: string, generator: BABYLON.Mesh, color: BABYLON.Color3, comboLevel: number): void {
    // Existing trail logic
    if (this.trailManager && comboLevel >= this.config.trailMinCombo) {
      this.trailManager.createTrail(pieceId, generator, trailConfig);
    }
    
    // NEW: Trail particles (if combo >= 5)
    if (this.juiceEffectsManager && comboLevel >= 5) {
      this.juiceEffectsManager.enableTrailParticles(pieceId, generator, color, comboLevel);
    }
  }
  
  disableTrail(pieceId: string): void {
    // Existing trail disposal
    if (this.trailManager) {
      this.trailManager.disposeTrail(pieceId);
    }
    
    // NEW: Disable trail particles
    if (this.juiceEffectsManager) {
      this.juiceEffectsManager.disableTrailParticles(pieceId);
    }
  }
}
```

#### LineClearAnimationSystem Enhancement

```typescript
class LineClearAnimationSystem {
  // ... existing code ...
  
  private juiceEffectsManager?: JuiceEffectsManager;
  
  setJuiceEffectsManager(manager: JuiceEffectsManager): void {
    this.juiceEffectsManager = manager;
  }
  
  triggerLineClear(params: LineClearParams): void {
    const lineCount = params.clearedLines.length;
    
    // NEW: Explosion particles (before flash)
    if (this.juiceEffectsManager) {
      this.juiceEffectsManager.emitExplosionParticles(
        params.cellPositions,
        params.cellColors,
        lineCount
      );
    }
    
    // NEW: Icy particles (if ice blocks present)
    if (this.juiceEffectsManager && params.hasIceBlocks) {
      this.juiceEffectsManager.emitIcyParticles(params.iceBlockPositions);
    }
    
    // Existing flash effect
    this.triggerFlashEffect(params.clearedLines, flashIntensity, now);
    
    // NEW: Implode animation (replaces existing disposal)
    if (this.juiceEffectsManager) {
      this.juiceEffectsManager.triggerImplodeAnimation(params.clearedMeshes, params.clearedLines);
    }
    
    // Existing cascade animation
    this.triggerCascadeAnimation(params.clearedLines, now);
  }
}
```

#### ComboMilestoneSystem Enhancement

```typescript
class ComboMilestoneSystem {
  // ... existing code ...
  
  private juiceEffectsManager?: JuiceEffectsManager;
  
  setJuiceEffectsManager(manager: JuiceEffectsManager): void {
    this.juiceEffectsManager = manager;
  }
  
  checkAndTrigger(currentCombo: number): void {
    // Existing milestone logic
    const milestones = [5, 10, 15, 20];
    for (const milestone of milestones) {
      if (currentCombo >= milestone && this.lastMilestone < milestone) {
        this.triggerMilestone(milestone);
        this.lastMilestone = milestone;
      }
    }
    
    // NEW: Grid pulse (if combo >= 5)
    if (this.juiceEffectsManager) {
      if (currentCombo >= 5) {
        this.juiceEffectsManager.startGridPulse(this.meshMap, currentCombo);
      } else {
        this.juiceEffectsManager.stopGridPulse();
      }
    }
    
    // Reset when combo breaks
    if (currentCombo === 0) {
      this.lastMilestone = 0;
      if (this.juiceEffectsManager) {
        this.juiceEffectsManager.stopGridPulse();
      }
    }
  }
}
```


## Data Models

### Particle Configuration

```typescript
interface DustParticleConfig {
  baseCount: number;              // 8 particles
  minCount: number;               // 4 particles
  maxCount: number;               // 12 particles
  velocityMin: number;            // 150 units/s
  velocityMax: number;            // 300 units/s
  color: BABYLON.Color3;          // RGB(0.7, 0.7, 0.7)
  colorVariation: number;         // 0.2 (20%)
  lifetime: number;               // 400ms
  gravityDelay: number;           // 100ms
  fadeStartPercent: number;       // 0.8 (final 20%)
}

interface TrailParticleConfig {
  emissionRate: number;           // 3 particles per 100ms
  lifetime: number;               // 600ms
  configs: {
    low: {                        // Combo 5-7
      alpha: number;              // 0.5
      segments: number;           // 10
      emissive: number;           // 0.33
    };
    medium: {                     // Combo 8-10
      alpha: number;              // 0.7
      segments: number;           // 15
      emissive: number;           // 0.67
    };
    high: {                       // Combo 11+
      alpha: number;              // 0.9
      segments: number;           // 20
      emissive: number;           // 1.0
    };
  };
}

interface ExplosionParticleConfig {
  countPerLine: {
    single: number;               // 8 particles
    double: number;               // 12 particles
    triple: number;               // 16 particles
  };
  velocityMin: number;            // 400 units/s
  velocityMax: number;            // 600 units/s
  emissiveBoost: number;          // 1.5 (150%)
  lifetime: number;               // 800ms
  gravityDelay: number;           // 200ms
  secondaryBurst: {
    enabled: boolean;             // true for 3+ lines
    delay: number;                // 150ms
    countPercent: number;         // 0.5 (50% of primary)
  };
}

interface IcyParticleConfig {
  countPerBlock: number;          // 10 particles
  color: BABYLON.Color3;          // RGB(0.6, 0.8, 1.0)
  highlightColor: BABYLON.Color3; // RGB(1.0, 1.0, 1.0)
  velocityMin: number;            // 300 units/s
  velocityMax: number;            // 500 units/s
  emissiveIntensity: number;      // 0.8
  lifetime: number;               // 600ms
  gravityDelay: number;           // 150ms
  geometry: 'crystalline';        // Angular geometry
}
```

### Mesh Deformation Configuration

```typescript
interface RippleEffectConfig {
  maxDistance: number;            // 2 grid units
  propagationSpeed: number;       // 8 grid units/s
  amplitudes: {
    distance1: number;            // 1.08
    distance2: number;            // 1.04
  };
  duration: number;               // 200ms per wave
  easingFunction: string;         // 'easeOutSine'
  dropHeightBoost: {
    threshold: number;            // 5 units
    multiplier: number;           // 1.2 (20% increase)
  };
}

interface ImplodeAnimationConfig {
  scaleStart: number;             // 1.0
  scaleEnd: number;               // 0.0
  duration: number;               // 300ms
  rotationDegrees: number;        // 180
  emissiveStart: number;          // 1.0
  emissiveEnd: number;            // 2.5
  emissiveDuration: number;       // 150ms (first half)
  staggerPerBlock: number;        // 30ms
  staggerPerLine: number;         // 50ms
  easingFunction: string;         // 'easeInBack'
  overshootFactor: number;        // 1.7
}

interface GridPulseConfig {
  scaleMin: number;               // 1.0
  scaleMax: number;               // 1.05
  duration: number;               // 400ms
  easingFunction: string;         // 'easeInOutSine'
  frequencies: {
    low: number;                  // 1 pulse/s (combo 5-7)
    medium: number;               // 1.5 pulses/s (combo 8-10)
    high: number;                 // 2 pulses/s (combo 11+)
  };
  synchronize: boolean;           // true (all cells together)
}
```

### Quality Preset Multipliers

```typescript
interface QualityMultipliers {
  high: {
    particleCount: number;        // 1.0
    emissionRate: number;         // 1.0
    rippleAmplitude: number;      // 1.0
    pulseAmplitude: number;       // 1.0
    rippleDistance: number;       // 2 units
  };
  medium: {
    particleCount: number;        // 0.6
    emissionRate: number;         // 0.6
    rippleAmplitude: number;      // 0.7
    pulseAmplitude: number;       // 0.6 (1.03 scale)
    rippleDistance: number;       // 2 units
  };
  low: {
    particleCount: number;        // 0.4
    emissionRate: number;         // 0.4
    rippleAmplitude: number;      // 1.0 (no reduction)
    pulseAmplitude: number;       // 0.4 (1.02 scale)
    rippleDistance: number;       // 1 unit (no propagation)
  };
}

interface ReducedMotionMultipliers {
  dustParticles: number;          // 0 (disabled)
  trailParticles: number;         // 0 (disabled)
  explosionParticles: number;     // 0.3 (70% reduction)
  icyParticles: number;           // 0.3 (70% reduction)
  rippleAmplitude: number;        // 0.4 (60% reduction)
  implodeDuration: number;        // 0.5 (50% reduction to 150ms)
  gridPulse: number;              // 0 (disabled)
  maxAnimationDuration: number;   // 200ms
}
```

### Animation State Tracking

```typescript
interface RippleAnimation {
  epicenter: BABYLON.Vector3;
  affectedMeshes: Map<string, {
    mesh: BABYLON.Mesh;
    distance: number;
    originalScale: BABYLON.Vector3;
    targetAmplitude: number;
  }>;
  startTime: number;
  duration: number;
  isActive: boolean;
}

interface ImplodeAnimation {
  mesh: BABYLON.Mesh;
  startTime: number;
  duration: number;
  originalScale: BABYLON.Vector3;
  originalRotation: BABYLON.Vector3;
  originalEmissive: BABYLON.Color3;
  staggerDelay: number;
  isActive: boolean;
}

interface GridPulseState {
  affectedMeshes: Map<string, {
    mesh: BABYLON.Mesh;
    originalScale: BABYLON.Vector3;
  }>;
  frequency: number;
  lastPulseTime: number;
  isActive: boolean;
  comboLevel: number;
}

interface TrailParticleState {
  pieceId: string;
  mesh: BABYLON.Mesh;
  color: BABYLON.Color3;
  comboLevel: number;
  lastEmissionTime: number;
  isActive: boolean;
}
```


## Detailed Algorithms

### 1. Dust Particle Emission Algorithm

```
FUNCTION emitDustParticles(positions: Vector3[], dropHeight: number):
  // Calculate particle count based on drop height
  baseCount = 8
  countMultiplier = clamp(dropHeight / 10, 0.5, 1.5)  // 0.5x to 1.5x
  particleCount = clamp(baseCount * countMultiplier, 4, 12)
  
  // Apply quality multiplier
  particleCount = floor(particleCount * qualityMultiplier)
  
  // Skip if reduced motion
  IF prefersReducedMotion THEN
    RETURN
  END IF
  
  FOR EACH position IN positions DO
    FOR i = 0 TO particleCount DO
      // Acquire particle from pool
      particle = spsParticleManager.acquireParticle()
      IF particle IS NULL THEN
        BREAK  // Pool exhausted
      END IF
      
      // Set position
      particle.position = position.clone()
      
      // Set radial velocity (horizontal)
      angle = random(0, 2π)
      speed = random(150, 300)
      particle.velocity = Vector3(
        cos(angle) * speed,
        0,  // No vertical component initially
        sin(angle) * speed
      )
      
      // Set color with variation
      baseColor = Color3(0.7, 0.7, 0.7)
      variation = random(-0.2, 0.2)
      particle.color = Color4(
        clamp(baseColor.r + variation, 0, 1),
        clamp(baseColor.g + variation, 0, 1),
        clamp(baseColor.b + variation, 0, 1),
        1.0
      )
      
      // Set lifetime and gravity delay
      particle.lifetime = 400  // ms
      particle.gravityDelay = 100  // ms
      particle.age = 0
      particle.applyGravity = true
    END FOR
  END FOR
END FUNCTION
```

### 2. Trail Particle Emission Algorithm

```
FUNCTION enableTrailParticles(pieceId: string, mesh: Mesh, color: Color3, comboLevel: number):
  // Check combo threshold
  IF comboLevel < 5 THEN
    RETURN
  END IF
  
  // Skip if reduced motion
  IF prefersReducedMotion THEN
    RETURN
  END IF
  
  // Determine trail config based on combo level
  IF comboLevel >= 11 THEN
    config = trailConfigs.high  // alpha 0.9, 20 segments
  ELSE IF comboLevel >= 8 THEN
    config = trailConfigs.medium  // alpha 0.7, 15 segments
  ELSE
    config = trailConfigs.low  // alpha 0.5, 10 segments
  END IF
  
  // Apply quality multiplier to emission rate
  emissionRate = 3 * qualityMultiplier  // particles per 100ms
  
  // Create trail state
  trailState = {
    pieceId: pieceId,
    mesh: mesh,
    color: color,
    comboLevel: comboLevel,
    lastEmissionTime: now(),
    isActive: true
  }
  
  activeTrails.set(pieceId, trailState)
END FUNCTION

FUNCTION updateTrailParticles(deltaTime: number):
  currentTime = now()
  
  FOR EACH trailState IN activeTrails DO
    IF NOT trailState.isActive THEN
      CONTINUE
    END IF
    
    // Check if enough time has passed for next emission
    timeSinceLastEmission = currentTime - trailState.lastEmissionTime
    emissionInterval = 100 / (3 * qualityMultiplier)  // ms
    
    IF timeSinceLastEmission >= emissionInterval THEN
      // Emit particle at current mesh position
      particle = spsParticleManager.acquireParticle()
      IF particle IS NOT NULL THEN
        particle.position = trailState.mesh.position.clone()
        particle.velocity = Vector3.Zero()  // Stationary
        particle.color = Color4(
          trailState.color.r,
          trailState.color.g,
          trailState.color.b,
          config.alpha
        )
        particle.lifetime = 600  // ms
        particle.applyGravity = false
      END IF
      
      trailState.lastEmissionTime = currentTime
    END IF
  END FOR
END FUNCTION
```

### 3. Explosion Particle Emission Algorithm

```
FUNCTION emitExplosionParticles(positions: Vector3[], colors: Color3[], lineCount: number):
  // Determine particle count per block
  IF lineCount == 1 THEN
    particlesPerBlock = 8
  ELSE IF lineCount == 2 THEN
    particlesPerBlock = 12
  ELSE
    particlesPerBlock = 16
  END IF
  
  // Apply quality multiplier
  particlesPerBlock = floor(particlesPerBlock * qualityMultiplier)
  
  // Apply reduced motion multiplier
  IF prefersReducedMotion THEN
    particlesPerBlock = floor(particlesPerBlock * 0.3)  // 70% reduction
  END IF
  
  // Primary burst
  FOR i = 0 TO positions.length DO
    position = positions[i]
    color = colors[i]
    
    FOR j = 0 TO particlesPerBlock DO
      particle = spsParticleManager.acquireParticle()
      IF particle IS NULL THEN
        BREAK
      END IF
      
      // Set position
      particle.position = position.clone()
      
      // Set radial velocity
      angle = random(0, 2π)
      elevation = random(-π/4, π/4)
      speed = random(400, 600)
      
      particle.velocity = Vector3(
        cos(angle) * cos(elevation) * speed,
        sin(elevation) * speed,
        sin(angle) * cos(elevation) * speed
      )
      
      // Set color with emissive boost
      particle.color = Color4(
        color.r * 1.5,  // 150% emissive
        color.g * 1.5,
        color.b * 1.5,
        1.0
      )
      
      // Set lifetime and gravity
      particle.lifetime = 800  // ms
      particle.gravityDelay = 200  // ms
      particle.applyGravity = true
    END FOR
  END FOR
  
  // Secondary burst (if 3+ lines and not reduced motion)
  IF lineCount >= 3 AND NOT prefersReducedMotion THEN
    setTimeout(() => {
      secondaryCount = floor(particlesPerBlock * 0.5)
      
      FOR i = 0 TO positions.length DO
        position = positions[i]
        color = colors[i]
        
        FOR j = 0 TO secondaryCount DO
          particle = spsParticleManager.acquireParticle()
          IF particle IS NULL THEN
            BREAK
          END IF
          
          // Similar to primary burst but with different velocities
          // ... (same logic as primary)
        END FOR
      END FOR
    }, 150)  // 150ms delay
  END IF
END FUNCTION
```

### 4. Icy Particle Emission Algorithm

```
FUNCTION emitIcyParticles(positions: Vector3[]):
  particlesPerBlock = 10
  
  // Apply quality multiplier
  particlesPerBlock = floor(particlesPerBlock * qualityMultiplier)
  
  // Apply reduced motion multiplier
  IF prefersReducedMotion THEN
    particlesPerBlock = floor(particlesPerBlock * 0.3)  // 70% reduction
  END IF
  
  FOR EACH position IN positions DO
    FOR i = 0 TO particlesPerBlock DO
      particle = spsParticleManager.acquireParticle()
      IF particle IS NULL THEN
        BREAK
      END IF
      
      // Set position
      particle.position = position.clone()
      
      // Set radial velocity
      angle = random(0, 2π)
      elevation = random(-π/4, π/4)
      speed = random(300, 500)
      
      particle.velocity = Vector3(
        cos(angle) * cos(elevation) * speed,
        sin(elevation) * speed,
        sin(angle) * cos(elevation) * speed
      )
      
      // Set color (light blue with white highlights)
      IF random() < 0.3 THEN
        // White highlight (30% chance)
        particle.color = Color4(1.0, 1.0, 1.0, 1.0)
      ELSE
        // Light blue
        particle.color = Color4(0.6, 0.8, 1.0, 1.0)
      END IF
      
      // Set emissive intensity
      particle.emissiveIntensity = 0.8
      
      // Set lifetime and gravity
      particle.lifetime = 600  // ms
      particle.gravityDelay = 150  // ms
      particle.applyGravity = true
    END FOR
  END FOR
END FUNCTION
```


### 5. Ripple Effect Algorithm

```
FUNCTION triggerRippleEffect(epicenter: Vector3, meshMap: Map<string, Mesh>, dropHeight: number):
  // Calculate amplitude boost from drop height
  amplitudeBoost = dropHeight > 5 ? 1.2 : 1.0
  
  // Apply quality multiplier
  IF qualityPreset == 'medium' THEN
    amplitudeBoost *= 0.7  // 30% reduction
  END IF
  
  // Apply reduced motion multiplier
  IF prefersReducedMotion THEN
    amplitudeBoost *= 0.4  // 60% reduction
  END IF
  
  // Find affected meshes within 2 grid units
  affectedMeshes = new Map()
  
  FOR EACH (cellId, mesh) IN meshMap DO
    // Skip if mesh is currently animating
    IF isAnimating(mesh) THEN
      CONTINUE
    END IF
    
    // Calculate distance from epicenter
    distance = gridDistance(mesh.position, epicenter)
    
    // Check if within ripple range
    maxDistance = qualityPreset == 'low' ? 1 : 2
    IF distance <= maxDistance AND distance > 0 THEN
      // Calculate amplitude based on distance
      IF distance == 1 THEN
        amplitude = 1.08 * amplitudeBoost
      ELSE IF distance == 2 THEN
        amplitude = 1.04 * amplitudeBoost
      ELSE
        CONTINUE
      END IF
      
      affectedMeshes.set(cellId, {
        mesh: mesh,
        distance: distance,
        originalScale: mesh.scaling.clone(),
        targetAmplitude: amplitude
      })
    END IF
  END FOR
  
  // Create ripple animation
  rippleId = generateUniqueId()
  ripple = {
    epicenter: epicenter,
    affectedMeshes: affectedMeshes,
    startTime: now(),
    duration: 200,  // ms per wave
    isActive: true
  }
  
  activeRipples.set(rippleId, ripple)
  
  // Schedule ripple propagation
  propagationSpeed = 8  // grid units per second
  FOR EACH (cellId, data) IN affectedMeshes DO
    delay = (data.distance / propagationSpeed) * 1000  // Convert to ms
    
    setTimeout(() => {
      animateRippleWave(data.mesh, data.originalScale, data.targetAmplitude, 200)
    }, delay)
  END FOR
END FUNCTION

FUNCTION animateRippleWave(mesh: Mesh, originalScale: Vector3, amplitude: number, duration: number):
  startTime = now()
  
  FUNCTION updateRipple():
    elapsed = now() - startTime
    progress = min(elapsed / duration, 1.0)
    
    // Ease-out-sine timing function
    easedProgress = sin(progress * π / 2)
    
    // Scale up then down (0 → 1 → 0)
    IF progress < 0.5 THEN
      // Growing phase
      scale = 1.0 + (amplitude - 1.0) * (easedProgress * 2)
    ELSE
      // Shrinking phase
      scale = 1.0 + (amplitude - 1.0) * (2 - easedProgress * 2)
    END IF
    
    mesh.scaling = originalScale.scale(scale)
    
    IF progress < 1.0 THEN
      requestAnimationFrame(updateRipple)
    ELSE
      // Restore original scale
      mesh.scaling = originalScale
    END IF
  END FUNCTION
  
  requestAnimationFrame(updateRipple)
END FUNCTION
```

### 6. Implode Animation Algorithm

```
FUNCTION triggerImplodeAnimation(meshes: Mesh[], lineIndices: number[]):
  // Sort lines from top to bottom
  sortedLines = sort(lineIndices)
  
  // Calculate stagger delays
  FOR lineIndex = 0 TO sortedLines.length DO
    lineDelay = lineIndex * 50  // 50ms per line
    
    // Get meshes for this line
    lineMeshes = meshes.filter(m => m.lineIndex == sortedLines[lineIndex])
    
    // Sort meshes left to right
    sortedMeshes = sort(lineMeshes, by: position.x)
    
    FOR meshIndex = 0 TO sortedMeshes.length DO
      mesh = sortedMeshes[meshIndex]
      blockDelay = meshIndex * 30  // 30ms per block
      totalDelay = lineDelay + blockDelay
      
      // Determine animation parameters based on quality
      duration = 300  // ms
      rotation = 180  // degrees
      
      IF qualityPreset == 'medium' THEN
        rotation = 90  // degrees
      ELSE IF qualityPreset == 'low' THEN
        rotation = 0  // no rotation
        duration = 200  // ms
      END IF
      
      IF prefersReducedMotion THEN
        rotation = 0  // no rotation
        duration = 150  // ms
      END IF
      
      // Schedule implode animation
      setTimeout(() => {
        animateImplode(mesh, duration, rotation)
      }, totalDelay)
    END FOR
  END FOR
END FUNCTION

FUNCTION animateImplode(mesh: Mesh, duration: number, rotationDegrees: number):
  startTime = now()
  originalScale = mesh.scaling.clone()
  originalRotation = mesh.rotation.clone()
  originalEmissive = mesh.material.emissiveColor.clone()
  
  FUNCTION updateImplode():
    elapsed = now() - startTime
    progress = min(elapsed / duration, 1.0)
    
    // Ease-in-back timing function (with overshoot)
    IF prefersReducedMotion THEN
      easedProgress = progress  // Linear
    ELSE
      c1 = 1.70158
      c3 = c1 + 1
      easedProgress = c3 * progress^3 - c1 * progress^2
    END IF
    
    // Scale from 1.0 to 0.0
    scale = 1.0 - easedProgress
    mesh.scaling = originalScale.scale(scale)
    
    // Rotate
    IF rotationDegrees > 0 THEN
      rotation = rotationDegrees * (π / 180) * easedProgress
      mesh.rotation.y = originalRotation.y + rotation
    END IF
    
    // Increase emissive intensity (first half only)
    IF progress < 0.5 THEN
      emissiveProgress = progress * 2  // 0 to 1 over first half
      emissiveIntensity = 1.0 + (2.5 - 1.0) * emissiveProgress
      mesh.material.emissiveColor = originalEmissive.scale(emissiveIntensity)
    END IF
    
    IF progress < 1.0 THEN
      requestAnimationFrame(updateImplode)
    ELSE
      // Dispose mesh
      mesh.dispose()
    END IF
  END FUNCTION
  
  requestAnimationFrame(updateImplode)
END FUNCTION
```

### 7. Grid Pulse Algorithm

```
FUNCTION startGridPulse(meshMap: Map<string, Mesh>, comboLevel: number):
  // Skip if reduced motion
  IF prefersReducedMotion THEN
    RETURN
  END IF
  
  // Determine frequency based on combo level
  IF comboLevel >= 11 THEN
    frequency = 2.0  // pulses per second
  ELSE IF comboLevel >= 8 THEN
    frequency = 1.5
  ELSE
    frequency = 1.0
  END IF
  
  // Determine amplitude based on quality
  IF qualityPreset == 'high' THEN
    scaleMax = 1.05
  ELSE IF qualityPreset == 'medium' THEN
    scaleMax = 1.03
  ELSE
    scaleMax = 1.02
    frequency *= 0.5  // 50% frequency reduction
  END IF
  
  // Collect all filled grid cells
  affectedMeshes = new Map()
  FOR EACH (cellId, mesh) IN meshMap DO
    IF mesh.isVisible AND NOT isEmpty(cellId) THEN
      affectedMeshes.set(cellId, {
        mesh: mesh,
        originalScale: mesh.scaling.clone()
      })
    END IF
  END FOR
  
  // Create pulse state
  gridPulseState = {
    affectedMeshes: affectedMeshes,
    frequency: frequency,
    lastPulseTime: now(),
    isActive: true,
    comboLevel: comboLevel
  }
END FUNCTION

FUNCTION updateGridPulse(deltaTime: number):
  IF gridPulseState IS NULL OR NOT gridPulseState.isActive THEN
    RETURN
  END IF
  
  currentTime = now()
  pulseInterval = 1000 / gridPulseState.frequency  // ms
  
  // Check if it's time for next pulse
  IF currentTime - gridPulseState.lastPulseTime >= pulseInterval THEN
    // Trigger synchronized pulse
    FOR EACH (cellId, data) IN gridPulseState.affectedMeshes DO
      animatePulse(data.mesh, data.originalScale, scaleMax, 400)
    END FOR
    
    gridPulseState.lastPulseTime = currentTime
  END IF
END FUNCTION

FUNCTION animatePulse(mesh: Mesh, originalScale: Vector3, scaleMax: number, duration: number):
  startTime = now()
  
  FUNCTION updatePulse():
    elapsed = now() - startTime
    progress = min(elapsed / duration, 1.0)
    
    // Ease-in-out-sine timing function
    easedProgress = -(cos(π * progress) - 1) / 2
    
    // Scale up then down (1.0 → scaleMax → 1.0)
    IF progress < 0.5 THEN
      // Growing phase
      scale = 1.0 + (scaleMax - 1.0) * (easedProgress * 2)
    ELSE
      // Shrinking phase
      scale = 1.0 + (scaleMax - 1.0) * (2 - easedProgress * 2)
    END IF
    
    mesh.scaling = originalScale.scale(scale)
    
    IF progress < 1.0 THEN
      requestAnimationFrame(updatePulse)
    ELSE
      // Restore original scale
      mesh.scaling = originalScale
    END IF
  END FUNCTION
  
  requestAnimationFrame(updatePulse)
END FUNCTION

FUNCTION stopGridPulse():
  IF gridPulseState IS NULL THEN
    RETURN
  END IF
  
  // Allow current pulse to complete, then stop
  gridPulseState.isActive = false
  
  // Restore all meshes to original scale after current pulse
  setTimeout(() => {
    FOR EACH (cellId, data) IN gridPulseState.affectedMeshes DO
      data.mesh.scaling = data.originalScale
    END FOR
    gridPulseState = null
  }, 400)  // Wait for pulse duration
END FUNCTION
```


### 8. Performance Optimization Algorithms

#### Adaptive Quality Reduction

```
FUNCTION monitorPerformance():
  targetFPS = getTargetFPS()  // 60 or 30 based on device
  consecutiveLowFrames = 0
  checkInterval = 1000  // Check every second
  
  setInterval(() => {
    currentFPS = engine.getFps()
    
    IF currentFPS < targetFPS * 0.9 THEN  // 10% tolerance
      consecutiveLowFrames++
    ELSE
      consecutiveLowFrames = 0
    END IF
    
    // If 3 consecutive seconds of low FPS, reduce quality
    IF consecutiveLowFrames >= 3 THEN
      reduceQuality()
      consecutiveLowFrames = 0
    END IF
  }, checkInterval)
END FUNCTION

FUNCTION reduceQuality():
  IF qualityPreset == 'high' THEN
    setQualityPreset('medium')
    console.log('Performance drop detected, reducing to medium quality')
  ELSE IF qualityPreset == 'medium' THEN
    setQualityPreset('low')
    console.log('Performance drop detected, reducing to low quality')
  ELSE
    // Already at lowest quality, disable some effects
    disableNonEssentialEffects()
  END IF
END FUNCTION

FUNCTION disableNonEssentialEffects():
  // Disable dust particles
  dustParticlesEnabled = false
  
  // Disable trail particles
  trailParticlesEnabled = false
  
  // Disable grid pulse
  stopGridPulse()
  
  // Reduce ripple distance to 0 (disable)
  rippleMaxDistance = 0
  
  console.log('Disabling non-essential effects for performance')
END FUNCTION
```

#### Particle Pool Management

```
FUNCTION manageParticlePools():
  // Set pool limits based on quality
  limits = {
    high: 200,
    medium: 120,
    low: 80
  }
  
  maxActiveParticles = limits[qualityPreset]
  
  // Check active particle count
  activeCount = spsParticleManager.getActiveCount()
  
  IF activeCount > maxActiveParticles THEN
    // Recycle oldest particles
    excessCount = activeCount - maxActiveParticles
    recycleOldestParticles(excessCount)
  END IF
END FUNCTION

FUNCTION recycleOldestParticles(count: number):
  // Get all active particles sorted by age
  activeParticles = spsParticleManager.getActiveParticles()
  sortedByAge = sort(activeParticles, by: age, descending: true)
  
  // Recycle the oldest ones
  FOR i = 0 TO min(count, sortedByAge.length) DO
    particle = sortedByAge[i]
    spsParticleManager.releaseParticle(particle.idx)
  END FOR
END FUNCTION
```

#### Frustum Culling for Mesh Deformations

```
FUNCTION updateMeshDeformations(deltaTime: number):
  camera = scene.activeCamera
  
  // Update ripples
  FOR EACH (rippleId, ripple) IN activeRipples DO
    FOR EACH (cellId, data) IN ripple.affectedMeshes DO
      // Skip if mesh is off-screen
      IF NOT isInFrustum(data.mesh, camera) THEN
        CONTINUE
      END IF
      
      // Update ripple animation
      updateRippleAnimation(data)
    END FOR
  END FOR
  
  // Update implodes
  FOR EACH (meshId, implode) IN activeImplodes DO
    // Skip if mesh is off-screen
    IF NOT isInFrustum(implode.mesh, camera) THEN
      CONTINUE
    END IF
    
    // Update implode animation
    updateImplodeAnimation(implode)
  END FOR
  
  // Grid pulse always updates (affects visible grid)
  updateGridPulse(deltaTime)
END FUNCTION

FUNCTION isInFrustum(mesh: Mesh, camera: Camera): boolean:
  // Simple bounding sphere test
  boundingSphere = mesh.getBoundingInfo().boundingSphere
  frustumPlanes = camera.getFrustumPlanes()
  
  FOR EACH plane IN frustumPlanes DO
    distance = plane.dotCoordinate(boundingSphere.center)
    IF distance < -boundingSphere.radius THEN
      RETURN false  // Outside frustum
    END IF
  END FOR
  
  RETURN true  // Inside frustum
END FUNCTION
```

### 9. Audio-Visual Synchronization Algorithm

```
FUNCTION synchronizeWithAudio(effectType: string, audioPlaybackTime: number):
  // Measure audio latency
  audioLatency = measureAudioLatency()  // Typically 20-50ms
  
  // Calculate visual effect delay to match audio
  visualDelay = audioPlaybackTime - audioLatency
  
  SWITCH effectType:
    CASE 'dust':
      setTimeout(() => {
        emitDustParticles(positions, dropHeight)
      }, visualDelay)
      
    CASE 'explosion':
      setTimeout(() => {
        emitExplosionParticles(positions, colors, lineCount)
      }, visualDelay)
      
    CASE 'icy':
      setTimeout(() => {
        emitIcyParticles(positions)
      }, visualDelay)
      
    CASE 'gridPulse':
      // Grid pulse should start with combo milestone audio
      setTimeout(() => {
        startGridPulse(meshMap, comboLevel)
      }, visualDelay)
      
    CASE 'ripple':
      // Ripple should start simultaneously with placement audio
      setTimeout(() => {
        triggerRippleEffect(epicenter, meshMap, dropHeight)
      }, visualDelay)
  END SWITCH
END FUNCTION

FUNCTION measureAudioLatency(): number:
  // Use Web Audio API to measure latency
  audioContext = getAudioContext()
  
  IF audioContext.outputLatency IS DEFINED THEN
    RETURN audioContext.outputLatency * 1000  // Convert to ms
  ELSE
    // Fallback: estimate based on buffer size
    bufferSize = audioContext.baseLatency || 0.02  // 20ms default
    RETURN bufferSize * 1000
  END IF
END FUNCTION

FUNCTION handleMutedAudio():
  // When audio is muted, continue visual effects without delay
  // Use same timing source (performance.now()) for consistency
  
  IF audioMuted THEN
    // Skip audio synchronization, trigger immediately
    visualDelay = 0
  ELSE
    // Normal synchronization
    visualDelay = calculateSyncDelay()
  END IF
  
  RETURN visualDelay
END FUNCTION
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several opportunities to consolidate redundant properties:

1. **Quality preset reductions** (1.6, 1.7, 2.8, 2.9, 3.8, 3.9, 4.9, 4.10, 5.7, 5.8, 6.8, 6.9, 7.9, 7.10) can be combined into a single property that tests the quality multiplier formula across all particle types and effects.

2. **Reduced motion reductions** (1.8, 2.10, 3.10, 4.11, 5.9, 6.10, 7.11, 10.1-10.5) can be combined into a single property that verifies reduced motion multipliers across all effects.

3. **Particle lifetime properties** (1.5, 2.7, 3.5, 4.6) can be combined into a single property that verifies all particles are recycled after their specified lifetime.

4. **Gravity delay properties** (1.9, 3.6, 4.7) can be combined into a single property that verifies gravity is applied after the specified delay for all particle types.

5. **Fade out properties** (1.10, 11.9) can be combined into a single property that verifies smooth alpha transitions for all particles.

6. **Integration timing properties** (9.1, 9.3, 9.5, 12.1-12.4, 12.8, 12.9) can be combined into properties that verify timing relationships between systems.

### Property 1: Dust Particle Emission Count Formula

*For any* piece placement with drop height H, the dust particle count shall be `clamp(8 * clamp(H/10, 0.5, 1.5), 4, 12)` before quality multiplier is applied.

**Validates: Requirements 1.1, 1.2**

### Property 2: Particle Velocity Ranges

*For any* emitted particle, the velocity magnitude shall be within the specified range for its type: dust (150-300), trail (0), explosion (400-600), icy (300-500) units per second.

**Validates: Requirements 1.3, 3.3, 4.4**

### Property 3: Dust Particle Color Variation

*For any* dust particle, the color shall be within 20% variation of base gray RGB(0.7, 0.7, 0.7), meaning each channel is in range [0.5, 0.9].

**Validates: Requirements 1.4**

### Property 4: Quality Preset Multiplier Formula

*For any* particle effect or mesh deformation, applying quality preset shall multiply counts/rates by: high=1.0, medium=0.6, low=0.4, and amplitudes by: high=1.0, medium=0.7, low=1.0 (except pulse which uses 0.6 and 0.4).

**Validates: Requirements 1.6, 1.7, 2.8, 2.9, 3.8, 3.9, 4.9, 4.10, 5.7, 5.8, 6.8, 6.9, 7.9, 7.10, 8.6**

### Property 5: Reduced Motion Disables Specific Effects

*For any* game state with reduced motion enabled, dust particles, trail particles, and grid pulse shall not be emitted or activated.

**Validates: Requirements 1.8, 2.10, 7.11, 10.1**

### Property 6: Reduced Motion Reduction Formula

*For any* explosion or icy particle emission with reduced motion enabled, the particle count shall be reduced by 70% (multiplied by 0.3).

**Validates: Requirements 3.10, 4.11, 10.2**

### Property 7: Reduced Motion Amplitude Reduction

*For any* ripple effect with reduced motion enabled, the amplitude shall be reduced by 60% (multiplied by 0.4).

**Validates: Requirements 5.9, 10.3**

### Property 8: Reduced Motion Duration Limits

*For any* animation with reduced motion enabled, the duration shall not exceed 200 milliseconds.

**Validates: Requirements 6.10, 10.4, 10.5**

### Property 9: Particle Lifetime Recycling

*For any* particle with lifetime L, the particle shall be recycled and returned to the pool after L milliseconds have elapsed since emission.

**Validates: Requirements 1.5, 2.7, 3.5, 4.6, 8.10**

### Property 10: Gravity Application Delay

*For any* particle with gravity delay D, gravity shall not be applied before D milliseconds have elapsed, and shall be applied after D milliseconds.

**Validates: Requirements 1.9, 3.6, 4.7**

### Property 11: Particle Fade Out Smoothness

*For any* particle in the final 20% of its lifetime, the alpha value shall decrease monotonically from 1.0 to 0.0.

**Validates: Requirements 1.10, 11.9**

### Property 12: Trail Particle Combo Threshold

*For any* falling piece, trail particles shall be emitted if and only if the combo level is 5 or higher.

**Validates: Requirements 2.1**

### Property 13: Trail Particle Color Matching

*For any* trail particle, the RGB color shall match the falling piece color exactly, with emissive intensity of 100%.

**Validates: Requirements 2.2**

### Property 14: Trail Particle Emission Rate

*For any* active trail, particles shall be emitted at a rate of 3 particles per 100 milliseconds (before quality multiplier).

**Validates: Requirements 2.3**

### Property 15: Trail Configuration by Combo Level

*For any* combo level C, the trail configuration shall be: C∈[5,7]→(alpha=0.5, segments=10), C∈[8,10]→(alpha=0.7, segments=15), C≥11→(alpha=0.9, segments=20).

**Validates: Requirements 2.4, 2.5, 2.6**

### Property 16: Trail Emission Stops After Combo End

*For any* active trail, when the combo chain ends, particle emission shall stop within 100 milliseconds.

**Validates: Requirements 2.11**

### Property 17: Explosion Particle Count by Line Count

*For any* line clear with L lines, the particle count per block shall be: L=1→8, L=2→12, L≥3→16 (before quality multiplier).

**Validates: Requirements 3.1, 3.2**

### Property 18: Explosion Particle Emissive Boost

*For any* explosion particle, the emissive intensity shall be 150% of the cleared block's base color.

**Validates: Requirements 3.4**

### Property 19: Secondary Burst Conditions

*For any* line clear with 3 or more lines, a secondary particle burst with 50% of primary count shall be emitted 150ms after primary burst, unless reduced motion is enabled.

**Validates: Requirements 3.7**

### Property 20: Icy Particle Count Per Block

*For any* ice block cleared, exactly 10 icy particles shall be emitted (before quality multiplier).

**Validates: Requirements 4.1, 4.2**

### Property 21: Icy Particle Color Distribution

*For any* icy particle emission, 30% of particles shall be white RGB(1.0, 1.0, 1.0) and 70% shall be light blue RGB(0.6, 0.8, 1.0).

**Validates: Requirements 4.3**

### Property 22: Icy Particle Emissive Intensity

*For any* icy particle, the emissive intensity shall be 80% (0.8).

**Validates: Requirements 4.5**

### Property 23: Ripple Effect Radius

*For any* placement, the ripple effect shall affect blocks within 2 grid units (or 1 grid unit for low quality preset).

**Validates: Requirements 5.1, 5.8**

### Property 24: Ripple Propagation Speed

*For any* ripple wave, the propagation speed shall be 8 grid units per second.

**Validates: Requirements 5.2**

### Property 25: Ripple Amplitude by Distance

*For any* ripple wave, the scale amplitude shall be 1.08 at distance 1 and 1.04 at distance 2 (before quality and drop height multipliers).

**Validates: Requirements 5.3**

### Property 26: Ripple Duration

*For any* ripple wave, the duration shall be 200 milliseconds.

**Validates: Requirements 5.4**

### Property 27: Ripple Easing Function

*For any* ripple wave, the scale interpolation shall use ease-out-sine timing function: `sin(t * π/2)`.

**Validates: Requirements 5.5**

### Property 28: Ripple Drop Height Boost

*For any* placement with drop height greater than 5 units, the ripple amplitude shall be increased by 20% (multiplied by 1.2).

**Validates: Requirements 5.6**

### Property 29: Ripple Animation Collision Avoidance

*For any* block currently animating, the ripple effect shall not be applied to that block.

**Validates: Requirements 5.10**

### Property 30: Implode Scale Animation

*For any* imploding block, the scale shall animate from 1.0 to 0.0 over the specified duration (300ms high/medium, 200ms low, 150ms reduced motion).

**Validates: Requirements 6.1, 6.2**

### Property 31: Implode Easing Function

*For any* imploding block without reduced motion, the scale interpolation shall use ease-in-back with overshoot factor 1.7. With reduced motion, linear interpolation shall be used.

**Validates: Requirements 6.3, 6.10**

### Property 32: Implode Rotation

*For any* imploding block, the rotation shall be: 180° (high quality), 90° (medium quality), 0° (low quality or reduced motion).

**Validates: Requirements 6.4, 6.8, 6.9**

### Property 33: Implode Emissive Boost

*For any* imploding block, the emissive intensity shall increase from 1.0 to 2.5 during the first 150 milliseconds.

**Validates: Requirements 6.5**

### Property 34: Implode Stagger Timing

*For any* line clear, implode animations shall stagger by 30ms per block (left to right) and 50ms per line (top to bottom).

**Validates: Requirements 6.6, 6.7**

### Property 35: Grid Pulse Combo Threshold

*For any* game state, grid pulse shall be active if and only if the combo level is 5 or higher and reduced motion is disabled.

**Validates: Requirements 7.1, 7.11**

### Property 36: Grid Pulse Scale Animation

*For any* grid pulse, cells shall scale from 1.0 to the maximum (1.05 high, 1.03 medium, 1.02 low) and back to 1.0 over 400 milliseconds.

**Validates: Requirements 7.2, 7.9, 7.10**

### Property 37: Grid Pulse Easing Function

*For any* grid pulse, the scale interpolation shall use ease-in-out-sine timing function: `-(cos(π*t) - 1) / 2`.

**Validates: Requirements 7.3**

### Property 38: Grid Pulse Frequency by Combo Level

*For any* combo level C, the pulse frequency shall be: C∈[5,7]→1 pulse/s, C∈[8,10]→1.5 pulses/s, C≥11→2 pulses/s (with 50% reduction for low quality).

**Validates: Requirements 7.4, 7.5, 7.6, 7.10**

### Property 39: Grid Pulse Synchronization

*For any* grid pulse, all affected cells shall pulse together with the same phase (synchronized timing).

**Validates: Requirements 7.7**

### Property 40: Grid Pulse Graceful Stop

*For any* active grid pulse, when the combo ends, the current pulse shall complete before stopping (no abrupt termination).

**Validates: Requirements 7.8**

### Property 41: Adaptive Quality Reduction

*For any* 3-second period where frame rate is below target, the quality preset shall be reduced by one level (high→medium→low).

**Validates: Requirements 8.3**

### Property 42: Particle Pool Existence

*For any* particle type (dust, trail, explosion, icy), an object pool shall exist with size scaled by quality preset.

**Validates: Requirements 8.4**

### Property 43: Particle Count Limits

*For any* quality preset, the total active particles shall not exceed: high=200, medium=120, low=80.

**Validates: Requirements 8.6**

### Property 44: Oldest Particle Recycling

*For any* situation where active particles exceed the limit, the oldest particles shall be recycled first.

**Validates: Requirements 8.7**

### Property 45: SPS Particle Manager Usage

*For any* particle rendering, the SPSParticlePoolManager shall be used to minimize draw calls to 1.

**Validates: Requirements 8.8**

### Property 46: Off-Screen Mesh Culling

*For any* mesh deformation update, meshes outside the camera frustum shall be skipped.

**Validates: Requirements 8.9**

### Property 47: Dust Emission Timing

*For any* placement, dust particles shall be emitted after the scale animation starts (not before).

**Validates: Requirements 9.1**

### Property 48: Trail Management Integration

*For any* trail particle system, the KineticAnimationController shall manage both mesh trails and particle trails.

**Validates: Requirements 9.2**

### Property 49: Explosion Timing Before Flash

*For any* line clear, explosion particles shall be emitted before the flash effect starts.

**Validates: Requirements 9.3**

### Property 50: Grid Pulse Coordination

*For any* combo milestone reached, the ComboMilestoneSystem shall coordinate the grid pulse activation.

**Validates: Requirements 9.4**

### Property 51: Ripple Non-Interference

*For any* placement, the ripple effect shall not interfere with the PlacementImpactSystem's scale animation timing.

**Validates: Requirements 9.5**

### Property 52: Implode Replaces Disposal

*For any* line clear, the implode animation shall replace immediate mesh disposal with animated disposal.

**Validates: Requirements 9.6**

### Property 53: Particle Manager Infrastructure Usage

*For any* new particle effect, it shall use the existing ParticlePoolManager or SPSParticlePoolManager infrastructure.

**Validates: Requirements 9.7**

### Property 54: Animation Utilities Usage

*For any* new mesh deformation, it shall use existing animation timing utilities from animationHelpers.

**Validates: Requirements 9.8**

### Property 55: Quality Preset Subscription

*For any* particle system or mesh deformation manager, it shall subscribe to quality preset changes from performance monitoring.

**Validates: Requirements 9.9**

### Property 56: Reduced Motion Subscription

*For any* particle system or mesh deformation manager, it shall subscribe to reduced motion preference changes.

**Validates: Requirements 9.10**

### Property 57: Reduced Motion Detection

*For any* system initialization, the reduced motion preference shall be detected from the browser's `prefers-reduced-motion` media query.

**Validates: Requirements 10.6**

### Property 58: Reduced Motion Manual Override

*For any* user settings change, the reduced motion preference shall be overridable manually in settings.

**Validates: Requirements 10.7**

### Property 59: Reduced Motion Update Timing

*For any* reduced motion preference change, the changes shall be applied to active effects within 100 milliseconds.

**Validates: Requirements 10.8**

### Property 60: Color Contrast with Background

*For any* particle effect, the color shall have sufficient contrast with the grid background RGB(0.05, 0.05, 0.15) using WCAG contrast ratio formula.

**Validates: Requirements 11.8**

### Property 61: Mesh Deformation State Restoration

*For any* mesh deformation (ripple, implode, pulse), the mesh shall return to its original transform state after the animation completes.

**Validates: Requirements 11.10**

### Property 62: Audio-Visual Synchronization Timing

*For any* particle effect triggered with audio, the visual effect shall account for audio latency (20-50ms) in timing calculations.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

### Property 63: Audio Mute Independence

*For any* particle effect, when audio is muted, the visual effect shall continue without timing adjustment.

**Validates: Requirements 12.6**

### Property 64: Shared Timing Source

*For any* audio-visual synchronization, both the particle system and audio system shall use the same timing source (performance.now()).

**Validates: Requirements 12.7**

### Property 65: Implode Completes Before Audio

*For any* line clear, the implode animation shall complete before the line clear audio finishes playing.

**Validates: Requirements 12.8**

### Property 66: Ripple Simultaneous with Audio

*For any* placement, the ripple effect shall start simultaneously with the placement audio (within latency tolerance).

**Validates: Requirements 12.9**

### Property 67: Trail Timing Independence

*For any* trail particle emission, the emission rate shall remain constant regardless of audio state (muted or playing).

**Validates: Requirements 12.10**


## Error Handling

### Particle Pool Exhaustion

**Scenario**: All particles in a pool are active when a new emission is requested.

**Handling**:
1. Log warning: `[ParticlePool] {type} pool exhausted`
2. Find oldest active particle using age comparison
3. Recycle oldest particle immediately
4. Reuse recycled particle for new emission
5. Continue normal operation without visual glitches

**Fallback**: If no particles can be recycled (all are critical), skip the emission silently.

### WebGL Context Loss

**Scenario**: Mobile device loses WebGL context due to memory pressure or backgrounding.

**Handling**:
1. Detect context loss via `webglcontextlost` event
2. Pause all active animations and particle emissions
3. Clear all animation state maps
4. Wait for context restoration via `webglcontextrestored` event
5. Reinitialize particle pools and mesh references
6. Resume normal operation

**Recovery**: All pools are recreated with same configuration. Active animations are not resumed (clean slate).

### Performance Degradation

**Scenario**: Frame rate drops below target for extended period.

**Handling**:
1. Monitor FPS every second via `engine.getFps()`
2. Track consecutive seconds below target (90% of target FPS)
3. After 3 consecutive seconds, trigger adaptive quality reduction
4. Reduce quality preset: high → medium → low
5. If already at low, disable non-essential effects (dust, trails, grid pulse)
6. Log quality changes for debugging

**Prevention**: Quality reduction is gradual and reversible if performance improves.

### Invalid Mesh References

**Scenario**: Mesh is disposed or invalid when animation tries to update it.

**Handling**:
1. Check `mesh.isDisposed()` before every transform update
2. If disposed, remove from active animation map immediately
3. Log warning: `[MeshDeformation] Mesh {id} was disposed during animation`
4. Continue with remaining valid meshes

**Prevention**: Use weak references where possible and validate before access.

### Timing Synchronization Failures

**Scenario**: Audio latency measurement fails or returns invalid value.

**Handling**:
1. Attempt to read `audioContext.outputLatency`
2. If undefined, fall back to `audioContext.baseLatency`
3. If both undefined, use default 30ms latency
4. Clamp latency to reasonable range [10ms, 100ms]
5. Log fallback usage for debugging

**Graceful Degradation**: Effects still play, just with estimated timing.

### Reduced Motion Preference Changes

**Scenario**: User changes reduced motion preference mid-game.

**Handling**:
1. Listen to `prefers-reduced-motion` media query changes
2. On change, update internal `prefersReducedMotion` flag
3. Stop all active animations that should be disabled
4. Apply new multipliers to ongoing effects within 100ms
5. Ensure no visual popping by completing current animation cycles

**Smooth Transition**: Effects fade out gracefully rather than stopping abruptly.

### Quality Preset Changes During Active Animations

**Scenario**: Quality preset changes while particles are emitting or meshes are deforming.

**Handling**:
1. Allow current animations to complete with original quality
2. Apply new quality multipliers to future emissions/animations
3. Adjust particle pool limits immediately
4. Recycle excess particles if new limit is lower
5. No visual discontinuity for active effects

**Consistency**: Each animation uses consistent quality throughout its lifetime.

### Combo Chain Interruption

**Scenario**: Combo chain ends abruptly (game over, pause, reset).

**Handling**:
1. Detect combo level change to 0
2. Stop trail particle emissions within 100ms
3. Allow grid pulse to complete current cycle
4. Clear all trail particle states
5. Reset combo milestone tracking

**Clean State**: No lingering effects after combo ends.

### Ice Block Detection Failure

**Scenario**: Ice block type is not properly detected during line clear.

**Handling**:
1. Check cell type explicitly: `cellType === CellType.ICE`
2. If type is undefined or invalid, treat as normal block
3. Log warning: `[JuiceEffects] Invalid cell type for ice detection`
4. Emit normal explosion particles instead of icy particles
5. Continue line clear animation normally

**Fallback**: Normal explosion particles provide visual feedback even if ice detection fails.


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, integration points, and error conditions
- **Property tests**: Verify universal properties across all inputs using randomization

Together, these approaches ensure both concrete correctness (unit tests) and general correctness (property tests).

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each test must reference its design document property
- Tag format: `Feature: advanced-animation-juice-effects, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check';

describe('Feature: advanced-animation-juice-effects', () => {
  it('Property 1: Dust Particle Emission Count Formula', () => {
    // Feature: advanced-animation-juice-effects, Property 1
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 20 }), // drop height
        (dropHeight) => {
          const baseCount = 8;
          const countMultiplier = Math.max(0.5, Math.min(1.5, dropHeight / 10));
          const expectedCount = Math.max(4, Math.min(12, baseCount * countMultiplier));
          
          const actualCount = calculateDustParticleCount(dropHeight);
          
          expect(actualCount).toBe(Math.floor(expectedCount));
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('Property 4: Quality Preset Multiplier Formula', () => {
    // Feature: advanced-animation-juice-effects, Property 4
    fc.assert(
      fc.property(
        fc.constantFrom('high', 'medium', 'low'),
        fc.constantFrom('dust', 'trail', 'explosion', 'icy'),
        (qualityPreset, particleType) => {
          const expectedMultipliers = {
            high: 1.0,
            medium: 0.6,
            low: 0.4
          };
          
          const baseCount = getBaseParticleCount(particleType);
          const actualCount = applyQualityMultiplier(baseCount, qualityPreset);
          const expectedCount = Math.floor(baseCount * expectedMultipliers[qualityPreset]);
          
          expect(actualCount).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('Property 9: Particle Lifetime Recycling', () => {
    // Feature: advanced-animation-juice-effects, Property 9
    fc.assert(
      fc.property(
        fc.constantFrom('dust', 'trail', 'explosion', 'icy'),
        fc.integer({ min: 100, max: 2000 }), // lifetime
        async (particleType, lifetime) => {
          const particle = emitParticle(particleType, { lifetime });
          const startTime = Date.now();
          
          // Wait for lifetime + small buffer
          await sleep(lifetime + 50);
          
          const isRecycled = particle.isDead || !particle.isActive;
          expect(isRecycled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Focus Areas

#### 1. Integration Points

```typescript
describe('PlacementImpactSystem Integration', () => {
  it('should emit dust particles after scale animation starts', () => {
    const system = new PlacementImpactSystem(scene, particlePool, hapticManager);
    const juiceManager = new JuiceEffectsManager(config);
    system.setJuiceEffectsManager(juiceManager);
    
    const emitSpy = jest.spyOn(juiceManager, 'emitDustParticles');
    const animateSpy = jest.spyOn(system as any, 'animateScale');
    
    system.trigger(['cell-0-0'], meshMap, 5);
    
    expect(animateSpy).toHaveBeenCalledBefore(emitSpy);
  });
  
  it('should trigger ripple effect on placement', () => {
    const system = new PlacementImpactSystem(scene, particlePool, hapticManager);
    const juiceManager = new JuiceEffectsManager(config);
    system.setJuiceEffectsManager(juiceManager);
    
    const rippleSpy = jest.spyOn(juiceManager, 'triggerRippleEffect');
    
    system.trigger(['cell-0-0'], meshMap, 5);
    
    expect(rippleSpy).toHaveBeenCalledWith(
      expect.any(BABYLON.Vector3),
      meshMap,
      5
    );
  });
});

describe('LineClearAnimationSystem Integration', () => {
  it('should emit explosion particles before flash effect', () => {
    const system = new LineClearAnimationSystem(scene, spsParticleManager);
    const juiceManager = new JuiceEffectsManager(config);
    system.setJuiceEffectsManager(juiceManager);
    
    const explosionSpy = jest.spyOn(juiceManager, 'emitExplosionParticles');
    const flashSpy = jest.spyOn(system as any, 'triggerFlashEffect');
    
    system.triggerLineClear(params);
    
    expect(explosionSpy).toHaveBeenCalledBefore(flashSpy);
  });
  
  it('should trigger implode animation for cleared blocks', () => {
    const system = new LineClearAnimationSystem(scene, spsParticleManager);
    const juiceManager = new JuiceEffectsManager(config);
    system.setJuiceEffectsManager(juiceManager);
    
    const implodeSpy = jest.spyOn(juiceManager, 'triggerImplodeAnimation');
    
    system.triggerLineClear(params);
    
    expect(implodeSpy).toHaveBeenCalledWith(
      params.clearedMeshes,
      params.clearedLines
    );
  });
});
```

#### 2. Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle particle pool exhaustion gracefully', () => {
    const manager = new SPSParticlePoolManager({ scene, capacity: 10 });
    
    // Exhaust pool
    for (let i = 0; i < 10; i++) {
      manager.acquireParticle();
    }
    
    // Try to acquire one more
    const particle = manager.acquireParticle();
    
    // Should recycle oldest
    expect(particle).not.toBeNull();
    expect(manager.getActiveCount()).toBe(10);
  });
  
  it('should handle zero drop height', () => {
    const count = calculateDustParticleCount(0);
    expect(count).toBeGreaterThanOrEqual(4); // Minimum
  });
  
  it('should handle very high drop height', () => {
    const count = calculateDustParticleCount(100);
    expect(count).toBeLessThanOrEqual(12); // Maximum
  });
  
  it('should handle disposed mesh during animation', () => {
    const mesh = createTestMesh();
    const manager = new MeshDeformationManager(scene, 'high', false);
    
    manager.triggerRipple(Vector3.Zero(), meshMap, 5);
    
    // Dispose mesh mid-animation
    mesh.dispose();
    
    // Should not throw
    expect(() => manager.update(16)).not.toThrow();
  });
  
  it('should handle combo level 0', () => {
    const manager = new JuiceEffectsManager(config);
    
    manager.startGridPulse(meshMap, 5);
    expect(manager.isGridPulseActive()).toBe(true);
    
    manager.startGridPulse(meshMap, 0);
    expect(manager.isGridPulseActive()).toBe(false);
  });
});
```

#### 3. Error Conditions

```typescript
describe('Error Handling', () => {
  it('should handle WebGL context loss', async () => {
    const manager = new JuiceEffectsManager(config);
    
    // Simulate context loss
    const canvas = scene.getEngine().getRenderingCanvas();
    const lostEvent = new Event('webglcontextlost');
    canvas?.dispatchEvent(lostEvent);
    
    // Should pause all animations
    expect(manager.isActive()).toBe(false);
    
    // Simulate context restoration
    const restoredEvent = new Event('webglcontextrestored');
    canvas?.dispatchEvent(restoredEvent);
    
    await sleep(100);
    
    // Should reinitialize
    expect(manager.isActive()).toBe(true);
  });
  
  it('should handle invalid audio latency', () => {
    const audioContext = {
      outputLatency: undefined,
      baseLatency: undefined
    };
    
    const latency = measureAudioLatency(audioContext);
    
    // Should use default
    expect(latency).toBe(30);
  });
  
  it('should handle quality preset change during animation', () => {
    const manager = new JuiceEffectsManager(config);
    
    manager.emitDustParticles([Vector3.Zero()], 5);
    
    // Change quality mid-emission
    manager.setQualityPreset('low');
    
    // Should not throw
    expect(() => manager.update(16)).not.toThrow();
  });
});
```

### Performance Testing

```typescript
describe('Performance', () => {
  it('should maintain 60 FPS with 200 active particles', () => {
    const manager = new SPSParticlePoolManager({ scene, capacity: 2000 });
    
    // Emit 200 particles
    for (let i = 0; i < 200; i++) {
      manager.emitRadial(Vector3.Zero(), 1, config);
    }
    
    const startTime = performance.now();
    const frames = 60;
    
    for (let i = 0; i < frames; i++) {
      manager.update(16);
    }
    
    const elapsed = performance.now() - startTime;
    const fps = (frames / elapsed) * 1000;
    
    expect(fps).toBeGreaterThanOrEqual(60);
  });
  
  it('should recycle particles when limit exceeded', () => {
    const manager = new JuiceEffectsManager(config);
    manager.setQualityPreset('high'); // 200 particle limit
    
    // Emit 250 particles
    for (let i = 0; i < 250; i++) {
      manager.emitDustParticles([Vector3.Zero()], 5);
    }
    
    const activeCount = manager.getActiveParticleCount();
    
    expect(activeCount).toBeLessThanOrEqual(200);
  });
});
```

### Accessibility Testing

```typescript
describe('Accessibility', () => {
  it('should disable dust particles with reduced motion', () => {
    const manager = new JuiceEffectsManager({ ...config, prefersReducedMotion: true });
    
    const emitSpy = jest.spyOn(manager as any, 'emitDustParticles');
    
    manager.emitDustParticles([Vector3.Zero()], 5);
    
    expect(manager.getActiveParticleCount()).toBe(0);
  });
  
  it('should reduce explosion particles by 70% with reduced motion', () => {
    const manager = new JuiceEffectsManager({ ...config, prefersReducedMotion: true });
    
    manager.emitExplosionParticles([Vector3.Zero()], [Color3.White()], 3);
    
    const expectedCount = Math.floor(16 * 0.3); // 70% reduction
    expect(manager.getActiveParticleCount()).toBe(expectedCount);
  });
  
  it('should limit animation duration to 200ms with reduced motion', () => {
    const manager = new MeshDeformationManager(scene, 'high', true);
    
    const mesh = createTestMesh();
    manager.triggerImplode([mesh], [0]);
    
    // Wait for animation
    await sleep(200);
    
    expect(mesh.isDisposed()).toBe(true);
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% line coverage
- **Property Test Coverage**: All 67 correctness properties must have corresponding property tests
- **Integration Test Coverage**: All 4 integration points (PlacementImpactSystem, KineticAnimationController, LineClearAnimationSystem, ComboMilestoneSystem)
- **Edge Case Coverage**: All identified edge cases in error handling section
- **Performance Test Coverage**: Frame rate targets for all quality presets


## Implementation Summary

### New Files to Create

1. **src/features/visual-effects/juice/JuiceEffectsManager.ts**
   - Central manager for all juice effects
   - Coordinates particle emissions and mesh deformations
   - Manages quality presets and reduced motion

2. **src/features/visual-effects/juice/MeshDeformationManager.ts**
   - Manages ripple, implode, and grid pulse effects
   - Handles mesh transform animations
   - Implements frustum culling for performance

3. **src/features/visual-effects/juice/config/juice.config.ts**
   - Configuration constants for all juice effects
   - Quality multipliers and reduced motion multipliers
   - Particle and deformation parameters

4. **src/features/visual-effects/juice/types.ts**
   - TypeScript interfaces for juice effects
   - Animation state types
   - Configuration types

5. **src/features/visual-effects/juice/utils/easingFunctions.ts**
   - Easing function implementations
   - ease-out-sine, ease-in-back, ease-in-out-sine
   - Reusable across all animations

6. **src/features/visual-effects/juice/utils/audioSync.ts**
   - Audio-visual synchronization utilities
   - Latency measurement
   - Timing coordination

### Files to Modify

1. **src/features/visual-effects/placement/PlacementImpactSystem.ts**
   - Add `setJuiceEffectsManager()` method
   - Integrate dust particle emission in `trigger()`
   - Integrate ripple effect in `trigger()`

2. **src/features/visual-effects/animation/KineticAnimationController.ts**
   - Add `setJuiceEffectsManager()` method
   - Integrate trail particles in `enableTrail()`
   - Integrate trail particles in `disableTrail()`

3. **src/features/visual-effects/line-clear/LineClearAnimationSystem.ts**
   - Add `setJuiceEffectsManager()` method
   - Integrate explosion particles in `triggerLineClear()`
   - Integrate icy particles in `triggerLineClear()`
   - Integrate implode animation in `triggerLineClear()`

4. **src/features/visual-effects/combo/ComboMilestoneSystem.ts**
   - Add `setJuiceEffectsManager()` method
   - Integrate grid pulse in `checkAndTrigger()`
   - Stop grid pulse when combo ends

5. **src/features/visual-effects/particles/ParticleEmitter.ts**
   - Add `emitDust()` method
   - Add `emitTrail()` method
   - Add `emitExplosion()` method
   - Add `emitIcy()` method

6. **src/features/visual-effects/core/AnimationCoordinator.ts**
   - Add `setJuiceEffectsManager()` method
   - Integrate juice effects in update loop
   - Propagate quality and reduced motion changes

7. **src/features/game/components/Grid.tsx**
   - Initialize JuiceEffectsManager
   - Inject into existing animation systems
   - Add to update loop

### Implementation Order

**Phase 1: Core Infrastructure** (Days 1-2)
1. Create juice.config.ts with all configuration constants
2. Create types.ts with TypeScript interfaces
3. Create easingFunctions.ts with reusable easing functions
4. Create audioSync.ts with synchronization utilities

**Phase 2: Mesh Deformation System** (Days 3-4)
5. Implement MeshDeformationManager
6. Implement ripple effect algorithm
7. Implement implode animation algorithm
8. Implement grid pulse algorithm
9. Add frustum culling optimization

**Phase 3: Particle Extensions** (Days 5-6)
10. Extend ParticleEmitter with new emission methods
11. Implement dust particle emission
12. Implement trail particle emission
13. Implement explosion particle emission
14. Implement icy particle emission

**Phase 4: Central Manager** (Days 7-8)
15. Implement JuiceEffectsManager
16. Integrate MeshDeformationManager
17. Integrate ParticleEmitter extensions
18. Implement quality preset management
19. Implement reduced motion support

**Phase 5: System Integration** (Days 9-10)
20. Modify PlacementImpactSystem
21. Modify KineticAnimationController
22. Modify LineClearAnimationSystem
23. Modify ComboMilestoneSystem
24. Modify AnimationCoordinator
25. Integrate into Grid.tsx

**Phase 6: Testing & Polish** (Days 11-14)
26. Write unit tests for all new components
27. Write property-based tests for correctness properties
28. Write integration tests for system interactions
29. Performance testing and optimization
30. Accessibility testing with reduced motion
31. Bug fixes and polish

### Babylon.js Specific Implementation Notes

#### Particle System Configuration

```typescript
// Use SPS for all particles (single draw call)
const sps = new BABYLON.SolidParticleSystem('particleSPS', scene, {
  updatable: true,
  isPickable: false,
});

// Create particle model
const box = BABYLON.MeshBuilder.CreateBox('particleModel', {
  size: 0.1,
}, scene);

// Add to SPS
sps.addShape(box, capacity);
box.dispose();

// Build mesh
const spsMesh = sps.buildMesh();

// Material with emissive
const material = new BABYLON.StandardMaterial('particleMaterial', scene);
material.emissiveColor = new BABYLON.Color3(1, 1, 1);
material.disableLighting = true;
spsMesh.material = material;
```

#### Mesh Deformation Techniques

```typescript
// Scale animation
mesh.scaling = originalScale.scale(scaleFactor);

// Rotation animation
mesh.rotation.y = originalRotation.y + rotationRadians;

// Emissive intensity boost
(mesh.material as BABYLON.StandardMaterial).emissiveColor = 
  originalEmissive.scale(intensityMultiplier);

// Frustum culling
const frustumPlanes = camera.getFrustumPlanes();
const isVisible = mesh.isInFrustum(frustumPlanes);
```

#### Performance Optimization

```typescript
// Batch transform updates
scene.freezeActiveMeshes(); // During setup
scene.unfreezeActiveMeshes(); // When done

// Use object pooling
const pool = new Array(capacity).fill(null).map(() => createParticle());

// Limit draw calls
// SPS combines all particles into 1 draw call
// Mesh instancing for repeated geometry

// Skip off-screen updates
if (!mesh.isInFrustum(camera.getFrustumPlanes())) {
  continue; // Skip this mesh
}
```

#### Mobile Considerations

```typescript
// Detect device tier
const deviceCapabilities = detectDeviceCapabilities();
const qualityPreset = deviceCapabilities.tier === 'high' ? 'high' : 
                      deviceCapabilities.tier === 'mid' ? 'medium' : 'low';

// Reduce particle count on mobile
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
const mobileMultiplier = isMobile ? 0.6 : 1.0;

// Disable expensive effects on low-end
if (qualityPreset === 'low') {
  disableGridPulse();
  disableTrailParticles();
  reduceRippleDistance();
}
```

### Key Design Decisions

1. **SPS over Individual Particle Systems**: Using Solid Particle System combines all particles into a single mesh, reducing draw calls from potentially hundreds to just 1.

2. **Object Pooling**: All particles and animation states use object pools to avoid garbage collection pressure during gameplay.

3. **Adaptive Quality**: Automatic quality reduction based on frame rate ensures smooth gameplay on all devices.

4. **Graceful Degradation**: Reduced motion support provides accessible alternatives without breaking functionality.

5. **Timing Synchronization**: Audio-visual synchronization accounts for audio latency to ensure effects feel responsive.

6. **Frustum Culling**: Skipping updates for off-screen meshes saves CPU cycles without visual impact.

7. **Easing Functions**: Carefully chosen easing functions (ease-out-sine, ease-in-back) create natural, satisfying motion.

8. **Staggered Animations**: Block-by-block and line-by-line staggering creates cascading effects that feel polished.

9. **Color Variation**: 20% color variation on particles adds visual richness without performance cost.

10. **Secondary Bursts**: Extra particle bursts for 3+ line clears reward player skill with more dramatic feedback.
