/**
 * Piece Store
 * 
 * Manages piece state and piece operations
 * Part of the gameStore split refactoring
 */

import { create } from 'zustand';
import { Piece, GridState } from '../types';
import { GameMode } from '@shared/types';
import { getRandomPiecesSync } from './helpers/pieces';
import { useThemeStore } from '@shared/store/themeStore';
import { useTutorialStore } from '../../tutorial/store/tutorialStore';
import { createMiniEventState } from './helpers/miniEventSystem';

export interface PieceStore {
  // State
  pieces: Piece[];
  draggedPiece: Piece | null;
  isPiecesLoading: boolean;
  
  // Actions
  generateNewPieces: (
    count: number,
    grid: GridState,
    gameMode: GameMode,
    difficultyTier: number,
    miniEventState?: ReturnType<typeof createMiniEventState>
  ) => void;
  setDraggedPiece: (piece: Piece | null) => void;
  removePiece: (instanceId: string) => void;
  hasValidMoves: (grid: GridState, canPlacePiece: (piece: Piece, x: number, y: number) => boolean) => boolean;
  getPieceById: (instanceId: string) => Piece | null;
  setPieces: (pieces: Piece[]) => void;
}

export const usePieceStore = create<PieceStore>((set, get) => ({
  // Initial state
  pieces: [],
  draggedPiece: null,
  isPiecesLoading: false,
  
  /**
   * Generate new pieces
   */
  generateNewPieces: (count, grid, gameMode, difficultyTier, miniEventState) => {
    set({ isPiecesLoading: true });
    
    const isDaily = gameMode === GameMode.DAILY_CHALLENGE;
    const currentTier = gameMode === GameMode.ENDLESS ? difficultyTier : 0;
    
    // Get tutorial step if tutorial is active
    const tutorialState = useTutorialStore.getState();
    const tutorialStep = tutorialState.isActive ? tutorialState.currentStep : undefined;
    
    try {
      const newPieces = getRandomPiecesSync(
        count,
        grid,
        isDaily,
        useThemeStore.getState().getPieceColors(),
        currentTier,
        gameMode,
        miniEventState || createMiniEventState()
      );
      
      set({ pieces: newPieces });
    } catch (error) {
      console.error('[PieceStore] Failed to generate pieces:', error);
      set({
        pieces: getRandomPiecesSync(
          count,
          undefined,
          false,
          useThemeStore.getState().getPieceColors(),
          0,
          gameMode,
          createMiniEventState()
        ),
      });
    } finally {
      set({ isPiecesLoading: false });
    }
  },
  
  /**
   * Set dragged piece
   */
  setDraggedPiece: (piece) => {
    set({ draggedPiece: piece });
  },
  
  /**
   * Remove a piece by instance ID
   */
  removePiece: (instanceId) => {
    const pieces = get().pieces.filter(p => p.instanceId !== instanceId);
    set({ pieces });
  },
  
  /**
   * Check if any piece has valid moves
   */
  hasValidMoves: (grid, canPlacePiece) => {
    const pieces = get().pieces;
    
    if (pieces.length === 0) return false;
    
    // Check if ANY piece can fit ANYWHERE
    for (const piece of pieces) {
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
          if (canPlacePiece(piece, x, y)) {
            return true;
          }
        }
      }
    }
    
    return false;
  },
  
  /**
   * Get piece by instance ID
   */
  getPieceById: (instanceId) => {
    const pieces = get().pieces;
    return pieces.find(p => p.instanceId === instanceId) || null;
  },
  
  /**
   * Set pieces (for loading saved games)
   */
  setPieces: (pieces) => {
    set({ pieces });
  },
}));
