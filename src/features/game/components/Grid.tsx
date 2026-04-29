import React, { useRef, useEffect, useState } from 'react';
import * as BABYLON from 'babylonjs';
import { useGameStore } from '../store/gameStore';
import { useThemeStore } from '../../../shared/store/themeStore';
import { useSettingsStore } from '@core/state/settingsStore';
import { useVisualEffectStore } from '../../visual-effects/store/visualEffectStore';
import { GRID_SIZE, CellType, GridState } from '../types';
import { GameMode } from '@shared/types';
import { getDragYOffset, setCanvasRect } from '../../../utils/responsive/responsive';
import { playHaptic } from '../../../utils/audio';
import { detectDeviceCapabilities, getPerformanceConfig } from '../../../utils/platform/deviceCapability';
import { isAndroid as isAndroidPlatform } from '../../../utils/platform/platform';
import { useFPSLimiter } from '../hooks/useFPSLimiter';
import { useBackgroundPause } from '../hooks/useBackgroundPause';
import { usePerformanceStore } from '../store/performanceStore';
import { injectAndroidTouchCSS, addOptimizedTouchListener } from '../../../utils/device/touchOptimizer';
import clsx from 'clsx';

// Import constants and helpers
import {
  CELL_SIZE,
  TOTAL_CELL_SIZE,
  GRID_OFFSET,
  GHOST_POOL_SIZE,
  SKILL_OVERLAY_POOL_SIZE,
  FRAGMENT_LIFETIME
} from './grid/constants';

import { GameOverAnimation } from './grid/types';

import {
  getVectorPos,
  createBlockMesh,
  initGhostPool,
  initSkillOverlayPool,
  initGuidedHighlightPool,
  initFragmentPool,
  updateFragments,
  createBreakApartFragments,
  updateCameraShake,
  triggerCameraShake,
  updateCameraSettings,
  detectLineClear,
  startLineClearAnimation,
  updateLineClearAnimation,
  updatePlacementAnimations,
  animatePlacement,
  startGameOverAnimation,
  updateGameOverAnimation,
  updateTierFlash,
  updateTimedModeAtmosphere,
  syncGridMeshes
} from './grid/helpers';

// Import AnimationCoordinator and animation systems
import { AnimationCoordinator } from '../../visual-effects/core/AnimationCoordinator';
import { PlacementImpactSystem } from '../../visual-effects/placement/PlacementImpactSystem';
import { ComboMilestoneSystem } from '../../visual-effects/combo/ComboMilestoneSystem';
import { PerfectClearCelebration } from '../../visual-effects/celebration/PerfectClearCelebration';
import { ParticlePoolManager } from '../../visual-effects/particles/ParticlePoolManager';
import { ParticleEmitter } from '../../visual-effects/particles/ParticleEmitter';
import { HapticManager } from '../../../utils/audio/haptics';
import { getBatterySaverManager } from '../../visual-effects/performance/BatterySaverManager';
import { LineClearAnimationSystem } from '../../visual-effects/line-clear/LineClearAnimationSystem';
import { KineticAnimationController } from '../../visual-effects/animation/KineticAnimationController';
import { TrailMeshManager } from '../../visual-effects/animation/TrailMeshManager';
import { PerformanceMonitor } from '../../visual-effects/performance/PerformanceMonitor';
import { AdaptiveQualitySystem } from '../../visual-effects/performance/AdaptiveQualitySystem';
import { SPSParticlePoolManager } from '../../visual-effects/particles/SPSParticlePoolManager';
import { UI3DManager } from '../../visual-effects/ui-3d';
import { SpecialBlockEffectsManager } from '../../visual-effects/special-blocks';
import { JuiceEffectsManager } from '../../visual-effects/juice/JuiceEffectsManager';

interface GridProps {
    grid: GridState;
}

const GridComponent: React.FC<GridProps> = ({ grid: gridProp }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { draggedPiece, placePiece, canPlacePiece, setDraggedPiece, score, combo, lastAction, pieces, activeEvent, gameMode, timeLeft, isGameOver, difficultyTier, totalMovesPlayed, perfectClearDetected } = useGameStore();
    const { getThemeColors } = useThemeStore();
    const { ghostBlockEnabled } = useSettingsStore();

    // Platform detection - calculate once at initialization
    const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.();
    const isAndroid = isNativeApp && /Android/i.test(navigator.userAgent);

    // Refs for Babylon.js engine and scene (needed for hooks)
    const engineRef = useRef<BABYLON.Engine | null>(null);
    const sceneRef = useRef<BABYLON.Scene | null>(null);
    
    // Animation coordinator ref
    const animationCoordinatorRef = useRef<AnimationCoordinator | null>(null);
    
    // Juice effects manager ref
    const juiceEffectsManagerRef = useRef<any | null>(null);
    
    // Line clear animation system ref
    const lineClearSystemRef = useRef<LineClearAnimationSystem | null>(null);
    
    // SPS Particle manager ref
    const spsParticleManagerRef = useRef<SPSParticlePoolManager | null>(null);
    
    // UI3D manager ref
    const ui3dManagerRef = useRef<UI3DManager | null>(null);
    
    // Special block effects manager ref
    const specialBlockManagerRef = useRef<SpecialBlockEffectsManager | null>(null);
    
    // Kinetic animation controller ref
    const kineticAnimationRef = useRef<KineticAnimationController | null>(null);
    const trailManagerRef = useRef<TrailMeshManager | null>(null);
    
    // Performance monitor refs
    const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
    const adaptiveQualityRef = useRef<AdaptiveQualitySystem | null>(null);

    // Task 9.1: Integrate useFPSLimiter hook
    const { state: fpsState } = useFPSLimiter(engineRef.current, true);

    // Task 9.2: Integrate useBackgroundPause hook
    const { state: bgPauseState } = useBackgroundPause(true);

    // Local FPS limiter for render loop (syncs with hook's target FPS)
    const fpsLimiterRef = useRef<{
        lastFrameTime: number;
        targetFrameTime: number;
        shouldRenderFrame: () => boolean;
        updateFrameTime: () => void;
        setTargetFPS: (fps: number) => void;
    }>({
        lastFrameTime: 0,
        targetFrameTime: 1000 / 60,
        shouldRenderFrame: function() {
            const now = performance?.now?.() ?? Date.now();
            const elapsed = now - this.lastFrameTime;
            return elapsed >= this.targetFrameTime;
        },
        updateFrameTime: function() {
            this.lastFrameTime = performance?.now?.() ?? Date.now();
        },
        setTargetFPS: function(fps: number) {
            this.targetFrameTime = 1000 / fps;
        }
    });

    // Sync FPS limiter with hook's target FPS
    useEffect(() => {
        fpsLimiterRef.current.setTargetFPS(fpsState.targetFPS);
    }, [fpsState.targetFPS]);

    // Task 9.3: Record FPS metrics every second
    useEffect(() => {
        if (!engineRef.current) return;

        const recordFPSInterval = setInterval(() => {
            const currentFPS = engineRef.current?.getFps() ?? 60;
            usePerformanceStore.getState().recordFPS(currentFPS);
        }, 1000);

        return () => clearInterval(recordFPSInterval);
    }, []);

    // Task 9.5: Inject Android touch CSS on mount
    useEffect(() => {
        // Inject Android touch optimizer CSS
        injectAndroidTouchCSS();
        
        console.log('[Grid] Android touch CSS injected');
    }, []);

    const stateRef = useRef({ grid: gridProp, draggedPiece, score, combo, lastAction, pieces, activeEvent, gameMode, timeLeft, isGameOver, difficultyTier, perfectClearDetected });
    useEffect(() => { stateRef.current = { grid: gridProp, draggedPiece, score, combo, lastAction, pieces, activeEvent, gameMode, timeLeft, isGameOver, difficultyTier, perfectClearDetected }; }, [gridProp, draggedPiece, score, combo, lastAction, pieces, activeEvent, gameMode, timeLeft, isGameOver, difficultyTier, perfectClearDetected]);
    
    // Track previous score to detect game reset
    const prevScoreRef = useRef(score);
    
    // Detect game reset and animate mesh cleanup
    useEffect(() => {
        // If score goes from non-zero to zero, game was reset
        if (prevScoreRef.current > 0 && score === 0 && !isGameOver) {
            console.log('[Grid] Game reset detected, animating mesh cleanup');
            
            // Animate all meshes flying away
            const meshesToAnimate: Array<{
                mesh: BABYLON.Mesh;
                velocity: BABYLON.Vector3;
                rotationVelocity: BABYLON.Vector3;
                startTime: number;
            }> = [];
            
            meshMapRef.current.forEach((mesh) => {
                // Random upward velocity with some horizontal spread
                const velocity = new BABYLON.Vector3(
                    (Math.random() - 0.5) * 8,  // Random X velocity
                    Math.random() * 12 + 8,      // Upward Y velocity (8-20)
                    (Math.random() - 0.5) * 8    // Random Z velocity
                );
                
                const rotationVelocity = new BABYLON.Vector3(
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.3
                );
                
                meshesToAnimate.push({
                    mesh,
                    velocity,
                    rotationVelocity,
                    startTime: Date.now()
                });
            });
            
            // Animate meshes for 1 second then dispose
            const animationDuration = 1000; // 1 second
            const gravity = -20; // Gravity acceleration
            
            const animateCleanup = () => {
                const now = Date.now();
                let allDone = true;
                
                meshesToAnimate.forEach(({ mesh, velocity, rotationVelocity, startTime }) => {
                    const elapsed = (now - startTime) / 1000; // Convert to seconds
                    
                    if (elapsed < animationDuration / 1000) {
                        allDone = false;
                        
                        // Apply physics
                        const deltaTime = 0.016; // ~60 FPS
                        velocity.y += gravity * deltaTime;
                        
                        mesh.position.addInPlace(velocity.clone().scale(deltaTime));
                        mesh.rotation.addInPlace(rotationVelocity);
                        
                        // Fade out
                        const fadeProgress = elapsed / (animationDuration / 1000);
                        if (mesh.material) {
                            (mesh.material as BABYLON.StandardMaterial).alpha = 1 - fadeProgress;
                        }
                    }
                });
                
                if (!allDone) {
                    requestAnimationFrame(animateCleanup);
                } else {
                    // Animation complete, dispose all meshes
                    meshMapRef.current.forEach((mesh) => {
                        mesh.dispose();
                    });
                    meshMapRef.current.clear();
                    
                    console.log('[Grid] Animated mesh cleanup complete');
                }
            };
            
            // Start animation
            requestAnimationFrame(animateCleanup);
            
            // Reset animation states
            lineClearAnimationRef.current = null;
            placementAnimationRef.current = null;
            gameOverAnimationRef.current = null;
            tierFlashRef.current = null;
            comboStateRef.current = null;
            
            // Clear fragment pool
            fragmentPoolRef.current.activeFragments.forEach(({ mesh }) => {
                mesh.isVisible = false;
            });
            fragmentPoolRef.current.activeFragments.clear();
            
            // Hide ghost meshes
            ghostMeshesRef.current.forEach(m => { m.isVisible = false; });
            
            // Reset last action
            lastHandledActionRef.current = null;
        }
        
        prevScoreRef.current = score;
    }, [score, isGameOver]);

    // REMOVED: const [hoverCoord, setHoverCoord] = useState<{ x: number, y: number } | null>(null);
    // Using only ref to avoid React re-renders on every hover update
    const hoverCoordRef = useRef<{ x: number, y: number } | null>(null);
    const globalMouseRef = useRef<{ x: number, y: number } | null>(null);

    const meshMapRef = useRef<Map<string, BABYLON.Mesh>>(new Map());
    const ghostMeshesRef = useRef<BABYLON.Mesh[]>([]);
    const guidedHighlightMeshesRef = useRef<BABYLON.Mesh[]>([]);
    const ambientParticlesRef = useRef<BABYLON.Mesh[]>([]);
    const lastScoreRef = useRef(0);
    const glowLayerRef = useRef<BABYLON.GlowLayer | null>(null);
    const placementHandledRef = useRef(false);
    const skillOverlayMeshesRef = useRef<BABYLON.Mesh[]>([]);
    
    // Fragment pool for break apart animation
    const fragmentPoolRef = useRef<{
        pool: BABYLON.Mesh[];
        activeFragments: Map<string, {
            mesh: BABYLON.Mesh;
            velocity: BABYLON.Vector3;
            rotationVelocity: BABYLON.Vector3;
            startTime: number;
            startAlpha: number;
        }>;
    }>({
        pool: [],
        activeFragments: new Map()
    });

    // Refs for render loop logic
    const lastHandledActionRef = useRef<any>(null);
    const shakeIntensityRef = useRef(0);
    const perfectClearHandledRef = useRef(false);
    
    // Line clear animation state
    const lineClearAnimationRef = useRef<{
        active: boolean;
        phase: 'brightness' | 'particles' | 'collapse';
        progress: number;
        startTime: number;
        clearedCells: Set<string>;
        affectedBlocks: Map<string, { startY: number; targetY: number }>;
        originalColors: Map<string, BABYLON.Color3>;
    } | null>(null);
    
    // Placement animation state (Juice System)
    const placementAnimationRef = useRef<{
        active: boolean;
        startTime: number;
        cellAnimations: Map<string, {
            cellId: string;
            startTime: number;
            originalScale: BABYLON.Vector3;
            originalEmissive: BABYLON.Color3;
        }>;
    } | null>(null);
    
    // Combo celebration state (Juice System)
    const comboStateRef = useRef<{
        active: boolean;
        level: number;
        startTime: number;
        flashProgress: number;
    } | null>(null);
    
    // Game over animation state
    const gameOverAnimationRef = useRef<GameOverAnimation | null>(null);
    
    // Tier transition flash state
    const tierFlashRef = useRef<{
        active: boolean;
        progress: number;
        startTime: number;
        tier: number;
        color: BABYLON.Color3;
    } | null>(null);
    const prevTierRef = useRef(0);
    
    // Task 3.2: Idle detection system refs
    const renderLoopActiveRef = useRef(true);
    const lastTouchTimeRef = useRef(Date.now());
    const idleCheckIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Device capability detection with performance config
        const deviceCapabilities = detectDeviceCapabilities();
        const perfConfig = getPerformanceConfig(deviceCapabilities.tier);
        
        console.log('[Grid] Performance config:', perfConfig);
        
        // Platform detection for Android-specific optimizations
        const androidPlatform = isAndroidPlatform();
        console.log('[Grid] Android platform:', androidPlatform);
        
        // Reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Low-end device flag for compatibility with existing code
        const isLowEndDevice = deviceCapabilities.tier === 'low';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || deviceCapabilities.isNative;
        
        // Disable animations on low-end devices, native apps, or when reduced motion is preferred
        const disableAnimations = prefersReducedMotion || isLowEndDevice || deviceCapabilities.isNative;

        // Engine configuration based on device capability
        let engine: BABYLON.Engine;
        try {
          // Weak device optimizations
          const devicePixelRatioLimit = isLowEndDevice ? 1.0 : Math.min(window.devicePixelRatio, 2);
          
          engine = new BABYLON.Engine(canvasRef.current, true, {
              preserveDrawingBuffer: true,
              stencil: true,
              antialias: perfConfig.antialias,
              adaptToDeviceRatio: !isLowEndDevice, // Disable on weak devices
              limitDeviceRatio: devicePixelRatioLimit,
              doNotHandleContextLost: false,
              powerPreference: isLowEndDevice ? 'low-power' : 'high-performance',
          });
          
          // Verify WebGL is available
          if (!engine.webGLVersion) {
            throw new Error('WebGL not supported');
          }
        } catch (error) {
          console.error('[Grid] WebGL initialization failed:', error);
          // Show user-friendly error message
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1f2937;color:#e5e7eb;padding:24px;border-radius:12px;text-align:center;max-width:300px;z-index:9999;';
          errorDiv.innerHTML = '<h3 style="margin:0 0 12px 0;font-size:18px;">Grafik Desteği Gerekli</h3><p style="margin:0;font-size:14px;opacity:0.8;">Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor.</p>';
          document.body.appendChild(errorDiv);
          return;
        }

        // Store engine ref for hooks
        engineRef.current = engine;

        // Hardware scaling based on device tier
        engine.setHardwareScalingLevel(perfConfig.hardwareScaling);
        
        console.log(`[Grid] Hardware scaling set to ${perfConfig.hardwareScaling} for ${deviceCapabilities.tier} tier device`);
        console.log(`[Grid] Device info:`, {
            tier: deviceCapabilities.tier,
            memory: deviceCapabilities.memory,
            cores: deviceCapabilities.cores,
            gpu: deviceCapabilities.gpuRenderer,
            isNative: deviceCapabilities.isNative,
            isAndroid: deviceCapabilities.isAndroid
        });

        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

        // Store scene ref for hooks
        sceneRef.current = scene;

        // Low-end device scene optimizations
        if (isLowEndDevice) {
            // Disable expensive features
            scene.skipPointerMovePicking = true;
            scene.autoClear = true;
            scene.autoClearDepthAndStencil = true;
            scene.blockMaterialDirtyMechanism = true; // Disable material dirty checks
            scene.renderTargetsEnabled = false; // Disable render targets
            
            // Aggressive performance optimizations
            scene.particlesEnabled = false; // Disable all particle systems
            scene.spritesEnabled = false; // Disable sprites
            scene.postProcessesEnabled = false; // Disable post-processing
            scene.lensFlaresEnabled = false; // Disable lens flares
            scene.proceduralTexturesEnabled = false; // Disable procedural textures
            scene.shadowsEnabled = false; // Disable shadows completely
            
            // Reduce render quality
            scene.imageProcessingConfiguration.vignetteEnabled = false;
            scene.imageProcessingConfiguration.grainEnabled = false;
            scene.imageProcessingConfiguration.chromaticAberrationEnabled = false;
            
            // Apply Babylon's scene optimizer
            BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.HighDegradationAllowed());
            
            console.log('[Grid] AGGRESSIVE scene optimizations applied for low-end device');
        }

        // Store references for theme updates
        const gridBaseRef = { current: null as BABYLON.Mesh | null };
        const gridSlotsRef: BABYLON.Mesh[] = [];

        // Calculate initial camera radius based on screen
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const isPortrait = screenH > screenW;
        const aspectRatio = screenW / screenH;
        
        let initialRadius = 16; // Default
        if (isPortrait) {
            if (aspectRatio < 0.48) {
                initialRadius = 12.0;
            } else if (aspectRatio < 0.55) {
                initialRadius = 12.0;
            } else if (aspectRatio < 0.65) {
                initialRadius = 12.5;
            } else {
                initialRadius = 13.0;
            }
            // Apply native app adjustment immediately - MUCH SMALLER grid
            if (isNativeApp) {
                initialRadius = initialRadius + 2.0; // Increased from +0.5 to +2.0 for MUCH SMALLER grid
                console.log('[Grid] Initial radius adjusted for native app:', initialRadius);
            }
        }
        
        console.log('[Grid] Creating camera with initial radius:', initialRadius);

        // Camera — beta π/11 ≈ 16.4° daha tepeden/havadan bakış
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 11, initialRadius, BABYLON.Vector3.Zero(), scene);
        camera.lowerRadiusLimit = 8;
        camera.upperRadiusLimit = 35;
        camera.lowerBetaLimit = 0.1;
        camera.upperBetaLimit = Math.PI / 2.5;

        // Reduce camera far plane on low-end devices
        if (isLowEndDevice) {
            camera.maxZ = 50; // Reduced from default 10000
        }

        updateCameraSettings(camera, isNativeApp);

        // Resize handler to adjust camera dynamically
        const handleResize = () => {
            engine.resize();
            updateCameraSettings(camera, isNativeApp);
        };
        window.addEventListener('resize', handleResize);

        // Lighting — Daha yumuşak parlaklık
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = isMobile ? 0.5 : 0.7; // Daha düşük ambient ışık
        light.groundColor = new BABYLON.Color3(0.06, 0.06, 0.1); // Daha koyu zemin

        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
        dirLight.position = new BABYLON.Vector3(20, 40, 20);
        dirLight.intensity = isMobile ? 0.38 : 0.55; // Daha düşük directional

        // Disable directional light on low-end devices
        if (isLowEndDevice) {
            dirLight.intensity = 0;
        }

        // Bloom Effect - Glow layer for combo and special block effects
        // Disabled on low-end devices and native mobile apps for performance
        // IMPORTANT: Don't create GlowLayer at all on weak devices (not just intensity 0)
        if (!isLowEndDevice && !isNativeApp && perfConfig.enableGlow) {
            const glowLayer = new BABYLON.GlowLayer("glow", scene, {
                mainTextureSamples: 2,
                blurKernelSize: 16
            });
            glowLayer.intensity = 0.3; // Base intensity for bloom effect
            glowLayerRef.current = glowLayer;
        } else {
            glowLayerRef.current = null; // Explicitly set to null on weak devices
        }

        // --- The Board ---
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
        ground.visibility = 0;

        // Get theme colors
        const themeColors = getThemeColors();
        
        // Grid Base — themed
        const baseSize = (GRID_SIZE * TOTAL_CELL_SIZE) + 1.5;
        const gridBase = BABYLON.MeshBuilder.CreateBox("gridBase", { width: baseSize, height: 0.1, depth: baseSize }, scene);
        gridBase.position.y = -0.6;
        const gridMat = new BABYLON.StandardMaterial("gridMat", scene);
        gridMat.diffuseColor = BABYLON.Color3.FromHexString(themeColors.gridBase);
        gridMat.emissiveColor = BABYLON.Color3.FromHexString(themeColors.gridBase).scale(0.6);
        gridMat.specularColor = BABYLON.Color3.Black();
        gridMat.specularPower = 0;
        gridBase.material = gridMat;
        gridBase.isPickable = false;
        gridBaseRef.current = gridBase;

        // Grid Slots - themed
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const slot = BABYLON.MeshBuilder.CreateBox(`slot-${x}-${y}`, { width: 0.95, depth: 0.95, height: 0.05 }, scene);
                slot.position.x = (x * TOTAL_CELL_SIZE) - GRID_OFFSET;
                slot.position.z = -((y * TOTAL_CELL_SIZE) - GRID_OFFSET);
                slot.position.y = -0.5;
                slot.isPickable = false;

                const slotMat = new BABYLON.StandardMaterial(`slotMat-${x}-${y}`, scene);
                slotMat.diffuseColor = BABYLON.Color3.FromHexString(themeColors.gridSlot);
                slotMat.emissiveColor = BABYLON.Color3.FromHexString(themeColors.gridSlot).scale(0.8);
                slotMat.specularColor = BABYLON.Color3.Black();
                slotMat.alpha = 0.92;
                slot.material = slotMat;

                // Grid lines — themed and more visible
                // CRITICAL: Skip edges on LOW devices - 100 slots * edges = MASSIVE performance hit
                if (!isLowEndDevice) {
                    slot.enableEdgesRendering();
                    slot.edgesWidth = isMobile ? 2.0 : 2.5;
                    const edgeColor = BABYLON.Color3.FromHexString(themeColors.gridEdge);
                    slot.edgesColor = new BABYLON.Color4(edgeColor.r, edgeColor.g, edgeColor.b, 0.5);
                }
                
                gridSlotsRef.push(slot);
            }
        }

        // Subscribe to theme changes
        const unsubscribeTheme = useThemeStore.subscribe((state) => {
            const colors = state.getThemeColors();
            
            // Update grid base
            if (gridBaseRef.current && gridBaseRef.current.material) {
                const mat = gridBaseRef.current.material as BABYLON.StandardMaterial;
                mat.diffuseColor = BABYLON.Color3.FromHexString(colors.gridBase);
                mat.emissiveColor = BABYLON.Color3.FromHexString(colors.gridBase).scale(0.6);
            }
            
            // Update grid slots
            gridSlotsRef.forEach((slot) => {
                if (slot.material) {
                    const mat = slot.material as BABYLON.StandardMaterial;
                    mat.diffuseColor = BABYLON.Color3.FromHexString(colors.gridSlot);
                    mat.emissiveColor = BABYLON.Color3.FromHexString(colors.gridSlot).scale(0.8);
                    
                    const edgeColor = BABYLON.Color3.FromHexString(colors.gridEdge);
                    slot.edgesColor = new BABYLON.Color4(edgeColor.r, edgeColor.g, edgeColor.b, 0.5);
                }
            });
            
            // Update all NORMAL type piece meshes (not ICE or BOMB which have fixed colors)
            meshMapRef.current.forEach((mesh) => {
                if (mesh.material) {
                    const mat = mesh.material as BABYLON.StandardMaterial;
                    // Only update NORMAL blocks - ICE and BOMB have fixed colors
                    // Check if this is a normal block by checking if it doesn't have the special colors
                    const currentDiffuse = mat.diffuseColor;
                    const isIce = currentDiffuse.r > 0.6 && currentDiffuse.g > 0.8 && currentDiffuse.b > 0.9;
                    const isBomb = currentDiffuse.r > 0.1 && currentDiffuse.g < 0.15 && currentDiffuse.b < 0.15;
                    
                    if (!isIce && !isBomb) {
                        // This is a normal block - update its emissive to match new theme
                        mat.emissiveColor = currentDiffuse.scale(0.05);
                    }
                }
            });
        });

        // --- Ambient Particles removed ---
        ambientParticlesRef.current = [];

        // Initialize pools
        ghostMeshesRef.current = initGhostPool(scene);
        skillOverlayMeshesRef.current = initSkillOverlayPool(scene);
        guidedHighlightMeshesRef.current = initGuidedHighlightPool(scene);
        fragmentPoolRef.current.pool = initFragmentPool(scene);
        
        // Initialize AnimationCoordinator and animation systems
        // Skip on LOW devices to save massive CPU/GPU
        let animationCoordinator: AnimationCoordinator | null = null;
        let particlePoolManager: ParticlePoolManager | null = null;
        let particleEmitter: ParticleEmitter | null = null;
        let placementImpactSystem: PlacementImpactSystem | null = null;
        let comboMilestoneSystem: ComboMilestoneSystem | null = null;
        let perfectClearCelebration: PerfectClearCelebration | null = null;
        let lineClearSystem: LineClearAnimationSystem | null = null;
        let spsParticleManager: SPSParticlePoolManager | null = null;
        let juiceEffectsManager: any | null = null;
        let trailManager: TrailMeshManager | null = null;
        let kineticAnimation: KineticAnimationController | null = null;
        let performanceMonitor: PerformanceMonitor | null = null;
        let adaptiveQuality: AdaptiveQualitySystem | null = null;
        
        if (!isLowEndDevice) {
            animationCoordinator = new AnimationCoordinator({
                scene,
                qualityPreset: deviceCapabilities.tier === 'high' ? 'high' : 'medium',
                prefersReducedMotion
            });
        
            // Track current quality preset for adaptive reduction
            let currentQualityPreset: 'high' | 'medium' | 'low' = deviceCapabilities.tier === 'high' ? 'high' : 'medium';
            
            // Initialize particle pool manager
            const qualityMultiplier = deviceCapabilities.tier === 'high' ? 1.0 : 0.5;
            particlePoolManager = new ParticlePoolManager({
                scene,
                qualityMultiplier
            });
            
            // Task 20: Initialize particle emitter for line clear particles
            particleEmitter = new ParticleEmitter(particlePoolManager);
            
            // Initialize haptic manager
            const hapticManager = new HapticManager();
            
            // Task 24.7: Initialize battery saver manager
            // Requirements: 14.6
            const batterySaverManager = getBatterySaverManager({
                onQualityChange: (preset) => {
                    console.log('[Grid] Battery saver quality change:', preset);
                    currentQualityPreset = preset;
                    animationCoordinator?.setQualityPreset(preset);
                    particlePoolManager?.setQualityPreset(preset);
                    
                    // Disable glow layer on low preset
                    if (preset === 'low' && glowLayerRef.current) {
                        glowLayerRef.current.intensity = 0;
                    }
                },
                onFPSChange: (targetFPS) => {
                    console.log('[Grid] Battery saver FPS change:', targetFPS);
                    fpsLimiterRef.current.setTargetFPS(targetFPS);
                },
                onHapticsChange: (enabled) => {
                    console.log('[Grid] Battery saver haptics change:', enabled);
                    hapticManager.setEnabled(enabled);
                }
            });
            
            // Initialize battery monitoring (async)
            batterySaverManager.initialize().catch((error) => {
                console.debug('[Grid] Battery saver initialization failed:', error);
            });
            
            // Initialize placement impact system
            placementImpactSystem = new PlacementImpactSystem(
                scene,
                particlePoolManager,
                hapticManager
            );
            
            // Set reduced motion preference
            if (prefersReducedMotion) {
                placementImpactSystem.setReducedMotion(true);
            }
            
            // Initialize combo milestone system
            comboMilestoneSystem = new ComboMilestoneSystem(
                particleEmitter,
                hapticManager
            );
            
            // Set reduced motion preference
            if (prefersReducedMotion) {
                comboMilestoneSystem.setReducedMotion(true);
            }
            
            // Initialize perfect clear celebration
            perfectClearCelebration = new PerfectClearCelebration(
                particleEmitter,
                hapticManager
            );
            
            // Set reduced motion preference
            if (prefersReducedMotion) {
                perfectClearCelebration.setReducedMotion(true);
            }
            
            // Initialize line clear animation system with SPS particle manager
            spsParticleManager = new SPSParticlePoolManager({
                scene,
                capacity: deviceCapabilities.tier === 'high' ? 2000 : 1000,
                particleSize: 0.1,
            });
            spsParticleManagerRef.current = spsParticleManager;
            
            lineClearSystem = new LineClearAnimationSystem(scene, spsParticleManager);
            if (prefersReducedMotion) {
                lineClearSystem.setReducedMotion(true);
            }
            lineClearSystemRef.current = lineClearSystem;
            
            // Initialize UI3D Manager
            const ui3dManager = new UI3DManager(scene);
            ui3dManager.initializeComboMeter(new BABYLON.Vector3(8, 15, 0));
            ui3dManagerRef.current = ui3dManager;
            
            // Initialize Special Block Effects Manager
            const specialBlockManager = new SpecialBlockEffectsManager(scene, spsParticleManager);
            specialBlockManagerRef.current = specialBlockManager;
            
            // Initialize kinetic animation controller and trail manager
            trailManager = new TrailMeshManager(scene);
            kineticAnimation = new KineticAnimationController();
            kineticAnimation.setTrailManager(trailManager);
            kineticAnimationRef.current = kineticAnimation;
            trailManagerRef.current = trailManager;
            
            // Initialize performance monitor and adaptive quality system
            performanceMonitor = new PerformanceMonitor();
            adaptiveQuality = new AdaptiveQualitySystem({
                particleManager: spsParticleManager,
                trailManager: trailManager,
                onPerformanceModeChange: (enabled) => {
                    console.log('[Grid] Performance mode:', enabled);
                }
            });
            
            // Store refs
            performanceMonitorRef.current = performanceMonitor;
            adaptiveQualityRef.current = adaptiveQuality;
            
            // Initialize Juice Effects Manager (after all systems are created)
            juiceEffectsManager = new JuiceEffectsManager({
                scene,
                particlePoolManager,
                spsParticleManager,
                qualityPreset: currentQualityPreset,
                prefersReducedMotion,
            });
            juiceEffectsManagerRef.current = juiceEffectsManager;
            
            // Inject juice effects manager into animation systems
            placementImpactSystem.setJuiceEffectsManager?.(juiceEffectsManager);
            kineticAnimation.setJuiceEffectsManager?.(juiceEffectsManager);
            lineClearSystem.setJuiceEffectsManager?.(juiceEffectsManager);
            comboMilestoneSystem.setJuiceEffectsManager?.(juiceEffectsManager);
            comboMilestoneSystem.setMeshMap?.(meshMapRef.current);
            animationCoordinator.setJuiceEffectsManager?.(juiceEffectsManager);
            
            // Connect performance monitor callbacks
            performanceMonitor.onPerformanceDegradation = (level) => {
                adaptiveQuality?.handleDegradation(level);
            };
            
            performanceMonitor.onPerformanceRestored = () => {
                adaptiveQuality?.handleRestoration();
            };
            
            // Inject animation systems into coordinator
            animationCoordinator.setPlacementImpactSystem(placementImpactSystem);
            animationCoordinator.setComboMilestoneSystem(comboMilestoneSystem);
            animationCoordinator.setPerfectClearCelebration(perfectClearCelebration);
            
            // Task 20: Inject particle systems into coordinator
            animationCoordinator.setParticlePoolManager(particlePoolManager);
            animationCoordinator.setParticleEmitter(particleEmitter);
            
            // Store coordinator ref
            animationCoordinatorRef.current = animationCoordinator;
            
            console.log('[Grid] Animation systems initialized for MID/HIGH tier device');
        } else {
            // LOW device: Skip ALL animation systems
            animationCoordinatorRef.current = null;
            juiceEffectsManagerRef.current = null;
            lineClearSystemRef.current = null;
            spsParticleManagerRef.current = null;
            ui3dManagerRef.current = null;
            specialBlockManagerRef.current = null;
            kineticAnimationRef.current = null;
            trailManagerRef.current = null;
            performanceMonitorRef.current = null;
            adaptiveQualityRef.current = null;
            
            console.log('[Grid] Animation systems DISABLED for LOW tier device');
        }


        // --- Logic Helpers ---
        const getVectorPos = (gx: number, gy: number) => {
            return new BABYLON.Vector3(
                (gx * TOTAL_CELL_SIZE) - GRID_OFFSET,
                0,
                -((gy * TOTAL_CELL_SIZE) - GRID_OFFSET)
            );
        };

        // Wrapper for createBlockMesh helper - pass device tier for optimization
        const createBlockMeshLocal = (colorHex: string, id: string, type: CellType = CellType.NORMAL, health?: number) => {
            const mesh = createBlockMesh(colorHex, id, scene, type, health);
            
            // CRITICAL OPTIMIZATION: Disable edges rendering on LOW devices
            // Edges rendering is VERY expensive and causes massive FPS drops
            if (isLowEndDevice && mesh.edgesRenderer) {
                mesh.disableEdgesRendering();
            }
            
            return mesh;
        };

        // --- Interaction ---
        const updateHover = () => {
            let pickInfo: BABYLON.PickingInfo | null = null;

            if (globalMouseRef.current && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = globalMouseRef.current.x - rect.left;
                const y = globalMouseRef.current.y - rect.top;

                // Drag offset - Must exactly match the 2D DragOverlay offset
                const DRAG_Y_OFFSET = stateRef.current.draggedPiece ? getDragYOffset() : 0;

                // Always try to pick, even if outside canvas bounds
                // This allows ghost preview to show when dragging from outside
                pickInfo = scene.pick(x, y + DRAG_Y_OFFSET, (mesh) => mesh === ground);
            }

            if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
                const p = pickInfo.pickedPoint;
                const rawX = (p.x + GRID_OFFSET) / TOTAL_CELL_SIZE;
                const rawY = (-p.z + GRID_OFFSET) / TOTAL_CELL_SIZE;
                const rx = Math.round(rawX);
                const ry = Math.round(rawY);

                const { draggedPiece } = stateRef.current;
                if (draggedPiece) {
                    const shapeW = draggedPiece.shape[0].length;
                    const shapeH = draggedPiece.shape.length;
                    const fx = rx - Math.floor((shapeW - 1) / 2);
                    const fy = ry - Math.floor((shapeH - 1) / 2);

                    const newCoord = { x: fx, y: fy };
                    if (!hoverCoordRef.current || hoverCoordRef.current.x !== fx || hoverCoordRef.current.y !== fy) {
                        hoverCoordRef.current = newCoord;
                        // REMOVED: setHoverCoord(newCoord); - Avoid React re-render

                        // Magnetic Haptic Feedback on mobile
                        playHaptic('hover');
                    }

                    // --- Ghost Piece Logic (Pool-based) ---
                    // Only show ghost if enabled in settings
                    if (ghostBlockEnabled) {
                        // Hide all ghosts first
                        ghostMeshesRef.current.forEach(m => { m.isVisible = false; });

                        // Check if valid placement
                        const isValid = canPlacePiece(stateRef.current.grid, draggedPiece, fx, fy);

                        if (isValid) {
                            // Show ghost meshes from pool
                            let ghostIndex = 0;
                            draggedPiece.shape.forEach((row, rIdx) => {
                                row.forEach((cell, cIdx) => {
                                    if (cell && ghostIndex < GHOST_POOL_SIZE) {
                                        const gx = fx + cIdx;
                                        const gy = fy + rIdx;
                                        
                                        const ghost = ghostMeshesRef.current[ghostIndex++];
                                        ghost.position = getVectorPos(gx, gy);
                                        ghost.position.y = -0.2; // Higher position to avoid overlap with grid blocks

                                        const gMat = ghost.material as BABYLON.StandardMaterial;
                                        
                                        // For BOMB pieces, use a brighter red color for visibility
                                        const ghostColor = draggedPiece.type === CellType.BOMB 
                                            ? '#ef4444' // Bright red for BOMB
                                            : draggedPiece.color;
                                        
                                        gMat.diffuseColor = BABYLON.Color3.FromHexString(ghostColor);
                                        gMat.emissiveColor = BABYLON.Color3.FromHexString(ghostColor).scale(0.6);
                                        gMat.alpha = 0.5; // Slightly more opaque for better visibility
                                        
                                        // Disable edges for ghost preview (no borders)
                                        ghost.disableEdgesRendering();
                                        
                                        ghost.isVisible = true;
                                    }
                                });
                            });
                        }
                    } else {
                        // Hide all ghosts if setting is disabled
                        ghostMeshesRef.current.forEach(m => { m.isVisible = false; });
                    }
                } else {
                    const newCoord = { x: rx, y: ry };
                    hoverCoordRef.current = newCoord;
                    // REMOVED: setHoverCoord(newCoord); - Avoid React re-render
                }
            } else {
                // Only clear hover if not dragging a piece
                // This allows ghost to persist when dragging from outside canvas
                if (!stateRef.current.draggedPiece) {
                    hoverCoordRef.current = null;
                    // REMOVED: setHoverCoord(null); - Avoid React re-render
                    ghostMeshesRef.current.forEach(m => { m.isVisible = false; });
                }
            }
        };

        // --- Render Loop ---
        // IMPORTANT: All logic is in registerBeforeRender, NOT in runRenderLoop
        // This prevents duplicate render calls and improves performance
        let time = 0;
        let frameCount = 0; // Frame counter for throttling animations
        let hoverUpdateCounter = 0; // Counter for throttling hover updates on weak devices
        
        // Adaptive throttling based on device tier - ULTRA AGGRESSIVE for GM510
        const animationThrottle = deviceCapabilities.tier === 'low' ? 15 : deviceCapabilities.tier === 'mid' ? 6 : 2;
        const hoverThrottle = deviceCapabilities.tier === 'low' ? 12 : deviceCapabilities.tier === 'mid' ? 6 : 1;
        const gridSyncThrottle = deviceCapabilities.tier === 'low' ? 8 : deviceCapabilities.tier === 'mid' ? 3 : 1;
        
        console.log(`[Grid] Throttling config:`, {
            animation: `every ${animationThrottle} frames`,
            hover: `every ${hoverThrottle} frames`,
            gridSync: `every ${gridSyncThrottle} frames`,
            tier: deviceCapabilities.tier
        });

        scene.registerBeforeRender(() => {
            // Task 3.1: FPS Limiter check moved to render loop - this callback always runs
            // The actual frame skipping happens in the render loop (native/web paths)
            
            const deltaTime = engine.getDeltaTime() / 1000; // Convert to seconds
            time += deltaTime;
            frameCount++;
            const currentTime = Date.now(); // Current timestamp for animations
            const { grid, draggedPiece, score, combo, lastAction, isGameOver, gameMode: currentGameMode, timeLeft: currentTimeLeft, difficultyTier: currentTier, perfectClearDetected: currentPerfectClear } = stateRef.current;

            // ─── Animation Coordinator: Update all animation systems ───
            // Throttle on MID tier devices (every 3 frames = 20fps)
            const shouldUpdateAnimations = deviceCapabilities.tier === 'high' || (frameCount % animationThrottle === 0);
            
            if (animationCoordinatorRef.current && !isLowEndDevice && shouldUpdateAnimations) {
                animationCoordinatorRef.current.update(currentTime);
            }
            
            // ─── Juice Effects Manager: Update all juice effects ───
            // Throttle on MID tier devices
            if (juiceEffectsManagerRef.current && !isLowEndDevice && shouldUpdateAnimations) {
                juiceEffectsManagerRef.current.update(deltaTime, camera);
            }
            
            // ─── SPS Particle Manager: Update particle physics ───
            // Throttle on MID tier devices
            if (spsParticleManagerRef.current && !isLowEndDevice && shouldUpdateAnimations) {
                spsParticleManagerRef.current.update(deltaTime * 1000, camera); // Convert to milliseconds
            }
            
            // ─── UI3D Manager: Update all UI elements ───
            // Throttle on MID tier devices
            if (ui3dManagerRef.current && !isLowEndDevice && shouldUpdateAnimations) {
                ui3dManagerRef.current.update(deltaTime * 1000); // Convert to milliseconds
            }
            
            // ─── Special Block Manager: Update all special block effects ───
            // Throttle on MID tier devices
            if (specialBlockManagerRef.current && !isLowEndDevice && shouldUpdateAnimations) {
                specialBlockManagerRef.current.update(deltaTime * 1000); // Convert to milliseconds
            }
            
            // ─── Performance Monitor: Update FPS tracking ───
            // Keep this for all devices to monitor performance
            if (performanceMonitorRef.current) {
                performanceMonitorRef.current.update(deltaTime);
                
                // Update metrics (skip particle counting on weak devices)
                if (spsParticleManagerRef.current && !isLowEndDevice) {
                    const particleCount = spsParticleManagerRef.current.getActiveCount();
                    performanceMonitorRef.current.setParticleCount(particleCount);
                    performanceMonitorRef.current.setTrailCount(trailManagerRef.current?.getActiveTrailCount() || 0);
                }
            }
            
            // ─── Kinetic Animation Controller: Update squash/stretch animations ───
            // Skip on weak devices to save CPU
            if (kineticAnimationRef.current && !isLowEndDevice) {
                const scales = kineticAnimationRef.current.update(deltaTime * 1000); // Convert to milliseconds
                
                // Apply scales to meshes
                scales.forEach((scale, pieceId) => {
                    const mesh = meshMapRef.current.get(pieceId);
                    if (mesh) {
                        mesh.scaling.set(scale[0], scale[1], scale[2]);
                    }
                });
            }
            
            // ─── Perfect Clear Detection ───
            // Skip on weak devices to save CPU
            if (currentPerfectClear && !perfectClearHandledRef.current && !isLowEndDevice) {
                if (animationCoordinatorRef.current) {
                    animationCoordinatorRef.current.triggerPerfectClear();
                }
                
                // ─── UI3D: Show perfect clear effects ───
                if (ui3dManagerRef.current) {
                    const centerPos = new BABYLON.Vector3(5, 10, 0);
                    const achievementPos = new BABYLON.Vector3(8, 12, 0);
                    
                    // Show big score
                    ui3dManagerRef.current.showFloatingScore(
                        5000,
                        centerPos,
                        new BABYLON.Color3(0, 1, 1) // Cyan
                    );
                    
                    // Show achievement
                    ui3dManagerRef.current.showAchievement('Perfect Clear!', '✨', achievementPos);
                }
                
                perfectClearHandledRef.current = true;
                
                // Reset flag after celebration
                setTimeout(() => {
                    useGameStore.setState({ perfectClearDetected: false });
                    perfectClearHandledRef.current = false;
                }, 2000);
            }

            // ─── Juice System: Update Placement Animations ───
            // Skip on weak devices to save CPU
            if (!isLowEndDevice) {
                updatePlacementAnimations(currentTime, placementAnimationRef, meshMapRef.current, prefersReducedMotion);
            }
            
            // ─── Fragment System: Update Break Apart Fragments ───
            // Skip on weak devices to save CPU
            if (!isLowEndDevice) {
                updateFragments(fragmentPoolRef.current, currentTime);
            }

            // ─── Tier Transition Flash ───
            // Skip on weak devices to save CPU
            if (!isLowEndDevice && currentTier > prevTierRef.current && currentTier > 0) {
                // Tier increased - trigger flash
                const tierColor = currentTier >= 9 ? new BABYLON.Color3(0.937, 0.267, 0.267) // red (tier 9-10)
                    : currentTier >= 7 ? new BABYLON.Color3(0.976, 0.451, 0.086) // orange (tier 7-8)
                    : currentTier >= 4 ? new BABYLON.Color3(0.659, 0.333, 0.969) // purple (tier 4-6)
                    : new BABYLON.Color3(0.231, 0.510, 0.965); // blue (tier 1-3)
                
                tierFlashRef.current = {
                    active: true,
                    progress: 0,
                    startTime: Date.now(),
                    tier: currentTier,
                    color: tierColor
                };
            }
            prevTierRef.current = currentTier;
            
            // Animate tier flash (skip on weak devices)
            if (!isLowEndDevice) {
                updateTierFlash(tierFlashRef, meshMapRef.current);
            }

            // ─── Last 10 Seconds Atmosphere (Timed Mode) ───
            // Skip on weak devices to save CPU
            if (currentGameMode === GameMode.TIMED && !isLowEndDevice) {
                updateTimedModeAtmosphere(currentTimeLeft, meshMapRef.current, gridBaseRef, light, isMobile);
            }

            // ─── Game Over Animation ───
            updateGameOverAnimation(gameOverAnimationRef, meshMapRef.current, gridBaseRef, gridSlotsRef, shakeIntensityRef);
            
            // Trigger game over animation when game ends
            if (isGameOver && !gameOverAnimationRef.current?.active) {
                startGameOverAnimation(meshMapRef.current, gameOverAnimationRef);
            }

            // ─── Line Clear Animation (Three-Stage System) ───
            updateLineClearAnimation(
                lineClearAnimationRef,
                grid,
                meshMapRef.current,
                isLowEndDevice,
                useVisualEffectStore
            );
            
            // Create break apart fragments and emit particles during particle phase
            // Task 20: Enhanced line clear particle system
            if (lineClearAnimationRef.current?.active && lineClearAnimationRef.current.phase === 'particles') {
                const anim = lineClearAnimationRef.current;
                const elapsed = Date.now() - anim.startTime;
                
                if (elapsed < 150 && anim.progress < 0.1 && !isLowEndDevice) {
                    // Track if this is a 4-line clear (Tetris) for trail effects
                    const clearedLines = lastAction?.lines || 0;
                    const is4LineClear = clearedLines === 4;
                    
                    anim.clearedCells.forEach((key: string) => {
                        const [x, y] = key.split(',').map(Number);
                        const cell = grid[y]?.[x];
                        if (cell?.type) {
                            // Create break apart fragments (existing system)
                            createBreakApartFragments(
                                x, 
                                y, 
                                cell.color, 
                                cell.type,
                                fragmentPoolRef.current,
                                isMobile,
                                isNativeApp,
                                isLowEndDevice,
                                prefersReducedMotion
                            );
                            
                            // Task 20.3: Emit enhanced line clear particles
                            if (animationCoordinatorRef.current) {
                                animationCoordinatorRef.current.emitLineClearParticles({
                                    position: getVectorPos(x, y),
                                    color: cell.color,
                                    clearedLines,
                                    is4LineClear
                                });
                            }
                        }
                    });
                }
            }

            // Check for new shake events and trigger animations
            if (lastAction && lastAction !== lastHandledActionRef.current) {
                if (lastAction.type === 'CLEAR') {
                    // Shake intensity based on lines cleared and combo
                    // Reduced on weak devices to save CPU
                    const lines = lastAction.lines || 1;
                    const cmb = lastAction.combo || 1;
                    const baseIntensity = isLowEndDevice ? 0.1 : 0.35;
                    const lineBonus = isLowEndDevice ? 0 : (lines * 0.18);
                    const comboBonus = isLowEndDevice ? 0 : (cmb * 0.08);
                    const calculatedIntensity = Math.min(baseIntensity + lineBonus + comboBonus, isLowEndDevice ? 0.2 : 1.2);
                    shakeIntensityRef.current = prefersReducedMotion ? 0 : calculatedIntensity;
                    
                    // ─── UI3D: Show floating score and update combo ───
                    if (ui3dManagerRef.current) {
                        const scoreValue = lines * 100;
                        const centerPos = new BABYLON.Vector3(5, 10, 0);
                        
                        // Show floating score with combo-based color
                        let scoreColor: BABYLON.Color3;
                        if (cmb < 3) {
                            scoreColor = new BABYLON.Color3(1, 1, 0); // Yellow
                        } else if (cmb < 7) {
                            scoreColor = new BABYLON.Color3(1, 0.5, 0); // Orange
                        } else {
                            scoreColor = new BABYLON.Color3(1, 0, 0); // Red
                        }
                        
                        ui3dManagerRef.current.showFloatingScore(scoreValue, centerPos, scoreColor);
                        ui3dManagerRef.current.updateCombo(cmb, 10);
                    }
                    
                    // Trigger line clear animation
                    const { rows, cols } = detectLineClear(grid);
                    if (rows.length > 0 || cols.length > 0) {
                        startLineClearAnimation(
                            rows, 
                            cols, 
                            grid, 
                            meshMapRef.current, 
                            lineClearAnimationRef,
                            (lineCount: number) => triggerCameraShake(lineCount, shakeIntensityRef, prefersReducedMotion)
                        );
                        
                        // Trigger enhanced line clear animation system
                        // Skip on weak devices to prevent stuttering
                        if (lineClearSystemRef.current && !isLowEndDevice) {
                            // Collect cell positions for cleared lines
                            const cellPositions: BABYLON.Vector3[] = [];
                            const clearedLineIndices = [...rows, ...cols];
                            
                            // Get positions from cleared cells
                            rows.forEach(y => {
                                for (let x = 0; x < GRID_SIZE; x++) {
                                    const cell = grid[y]?.[x];
                                    if (cell?.id) {
                                        const mesh = meshMapRef.current.get(cell.id);
                                        if (mesh) {
                                            cellPositions.push(mesh.position.clone());
                                        }
                                    }
                                }
                            });
                            
                            cols.forEach(x => {
                                for (let y = 0; y < GRID_SIZE; y++) {
                                    const cell = grid[y]?.[x];
                                    if (cell?.id) {
                                        const mesh = meshMapRef.current.get(cell.id);
                                        if (mesh) {
                                            cellPositions.push(mesh.position.clone());
                                        }
                                    }
                                }
                            });
                            
                            // Collect ice block positions
                            const iceBlockPositions: BABYLON.Vector3[] = [];
                            rows.forEach(y => {
                                for (let x = 0; x < GRID_SIZE; x++) {
                                    const cell = grid[y]?.[x];
                                    if (cell?.id && cell.type === CellType.ICE) {
                                        const mesh = meshMapRef.current.get(cell.id);
                                        if (mesh) {
                                            iceBlockPositions.push(mesh.position.clone());
                                        }
                                    }
                                }
                            });
                            
                            cols.forEach(x => {
                                for (let y = 0; y < GRID_SIZE; y++) {
                                    const cell = grid[y]?.[x];
                                    if (cell?.id && cell.type === CellType.ICE) {
                                        const mesh = meshMapRef.current.get(cell.id);
                                        if (mesh) {
                                            iceBlockPositions.push(mesh.position.clone());
                                        }
                                    }
                                }
                            });
                            
                            // Trigger enhanced line clear animation
                            lineClearSystemRef.current.triggerLineClear({
                                clearedLines: clearedLineIndices,
                                cellPositions,
                                hasColorBonus: lastAction.colorBonus || false,
                                isPerfectClear: perfectClearDetected || false,
                                iceBlockPositions: iceBlockPositions.length > 0 ? iceBlockPositions : undefined
                            });
                        }
                    }
                    
                    // Trigger combo milestone if applicable
                    // Skip on weak devices to save CPU
                    if (animationCoordinatorRef.current && cmb >= 5 && !isLowEndDevice) {
                        animationCoordinatorRef.current.triggerComboMilestone({ level: cmb });
                        
                        // ─── UI3D: Show achievement for combo milestones ───
                        if (ui3dManagerRef.current) {
                            const achievementPos = new BABYLON.Vector3(8, 12, 0);
                            if (cmb === 5) {
                                ui3dManagerRef.current.showAchievement('Combo Master', '🔥', achievementPos);
                            } else if (cmb === 10) {
                                ui3dManagerRef.current.showAchievement('Unstoppable!', '⚡', achievementPos);
                            }
                        }
                    }
                } else if (lastAction.type === 'PLACE') {
                    shakeIntensityRef.current = prefersReducedMotion ? 0 : 0.05; // Tiny thud on placement
                    
                    // Trigger placement impact animation using data from gameStore
                    if (animationCoordinatorRef.current && lastAction.cellIds && lastAction.cellIds.length > 0) {
                        animationCoordinatorRef.current.triggerPlacementImpact({
                            cellIds: lastAction.cellIds,
                            meshMap: meshMapRef.current,
                            dropHeight: lastAction.dropHeight || 0
                        });
                    }
                }
                lastHandledActionRef.current = lastAction;
            }

            const meshMap = meshMapRef.current;

            // Dynamic Bloom Effect based on Combo
            // Intensity increases with combo level for visual feedback
            // Skip on weak devices to save GPU
            if (glowLayerRef.current && !isLowEndDevice) {
                const baseIntensity = 0.3;
                const comboBonus = Math.min(combo * 0.05, 0.4); // Max +0.4 at combo 8+
                glowLayerRef.current.intensity = baseIntensity + comboBonus;
            }

            // Camera Shake System
            updateCameraShake(camera, shakeIntensityRef, deltaTime, prefersReducedMotion);

            // Detect Score Change for Impact
            // (This is a simplified way; ideally we'd have an event, but polling works for visual fx)
            // We can check if lines were cleared by observing grid changes or store changes
            // For now, let's just use a ref to track score
            if (stateRef.current.score > lastScoreRef.current) {
                const diff = stateRef.current.score - lastScoreRef.current;
                if (diff >= 100) { // Line clear or big combo
                    shakeIntensityRef.current = 0.5; // Trigger shake
                }
                lastScoreRef.current = stateRef.current.score;
            }

            // Update hover - throttled on weak devices (every 3 frames = ~20fps)
            hoverUpdateCounter++;
            const shouldUpdateHover = hoverUpdateCounter % hoverThrottle === 0;
            if (shouldUpdateHover) {
                updateHover();
            }

            // 0. Animate Particles — skip (particles removed)

            // 1. Sync Active Grid
            // Throttle grid sync on weak/mid devices - VERY AGGRESSIVE for LOW
            const shouldSyncGrid = frameCount % gridSyncThrottle === 0;
            
            if (shouldSyncGrid) {
                const activeIds = new Set<string>();
                const newlyCreatedIds: string[] = []; // Track newly created blocks for placement animation
                
                // Throttle animations: only update emissive colors based on device tier
                // LOW: every 10 frames (6fps), MID: every 4 frames (15fps), HIGH: every 2 frames (30fps)
                const shouldUpdateAnimations = !disableAnimations && (frameCount % animationThrottle === 0);
                
                // Skip grid sync during line clear animation to prevent conflicts
                const isAnimating = lineClearAnimationRef.current?.active || false;
                
                // LOW DEVICE OPTIMIZATION: Skip lerp and emissive updates completely
                const skipLerp = isLowEndDevice;
                const skipEmissive = isLowEndDevice;
                
                grid.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell.filled && cell.id) {
                        activeIds.add(cell.id);
                        const targetPos = getVectorPos(x, y);
                        let mesh = meshMap.get(cell.id);
                        if (!mesh) {
                            mesh = createBlockMeshLocal(cell.color, cell.id, cell.type, cell.health);
                            mesh.position = targetPos.clone();
                            mesh.position.y = skipLerp ? 0 : 2; // Instant placement on LOW devices
                            meshMap.set(cell.id, mesh);
                            
                            // Track newly created block for placement animation
                            if (!isLowEndDevice) {
                                newlyCreatedIds.push(cell.id);
                            }
                        }

                        // Only update visibility if it changed (avoid redundant updates)
                        if (!mesh.isVisible) {
                            mesh.isVisible = true;
                        }

                        // Update material if health changed (for ICE) - Skip on LOW devices
                        if (!isLowEndDevice && cell.type === CellType.ICE && cell.health === 1 && mesh.material) {
                            const mat = mesh.material as BABYLON.StandardMaterial;
                            if (!mat.wireframe) { // Only update if not already cracked
                                mat.alpha = 0.6;
                                mat.wireframe = true;
                            }
                        }

                        // Smooth landing (skip completely on LOW devices)
                        if (!skipLerp) {
                            const cellKey = `${x},${y}`;
                            const isBeingAnimated = lineClearAnimationRef.current?.clearedCells.has(cellKey) || 
                                                   lineClearAnimationRef.current?.affectedBlocks.has(cellKey);
                            
                            if (!isBeingAnimated) {
                                mesh.position = BABYLON.Vector3.Lerp(mesh.position, targetPos, 0.8);
                            }
                        } else {
                            // LOW device: Instant snap to position
                            mesh.position = targetPos;
                        }

                        // Skip ALL emissive animations on LOW devices
                        if (!skipEmissive && shouldUpdateAnimations && !isLowEndDevice) {
                            const cellKey = `${x},${y}`;
                            const isBeingCleared = lineClearAnimationRef.current?.clearedCells.has(cellKey);
                            
                            if (!isBeingCleared) {
                                // Bomba bloğu animate - tehlike nabzı (daha yavaş, mobil için optimize)
                                if (cell.type === CellType.BOMB && mesh.material) {
                                    const bombPulse = 0.4 + Math.abs(Math.sin(time * 2)) * 0.3;
                                    (mesh.material as BABYLON.StandardMaterial).emissiveColor =
                                        BABYLON.Color3.FromHexString("#f59e0b").scale(bombPulse);
                                }
                                // Buz bloğu animate - soğuk parıltı (daha yavaş)
                                else if (cell.type === CellType.ICE && mesh.material) {
                                    const icePulse = 0.2 + Math.abs(Math.sin(time * 1)) * 0.2;
                                    const iceColor = cell.health === 1
                                        ? BABYLON.Color3.FromHexString("#60a5fa")
                                        : BABYLON.Color3.FromHexString("#38bdf8");
                                    (mesh.material as BABYLON.StandardMaterial).emissiveColor = iceColor.scale(icePulse + 0.15);
                                }
                                // CHRONO bloğu animate - altın nabız
                                else if (cell.type === CellType.CHRONO && mesh.material) {
                                    const chronoPulse = 0.2 + Math.abs(Math.sin(time * 2.5)) * 0.3;
                                    (mesh.material as BABYLON.StandardMaterial).emissiveColor =
                                        BABYLON.Color3.FromHexString("#f59e0b").scale(chronoPulse);
                                }
                                // Normal blocks get subtle glow during high combos
                                else if (combo >= 5 && mesh.material) {
                                    const comboGlow = Math.min(combo * 0.02, 0.15);
                                    const mat = mesh.material as BABYLON.StandardMaterial;
                                    const baseEmissive = mat.diffuseColor.scale(0.05);
                                    mat.emissiveColor = baseEmissive.add(mat.diffuseColor.scale(comboGlow));
                                }
                            }
                        }
                    }
                });
            });

            // Cleanup - Simplified for LOW devices
            if (isLowEndDevice) {
                // LOW: Instant disposal without animation
                for (const [id, mesh] of meshMap.entries()) {
                    if (!activeIds.has(id)) {
                        mesh.dispose();
                        meshMap.delete(id);
                    }
                }
            } else {
                // MID/HIGH: Animated disposal
                for (const [id, mesh] of meshMap.entries()) {
                    if (!activeIds.has(id)) {
                        mesh.scaling.scaleInPlace(0.7);
                        mesh.rotation.y += 0.3;
                        if (mesh.scaling.x < 0.05) {
                            mesh.dispose();
                            meshMap.delete(id);
                        }
                    }
                }
            }
            
            // Trigger placement animation for newly created blocks
            // Skip on weak devices to save CPU
            if (newlyCreatedIds.length > 0 && !isLowEndDevice) {
                animatePlacement(newlyCreatedIds, meshMapRef.current, placementAnimationRef, disableAnimations, prefersReducedMotion);
                
                // Trigger squash animation for newly placed blocks
                if (kineticAnimationRef.current && !prefersReducedMotion) {
                    newlyCreatedIds.forEach(id => {
                        kineticAnimationRef.current?.applySquash(id);
                    });
                }
            }
            } // End of shouldSyncGrid
            
            // 2. Holographic Ghost (The Wireframe Preview) - Pool-based
            // Hide all ghosts first
            ghostMeshesRef.current.forEach(m => { m.isVisible = false; });

            const currentHover = hoverCoordRef.current;
            if (draggedPiece && currentHover) {
                const isValid = canPlacePiece(grid, draggedPiece, currentHover.x, currentHover.y);
                const baseColor = isValid
                    ? BABYLON.Color3.FromHexString(draggedPiece.color)
                    : BABYLON.Color3.FromHexString("#ef4444");

                // Pulse factor for ghost breathing effect - DISABLED on LOW devices
                const ghostY = isLowEndDevice ? 0.35 : (0.35 + Math.sin(time * 3) * 0.04);

                let ghostIndex = 0;
                draggedPiece.shape.forEach((row, dy) => {
                    row.forEach((val, dx) => {
                        if (val === 1 && ghostIndex < GHOST_POOL_SIZE) {
                            const gx = currentHover.x + dx;
                            const gy = currentHover.y + dy;

                            if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                                const ghostBox = ghostMeshesRef.current[ghostIndex++];
                                ghostBox.position = getVectorPos(gx, gy);
                                ghostBox.position.y = ghostY;

                                const mat = ghostBox.material as BABYLON.StandardMaterial;
                                mat.diffuseColor = baseColor;
                                mat.emissiveColor = isLowEndDevice ? BABYLON.Color3.Black() : baseColor.scale(0.2);
                                mat.alpha = isValid ? 0.6 : 0.3;

                                // CRITICAL: Skip edges rendering on LOW devices - VERY expensive
                                if (!isLowEndDevice) {
                                    ghostBox.enableEdgesRendering();
                                    ghostBox.edgesWidth = isValid ? 4.0 : 2.5;
                                    ghostBox.edgesColor = isValid
                                        ? new BABYLON.Color4(baseColor.r, baseColor.g, baseColor.b, 0.9)
                                        : new BABYLON.Color4(1, 0.3, 0.3, 0.7);
                                }

                                ghostBox.isVisible = true;
                            }
                        }
                    });
                });
            }
            
            // Render loop continues...
            // Task 3.1: FPS limiter frame time update moved to render loop
            // This ensures updateFrameTime() is only called when frame is actually rendered
        });

        const handleGlobalPointerMove = (e: PointerEvent) => {
            globalMouseRef.current = { x: e.clientX, y: e.clientY };
            // Task 3.2: Update last touch time for idle detection
            if (e.pointerType === 'touch') {
                lastTouchTimeRef.current = Date.now();
            }
        };

        const handleWindowPointerUp = () => {
            const { draggedPiece } = stateRef.current;
            
            // Handle piece placement
            if (draggedPiece) {
                if (hoverCoordRef.current) {
                    // If we have a valid hover coordinate, place the piece
                    placePiece(draggedPiece, hoverCoordRef.current.x, hoverCoordRef.current.y);
                } else if (globalMouseRef.current && canvasRef.current) {
                    // Fallback: Try to calculate position from mouse coordinates
                    const rect = canvasRef.current.getBoundingClientRect();
                    const x = globalMouseRef.current.x - rect.left;
                    const y = globalMouseRef.current.y - rect.top;
                    const DRAG_Y_OFFSET = getDragYOffset();
                    
                    const pickInfo = sceneRef.current?.pick(x, y + DRAG_Y_OFFSET, (mesh) => mesh.name === 'ground');
                    
                    if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
                        const p = pickInfo.pickedPoint;
                        const GRID_OFFSET = (GRID_SIZE * TOTAL_CELL_SIZE) / 2;
                        const rawX = (p.x + GRID_OFFSET) / TOTAL_CELL_SIZE;
                        const rawY = (-p.z + GRID_OFFSET) / TOTAL_CELL_SIZE;
                        const rx = Math.round(rawX);
                        const ry = Math.round(rawY);
                        
                        const shapeW = draggedPiece.shape[0].length;
                        const shapeH = draggedPiece.shape.length;
                        const fx = rx - Math.floor((shapeW - 1) / 2);
                        const fy = ry - Math.floor((shapeH - 1) / 2);
                        
                        placePiece(draggedPiece, fx, fy);
                    }
                }
            }
            
            // Reset state
            setDraggedPiece(null);
            hoverCoordRef.current = null;
            // REMOVED: setHoverCoord(null); - Avoid React re-render
            globalMouseRef.current = null;
        };

        const handleCanvasPointerUp = (e: PointerEvent) => {
            // Note: Piece placement is handled by window handler
            // Task 3.2: Update last touch time for idle detection
            if (e.pointerType === 'touch') {
                lastTouchTimeRef.current = Date.now();
            }
        };

        window.addEventListener('pointerup', handleWindowPointerUp);
        window.addEventListener('pointermove', handleGlobalPointerMove);
        canvasRef.current.addEventListener('pointerup', handleCanvasPointerUp);

        // Task 9.4: Add touch event optimization to canvas
        // Task 9.5: Measure and record touch response times
        let touchOptimizationCleanup: (() => void) | null = null;
        
        if (androidPlatform && canvasRef.current) {
            const canvas = canvasRef.current;
            let touchStartTime = 0;
            
            touchOptimizationCleanup = addOptimizedTouchListener(
                canvas as unknown as HTMLElement,
                'touchstart',
                {
                    handler: (event) => {
                        touchStartTime = performance.now();
                        // Task 3.2: Update last touch time for idle detection
                        lastTouchTimeRef.current = Date.now();
                    },
                    preventDefault: true,
                    measureResponseTime: true,
                    onResponseTime: (responseTime) => {
                        // Record touch response time to performance store
                        usePerformanceStore.getState().recordTouchResponse(responseTime);
                    }
                }
            );
            
            console.log('[Grid] Touch event optimization enabled');
        }
        
        // Task 3.2: Idle detection helper functions
        const hasActiveAnimations = (): boolean => {
            // Check animation refs
            const hasLineClear = lineClearAnimationRef.current?.active ?? false;
            const hasPlacement = placementAnimationRef.current?.active ?? false;
            const hasGameOver = gameOverAnimationRef.current?.active ?? false;
            const hasTierFlash = tierFlashRef.current?.active ?? false;
            
            // Check animation coordinator
            const hasCoordinatorAnimations = (animationCoordinatorRef.current?.getActiveAnimationCount() ?? 0) > 0;
            
            return hasLineClear || hasPlacement || hasGameOver || hasTierFlash || hasCoordinatorAnimations;
        };
        
        const isIdle = (): boolean => {
            // Check if user is dragging a piece
            if (stateRef.current.draggedPiece !== null) {
                return false;
            }
            
            // Check if any animations are active
            if (hasActiveAnimations()) {
                return false;
            }
            
            // Check if touch occurred within last 2 seconds
            const timeSinceLastTouch = Date.now() - lastTouchTimeRef.current;
            if (timeSinceLastTouch < 2000) {
                return false;
            }
            
            return true;
        };
        
        const pauseRenderLoop = () => {
            if (!renderLoopActiveRef.current) {
                return; // Already paused
            }
            
            console.log('[Grid] Pausing render loop (idle detected)');
            renderLoopActiveRef.current = false;
            
            if (isNativeApp) {
                // Cancel animation frame for native apps
                const animationFrameId = (engine as any)._nativeAnimationFrameId;
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    (engine as any)._nativeAnimationFrameId = null;
                }
            } else {
                // Stop render loop for web
                engine.stopRenderLoop();
            }
        };
        
        const resumeRenderLoop = () => {
            if (renderLoopActiveRef.current) {
                return; // Already running
            }
            
            console.log('[Grid] Resuming render loop (activity detected)');
            renderLoopActiveRef.current = true;
            
            if (isNativeApp) {
                // Restart animation frame for native apps
                const renderFrame = () => {
                    if (fpsLimiterRef.current.shouldRenderFrame()) {
                        scene.render();
                        fpsLimiterRef.current.updateFrameTime();
                    }
                    (engine as any)._nativeAnimationFrameId = requestAnimationFrame(renderFrame);
                };
                
                (engine as any)._nativeAnimationFrameId = requestAnimationFrame(renderFrame);
            } else {
                // Restart render loop for web
                engine.runRenderLoop(() => {
                    if (fpsLimiterRef.current.shouldRenderFrame()) {
                        scene.render();
                        fpsLimiterRef.current.updateFrameTime();
                    }
                });
            }
        };

        // Start render loop with proper frame rate control
        if (isNativeApp) {
            // Native apps: Use requestAnimationFrame for proper vsync
            // This prevents Android's setRequestedFrameRate warnings
            let animationFrameId: number;
            
            const renderFrame = () => {
                // Task 3.1: Check FPS limiter before rendering
                if (fpsLimiterRef.current.shouldRenderFrame()) {
                    scene.render();
                    fpsLimiterRef.current.updateFrameTime();
                }
                animationFrameId = requestAnimationFrame(renderFrame);
            };
            
            animationFrameId = requestAnimationFrame(renderFrame);
            
            // Store the animation frame ID for cleanup
            (engine as any)._nativeAnimationFrameId = animationFrameId;
            
            // Listen for pause/resume events from useBackgroundPause hook
            const handlePause = () => {
                console.log('[Grid] Pause event received, canceling animation frame');
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    (engine as any)._nativeAnimationFrameId = null;
                }
            };
            
            const handleResume = () => {
                console.log('[Grid] Resume event received, restarting animation frame');
                // Only restart if not already running
                if (!(engine as any)._nativeAnimationFrameId) {
                    const renderFrame = () => {
                        // Task 3.1: Check FPS limiter before rendering
                        if (fpsLimiterRef.current.shouldRenderFrame()) {
                            scene.render();
                            fpsLimiterRef.current.updateFrameTime();
                        }
                        animationFrameId = requestAnimationFrame(renderFrame);
                    };
                    
                    animationFrameId = requestAnimationFrame(renderFrame);
                    (engine as any)._nativeAnimationFrameId = animationFrameId;
                }
            };
            
            window.addEventListener('fluxgrid-pause', handlePause);
            window.addEventListener('fluxgrid-resume', handleResume);
            
            // Store cleanup functions
            (engine as any)._pauseListener = handlePause;
            (engine as any)._resumeListener = handleResume;
        } else {
            // Web: Use default render loop
            // Task 3.1: Wrap scene.render() with FPS limiter check
            engine.runRenderLoop(() => {
                if (fpsLimiterRef.current.shouldRenderFrame()) {
                    scene.render();
                    fpsLimiterRef.current.updateFrameTime();
                }
            });
        }
        
        // Task 3.2: Start idle detection interval
        idleCheckIntervalRef.current = window.setInterval(() => {
            if (isIdle()) {
                pauseRenderLoop();
            } else if (!renderLoopActiveRef.current) {
                // Resume if not idle and render loop is paused
                resumeRenderLoop();
            }
        }, 1000); // Check every second

        // Background pause is now handled by useBackgroundPause hook
        // No need for manual initialization

        // Pause rendering when page is hidden to save resources (DEPRECATED - now handled by BackgroundPauseManager)
        // Keeping old code commented for reference
        /*
        let nativeAnimationFrameId: number | null = null;
        
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (isNativeApp) {
                    // Cancel animation frame for native apps
                    if (nativeAnimationFrameId !== null) {
                        cancelAnimationFrame(nativeAnimationFrameId);
                        nativeAnimationFrameId = null;
                    }
                } else {
                    engine.stopRenderLoop();
                }
            } else {
                if (isNativeApp) {
                    // Restart animation frame for native apps (only if not already running)
                    if (nativeAnimationFrameId === null) {
                        const renderFrame = () => {
                            scene.render();
                            nativeAnimationFrameId = requestAnimationFrame(renderFrame);
                        };
                        
                        nativeAnimationFrameId = requestAnimationFrame(renderFrame);
                    }
                } else {
                    // Web: Use default render loop
                    engine.runRenderLoop(() => {
                        scene.render();
                    });
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        */

        // WebGL context lost/restored handlers
        engine.onContextLostObservable.add(() => {
            console.warn('WebGL context lost — attempting recovery');
        });

        engine.onContextRestoredObservable.add(() => {
            console.log('WebGL context restored');
            // Clear mesh map to force recreation
            meshMapRef.current.clear();
            // Reinitialize fragment pool
            fragmentPoolRef.current.pool = [];
            fragmentPoolRef.current.activeFragments.clear();
            fragmentPoolRef.current.pool = initFragmentPool(scene);
        });

        const resize = () => engine.resize();
        // window.addEventListener('resize', resize); // Handled by custom handler above

        return () => {
            unsubscribeTheme();
            
            // Task 3.2: Clear idle detection interval
            if (idleCheckIntervalRef.current !== null) {
                clearInterval(idleCheckIntervalRef.current);
                idleCheckIntervalRef.current = null;
            }
            
            // Background pause cleanup is now handled by useBackgroundPause hook
            
            // Cancel native animation frame if active
            const nativeAnimationFrameId = (engine as any)._nativeAnimationFrameId;
            if (nativeAnimationFrameId) {
                cancelAnimationFrame(nativeAnimationFrameId);
            }
            
            // Remove pause/resume event listeners
            const pauseListener = (engine as any)._pauseListener;
            const resumeListener = (engine as any)._resumeListener;
            if (pauseListener) {
                window.removeEventListener('fluxgrid-pause', pauseListener);
            }
            if (resumeListener) {
                window.removeEventListener('fluxgrid-resume', resumeListener);
            }
            
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('pointerup', handleWindowPointerUp);
            window.removeEventListener('pointermove', handleGlobalPointerMove);
            if (canvasRef.current) canvasRef.current.removeEventListener('pointerup', handleCanvasPointerUp);
            
            // Cleanup touch optimization
            if (touchOptimizationCleanup) {
                touchOptimizationCleanup();
            }
            
            // Dispose skill overlays
            skillOverlayMeshesRef.current.forEach(m => m?.dispose());
            skillOverlayMeshesRef.current = [];
            
            // Dispose ghost meshes
            ghostMeshesRef.current.forEach(m => m?.dispose());
            ghostMeshesRef.current = [];
            
            // Dispose guided highlight meshes
            guidedHighlightMeshesRef.current.forEach(m => m?.dispose());
            guidedHighlightMeshesRef.current = [];
            
            // Dispose fragment pool
            fragmentPoolRef.current.pool.forEach(m => m?.dispose());
            fragmentPoolRef.current.pool = [];
            fragmentPoolRef.current.activeFragments.clear();
            
            // Dispose animation coordinator
            if (animationCoordinatorRef.current) {
                animationCoordinatorRef.current.dispose();
                animationCoordinatorRef.current = null;
            }
            
            // Dispose juice effects manager
            if (juiceEffectsManagerRef.current) {
                juiceEffectsManagerRef.current.dispose();
                juiceEffectsManagerRef.current = null;
            }
            
            // Dispose line clear animation system
            if (lineClearSystemRef.current) {
                lineClearSystemRef.current.dispose();
                lineClearSystemRef.current = null;
            }
            
            // Dispose UI3D manager
            if (ui3dManagerRef.current) {
                ui3dManagerRef.current.dispose();
                ui3dManagerRef.current = null;
            }
            
            // Dispose special block manager
            if (specialBlockManagerRef.current) {
                specialBlockManagerRef.current.dispose();
                specialBlockManagerRef.current = null;
            }
            
            // Dispose SPS particle manager
            if (spsParticleManagerRef.current) {
                spsParticleManagerRef.current.dispose();
                spsParticleManagerRef.current = null;
            }
            
            // Task 24.7: Dispose battery saver manager
            batterySaverManager.dispose();
            
            // Dispose all grid meshes BEFORE scene disposal
            meshMapRef.current.forEach(mesh => {
                if (mesh) {
                    mesh.dispose();
                }
            });
            meshMapRef.current.clear();
            
            // Dispose ambient particles
            ambientParticlesRef.current.forEach(m => m?.dispose());
            ambientParticlesRef.current = [];
            
            // Finally dispose scene and engine
            scene.dispose();
            engine.dispose();
        };
    }, []);

    // Cache canvas rect for responsive calculations
    useEffect(() => {
        if (!canvasRef.current) return;
        
        const updateCanvasRect = () => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setCanvasRect(rect);
            }
        };
        
        // Initial cache
        updateCanvasRect();
        
        // Update on resize
        window.addEventListener('resize', updateCanvasRect);
        
        return () => {
            window.removeEventListener('resize', updateCanvasRect);
        };
    }, []);

    // ESC key listener for skill cancellation
    return (
        <div className="relative w-full h-full overflow-hidden">
            <canvas
                ref={canvasRef}
                data-grid-container
                className={clsx(
                    "w-full h-full touch-none outline-none block",
                    "grid-container interactive-element" // Task 9.5: Android touch CSS classes
                )}
            />
        </div>
    );
};

// Task 1.1: Wrap Grid component with React.memo and custom comparison
// Requirements: 1.1, 1.2, 5.1, 5.2, 5.3
// Custom comparison function for grid prop (reference equality)
export const Grid = React.memo(GridComponent, (prevProps, nextProps) => {
    // Return true if props are equal (should NOT re-render)
    // Return false if props are different (should re-render)
    return prevProps.grid === nextProps.grid;
});