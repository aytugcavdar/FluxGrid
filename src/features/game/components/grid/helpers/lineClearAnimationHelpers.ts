/**
 * Line Clear Animation Update Helpers
 * Update logic for line clear animation phases with enhanced sweep effects
 */

import * as BABYLON from 'babylonjs';
import { GridState } from '../../../types';
import { TOTAL_CELL_SIZE } from '../constants';

const LINE_CLEAR_TIMING = {
  constrainedFlash: 88,
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
    if (!anim.constrainedFlashApplied) {
      anim.constrainedFlashApplied = true;
      anim.clearedCells.forEach((key: string) => {
        const [x, y] = key.split(',').map(Number);
        const mesh = getClearedCellMesh(anim, grid, meshMap, key, x, y);
        if (mesh?.material) {
          const mat = mesh.material as BABYLON.StandardMaterial;
          const originalColor = anim.originalColors.get(key) || mat.diffuseColor;
          mat.emissiveColor = originalColor.scale(0.42);
          mat.alpha = 0.82;
        }
      });
    }

    if (elapsed < LINE_CLEAR_TIMING.constrainedFlash) return;

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
      lineClearAnimationRef.current = null;
    }
  }
}
