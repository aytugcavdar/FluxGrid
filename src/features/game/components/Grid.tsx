import React, { useRef, useEffect, useState } from 'react';
import * as BABYLON from 'babylonjs';
import { useGameStore } from '../store/gameStore';
import { useThemeStore } from '../../../shared/store/themeStore';
import { useVisualEffectStore } from '../../visual-effects/store/visualEffectStore';
import { GRID_SIZE, SkillType, CellType, GridState } from '../types';
import { GameMode } from '@shared/types';
import { getDragYOffset, setCanvasRect } from '../../../utils/responsive';
import { playHaptic } from '../../../utils/audio';
import { detectDeviceCapabilities, getPerformanceConfig } from '../../../utils/deviceCapability';
import { isAndroid as isAndroidPlatform } from '../../../utils/platform';
import { useFPSLimiter } from '../hooks/useFPSLimiter';
import { useBackgroundPause } from '../hooks/useBackgroundPause';
import { usePerformanceStore } from '../store/performanceStore';
import { injectAndroidTouchCSS, addOptimizedTouchListener } from '../../../utils/touchOptimizer';
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

export const Grid: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { grid, draggedPiece, placePiece, canPlacePiece, activeSkill, setDraggedPiece, score, combo, isSurgeActive, lastAction, pieces, activeEvent, gameMode, timeLeft, isGameOver, difficultyTier, totalMovesPlayed } = useGameStore();
    const { getThemeColors } = useThemeStore();

    // Platform detection - calculate once at initialization
    const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.();
    const isAndroid = isNativeApp && /Android/i.test(navigator.userAgent);

    // Refs for Babylon.js engine and scene (needed for hooks)
    const engineRef = useRef<BABYLON.Engine | null>(null);
    const sceneRef = useRef<BABYLON.Scene | null>(null);

    // Task 9.1: Integrate useFPSLimiter hook
    const { state: fpsState } = useFPSLimiter(engineRef.current, true);

    // Task 9.2: Integrate useBackgroundPause hook
    const { state: bgPauseState } = useBackgroundPause(
        engineRef.current,
        sceneRef.current,
        true
    );

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

    const stateRef = useRef({ grid, draggedPiece, activeSkill, score, combo, isSurgeActive, lastAction, pieces, activeEvent, gameMode, timeLeft, isGameOver, difficultyTier });
    useEffect(() => { stateRef.current = { grid, draggedPiece, activeSkill, score, combo, isSurgeActive, lastAction, pieces, activeEvent, gameMode, timeLeft, isGameOver, difficultyTier }; }, [grid, draggedPiece, activeSkill, score, combo, isSurgeActive, lastAction, pieces, activeEvent, gameMode, timeLeft, isGameOver, difficultyTier]);

    const [hoverCoord, setHoverCoord] = useState<{ x: number, y: number } | null>(null);
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
    const prevSurgeActiveRef = useRef(false);
    
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
          engine = new BABYLON.Engine(canvasRef.current, true, {
              preserveDrawingBuffer: true,
              stencil: true,
              antialias: perfConfig.antialias,
              adaptToDeviceRatio: false, // Keep false for stability
              limitDeviceRatio: deviceCapabilities.isAndroid ? 1.0 : (deviceCapabilities.isNative ? 2.0 : Math.min(window.devicePixelRatio, 2)),
              doNotHandleContextLost: false,
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
        // Android native: fixed at 1.0 for consistent rendering
        if (deviceCapabilities.isAndroid) {
          engine.setHardwareScalingLevel(1.0);
        } else {
          engine.setHardwareScalingLevel(1 / perfConfig.hardwareScaling);
        }

        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

        // Store scene ref for hooks
        sceneRef.current = scene;

        // Low-end device scene optimizations
        if (isLowEndDevice) {
            scene.skipPointerMovePicking = true;
            scene.autoClear = true;
            scene.autoClearDepthAndStencil = true;
            BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.LowDegradationAllowed());
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

        // Lighting — Mobile'de daha düşük parlaklık
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = isMobile ? 0.45 : 0.7; // Mobile'de daha az ambient ışık
        light.groundColor = new BABYLON.Color3(0.05, 0.05, 0.08); // Zemin rengi koyu

        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
        dirLight.position = new BABYLON.Vector3(20, 40, 20);
        dirLight.intensity = isMobile ? 0.35 : 0.6; // Mobile'de daha az directional

        // Disable directional light on low-end devices
        if (isLowEndDevice) {
            dirLight.intensity = 0;
        }

        // Glow layer - completely disabled on low-end devices and native mobile apps
        if (!isLowEndDevice && !isNativeApp) {
            const glowLayer = new BABYLON.GlowLayer("glow", scene, {
                mainTextureSamples: 2,
                blurKernelSize: 16
            });
            glowLayer.intensity = 0; // Disabled parlama
            glowLayerRef.current = glowLayer;
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
                slot.enableEdgesRendering();
                slot.edgesWidth = isMobile ? 2.0 : 2.5;
                const edgeColor = BABYLON.Color3.FromHexString(themeColors.gridEdge);
                slot.edgesColor = new BABYLON.Color4(edgeColor.r, edgeColor.g, edgeColor.b, 0.5);
                
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


        // --- Logic Helpers ---
        const getVectorPos = (gx: number, gy: number) => {
            return new BABYLON.Vector3(
                (gx * TOTAL_CELL_SIZE) - GRID_OFFSET,
                0,
                -((gy * TOTAL_CELL_SIZE) - GRID_OFFSET)
            );
        };

        // Wrapper for createBlockMesh helper
        const createBlockMeshLocal = (colorHex: string, id: string, type: CellType = CellType.NORMAL, health?: number) => {
            return createBlockMesh(colorHex, id, scene, type, health);
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

                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    pickInfo = scene.pick(x, y + DRAG_Y_OFFSET, (mesh) => mesh === ground);
                }
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
                        setHoverCoord(newCoord);

                        // Magnetic Haptic Feedback on mobile
                        playHaptic('hover');
                    }

                    // --- Ghost Piece Logic (Pool-based) ---
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
                                    ghost.position.y = -0.45; // Slightly above grid base

                                    const gMat = ghost.material as BABYLON.StandardMaterial;
                                    gMat.diffuseColor = BABYLON.Color3.FromHexString(draggedPiece.color);
                                    gMat.emissiveColor = BABYLON.Color3.FromHexString(draggedPiece.color).scale(0.5);
                                    gMat.alpha = 0.4; // Semi-transparent
                                    ghost.isVisible = true;
                                }
                            });
                        });
                    }
                } else {
                    const newCoord = { x: rx, y: ry };
                    hoverCoordRef.current = newCoord;
                    setHoverCoord(newCoord);
                }
            } else {
                hoverCoordRef.current = null;
                setHoverCoord(null);

                // Hide all ghosts if mouse leaves grid
                ghostMeshesRef.current.forEach(m => { m.isVisible = false; });
            }
        };

        // --- Render Loop ---
        // IMPORTANT: All logic is in registerBeforeRender, NOT in runRenderLoop
        // This prevents duplicate render calls and improves performance
        let time = 0;
        let frameCount = 0; // Frame counter for throttling animations

        scene.registerBeforeRender(() => {
            // Task 9.3: FPS Limiter check - skip frame if too soon
            if (!fpsLimiterRef.current.shouldRenderFrame()) {
                return; // Skip this frame
            }

            const deltaTime = engine.getDeltaTime() / 1000; // Convert to seconds
            time += deltaTime;
            frameCount++;
            const currentTime = Date.now(); // Current timestamp for animations
            const { grid, draggedPiece, activeSkill, score, combo, lastAction, isGameOver, gameMode: currentGameMode, timeLeft: currentTimeLeft, difficultyTier: currentTier } = stateRef.current;

            // ─── Juice System: Update Placement Animations ───
            updatePlacementAnimations(currentTime, placementAnimationRef, meshMapRef.current, prefersReducedMotion);
            
            // ─── Fragment System: Update Break Apart Fragments ───
            updateFragments(fragmentPoolRef.current, currentTime);

            // ─── Tier Transition Flash ───
            if (currentTier > prevTierRef.current && currentTier > 0) {
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
            
            // ─── Surge Detection ───
            const { isSurgeActive: currentSurgeActive } = stateRef.current;
            if (currentSurgeActive !== prevSurgeActiveRef.current) {
                // Just track state change, no visual changes to grid
                prevSurgeActiveRef.current = currentSurgeActive;
            }
            
            // Animate tier flash
            updateTierFlash(tierFlashRef, meshMapRef.current);

            // ─── Last 10 Seconds Atmosphere (Timed Mode) ───
            if (currentGameMode === GameMode.TIMED) {
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
            
            // Create break apart fragments during particle phase
            if (lineClearAnimationRef.current?.active && lineClearAnimationRef.current.phase === 'particles') {
                const anim = lineClearAnimationRef.current;
                const elapsed = Date.now() - anim.startTime;
                
                if (elapsed < 150 && anim.progress < 0.1 && !isLowEndDevice) {
                    anim.clearedCells.forEach((key: string) => {
                        const [x, y] = key.split(',').map(Number);
                        const cell = grid[y]?.[x];
                        if (cell?.type) {
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
                        }
                    });
                }
            }

            // Check for new shake events
            if (lastAction && lastAction !== lastHandledActionRef.current) {
                if (lastAction.type === 'CLEAR') {
                    // Shake intensity based on lines cleared and combo
                    const lines = lastAction.lines || 1;
                    const cmb = lastAction.combo || 1;
                    const baseIntensity = 0.35;
                    const lineBonus = lines * 0.18;
                    const comboBonus = cmb * 0.08;
                    const calculatedIntensity = Math.min(baseIntensity + lineBonus + comboBonus, 1.2);
                    shakeIntensityRef.current = prefersReducedMotion ? 0 : calculatedIntensity;
                    
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
                    }
                } else if (lastAction.type === 'PLACE') {
                    shakeIntensityRef.current = prefersReducedMotion ? 0 : 0.05; // Tiny thud on placement
                }
                lastHandledActionRef.current = lastAction;
            }

            const meshMap = meshMapRef.current;

            // Dynamic Glow based on Combo — Mobile'de sınırlı
            if (glowLayerRef.current) {
                glowLayerRef.current.intensity = 0; // Keep it zero
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

            updateHover();

            // 0. Animate Particles — skip (particles removed)

            // 1. Sync Active Grid
            const activeIds = new Set<string>();
            const newlyCreatedIds: string[] = []; // Track newly created blocks for placement animation
            
            // Throttle animations: only update emissive colors every 3 frames (20fps instead of 60fps)
            const shouldUpdateAnimations = !disableAnimations && (frameCount % 3 === 0);
            
            // Skip grid sync during line clear animation to prevent conflicts
            const isAnimating = lineClearAnimationRef.current?.active || false;
            
            grid.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell.filled && cell.id) {
                        activeIds.add(cell.id);
                        const targetPos = getVectorPos(x, y);
                        let mesh = meshMap.get(cell.id);
                        if (!mesh) {
                            mesh = createBlockMeshLocal(cell.color, cell.id, cell.type, cell.health);
                            mesh.position = targetPos.clone();
                            mesh.position.y = 4; // Drop from moderate height (reduced from 12 for faster placement)
                            meshMap.set(cell.id, mesh);
                            
                            // Track newly created block for placement animation
                            newlyCreatedIds.push(cell.id);
                        }

                        mesh.isVisible = true;

                        // Update material if health changed (for ICE)
                        if (cell.type === CellType.ICE && cell.health === 1 && mesh.material) {
                            const mat = mesh.material as BABYLON.StandardMaterial;
                            if (!mat.wireframe) { // Only update if not already cracked
                                mat.alpha = 0.6;
                                mat.wireframe = true;
                            }
                        }

                        // Smooth landing (skip if being animated by line clear)
                        const cellKey = `${x},${y}`;
                        const isBeingAnimated = lineClearAnimationRef.current?.clearedCells.has(cellKey) || 
                                               lineClearAnimationRef.current?.affectedBlocks.has(cellKey);
                        
                        if (!isBeingAnimated) {
                            mesh.position = BABYLON.Vector3.Lerp(mesh.position, targetPos, 0.5); // Increased from 0.25 for faster landing
                        }

                        // Animasyonlar sadece yüksek performanslı cihazlarda ve throttled
                        // Skip emissive animations for blocks being cleared
                        const isBeingCleared = lineClearAnimationRef.current?.clearedCells.has(cellKey);
                        
                        if (shouldUpdateAnimations && !isBeingCleared) {
                            // Bomba bloğu animate - tehlike nabzı (daha yavaş, mobil için optimize)
                            if (cell.type === CellType.BOMB && mesh.material) {
                                const bombPulse = 0.3 + Math.abs(Math.sin(time * 2)) * 0.2; // Yavaşlatıldı: 4 -> 2
                                (mesh.material as BABYLON.StandardMaterial).emissiveColor =
                                    BABYLON.Color3.FromHexString("#f59e0b").scale(bombPulse);
                            }
                            // Buz bloğu animate - soğuk parıltı (daha yavaş)
                            else if (cell.type === CellType.ICE && mesh.material) {
                                const icePulse = 0.15 + Math.abs(Math.sin(time * 1)) * 0.15; // Yavaşlatıldı: 2 -> 1
                                const iceColor = cell.health === 1
                                    ? BABYLON.Color3.FromHexString("#60a5fa")
                                    : BABYLON.Color3.FromHexString("#38bdf8");
                                (mesh.material as BABYLON.StandardMaterial).emissiveColor = iceColor.scale(icePulse + 0.1);
                            }
                            // CHRONO bloğu animate - altın nabız
                            else if (cell.type === CellType.CHRONO && mesh.material) {
                                const chronoPulse = 0.15 + Math.abs(Math.sin(time * 2.5)) * 0.25;
                                (mesh.material as BABYLON.StandardMaterial).emissiveColor =
                                    BABYLON.Color3.FromHexString("#f59e0b").scale(chronoPulse);
                            }
                            // SHATTER skill: Show pulse on ALL filled cells (sadece skill aktifken)
                            else if (cell.type === CellType.NORMAL && activeSkill === SkillType.SHATTER && cell.filled) {
                                // Pulse opacity between 0.15 and 0.25 (daha yavaş)
                                const pulseAlpha = 0.15 + Math.abs(Math.sin(time * 3)) * 0.10; // Yavaşlatıldı: 5 -> 3
                                (mesh.material as BABYLON.StandardMaterial).emissiveColor =
                                    BABYLON.Color3.FromHexString("#ef4444").scale(pulseAlpha);
                            }
                        }
                    }
                });
            });

            // Cleanup
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
            
            // Trigger placement animation for newly created blocks
            if (newlyCreatedIds.length > 0) {
                animatePlacement(newlyCreatedIds, meshMapRef.current, placementAnimationRef, disableAnimations, prefersReducedMotion);
            }
            
            // 2. Holographic Ghost (The Wireframe Preview) - Pool-based
            // Hide all ghosts first
            ghostMeshesRef.current.forEach(m => { m.isVisible = false; });

            const currentHover = hoverCoordRef.current;
            if (draggedPiece && currentHover) {
                const isValid = canPlacePiece(grid, draggedPiece, currentHover.x, currentHover.y);
                const baseColor = isValid
                    ? BABYLON.Color3.FromHexString(draggedPiece.color)
                    : BABYLON.Color3.FromHexString("#ef4444");

                // Pulse factor for ghost breathing effect (daha yavaş)
                const ghostY = 0.35 + Math.sin(time * 3) * 0.04; // Yavaşlatıldı: 6 -> 3, azaltıldı: 0.06 -> 0.04

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
                                mat.emissiveColor = baseColor.scale(0.2); // Reduced preview emissive
                                mat.alpha = isValid ? 0.6 : 0.3;

                                // Bright edge outlines for clarity
                                ghostBox.enableEdgesRendering();
                                ghostBox.edgesWidth = isValid ? 4.0 : 2.5;
                                ghostBox.edgesColor = isValid
                                    ? new BABYLON.Color4(baseColor.r, baseColor.g, baseColor.b, 0.9)
                                    : new BABYLON.Color4(1, 0.3, 0.3, 0.7);

                                ghostBox.isVisible = true;
                            }
                        }
                    });
                });
            }
            
            // Skill overlay rendering (moved from separate renderLoop)
            // Hide all skill overlays first
            skillOverlayMeshesRef.current.forEach(m => m.isVisible = false);
            
            if (activeSkill && currentHover) {
                if (activeSkill === SkillType.SHATTER) {
                    // Emphasize the hovered cell with stronger overlay
                    if (currentHover.x >= 0 && currentHover.x < GRID_SIZE && 
                        currentHover.y >= 0 && currentHover.y < GRID_SIZE &&
                        grid[currentHover.y][currentHover.x].filled) {
                        
                        // Reuse or create overlay
                        let overlay = skillOverlayMeshesRef.current[0];
                        if (!overlay) {
                            overlay = BABYLON.MeshBuilder.CreateBox("shatter-overlay", {
                                size: CELL_SIZE * 0.95,
                                height: 0.7
                            }, scene);
                            overlay.position.y = 0.1;
                            
                            const mat = new BABYLON.StandardMaterial("shatterMat", scene);
                            mat.emissiveColor = BABYLON.Color3.FromHexString("#ef4444");
                            overlay.material = mat;
                            overlay.isPickable = false;
                            
                            skillOverlayMeshesRef.current[0] = overlay;
                        }
                        
                        overlay.position = getVectorPos(currentHover.x, currentHover.y);
                        overlay.position.y = 0.1;
                        (overlay.material as BABYLON.StandardMaterial).alpha = 0.6; // Stronger emphasis
                        
                        // Prominent red border
                        overlay.enableEdgesRendering();
                        overlay.edgesWidth = 6;
                        overlay.edgesColor = new BABYLON.Color4(0.93, 0.27, 0.27, 1.0);
                        
                        overlay.isVisible = true;
                    }
                } else if (activeSkill === SkillType.BOMB) {
                    // Highlight 3x3 area with enhanced visibility
                    let overlayIndex = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const x = currentHover.x + dx;
                            const y = currentHover.y + dy;
                            
                            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                                // Reuse or create overlay
                                let overlay = skillOverlayMeshesRef.current[overlayIndex];
                                if (!overlay) {
                                    overlay = BABYLON.MeshBuilder.CreateBox(`bomb-overlay-${overlayIndex}`, {
                                        size: CELL_SIZE * 0.95,
                                        height: 0.7
                                    }, scene);
                                    overlay.position.y = 0.1;
                                    
                                    const mat = new BABYLON.StandardMaterial(`bombMat-${overlayIndex}`, scene);
                                    overlay.material = mat;
                                    overlay.isPickable = false;
                                    
                                    skillOverlayMeshesRef.current[overlayIndex] = overlay;
                                }
                                
                                overlay.position = getVectorPos(x, y);
                                overlay.position.y = 0.1;
                                
                                const mat = overlay.material as BABYLON.StandardMaterial;
                                const isCenter = (dx === 0 && dy === 0);
                                
                                // Center cell: opacity 0.7, surrounding: 0.3
                                mat.alpha = isCenter ? 0.7 : 0.3;
                                mat.emissiveColor = isCenter 
                                    ? BABYLON.Color3.FromHexString("#f97316")  // Center: darker orange
                                    : BABYLON.Color3.FromHexString("#fb923c"); // Surrounding: lighter orange
                                
                                // Mobil için optimize edilmiş animasyon hızı - throttled
                                if (shouldUpdateAnimations) {
                                    const pulse = 0.8 + Math.abs(Math.sin(time * 6)) * 0.15; // Yavaşlatıldı: 12 -> 6, azaltıldı: 0.2 -> 0.15
                                    mat.emissiveColor = mat.emissiveColor.scale(pulse);
                                }
                                
                                overlay.isVisible = true;
                                overlayIndex++;
                            }
                        }
                    }
                }
            }
            
            // Task 9.3: Update FPS limiter frame time after successful render
            fpsLimiterRef.current.updateFrameTime();
        });

        const handleGlobalPointerMove = (e: PointerEvent) => {
            globalMouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleWindowPointerUp = () => {
            const { draggedPiece } = stateRef.current;
            
            // Handle piece placement - check canvas bounds first
            if (draggedPiece && hoverCoordRef.current && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const mousePos = globalMouseRef.current;
                
                // Only place if pointer is within canvas bounds
                if (mousePos && 
                    mousePos.x >= rect.left && 
                    mousePos.x <= rect.right && 
                    mousePos.y >= rect.top && 
                    mousePos.y <= rect.bottom) {
                    placePiece(draggedPiece, hoverCoordRef.current.x, hoverCoordRef.current.y);
                }
            }
            
            // Reset state
            setDraggedPiece(null);
            hoverCoordRef.current = null;
            setHoverCoord(null);
            globalMouseRef.current = null;
        };

        const handleCanvasPointerUp = (e: PointerEvent) => {
            const { activeSkill } = stateRef.current;
            const hover = hoverCoordRef.current;
            
            // Handle skill usage
            if (activeSkill === SkillType.SHATTER && hover) {
                if (hover.x >= 0 && hover.x < GRID_SIZE && hover.y >= 0 && hover.y < GRID_SIZE) {
                    const shatterFn = useGameStore.getState().useShatter;
                    shatterFn(hover.x, hover.y);
                }
            } else if (activeSkill === SkillType.BOMB && hover) {
                if (hover.x >= 0 && hover.x < GRID_SIZE && hover.y >= 0 && hover.y < GRID_SIZE) {
                    const bombFn = useGameStore.getState().useBomb;
                    bombFn(hover.x, hover.y);
                }
            }
            // Note: Piece placement is handled by window handler
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

        // Start render loop with proper frame rate control
        if (isNativeApp) {
            // Native apps: Use requestAnimationFrame for proper vsync
            // This prevents Android's setRequestedFrameRate warnings
            let animationFrameId: number;
            
            const renderFrame = () => {
                scene.render();
                animationFrameId = requestAnimationFrame(renderFrame);
            };
            
            animationFrameId = requestAnimationFrame(renderFrame);
            
            // Store the animation frame ID for cleanup
            (engine as any)._nativeAnimationFrameId = animationFrameId;
        } else {
            // Web: Use default render loop
            engine.runRenderLoop(() => {
                scene.render();
            });
        }

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
            
            // Background pause cleanup is now handled by useBackgroundPause hook
            
            // Cancel native animation frame if active (DEPRECATED - now handled by BackgroundPauseManager)
            // if (nativeAnimationFrameId !== null) {
            //     cancelAnimationFrame(nativeAnimationFrameId);
            // }
            
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

    // Surge altın efekti: isSurgeActive değiştiğinde blok mesh'lerini güncelle
    useEffect(() => {
        const meshMap = meshMapRef.current;
        meshMap.forEach((mesh) => {
            const mat = mesh.material as BABYLON.StandardMaterial | null;
            if (!mat) return;
            if (isSurgeActive) {
                // Altın emissive overlay
                mat.emissiveColor = BABYLON.Color3.FromHexString('#f59e0b').scale(0.6);
            } else {
                // Orijinal rengi geri yükle (mesh name'den color okuyamıyoruz, diffuse'dan türetelim)
                const diffuse = mat.diffuseColor;
                mat.emissiveColor = diffuse.scale(0.1);
            }
        });
    }, [isSurgeActive]);

    // ESC key listener for skill cancellation
    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && stateRef.current.activeSkill) {
                const { activateSkill, activeSkill: currentSkill } = useGameStore.getState();
                if (currentSkill) {
                    activateSkill(currentSkill); // Toggle off
                }
            }
        };
        
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, []);

    return (
        <div className={clsx(
            "relative w-full h-full overflow-hidden transition-all duration-300",
            activeSkill === SkillType.SHATTER ? "ring-2 ring-rose-500/30" :
                activeSkill === SkillType.BOMB ? "ring-2 ring-orange-500/30" :
                    ""
        )}>
            <canvas
                ref={canvasRef}
                className={clsx(
                    "w-full h-full touch-none outline-none block",
                    "grid-container interactive-element" // Task 9.5: Android touch CSS classes
                )}
            />
        </div>
    );
};