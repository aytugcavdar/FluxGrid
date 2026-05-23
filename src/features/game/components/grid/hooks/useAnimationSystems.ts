/**
 * useAnimationSystems — initialises all 13 Babylon.js visual-effect systems.
 * Only runs on MID/HIGH devices (isEffectLimitedDevice = false).
 * Returns stable refs to each system for the render loop hook.
 */
import { useRef } from 'react';
import * as BABYLON from 'babylonjs';
import { AnimationCoordinator } from '../../../visual-effects/core/AnimationCoordinator';
import { PlacementImpactSystem } from '../../../visual-effects/placement/PlacementImpactSystem';
import { ComboMilestoneSystem } from '../../../visual-effects/combo/ComboMilestoneSystem';
import { PerfectClearCelebration } from '../../../visual-effects/celebration/PerfectClearCelebration';
import { ParticlePoolManager } from '../../../visual-effects/particles/ParticlePoolManager';
import { ParticleEmitter } from '../../../visual-effects/particles/ParticleEmitter';
import { HapticManager } from '../../../../utils/audio/haptics';
import { getBatterySaverManager } from '../../../visual-effects/performance/BatterySaverManager';
import { LineClearAnimationSystem } from '../../../visual-effects/line-clear/LineClearAnimationSystem';
import { KineticAnimationController } from '../../../visual-effects/animation/KineticAnimationController';
import { TrailMeshManager } from '../../../visual-effects/animation/TrailMeshManager';
import { PerformanceMonitor } from '../../../visual-effects/performance/PerformanceMonitor';
import { AdaptiveQualitySystem } from '../../../visual-effects/performance/AdaptiveQualitySystem';
import { SPSParticlePoolManager } from '../../../visual-effects/particles/SPSParticlePoolManager';
import { UI3DManager } from '../../../visual-effects/ui-3d';
import { SpecialBlockEffectsManager } from '../../../visual-effects/special-blocks';
import { JuiceEffectsManager } from '../../../visual-effects/juice/JuiceEffectsManager';

export interface AnimationSystemRefs {
  animationCoordinatorRef: React.MutableRefObject<AnimationCoordinator | null>;
  juiceEffectsManagerRef: React.MutableRefObject<any | null>;
  lineClearSystemRef: React.MutableRefObject<LineClearAnimationSystem | null>;
  spsParticleManagerRef: React.MutableRefObject<SPSParticlePoolManager | null>;
  ui3dManagerRef: React.MutableRefObject<UI3DManager | null>;
  specialBlockManagerRef: React.MutableRefObject<SpecialBlockEffectsManager | null>;
  kineticAnimationRef: React.MutableRefObject<KineticAnimationController | null>;
  trailManagerRef: React.MutableRefObject<TrailMeshManager | null>;
  performanceMonitorRef: React.MutableRefObject<PerformanceMonitor | null>;
  adaptiveQualityRef: React.MutableRefObject<AdaptiveQualitySystem | null>;
  batterySaverManagerRef: React.MutableRefObject<any | null>;
}

export function createAnimationSystemRefs(): AnimationSystemRefs {
  return {
    animationCoordinatorRef: { current: null },
    juiceEffectsManagerRef: { current: null },
    lineClearSystemRef: { current: null },
    spsParticleManagerRef: { current: null },
    ui3dManagerRef: { current: null },
    specialBlockManagerRef: { current: null },
    kineticAnimationRef: { current: null },
    trailManagerRef: { current: null },
    performanceMonitorRef: { current: null },
    adaptiveQualityRef: { current: null },
    batterySaverManagerRef: { current: null },
  };
}

export interface InitAnimationSystemsOptions {
  scene: BABYLON.Scene;
  glowLayerRef: React.MutableRefObject<BABYLON.GlowLayer | null>;
  meshMapRef: React.MutableRefObject<Map<string, BABYLON.Mesh>>;
  isEffectLimitedDevice: boolean;
  isLowEndDevice: boolean;
  tier: string;
  prefersReducedMotion: boolean;
  refs: AnimationSystemRefs;
}

/**
 * Call this ONCE after the Babylon scene is ready.
 * Returns a dispose function for cleanup.
 */
export function initAnimationSystems(opts: InitAnimationSystemsOptions): () => void {
  const {
    scene, glowLayerRef, meshMapRef,
    isEffectLimitedDevice, isLowEndDevice, tier, prefersReducedMotion,
    refs,
  } = opts;

  if (isEffectLimitedDevice) {
    // LOW / LOW-MID: all systems remain null
    Object.values(refs).forEach(r => { (r as any).current = null; });
    console.log('[AnimationSystems] Disabled for constrained device tier:', tier);
    return () => {};
  }

  let currentQualityPreset: 'high' | 'medium' | 'low' = tier === 'high' ? 'high' : 'medium';
  const qualityMultiplier = tier === 'high' ? 1.0 : tier === 'mid' ? 0.65 : 0.35;

  const animationCoordinator = new AnimationCoordinator({
    scene,
    qualityPreset: currentQualityPreset,
    prefersReducedMotion,
  });

  const particlePoolManager = new ParticlePoolManager({ scene, qualityMultiplier });
  const particleEmitter = new ParticleEmitter(particlePoolManager);
  const hapticManager = new HapticManager();

  // Battery saver
  const batterySaver = getBatterySaverManager({
    onQualityChange: (preset) => {
      currentQualityPreset = preset;
      animationCoordinator?.setQualityPreset(preset);
      particlePoolManager?.setQualityPreset(preset);
      if (preset === 'low' && glowLayerRef.current) glowLayerRef.current.intensity = 0;
    },
    onFPSChange: () => {},
    onHapticsChange: (enabled) => hapticManager.setEnabled(enabled),
  });
  refs.batterySaverManagerRef.current = batterySaver;
  batterySaver.initialize().catch((e) => console.debug('[AnimationSystems] Battery saver init failed:', e));

  // Placement impact
  const placementImpactSystem = new PlacementImpactSystem(scene, particlePoolManager, hapticManager);
  if (prefersReducedMotion) placementImpactSystem.setReducedMotion(true);

  // Combo milestone
  const comboMilestoneSystem = new ComboMilestoneSystem(particleEmitter, hapticManager);
  if (prefersReducedMotion) comboMilestoneSystem.setReducedMotion(true);
  comboMilestoneSystem.setMeshMap?.(meshMapRef.current);

  // Perfect clear
  const perfectClearCelebration = new PerfectClearCelebration(particleEmitter, hapticManager);
  if (prefersReducedMotion) perfectClearCelebration.setReducedMotion(true);

  // SPS + LineClear (mid-high only, not low-mid)
  let spsParticleManager: SPSParticlePoolManager | null = null;
  let lineClearSystem: LineClearAnimationSystem | null = null;
  if (!isLowEndDevice) {
    spsParticleManager = new SPSParticlePoolManager({
      scene,
      capacity: tier === 'high' ? 2000 : 1200,
      particleSize: 0.1,
    });
    lineClearSystem = new LineClearAnimationSystem(scene, spsParticleManager);
    if (prefersReducedMotion) lineClearSystem.setReducedMotion(true);
    lineClearSystem.setDeviceTier(tier as any);
  }
  refs.spsParticleManagerRef.current = spsParticleManager;
  refs.lineClearSystemRef.current = lineClearSystem;

  // UI3D
  const ui3dManager = new UI3DManager(scene);
  ui3dManager.initializeComboMeter(new BABYLON.Vector3(8, 15, 0));
  refs.ui3dManagerRef.current = ui3dManager;

  // Special blocks (needs spsParticleManager)
  if (!isLowEndDevice && spsParticleManager) {
    refs.specialBlockManagerRef.current = new SpecialBlockEffectsManager(scene, spsParticleManager);
  }

  // Kinetic + trail
  const trailManager = new TrailMeshManager(scene);
  const kineticAnimation = new KineticAnimationController();
  kineticAnimation.setTrailManager(trailManager);
  refs.kineticAnimationRef.current = kineticAnimation;
  refs.trailManagerRef.current = trailManager;

  // Performance monitor + adaptive quality
  const performanceMonitor = new PerformanceMonitor();
  const adaptiveQuality = new AdaptiveQualitySystem({
    particleManager: spsParticleManager ?? undefined,
    trailManager,
    onPerformanceModeChange: (enabled) => console.log('[AnimationSystems] Performance mode:', enabled),
  });
  performanceMonitor.onPerformanceDegradation = (level) => adaptiveQuality?.handleDegradation(level);
  performanceMonitor.onPerformanceRestored = () => adaptiveQuality?.handleRestoration();
  refs.performanceMonitorRef.current = performanceMonitor;
  refs.adaptiveQualityRef.current = adaptiveQuality;

  // Juice effects manager
  const juiceEffectsManager = new JuiceEffectsManager({
    scene, particlePoolManager,
    spsParticleManager: spsParticleManager ?? undefined,
    qualityPreset: currentQualityPreset, prefersReducedMotion,
  });
  refs.juiceEffectsManagerRef.current = juiceEffectsManager;

  // Wire juice into systems
  placementImpactSystem.setJuiceEffectsManager?.(juiceEffectsManager);
  kineticAnimation.setJuiceEffectsManager?.(juiceEffectsManager);
  lineClearSystem?.setJuiceEffectsManager?.(juiceEffectsManager);
  comboMilestoneSystem.setJuiceEffectsManager?.(juiceEffectsManager);
  animationCoordinator.setJuiceEffectsManager?.(juiceEffectsManager);

  // Wire into coordinator
  animationCoordinator.setPlacementImpactSystem(placementImpactSystem);
  animationCoordinator.setComboMilestoneSystem(comboMilestoneSystem);
  animationCoordinator.setPerfectClearCelebration(perfectClearCelebration);
  animationCoordinator.setParticlePoolManager(particlePoolManager);
  animationCoordinator.setParticleEmitter(particleEmitter);
  refs.animationCoordinatorRef.current = animationCoordinator;

  console.log('[AnimationSystems] All systems initialised for MID/HIGH device');

  return () => {
    animationCoordinator?.dispose();
    juiceEffectsManager?.dispose();
    lineClearSystem?.dispose();
    ui3dManager?.dispose();
    refs.specialBlockManagerRef.current?.dispose();
    spsParticleManager?.dispose();
    batterySaver?.dispose();
    refs.animationCoordinatorRef.current = null;
    refs.juiceEffectsManagerRef.current = null;
    refs.lineClearSystemRef.current = null;
    refs.spsParticleManagerRef.current = null;
    refs.ui3dManagerRef.current = null;
    refs.specialBlockManagerRef.current = null;
    refs.kineticAnimationRef.current = null;
    refs.trailManagerRef.current = null;
    refs.performanceMonitorRef.current = null;
    refs.adaptiveQualityRef.current = null;
    refs.batterySaverManagerRef.current = null;
  };
}
