/**
 * Game Store Exports
 * 
 * This file exports both the original monolithic gameStore (for backward compatibility)
 * and the new split stores (for gradual migration).
 * 
 * Migration Strategy:
 * 1. Keep using useGameStore for high-level actions (placePiece, initGame, etc.)
 * 2. Gradually migrate components to use split stores for specific state access
 * 3. Once all components are migrated, refactor gameStore to be a thin facade
 * 
 * Split Stores:
 * - useGridStore: Grid state and operations
 * - usePieceStore: Piece state and operations
 * - useScoreStore: Score, combo, and scoring
 * - useProgressionStore: Level, experience, progression
 * - useMultiplierStore: Multiplier state and calculations
 */

// Original monolithic store (for backward compatibility)
export { useGameStore } from './gameStore';
export type { GameStore } from './gameStore';

// New split stores (for gradual migration)
export { useGridStore } from './gridStore';
export type { GridStore } from './gridStore';

export { usePieceStore } from './pieceStore';
export type { PieceStore } from './pieceStore';

export { useScoreStore } from './scoreStore';
export type { ScoreStore } from './scoreStore';

export { useProgressionStore } from './progressionStore';
export type { ProgressionStore } from './progressionStore';

export { useMultiplierStore } from './multiplierStore';
export type { MultiplierStore } from './multiplierStore';
