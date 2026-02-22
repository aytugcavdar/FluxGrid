import React, { useRef, useEffect, useState } from 'react';
import * as BABYLON from 'babylonjs';
import { useGameStore } from '../store/gameStore';
import { GRID_SIZE, SkillType, CellType } from '../types';
import clsx from 'clsx';

// Constants for 3D layout
const CELL_SIZE = 1.0;
const CELL_SPACING = 0.05; // Tighter spacing like the image
const TOTAL_CELL_SIZE = CELL_SIZE + CELL_SPACING;
const GRID_OFFSET = ((GRID_SIZE - 1) * TOTAL_CELL_SIZE) / 2;

export const Grid: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { grid, draggedPiece, placePiece, canPlacePiece, activeSkill, useShatter, setDraggedPiece, score, combo } = useGameStore();

    const stateRef = useRef({ grid, draggedPiece, activeSkill, score, combo });
    useEffect(() => { stateRef.current = { grid, draggedPiece, activeSkill, score, combo }; }, [grid, draggedPiece, activeSkill, score, combo]);

    const [hoverCoord, setHoverCoord] = useState<{ x: number, y: number } | null>(null);
    const hoverCoordRef = useRef<{ x: number, y: number } | null>(null);
    const globalMouseRef = useRef<{ x: number, y: number } | null>(null);

    const meshMapRef = useRef<Map<string, BABYLON.Mesh>>(new Map());
    const ghostMeshesRef = useRef<BABYLON.Mesh[]>([]);
    const ambientParticlesRef = useRef<BABYLON.Mesh[]>([]);
    const lastScoreRef = useRef(0);
    const glowLayerRef = useRef<BABYLON.GlowLayer | null>(null);

    // Refs for render loop logic
    const lastHandledActionRef = useRef<any>(null);
    const shakeIntensityRef = useRef(0);

    useEffect(() => {
        if (!canvasRef.current) return;

        const isMobile = window.innerWidth < 768;
        const hardwareScale = isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio;
        const engine = new BABYLON.Engine(canvasRef.current, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: !isMobile, // Disable AA on mobile for perf
            adaptToDeviceRatio: false
        });
        engine.setHardwareScalingLevel(1 / hardwareScale);
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

        // Camera - Responsive radius based on screen aspect ratio
        // Math.PI / 8 gives a very clear top-down view for precise placement
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 8, 22, BABYLON.Vector3.Zero(), scene);
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 50;
        camera.lowerBetaLimit = 0.1;
        camera.upperBetaLimit = Math.PI / 2.2;

        const updateCamera = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            if (isPortrait) {
                const isSmallPhone = window.innerWidth < 400;
                const updateIsMobile = window.innerWidth < 768;
                camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
                camera.fov = isSmallPhone ? 0.85 : 0.92;
                camera.radius = isSmallPhone ? 13.5 : updateIsMobile ? 14.0 : 14.5;
                camera.target = new BABYLON.Vector3(0, -0.1, 0);
            } else {
                camera.fovMode = BABYLON.Camera.FOVMODE_VERTICAL_FIXED;
                camera.fov = 0.7;
                camera.radius = 20; // Zoomed out slightly (was 18) for 10x10 grid
                camera.target = new BABYLON.Vector3(0, -0.5, 0);
            }
        };
        updateCamera();

        // Resize handler to adjust camera dynamically
        const handleResize = () => {
            engine.resize();
            updateCamera();
        };
        window.addEventListener('resize', handleResize);

        // Lighting
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7; // Brighter ambient to show colors better without relying on bloom

        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
        dirLight.position = new BABYLON.Vector3(20, 40, 20);
        dirLight.intensity = 0.6;

        // Subtle Glow Layer
        const glowLayer = new BABYLON.GlowLayer("glow", scene, {
            mainTextureSamples: 4,
            blurKernelSize: 48
        });
        glowLayer.intensity = 0.3; // Subtle glow — not cyberpunk
        glowLayerRef.current = glowLayer;

        // --- The Board ---
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
        ground.visibility = 0;

        // Grid Base — dark slate
        const baseSize = (GRID_SIZE * TOTAL_CELL_SIZE) + 1.5;
        const gridBase = BABYLON.MeshBuilder.CreateBox("gridBase", { width: baseSize, height: 0.1, depth: baseSize }, scene);
        gridBase.position.y = -0.6;
        const gridMat = new BABYLON.StandardMaterial("gridMat", scene);
        gridMat.diffuseColor = BABYLON.Color3.FromHexString("#1f2937");
        gridMat.emissiveColor = BABYLON.Color3.FromHexString("#111827");
        gridBase.material = gridMat;
        gridBase.isPickable = false;

        // Grid Slots - The "Blue Grid" lines from the image
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // We use edges rendering on these invisible boxes to create the grid lines
                const slot = BABYLON.MeshBuilder.CreateBox(`slot-${x}-${y}`, { width: 0.95, depth: 0.95, height: 0.05 }, scene);
                slot.position.x = (x * TOTAL_CELL_SIZE) - GRID_OFFSET;
                slot.position.z = -((y * TOTAL_CELL_SIZE) - GRID_OFFSET);
                slot.position.y = -0.5;
                slot.isPickable = false;

                const slotMat = new BABYLON.StandardMaterial(`slotMat-${x}-${y}`, scene);
                slotMat.alpha = 0; // Invisible body
                slot.material = slotMat;

                // Soft grid lines
                slot.enableEdgesRendering();
                slot.edgesWidth = 1.5;
                slot.edgesColor = new BABYLON.Color4(0.3, 0.35, 0.45, 0.2);
            }
        }

        // --- Ambient Particles — subtle floating dust ---
        const particleCount = isMobile ? 15 : 40;
        for (let i = 0; i < particleCount; i++) {
            const p = BABYLON.MeshBuilder.CreateBox("p", { size: Math.random() * 0.1 + 0.02 }, scene);
            p.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 22,
                (Math.random() * 10) - 5,
                (Math.random() - 0.5) * 22
            );
            p.rotation = new BABYLON.Vector3(Math.random(), Math.random(), Math.random());

            const pMat = new BABYLON.StandardMaterial("pMat", scene);
            // Soft muted colors
            const rand = Math.random();
            if (rand > 0.75) pMat.emissiveColor = BABYLON.Color3.FromHexString("#64748b");
            else if (rand > 0.5) pMat.emissiveColor = BABYLON.Color3.FromHexString("#6366f1");
            else if (rand > 0.25) pMat.emissiveColor = BABYLON.Color3.FromHexString("#3b82f6");
            else pMat.emissiveColor = BABYLON.Color3.FromHexString("#8b5cf6");

            pMat.disableLighting = true;
            pMat.alpha = 0.4;
            p.material = pMat;
            p.isPickable = false;

            p.metadata = {
                velY: (Math.random() * 0.015) + 0.003,
                rot: Math.random() * 0.02
            };
            ambientParticlesRef.current.push(p);
        }


        // --- Logic Helpers ---
        const getVectorPos = (gx: number, gy: number) => {
            return new BABYLON.Vector3(
                (gx * TOTAL_CELL_SIZE) - GRID_OFFSET,
                0,
                -((gy * TOTAL_CELL_SIZE) - GRID_OFFSET)
            );
        };

        const createBlockMesh = (colorHex: string, id: string, type: CellType = CellType.NORMAL, health?: number) => {
            // The "Modern Glass" Cube
            const box = BABYLON.MeshBuilder.CreateBox(id, { size: CELL_SIZE * 0.92, height: 0.6 }, scene); // Slightly flatter

            const mat = new BABYLON.StandardMaterial(`${id}-mat`, scene);
            let col = BABYLON.Color3.FromHexString(colorHex);

            // Special Visuals
            if (type === CellType.ICE) {
                col = BABYLON.Color3.FromHexString("#a5f3fc"); // Cyan-ish Ice
                if (health === 1) {
                    // Cracked Ice Visual (Darker or more transparent)
                    mat.alpha = 0.6;
                    mat.wireframe = true; // Simple crack effect
                } else {
                    mat.alpha = 0.8;
                }
                mat.emissiveColor = col.scale(0.6);
            } else if (type === CellType.BOMB) {
                col = BABYLON.Color3.FromHexString("#ef4444"); // Red Bomb
                mat.emissiveColor = new BABYLON.Color3(1, 0, 0); // Glowing Red
                mat.alpha = 1.0;
            } else {
                mat.emissiveColor = col.scale(0.4);
                mat.alpha = 0.9;
            }

            mat.diffuseColor = col;
            mat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
            box.material = mat;

            // Clean Edges
            box.enableEdgesRendering();
            box.edgesWidth = 2.0; // Thinner, sharper edges
            box.edgesColor = new BABYLON.Color4(1, 1, 1, 0.3); // Subtle edge highlight

            box.isPickable = false;
            return box;
        };

        // --- Interaction ---
        const updateHover = () => {
            let pickInfo: BABYLON.PickingInfo | null = null;

            if (globalMouseRef.current && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = globalMouseRef.current.x - rect.left;
                const y = globalMouseRef.current.y - rect.top;

                // Drag offset - Must exactly match the 2D DragOverlay offset
                const isMobile = window.innerWidth < 768;
                const DRAG_Y_OFFSET = (stateRef.current.draggedPiece && isMobile) ? Math.min(-90, -window.innerHeight * 0.11) : 0;

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
                        if (navigator.vibrate) {
                            navigator.vibrate(5); // Very short tap
                        }
                    }

                    // --- Ghost Piece Logic ---
                    // Clear old ghosts
                    ghostMeshesRef.current.forEach(m => m.dispose());
                    ghostMeshesRef.current = [];

                    // Check if valid placement
                    const isValid = canPlacePiece(stateRef.current.grid, draggedPiece, fx, fy);

                    if (isValid) {
                        // Create ghost meshes
                        draggedPiece.shape.forEach((row, rIdx) => {
                            row.forEach((cell, cIdx) => {
                                if (cell) {
                                    const ghost = BABYLON.MeshBuilder.CreateBox("ghost", { size: CELL_SIZE * 0.9, height: 0.1 }, scene);
                                    const gx = fx + cIdx;
                                    const gy = fy + rIdx;

                                    ghost.position = getVectorPos(gx, gy);
                                    ghost.position.y = -0.45; // Slightly above grid base

                                    const gMat = new BABYLON.StandardMaterial("gMat", scene);
                                    gMat.diffuseColor = BABYLON.Color3.FromHexString(draggedPiece.color);
                                    gMat.emissiveColor = BABYLON.Color3.FromHexString(draggedPiece.color).scale(0.5);
                                    gMat.alpha = 0.4; // Semi-transparent
                                    ghost.material = gMat;
                                    ghost.isPickable = false;

                                    ghostMeshesRef.current.push(ghost);
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

                // Cleanup ghosts if mouse leaves grid
                ghostMeshesRef.current.forEach(m => m.dispose());
                ghostMeshesRef.current = [];
            }
        };

        // --- Render Loop ---
        let time = 0;

        scene.registerBeforeRender(() => {
            time += 0.02;
            const { grid, draggedPiece, activeSkill, score, combo, lastAction } = stateRef.current;

            // Check for new shake events
            if (lastAction && lastAction !== lastHandledActionRef.current) {
                if (lastAction.type === 'CLEAR') {
                    // Shake intensity based on lines cleared and combo
                    const lines = lastAction.lines || 1;
                    const cmb = lastAction.combo || 1;
                    shakeIntensityRef.current = 0.2 + (lines * 0.1) + (cmb * 0.05);
                } else if (lastAction.type === 'PLACE') {
                    shakeIntensityRef.current = 0.05; // Tiny thud on placement
                }
                lastHandledActionRef.current = lastAction;
            }

            const meshMap = meshMapRef.current;

            // Dynamic Glow based on Combo
            if (glowLayerRef.current) {
                // Base intensity 0.6, increases by 0.2 per combo level, max 2.0
                // Pulse effect when combo > 1
                const pulse = combo > 1 ? Math.sin(time * 5) * 0.2 : 0;
                const targetIntensity = Math.min(2.0, 0.6 + (combo * 0.2) + pulse);

                // Smooth transition
                glowLayerRef.current.intensity += (targetIntensity - glowLayerRef.current.intensity) * 0.1;
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

            // 0. Animate Particles
            ambientParticlesRef.current.forEach(p => {
                if (p.metadata) {
                    p.position.y += p.metadata.velY;
                    p.rotation.y += p.metadata.rot;
                    p.rotation.x += p.metadata.rot;
                    if (p.position.y > 6) p.position.y = -4;
                }
            });

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

                        // Subtle hover/breathe effect for placed blocks
                        if (activeSkill === SkillType.SHATTER) {
                            const pulsate = 0.8 + Math.abs(Math.sin(time * 5)) * 0.4;
                            (mesh.material as BABYLON.StandardMaterial).emissiveColor =
                                BABYLON.Color3.FromHexString(cell.color).scale(pulsate);
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

            // 2. Holographic Ghost (The Wireframe Preview)
            ghostMeshesRef.current.forEach(m => m.dispose());
            ghostMeshesRef.current = [];

            const currentHover = hoverCoordRef.current;
            if (draggedPiece && currentHover) {
                const isValid = canPlacePiece(grid, draggedPiece, currentHover.x, currentHover.y);
                const baseColor = isValid
                    ? BABYLON.Color3.FromHexString(draggedPiece.color)
                    : BABYLON.Color3.FromHexString("#ef4444");

                // Pulse factor for ghost breathing effect
                const ghostPulse = 0.7 + Math.sin(time * 8) * 0.15;
                const ghostY = 0.35 + Math.sin(time * 6) * 0.06;

                draggedPiece.shape.forEach((row, dy) => {
                    row.forEach((val, dx) => {
                        if (val === 1) {
                            const gx = currentHover.x + dx;
                            const gy = currentHover.y + dy;

                            if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                                // Preview box — taller and more visible
                                const ghostBox = BABYLON.MeshBuilder.CreateBox("ghost", {
                                    size: CELL_SIZE * 0.92,
                                    height: 0.65
                                }, scene);
                                ghostBox.position = getVectorPos(gx, gy);
                                ghostBox.position.y = ghostY;

                                const mat = new BABYLON.StandardMaterial("ghostMat", scene);
                                mat.diffuseColor = baseColor;
                                mat.emissiveColor = baseColor.scale(ghostPulse);
                                mat.alpha = isValid ? 0.75 : 0.35;
                                mat.specularColor = new BABYLON.Color3(1, 1, 1);
                                ghostBox.material = mat;

                                // Bright edge outlines for clarity
                                ghostBox.enableEdgesRendering();
                                ghostBox.edgesWidth = isValid ? 4.0 : 2.5;
                                ghostBox.edgesColor = isValid
                                    ? new BABYLON.Color4(baseColor.r, baseColor.g, baseColor.b, 0.9)
                                    : new BABYLON.Color4(1, 0.3, 0.3, 0.7);

                                ghostBox.isPickable = false;
                                ghostMeshesRef.current.push(ghostBox);
                            }
                        }
                    });
                });
            }
        });

        const handleGlobalPointerMove = (e: PointerEvent) => {
            globalMouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleWindowPointerUp = () => {
            const { draggedPiece } = stateRef.current;
            if (draggedPiece && hoverCoordRef.current) {
                placePiece(draggedPiece, hoverCoordRef.current.x, hoverCoordRef.current.y);
            }
            setDraggedPiece(null);
            hoverCoordRef.current = null;
            setHoverCoord(null);
            globalMouseRef.current = null;
        };

        const handleCanvasPointerUp = () => {
            const { activeSkill } = stateRef.current;
            const hover = hoverCoordRef.current;
            if (activeSkill === SkillType.SHATTER && hover) {
                if (hover.x >= 0 && hover.x < GRID_SIZE && hover.y >= 0 && hover.y < GRID_SIZE) {
                    useShatter(hover.x, hover.y);
                }
            }
        };

        window.addEventListener('pointerup', handleWindowPointerUp);
        window.addEventListener('pointermove', handleGlobalPointerMove);
        canvasRef.current.addEventListener('pointerup', handleCanvasPointerUp);

        engine.runRenderLoop(() => {
            scene.render();
        });

        const resize = () => engine.resize();
        // window.addEventListener('resize', resize); // Handled by custom handler above

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('pointerup', handleWindowPointerUp);
            window.removeEventListener('pointermove', handleGlobalPointerMove);
            if (canvasRef.current) canvasRef.current.removeEventListener('pointerup', handleCanvasPointerUp);
            scene.dispose();
            engine.dispose();
        };
    }, []);

    return (
        <div className={clsx(
            "relative w-full h-full overflow-hidden shadow-2xl transition-all duration-300",
            activeSkill === SkillType.SHATTER ? "ring-2 ring-rose-500 shadow-rose-900/50" :
                activeSkill === SkillType.BOMB ? "ring-2 ring-orange-500 shadow-orange-900/50" :
                    "shadow-cyan-900/30"
        )}>
            <canvas
                ref={canvasRef}
                className="w-full h-full touch-none outline-none block"
            />

            {/* HUD Decoration */}
            <div className="absolute top-4 right-4 flex gap-1">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full" />
                <div className="w-1.5 h-1.5 bg-cyan-500/20 rounded-full" />
            </div>
        </div>
    );
};