/**
 * Scene Setup Helpers
 * Functions for initializing Babylon.js scene, camera, lighting, and grid visuals
 */

import * as BABYLON from 'babylonjs';
import { GRID_SIZE, SLOT_SIZE, TOTAL_CELL_SIZE } from '../constants';

export interface SceneSetupResult {
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;
  camera: BABYLON.ArcRotateCamera;
  ground: BABYLON.Mesh;
  gridBase: BABYLON.Mesh;
  gridSlots: BABYLON.Mesh[];
  glowLayer: BABYLON.GlowLayer | null;
  light: BABYLON.HemisphericLight;
}

export interface ThemeColors {
  gridBase: string;
  gridSlot: string;
  gridEdge: string;
}

/**
 * Initialize Babylon.js engine with device-specific optimizations
 */
export const initializeEngine = (
  canvas: HTMLCanvasElement,
  isAndroid: boolean,
  isNativeApp: boolean,
  isLowEndDevice: boolean,
  isMobile: boolean
): BABYLON.Engine => {
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: !isMobile && !isLowEndDevice,
    adaptToDeviceRatio: true,
    limitDeviceRatio: Math.min(window.devicePixelRatio || 1, 2),
    doNotHandleContextLost: false,
  });

  if (!engine.webGLVersion) {
    throw new Error('WebGL not supported');
  }

  // Hardware scaling
  engine.setHardwareScalingLevel(1.0);

  return engine;
};

/**
 * Initialize scene with optimizations
 */
export const initializeScene = (
  engine: BABYLON.Engine,
  isLowEndDevice: boolean
): BABYLON.Scene => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  if (isLowEndDevice) {
    scene.skipPointerMovePicking = true;
    scene.autoClear = true;
    scene.autoClearDepthAndStencil = true;
  }

  return scene;
};

/**
 * Create and configure camera
 */
export const createCamera = (
  scene: BABYLON.Scene,
  isLowEndDevice: boolean
): BABYLON.ArcRotateCamera => {
  const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 11, 18, BABYLON.Vector3.Zero(), scene);
  camera.lowerRadiusLimit = 8;
  camera.upperRadiusLimit = 35;
  camera.lowerBetaLimit = 0.1;
  camera.upperBetaLimit = Math.PI / 2.5;

  if (isLowEndDevice) {
    camera.maxZ = 50;
  }

  return camera;
};

/**
 * Create lighting setup
 */
export const createLighting = (
  scene: BABYLON.Scene,
  isMobile: boolean,
  isLowEndDevice: boolean
): BABYLON.HemisphericLight => {
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = isMobile ? 0.45 : 0.7;
  light.groundColor = new BABYLON.Color3(0.05, 0.05, 0.08);

  const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
  dirLight.position = new BABYLON.Vector3(20, 40, 20);
  dirLight.intensity = isLowEndDevice
    ? (isMobile ? 0.3 : 0.42)
    : (isMobile ? 0.35 : 0.6);

  return light;
};

/**
 * Create glow layer (disabled on low-end devices)
 */
export const createGlowLayer = (
  scene: BABYLON.Scene,
  isLowEndDevice: boolean,
  isNativeApp: boolean
): BABYLON.GlowLayer | null => {
  if (isLowEndDevice || isNativeApp) {
    return null;
  }

  const glowLayer = new BABYLON.GlowLayer("glow", scene, {
    mainTextureSamples: 2,
    blurKernelSize: 16
  });
  glowLayer.intensity = 0;

  return glowLayer;
};

/**
 * Create ground plane
 */
export const createGround = (scene: BABYLON.Scene): BABYLON.Mesh => {
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
  ground.visibility = 0;
  return ground;
};

/**
 * Create grid base
 */
export const createGridBase = (
  scene: BABYLON.Scene,
  themeColors: ThemeColors
): BABYLON.Mesh => {
  const GRID_OFFSET = (GRID_SIZE - 1) * TOTAL_CELL_SIZE / 2;
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

  return gridBase;
};

/**
 * Create grid slots
 */
export const createGridSlots = (
  scene: BABYLON.Scene,
  themeColors: ThemeColors,
  isMobile: boolean
): BABYLON.Mesh[] => {
  const GRID_OFFSET = (GRID_SIZE - 1) * TOTAL_CELL_SIZE / 2;
  const gridSlots: BABYLON.Mesh[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const slot = BABYLON.MeshBuilder.CreateBox(`slot-${x}-${y}`, { width: SLOT_SIZE, depth: SLOT_SIZE, height: 0.05 }, scene);
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

      slot.enableEdgesRendering();
      slot.edgesWidth = isMobile ? 2.0 : 2.5;
      const edgeColor = BABYLON.Color3.FromHexString(themeColors.gridEdge);
      slot.edgesColor = new BABYLON.Color4(edgeColor.r, edgeColor.g, edgeColor.b, 0.5);

      gridSlots.push(slot);
    }
  }

  return gridSlots;
};

/**
 * Update theme colors for grid base
 */
export const updateGridBaseTheme = (
  gridBase: BABYLON.Mesh,
  colors: ThemeColors
): void => {
  if (gridBase.material) {
    const mat = gridBase.material as BABYLON.StandardMaterial;
    mat.diffuseColor = BABYLON.Color3.FromHexString(colors.gridBase);
    mat.emissiveColor = BABYLON.Color3.FromHexString(colors.gridBase).scale(0.6);
  }
};

/**
 * Update theme colors for grid slots
 */
export const updateGridSlotsTheme = (
  gridSlots: BABYLON.Mesh[],
  colors: ThemeColors
): void => {
  gridSlots.forEach((slot) => {
    if (slot.material) {
      const mat = slot.material as BABYLON.StandardMaterial;
      mat.diffuseColor = BABYLON.Color3.FromHexString(colors.gridSlot);
      mat.emissiveColor = BABYLON.Color3.FromHexString(colors.gridSlot).scale(0.8);

      const edgeColor = BABYLON.Color3.FromHexString(colors.gridEdge);
      slot.edgesColor = new BABYLON.Color4(edgeColor.r, edgeColor.g, edgeColor.b, 0.5);
    }
  });
};

/**
 * Update theme colors for block meshes (only NORMAL type blocks)
 */
export const updateBlockMeshesTheme = (
  meshMap: Map<string, BABYLON.Mesh>
): void => {
  meshMap.forEach((mesh) => {
    if (mesh.material) {
      const mat = mesh.material as BABYLON.StandardMaterial;
      const currentDiffuse = mat.diffuseColor;
      
      // Only update NORMAL blocks - ICE and BOMB have fixed colors
      const isIce = currentDiffuse.r > 0.6 && currentDiffuse.g > 0.8 && currentDiffuse.b > 0.9;
      const isBomb = currentDiffuse.r > 0.1 && currentDiffuse.g < 0.15 && currentDiffuse.b < 0.15;

      if (!isIce && !isBomb) {
        mat.emissiveColor = currentDiffuse.scale(0.05);
      }
    }
  });
};
