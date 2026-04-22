/**
 * Tutorial System Type Definitions
 */

export interface FeatureFlags {
  comboTimer: boolean;
  basicSkills: boolean;
  allSkills: boolean;
  events: boolean;
  miniEvents: boolean;
}

export interface TutorialMetrics {
  startTime: number | null;
  completionTime: number | null;
  stepDurations: Record<number, number>;
  skipped: boolean;
  skipStep: number | null;
}

export type FeatureType = 'comboTimer' | 'basicSkills' | 'allSkills' | 'events' | 'miniEvents';

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  highlightTarget: string | null; // CSS selector
  arrowDirection: 'up' | 'down' | 'left' | 'right' | null;
  action: 'place' | 'clear' | 'combo' | 'complete';
  validation: (gameState: any) => boolean;
}

export interface TooltipConfig {
  id: string;
  target: string; // CSS selector
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  duration: number; // milliseconds, 0 = manual dismiss
  priority: number; // higher = shown first
}

export interface TutorialSaveData {
  version: number;
  isCompleted: boolean;
  gamesCompleted: number;
  featuresUnlocked: FeatureFlags;
  metrics: TutorialMetrics;
  lastUpdated: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to FluxGrid!",
    description: "Drag pieces from the tray to the grid",
    highlightTarget: ".piece-tray",
    arrowDirection: "up",
    action: "place",
    validation: (state) => state.grid?.some((row: any[]) => row.some((cell: any) => cell.filled))
  },
  {
    id: 2,
    title: "Clear Lines",
    description: "Fill a complete row or column to clear it",
    highlightTarget: ".game-grid",
    arrowDirection: null,
    action: "clear",
    validation: (state) => state.lastAction?.type === 'CLEAR'
  },
  {
    id: 3,
    title: "Build Combos",
    description: "Clear multiple lines in a row to build combos",
    highlightTarget: ".combo-display",
    arrowDirection: "down",
    action: "combo",
    validation: (state) => state.combo >= 2
  },
  {
    id: 4,
    title: "You're Ready!",
    description: "Keep playing to unlock more features",
    highlightTarget: null,
    arrowDirection: null,
    action: "complete",
    validation: () => true
  }
];
