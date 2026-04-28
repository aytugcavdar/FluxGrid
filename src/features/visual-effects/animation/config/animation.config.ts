/**
 * Animation System Configuration
 * 
 * Configuration for kinetic animations (squash & stretch, trails, rotation).
 * Applies animation principles to make blocks feel "alive" and responsive.
 */

/**
 * Main animation configuration
 */
export const ANIMATION_CONFIG = {
  /** Stretch animation (during fall) */
  stretch: {
    scale: [0.8, 1.5, 0.8] as [number, number, number], // [x, y, z]
    maxFactor: 0.5, // Maximum stretch multiplier
  },
  
  /** Squash animation (on landing) */
  squash: {
    scale: [1.3, 0.6, 1.3] as [number, number, number], // [x, y, z]
    duration: 150, // milliseconds
    easing: 'easeOutElastic' as const,
  },
  
  /** Rotation animation */
  rotation: {
    duration: 100, // milliseconds
    easing: 'easeOutBack' as const,
    scalePulse: 1.1, // Scale multiplier during rotation
  },
  
  /** Trail effect configuration */
  trail: {
    minCombo: 5, // Minimum combo level to enable trails
    configs: {
      low: {
        alpha: 0.3,
        segments: 10,
        emissive: 0.33,
      },
      medium: {
        alpha: 0.5,
        segments: 15,
        emissive: 0.67,
      },
      high: {
        alpha: 0.8,
        segments: 20,
        emissive: 1.0,
      },
    },
  },
} as const;

/**
 * Kinetic animation configuration
 */
export interface KineticAnimationConfig {
  /** Stretch scale [x, y, z] for falling pieces */
  stretchScale: [number, number, number];
  
  /** Squash scale [x, y, z] for landing pieces */
  squashScale: [number, number, number];
  
  /** Spring-back duration in milliseconds */
  springDuration: number;
  
  /** Easing function name */
  easingFunction: string;
  
  /** Whether trail effects are enabled */
  trailEnabled: boolean;
  
  /** Minimum combo level for trails */
  trailMinCombo: number;
}

/**
 * Animation state for a piece
 */
export interface AnimationState {
  /** Whether animation is currently running */
  isAnimating: boolean;
  
  /** Animation start timestamp */
  startTime: number;
  
  /** Starting scale [x, y, z] */
  startScale: [number, number, number];
  
  /** Target scale [x, y, z] */
  targetScale: [number, number, number];
  
  /** Animation duration in milliseconds */
  duration: number;
  
  /** Easing function */
  easingFn: (t: number) => number;
}

/**
 * Trail configuration
 */
export interface TrailConfig {
  /** Trail color */
  color: { r: number; g: number; b: number }; // BABYLON.Color3
  
  /** Trail alpha (0-1) */
  alpha: number;
  
  /** Number of trail segments */
  segmentCount: number;
  
  /** Trail width */
  width: number;
  
  /** Emissive intensity (0-1) */
  emissiveIntensity: number;
}

/**
 * Trail instance
 */
export interface TrailInstance {
  /** Trail mesh reference */
  mesh: any; // BABYLON.TrailMesh
  
  /** Generator mesh (the piece being trailed) */
  generator: any; // BABYLON.Mesh
  
  /** Trail configuration */
  config: TrailConfig;
  
  /** Whether trail is currently active */
  isActive: boolean;
  
  /** Trail segment positions */
  positions: Array<{ x: number; y: number; z: number }>; // BABYLON.Vector3[]
}

/**
 * Easing function type
 */
export type EasingFunction = (t: number) => number;

/**
 * Easing functions for animations
 */
export const EASING_FUNCTIONS: Record<string, EasingFunction> = {
  linear: (t: number) => t,
  
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};
