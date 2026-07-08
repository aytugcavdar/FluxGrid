/**
 * Shared types used across multiple features
 */

// App State
export enum AppState {
  HOME = 'HOME',
  MODES = 'MODES',
  GAME = 'GAME',
  PROFILE = 'PROFILE',
  TUTORIAL = 'TUTORIAL',
  PUZZLE_MAP = 'PUZZLE_MAP',
  LEADERBOARD = 'LEADERBOARD',
  STATISTICS = 'STATISTICS',
}

// Game Modes
export enum GameMode {
  ENDLESS = 'ENDLESS',
  TIMED = 'TIMED',
  DAILY_CHALLENGE = 'DAILY_CHALLENGE',
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
  
  // Endless mode stats
  endlessGamesPlayed?: number;
  endlessHighScore?: number;
  endlessMaxCombo?: number;
  endlessTotalLines?: number;
  endlessMaxTier?: number;
  endlessEventCount?: number;
  
  // Timed mode stats
  timedGamesPlayed?: number;
  timedHighScore?: number;
  timedMaxCombo?: number;
  timedTotalLines?: number;
  timedMaxDuration?: number;
  timedSprintBonusTotal?: number;
  perfectClears?: number;
  recordsBroken?: number;
  largePiecesPlaced?: number;
  lineFivePiecesPlaced?: number;
  hollow3x3PiecesPlaced?: number;
  square3x3PiecesPlaced?: number;
  largePieceClears?: number;
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
  lastSaved?: number;
  checksum: string;
  data: any;
  backups?: Array<{ timestamp: number; data: any }>;
}
