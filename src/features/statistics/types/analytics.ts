/**
 * Advanced Analytics Types for Premium Statistics Screen
 */

import { GameMode } from '@shared/types';
import { Achievement } from '@shared/types/ui';

// Performance DNA - Player Profile
export interface PlayerDNA {
  playStyle: 'aggressive' | 'defensive' | 'balanced' | 'strategic';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  skillRating: {
    speed: number; // 0-100
    accuracy: number;
    strategy: number;
    consistency: number;
    adaptability: number;
  };
}

// Time-Based Analytics
export interface TimeAnalytics {
  peakPerformanceTime: string; // "14:00-16:00"
  averageSessionDuration: number; // minutes
  longestSession: number;
  totalPlaytime: number;
  playFrequency: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  hourlyDistribution: number[]; // 24 hours
  dailyHeatmap: { date: string; count: number; score: number }[];
}

// Advanced Score Analytics
export interface ScoreAnalytics {
  scoreProgression: {
    date: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  personalBests: {
    allTime: number;
    thisWeek: number;
    thisMonth: number;
    today: number;
  };
  scoreConsistency: number; // 0-100
  averageScoreByMode: Record<GameMode, number>;
  scoreBreakdown: {
    fromBlocks: number; // %
    fromLines: number; // %
    fromCombos: number; // %
    fromBonuses: number; // %
  };
  milestones: {
    date: string;
    score: number;
    achievement: string;
  }[];
}

// Combo & Chain Analysis
export interface ComboAnalytics {
  maxCombo: number;
  averageCombo: number;
  comboDistribution: Record<number, number>;
  comboBreakReasons: {
    timeout: number;
    noLines: number;
    gameOver: number;
  };
  chainReactionStats: {
    totalChains: number;
    averageChainLength: number;
    maxChainLength: number;
  };
  comboEfficiency: number; // %
}

// Block Placement Heatmap
export interface PlacementHeatmap {
  gridHeatmap: number[][]; // 10x10 grid
  favoritePositions: { x: number; y: number; count: number }[];
  avoidedPositions: { x: number; y: number }[];
  placementSpeed: {
    average: number; // ms
    fastest: number;
    slowest: number;
  };
  placementAccuracy: number; // %
}

// Special Blocks Mastery
export interface SpecialBlockStats {
  bombStats: {
    totalExploded: number;
    averageImpact: number;
    chainBombs: number;
    wastedBombs: number;
  };
  iceStats: {
    totalBroken: number;
    averageBreakTime: number;
    iceChains: number;
  };
  specialBlockEfficiency: number;
}

// Comparison & Benchmarking
export interface ComparisonData {
  vsGlobalAverage: {
    score: number; // % difference
    combo: number;
    speed: number;
  };
  vsTopPlayers: {
    percentile: number;
    rank: number;
    gap: number;
  };
  vsPreviousWeek: {
    scoreChange: number;
    comboChange: number;
    improvementAreas: string[];
  };
  vsPersonalBest: {
    currentStreak: number;
    daysFromPB: number;
    progressToNewPB: number;
  };
}

// AI-Powered Insights
export interface AIInsights {
  strengths: {
    title: string;
    description: string;
    confidence: number;
  }[];
  improvements: {
    title: string;
    suggestion: string;
    potentialGain: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  predictions: {
    nextMilestone: string;
    estimatedDate: string;
    confidence: number;
  };
  patterns: {
    type: 'positive' | 'negative' | 'neutral';
    description: string;
    frequency: number;
  }[];
}

// Achievement Progress
export interface AchievementProgress {
  nearCompletion: Achievement[];
  recentlyUnlocked: Achievement[];
  rarest: Achievement[];
  nextMilestone: {
    achievement: Achievement;
    progress: number;
    estimatedGames: number;
  } | null;
  completionRate: number;
  categoryProgress: Record<string, number>;
}

// Export Options
export interface ExportOptions {
  format: 'image' | 'pdf' | 'json' | 'csv';
  content: 'summary' | 'detailed' | 'custom';
  dateRange: { start: Date; end: Date };
  includeCharts: boolean;
  includeComparison: boolean;
}

// Share Card
export interface ShareCard {
  type: 'achievement' | 'milestone' | 'stats';
  template: 'minimal' | 'detailed' | 'premium';
  customization: {
    background: string;
    accentColor: string;
    showAvatar: boolean;
  };
}

// Complete Analytics Data
export interface AdvancedAnalytics {
  playerDNA: PlayerDNA;
  timeAnalytics: TimeAnalytics;
  scoreAnalytics: ScoreAnalytics;
  comboAnalytics: ComboAnalytics;
  placementHeatmap: PlacementHeatmap;
  specialBlockStats: SpecialBlockStats;
  comparisonData: ComparisonData;
  aiInsights: AIInsights;
  achievementProgress: AchievementProgress;
}
