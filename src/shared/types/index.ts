/**
 * Shared types used across multiple features
 */

// App State
export enum AppState {
  HOME = 'HOME',
  MODES = 'MODES',
  GAME = 'GAME',
  LEVEL_MAP = 'LEVEL_MAP',
  CAREER = 'CAREER',
  PROFILE = 'PROFILE',
  TUTORIAL = 'TUTORIAL',
  PUZZLE_MAP = 'PUZZLE_MAP',
}

// Game Modes
export enum GameMode {
  CAREER = 'CAREER',
  ENDLESS = 'ENDLESS',
  TIMED = 'TIMED',
  DAILY_CHALLENGE = 'DAILY_CHALLENGE',
  ZEN = 'ZEN',
  BLITZ = 'BLITZ',
  PUZZLE = 'PUZZLE',
  SURVIVAL = 'SURVIVAL',
}

// Game Statistics
export interface GameStats {
  blocksPlaced: number;
  linesCleared: number;
  totalScore: number;
  bombsExploded: number;
  iceBroken: number;
  gamesPlayed: number;
  skillUses: { [key: string]: number };
}

// Touch & Gesture Types
export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'rotate';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  velocity?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export interface TouchControllerState {
  isDragging: boolean;
  currentPiece: any | null;
  dragOffset: { x: number; y: number };
  lastTouchTime: number;
  gestureHistory: TouchGesture[];
}

// Performance & Optimization
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  renderTime: number;
}

export interface OptimizationSettings {
  enableShadows: boolean;
  enableParticles: boolean;
  enableBloom: boolean;
  targetFPS: number;
  adaptiveQuality: boolean;
}

// Layout & Responsive
export interface LayoutConfig {
  gridSize: number;
  cellSize: number;
  pieceScale: number;
  hudScale: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Persistence
export interface PersistenceSchema {
  version: number;
  lastSaved: number;
  data: any;
}
