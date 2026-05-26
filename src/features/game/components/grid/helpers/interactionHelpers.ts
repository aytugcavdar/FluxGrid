/**
 * Interaction Helpers
 * Functions for handling user interactions with the grid (hover, pointer events)
 */

import React from 'react';
import * as BABYLON from 'babylonjs';
import { GRID_SIZE, TOTAL_CELL_SIZE, GHOST_POOL_SIZE } from '../constants';
import { Piece } from '../../../types';
import { GridState } from '../../../types';
import { getDragYOffset } from '../../../../../utils/responsive/responsive';
import { gameFeelEvents } from '../../../../../utils/audio';

const GRID_OFFSET = (GRID_SIZE - 1) * TOTAL_CELL_SIZE / 2;

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
 * Update hover state and ghost piece visualization
 */
export const updateHover = (
  scene: BABYLON.Scene,
  ground: BABYLON.Mesh,
  canvas: HTMLCanvasElement | null,
  globalMouseRef: React.MutableRefObject<{ x: number; y: number } | null>,
  hoverCoordRef: React.MutableRefObject<{ x: number; y: number } | null>,
  setHoverCoord: (coord: { x: number; y: number } | null) => void,
  draggedPiece: Piece | null,
  canPlacePiece: (grid: GridState, piece: Piece, x: number, y: number) => boolean,
  grid: GridState,
  ghostMeshes: BABYLON.Mesh[]
): void => {
  let pickInfo: BABYLON.PickingInfo | null = null;

  if (globalMouseRef.current && canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = globalMouseRef.current.x - rect.left;
    const y = globalMouseRef.current.y - rect.top;

    const DRAG_Y_OFFSET = draggedPiece ? getDragYOffset() : 0;

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

    if (draggedPiece) {
      const shapeW = draggedPiece.shape[0].length;
      const shapeH = draggedPiece.shape.length;
      const fx = rx - Math.floor((shapeW - 1) / 2);
      const fy = ry - Math.floor((shapeH - 1) / 2);

      const newCoord = { x: fx, y: fy };
      if (!hoverCoordRef.current || hoverCoordRef.current.x !== fx || hoverCoordRef.current.y !== fy) {
        hoverCoordRef.current = newCoord;
        setHoverCoord(newCoord);
        gameFeelEvents.dragHover();
      }

      // Hide all ghosts first
      ghostMeshes.forEach(m => { m.isVisible = false; });

      // Check if valid placement
      const isValid = canPlacePiece(grid, draggedPiece, fx, fy);

      if (isValid) {
        // Show ghost meshes from pool
        let ghostIndex = 0;
        draggedPiece.shape.forEach((row, rIdx) => {
          row.forEach((cell, cIdx) => {
            if (cell && ghostIndex < GHOST_POOL_SIZE) {
              const gx = fx + cIdx;
              const gy = fy + rIdx;

              const ghost = ghostMeshes[ghostIndex++];
              ghost.position = getVectorPos(gx, gy);
              ghost.position.y = -0.45;

              const gMat = ghost.material as BABYLON.StandardMaterial;
              gMat.diffuseColor = BABYLON.Color3.FromHexString(draggedPiece.color);
              gMat.emissiveColor = BABYLON.Color3.FromHexString(draggedPiece.color).scale(0.5);
              gMat.alpha = 0.4;
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
    ghostMeshes.forEach(m => { m.isVisible = false; });
  }
};

/**
 * Create pointer move handler
 */
export const createPointerMoveHandler = (
  globalMouseRef: React.MutableRefObject<{ x: number; y: number } | null>
) => {
  return (e: PointerEvent) => {
    globalMouseRef.current = { x: e.clientX, y: e.clientY };
  };
};

/**
 * Create window pointer up handler (for piece placement)
 */
export const createWindowPointerUpHandler = (
  draggedPiece: Piece | null,
  hoverCoordRef: React.MutableRefObject<{ x: number; y: number } | null>,
  canvas: HTMLCanvasElement | null,
  globalMouseRef: React.MutableRefObject<{ x: number; y: number } | null>,
  placePiece: (piece: Piece, x: number, y: number) => void,
  setDraggedPiece: (piece: Piece | null) => void,
  setHoverCoord: (coord: { x: number; y: number } | null) => void
) => {
  return () => {
    if (draggedPiece && hoverCoordRef.current && canvas) {
      const rect = canvas.getBoundingClientRect();
      const mousePos = globalMouseRef.current;

      if (mousePos &&
        mousePos.x >= rect.left &&
        mousePos.x <= rect.right &&
        mousePos.y >= rect.top &&
        mousePos.y <= rect.bottom) {
        placePiece(draggedPiece, hoverCoordRef.current.x, hoverCoordRef.current.y);
      }
    }

    setDraggedPiece(null);
    hoverCoordRef.current = null;
    setHoverCoord(null);
    globalMouseRef.current = null;
  };
};

/**
 * Create canvas pointer up handler (for skill usage)
 */
export const createCanvasPointerUpHandler = (
  activeSkill: any,
  hoverCoordRef: React.MutableRefObject<{ x: number; y: number } | null>,
  useShatter: (x: number, y: number) => void,
  useBomb: (x: number, y: number) => void
) => {
  return (e: PointerEvent) => {
    const hover = hoverCoordRef.current;

    if (activeSkill === 'SHATTER' && hover) {
      if (hover.x >= 0 && hover.x < GRID_SIZE && hover.y >= 0 && hover.y < GRID_SIZE) {
        useShatter(hover.x, hover.y);
      }
    } else if (activeSkill === 'BOMB' && hover) {
      if (hover.x >= 0 && hover.x < GRID_SIZE && hover.y >= 0 && hover.y < GRID_SIZE) {
        useBomb(hover.x, hover.y);
      }
    }
  };
};
