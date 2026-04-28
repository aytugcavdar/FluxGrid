# Implementation Plan: Advanced Animation Juice Effects

## Overview

This implementation plan breaks down the advanced animation juice effects feature into 6 phases following the design document. The feature adds dust particles, trail particles, explosion patterns, icy particles, ripple effects, implode animations, and grid pulse effects to enhance game feel. All effects integrate with existing animation systems (PlacementImpactSystem, KineticAnimationController, LineClearAnimationSystem, ComboMilestoneSystem) and respect quality presets and reduced motion preferences.

**Implementation Language**: TypeScript

**Estimated Duration**: 14 days

**Key Integration Points**:
- PlacementImpactSystem: Dust particles and ripple effects
- KineticAnimationController: Trail particles
- LineClearAnimationSystem: Explosion particles, icy particles, implode animations
- ComboMilestoneSystem: Grid pulse effects
- SPSParticlePoolManager: All particle rendering
- AnimationCoordinator: Central quality and reduced motion management

## Tasks

- [x] 1. Phase 1: Core Infrastructure (Days 1-2)
  - [x] 1.1 Create juice configuration file
    - Create `src/features/visual-effects/juice/config/juice.config.ts`
    - Define DustParticleConfig with baseCount=8, minCount=4, maxCount=12, velocityMin=150, velocityMax=300, color=RGB(0.7,0.7,0.7), colorVariation=0.2, lifetime=400ms, gravityDelay=100ms
    - Define TrailParticleConfig with emissionRate=3 per 100ms, lifetime=600ms, configs for low/medium/high combo levels
    - Define ExplosionParticleConfig with countPerLine (single=8, double=12, triple=16), velocityMin=400, velocityMax=600, emissiveBoost=1.5, lifetime=800ms, gravityDelay=200ms, secondaryBurst settings
    - Define IcyParticleConfig with countPerBlock=10, color=RGB(0.6,0.8,1.0), highlightColor=RGB(1.0,1.0,1.0), velocityMin=300, velocityMax=500, emissiveIntensity=0.8, lifetime=600ms, gravityDelay=150ms
    - Define RippleEffectConfig with maxDistance=2, propagationSpeed=8, amplitudes (distance1=1.08, distance2=1.04), duration=200ms, easingFunction='easeOutSine', dropHeightBoost settings
    - Define ImplodeAnimationConfig with scaleStart=1.0, scaleEnd=0.0, duration=300ms, rotationDegrees=180, emissiveStart=1.0, emissiveEnd=2.5, emissiveDuration=150ms, staggerPerBlock=30ms, staggerPerLine=50ms, easingFunction='easeInBack', overshootFactor=1.7
    - Define GridPulseConfig with scaleMin=1.0, scaleMax=1.05, duration=400ms, easingFunction='easeInOutSine', frequencies (low=1, medium=1.5, high=2 pulses/s), synchronize=true
    - Define QualityMultipliers for high/medium/low presets
    - Define ReducedMotionMultipliers for all effects
    - _Requirements: 1.1-1.10, 2.1-2.11, 3.1-3.10, 4.1-4.11, 5.1-5.10, 6.1-6.10, 7.1-7.11_


  - [x] 1.2 Create TypeScript type definitions
    - Create `src/features/visual-effects/juice/types.ts`
    - Define JuiceEffectsConfig interface with scene, particlePoolManager, spsParticleManager, qualityPreset, prefersReducedMotion
    - Define DustEmissionConfig, TrailEmissionConfig, ExplosionEmissionConfig, IcyEmissionConfig interfaces
    - Define RippleAnimation interface with epicenter, affectedMeshes map, startTime, duration, isActive
    - Define ImplodeAnimation interface with mesh, startTime, duration, originalScale, originalRotation, originalEmissive, staggerDelay, isActive
    - Define GridPulseState interface with affectedMeshes map, frequency, lastPulseTime, isActive, comboLevel
    - Define TrailParticleState interface with pieceId, mesh, color, comboLevel, lastEmissionTime, isActive
    - _Requirements: 1.1-1.10, 2.1-2.11, 3.1-3.10, 4.1-4.11, 5.1-5.10, 6.1-6.10, 7.1-7.11_

  - [x] 1.3 Implement easing functions utility
    - Create `src/features/visual-effects/juice/utils/easingFunctions.ts`
    - Implement easeOutSine: `sin(t * π/2)`
    - Implement easeInBack with overshoot: `c3 * t^3 - c1 * t^2` where c1=1.70158, c3=c1+1
    - Implement easeInOutSine: `-(cos(π * t) - 1) / 2`
    - Implement linear: `t`
    - Export all easing functions with type `(t: number) => number`
    - Add unit tests for easing function ranges (input 0-1, output 0-1)
    - _Requirements: 5.5, 6.3, 7.3_

  - [x] 1.4 Implement audio-visual synchronization utilities
    - Create `src/features/visual-effects/juice/utils/audioSync.ts`
    - Implement measureAudioLatency() using Web Audio API outputLatency or baseLatency
    - Implement calculateSyncDelay(audioPlaybackTime, audioLatency) returning visual delay in ms
    - Implement handleMutedAudio() returning 0 delay when audio is muted
    - Add fallback to 30ms default latency if Web Audio API unavailable
    - Export synchronization utilities
    - _Requirements: 12.1-12.7_

- [x] 2. Phase 2: Mesh Deformation System (Days 3-4)
  - [x] 2.1 Create MeshDeformationManager class structure
    - Create `src/features/visual-effects/juice/MeshDeformationManager.ts`
    - Implement constructor accepting scene, qualityPreset, prefersReducedMotion
    - Initialize activeRipples Map<string, RippleAnimation>
    - Initialize activeImplodes Map<string, ImplodeAnimation>
    - Initialize gridPulseState as GridPulseState | null
    - Load configuration from juice.config.ts
    - _Requirements: 5.1-5.10, 6.1-6.10, 7.1-7.11_

  - [x] 2.2 Implement ripple effect algorithm
    - Implement triggerRipple(epicenter, meshMap, dropHeight) method
    - Calculate amplitude boost from drop height (1.2x if dropHeight > 5)
    - Apply quality multiplier to amplitude (medium=0.7, low=1.0)
    - Apply reduced motion multiplier to amplitude (0.4)
    - Find affected meshes within maxDistance (2 for high/medium, 1 for low)
    - Skip meshes currently animating
    - Calculate amplitude based on distance (1.08 at distance 1, 1.04 at distance 2)
    - Store affected meshes with originalScale and targetAmplitude
    - Schedule ripple propagation with delay based on propagationSpeed (8 grid units/s)
    - Implement animateRippleWave(mesh, originalScale, amplitude, duration) with ease-out-sine
    - _Requirements: 5.1-5.10_

  - [ ]* 2.3 Write property test for ripple effect
    - **Property 23: Ripple Effect Radius**
    - **Validates: Requirements 5.1, 5.8**
    - Test that ripple affects blocks within 2 grid units (high/medium) or 1 grid unit (low)
    - Use fast-check to generate random epicenters and mesh positions
    - Verify affected meshes are within expected radius

  - [ ]* 2.4 Write property test for ripple amplitude
    - **Property 25: Ripple Amplitude by Distance**
    - **Validates: Requirements 5.3**
    - Test that amplitude is 1.08 at distance 1 and 1.04 at distance 2 (before multipliers)
    - Use fast-check to generate random drop heights and quality presets
    - Verify amplitude calculations match formula


  - [x] 2.5 Implement implode animation algorithm
    - Implement triggerImplode(meshes, lineIndices) method
    - Sort lines from top to bottom
    - Calculate stagger delays: lineDelay = lineIndex * 50ms, blockDelay = meshIndex * 30ms
    - Determine animation parameters based on quality: duration (300ms high/medium, 200ms low), rotation (180° high, 90° medium, 0° low)
    - Apply reduced motion overrides: rotation=0°, duration=150ms, linear easing
    - Schedule implode animations with stagger delays
    - Implement animateImplode(mesh, duration, rotationDegrees) with ease-in-back
    - Scale from 1.0 to 0.0 over duration
    - Rotate by rotationDegrees around Y axis
    - Increase emissive intensity from 1.0 to 2.5 during first 150ms
    - Dispose mesh when animation completes
    - _Requirements: 6.1-6.10_

  - [ ]* 2.6 Write property test for implode animation
    - **Property 30: Implode Scale Animation**
    - **Validates: Requirements 6.1, 6.2**
    - Test that scale animates from 1.0 to 0.0 over specified duration
    - Use fast-check to generate random quality presets and reduced motion states
    - Verify duration matches: 300ms (high/medium), 200ms (low), 150ms (reduced motion)

  - [ ]* 2.7 Write property test for implode rotation
    - **Property 32: Implode Rotation**
    - **Validates: Requirements 6.4, 6.8, 6.9**
    - Test that rotation matches quality preset: 180° (high), 90° (medium), 0° (low/reduced motion)
    - Use fast-check to generate random quality presets
    - Verify rotation angles match specification

  - [x] 2.8 Implement grid pulse algorithm
    - Implement startPulse(meshMap, comboLevel) method
    - Skip if reduced motion enabled
    - Determine frequency based on combo level: 1 pulse/s (5-7), 1.5 pulse/s (8-10), 2 pulse/s (11+)
    - Determine scaleMax based on quality: 1.05 (high), 1.03 (medium), 1.02 (low)
    - Apply 50% frequency reduction for low quality
    - Collect all filled grid cells into affectedMeshes map
    - Create gridPulseState with frequency, lastPulseTime, isActive=true
    - Implement updateGridPulse(deltaTime) to trigger synchronized pulses at frequency intervals
    - Implement animatePulse(mesh, originalScale, scaleMax, duration) with ease-in-out-sine
    - Implement stopPulse() to complete current pulse and restore original scales
    - _Requirements: 7.1-7.11_

  - [ ]* 2.9 Write property test for grid pulse frequency
    - **Property 38: Grid Pulse Frequency by Combo Level**
    - **Validates: Requirements 7.4, 7.5, 7.6, 7.10**
    - Test that frequency matches combo level: 1 pulse/s (5-7), 1.5 pulse/s (8-10), 2 pulse/s (11+)
    - Apply 50% reduction for low quality
    - Use fast-check to generate random combo levels and quality presets
    - Verify pulse timing matches expected frequency

  - [x] 2.10 Add frustum culling optimization
    - Implement isInFrustum(mesh, camera) helper using bounding sphere test
    - In updateMeshDeformations(), skip ripple updates for off-screen meshes
    - In updateMeshDeformations(), skip implode updates for off-screen meshes
    - Grid pulse always updates (affects visible grid)
    - Add performance metrics logging for culled meshes
    - _Requirements: 8.9_

  - [ ]* 2.11 Write unit tests for MeshDeformationManager
    - Test ripple effect triggers correctly with valid parameters
    - Test implode animation disposes meshes after completion
    - Test grid pulse synchronizes all cells
    - Test frustum culling skips off-screen meshes
    - Test quality preset changes update configurations
    - Test reduced motion disables grid pulse

- [x] 3. Phase 3: Particle Extensions (Days 5-6)
  - [x] 3.1 Extend ParticleEmitter with dust emission
    - Open `src/features/visual-effects/particles/ParticleEmitter.ts`
    - Add emitDust(config: DustEmissionConfig) method
    - Calculate particle count: clamp(8 * clamp(dropHeight/10, 0.5, 1.5), 4, 12)
    - Apply quality multiplier to particle count
    - Skip if reduced motion enabled
    - For each position, emit particleCount particles
    - Acquire particles from spsParticleManager
    - Set radial velocity (horizontal): angle=random(0,2π), speed=random(150,300)
    - Set color with 20% variation: baseColor=RGB(0.7,0.7,0.7), variation=random(-0.2,0.2)
    - Set lifetime=400ms, gravityDelay=100ms, applyGravity=true
    - _Requirements: 1.1-1.10_

  - [ ]* 3.2 Write property test for dust particle count
    - **Property 1: Dust Particle Emission Count Formula**
    - **Validates: Requirements 1.1, 1.2**
    - Test that particle count follows formula: clamp(8 * clamp(H/10, 0.5, 1.5), 4, 12)
    - Use fast-check to generate random drop heights (0-20)
    - Verify count is within [4, 12] range
    - Verify count scales with drop height


  - [ ]* 3.3 Write property test for dust particle color
    - **Property 3: Dust Particle Color Variation**
    - **Validates: Requirements 1.4**
    - Test that each color channel is within [0.5, 0.9] range (20% variation from 0.7)
    - Use fast-check to generate random particles
    - Verify color variation stays within bounds

  - [x] 3.4 Extend ParticleEmitter with trail emission
    - Add emitTrail(config: TrailEmissionConfig) method
    - Check combo threshold (must be >= 5)
    - Skip if reduced motion enabled
    - Determine trail config based on combo level: low (5-7), medium (8-10), high (11+)
    - Apply quality multiplier to emission rate (3 particles per 100ms base)
    - Create trail state with pieceId, mesh, color, comboLevel, lastEmissionTime, isActive
    - Store in activeTrails map
    - Implement updateTrailParticles(deltaTime) to emit particles at intervals
    - Emit particles at current mesh position with velocity=Vector3.Zero() (stationary)
    - Set color with alpha from config (0.5/0.7/0.9), lifetime=600ms, applyGravity=false
    - _Requirements: 2.1-2.11_

  - [ ]* 3.5 Write property test for trail particle combo threshold
    - **Property 12: Trail Particle Combo Threshold**
    - **Validates: Requirements 2.1**
    - Test that trail particles emit if and only if combo level >= 5
    - Use fast-check to generate random combo levels (0-20)
    - Verify emission only occurs for combo >= 5

  - [ ]* 3.6 Write property test for trail configuration
    - **Property 15: Trail Configuration by Combo Level**
    - **Validates: Requirements 2.4, 2.5, 2.6**
    - Test that config matches combo level: [5,7]→(alpha=0.5, segments=10), [8,10]→(alpha=0.7, segments=15), ≥11→(alpha=0.9, segments=20)
    - Use fast-check to generate random combo levels
    - Verify alpha and segment counts match specification

  - [x] 3.7 Extend ParticleEmitter with explosion emission
    - Add emitExplosion(config: ExplosionEmissionConfig) method
    - Determine particle count per block: single line=8, double=12, triple+=16
    - Apply quality multiplier to particle count
    - Apply reduced motion multiplier (0.3 = 70% reduction)
    - For each position, emit particlesPerBlock particles
    - Acquire particles from spsParticleManager
    - Set radial velocity with elevation: angle=random(0,2π), elevation=random(-π/4,π/4), speed=random(400,600)
    - Set color with 150% emissive boost
    - Set lifetime=800ms, gravityDelay=200ms, applyGravity=true
    - If lineCount >= 3 and not reduced motion, schedule secondary burst at 150ms delay with 50% particle count
    - _Requirements: 3.1-3.10_

  - [ ]* 3.8 Write property test for explosion particle count
    - **Property 17: Explosion Particle Count by Line Count**
    - **Validates: Requirements 3.1, 3.2**
    - Test that particle count matches line count: 1→8, 2→12, ≥3→16 (before quality multiplier)
    - Use fast-check to generate random line counts (1-4)
    - Verify particle counts match specification

  - [ ]* 3.9 Write property test for secondary burst
    - **Property 19: Secondary Burst Conditions**
    - **Validates: Requirements 3.7**
    - Test that secondary burst occurs for 3+ lines with 50% count at 150ms delay
    - Test that secondary burst is disabled with reduced motion
    - Use fast-check to generate random line counts and reduced motion states
    - Verify secondary burst timing and count

  - [x] 3.10 Extend ParticleEmitter with icy emission
    - Add emitIcy(config: IcyEmissionConfig) method
    - Set particlesPerBlock=10
    - Apply quality multiplier to particle count
    - Apply reduced motion multiplier (0.3 = 70% reduction)
    - For each position, emit particlesPerBlock particles
    - Acquire particles from spsParticleManager
    - Set radial velocity with elevation: angle=random(0,2π), elevation=random(-π/4,π/4), speed=random(300,500)
    - Set color: 30% white RGB(1.0,1.0,1.0), 70% light blue RGB(0.6,0.8,1.0)
    - Set emissiveIntensity=0.8
    - Set lifetime=600ms, gravityDelay=150ms, applyGravity=true
    - _Requirements: 4.1-4.11_

  - [ ]* 3.11 Write property test for icy particle color distribution
    - **Property 21: Icy Particle Color Distribution**
    - **Validates: Requirements 4.3**
    - Test that 30% of particles are white and 70% are light blue
    - Use fast-check to generate large particle batches (100+)
    - Verify color distribution is approximately 30/70 (within statistical tolerance)

  - [ ]* 3.12 Write unit tests for ParticleEmitter extensions
    - Test dust emission creates correct particle count
    - Test trail emission respects combo threshold
    - Test explosion emission creates secondary burst for 3+ lines
    - Test icy emission uses correct color distribution
    - Test all emissions respect quality multipliers
    - Test all emissions respect reduced motion


- [x] 4. Phase 4: Central Manager (Days 7-8)
  - [x] 4.1 Create JuiceEffectsManager class structure
    - Create `src/features/visual-effects/juice/JuiceEffectsManager.ts`
    - Implement constructor accepting JuiceEffectsConfig
    - Store references to scene, particlePoolManager, spsParticleManager
    - Initialize MeshDeformationManager with scene, qualityPreset, prefersReducedMotion
    - Initialize ParticleEmitter with particlePoolManager
    - Store qualityPreset and prefersReducedMotion
    - Initialize activeTrails Map<string, TrailParticleState>
    - _Requirements: 1.1-7.11_

  - [x] 4.2 Implement dust particle emission method
    - Implement emitDustParticles(positions, dropHeight) method
    - Call particleEmitter.emitDust() with DustEmissionConfig
    - Pass positions array and dropHeight
    - Apply quality multiplier from qualityPreset
    - Skip if prefersReducedMotion is true
    - _Requirements: 1.1-1.10_

  - [x] 4.3 Implement trail particle methods
    - Implement enableTrailParticles(pieceId, mesh, color, comboLevel) method
    - Check combo threshold (>= 5)
    - Skip if prefersReducedMotion is true
    - Call particleEmitter.emitTrail() with TrailEmissionConfig
    - Store trail state in activeTrails map
    - Implement disableTrailParticles(pieceId) method
    - Remove trail state from activeTrails map
    - Schedule trail disposal after 100ms
    - _Requirements: 2.1-2.11_

  - [x] 4.4 Implement explosion particle emission method
    - Implement emitExplosionParticles(positions, colors, lineCount) method
    - Call particleEmitter.emitExplosion() with ExplosionEmissionConfig
    - Pass positions, colors, and lineCount
    - Apply quality multiplier from qualityPreset
    - Apply reduced motion multiplier (0.3) if enabled
    - Handle secondary burst for 3+ lines
    - _Requirements: 3.1-3.10_

  - [x] 4.5 Implement icy particle emission method
    - Implement emitIcyParticles(positions) method
    - Call particleEmitter.emitIcy() with IcyEmissionConfig
    - Pass positions array
    - Apply quality multiplier from qualityPreset
    - Apply reduced motion multiplier (0.3) if enabled
    - _Requirements: 4.1-4.11_

  - [x] 4.6 Implement ripple effect method
    - Implement triggerRippleEffect(epicenter, meshMap, dropHeight) method
    - Call meshDeformationManager.triggerRipple()
    - Pass epicenter, meshMap, and dropHeight
    - Apply quality and reduced motion multipliers
    - _Requirements: 5.1-5.10_

  - [x] 4.7 Implement implode animation method
    - Implement triggerImplodeAnimation(meshes, lineIndices) method
    - Call meshDeformationManager.triggerImplode()
    - Pass meshes array and lineIndices
    - Apply quality and reduced motion overrides
    - _Requirements: 6.1-6.10_

  - [x] 4.8 Implement grid pulse methods
    - Implement startGridPulse(meshMap, comboLevel) method
    - Call meshDeformationManager.startPulse()
    - Pass meshMap and comboLevel
    - Skip if prefersReducedMotion is true
    - Implement stopGridPulse() method
    - Call meshDeformationManager.stopPulse()
    - _Requirements: 7.1-7.11_

  - [x] 4.9 Implement quality preset management
    - Implement setQualityPreset(preset) method
    - Update qualityPreset property
    - Propagate to meshDeformationManager.setQualityPreset()
    - Propagate to particlePoolManager.setQualityPreset()
    - Update particle count limits: high=200, medium=120, low=80
    - _Requirements: 8.6, 13.4_

  - [x] 4.10 Implement reduced motion support
    - Implement setReducedMotion(enabled) method
    - Update prefersReducedMotion property
    - Propagate to meshDeformationManager.setReducedMotion()
    - Disable dust particles, trail particles, grid pulse if enabled
    - Apply 70% reduction to explosion and icy particles
    - Apply 60% reduction to ripple amplitude
    - Limit animation durations to 200ms maximum
    - _Requirements: 10.1-10.10_

  - [x] 4.11 Implement update loop
    - Implement update(deltaTime) method
    - Call meshDeformationManager.update(deltaTime)
    - Call particlePoolManager.update(deltaTime) for gravity physics
    - Call updateTrailParticles(deltaTime) for trail emission
    - Manage particle pool limits (recycle oldest if exceeded)
    - _Requirements: 8.1-8.10_

  - [x] 4.12 Implement cleanup and disposal
    - Implement dispose() method
    - Call meshDeformationManager.dispose()
    - Clear activeTrails map
    - Stop all active animations
    - _Requirements: 8.10_

  - [ ]* 4.13 Write unit tests for JuiceEffectsManager
    - Test all emission methods create correct particle counts
    - Test quality preset changes propagate correctly
    - Test reduced motion disables appropriate effects
    - Test update loop calls all subsystems
    - Test disposal cleans up all resources


- [ ] 5. Phase 5: System Integration (Days 9-10)
  - [x] 5.1 Integrate with PlacementImpactSystem
    - Open `src/features/visual-effects/placement/PlacementImpactSystem.ts`
    - Add private juiceEffectsManager property (optional)
    - Implement setJuiceEffectsManager(manager) method
    - In trigger() method, after animateScale() call, emit dust particles if juiceEffectsManager exists and not reduced motion
    - Calculate positions from cellIds and meshMap
    - Call juiceEffectsManager.emitDustParticles(positions, dropHeight)
    - In trigger() method, after dust emission, trigger ripple effect
    - Calculate epicenter from cellIds (average position)
    - Call juiceEffectsManager.triggerRippleEffect(epicenter, meshMap, dropHeight)
    - _Requirements: 9.1, 9.5_

  - [ ]* 5.2 Write integration test for PlacementImpactSystem
    - Test that dust particles emit after scale animation starts
    - Test that ripple effect triggers on placement
    - Test that timing is correct (dust after scale, ripple simultaneous)
    - Use jest.spyOn to verify call order

  - [x] 5.3 Integrate with KineticAnimationController
    - Open `src/features/visual-effects/animation/KineticAnimationController.ts`
    - Add private juiceEffectsManager property (optional)
    - Implement setJuiceEffectsManager(manager) method
    - In enableTrail() method, after existing trail logic, enable trail particles if combo >= 5
    - Call juiceEffectsManager.enableTrailParticles(pieceId, generator, color, comboLevel)
    - In disableTrail() method, after existing trail disposal, disable trail particles
    - Call juiceEffectsManager.disableTrailParticles(pieceId)
    - _Requirements: 9.2_

  - [ ]* 5.4 Write integration test for KineticAnimationController
    - Test that trail particles enable when combo >= 5
    - Test that trail particles disable when trail ends
    - Test that both mesh trails and particle trails are managed
    - Use jest.spyOn to verify both systems are called

  - [x] 5.5 Integrate with LineClearAnimationSystem
    - Open `src/features/visual-effects/line-clear/LineClearAnimationSystem.ts`
    - Add private juiceEffectsManager property (optional)
    - Implement setJuiceEffectsManager(manager) method
    - In triggerLineClear() method, before triggerFlashEffect(), emit explosion particles
    - Call juiceEffectsManager.emitExplosionParticles(cellPositions, cellColors, lineCount)
    - If ice blocks present, emit icy particles
    - Call juiceEffectsManager.emitIcyParticles(iceBlockPositions)
    - Replace existing mesh disposal with implode animation
    - Call juiceEffectsManager.triggerImplodeAnimation(clearedMeshes, clearedLines)
    - _Requirements: 9.3, 9.6_

  - [ ]* 5.6 Write integration test for LineClearAnimationSystem
    - Test that explosion particles emit before flash effect
    - Test that icy particles emit for ice blocks
    - Test that implode animation replaces mesh disposal
    - Test that timing is correct (explosion before flash)
    - Use jest.spyOn to verify call order

  - [x] 5.7 Integrate with ComboMilestoneSystem
    - Open `src/features/visual-effects/combo/ComboMilestoneSystem.ts`
    - Add private juiceEffectsManager property (optional)
    - Implement setJuiceEffectsManager(manager) method
    - In checkAndTrigger() method, start grid pulse if combo >= 5
    - Call juiceEffectsManager.startGridPulse(meshMap, currentCombo)
    - When combo ends (currentCombo === 0), stop grid pulse
    - Call juiceEffectsManager.stopGridPulse()
    - _Requirements: 9.4_

  - [ ]* 5.8 Write integration test for ComboMilestoneSystem
    - Test that grid pulse starts when combo >= 5
    - Test that grid pulse stops when combo ends
    - Test that pulse frequency matches combo level
    - Use jest.spyOn to verify grid pulse coordination

  - [x] 5.9 Integrate with AnimationCoordinator
    - Open `src/features/visual-effects/core/AnimationCoordinator.ts`
    - Add private juiceEffectsManager property (optional)
    - Implement setJuiceEffectsManager(manager) method
    - In setQualityPreset() method, propagate to juiceEffectsManager
    - Call juiceEffectsManager.setQualityPreset(preset)
    - In setReducedMotion() method, propagate to juiceEffectsManager
    - Call juiceEffectsManager.setReducedMotion(enabled)
    - In update() method, call juiceEffectsManager.update(deltaTime)
    - _Requirements: 9.9, 9.10_

  - [ ]* 5.10 Write integration test for AnimationCoordinator
    - Test that quality preset changes propagate to juice effects
    - Test that reduced motion changes propagate to juice effects
    - Test that update loop calls juice effects manager
    - Use jest.spyOn to verify propagation

  - [x] 5.11 Integrate into Grid.tsx component
    - Open `src/features/game/components/Grid.tsx`
    - After AnimationCoordinator initialization, create JuiceEffectsManager
    - Pass scene, particlePoolManager, spsParticleManager, qualityPreset, prefersReducedMotion
    - Store in juiceEffectsManagerRef
    - Inject into PlacementImpactSystem via setJuiceEffectsManager()
    - Inject into KineticAnimationController via setJuiceEffectsManager()
    - Inject into LineClearAnimationSystem via setJuiceEffectsManager()
    - Inject into ComboMilestoneSystem via setJuiceEffectsManager()
    - Inject into AnimationCoordinator via setJuiceEffectsManager()
    - In render loop, call juiceEffectsManager.update(deltaTime)
    - In cleanup, call juiceEffectsManager.dispose()
    - _Requirements: 9.1-9.10_

  - [ ]* 5.12 Write integration test for Grid.tsx
    - Test that JuiceEffectsManager is initialized correctly
    - Test that all animation systems receive juice effects manager
    - Test that update loop calls juice effects manager
    - Test that disposal cleans up juice effects manager
    - Use React Testing Library and jest.spyOn


- [-] 6. Phase 6: Testing & Polish (Days 11-14)
  - [x] 6.1 Checkpoint - Ensure all core functionality works
    - Verify dust particles emit on placement with correct count and velocity
    - Verify trail particles emit during combos with correct alpha and segments
    - Verify explosion particles emit on line clears with correct count and secondary burst
    - Verify icy particles emit on ice block breaks with correct color distribution
    - Verify ripple effect propagates correctly with correct amplitude and timing
    - Verify implode animation scales, rotates, and disposes meshes correctly
    - Verify grid pulse synchronizes all cells with correct frequency
    - Ensure all tests pass, ask the user if questions arise.

  - [ ]* 6.2 Write property test for quality preset multiplier
    - **Property 4: Quality Preset Multiplier Formula**
    - **Validates: Requirements 1.6, 1.7, 2.8, 2.9, 3.8, 3.9, 4.9, 4.10, 5.7, 5.8, 6.8, 6.9, 7.9, 7.10, 8.6**
    - Test that quality multipliers are applied correctly: high=1.0, medium=0.6, low=0.4
    - Test amplitude multipliers: high=1.0, medium=0.7, low=1.0 (except pulse)
    - Use fast-check to generate random quality presets and particle types
    - Verify all particle counts and amplitudes match formula

  - [ ]* 6.3 Write property test for reduced motion effects
    - **Property 5: Reduced Motion Disables Specific Effects**
    - **Validates: Requirements 1.8, 2.10, 7.11, 10.1**
    - Test that dust particles, trail particles, and grid pulse are disabled with reduced motion
    - Use fast-check to generate random game states
    - Verify no emission occurs when reduced motion is enabled

  - [ ]* 6.4 Write property test for reduced motion reduction
    - **Property 6: Reduced Motion Reduction Formula**
    - **Validates: Requirements 3.10, 4.11, 10.2**
    - Test that explosion and icy particles are reduced by 70% (multiplied by 0.3)
    - Use fast-check to generate random particle emissions
    - Verify particle counts match 30% of normal

  - [ ]* 6.5 Write property test for particle lifetime recycling
    - **Property 9: Particle Lifetime Recycling**
    - **Validates: Requirements 1.5, 2.7, 3.5, 4.6, 8.10**
    - Test that particles are recycled after their lifetime expires
    - Use fast-check to generate random particle types and lifetimes
    - Verify particles are returned to pool after lifetime + small buffer

  - [ ]* 6.6 Write property test for gravity application
    - **Property 10: Gravity Application Delay**
    - **Validates: Requirements 1.9, 3.6, 4.7**
    - Test that gravity is not applied before delay, and is applied after delay
    - Use fast-check to generate random particle types with different gravity delays
    - Verify gravity timing matches specification

  - [ ]* 6.7 Write property test for particle fade out
    - **Property 11: Particle Fade Out Smoothness**
    - **Validates: Requirements 1.10, 11.9**
    - Test that alpha decreases monotonically from 1.0 to 0.0 in final 20% of lifetime
    - Use fast-check to generate random particles
    - Verify alpha values decrease smoothly without jumps

  - [ ]* 6.8 Write property test for ripple propagation speed
    - **Property 24: Ripple Propagation Speed**
    - **Validates: Requirements 5.2**
    - Test that ripple propagates at 8 grid units per second
    - Use fast-check to generate random epicenters and distances
    - Verify timing matches propagation speed

  - [ ]* 6.9 Write property test for ripple drop height boost
    - **Property 28: Ripple Drop Height Boost**
    - **Validates: Requirements 5.6**
    - Test that amplitude increases by 20% when drop height > 5
    - Use fast-check to generate random drop heights
    - Verify amplitude boost is applied correctly

  - [ ]* 6.10 Write property test for implode stagger timing
    - **Property 34: Implode Stagger Timing**
    - **Validates: Requirements 6.6, 6.7**
    - Test that implode animations stagger by 30ms per block and 50ms per line
    - Use fast-check to generate random line clears
    - Verify stagger delays match specification

  - [ ]* 6.11 Write property test for grid pulse synchronization
    - **Property 39: Grid Pulse Synchronization**
    - **Validates: Requirements 7.7**
    - Test that all cells pulse together with same phase
    - Use fast-check to generate random grid states
    - Verify all cells have same timing offset

  - [ ]* 6.12 Write property test for adaptive quality reduction
    - **Property 41: Adaptive Quality Reduction**
    - **Validates: Requirements 8.3**
    - Test that quality reduces after 3 seconds of low FPS
    - Simulate frame rate drops and verify quality preset changes
    - Test progression: high→medium→low

  - [ ]* 6.13 Write property test for particle count limits
    - **Property 43: Particle Count Limits**
    - **Validates: Requirements 8.6**
    - Test that active particles never exceed: high=200, medium=120, low=80
    - Use fast-check to generate random particle emissions
    - Verify oldest particles are recycled when limit exceeded


  - [ ]* 6.14 Write property test for audio-visual synchronization
    - **Property 62: Audio-Visual Synchronization Timing**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
    - Test that visual effects account for audio latency (20-50ms)
    - Use fast-check to generate random audio latencies
    - Verify visual delay matches audio latency calculation

  - [ ]* 6.15 Write property test for color contrast
    - **Property 60: Color Contrast with Background**
    - **Validates: Requirements 11.8**
    - Test that all particle colors have sufficient contrast with grid background RGB(0.05,0.05,0.15)
    - Use WCAG contrast ratio formula (minimum 3:1 for graphics)
    - Use fast-check to generate random particle colors
    - Verify contrast ratios meet accessibility standards

  - [ ] 6.16 Write performance tests
    - Test that 200 active particles maintain 60 FPS on high-end devices
    - Test that 120 active particles maintain 30 FPS on mid-range devices
    - Test that 80 active particles maintain 30 FPS on low-end devices
    - Test that particle recycling occurs when limits are exceeded
    - Test that frustum culling reduces CPU usage for off-screen meshes
    - Measure frame times and verify performance targets
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 6.17 Write accessibility tests
    - Test that reduced motion disables dust, trail, and grid pulse
    - Test that reduced motion reduces explosion and icy particles by 70%
    - Test that reduced motion reduces ripple amplitude by 60%
    - Test that reduced motion limits animation durations to 200ms
    - Test that reduced motion preference is detected from browser
    - Test that reduced motion can be manually overridden in settings
    - Test that changes apply within 100ms
    - _Requirements: 10.1-10.10_

  - [ ] 6.18 Write edge case tests
    - Test particle pool exhaustion (recycle oldest)
    - Test zero drop height (minimum 4 particles)
    - Test very high drop height (maximum 12 particles)
    - Test disposed mesh during animation (no errors)
    - Test combo level 0 (grid pulse stops)
    - Test WebGL context loss (pause and reinitialize)
    - Test invalid audio latency (use default 30ms)
    - Test quality preset change during animation (no errors)
    - _Requirements: Error Handling section_

  - [ ] 6.19 Write visual feedback clarity tests
    - Test that dust particles don't obscure placed blocks
    - Test that trail particles don't obscure grid
    - Test that explosion particles don't obscure remaining blocks
    - Test that icy particles distinguish ice blocks from normal blocks
    - Test that ripple effect doesn't disorient player
    - Test that implode animation clearly indicates removal timing
    - Test that grid pulse doesn't make grid difficult to read
    - Test that all particles fade out smoothly
    - Test that mesh deformations return to original state
    - _Requirements: 11.1-11.10_

  - [ ] 6.20 Optimize particle rendering
    - Verify SPSParticlePoolManager is used for all particles (single draw call)
    - Verify particle pool sizes are scaled by quality preset
    - Verify oldest particles are recycled when pool is exhausted
    - Verify inactive particles are disposed after 100ms
    - Profile draw calls and verify minimal overhead
    - _Requirements: 8.4, 8.7, 8.8, 8.10_

  - [ ] 6.21 Optimize mesh deformations
    - Verify transform updates are batched to minimize draw calls
    - Verify off-screen meshes are skipped (frustum culling)
    - Verify animation states are cleaned up after completion
    - Profile CPU usage and verify minimal overhead
    - _Requirements: 8.5, 8.9_

  - [ ] 6.22 Test audio-visual synchronization
    - Test that dust particles sync with placement audio
    - Test that explosion particles sync with line clear audio
    - Test that icy particles sync with ice break audio
    - Test that grid pulse syncs with combo milestone audio
    - Test that audio latency is measured correctly
    - Test that effects continue when audio is muted
    - Test that same timing source is used (performance.now())
    - Test that implode completes before audio finishes
    - Test that ripple starts simultaneously with audio
    - Test that trail emission maintains constant timing
    - _Requirements: 12.1-12.10_

  - [ ] 6.23 Polish and bug fixes
    - Fix any visual glitches or timing issues
    - Ensure smooth transitions between quality presets
    - Ensure smooth transitions when reduced motion changes
    - Verify all animations complete cleanly without artifacts
    - Verify all particles are properly disposed
    - Verify all mesh deformations restore original state
    - Test on multiple devices (desktop, mobile, tablet)
    - Test on multiple browsers (Chrome, Firefox, Safari)
    - Gather user feedback and iterate

  - [ ] 6.24 Final checkpoint - Ensure all tests pass
    - Run all unit tests and verify 80%+ coverage
    - Run all property-based tests and verify all 67 properties pass
    - Run all integration tests and verify all 4 integration points work
    - Run all performance tests and verify frame rate targets met
    - Run all accessibility tests and verify reduced motion compliance
    - Run all edge case tests and verify error handling works
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from design document
- Unit tests validate specific examples and edge cases
- Integration tests verify correct interaction between systems
- Performance tests ensure frame rate targets are met on all device tiers
- Accessibility tests ensure reduced motion compliance

## Implementation Guidelines

1. **TypeScript Best Practices**: Use strict type checking, interfaces for all configs, proper error handling
2. **Babylon.js Patterns**: Use SPS for particles, object pooling, frustum culling, batch updates
3. **Performance First**: Profile frequently, optimize hot paths, minimize draw calls, use pooling
4. **Accessibility**: Always respect reduced motion, provide graceful degradation, maintain clarity
5. **Testing**: Write tests alongside implementation, use property-based testing for formulas, test edge cases
6. **Integration**: Inject dependencies, use existing systems, maintain backward compatibility
7. **Documentation**: Comment complex algorithms, document configuration options, explain design decisions

