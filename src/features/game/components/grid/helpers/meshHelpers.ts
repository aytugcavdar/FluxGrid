/**
 * Mesh Helpers
 * Mesh creation and pool initialization utilities
 */

import * as BABYLON from 'babylonjs';
import { CellType } from '../../../types';
import { 
  CELL_SIZE, 
  GHOST_POOL_SIZE, 
  SKILL_OVERLAY_POOL_SIZE, 
  GUIDED_HIGHLIGHT_POOL_SIZE,
  FRAGMENT_POOL_SIZE 
} from '../constants';

/**
 * Create a block mesh based on cell type
 */
export function createBlockMesh(
  colorHex: string,
  id: string,
  scene: BABYLON.Scene,
  type: CellType = CellType.NORMAL,
  health?: number
): BABYLON.Mesh {
  const mat = new BABYLON.StandardMaterial(`${id}-mat`, scene);

  if (type === CellType.ICE) {
    // ICE Block: Crystal appearance
    const box = BABYLON.MeshBuilder.CreateBox(id, { size: CELL_SIZE * 0.92, height: 0.65 }, scene);

    if (health === 1) {
      // Cracked ice appearance
      const crackedCol = BABYLON.Color3.FromHexString("#bfdbfe");
      mat.diffuseColor = crackedCol;
      mat.emissiveColor = BABYLON.Color3.FromHexString("#60a5fa").scale(0.1);
      mat.specularColor = BABYLON.Color3.Black();
      mat.specularPower = 0;
      mat.alpha = 0.8;
      box.material = mat;

      // Crack effect with orange-yellow edges
      box.enableEdgesRendering();
      box.edgesWidth = 3.5;
      box.edgesColor = new BABYLON.Color4(0.9, 0.6, 0.2, 0.9);
    } else {
      // Solid ice - crystal blue
      const iceCol = BABYLON.Color3.FromHexString("#7dd3fc");
      mat.diffuseColor = iceCol;
      mat.emissiveColor = BABYLON.Color3.FromHexString("#38bdf8").scale(0.15);
      mat.specularColor = BABYLON.Color3.Black();
      mat.specularPower = 0;
      mat.alpha = 0.85;
      box.material = mat;

      // Bright white edges
      box.enableEdgesRendering();
      box.edgesWidth = 2.5;
      box.edgesColor = new BABYLON.Color4(0.7, 0.92, 1.0, 0.85);

      // Snowflake marker on top
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
    // BOMB Block: Metallic, dangerous appearance
    const box = BABYLON.MeshBuilder.CreateBox(id, { size: CELL_SIZE * 0.88, height: 0.72 }, scene);

    // Dark metal body
    mat.diffuseColor = BABYLON.Color3.FromHexString("#1c1917");
    mat.emissiveColor = BABYLON.Color3.FromHexString("#f59e0b").scale(0.1);
    mat.specularColor = BABYLON.Color3.Black();
    mat.specularPower = 0;
    mat.alpha = 1.0;
    box.material = mat;

    // Danger stripes - thick yellow-orange edges
    box.enableEdgesRendering();
    box.edgesWidth = 4.0;
    box.edgesColor = new BABYLON.Color4(1.0, 0.6, 0.0, 1.0);

    // Fuse on top
    const fuseBase = BABYLON.MeshBuilder.CreateCylinder(`${id}-fuse`, {
      height: 0.2,
      diameter: 0.18,
      tessellation: 6
    }, scene);
    fuseBase.position.y = 0.45;
    const fuseMat = new BABYLON.StandardMaterial(`${id}-fuseMat`, scene);
    fuseMat.emissiveColor = BABYLON.Color3.FromHexString("#ef4444");
    fuseMat.disableLighting = true;
    fuseBase.material = fuseMat;
    fuseBase.parent = box;
    fuseBase.isPickable = false;

    box.isPickable = false;
    box.position.y = 12;
    return box;

  } else if (type === CellType.CHRONO) {
    // CHRONO Block: Golden time bonus
    const box = BABYLON.MeshBuilder.CreateBox(id, { size: CELL_SIZE * 0.88, height: 0.68 }, scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString("#fbbf24");
    mat.emissiveColor = BABYLON.Color3.FromHexString("#f59e0b").scale(0.2);
    mat.specularColor = BABYLON.Color3.Black();
    mat.specularPower = 0;
    mat.alpha = 1.0;
    box.material = mat;

    // Golden border
    box.enableEdgesRendering();
    box.edgesWidth = 3.5;
    box.edgesColor = new BABYLON.Color4(1.0, 0.85, 0.2, 1.0);

    // Clock marker on top
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
    // NORMAL Block
    const box = BABYLON.MeshBuilder.CreateBox(id, { size: CELL_SIZE * 0.92, height: 0.6 }, scene);
    const col = BABYLON.Color3.FromHexString(colorHex);
    mat.diffuseColor = col;
    mat.emissiveColor = col.scale(0.05);
    mat.specularColor = BABYLON.Color3.Black();
    mat.specularPower = 0;
    mat.alpha = 0.95;
    box.material = mat;

    // Clean edges
    box.enableEdgesRendering();
    box.edgesWidth = 1.5;
    box.edgesColor = new BABYLON.Color4(1, 1, 1, 0.12);

    box.isPickable = false;
    box.position.y = 12;
    return box;
  }
}

/**
 * Initialize ghost piece pool
 */
export function initGhostPool(scene: BABYLON.Scene): BABYLON.Mesh[] {
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
}

/**
 * Initialize skill overlay pool
 */
export function initSkillOverlayPool(scene: BABYLON.Scene): BABYLON.Mesh[] {
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
}

/**
 * Initialize guided highlight pool
 */
export function initGuidedHighlightPool(scene: BABYLON.Scene): BABYLON.Mesh[] {
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
}

/**
 * Initialize fragment pool for break apart animations
 */
export function initFragmentPool(scene: BABYLON.Scene): BABYLON.Mesh[] {
  const pool: BABYLON.Mesh[] = [];
  for (let i = 0; i < FRAGMENT_POOL_SIZE; i++) {
    // Small random sized fragment
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
}
