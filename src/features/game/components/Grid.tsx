import React, { useRef, useEffect, useState } from 'react';
import * as BABYLON from 'babylonjs';
import { useGameStore } from '../store/gameStore';
import { useThemeStore } from '../../../shared/store/themeStore';
import { GRID_SIZE, SkillType, CellType } from '../types';
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

export const Grid: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { grid, draggedPiece, placePiece, canPlacePiece, activeSkill, setDraggedPiece, score, combo, isSurgeActive, lastAction, guidedTarget, pieces } = useGameStore();
    const { getThemeColors } = useThemeStore();

    const stateRef = useRef({ grid, draggedPiece, activeSkill, score, combo, isSurgeActive, lastAction, guidedTarget, pieces });
    useEffect(() => { stateRef.current = { grid, draggedPiece, activeSkill, score, combo, isSurgeActive, lastAction, guidedTarget, pieces }; }, [grid, draggedPiece, activeSkill, score, combo, isSurgeActive, lastAction, guidedTarget, pieces]);

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

    // Refs for render loop logic
    const lastHandledActionRef = useRef<any>(null);
    const shakeIntensityRef = useRef(0);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Device capability detection
        const deviceMemory = (navigator as any).deviceMemory ?? 4; // GB
        const isLowEndDevice = deviceMemory <= 2 || navigator.hardwareConcurrency <= 2;
        const isMobile = window.innerWidth < 768;
        
        // Reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Engine configuration based on device capability
        const engine = new BABYLON.Engine(canvasRef.current, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: !isMobile && !isLowEndDevice,
            adaptToDeviceRatio: false,
            limitDeviceRatio: isLowEndDevice ? 1.0 : Math.min(window.devicePixelRatio, 2),
            doNotHandleContextLost: false,
        });

        // Hardware scaling - more aggressive on low-end devices
        const hardwareScale = isLowEndDevice ? 2.0 : (isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio);
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
                    fov = 0.98; radius = 13.0; // Çok uzun ekranlar
                } else if (aspectRatio < 0.55) {
                    fov = 0.90; radius = 12.5; // Standart telefon
                } else if (aspectRatio < 0.65) {
                    fov = 0.84; radius = 12.5; // Geniş telefon
                } else {
                    fov = 0.78; radius = 13.0; // Küçük tablet
                }

                camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
                camera.fov = fov;
                camera.radius = radius;
                camera.target = new BABYLON.Vector3(0, -0.1, 0);

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

        // Glow layer - completely disabled on low-end devices
        if (!isLowEndDevice) {
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

        // Initialize pools
        ghostMeshesRef.current = initGhostPool(scene);
        skillOverlayMeshesRef.current = initSkillOverlayPool(scene);
        guidedHighlightMeshesRef.current = initGuidedHighlightPool(scene);


        // --- Logic Helpers ---
        const getVectorPos = (gx: number, gy: number) => {
            return new BABYLON.Vector3(
                (gx * TOTAL_CELL_SIZE) - GRID_OFFSET,
                0,
                -((gy * TOTAL_CELL_SIZE) - GRID_OFFSET)
            );
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

        scene.registerBeforeRender(() => {
            time += engine.getDeltaTime() / 1000; // Use actual delta time instead of fixed 0.02
            const { grid, draggedPiece, activeSkill, score, combo, lastAction } = stateRef.current;

            // Check for new shake events
            if (lastAction && lastAction !== lastHandledActionRef.current) {
                if (lastAction.type === 'CLEAR') {
                    // Shake intensity based on lines cleared and combo
                    const lines = lastAction.lines || 1;
                    const cmb = lastAction.combo || 1;
                    shakeIntensityRef.current = prefersReducedMotion ? 0 : (0.2 + (lines * 0.1) + (cmb * 0.05));
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

            // Screen Shake Decay
            if (shakeIntensityRef.current > 0) {
                const intensity = shakeIntensityRef.current;
                const shakeX = (Math.random() - 0.5) * intensity;
                const shakeY = (Math.random() - 0.5) * intensity;
                const shakeZ = (Math.random() - 0.5) * intensity;

                // Apply shake to camera target
                const isPortrait = window.innerHeight > window.innerWidth;
                const baseTarget = isPortrait ? new BABYLON.Vector3(0, -0.2, 0) : new BABYLON.Vector3(0, -0.5, 0);

                camera.target = baseTarget.add(new BABYLON.Vector3(shakeX, shakeY, shakeZ));

                shakeIntensityRef.current *= 0.9; // Decay
                if (shakeIntensityRef.current < 0.01) {
                    shakeIntensityRef.current = 0;
                    camera.target = baseTarget;
                }
            }

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
                        }

                        // Update material if health changed (for ICE)
                        if (cell.type === CellType.ICE && cell.health === 1 && mesh.material) {
                            const mat = mesh.material as BABYLON.StandardMaterial;
                            if (!mat.wireframe) { // Only update if not already cracked
                                mat.alpha = 0.6;
                                mat.wireframe = true;
                            }
                        }

                        // Smooth landing
                        mesh.position = BABYLON.Vector3.Lerp(mesh.position, targetPos, 0.25);

                        // Bomba bloğu animate - tehlike nabzı
                        if (cell.type === CellType.BOMB && mesh.material) {
                            const bombPulse = 0.25 + Math.abs(Math.sin(time * 4)) * 0.4;
                            (mesh.material as BABYLON.StandardMaterial).emissiveColor =
                                BABYLON.Color3.FromHexString("#f59e0b").scale(bombPulse);
                        }
                        // Buz bloğu animate - soğuk parıltı
                        if (cell.type === CellType.ICE && mesh.material) {
                            const icePulse = 0.15 + Math.abs(Math.sin(time * 2)) * 0.2;
                            const iceColor = cell.health === 1
                                ? BABYLON.Color3.FromHexString("#60a5fa")
                                : BABYLON.Color3.FromHexString("#38bdf8");
                            (mesh.material as BABYLON.StandardMaterial).emissiveColor = iceColor.scale(icePulse + 0.1);
                        }
                        // SHATTER skill: Show pulse on ALL filled cells
                        if (cell.type === CellType.NORMAL) {
                            if (activeSkill === SkillType.SHATTER && cell.filled) {
                                // Pulse opacity between 0.15 and 0.25
                                const pulseAlpha = 0.15 + Math.abs(Math.sin(time * 5)) * 0.10;
                                (mesh.material as BABYLON.StandardMaterial).emissiveColor =
                                    BABYLON.Color3.FromHexString("#ef4444").scale(pulseAlpha);
                            } else {
                                // Reset to normal emissive color when SHATTER is not active
                                const normalColor = BABYLON.Color3.FromHexString(cell.color);
                                (mesh.material as BABYLON.StandardMaterial).emissiveColor = normalColor.scale(0.05);
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

            // 2. Holographic Ghost (The Wireframe Preview) - Pool-based
            // Hide all ghosts first
            ghostMeshesRef.current.forEach(m => { m.isVisible = false; });

            const currentHover = hoverCoordRef.current;
            if (draggedPiece && currentHover) {
                const isValid = canPlacePiece(grid, draggedPiece, currentHover.x, currentHover.y);
                const baseColor = isValid
                    ? BABYLON.Color3.FromHexString(draggedPiece.color)
                    : BABYLON.Color3.FromHexString("#ef4444");

                // Pulse factor for ghost breathing effect
                const ghostY = 0.35 + Math.sin(time * 6) * 0.06;

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
            
            // 3. Guided Experience Highlighting
            guidedHighlightMeshesRef.current.forEach(m => { m.isVisible = false; });
            
            const { guidedTarget, pieces: currentPieces } = stateRef.current;
            if (guidedTarget && !draggedPiece) {
                const targetPiece = currentPieces[guidedTarget.pieceIndex];
                if (targetPiece) {
                    const pulseAlpha = 0.3 + Math.sin(time * 4) * 0.15;
                    const pulseY = 0.4 + Math.sin(time * 3) * 0.08;
                    
                    let highlightIndex = 0;
                    targetPiece.shape.forEach((row, dy) => {
                        row.forEach((val, dx) => {
                            if (val === 1 && highlightIndex < GUIDED_HIGHLIGHT_POOL_SIZE) {
                                const gx = guidedTarget.x + dx;
                                const gy = guidedTarget.y + dy;
                                
                                if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                                    const highlight = guidedHighlightMeshesRef.current[highlightIndex++];
                                    highlight.position = getVectorPos(gx, gy);
                                    highlight.position.y = pulseY;
                                    
                                    const mat = highlight.material as BABYLON.StandardMaterial;
                                    mat.alpha = pulseAlpha;
                                    
                                    // Bright green edges
                                    highlight.enableEdgesRendering();
                                    highlight.edgesWidth = 4.0;
                                    highlight.edgesColor = new BABYLON.Color4(0.06, 0.73, 0.51, 0.9);
                                    
                                    highlight.isVisible = true;
                                }
                            }
                        });
                    });
                }
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
                                
                                // Faster animation: time * 12 instead of time * 8
                                const pulse = 0.8 + Math.abs(Math.sin(time * 12)) * 0.2;
                                mat.emissiveColor = mat.emissiveColor.scale(pulse);
                                
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
            }
            // Note: Piece placement is handled by window handler
        };

        window.addEventListener('pointerup', handleWindowPointerUp);
        window.addEventListener('pointermove', handleGlobalPointerMove);
        canvasRef.current.addEventListener('pointerup', handleCanvasPointerUp);

        // Start render loop - Babylon.js will call scene.render() automatically
        engine.runRenderLoop(() => {
            scene.render();
        });

        // Pause rendering when page is hidden to save resources
        const handleVisibilityChange = () => {
            if (document.hidden) {
                engine.stopRenderLoop();
            } else {
                engine.runRenderLoop(() => {
                    scene.render();
                });
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