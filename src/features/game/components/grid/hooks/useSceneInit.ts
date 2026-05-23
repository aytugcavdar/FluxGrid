/**
 * useSceneInit — Babylon.js Engine + Scene + Camera + Lighting + Grid meshes
 * 
 * Returns refs needed by other hooks:
 *   engineRef, sceneRef, glowLayerRef, meshPoolRef,
 *   gridBaseRef, gridSlotsRef, ground, camera, light
 */
import { useRef, useEffect } from 'react';
import * as BABYLON from 'babylonjs';
import { useThemeStore } from '@shared/store/themeStore';
import { GRID_SIZE } from '../../types';
import { detectDeviceCapabilities, getPerformanceConfig } from '../../../../utils/platform/deviceCapability';
import { isAndroid as isAndroidPlatform } from '../../../../utils/platform/platform';
import { MeshPool } from '../grid/helpers/meshPoolHelpers';
import {
  CELL_SIZE,
  TOTAL_CELL_SIZE,
  GRID_OFFSET,
  GHOST_POOL_SIZE,
  SKILL_OVERLAY_POOL_SIZE,
  FRAGMENT_LIFETIME
} from '../grid/constants';
import { updateCameraSettings } from '../grid/helpers';

export interface SceneInitResult {
  engineRef: React.MutableRefObject<BABYLON.Engine | null>;
  sceneRef: React.MutableRefObject<BABYLON.Scene | null>;
  glowLayerRef: React.MutableRefObject<BABYLON.GlowLayer | null>;
  meshPoolRef: React.MutableRefObject<MeshPool | null>;
  /** Mutable object holding ref to grid base mesh (for theme updates) */
  gridBaseRefHolder: { current: BABYLON.Mesh | null };
  gridSlotsHolder: BABYLON.Mesh[];
  isNativeApp: boolean;
  /** Resolved device/perf config — available after init promise resolves */
  deviceConfig: React.MutableRefObject<{
    isLowEndDevice: boolean;
    isLowMidDevice: boolean;
    isEffectLimitedDevice: boolean;
    isMobile: boolean;
    prefersReducedMotion: boolean;
    disableAnimations: boolean;
    tier: string;
    isAndroid: boolean;
  } | null>;
}

/**
 * Initialises the Babylon scene asynchronously on mount and tears it down
 * on unmount. Returns stable refs that the other hooks rely on.
 */
export function useSceneInit(canvasRef: React.RefObject<HTMLCanvasElement>): SceneInitResult {
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const glowLayerRef = useRef<BABYLON.GlowLayer | null>(null);
  const meshPoolRef = useRef<MeshPool | null>(null);
  const deviceConfig = useRef<SceneInitResult['deviceConfig']['current']>(null);

  const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.();

  // These are populated inside initializeScene and remain stable via ref holders
  const gridBaseRefHolder: { current: BABYLON.Mesh | null } = { current: null };
  const gridSlotsHolder: BABYLON.Mesh[] = [];

  useEffect(() => {
    if (!canvasRef.current) return;

    const initializeScene = async () => {
      const deviceCapabilities = await detectDeviceCapabilities();
      const perfConfig = getPerformanceConfig(deviceCapabilities.tier);
      const androidPlatform = isAndroidPlatform();
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const isLowEndDevice = deviceCapabilities.tier === 'low';
      const isLowMidDevice = deviceCapabilities.tier === 'low-mid';
      const isEffectLimitedDevice = isLowEndDevice || isLowMidDevice;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || deviceCapabilities.isNative;
      const disableAnimations = prefersReducedMotion || isEffectLimitedDevice || deviceCapabilities.isNative;

      deviceConfig.current = {
        isLowEndDevice, isLowMidDevice, isEffectLimitedDevice, isMobile,
        prefersReducedMotion, disableAnimations,
        tier: deviceCapabilities.tier,
        isAndroid: deviceCapabilities.isAndroid || false,
      };

      // Engine
      let engine: BABYLON.Engine;
      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        engine = new BABYLON.Engine(canvasRef.current!, true, {
          preserveDrawingBuffer: true, stencil: true,
          antialias: perfConfig.antialias, adaptToDeviceRatio: true,
          limitDeviceRatio: dpr, doNotHandleContextLost: false,
          powerPreference: 'high-performance',
        });
        if (!engine.webGLVersion) throw new Error('WebGL not supported');
      } catch (error) {
        console.error('[Grid] WebGL initialization failed:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1f2937;color:#e5e7eb;padding:24px;border-radius:12px;text-align:center;max-width:300px;z-index:9999;';
        errorDiv.innerHTML = '<h3 style="margin:0 0 12px 0;font-size:18px;">Grafik Desteği Gerekli</h3><p style="margin:0;font-size:14px;opacity:0.8;">Cihazınız WebGL desteklemiyor. Oyun çalıştırılamıyor.</p>';
        document.body.appendChild(errorDiv);
        return;
      }

      engineRef.current = engine;
      engine.setHardwareScalingLevel(perfConfig.hardwareScaling);

      // Scene
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
      sceneRef.current = scene;

      // Mesh pool
      const poolSize = isLowEndDevice ? 30 : (isLowMidDevice ? 40 : (deviceCapabilities.tier === 'high' ? 70 : 50));
      meshPoolRef.current = new MeshPool(poolSize);

      // Scene optimisations (low-end)
      if (isEffectLimitedDevice) {
        scene.skipPointerMovePicking = true;
        scene.autoClear = true;
        scene.autoClearDepthAndStencil = true;
        scene.blockMaterialDirtyMechanism = true;
        scene.renderTargetsEnabled = false;
        scene.particlesEnabled = false;
        scene.spritesEnabled = false;
        scene.postProcessesEnabled = false;
        scene.lensFlaresEnabled = false;
        scene.proceduralTexturesEnabled = false;
        scene.shadowsEnabled = false;
        scene.imageProcessingConfiguration.vignetteEnabled = false;
        scene.imageProcessingConfiguration.grainEnabled = false;
        scene.imageProcessingConfiguration.chromaticAberrationEnabled = false;
      }

      // Camera
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const isPortrait = screenH > screenW;
      const aspectRatio = screenW / screenH;
      let initialRadius = 16;
      if (isPortrait) {
        if (aspectRatio < 0.48) initialRadius = 12.0;
        else if (aspectRatio < 0.55) initialRadius = 12.0;
        else if (aspectRatio < 0.65) initialRadius = 12.5;
        else initialRadius = 13.0;
        if (isNativeApp) initialRadius += 2.0;
      }

      const camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 11, initialRadius, BABYLON.Vector3.Zero(), scene);
      camera.lowerRadiusLimit = 8;
      camera.upperRadiusLimit = 35;
      camera.lowerBetaLimit = 0.1;
      camera.upperBetaLimit = Math.PI / 2.5;
      if (isLowEndDevice) camera.maxZ = 50;
      updateCameraSettings(camera, isNativeApp);

      const handleResize = () => { engine.resize(); updateCameraSettings(camera, isNativeApp); };
      window.addEventListener('resize', handleResize);

      // Lighting
      const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
      light.intensity = isMobile ? 0.5 : 0.7;
      light.groundColor = new BABYLON.Color3(0.06, 0.06, 0.1);
      const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-0.5, -1, -0.5), scene);
      dirLight.position = new BABYLON.Vector3(20, 40, 20);
      dirLight.intensity = isLowEndDevice
        ? (isMobile ? 0.3 : 0.42)
        : (isMobile ? 0.38 : 0.55);

      // Glow layer (mid/high, non-native only)
      if (!isLowEndDevice && !isNativeApp && perfConfig.enableGlow) {
        const glowLayer = new BABYLON.GlowLayer('glow', scene, { mainTextureSamples: 2, blurKernelSize: 16 });
        glowLayer.intensity = 0.3;
        glowLayerRef.current = glowLayer;
      } else {
        glowLayerRef.current = null;
      }

      // Grid ground (invisible pick plane)
      const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
      ground.visibility = 0;

      // Grid base + slots
      const themeColors = useThemeStore.getState().getThemeColors();
      const baseSize = (GRID_SIZE * TOTAL_CELL_SIZE) + 1.5;
      const gridBase = BABYLON.MeshBuilder.CreateBox('gridBase', { width: baseSize, height: 0.1, depth: baseSize }, scene);
      gridBase.position.y = -0.6;
      const gridMat = new BABYLON.StandardMaterial('gridMat', scene);
      gridMat.diffuseColor = BABYLON.Color3.FromHexString(themeColors.gridBase);
      gridMat.emissiveColor = BABYLON.Color3.FromHexString(themeColors.gridBase).scale(0.6);
      gridMat.specularColor = BABYLON.Color3.Black();
      gridMat.specularPower = 0;
      gridBase.material = gridMat;
      gridBase.isPickable = false;
      gridBaseRefHolder.current = gridBase;

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
          slotMat.alpha = 0.92;
          slotMat.specularColor = BABYLON.Color3.Black();
          slot.material = slotMat;
          slot.enableEdgesRendering();
          slot.edgesWidth = isMobile ? 2.0 : 2.5;
          const edgeColor = BABYLON.Color3.FromHexString(themeColors.gridEdge);
          slot.edgesColor = new BABYLON.Color4(edgeColor.r, edgeColor.g, edgeColor.b, 0.8);
          gridSlotsHolder.push(slot);
        }
      }

      // Theme subscription
      const unsubscribeTheme = useThemeStore.subscribe((state) => {
        const colors = state.getThemeColors();
        if (gridBaseRefHolder.current?.material) {
          const mat = gridBaseRefHolder.current.material as BABYLON.StandardMaterial;
          mat.diffuseColor = BABYLON.Color3.FromHexString(colors.gridBase);
          mat.emissiveColor = BABYLON.Color3.FromHexString(colors.gridBase).scale(0.6);
        }
        gridSlotsHolder.forEach((slot) => {
          if (slot.material) {
            const mat = slot.material as BABYLON.StandardMaterial;
            mat.diffuseColor = BABYLON.Color3.FromHexString(colors.gridSlot);
            mat.emissiveColor = BABYLON.Color3.FromHexString(colors.gridSlot).scale(0.8);
            const edgeColor = BABYLON.Color3.FromHexString(colors.gridEdge);
            slot.edgesColor = new BABYLON.Color4(edgeColor.r, edgeColor.g, edgeColor.b, 0.8);
          }
        });
      });

      // Expose scene-internal refs/values through engine for other hooks
      (engine as any)._fluxScene = scene;
      (engine as any)._fluxCamera = camera;
      (engine as any)._fluxLight = light;
      (engine as any)._fluxGround = ground;
      (engine as any)._fluxGridBase = gridBaseRefHolder;
      (engine as any)._fluxGridSlots = gridSlotsHolder;
      (engine as any)._fluxUnsubTheme = unsubscribeTheme;
      (engine as any)._fluxHandleResize = handleResize;
    };

    initializeScene();

    // Synchronous cleanup — uses refs set during async init
    return () => {
      console.log('[useSceneInit] Cleanup — disposing engine via ref');
      if (sceneRef.current) { sceneRef.current.dispose(); sceneRef.current = null; }
      if (engineRef.current) {
        const engine = engineRef.current;
        const unsubTheme = (engine as any)._fluxUnsubTheme;
        const handleResize = (engine as any)._fluxHandleResize;
        if (unsubTheme) unsubTheme();
        if (handleResize) window.removeEventListener('resize', handleResize);
        engine.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  return { engineRef, sceneRef, glowLayerRef, meshPoolRef, gridBaseRefHolder, gridSlotsHolder, isNativeApp, deviceConfig };
}
