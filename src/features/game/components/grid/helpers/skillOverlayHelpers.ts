/**
 * Skill Overlay Helpers
 * Functions for rendering skill overlay visualizations (SHATTER, BOMB)
 */

import * as BABYLON from 'babylonjs';
import { GRID_SIZE, CELL_SIZE } from '../constants';
import { GridState } from '../../../types';

const GRID_OFFSET = (GRID_SIZE - 1) * 1.1 / 2;
const TOTAL_CELL_SIZE = 1.1;

/**
 * Get 3D position from grid coordinates
 */
const getVectorPos = (gx: number, gy: number): BABYLON.Vector3 => {
  return new BABYLON.Vector3(
    (gx * TOTAL_CELL_SIZE) - GRID_OFFSET,
    0,
    -((gy * TOTAL_CELL_SIZE) - GRID_OFFSET)
  );
};

/**
 * Render SHATTER skill overlay (single cell highlight)
 */
export const renderShatterOverlay = (
  scene: BABYLON.Scene,
  skillOverlayMeshes: BABYLON.Mesh[],
  hoverCoord: { x: number; y: number },
  grid: GridState
): void => {
  if (hoverCoord.x >= 0 && hoverCoord.x < GRID_SIZE &&
    hoverCoord.y >= 0 && hoverCoord.y < GRID_SIZE &&
    grid[hoverCoord.y][hoverCoord.x].filled) {

    let overlay = skillOverlayMeshes[0];
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

      skillOverlayMeshes[0] = overlay;
    }

    overlay.position = getVectorPos(hoverCoord.x, hoverCoord.y);
    overlay.position.y = 0.1;
    (overlay.material as BABYLON.StandardMaterial).alpha = 0.6;

    overlay.enableEdgesRendering();
    overlay.edgesWidth = 6;
    overlay.edgesColor = new BABYLON.Color4(0.93, 0.27, 0.27, 1.0);

    overlay.isVisible = true;
  }
};

/**
 * Render BOMB skill overlay (3x3 area highlight)
 */
export const renderBombOverlay = (
  scene: BABYLON.Scene,
  skillOverlayMeshes: BABYLON.Mesh[],
  hoverCoord: { x: number; y: number },
  time: number,
  shouldUpdateAnimations: boolean
): void => {
  let overlayIndex = 0;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = hoverCoord.x + dx;
      const y = hoverCoord.y + dy;

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        let overlay = skillOverlayMeshes[overlayIndex];
        if (!overlay) {
          overlay = BABYLON.MeshBuilder.CreateBox(`bomb-overlay-${overlayIndex}`, {
            size: CELL_SIZE * 0.95,
            height: 0.7
          }, scene);
          overlay.position.y = 0.1;

          const mat = new BABYLON.StandardMaterial(`bombMat-${overlayIndex}`, scene);
          overlay.material = mat;
          overlay.isPickable = false;

          skillOverlayMeshes[overlayIndex] = overlay;
        }

        overlay.position = getVectorPos(x, y);
        overlay.position.y = 0.1;

        const mat = overlay.material as BABYLON.StandardMaterial;
        const isCenter = (dx === 0 && dy === 0);

        mat.alpha = isCenter ? 0.7 : 0.3;
        mat.emissiveColor = isCenter
          ? BABYLON.Color3.FromHexString("#f97316")
          : BABYLON.Color3.FromHexString("#fb923c");

        if (shouldUpdateAnimations) {
          const pulse = 0.8 + Math.abs(Math.sin(time * 6)) * 0.15;
          mat.emissiveColor = mat.emissiveColor.scale(pulse);
        }

        overlay.isVisible = true;
        overlayIndex++;
      }
    }
  }
};

/**
 * Hide all skill overlay meshes
 */
export const hideAllSkillOverlays = (skillOverlayMeshes: BABYLON.Mesh[]): void => {
  skillOverlayMeshes.forEach(m => m.isVisible = false);
};

/**
 * Render skill overlays based on active skill
 */
export const renderSkillOverlays = (
  scene: BABYLON.Scene,
  skillOverlayMeshes: BABYLON.Mesh[],
  activeSkill: any,
  hoverCoord: { x: number; y: number } | null,
  grid: GridState,
  time: number,
  shouldUpdateAnimations: boolean
): void => {
  hideAllSkillOverlays(skillOverlayMeshes);

  if (!activeSkill || !hoverCoord) return;

  if (activeSkill === 'SHATTER') {
    renderShatterOverlay(scene, skillOverlayMeshes, hoverCoord, grid);
  } else if (activeSkill === 'BOMB') {
    renderBombOverlay(scene, skillOverlayMeshes, hoverCoord, time, shouldUpdateAnimations);
  }
};
