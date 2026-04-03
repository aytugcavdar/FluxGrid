/**
 * Grid Types
 * Type definitions for Grid component internals
 */

import * as BABYLON from 'babylonjs';

// Fragment Animation
export interface FragmentData {
  mesh: BABYLON.Mesh;
  velocity: BABYLON.Vector3;
  rotationVelocity: BABYLON.Vector3;
  startTime: number;
  startAlpha: number;
}

export interface FragmentPool {
  pool: BABYLON.Mesh[];
  activeFragments: Map<string, FragmentData>;
}

// Line Clear Animation
export interface LineClearAnimation {
  active: boolean;
  phase: 'brightness' | 'particles' | 'collapse';
  progress: number;
  startTime: number;
  clearedCells: Set<string>;
  affectedBlocks: Map<string, { startY: number; targetY: number }>;
  originalColors: Map<string, BABYLON.Color3>;
}

// Placement Animation
export interface PlacementAnimation {
  active: boolean;
  startTime: number;
  cellAnimations: Map<string, {
    cellId: string;
    startTime: number;
    originalScale: BABYLON.Vector3;
    originalEmissive: BABYLON.Color3;
  }>;
}

// Combo State
export interface ComboState {
  active: boolean;
  level: number;
  startTime: number;
  flashProgress: number;
}

// Game Over Animation
export interface GameOverAnimation {
  active: boolean;
  phase: 'shake' | 'collapse' | 'fade';
  progress: number;
  startTime: number;
  cellAnimations: Map<string, {
    startY: number;
    delay: number;
  }>;
}

// Hover Coordinate
export interface HoverCoord {
  x: number;
  y: number;
}

// Mouse Position
export interface MousePosition {
  x: number;
  y: number;
}
