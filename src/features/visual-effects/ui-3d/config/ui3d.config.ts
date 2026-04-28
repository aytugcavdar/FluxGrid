/**
 * 3D UI Effects Configuration
 * 
 * Configuration for 3D UI elements like floating score, combo meter, banners
 */

import * as BABYLON from 'babylonjs';

/**
 * 3D UI configuration
 */
export const UI3D_CONFIG = {
  /** Floating score settings */
  floatingScore: {
    /** Font size for 3D text */
    fontSize: 48,
    
    /** Text depth (extrusion) */
    depth: 0.1,
    
    /** Animation duration (ms) */
    duration: 1000,
    
    /** Float distance (world units) */
    floatDistance: 2.0,
    
    /** Fade start percentage */
    fadeStart: 0.6,
  },
  
  /** Combo meter settings */
  comboMeter: {
    /** Ring radius */
    radius: 1.5,
    
    /** Ring thickness */
    thickness: 0.2,
    
    /** Pulse scale multiplier */
    pulseScale: 1.2,
    
    /** Pulse duration (ms) */
    pulseDuration: 200,
    
    /** Rotation speed (radians/second) */
    rotationSpeed: Math.PI / 2,
  },
  
  /** Level up banner settings */
  levelUpBanner: {
    /** Banner width */
    width: 8.0,
    
    /** Banner height */
    height: 2.0,
    
    /** Animation duration (ms) */
    duration: 2000,
    
    /** Slide distance */
    slideDistance: 10.0,
    
    /** Scale animation */
    scaleFrom: 0.5,
    scaleTo: 1.0,
  },
  
  /** Achievement popup settings */
  achievementPopup: {
    /** Popup width */
    width: 4.0,
    
    /** Popup height */
    height: 1.5,
    
    /** Animation duration (ms) */
    duration: 1500,
    
    /** Pop scale */
    popScale: 1.3,
    
    /** Display time (ms) */
    displayTime: 3000,
  },
} as const;

/**
 * Interface for floating score instance
 */
export interface FloatingScoreInstance {
  mesh: BABYLON.Mesh;
  startTime: number;
  duration: number;
  startPosition: BABYLON.Vector3;
  endPosition: BABYLON.Vector3;
  isActive: boolean;
}

/**
 * Interface for combo meter state
 */
export interface ComboMeterState {
  mesh: BABYLON.Mesh;
  fillMesh: BABYLON.Mesh;
  currentCombo: number;
  maxCombo: number;
  isPulsing: boolean;
  pulseStartTime: number;
}

/**
 * Interface for banner instance
 */
export interface BannerInstance {
  mesh: BABYLON.Mesh;
  textMesh: BABYLON.Mesh;
  startTime: number;
  duration: number;
  isActive: boolean;
}

/**
 * Interface for achievement popup instance
 */
export interface AchievementPopupInstance {
  mesh: BABYLON.Mesh;
  iconMesh: BABYLON.Mesh;
  textMesh: BABYLON.Mesh;
  startTime: number;
  duration: number;
  displayTime: number;
  isActive: boolean;
}
