export type CellId = string; // Using UUID or coords string

export enum SkillType {
  REROLL = 'REROLL',
  SHATTER = 'SHATTER', // Destroy single block
  BOMB = 'BOMB', // Destroy 3x3
  GRAVITY_FLUSH = 'GRAVITY_FLUSH'
}

// Active Abilities (extends SkillType)
export enum ActiveAbilityType {
  REROLL = 'REROLL',
  SHATTER = 'SHATTER',
  BOMB = 'BOMB',
  ROTATE = 'ROTATE',      // Rotate piece 90° clockwise
  SWAP = 'SWAP',          // Exchange two pieces
  FREEZE = 'FREEZE',      // Prevent Ice spawns for 5 moves
  MAGNET = 'MAGNET',      // Auto-place optimally
  UNDO = 'UNDO'           // Revert last move
}

// Passive Abilities
export enum PassiveAbilityType {
  FLUX_BOOST = 'FLUX_BOOST',           // +25% flux generation
  SCORE_MULTIPLIER = 'SCORE_MULTIPLIER', // 1.5x score
  LUCKY_PIECES = 'LUCKY_PIECES',       // +20% favorable shapes
  COMBO_MASTER = 'COMBO_MASTER',       // +3s combo duration
  ICE_BREAKER = 'ICE_BREAKER'          // Ice health 2→1
}

export enum GameMode {
  CAREER = 'CAREER',
  ENDLESS = 'ENDLESS',
  TIMED = 'TIMED'
}

export enum AppState {
  HOME = 'HOME',
  MAP = 'MAP',
  GAME = 'GAME',
  CAREER = 'CAREER',
  MODES = 'MODES' // Mode selection screen
}

export interface GameStats {
  blocksPlaced: number;
  linesCleared: number;
  totalScore: number;
  bombsExploded: number;
  iceBroken: number;
  gamesPlayed: number;
  skillUses: {
    [key in SkillType]?: number;
  };
}

export enum CellType {
  NORMAL = 'NORMAL',
  ICE = 'ICE', // Needs 2 clears
  BOMB = 'BOMB' // Explodes 3x3 on clear
}

// Special Block Types
export enum SpecialBlockType {
  NORMAL = 'NORMAL',
  ICE = 'ICE',
  BOMB = 'BOMB',
  RAINBOW = 'RAINBOW',       // Clears all same-color blocks
  LOCK = 'LOCK',             // Requires 3 clears to break
  PORTAL = 'PORTAL',         // Teleports piece
  MULTIPLIER = 'MULTIPLIER', // 2x score for line
  FLUX_GEN = 'FLUX_GEN'      // +10 flux on clear
}

export enum ObjectiveType {
  SCORE = 'SCORE',
  BREAK_ICE = 'BREAK_ICE',
  USE_BOMB = 'USE_BOMB',
  CLEAR_LINES = 'CLEAR_LINES',
  CHAIN_REACTION = 'CHAIN_REACTION'
}

export interface LevelObjective {
  type: ObjectiveType;
  target: number;
  current: number;
}

export interface LevelDef {
  index: number;
  name: string;
  objectives: LevelObjective[];
  movesLimit?: number;
  rewardFlux?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  targetValue: number;
  currentValue: number;
  hidden?: boolean;
  category?: 'SCORE' | 'COMBO' | 'SPECIAL_BLOCKS' | 'ABILITIES' | 'PROGRESSION';
  fluxReward?: number;
}

export interface GridCell {
  filled: boolean;
  color: string;
  id?: string;
  isClearing?: boolean;
  type?: CellType;
  health?: number;
}

export type GridState = GridCell[][];

export interface Coord {
  x: number;
  y: number;
}

export interface PieceShape {
  id: string;
  shape: number[][];
  color: string;
}

export interface Piece extends PieceShape {
  instanceId: string;
  type?: CellType;
}

export const GRID_SIZE = 10;

// Active Ability Interfaces
export interface ActiveAbility {
  type: ActiveAbilityType;
  fluxCost: number;
  unlocked: boolean;
  cooldown?: number;
  usageCount: number;
}

export interface AbilityState {
  activeAbilities: Map<ActiveAbilityType, ActiveAbility>;
  activeSkill: ActiveAbilityType | null;
  freezeMovesRemaining: number;
  historyStack: GridState[];
}

// Passive Ability Interfaces
export interface PassiveEffect {
  multiplier?: number;
  duration?: number;
  probability?: number;
  healthModifier?: number;
}

export interface PassiveAbility {
  type: PassiveAbilityType;
  unlocked: boolean;
  equipped: boolean;
  effect: PassiveEffect;
}

export interface PassiveAbilityState {
  passiveAbilities: Map<PassiveAbilityType, PassiveAbility>;
  equippedSlots: [PassiveAbilityType | null, PassiveAbilityType | null, PassiveAbilityType | null];
  maxEquipped: 3;
}

// Special Block Interface
export interface SpecialBlock extends GridCell {
  specialType: SpecialBlockType;
  lockHealth?: number;
  metadata?: {
    spawnedAt?: number;
    clearedCount?: number;
    [key: string]: any;
  };
}

// Progression System Interfaces
export interface ProgressionState {
  currentLevel: number;
  maxLevelReached: number;
  levelProgress: Map<number, LevelProgress>;
  unlockedAbilities: Set<ActiveAbilityType | PassiveAbilityType>;
  totalScore: number;
}

export interface LevelProgress {
  levelIndex: number;
  completed: boolean;
  stars: number;
  bestScore: number;
  objectives: LevelObjective[];
}

export interface UnlockCondition {
  type: 'LEVEL' | 'ACHIEVEMENT_COUNT' | 'TOTAL_SCORE';
  value: number;
}

export interface AbilityUnlock {
  ability: ActiveAbilityType | PassiveAbilityType;
  condition: UnlockCondition;
}

// Player Profile Interfaces
export interface PlayerProfile {
  username: string;
  createdAt: number;
  lastPlayed: number;
  stats: PlayerStats;
  progression: ProgressionState;
  unlockedAbilities: Set<ActiveAbilityType | PassiveAbilityType>;
  equippedPassives: PassiveAbilityType[];
  achievements: Map<string, Achievement>;
}

export interface PlayerStats {
  gamesPlayed: number;
  blocksPlaced: number;
  linesCleared: number;
  totalScore: number;
  bombsExploded: number;
  iceBroken: number;
  highestCombo: number;
  longestSession: number;
  totalPlaytime: number;
  skillUses: Map<ActiveAbilityType, number>;
}

// Touch Gesture Interfaces
export interface TouchGesture {
  type: 'TAP' | 'LONG_PRESS' | 'DRAG' | 'PINCH' | 'SWIPE';
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  startTime: number;
  fingers: number;
}

export interface TouchControllerState {
  activeGestures: Map<number, TouchGesture>;
  lastTapTime: number;
  draggedElement: HTMLElement | null;
  zoomLevel: number;
  cameraRotation: { x: number; y: number };
}

// Mobile Optimization Interfaces
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
}

export interface OptimizationSettings {
  particleLimit: number;
  shadowQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'OFF';
  textureQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  antialiasing: boolean;
  bloomEffect: boolean;
}

export interface LayoutConfig {
  gridSize: number;
  pieceSize: number;
  spacing: number;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
}

// Persistence Schema
export interface PersistenceSchema {
  version: number;
  checksum: string;
  data: {
    profile: PlayerProfile;
    progression: ProgressionState;
    abilities: {
      unlocked: string[];
      equipped: string[];
    };
    achievements: {
      id: string;
      currentValue: number;
      unlocked: boolean;
    }[];
    settings: {
      soundEnabled: boolean;
      musicEnabled: boolean;
      hapticEnabled: boolean;
    };
  };
  backups: {
    timestamp: number;
    data: any;
  }[];
}
