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
  action: 'place' | 'clear' | 'info' | 'complete';
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
