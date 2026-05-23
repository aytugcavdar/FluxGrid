/**
 * Game Event Tracking
 * 
 * Predefined game events for analytics tracking.
 * Includes game lifecycle, ability usage, and session tracking.
 * 
 * Requirements: 3.2, 3.3, 3.5, 3.6
 */

import { analyticsService, EventParams } from './analyticsService';

/**
 * Game event names (following Firebase Analytics naming conventions)
 */
export const GameEvents = {
  // Game lifecycle
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  GAME_PAUSE: 'game_pause',
  GAME_RESUME: 'game_resume',
  
  // Level/Score events
  LEVEL_COMPLETE: 'level_complete',
  LEVEL_UP: 'level_up',
  SCORE_MILESTONE: 'score_milestone',
  HIGH_SCORE: 'high_score',
  
  // Ability events
  ABILITY_USED: 'ability_used',
  ABILITY_UNLOCKED: 'ability_unlocked',
  
  // Game mechanics
  LINE_CLEARED: 'line_cleared',
  COMBO_ACHIEVED: 'combo_achieved',
  CHAIN_ACHIEVED: 'chain_achieved',
  PERFECT_PLACEMENT: 'perfect_placement',
  
  // Session events
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
} as const;

/**
 * Ability types for tracking
 */
export enum AbilityType {
  SURGE = 'surge',
  PERFECT_BONUS = 'perfect_bonus',
  CHAIN_MASTER = 'chain_master',
  COMBO_KING = 'combo_king',
}

/**
 * Game event tracker
 * Provides convenient methods for logging game-specific events
 */
export class GameEventTracker {
  /**
   * Log game start event
   */
  public static logGameStart(params: {
    difficulty?: string;
    mode?: string;
  } = {}): void {
    analyticsService.logEvent(GameEvents.GAME_START, {
      timestamp: Date.now(),
      ...params,
    });
  }

  /**
   * Log game end event
   */
  public static logGameEnd(params: {
    score: number;
    duration: number; // seconds
    linesCleared: number;
    level: number;
    reason?: 'game_over' | 'quit' | 'completed';
  }): void {
    analyticsService.logEvent(GameEvents.GAME_END, {
      score: params.score,
      duration: params.duration,
      lines_cleared: params.linesCleared,
      level: params.level,
      reason: params.reason || 'game_over',
      timestamp: Date.now(),
    });
  }

  /**
   * Log game pause event
   */
  public static logGamePause(params: {
    score: number;
    level: number;
    duration: number; // seconds since game start
  }): void {
    analyticsService.logEvent(GameEvents.GAME_PAUSE, {
      score: params.score,
      level: params.level,
      duration: params.duration,
      timestamp: Date.now(),
    });
  }

  /**
   * Log game resume event
   */
  public static logGameResume(params: {
    score: number;
    level: number;
    pauseDuration: number; // seconds paused
  }): void {
    analyticsService.logEvent(GameEvents.GAME_RESUME, {
      score: params.score,
      level: params.level,
      pause_duration: params.pauseDuration,
      timestamp: Date.now(),
    });
  }

  /**
   * Log level complete event
   */
  public static logLevelComplete(params: {
    level: number;
    score: number;
    duration: number; // seconds
    linesCleared: number;
  }): void {
    analyticsService.logEvent(GameEvents.LEVEL_COMPLETE, {
      level: params.level,
      score: params.score,
      duration: params.duration,
      lines_cleared: params.linesCleared,
      timestamp: Date.now(),
    });
  }

  /**
   * Log level up event
   */
  public static logLevelUp(params: {
    level: number;
    score: number;
  }): void {
    analyticsService.logEvent(GameEvents.LEVEL_UP, {
      level: params.level,
      score: params.score,
      timestamp: Date.now(),
    });
  }

  /**
   * Log score milestone event
   */
  public static logScoreMilestone(params: {
    milestone: number; // e.g., 1000, 5000, 10000
    score: number;
    level: number;
  }): void {
    analyticsService.logEvent(GameEvents.SCORE_MILESTONE, {
      milestone: params.milestone,
      score: params.score,
      level: params.level,
      timestamp: Date.now(),
    });
  }

  /**
   * Log high score event
   */
  public static logHighScore(params: {
    score: number;
    previousHighScore: number;
    level: number;
  }): void {
    analyticsService.logEvent(GameEvents.HIGH_SCORE, {
      score: params.score,
      previous_high_score: params.previousHighScore,
      level: params.level,
      improvement: params.score - params.previousHighScore,
      timestamp: Date.now(),
    });
  }

  /**
   * Log ability used event
   */
  public static logAbilityUsed(params: {
    abilityType: AbilityType | string;
    level: number;
    score: number;
    success?: boolean;
  }): void {
    analyticsService.logEvent(GameEvents.ABILITY_USED, {
      ability_type: params.abilityType,
      level: params.level,
      score: params.score,
      success: params.success ?? true,
      timestamp: Date.now(),
    });
  }

  /**
   * Log ability unlocked event
   */
  public static logAbilityUnlocked(params: {
    abilityType: AbilityType | string;
    level: number;
  }): void {
    analyticsService.logEvent(GameEvents.ABILITY_UNLOCKED, {
      ability_type: params.abilityType,
      level: params.level,
      timestamp: Date.now(),
    });
  }

  /**
   * Log line cleared event
   */
  public static logLineCleared(params: {
    linesCleared: number; // number of lines cleared at once
    totalLines: number; // total lines cleared in game
    score: number;
    level: number;
  }): void {
    analyticsService.logEvent(GameEvents.LINE_CLEARED, {
      lines_cleared: params.linesCleared,
      total_lines: params.totalLines,
      score: params.score,
      level: params.level,
      timestamp: Date.now(),
    });
  }

  /**
   * Log combo achieved event
   */
  public static logComboAchieved(params: {
    comboCount: number;
    score: number;
    level: number;
  }): void {
    analyticsService.logEvent(GameEvents.COMBO_ACHIEVED, {
      combo_count: params.comboCount,
      score: params.score,
      level: params.level,
      timestamp: Date.now(),
    });
  }

  /**
   * Log chain achieved event
   */
  public static logChainAchieved(params: {
    chainLength: number;
    score: number;
    level: number;
  }): void {
    analyticsService.logEvent(GameEvents.CHAIN_ACHIEVED, {
      chain_length: params.chainLength,
      score: params.score,
      level: params.level,
      timestamp: Date.now(),
    });
  }

  /**
   * Log perfect placement event
   */
  public static logPerfectPlacement(params: {
    score: number;
    level: number;
    consecutivePerfect?: number;
  }): void {
    analyticsService.logEvent(GameEvents.PERFECT_PLACEMENT, {
      score: params.score,
      level: params.level,
      consecutive_perfect: params.consecutivePerfect || 1,
      timestamp: Date.now(),
    });
  }

  /**
   * Track session duration
   * Call this periodically (e.g., every minute) to track engagement
   */
  public static trackSessionDuration(): void {
    const duration = analyticsService.getSessionDuration();
    
    // Log session duration milestones (1 min, 5 min, 10 min, 30 min, 1 hour)
    const milestones = [60, 300, 600, 1800, 3600];
    const lastMilestone = milestones.find(m => duration >= m && duration < m + 60);
    
    if (lastMilestone) {
      analyticsService.logEvent('session_duration_milestone', {
        duration: lastMilestone,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Set game-specific user properties
   */
  public static setGameUserProperties(properties: {
    totalGamesPlayed?: number;
    highScore?: number;
    totalPlayTime?: number; // seconds
    favoriteAbility?: AbilityType | string;
    skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }): void {
    if (properties.totalGamesPlayed !== undefined) {
      analyticsService.setUserProperty('total_games_played', properties.totalGamesPlayed);
    }
    
    if (properties.highScore !== undefined) {
      analyticsService.setUserProperty('high_score', properties.highScore);
    }
    
    if (properties.totalPlayTime !== undefined) {
      analyticsService.setUserProperty('total_play_time', properties.totalPlayTime);
    }
    
    if (properties.favoriteAbility) {
      analyticsService.setUserProperty('favorite_ability', properties.favoriteAbility);
    }
    
    if (properties.skillLevel) {
      analyticsService.setUserProperty('skill_level', properties.skillLevel);
    }
  }

  /**
   * Calculate and set skill level based on performance
   */
  public static calculateAndSetSkillLevel(params: {
    highScore: number;
    totalGamesPlayed: number;
    averageScore: number;
  }): void {
    let skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
    
    if (params.totalGamesPlayed < 10) {
      skillLevel = 'beginner';
    } else if (params.highScore < 5000 || params.averageScore < 2000) {
      skillLevel = 'beginner';
    } else if (params.highScore < 10000 || params.averageScore < 5000) {
      skillLevel = 'intermediate';
    } else if (params.highScore < 20000 || params.averageScore < 10000) {
      skillLevel = 'advanced';
    } else {
      skillLevel = 'expert';
    }
    
    analyticsService.setUserProperty('skill_level', skillLevel);
  }
}

/**
 * Session tracker
 * Automatically tracks session duration and milestones
 */
export class SessionTracker {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkInterval = 60000; // Check every minute

  /**
   * Start session tracking
   */
  public start(): void {
    if (this.intervalId) {
      return;
    }

    // Track initial session start
    GameEventTracker.trackSessionDuration();

    // Set up periodic tracking
    this.intervalId = setInterval(() => {
      GameEventTracker.trackSessionDuration();
    }, this.checkInterval);
  }

  /**
   * Stop session tracking
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Export singleton session tracker
export const sessionTracker = new SessionTracker();
