import { GameMode } from '../types';

// Component Props Interfaces

export interface GameModeCardProps {
  mode: GameMode;
  icon: string;
  label: string;
  description: string;
  descriptionLong: string;
  bestScore: number;
  color: string;
  isSelected: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

export interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  color: string;
}

export interface ProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  showPercentage?: boolean;
}

export interface AchievementCardProps {
  achievement: Achievement;
  status: 'locked' | 'in-progress' | 'unlocked';
  progress?: number; // 0-100 for in-progress
}

export interface ThemeCardProps {
  theme: 'dark' | 'light' | 'neon';
  label: string;
  colors: string[]; // 3 representative colors
  isSelected: boolean;
  onSelect: () => void;
}

export interface ToggleSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export interface PerformanceCardProps {
  mode: GameMode;
  bestScore: number;
  maxCombo: number;
  maxTier?: number; // Endless only
  maxDuration?: number; // Timed only
  color: string;
}

// Data Models

export interface ModePerformance {
  mode: GameMode;
  bestScore: number;
  maxCombo: number;
  maxTier?: number; // Endless only
  maxDuration?: number; // Timed only
}

export interface GeneralProgress {
  totalBlocks: number;
  linesCleared: number;
  bombsExploded: number;
  speedCards: number;
  abilityUses: number;
}

export interface GeneralStats {
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  playtime: number; // in seconds
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'locked' | 'in-progress' | 'unlocked';
  progress?: number; // 0-100 for in-progress
  requirement?: number;
  current?: number;
  category?: string;
  hidden?: boolean;
  rarity?: 'BRONZE' | 'SILVER' | 'GOLD' | 'MYTHIC';
  currentValue?: number;
  targetValue?: number;
}

// Export Data Interface

export interface ExportData {
  version: string;
  exportedAt: number;
  theme: string;
  language: string;
  settings: {
    soundEnabled: boolean;
    hapticEnabled: boolean;
    ghostBlockEnabled: boolean;
    performanceModeEnabled: boolean;
  };
  highScores: Record<string, number>;
  stats: any; // Will be defined by gameStore
  achievements: Achievement[];
}
