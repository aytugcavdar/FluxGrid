/**
 * GameScreen Memoization Utilities
 * 
 * Custom comparison function for GameScreen props
 */

import type { GameMode } from '@shared/types';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
}

interface TimePopup {
  id: number;
  value: number;
}

export interface GameScreenProps {
  grid: any;
  pieces: any[];
  combo: number;
  gameMode: GameMode;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
  gridSize: number;
  scorePopups: ScorePopup[];
  showSurgeFlash: boolean;
  timedBoostMovesLeft: number;
  timePopups: TimePopup[];
  setTimePopups: React.Dispatch<React.SetStateAction<TimePopup[]>>;
  shownChain: number;
  showPerfect: boolean;
  eventStartVisual: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  setEventStartVisual: React.Dispatch<React.SetStateAction<'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null>>;
  showComboMilestone: boolean;
  lineCountToShow: number;
  showLineCount: boolean;
}

/**
 * Custom comparison function for GameScreen props
 * 
 * Uses reference equality for objects (grid, pieces) since Zustand ensures immutability
 * Uses value equality for primitives
 */
export const areGameScreenPropsEqual = (
  prevProps: GameScreenProps,
  nextProps: GameScreenProps
): boolean => {
  // Reference equality for immutable objects
  if (prevProps.grid !== nextProps.grid) return false;
  if (prevProps.pieces !== nextProps.pieces) return false;
  if (prevProps.scorePopups !== nextProps.scorePopups) return false;
  if (prevProps.timePopups !== nextProps.timePopups) return false;
  
  // Value equality for primitives
  if (prevProps.combo !== nextProps.combo) return false;
  if (prevProps.gameMode !== nextProps.gameMode) return false;
  if (prevProps.gridSize !== nextProps.gridSize) return false;
  if (prevProps.showSurgeFlash !== nextProps.showSurgeFlash) return false;
  if (prevProps.timedBoostMovesLeft !== nextProps.timedBoostMovesLeft) return false;
  if (prevProps.shownChain !== nextProps.shownChain) return false;
  if (prevProps.showPerfect !== nextProps.showPerfect) return false;
  if (prevProps.eventStartVisual !== nextProps.eventStartVisual) return false;
  if (prevProps.showComboMilestone !== nextProps.showComboMilestone) return false;
  if (prevProps.lineCountToShow !== nextProps.lineCountToShow) return false;
  if (prevProps.showLineCount !== nextProps.showLineCount) return false;
  
  // Refs and setters are stable, no need to compare
  
  return true;
};
