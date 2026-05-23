/**
 * Advanced Analytics Calculator
 * Calculates premium statistics from game data
 */

import { GameStats, GameMode } from '@shared/types';
import { Achievement } from '@shared/types/ui';
import {
  PlayerDNA,
  TimeAnalytics,
  ScoreAnalytics,
  ComboAnalytics,
  PlacementHeatmap,
  SpecialBlockStats,
  ComparisonData,
  AIInsights,
  AchievementProgress,
  AdvancedAnalytics,
} from '../types/analytics';

interface GameLog {
  id: string;
  mode: GameMode;
  score: number;
  timestamp: number;
  duration: number;
  linesCleared: number;
  maxCombo: number;
  badge?: 'new-record' | 'perfect' | 'comeback' | 'speedrun';
  metadata?: {
    tier?: number;
    skillsUsed?: string[];
  };
}

/**
 * Calculate Player DNA from game stats and logs
 */
export function calculatePlayerDNA(
  stats: GameStats,
  gameLogs: GameLog[]
): PlayerDNA {
  // Calculate skill ratings
  const speed = calculateSpeedRating(gameLogs);
  const accuracy = calculateAccuracyRating(stats, gameLogs);
  const strategy = calculateStrategyRating(stats, gameLogs);
  const consistency = calculateConsistencyRating(gameLogs);
  const adaptability = calculateAdaptabilityRating(gameLogs);

  // Determine play style
  const playStyle = determinePlayStyle({ speed, accuracy, strategy, consistency, adaptability });

  // Identify strengths and weaknesses
  const ratings = { speed, accuracy, strategy, consistency, adaptability };
  const strengths = identifyStrengths(ratings);
  const weaknesses = identifyWeaknesses(ratings);

  // Generate recommendations
  const recommendations = generateRecommendations(ratings, playStyle);

  return {
    playStyle,
    strengths,
    weaknesses,
    recommendations,
    skillRating: { speed, accuracy, strategy, consistency, adaptability },
  };
}

function calculateSpeedRating(gameLogs: GameLog[]): number {
  if (gameLogs.length === 0) return 50;
  
  // Average game duration (shorter = higher rating)
  const avgDuration = gameLogs.reduce((sum, log) => sum + log.duration, 0) / gameLogs.length;
  const speedScore = Math.max(0, Math.min(100, 100 - (avgDuration / 60) * 10)); // 60s = 90 points
  
  return Math.round(speedScore);
}

function calculateAccuracyRating(stats: GameStats, gameLogs: GameLog[]): number {
  if (stats.gamesPlayed === 0) return 50;
  
  // Lines cleared per block placed
  const efficiency = stats.blocksPlaced > 0 ? (stats.linesCleared / stats.blocksPlaced) * 100 : 0;
  const accuracyScore = Math.min(100, efficiency * 50); // 2% efficiency = 100 points
  
  return Math.round(accuracyScore);
}

function calculateStrategyRating(stats: GameStats, gameLogs: GameLog[]): number {
  if (gameLogs.length === 0) return 50;
  
  // Average combo and tier progression
  const avgCombo = gameLogs.reduce((sum, log) => sum + log.maxCombo, 0) / gameLogs.length;
  const avgTier = gameLogs.reduce((sum, log) => sum + (log.metadata?.tier || 0), 0) / gameLogs.length;
  
  const strategyScore = Math.min(100, (avgCombo * 5) + (avgTier * 10));
  
  return Math.round(strategyScore);
}

function calculateConsistencyRating(gameLogs: GameLog[]): number {
  if (gameLogs.length < 3) return 50;
  
  // Calculate score standard deviation
  const scores = gameLogs.map(log => log.score);
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower std dev = higher consistency
  const consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / avg) * 100));
  
  return Math.round(consistencyScore);
}

function calculateAdaptabilityRating(gameLogs: GameLog[]): number {
  if (gameLogs.length === 0) return 50;
  
  // Check mode diversity and performance across modes
  const modeScores: Record<GameMode, number[]> = {
    [GameMode.ENDLESS]: [],
    [GameMode.TIMED]: [],
    [GameMode.DAILY_CHALLENGE]: [],
  };
  
  gameLogs.forEach(log => {
    modeScores[log.mode].push(log.score);
  });
  
  const modesPlayed = Object.values(modeScores).filter(scores => scores.length > 0).length;
  const adaptabilityScore = (modesPlayed / 3) * 100;
  
  return Math.round(adaptabilityScore);
}

function determinePlayStyle(ratings: PlayerDNA['skillRating']): PlayerDNA['playStyle'] {
  const { speed, accuracy, strategy, consistency } = ratings;
  
  if (speed > 70 && accuracy < 60) return 'aggressive';
  if (accuracy > 70 && speed < 60) return 'defensive';
  if (strategy > 70 && consistency > 70) return 'strategic';
  return 'balanced';
}

function identifyStrengths(ratings: PlayerDNA['skillRating']): string[] {
  const strengths: string[] = [];
  
  if (ratings.speed >= 80) strengths.push('Lightning Fast');
  if (ratings.accuracy >= 80) strengths.push('Precision Master');
  if (ratings.strategy >= 80) strengths.push('Strategic Genius');
  if (ratings.consistency >= 80) strengths.push('Rock Solid');
  if (ratings.adaptability >= 80) strengths.push('Versatile Player');
  
  if (ratings.speed >= 70 && ratings.speed < 80) strengths.push('Quick Thinker');
  if (ratings.accuracy >= 70 && ratings.accuracy < 80) strengths.push('Accurate Placer');
  if (ratings.strategy >= 70 && ratings.strategy < 80) strengths.push('Tactical Mind');
  
  return strengths.length > 0 ? strengths : ['Developing Skills'];
}

function identifyWeaknesses(ratings: PlayerDNA['skillRating']): string[] {
  const weaknesses: string[] = [];
  
  if (ratings.speed < 40) weaknesses.push('Needs Speed');
  if (ratings.accuracy < 40) weaknesses.push('Placement Issues');
  if (ratings.strategy < 40) weaknesses.push('Lacks Planning');
  if (ratings.consistency < 40) weaknesses.push('Inconsistent');
  if (ratings.adaptability < 40) weaknesses.push('Limited Modes');
  
  return weaknesses;
}

function generateRecommendations(
  ratings: PlayerDNA['skillRating'],
  playStyle: PlayerDNA['playStyle']
): string[] {
  const recommendations: string[] = [];
  
  if (ratings.speed < 60) {
    recommendations.push('Practice quick decision making in Timed mode');
  }
  if (ratings.accuracy < 60) {
    recommendations.push('Focus on optimal block placement');
  }
  if (ratings.strategy < 60) {
    recommendations.push('Plan ahead - look at next pieces');
  }
  if (ratings.consistency < 60) {
    recommendations.push('Maintain steady performance across games');
  }
  if (ratings.adaptability < 60) {
    recommendations.push('Try different game modes');
  }
  
  // Play style specific recommendations
  if (playStyle === 'aggressive') {
    recommendations.push('Balance speed with accuracy for better scores');
  } else if (playStyle === 'defensive') {
    recommendations.push('Increase pace to maximize combo opportunities');
  }
  
  return recommendations.length > 0 ? recommendations : ['Keep playing to unlock insights!'];
}

/**
 * Calculate Time Analytics
 */
export function calculateTimeAnalytics(gameLogs: GameLog[]): TimeAnalytics {
  if (gameLogs.length === 0) {
    return {
      peakPerformanceTime: 'N/A',
      averageSessionDuration: 0,
      longestSession: 0,
      totalPlaytime: 0,
      playFrequency: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      },
      hourlyDistribution: new Array(24).fill(0),
      dailyHeatmap: [],
    };
  }
  
  // Calculate total playtime
  const totalPlaytime = gameLogs.reduce((sum, log) => sum + log.duration, 0);
  const averageSessionDuration = totalPlaytime / gameLogs.length;
  const longestSession = Math.max(...gameLogs.map(log => log.duration));
  
  // Calculate hourly distribution
  const hourlyDistribution = new Array(24).fill(0);
  const hourlyScores = new Array(24).fill(0);
  
  gameLogs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourlyDistribution[hour]++;
    hourlyScores[hour] += log.score;
  });
  
  // Find peak performance time
  const avgScoreByHour = hourlyScores.map((total, hour) => 
    hourlyDistribution[hour] > 0 ? total / hourlyDistribution[hour] : 0
  );
  const peakHour = avgScoreByHour.indexOf(Math.max(...avgScoreByHour));
  const peakPerformanceTime = `${peakHour.toString().padStart(2, '0')}:00-${((peakHour + 1) % 24).toString().padStart(2, '0')}:00`;
  
  // Calculate play frequency by day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const playFrequency = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  };
  
  gameLogs.forEach(log => {
    const day = new Date(log.timestamp).getDay();
    playFrequency[dayNames[day]]++;
  });
  
  // Calculate daily heatmap (last 90 days)
  const dailyHeatmap: TimeAnalytics['dailyHeatmap'] = [];
  const now = Date.now();
  const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(ninetyDaysAgo + (i * 24 * 60 * 60 * 1000));
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = gameLogs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return logDate === dateStr;
    });
    
    dailyHeatmap.push({
      date: dateStr,
      count: dayLogs.length,
      score: dayLogs.reduce((sum, log) => sum + log.score, 0),
    });
  }
  
  return {
    peakPerformanceTime,
    averageSessionDuration: Math.round(averageSessionDuration),
    longestSession: Math.round(longestSession),
    totalPlaytime: Math.round(totalPlaytime),
    playFrequency,
    hourlyDistribution,
    dailyHeatmap,
  };
}

/**
 * Calculate Score Analytics
 */
function calculateScoreAnalytics(gameLogs: GameLog[]): ScoreAnalytics {
  if (gameLogs.length === 0) {
    return {
      scoreProgression: [],
      personalBests: { allTime: 0, thisWeek: 0, thisMonth: 0, today: 0 },
      scoreConsistency: 0,
      averageScoreByMode: {
        [GameMode.ENDLESS]: 0,
        [GameMode.TIMED]: 0,
        [GameMode.DAILY_CHALLENGE]: 0,
      },
      scoreBreakdown: { fromBlocks: 25, fromLines: 40, fromCombos: 25, fromBonuses: 10 },
      milestones: [],
    };
  }
  
  // Score progression
  const sortedLogs = [...gameLogs].sort((a, b) => a.timestamp - b.timestamp);
  const scoreProgression = sortedLogs.map((log, index) => {
    const prevScore = index > 0 ? sortedLogs[index - 1].score : log.score;
    const trend: 'up' | 'down' | 'stable' = 
      log.score > prevScore ? 'up' : log.score < prevScore ? 'down' : 'stable';
    
    return {
      date: new Date(log.timestamp).toISOString().split('T')[0],
      score: log.score,
      trend,
    };
  });
  
  // Personal bests
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  const allTime = Math.max(...gameLogs.map(log => log.score));
  const today = Math.max(0, ...gameLogs.filter(log => log.timestamp >= oneDayAgo).map(log => log.score));
  const thisWeek = Math.max(0, ...gameLogs.filter(log => log.timestamp >= oneWeekAgo).map(log => log.score));
  const thisMonth = Math.max(0, ...gameLogs.filter(log => log.timestamp >= oneMonthAgo).map(log => log.score));
  
  // Score consistency
  const scores = gameLogs.map(log => log.score);
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const scoreConsistency = Math.max(0, Math.min(100, 100 - (stdDev / avg) * 100));
  
  // Average score by mode
  const averageScoreByMode = {
    [GameMode.ENDLESS]: 0,
    [GameMode.TIMED]: 0,
    [GameMode.DAILY_CHALLENGE]: 0,
  };
  
  Object.keys(averageScoreByMode).forEach(mode => {
    const modeLogs = gameLogs.filter(log => log.mode === mode);
    if (modeLogs.length > 0) {
      averageScoreByMode[mode as GameMode] = 
        modeLogs.reduce((sum, log) => sum + log.score, 0) / modeLogs.length;
    }
  });
  
  // Milestones
  const milestones = gameLogs
    .filter(log => log.badge === 'new-record')
    .map(log => ({
      date: new Date(log.timestamp).toISOString().split('T')[0],
      score: log.score,
      achievement: 'New Personal Best!',
    }))
    .slice(-10); // Last 10 milestones
  
  return {
    scoreProgression,
    personalBests: { allTime, thisWeek, thisMonth, today },
    scoreConsistency: Math.round(scoreConsistency),
    averageScoreByMode,
    scoreBreakdown: { fromBlocks: 25, fromLines: 40, fromCombos: 25, fromBonuses: 10 },
    milestones,
  };
}

/**
 * Calculate Combo Analytics
 */
function calculateComboAnalytics(stats: GameStats, gameLogs: GameLog[]): ComboAnalytics {
  if (gameLogs.length === 0) {
    return {
      maxCombo: 0,
      averageCombo: 0,
      comboDistribution: {},
      comboBreakReasons: { timeout: 0, noLines: 0, gameOver: 0 },
      chainReactionStats: { totalChains: 0, averageChainLength: 0, maxChainLength: 0 },
      comboEfficiency: 0,
    };
  }
  
  const maxCombo = Math.max(...gameLogs.map(log => log.maxCombo));
  const averageCombo = gameLogs.reduce((sum, log) => sum + log.maxCombo, 0) / gameLogs.length;
  
  // Combo distribution
  const comboDistribution: Record<number, number> = {};
  gameLogs.forEach(log => {
    const comboLevel = Math.floor(log.maxCombo / 5) * 5; // Group by 5s
    comboDistribution[comboLevel] = (comboDistribution[comboLevel] || 0) + 1;
  });
  
  // Combo efficiency (% of games with 5+ combo)
  const gamesWithGoodCombo = gameLogs.filter(log => log.maxCombo >= 5).length;
  const comboEfficiency = (gamesWithGoodCombo / gameLogs.length) * 100;
  
  return {
    maxCombo,
    averageCombo: Math.round(averageCombo * 10) / 10,
    comboDistribution,
    comboBreakReasons: { timeout: 0, noLines: 0, gameOver: 0 }, // TODO: Track this
    chainReactionStats: { totalChains: 0, averageChainLength: 0, maxChainLength: 0 }, // TODO: Track this
    comboEfficiency: Math.round(comboEfficiency),
  };
}

/**
 * Calculate Placement Heatmap
 */
function calculatePlacementHeatmap(stats: GameStats): PlacementHeatmap {
  // TODO: Need to track placement positions in game logs
  // For now, return mock data
  const gridHeatmap = Array(10).fill(null).map(() => Array(10).fill(0));
  
  return {
    gridHeatmap,
    favoritePositions: [],
    avoidedPositions: [],
    placementSpeed: { average: 0, fastest: 0, slowest: 0 },
    placementAccuracy: 0,
  };
}

/**
 * Calculate Special Block Stats
 */
function calculateSpecialBlockStats(stats: GameStats): SpecialBlockStats {
  return {
    bombStats: {
      totalExploded: stats.bombsExploded || 0,
      averageImpact: stats.bombsExploded > 0 ? 8 : 0, // Estimate
      chainBombs: 0, // TODO: Track this
      wastedBombs: 0, // TODO: Track this
    },
    iceStats: {
      totalBroken: stats.iceBroken || 0,
      averageBreakTime: 2, // Estimate
      iceChains: 0, // TODO: Track this
    },
    specialBlockEfficiency: 70, // Estimate
  };
}

/**
 * Calculate Comparison Data
 */
function calculateComparisonData(stats: GameStats, gameLogs: GameLog[]): ComparisonData {
  // Mock global averages
  const globalAvgScore = 2500;
  const globalAvgCombo = 5;
  const globalAvgSpeed = 120; // seconds
  
  const userAvgScore = gameLogs.length > 0 
    ? gameLogs.reduce((sum, log) => sum + log.score, 0) / gameLogs.length 
    : 0;
  const userAvgCombo = gameLogs.length > 0
    ? gameLogs.reduce((sum, log) => sum + log.maxCombo, 0) / gameLogs.length
    : 0;
  const userAvgSpeed = gameLogs.length > 0
    ? gameLogs.reduce((sum, log) => sum + log.duration, 0) / gameLogs.length
    : 0;
  
  return {
    vsGlobalAverage: {
      score: ((userAvgScore - globalAvgScore) / globalAvgScore) * 100,
      combo: ((userAvgCombo - globalAvgCombo) / globalAvgCombo) * 100,
      speed: ((globalAvgSpeed - userAvgSpeed) / globalAvgSpeed) * 100, // Inverted (faster is better)
    },
    vsTopPlayers: {
      percentile: 50, // TODO: Calculate from leaderboard
      rank: 0,
      gap: 0,
    },
    vsPreviousWeek: {
      scoreChange: 0, // TODO: Calculate
      comboChange: 0,
      improvementAreas: [],
    },
    vsPersonalBest: {
      currentStreak: 0,
      daysFromPB: 0,
      progressToNewPB: 0,
    },
  };
}

/**
 * Generate AI Insights
 */
function generateAIInsights(stats: GameStats, gameLogs: GameLog[]): AIInsights {
  const strengths: AIInsights['strengths'] = [];
  const improvements: AIInsights['improvements'] = [];
  const patterns: AIInsights['patterns'] = [];
  
  // Analyze strengths
  if (stats.endlessMaxCombo && stats.endlessMaxCombo >= 10) {
    strengths.push({
      title: 'Combo Master',
      description: `You've achieved ${stats.endlessMaxCombo}x combo! Excellent chain building.`,
      confidence: 90,
    });
  }
  
  if (stats.gamesPlayed >= 50) {
    strengths.push({
      title: 'Dedicated Player',
      description: `${stats.gamesPlayed} games played shows great commitment!`,
      confidence: 100,
    });
  }
  
  // Analyze improvements
  if (stats.endlessMaxCombo && stats.endlessMaxCombo < 5) {
    improvements.push({
      title: 'Improve Combo Skills',
      suggestion: 'Focus on clearing multiple lines in succession',
      potentialGain: '+500 points per game',
      priority: 'high',
    });
  }
  
  if (stats.gamesPlayed < 10) {
    improvements.push({
      title: 'Play More Games',
      suggestion: 'More practice will unlock better insights',
      potentialGain: 'Better analytics',
      priority: 'medium',
    });
  }
  
  // Detect patterns
  if (gameLogs.length >= 5) {
    const recentScores = gameLogs.slice(-5).map(log => log.score);
    const isImproving = recentScores.every((score, i) => i === 0 || score >= recentScores[i - 1]);
    
    if (isImproving) {
      patterns.push({
        type: 'positive',
        description: 'Consistent score improvement in recent games',
        frequency: 5,
      });
    }
  }
  
  return {
    strengths,
    improvements,
    predictions: {
      nextMilestone: '5000 points',
      estimatedDate: 'Within 10 games',
      confidence: 75,
    },
    patterns,
  };
}

/**
 * Calculate Achievement Progress
 */
function calculateAchievementProgress(achievements: Achievement[]): AchievementProgress {
  const nearCompletion = achievements.filter(ach => {
    const progress = (ach.targetValue && ach.targetValue > 0 && ach.currentValue !== undefined)
      ? (ach.currentValue / ach.targetValue) * 100 
      : 0;
    return progress >= 80 && progress < 100;
  });
  
  const recentlyUnlocked = achievements
    .filter(ach => ach.status === 'unlocked')
    .slice(-5); // Last 5 unlocked
  
  const rarest = achievements
    .filter(ach => ach.hidden || ach.status === 'unlocked')
    .slice(0, 3); // Top 3 rarest
  
  const nextMilestone = achievements
    .filter(ach => ach.status !== 'unlocked')
    .sort((a, b) => {
      const progressA = (a.targetValue && a.targetValue > 0 && a.currentValue !== undefined) 
        ? (a.currentValue / a.targetValue) 
        : 0;
      const progressB = (b.targetValue && b.targetValue > 0 && b.currentValue !== undefined) 
        ? (b.currentValue / b.targetValue) 
        : 0;
      return progressB - progressA;
    })[0];
  
  const completionRate = achievements.length > 0
    ? (achievements.filter(ach => ach.status === 'unlocked').length / achievements.length) * 100
    : 0;
  
  const categoryProgress: Record<string, number> = {};
  const categories = [...new Set(achievements.map(ach => ach.category || 'OTHER'))];
  
  categories.forEach(category => {
    const categoryAchs = achievements.filter(ach => (ach.category || 'OTHER') === category);
    const unlockedCount = categoryAchs.filter(ach => ach.status === 'unlocked').length;
    categoryProgress[category] = categoryAchs.length > 0 
      ? (unlockedCount / categoryAchs.length) * 100 
      : 0;
  });
  
  return {
    nearCompletion,
    recentlyUnlocked,
    rarest,
    nextMilestone: nextMilestone ? {
      achievement: nextMilestone,
      progress: (nextMilestone.targetValue && nextMilestone.targetValue > 0 && nextMilestone.currentValue !== undefined)
        ? (nextMilestone.currentValue / nextMilestone.targetValue) * 100 
        : 0,
      estimatedGames: (nextMilestone.targetValue && nextMilestone.currentValue !== undefined)
        ? Math.ceil((nextMilestone.targetValue - nextMilestone.currentValue) / 10)
        : 0,
    } : null,
    completionRate: Math.round(completionRate),
    categoryProgress,
  };
}

/**
 * Calculate all advanced analytics
 */
export function calculateAdvancedAnalytics(
  stats: GameStats,
  gameLogs: GameLog[],
  achievements: Achievement[]
): AdvancedAnalytics {
  return {
    playerDNA: calculatePlayerDNA(stats, gameLogs),
    timeAnalytics: calculateTimeAnalytics(gameLogs),
    scoreAnalytics: calculateScoreAnalytics(gameLogs),
    comboAnalytics: calculateComboAnalytics(stats, gameLogs),
    placementHeatmap: calculatePlacementHeatmap(stats),
    specialBlockStats: calculateSpecialBlockStats(stats),
    comparisonData: calculateComparisonData(stats, gameLogs),
    aiInsights: generateAIInsights(stats, gameLogs),
    achievementProgress: calculateAchievementProgress(achievements),
  };
}
