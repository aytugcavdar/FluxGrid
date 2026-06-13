/**
 * Line Clear Animation Update Helpers
 * Update logic for line clear animation phases with enhanced sweep effects
 */

import * as BABYLON from 'babylonjs';
import { GridState } from '../../../types';
import { TOTAL_CELL_SIZE } from '../constants';

const LINE_CLEAR_TIMING = {
  constrainedFlash: 140,
  constrainedFade: 120,
  constrainedCollapse: 96,
  brightness: 132,
  fade: 112,
  collapse: 92,
} as const;

function getClearedCellMesh(
  anim: any,
  grid: GridState,
  meshMap: Map<string, BABYLON.Mesh>,
  key: string,
  x: number,
  y: number
): BABYLON.Mesh | undefined {
  const meshId = anim.clearedCellIds?.get(key) || grid[y]?.[x]?.id;
  return meshId ? meshMap.get(meshId) : undefined;
}

function getOrderedCells(anim: any): Array<{ key: string; x: number; y: number; order: number }> {
  return Array.from(anim.clearedCells as Set<string>).map((key: string) => {
    const [x, y] = key.split(',').map(Number);
    return {
      key,
      x,
      y,
      order: anim.clearOrder?.get(key) ?? x,
    };
  }).sort((a, b) => a.order - b.order || a.y - b.y || a.x - b.x);
}

function getDirectionalWave(progress: number, order: number, span: number): number {
  const waveWidth = 2.2;
  const waveHead = progress * (span + waveWidth);
  return Math.max(0, Math.min(1, (waveHead - order) / waveWidth));
}

function disposeIntersectionPulses(anim: any): void {
  anim.intersectionPulseMeshes?.forEach((mesh: BABYLON.Mesh) => mesh.dispose());
  anim.intersectionPulseMeshes = [];
}

function disposeConstrainedSparks(anim: any): void {
  anim.constrainedSparkMeshes?.forEach((mesh: BABYLON.Mesh) => {
    mesh.material?.dispose();
    mesh.dispose();
  });
  anim.constrainedSparkMeshes = [];
}

function ensureConstrainedSparks(
  anim: any,
  grid: GridState,
  meshMap: Map<string, BABYLON.Mesh>,
  orderedCells: Array<{ key: string; x: number; y: number; order: number }>
): void {
  if (anim.constrainedSparkCreated || orderedCells.length === 0) return;

  anim.constrainedSparkCreated = true;
  anim.constrainedSparkMeshes = [];

  const intersectionKeys = new Set<string>(anim.intersectionCells ? Array.from(anim.intersectionCells) : []);
  const prioritizedCells = [
    ...orderedCells.filter((cell) => intersectionKeys.has(cell.key)),
    ...orderedCells.filter((cell) => !intersectionKeys.has(cell.key)),
  ];
  const maxSparkCount = Math.min(4, Math.max(2, Math.ceil(orderedCells.length / 6)));
  const step = Math.max(1, Math.floor(prioritizedCells.length / maxSparkCount));
  const sampledCells = prioritizedCells.filter((_, index) => index % step === 0).slice(0, maxSparkCount);

  sampledCells.forEach((cellData, index) => {
    const targetMesh = getClearedCellMesh(anim, grid, meshMap, cellData.key, cellData.x, cellData.y);
    if (!targetMesh) return;

    const scene = targetMesh.getScene();
    const spark = BABYLON.MeshBuilder.CreatePlane(`line-clear-lite-spark-${cellData.key}-${index}`, {
      width: 0.18,
      height: 0.18,
    }, scene);
    spark.position = targetMesh.position.clone();
    spark.position.y += 0.54;
    spark.rotation.x = Math.PI / 2;
    spark.rotation.z = Math.PI / 4;
    spark.isPickable = false;

    const originalColor = anim.originalColors.get(cellData.key) || BABYLON.Color3.FromHexString('#7dd3fc');
    const material = new BABYLON.StandardMaterial(`line-clear-lite-spark-mat-${cellData.key}-${index}`, scene);
    material.diffuseColor = originalColor.scale(0.18);
    material.emissiveColor = originalColor.scale(0.72);
    material.alpha = 0.56;
    material.disableLighting = true;
    material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    spark.material = material;

    anim.constrainedSparkMeshes.push(spark);
  });
}

function updateConstrainedSparks(anim: any, progress: number): void {
  anim.constrainedSparkMeshes?.forEach((mesh: BABYLON.Mesh, index: number) => {
    const mat = mesh.material as BABYLON.StandardMaterial | null;
    const delayedProgress = Math.max(0, Math.min(1, progress * 1.18 - index * 0.045));
    const scale = 0.74 + delayedProgress * 0.9;
    mesh.scaling.set(scale, scale, scale);
    if (mat) {
      mat.alpha = Math.max(0, 0.56 * (1 - delayedProgress));
    }
  });
}

function ensureIntersectionPulses(
  anim: any,
  grid: GridState,
  meshMap: Map<string, BABYLON.Mesh>
): void {
  if (anim.intersectionPulseCreated || !anim.intersectionCells?.size) return;

  anim.intersectionPulseCreated = true;
  anim.intersectionPulseMeshes = [];

  anim.intersectionCells.forEach((key: string) => {
    const [x, y] = key.split(',').map(Number);
    const targetMesh = getClearedCellMesh(anim, grid, meshMap, key, x, y);
    if (!targetMesh) return;

    const scene = targetMesh.getScene();
    const ring = BABYLON.MeshBuilder.CreateTorus(`line-clear-intersection-${key}`, {
      diameter: 0.82,
      thickness: 0.035,
      tessellation: 24,
    }, scene);
    ring.position = targetMesh.position.clone();
    ring.position.y += 0.46;
    ring.rotation.x = Math.PI / 2;
    ring.isPickable = false;

    const originalColor = anim.originalColors.get(key) || BABYLON.Color3.FromHexString('#34d399');
    const material = new BABYLON.StandardMaterial(`line-clear-intersection-mat-${key}`, scene);
    material.diffuseColor = originalColor.scale(0.2);
    material.emissiveColor = originalColor.scale(0.95);
    material.alpha = 0.58;
    material.disableLighting = true;
    material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    ring.material = material;

    anim.intersectionPulseMeshes.push(ring);
  });
}

function updateIntersectionPulses(anim: any, progress: number): void {
  anim.intersectionPulseMeshes?.forEach((mesh: BABYLON.Mesh) => {
    const mat = mesh.material as BABYLON.StandardMaterial | null;
    const scale = 0.72 + progress * 0.62;
    mesh.scaling.set(scale, scale, scale);
    if (mat) {
      mat.alpha = Math.max(0, 0.58 * (1 - progress));
    }
  });
}

/**
 * Update line clear animation (all phases) - OPTIMIZED FOR SPEED
 */
export function updateLineClearAnimation(
  lineClearAnimationRef: { current: any },
  grid: GridState,
  meshMap: Map<string, BABYLON.Mesh>,
  isConstrainedDevice: boolean,
  _useVisualEffectStore: any
): void {
  if (!lineClearAnimationRef.current?.active) return;
  
  const anim = lineClearAnimationRef.current;
  const elapsed = Date.now() - anim.startTime;

  if (isConstrainedDevice) {
    const flashEnd = LINE_CLEAR_TIMING.constrainedFlash;
    const fadeEnd = flashEnd + LINE_CLEAR_TIMING.constrainedFade;
    const collapseEnd = fadeEnd + LINE_CLEAR_TIMING.constrainedCollapse;
    const cellsArray = getOrderedCells(anim);
    const span = anim.clearOrderSpan || 10;

    if (elapsed < flashEnd) {
      anim.progress = elapsed / flashEnd;
      if (anim.lineCount >= 2) {
        ensureConstrainedSparks(anim, grid, meshMap, cellsArray);
        updateConstrainedSparks(anim, anim.progress);
      }

      cellsArray.forEach((cellData) => {
        const mesh = getClearedCellMesh(anim, grid, meshMap, cellData.key, cellData.x, cellData.y);
        if (mesh?.material) {
          const mat = mesh.material as BABYLON.StandardMaterial;
          const originalColor = anim.originalColors.get(cellData.key) || mat.diffuseColor;
          const clampedProgress = getDirectionalWave(anim.progress, cellData.order, span);
          const brightness = Math.sin(clampedProgress * Math.PI);
          const isIntersection = anim.intersectionCells?.has(cellData.key);
          const glowStrength = isIntersection ? 0.64 : 0.48;

          mat.emissiveColor = originalColor.scale(0.18 + brightness * glowStrength);
          (mat as any).emissiveIntensity = 0.9 + brightness * 0.1;
          mat.alpha = 1;
        }
      });
      return;
    }

    if (elapsed < fadeEnd) {
      anim.progress = (elapsed - flashEnd) / LINE_CLEAR_TIMING.constrainedFade;
      if (anim.lineCount >= 2) {
        updateConstrainedSparks(anim, Math.min(1, 0.72 + anim.progress * 0.28));
      }

      cellsArray.forEach((cellData) => {
        const mesh = getClearedCellMesh(anim, grid, meshMap, cellData.key, cellData.x, cellData.y);
        if (mesh?.material) {
          const mat = mesh.material as BABYLON.StandardMaterial;
          const originalColor = anim.originalColors.get(cellData.key) || mat.diffuseColor;
          mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
          mat.emissiveColor = BABYLON.Color3.Lerp(originalColor.scale(0.42), BABYLON.Color3.Black(), anim.progress);
          mat.alpha = 1 - anim.progress * 0.86;
        }
      });
      return;
    }

    if (elapsed < collapseEnd) {
      anim.progress = (elapsed - fadeEnd) / LINE_CLEAR_TIMING.constrainedCollapse;
      const easedProgress = anim.progress * (2 - anim.progress);

      anim.affectedBlocks.forEach((data: any, key: string) => {
        const [x, y] = key.split(',').map(Number);
        const cell = grid[y]?.[x];
        const mesh = cell?.id ? meshMap.get(cell.id) : undefined;
        if (mesh && data.startPosition && data.targetPosition) {
          mesh.position = BABYLON.Vector3.Lerp(data.startPosition, data.targetPosition, easedProgress);
        }
      });
      return;
    }

    anim.clearedCells.forEach((key: string) => {
      const [x, y] = key.split(',').map(Number);
      const meshId = anim.clearedCellIds?.get(key) || grid[y]?.[x]?.id;
      const mesh = meshId ? meshMap.get(meshId) : undefined;
      if (mesh) {
        mesh.dispose();
        if (meshId) meshMap.delete(meshId);
      }
    });

    disposeIntersectionPulses(anim);
    disposeConstrainedSparks(anim);
    lineClearAnimationRef.current = null;
    return;
  }
  
  if (anim.phase === 'brightness') {
    // Stage 1: short confirmation flash before blocks disappear.
    if (elapsed < LINE_CLEAR_TIMING.brightness) {
      anim.progress = elapsed / LINE_CLEAR_TIMING.brightness;

      ensureIntersectionPulses(anim, grid, meshMap);
      updateIntersectionPulses(anim, anim.progress);

      const cellsArray = getOrderedCells(anim);
      const span = anim.clearOrderSpan || 10;

      if (anim.lineCount >= 2) {
        ensureConstrainedSparks(anim, grid, meshMap, cellsArray);
        updateConstrainedSparks(anim, anim.progress);
      }

      cellsArray.forEach((cellData) => {
        const mesh = getClearedCellMesh(anim, grid, meshMap, cellData.key, cellData.x, cellData.y);
        if (mesh?.material) {
          const mat = mesh.material as BABYLON.StandardMaterial;
          const originalColor = anim.originalColors.get(cellData.key) || mat.diffuseColor;

          const clampedProgress = getDirectionalWave(anim.progress, cellData.order, span);
          const brightness = Math.sin(clampedProgress * Math.PI);
          const isIntersection = anim.intersectionCells?.has(cellData.key);
          const glowStrength = isIntersection ? 0.88 : 0.64;
          mat.emissiveColor = originalColor.scale(0.16 + brightness * glowStrength);
          (mat as any).emissiveIntensity = 0.9 + brightness * (isIntersection ? 0.34 : 0.22);
          mat.alpha = 1.0;
        }
      });
    } else {
      // Transition to quick fade phase.
      anim.phase = 'particles';
      anim.startTime = Date.now();
      anim.progress = 0;
    }
  } else if (anim.phase === 'particles') {
    // Stage 2: clean fade-out, no particle burst.
    if (elapsed < LINE_CLEAR_TIMING.fade) {
      anim.progress = elapsed / LINE_CLEAR_TIMING.fade;

      updateIntersectionPulses(anim, Math.min(1, 0.78 + anim.progress * 0.22));
      if (anim.lineCount >= 2) {
        updateConstrainedSparks(anim, Math.min(1, 0.72 + anim.progress * 0.28));
      }

      const cellsArray = getOrderedCells(anim);
      const span = anim.clearOrderSpan || 10;

      cellsArray.forEach((cellData) => {
        const mesh = getClearedCellMesh(anim, grid, meshMap, cellData.key, cellData.x, cellData.y);
        if (mesh?.material) {
          const mat = mesh.material as BABYLON.StandardMaterial;

          const clampedFade = getDirectionalWave(anim.progress, cellData.order, span);

          const originalColor = anim.originalColors.get(cellData.key) || mat.diffuseColor;
          mat.emissiveColor = BABYLON.Color3.Lerp(originalColor, BABYLON.Color3.Black(), clampedFade);
          mat.alpha = 1.0 - clampedFade * 0.88;
        }
      });
    } else {
      // Transition to collapse phase
      anim.phase = 'collapse';
      anim.startTime = Date.now();
      anim.progress = 0;
    }
  } else if (anim.phase === 'collapse') {
    // Stage 3: quick settle for affected blocks.
    if (elapsed < LINE_CLEAR_TIMING.collapse) {
      anim.progress = elapsed / LINE_CLEAR_TIMING.collapse;
      const easedProgress = anim.progress * (2 - anim.progress); // ease-out-quad
      
      // Animate falling blocks
      anim.affectedBlocks.forEach((data: any, key: string) => {
        const [x, y] = key.split(',').map(Number);
        const cell = grid[y]?.[x];
        const mesh = cell?.id ? meshMap.get(cell.id) : undefined;
        if (mesh && data.startPosition && data.targetPosition) {
          const nextPosition = BABYLON.Vector3.Lerp(data.startPosition, data.targetPosition, easedProgress);
          const fallDistance = Math.abs(data.targetPosition.z - data.startPosition.z) / TOTAL_CELL_SIZE;
          nextPosition.y += Math.sin(easedProgress * Math.PI) * Math.min(0.14, 0.035 * fallDistance);
          mesh.position = nextPosition;
        }
      });
    } else {
      // Animation complete - remove cleared blocks
      anim.clearedCells.forEach((key: string) => {
        const [x, y] = key.split(',').map(Number);
        const meshId = anim.clearedCellIds?.get(key) || grid[y]?.[x]?.id;
        const mesh = meshId ? meshMap.get(meshId) : undefined;
        if (mesh) {
          mesh.dispose();
          if (meshId) meshMap.delete(meshId);
        }
      });

      disposeIntersectionPulses(anim);
      disposeConstrainedSparks(anim);
      lineClearAnimationRef.current = null;
    }
  }
}
