import React, { useRef, useEffect, useState } from 'react';
import * as BABYLON from 'babylonjs';
import { useGameStore } from '../store/gameStore';
import { useThemeStore } from '../../../shared/store/themeStore';
import { useVisualEffectStore } from '../../visual-effects/store/visualEffectStore';
import { GRID_SIZE, SkillType, CellType, GridState } from '../types';
import { GameMode } from '@shared/types';
import { getDragYOffset, setCanvasRect } from '../../../utils/responsive';
import { playHaptic } from '../../../utils/audio';
import clsx from 'clsx';

// Constants for 3D layout
const CELL_SIZE = 1.0;
const CELL_SPACING = 0.05; // Tighter spacing like the image
const TOTAL_CELL_SIZE = CELL_SIZE + CELL_SPACING;
const GRID_OFFSET = ((GRID_SIZE - 1) * TOTAL_CELL_SIZE) / 2;
const GHOST_POOL_SIZE = 25;
const SKILL_OVERLAY_POOL_SIZE = 10;
const GUIDED_HIGHLIGHT_POOL_SIZE = 25;
const FRAGMENT_POOL_SIZE = 50; // Max concurrent fragments
const FRAGMENT_LIFETIME = 400; // ms

export const Grid: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { grid, draggedPiece, placePiece, canPlacePiece, activeSkill, setDraggedPiece, score, combo, isSurgeActive, lastAction, pieces, activeEvent, gameMode, timeLeft, isGameOver, difficultyTier } = useGameStore();
    const { getThemeColors } = useThemeStore();

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
    const gameOverAnimationRef = useRef<{
        active: boolean;
        phase: 'shake' | 'collapse' | 'fade';
        progress: number;
        startTime: number;
        allBlockIds: string[];
    } | null>(null);
    
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

        // Device capability detection
        const deviceMemory = (navigator as any).deviceMemory ?? 4; // GB
        const isLowEndDevice = deviceMemory <= 2 || navigator.hardwareConcurrency <= 2;
        const isMobile = window.innerWidth < 768;
        
        // Native mobile app detection (React Native WebView or Capacitor)
        const isNativeApp = !!(window as any).ReactNativeWebView || 
                           !!(window as any).Capacitor || 
                           /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Disable animations on low-end devices, native apps, or when reduced motion is preferred
        const disableAnimations = prefersReducedMotion || isLowEndDevice || isNativeApp;

        // Engine configuration based on device capability
        let engine: BABYLON.Engine;
        try {
          engine = new BABYLON.Engine(canvasRef.current, true, {
              preserveDrawingBuffer: true,
              stencil: true,
              antialias: !isMobile && !isLowEndDevice,
              adaptToDeviceRatio: false, // Keep false for stability
              limitDeviceRatio: isLowEndDevice ? 1.0 : (isNativeApp ? 1.5 : Math.min(window.devicePixelRatio, 2)),
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

        // Hardware scaling - balanced approach for native apps
        const hardwareScale = isLowEndDevice ? 2.0 : (isNativeApp ? 1.2 : (isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio));
        engine.setHardwareScalingLevel(1 / hardwareScale);

        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

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

        // Camera — beta π/11 ≈ 16.4° daha tepeden/havadan bakış
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 11, 18, BABYLON.Vector3.Zero(), scene);
        camera.lowerRadiusLimit = 8;
        camera.upperRadiusLimit = 35;
        camera.lowerBetaLimit = 0.1;
        camera.upperBetaLimit = Math.PI / 2.5;

        // Reduce camera far plane on low-end devices
        if (isLowEndDevice) {
            camera.maxZ = 50; // Reduced from default 10000
        }

        const updateCamera = () => {
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            const isPortrait = screenH > screenW;
            const aspectRatio = screenW / screenH;

            if (isPortrait) {
                // --- MOBİL DİKEY ---
                let fov: number;
                let radius: number;

                if (aspectRatio < 0.48) {
                    fov = 1.05; radius = 12.0; // Çok uzun ekranlar - optimized
                } else if (aspectRatio < 0.55) {
                    fov = 0.95; radius = 12.0; // Standart telefon - optimized
                } else if (aspectRatio < 0.65) {
                    fov = 0.88; radius = 12.5; // Geniş telefon - optimized
                } else {
                    fov = 0.82; radius = 13.0; // Küçük tablet - optimized
                }
                
                // Native app'lerde grid daha büyük görünsün diye radius'u biraz azalt
                if (isNativeApp) {
                    radius = radius - 1.0; // 1 birim daha yakın
                }

                camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
                camera.fov = fov;
                camera.radius = radius;
                
                // Adjust camera target for small screens
                const targetY = screenW < 390 ? -0.05 : -0.1;
                camera.target = new BABYLON.Vector3(0, targetY, 0);

            } else {
                // --- DESKTOP / LANDSCAPE ---
                // VERTICAL_FIXED: fov dikey görüş açısı → küçük değer = daha sıkı/zoom
                // Grid 10×10 birim, tam sığması için radius ~17-18 ve fov ~0.65
                let fov: number;
                let radius: number;

                if (aspectRatio > 2.0) {
                    fov = 0.58; radius = 17.0; // Ultra-wide
                } else if (aspectRatio > 1.5) {
                    fov = 0.65; radius = 17.5; // 16:9 standart
                } else {
                    fov = 0.70; radius = 18.0; // Laptop / kare yakın
                }

                camera.fovMode = BABYLON.Camera.FOVMODE_VERTICAL_FIXED;
                camera.fov = fov;
                camera.radius = radius;
                camera.target = new BABYLON.Vector3(0, -0.2, 0); // Sığdırmak için hafif yukarı
            }
        };
        updateCamera();

        // Resize handler to adjust camera dynamically
        const handleResize = () => {
            engine.resize();
            updateCamera();
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

        // --- Pool Initialization Functions ---
        const initGhostPool = (scene: BABYLON.Scene) => {
            const pool: BABYLON.Mesh[] = [];
            for (let i = 0; i < GHOST_POOL_SIZE; i++) {
                const ghost = BABYLON.MeshBuilder.CreateBox(`ghost-pool-${i}`, 
                    { size: CELL_SIZE * 0.92, height: 0.65 }, 
                    scene
                );
                const mat = new BABYLON.StandardMaterial(`ghost-mat-${i}`, scene);
                mat.alpha = 0.5;
                mat.specularColor = BABYLON.Color3.Black();
                ghost.material = mat;
                ghost.isPickable = false;
                ghost.isVisible = false;
                pool.push(ghost);
            }
            return pool;
        };

        const initSkillOverlayPool = (scene: BABYLON.Scene) => {
            const pool: BABYLON.Mesh[] = [];
            for (let i = 0; i < SKILL_OVERLAY_POOL_SIZE; i++) {
                const overlay = BABYLON.MeshBuilder.CreateBox(`skill-overlay-${i}`, 
                    { size: CELL_SIZE * 0.95, height: 0.7 }, 
                    scene
                );
                const mat = new BABYLON.StandardMaterial(`skill-mat-${i}`, scene);
                mat.emissiveColor = i === 0 
                    ? BABYLON.Color3.FromHexString("#ef4444") 
                    : BABYLON.Color3.FromHexString("#f97316");
                overlay.material = mat;
                overlay.isPickable = false;
                overlay.isVisible = false;
                pool.push(overlay);
            }
            return pool;
        };

        const initGuidedHighlightPool = (scene: BABYLON.Scene) => {
            const pool: BABYLON.Mesh[] = [];
            for (let i = 0; i < GUIDED_HIGHLIGHT_POOL_SIZE; i++) {
                const highlight = BABYLON.MeshBuilder.CreateBox(`guided-highlight-${i}`, 
                    { size: CELL_SIZE * 0.92, height: 0.65 }, 
                    scene
                );
                const mat = new BABYLON.StandardMaterial(`guided-mat-${i}`, scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString("#10b981");
                mat.emissiveColor = BABYLON.Color3.FromHexString("#10b981").scale(0.3);
                mat.alpha = 0.5;
                mat.specularColor = BABYLON.Color3.Black();
                highlight.material = mat;
                highlight.isPickable = false;
                highlight.isVisible = false;
                pool.push(highlight);
            }
            return pool;
        };

        const initFragmentPool = (scene: BABYLON.Scene): BABYLON.Mesh[] => {
            const pool: BABYLON.Mesh[] = [];
            for (let i = 0; i < FRAGMENT_POOL_SIZE; i++) {
                // Küçük random boyutlu fragment
                const size = 0.15 + Math.random() * 0.1; // 0.15-0.25
                const fragment = BABYLON.MeshBuilder.CreateBox(
                    `fragment-pool-${i}`,
                    { width: size, height: size, depth: size },
                    scene
                );
                
                const mat = new BABYLON.StandardMaterial(`fragment-mat-${i}`, scene);
                mat.specularColor = BABYLON.Color3.Black();
                fragment.material = mat;
                fragment.isPickable = false;
                fragment.isVisible = false;
                
                pool.push(fragment);
            }
            return pool;
        };

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
        
        // Update fragments in render loop
        const updateFragments = (currentTime: number): void => {
            const GRAVITY = -0.015; // Yerçekimi
            
            fragmentPoolRef.current.activeFragments.forEach((data, key) => {
                const elapsed = currentTime - data.startTime;
                
                if (elapsed > FRAGMENT_LIFETIME) {
                    // Fade out tamamlandı, fragment'i geri pool'a al
                    data.mesh.isVisible = false;
                    fragmentPoolRef.current.activeFragments.delete(key);
                    return;
                }
                
                // Physics update
                data.velocity.y += GRAVITY; // Gravity
                data.mesh.position.addInPlace(data.velocity);
                data.mesh.rotation.addInPlace(data.rotationVelocity);
                
                // Fade out
                const fadeProgress = elapsed / FRAGMENT_LIFETIME;
                if (data.mesh.material) {
                    const mat = data.mesh.material as BABYLON.StandardMaterial;
                    mat.alpha = data.startAlpha * (1 - fadeProgress);
                }
            });
        };
        
        // Create break apart fragments for a cell
        const createBreakApartFragments = (
            cellX: number,
            cellY: number,
            color: string,
            cellType: CellType
        ): void => {
            if (isLowEndDevice || prefersReducedMotion) return;
            
            const fragmentCount = isMobile ? 3 : 5; // Mobile'de daha az
            const worldPos = getVectorPos(cellX, cellY);
            
            // Pool'dan fragment al
            let fragmentsCreated = 0;
            for (let i = 0; i < fragmentPoolRef.current.pool.length && fragmentsCreated < fragmentCount; i++) {
                const fragment = fragmentPoolRef.current.pool[i];
                if (!fragment.isVisible) {
                    // Fragment'i aktif et
                    fragment.position = worldPos.clone();
                    fragment.position.y = 0; // Grid seviyesinde
                    
                    // Random outward velocity
                    const angle = (Math.PI * 2 * fragmentsCreated) / fragmentCount;
                    const speed = 0.3 + Math.random() * 0.5; // 0.3-0.8
                    const velocity = new BABYLON.Vector3(
                        Math.cos(angle) * speed,
                        0.5 + Math.random() * 0.3, // Yukarı fırlama
                        Math.sin(angle) * speed
                    );
                    
                    // Random rotation
                    const rotationVelocity = new BABYLON.Vector3(
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2
                    );
                    
                    // Material setup
                    const mat = fragment.material as BABYLON.StandardMaterial;
                    mat.diffuseColor = BABYLON.Color3.FromHexString(color);
                    mat.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.3);
                    mat.alpha = 1.0;
                    
                    fragment.isVisible = true;
                    
                    // Aktif fragment listesine ekle
                    fragmentPoolRef.current.activeFragments.set(`fragment-${i}`, {
                        mesh: fragment,
                        velocity,
                        rotationVelocity,
                        startTime: Date.now(),
                        startAlpha: 1.0
                    });
                    
                    fragmentsCreated++;
                }
            }
        };
        
        // Update camera shake in render loop
        const updateCameraShake = (camera: BABYLON.ArcRotateCamera, deltaTime: number): void => {
            if (prefersReducedMotion) {
                // Ensure camera is at default position
                const isPortrait = window.innerHeight > window.innerWidth;
                camera.target.y = isPortrait ? -0.1 : -0.2;
                return;
            }
            
            if (shakeIntensityRef.current > 0) {
                const intensity = shakeIntensityRef.current;
                
                // Shake pattern: up → down → return (200ms cycle)
                const shakeTime = Date.now() % 200; // 200ms cycle
                let offset = 0;
                
                if (shakeTime < 50) {
                    // Up phase (0-50ms)
                    offset = (shakeTime / 50) * 0.1 * intensity;
                } else if (shakeTime < 100) {
                    // Down phase (50-100ms)
                    offset = 0.1 * intensity - ((shakeTime - 50) / 50) * 0.15 * intensity;
                } else {
                    // Return phase (100-200ms)
                    offset = -0.05 * intensity * (1 - (shakeTime - 100) / 100);
                }
                
                // Apply to camera target Y
                const isPortrait = window.innerHeight > window.innerWidth;
                const baseTargetY = isPortrait ? -0.1 : -0.2;
                camera.target.y = baseTargetY + offset;
                
                // Decay shake intensity (2 units/sec)
                shakeIntensityRef.current = Math.max(0, intensity - deltaTime * 2);
            } else {
                // Ensure camera is at default position
                const isPortrait = window.innerHeight > window.innerWidth;
                camera.target.y = isPortrait ? -0.1 : -0.2;
            }
        };
        
        // Trigger camera shake based on line count
        const triggerCameraShake = (lineCount: number): void => {
            if (prefersReducedMotion) return;
            
            if (lineCount === 1) {
                shakeIntensityRef.current = 0.3;
            } else if (lineCount === 2) {
                shakeIntensityRef.current = 0.6;
            } else {
                shakeIntensityRef.current = 1.0;
            }
        };
        
        // Detect full rows and columns for line clear animation
        const detectLineClear = (grid: GridState): { rows: number[]; cols: number[] } => {
            const fullRows: number[] = [];
            const fullCols: number[] = [];
            
            // Check rows
            for (let y = 0; y < GRID_SIZE; y++) {
                if (grid[y].every(cell => cell.filled)) fullRows.push(y);
            }
            
            // Check columns
            for (let x = 0; x < GRID_SIZE; x++) {
                let isFull = true;
                for (let y = 0; y < GRID_SIZE; y++) {
                    if (!grid[y][x].filled) {
                        isFull = false;
                        break;
                    }
                }
                if (isFull) fullCols.push(x);
            }
            
            return { rows: fullRows, cols: fullCols };
        };
        
        // Start line clear animation
        const startLineClearAnimation = (rows: number[], cols: number[]) => {
            if (lineClearAnimationRef.current?.active) return; // Prevent concurrent animations
            
            // Trigger camera shake based on line count
            const totalLines = rows.length + cols.length;
            triggerCameraShake(totalLines);
            
            const clearedCells = new Set<string>();
            rows.forEach(y => {
                for (let x = 0; x < GRID_SIZE; x++) clearedCells.add(`${x},${y}`);
            });
            cols.forEach(x => {
                for (let y = 0; y < GRID_SIZE; y++) clearedCells.add(`${x},${y}`);
            });
            
            // Store original colors for each cleared cell
            const originalColors = new Map<string, BABYLON.Color3>();
            clearedCells.forEach(key => {
                const [x, y] = key.split(',').map(Number);
                const cell = stateRef.current.grid[y]?.[x];
                if (cell?.id) {
                    const mesh = meshMapRef.current.get(cell.id);
                    if (mesh?.material) {
                        const mat = mesh.material as BABYLON.StandardMaterial;
                        originalColors.set(key, mat.diffuseColor.clone());
                    }
                }
            });
            
            // Calculate affected blocks (blocks above cleared rows)
            const affectedBlocks = new Map<string, { startY: number; targetY: number }>();
            const clearedRowsSorted = [...rows].sort((a, b) => b - a); // Sort descending
            
            for (let x = 0; x < GRID_SIZE; x++) {
                let fallDistance = 0;
                for (let y = GRID_SIZE - 1; y >= 0; y--) {
                    if (clearedRowsSorted.includes(y)) {
                        fallDistance++;
                    } else if (fallDistance > 0) {
                        const key = `${x},${y}`;
                        const mesh = meshMapRef.current.get(stateRef.current.grid[y][x].id || '');
                        if (mesh) {
                            affectedBlocks.set(key, {
                                startY: mesh.position.y,
                                targetY: mesh.position.y - (fallDistance * TOTAL_CELL_SIZE)
                            });
                        }
                    }
                }
            }
            
            lineClearAnimationRef.current = {
                active: true,
                phase: 'brightness', // Start with brightness wave phase
                progress: 0,
                startTime: Date.now(),
                clearedCells,
                affectedBlocks,
                originalColors
            };
        };
        
        // Start game over animation
        const startGameOverAnimation = () => {
            if (gameOverAnimationRef.current?.active) return;
            
            // Collect all block IDs
            const allBlockIds: string[] = [];
            meshMapRef.current.forEach((mesh, id) => {
                allBlockIds.push(id);
            });
            
            gameOverAnimationRef.current = {
                active: true,
                phase: 'shake',
                progress: 0,
                startTime: Date.now(),
                allBlockIds
            };
        };

        // ─── Juice System Helper Functions ───
        
        /**
         * Calculate spring curve value at given progress
         * Spring curve: [1.0 → 1.15 → 1.0] (or [1.0 → 1.05 → 1.0] for reduced motion)
         * @param progress - Animation progress from 0.0 to 1.0
         * @param curve - Spring curve values [start, peak, end]
         * @returns Interpolated scale value
         */
        const applySpringCurve = (progress: number, curve: [number, number, number]): number => {
            const [start, peak, end] = curve;
            
            if (progress < 0.5) {
                // First half: interpolate from start to peak
                const t = progress * 2; // 0.0 to 1.0
                return start + (peak - start) * t;
            } else {
                // Second half: interpolate from peak to end
                const t = (progress - 0.5) * 2; // 0.0 to 1.0
                return peak + (end - peak) * t;
            }
        };
        
        /**
         * Calculate staggered start time for cell animation
         * @param cellIndex - Index of the cell in the piece
         * @param staggerDelay - Delay in milliseconds per cell
         * @returns Start time offset in milliseconds
         */
        const calculateStaggerDelay = (cellIndex: number, staggerDelay: number): number => {
            return cellIndex * staggerDelay;
        };
        
        /**
         * Ease-out-quad easing function
         * @param t - Progress from 0.0 to 1.0
         * @returns Eased value
         */
        const easeOutQuad = (t: number): number => {
            return t * (2 - t);
        };
        
        /**
         * Update placement animations in the render loop
         * @param currentTime - Current timestamp in milliseconds
         */
        const updatePlacementAnimations = (currentTime: number) => {
            if (!placementAnimationRef.current?.active) return;
            
            const anim = placementAnimationRef.current;
            const ANIMATION_DURATION = 80; // 80ms total animation
            const EMISSIVE_DURATION = 300; // 300ms emissive glow
            const springCurve: [number, number, number] = prefersReducedMotion ? [1.0, 1.05, 1.0] : [1.0, 1.15, 1.0];
            
            let allComplete = true;
            
            anim.cellAnimations.forEach((cellAnim, cellId) => {
                const mesh = meshMapRef.current.get(cellId);
                if (!mesh) return;
                
                const elapsed = currentTime - cellAnim.startTime;
                
                // Scale animation (80ms)
                if (elapsed < ANIMATION_DURATION) {
                    allComplete = false;
                    const progress = elapsed / ANIMATION_DURATION;
                    const scale = applySpringCurve(progress, springCurve);
                    mesh.scaling = cellAnim.originalScale.scale(scale);
                } else {
                    // Ensure final scale is restored
                    mesh.scaling = cellAnim.originalScale;
                }
                
                // Emissive glow animation (300ms)
                if (elapsed < EMISSIVE_DURATION && mesh.material) {
                    allComplete = false;
                    const mat = mesh.material as BABYLON.StandardMaterial;
                    const progress = elapsed / EMISSIVE_DURATION;
                    const intensity = 1.0 - progress; // Fade from 1.0 to 0.0
                    
                    // Apply enhanced emissive color
                    const enhancedEmissive = cellAnim.originalEmissive.scale(1.0 + intensity * 2.0);
                    mat.emissiveColor = enhancedEmissive;
                } else if (mesh.material) {
                    // Restore original emissive
                    const mat = mesh.material as BABYLON.StandardMaterial;
                    mat.emissiveColor = cellAnim.originalEmissive;
                }
            });
            
            // Clean up animation state when all animations complete
            if (allComplete) {
                placementAnimationRef.current = null;
            }
        };
        
        /**
         * Animate placement of cells with spring curve and stagger timing
         * @param cellIds - Array of cell IDs to animate
         */
        const animatePlacement = (cellIds: string[]) => {
            if (disableAnimations || prefersReducedMotion) {
                // Skip animation setup if animations are disabled
                // Reduced motion will still use a subtle spring curve in updatePlacementAnimations
                if (prefersReducedMotion) {
                    // Still set up animation but with reduced motion curve
                    const currentTime = Date.now();
                    const STAGGER_DELAY = 15; // 15ms per cell
                    
                    const cellAnimations = new Map<string, {
                        cellId: string;
                        startTime: number;
                        originalScale: BABYLON.Vector3;
                        originalEmissive: BABYLON.Color3;
                    }>();
                    
                    cellIds.forEach((cellId, index) => {
                        const mesh = meshMapRef.current.get(cellId);
                        if (!mesh) return;
                        
                        const staggerDelay = calculateStaggerDelay(index, STAGGER_DELAY);
                        
                        cellAnimations.set(cellId, {
                            cellId,
                            startTime: currentTime + staggerDelay,
                            originalScale: new BABYLON.Vector3(1, 1, 1),
                            originalEmissive: mesh.material 
                                ? (mesh.material as BABYLON.StandardMaterial).emissiveColor.clone()
                                : BABYLON.Color3.Black()
                        });
                    });
                    
                    placementAnimationRef.current = {
                        active: true,
                        startTime: currentTime,
                        cellAnimations
                    };
                }
                return;
            }
            
            const currentTime = Date.now();
            const STAGGER_DELAY = 15; // 15ms per cell
            
            const cellAnimations = new Map<string, {
                cellId: string;
                startTime: number;
                originalScale: BABYLON.Vector3;
                originalEmissive: BABYLON.Color3;
            }>();
            
            cellIds.forEach((cellId, index) => {
                const mesh = meshMapRef.current.get(cellId);
                if (!mesh) return;
                
                const staggerDelay = calculateStaggerDelay(index, STAGGER_DELAY);
                
                cellAnimations.set(cellId, {
                    cellId,
                    startTime: currentTime + staggerDelay,
                    originalScale: new BABYLON.Vector3(1, 1, 1),
                    originalEmissive: mesh.material 
                        ? (mesh.material as BABYLON.StandardMaterial).emissiveColor.clone()
                        : BABYLON.Color3.Black()
                });
            });
            
            placementAnimationRef.current = {
                active: true,
                startTime: currentTime,
                cellAnimations
            };
        };

        const createBlockMesh = (colorHex: string, id: string, type: CellType = CellType.NORMAL, health?: number) => {
            const mat = new BABYLON.StandardMaterial(`${id}-mat`, scene);

            if (type === CellType.ICE) {
                // ══ BLOBK: Buz / Kristal ══
                // Tam buz bloğu — sağlam, parlak, net görünür
                const box = BABYLON.MeshBuilder.CreateBox(id, { size: CELL_SIZE * 0.92, height: 0.65 }, scene);

                if (health === 1) {
                    // Kırık buzlu görünüm — daha opak, cracked efekti
                    const crackedCol = BABYLON.Color3.FromHexString("#bfdbfe"); // açık mavi
                    mat.diffuseColor = crackedCol;
                    mat.emissiveColor = BABYLON.Color3.FromHexString("#60a5fa").scale(0.1); // Reduced emissive
                    mat.specularColor = BABYLON.Color3.Black(); // No shininess
                    mat.specularPower = 0;
                    mat.alpha = 0.8;
                    box.material = mat;

                    // Çatlak efekti için kırmızımsı kenarlar
                    box.enableEdgesRendering();
                    box.edgesWidth = 3.5;
                    box.edgesColor = new BABYLON.Color4(0.9, 0.6, 0.2, 0.9); // turuncu-sarı crack rengi
                } else {
                    // Sağlam buz — kristal mavi, şeffaf ve net
                    const iceCol = BABYLON.Color3.FromHexString("#7dd3fc");
                    mat.diffuseColor = iceCol;
                    mat.emissiveColor = BABYLON.Color3.FromHexString("#38bdf8").scale(0.15);
                    mat.specularColor = BABYLON.Color3.Black(); // No shininess
                    mat.specularPower = 0;
                    mat.alpha = 0.85;
                    box.material = mat;

                    // Parlak beyaz kenarlar — buz netliği
                    box.enableEdgesRendering();
                    box.edgesWidth = 2.5;
                    box.edgesColor = new BABYLON.Color4(0.7, 0.92, 1.0, 0.85);

                    // Üstte snowflake işareti için marker küpü
                    const marker = BABYLON.MeshBuilder.CreateBox(`${id}-marker`, { size: CELL_SIZE * 0.25, height: 0.05 }, scene);
                    marker.position.y = 0.35;
                    const mMat = new BABYLON.StandardMaterial(`${id}-mMat`, scene);
                    mMat.emissiveColor = BABYLON.Color3.FromHexString("#e0f2fe");
                    mMat.disableLighting = true;
                    mMat.alpha = 0.9;
                    marker.material = mMat;
                    marker.parent = box;
                    marker.isPickable = false;
                }

                box.isPickable = false;
                box.position.y = 12;
                
                return box;

            } else if (type === CellType.BOMB) {
                // ══ BLOCK: Bomba — Metalik, Tehlikeli, Premium ══
                const box = BABYLON.MeshBuilder.CreateBox(id, { size: CELL_SIZE * 0.88, height: 0.72 }, scene);

                // Koyu metal gövde — daha küçük ve güçlü görünüm
                mat.diffuseColor = BABYLON.Color3.FromHexString("#1c1917"); // koyu kahverengi-siyah metal
                mat.emissiveColor = BABYLON.Color3.FromHexString("#f59e0b").scale(0.1); // Reduced emissive
                mat.specularColor = BABYLON.Color3.Black(); // No shininess
                mat.specularPower = 0;
                mat.alpha = 1.0;
                box.material = mat;

                // Tehlike çizgileri — kalın sarı-turuncu kenarlar
                box.enableEdgesRendering();
                box.edgesWidth = 4.0;
                box.edgesColor = new BABYLON.Color4(1.0, 0.6, 0.0, 1.0); // parlak turuncu

                // Üst kısımda bomba fitili simgesi (küçük silindir)
                const fuseBase = BABYLON.MeshBuilder.CreateCylinder(`${id}-fuse`, {
                    height: 0.2,
                    diameter: 0.18,
                    tessellation: 6
                }, scene);
                fuseBase.position.y = 0.45;
                const fuseMat = new BABYLON.StandardMaterial(`${id}-fuseMat`, scene);
                fuseMat.emissiveColor = BABYLON.Color3.FromHexString("#ef4444"); // kırmızı ateş ucu
                fuseMat.disableLighting = true;
                fuseBase.material = fuseMat;
                fuseBase.parent = box;
                fuseBase.isPickable = false;

                box.isPickable = false;
                box.position.y = 12;
                
                return box;

            } else if (type === CellType.CHRONO) {
                // ══ BLOCK: CHRONO — Altın, Zaman Bonusu ══
                const box = BABYLON.MeshBuilder.CreateBox(id, { size: CELL_SIZE * 0.88, height: 0.68 }, scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString("#fbbf24");
                mat.emissiveColor = BABYLON.Color3.FromHexString("#f59e0b").scale(0.2);
                mat.specularColor = BABYLON.Color3.Black();
                mat.specularPower = 0;
                mat.alpha = 1.0;
                box.material = mat;

                // Altın kenarlık
                box.enableEdgesRendering();
                box.edgesWidth = 3.5;
                box.edgesColor = new BABYLON.Color4(1.0, 0.85, 0.2, 1.0);

                // Üstte saat simgesi marker
                const marker = BABYLON.MeshBuilder.CreateBox(`${id}-chrono`, { size: CELL_SIZE * 0.3, height: 0.06 }, scene);
                marker.position.y = 0.37;
                const mMat = new BABYLON.StandardMaterial(`${id}-chronoMat`, scene);
                mMat.emissiveColor = BABYLON.Color3.FromHexString("#fef3c7");
                mMat.disableLighting = true;
                mMat.alpha = 0.95;
                marker.material = mMat;
                marker.parent = box;
                marker.isPickable = false;

                box.isPickable = false;
                box.position.y = 12;
                
                return box;

            } else {
                // ══ BLOCK: Normal ══
                const box = BABYLON.MeshBuilder.CreateBox(id, { size: CELL_SIZE * 0.92, height: 0.6 }, scene);
                const col = BABYLON.Color3.FromHexString(colorHex);
                mat.diffuseColor = col;
                mat.emissiveColor = col.scale(0.05);
                mat.specularColor = BABYLON.Color3.Black();
                mat.specularPower = 0;
                mat.alpha = 0.95;
                box.material = mat;

                // Clean Edges
                box.enableEdgesRendering();
                box.edgesWidth = 1.5;
                box.edgesColor = new BABYLON.Color4(1, 1, 1, 0.12);

                box.isPickable = false;
                box.position.y = 12;
                
                return box;
            }
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
            const deltaTime = engine.getDeltaTime() / 1000; // Convert to seconds
            time += deltaTime;
            frameCount++;
            const currentTime = Date.now(); // Current timestamp for animations
            const { grid, draggedPiece, activeSkill, score, combo, lastAction, isGameOver, gameMode: currentGameMode, timeLeft: currentTimeLeft, difficultyTier: currentTier } = stateRef.current;

            // ─── Juice System: Update Placement Animations ───
            updatePlacementAnimations(currentTime);
            
            // ─── Fragment System: Update Break Apart Fragments ───
            updateFragments(currentTime);

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
            if (tierFlashRef.current?.active) {
                const flash = tierFlashRef.current;
                const elapsed = Date.now() - flash.startTime;
                
                if (elapsed < 400) {
                    flash.progress = elapsed / 400;
                    const intensity = 0.8 * (1 - flash.progress); // Fade from 0.8 to 0
                    
                    // Apply flash to all grid blocks
                    meshMapRef.current.forEach((mesh) => {
                        if (mesh.material) {
                            const mat = mesh.material as BABYLON.StandardMaterial;
                            
                            // Store original emissive if not already stored
                            if (!(mat as any)._tierFlashOriginal) {
                                (mat as any)._tierFlashOriginal = mat.emissiveColor.clone();
                            }
                            
                            // Apply tier color overlay
                            const original = (mat as any)._tierFlashOriginal;
                            mat.emissiveColor = BABYLON.Color3.Lerp(original, flash.color, intensity);
                        }
                    });
                } else {
                    // Flash complete - restore original colors
                    meshMapRef.current.forEach((mesh) => {
                        if (mesh.material) {
                            const mat = mesh.material as BABYLON.StandardMaterial;
                            if ((mat as any)._tierFlashOriginal) {
                                mat.emissiveColor = (mat as any)._tierFlashOriginal;
                                delete (mat as any)._tierFlashOriginal;
                            }
                        }
                    });
                    
                    tierFlashRef.current = null;
                }
            }

            // ─── Last 10 Seconds Atmosphere (Timed Mode) ───
            if (currentGameMode === GameMode.TIMED && currentTimeLeft <= 10 && currentTimeLeft > 0) {
                const intensity = (10 - currentTimeLeft) / 10;
                const redTint = new BABYLON.Color3(1.0, 0.3, 0.3);
                
                // Apply to all grid blocks
                meshMapRef.current.forEach((mesh) => {
                    if (mesh.material) {
                        const mat = mesh.material as BABYLON.StandardMaterial;
                        
                        // Store original emissive if not already stored
                        if (!(mat as any)._originalEmissive) {
                            (mat as any)._originalEmissive = mat.emissiveColor.clone();
                        }
                        
                        // Apply red tint overlay
                        const originalEmissive = (mat as any)._originalEmissive;
                        mat.emissiveColor = BABYLON.Color3.Lerp(
                            originalEmissive,
                            redTint,
                            intensity * 0.5
                        );
                        
                        // Increase emissive intensity
                        (mat as any).emissiveIntensity = 1.0 + (intensity * 0.5);
                    }
                });
                
                // Apply to grid base
                if (gridBaseRef.current?.material) {
                    const mat = gridBaseRef.current.material as BABYLON.StandardMaterial;
                    if (!(mat as any)._originalDiffuse) {
                        (mat as any)._originalDiffuse = mat.diffuseColor.clone();
                    }
                    const originalDiffuse = (mat as any)._originalDiffuse;
                    const darkRed = new BABYLON.Color3(0.3, 0.05, 0.05);
                    mat.diffuseColor = BABYLON.Color3.Lerp(originalDiffuse, darkRed, intensity);
                }
                
                // Apply to ambient light
                if (light) {
                    light.intensity = (isMobile ? 0.45 : 0.7) + (intensity * 0.3);
                }
            } else if (currentGameMode === GameMode.TIMED && currentTimeLeft > 10) {
                // Restore original colors when time > 10
                meshMapRef.current.forEach((mesh) => {
                    if (mesh.material) {
                        const mat = mesh.material as BABYLON.StandardMaterial;
                        if ((mat as any)._originalEmissive) {
                            mat.emissiveColor = (mat as any)._originalEmissive;
                            (mat as any).emissiveIntensity = 1.0;
                            delete (mat as any)._originalEmissive;
                        }
                    }
                });
                
                if (gridBaseRef.current?.material) {
                    const mat = gridBaseRef.current.material as BABYLON.StandardMaterial;
                    if ((mat as any)._originalDiffuse) {
                        mat.diffuseColor = (mat as any)._originalDiffuse;
                        delete (mat as any)._originalDiffuse;
                    }
                }
                
                if (light) {
                    light.intensity = isMobile ? 0.45 : 0.7;
                }
            }

            // ─── Game Over Animation ───
            if (gameOverAnimationRef.current?.active) {
                const anim = gameOverAnimationRef.current;
                const elapsed = Date.now() - anim.startTime;
                
                if (anim.phase === 'shake') {
                    // Shake phase: 300ms
                    if (elapsed < 300) {
                        anim.progress = elapsed / 300;
                        shakeIntensityRef.current = 0.5 * (1 - anim.progress); // Decay shake
                    } else {
                        // Transition to collapse phase
                        anim.phase = 'collapse';
                        anim.startTime = Date.now();
                        anim.progress = 0;
                        shakeIntensityRef.current = 0;
                    }
                } else if (anim.phase === 'collapse') {
                    // Collapse phase: 800ms
                    if (elapsed < 800) {
                        anim.progress = elapsed / 800;
                        
                        // Animate all blocks falling, fading, and rotating
                        anim.allBlockIds.forEach(id => {
                            const mesh = meshMapRef.current.get(id);
                            if (mesh) {
                                // Fall down
                                mesh.position.y -= 0.015; // Constant fall rate
                                
                                // Fade out
                                if (mesh.material) {
                                    const mat = mesh.material as BABYLON.StandardMaterial;
                                    mat.alpha = 1.0 - anim.progress;
                                }
                                
                                // Random rotation
                                mesh.rotation.y += 0.05 * (Math.random() - 0.5);
                            }
                        });
                    } else {
                        // Transition to fade phase
                        anim.phase = 'fade';
                        anim.startTime = Date.now();
                        anim.progress = 0;
                    }
                } else if (anim.phase === 'fade') {
                    // Fade phase: 300ms
                    if (elapsed < 300) {
                        anim.progress = elapsed / 300;
                        
                        // Fade grid base
                        if (gridBaseRef.current?.material) {
                            const mat = gridBaseRef.current.material as BABYLON.StandardMaterial;
                            mat.alpha = 1.0 - anim.progress;
                        }
                        
                        // Fade grid slots
                        gridSlotsRef.forEach(slot => {
                            if (slot.material) {
                                const mat = slot.material as BABYLON.StandardMaterial;
                                mat.alpha = 0.92 * (1.0 - anim.progress);
                            }
                        });
                    } else {
                        // Animation complete
                        gameOverAnimationRef.current = null;
                    }
                }
            }
            
            // Trigger game over animation when game ends
            if (isGameOver && !gameOverAnimationRef.current?.active) {
                startGameOverAnimation();
            }

            // ─── Line Clear Animation (Three-Stage System) ───
            if (lineClearAnimationRef.current?.active) {
                const anim = lineClearAnimationRef.current;
                const elapsed = Date.now() - anim.startTime;
                
                if (anim.phase === 'brightness') {
                    // Stage 1: Brightness wave (0-150ms)
                    if (elapsed < 150) {
                        anim.progress = elapsed / 150;
                        
                        // Convert cleared cells to array and sort left-to-right for wave effect
                        const cellsArray = Array.from(anim.clearedCells).map(key => {
                            const [x, y] = key.split(',').map(Number);
                            return { key, x, y };
                        }).sort((a, b) => a.x - b.x); // Sort by x coordinate (left-to-right)
                        
                        // Apply brightness wave that sweeps left-to-right
                        cellsArray.forEach((cellData, index) => {
                            const cell = grid[cellData.y]?.[cellData.x];
                            if (cell?.id) {
                                const mesh = meshMapRef.current.get(cell.id);
                                if (mesh?.material) {
                                    const mat = mesh.material as BABYLON.StandardMaterial;
                                    const originalColor = anim.originalColors.get(cellData.key) || mat.diffuseColor;
                                    
                                    // Calculate wave progress for this cell
                                    // Each cell's peak brightness occurs progressively later
                                    const cellWaveProgress = (anim.progress * cellsArray.length - index) / cellsArray.length;
                                    const clampedProgress = Math.max(0, Math.min(1, cellWaveProgress));
                                    
                                    // Brightness peaks at 0.5 progress, then fades
                                    let brightness: number;
                                    if (clampedProgress < 0.5) {
                                        brightness = clampedProgress * 2; // 0 to 1
                                    } else {
                                        brightness = 2 - (clampedProgress * 2); // 1 to 0
                                    }
                                    
                                    // Apply white brightness overlay
                                    const white = BABYLON.Color3.White();
                                    mat.emissiveColor = BABYLON.Color3.Lerp(originalColor, white, brightness * 0.8);
                                    (mat as any).emissiveIntensity = 1.0;
                                }
                            }
                        });
                    } else {
                        // Transition to particles phase
                        anim.phase = 'particles';
                        anim.startTime = Date.now();
                        anim.progress = 0;
                    }
                } else if (anim.phase === 'particles') {
                    // Stage 2: Particle emission (150-300ms)
                    if (elapsed < 150) {
                        anim.progress = elapsed / 150;
                        
                        // Trigger particle explosions at the start of this phase (only once)
                        if (anim.progress < 0.1 && !isLowEndDevice) {
                            const particleCount = isLowEndDevice ? 3 : 6;
                            
                            anim.clearedCells.forEach(key => {
                                const [x, y] = key.split(',').map(Number);
                                const cell = grid[y]?.[x];
                                if (cell) {
                                    const worldPos = getVectorPos(x, y);
                                    
                                    // Trigger visual effect explosion
                                    useVisualEffectStore.getState().addEffect({
                                        type: 'explosion',
                                        duration: 180,
                                        props: {
                                            x: worldPos.x,
                                            y: worldPos.y,
                                            color: cell.color,
                                            blockSize: 28,
                                            cellType: cell.type,
                                            particleCount: particleCount
                                        }
                                    });
                                    
                                    // Create break apart fragments
                                    if (cell.type) {
                                        createBreakApartFragments(x, y, cell.color, cell.type);
                                    }
                                }
                            });
                        }
                        
                        // Fade out cleared cells during particle phase
                        anim.clearedCells.forEach(key => {
                            const [x, y] = key.split(',').map(Number);
                            const cell = grid[y]?.[x];
                            if (cell?.id) {
                                const mesh = meshMapRef.current.get(cell.id);
                                if (mesh?.material) {
                                    const mat = mesh.material as BABYLON.StandardMaterial;
                                    mat.emissiveColor = BABYLON.Color3.Black();
                                    mat.alpha = 1.0 - anim.progress; // Fade out
                                }
                            }
                        });
                    } else {
                        // Transition to collapse phase
                        anim.phase = 'collapse';
                        anim.startTime = Date.now();
                        anim.progress = 0;
                        
                        // TODO: Trigger whoosh sound here (will be implemented in audio task)
                        // playWhoosh();
                    }
                } else if (anim.phase === 'collapse') {
                    // Stage 3: Collapse with whoosh (300-500ms = 200ms duration)
                    if (elapsed < 200) {
                        anim.progress = elapsed / 200;
                        const easedProgress = anim.progress * (2 - anim.progress); // ease-out-quad
                        
                        // Animate falling blocks
                        anim.affectedBlocks.forEach((data, key) => {
                            const [x, y] = key.split(',').map(Number);
                            const cell = grid[y]?.[x];
                            if (cell?.id) {
                                const mesh = meshMapRef.current.get(cell.id);
                                if (mesh) {
                                    mesh.position.y = data.startY + (data.targetY - data.startY) * easedProgress;
                                }
                            }
                        });
                    } else {
                        // Animation complete - remove cleared blocks
                        anim.clearedCells.forEach(key => {
                            const [x, y] = key.split(',').map(Number);
                            const cell = grid[y]?.[x];
                            if (cell?.id) {
                                const mesh = meshMapRef.current.get(cell.id);
                                if (mesh) {
                                    mesh.dispose();
                                    meshMapRef.current.delete(cell.id);
                                }
                            }
                        });
                        
                        lineClearAnimationRef.current = null;
                    }
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
                        startLineClearAnimation(rows, cols);
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
            updateCameraShake(camera, deltaTime);

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
                            mesh = createBlockMesh(cell.color, cell.id, cell.type, cell.health);
                            mesh.position = targetPos.clone();
                            mesh.position.y = 12; // Drop from higher
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
                            mesh.position = BABYLON.Vector3.Lerp(mesh.position, targetPos, 0.25);
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
                animatePlacement(newlyCreatedIds);
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

        // Pause rendering when page is hidden to save resources
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (isNativeApp) {
                    // Cancel animation frame for native apps
                    const animationFrameId = (engine as any)._nativeAnimationFrameId;
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                    }
                } else {
                    engine.stopRenderLoop();
                }
            } else {
                if (isNativeApp) {
                    // Restart animation frame for native apps
                    let animationFrameId: number;
                    
                    const renderFrame = () => {
                        scene.render();
                        animationFrameId = requestAnimationFrame(renderFrame);
                    };
                    
                    animationFrameId = requestAnimationFrame(renderFrame);
                    (engine as any)._nativeAnimationFrameId = animationFrameId;
                } else {
                    // Web: Use default render loop
                    engine.runRenderLoop(() => {
                        scene.render();
                    });
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

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
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('pointerup', handleWindowPointerUp);
            window.removeEventListener('pointermove', handleGlobalPointerMove);
            if (canvasRef.current) canvasRef.current.removeEventListener('pointerup', handleCanvasPointerUp);
            
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
                className="w-full h-full touch-none outline-none block"
            />
        </div>
    );
};