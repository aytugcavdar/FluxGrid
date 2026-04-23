/**
 * Structured Logging System
 * 
 * Provides centralized logging with levels, categories, and rate limiting.
 * Integrates with Crash Reporter for critical errors.
 * 
 * Features:
 * - Log levels (DEBUG, INFO, WARN, ERROR, CRITICAL)
 * - Log categories (STORAGE, GAME_STATE, NETWORK, RENDER, AUDIO)
 * - Rate limiting to prevent log spam
 * - Production mode filtering (no DEBUG logs)
 * - Crash Reporter integration for CRITICAL errors
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

// Log categories
export enum LogCategory {
  STORAGE = 'STORAGE',
  GAME_STATE = 'GAME_STATE',
  NETWORK = 'NETWORK',
  RENDER = 'RENDER',
  AUDIO = 'AUDIO',
  ANALYTICS = 'ANALYTICS',
  ADS = 'ADS',
  GDPR = 'GDPR',
  PERFORMANCE = 'PERFORMANCE',
  GENERAL = 'GENERAL',
}

// Log entry
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  stack?: string;
}

// Logger configuration
export interface LoggerConfig {
  minLevel: LogLevel; // Minimum level to log
  enableConsole: boolean; // Log to console
  enableStorage: boolean; // Store logs in memory
  maxStoredLogs: number; // Maximum logs to store
  rateLimitMs: number; // Rate limit per category (ms)
  rateLimitCount: number; // Max logs per rate limit window
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableStorage: true,
  maxStoredLogs: 1000,
  rateLimitMs: 1000, // 1 second
  rateLimitCount: 10, // 10 logs per second per category
};

// Rate limit tracking
interface RateLimitState {
  count: number;
  windowStart: number;
}

/**
 * Logger Class
 * Centralized logging system with levels, categories, and rate limiting
 */
export class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private rateLimits: Map<string, RateLimitState> = new Map();
  private crashReporter: any = null; // Will be set via setCrashReporter

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set crash reporter for CRITICAL error integration
   */
  public setCrashReporter(crashReporter: any): void {
    this.crashReporter = crashReporter;
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any, category: LogCategory = LogCategory.GENERAL): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any, category: LogCategory = LogCategory.GENERAL): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: any, category: LogCategory = LogCategory.GENERAL): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Log error message
   */
  public error(message: string, data?: any, category: LogCategory = LogCategory.GENERAL): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  /**
   * Log critical error (sends to Crash Reporter)
   */
  public critical(message: string, data?: any, category: LogCategory = LogCategory.GENERAL): void {
    this.log(LogLevel.CRITICAL, category, message, data);

    // Send to Crash Reporter if available
    if (this.crashReporter) {
      try {
        const error = new Error(message);
        this.crashReporter.logError(error, {
          category,
          data: JSON.stringify(data),
          level: 'CRITICAL',
        });
      } catch (err) {
        console.error('[Logger] Failed to send to Crash Reporter:', err);
      }
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
    // Check minimum level
    if (level < this.config.minLevel) {
      return;
    }

    // Check rate limit
    if (!this.checkRateLimit(category)) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };

    // Add stack trace for errors
    if (level >= LogLevel.ERROR) {
      entry.stack = new Error().stack;
    }

    // Store log
    if (this.config.enableStorage) {
      this.logs.push(entry);

      // Trim logs if exceeds max
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs.shift();
      }
    }

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }
  }

  /**
   * Check rate limit for category
   */
  private checkRateLimit(category: LogCategory): boolean {
    const key = category;
    const now = Date.now();
    const state = this.rateLimits.get(key);

    if (!state) {
      // First log in this category
      this.rateLimits.set(key, {
        count: 1,
        windowStart: now,
      });
      return true;
    }

    // Check if window expired
    if (now - state.windowStart >= this.config.rateLimitMs) {
      // Reset window
      state.count = 1;
      state.windowStart = now;
      return true;
    }

    // Check if limit reached
    if (state.count >= this.config.rateLimitCount) {
      return false; // Rate limited
    }

    // Increment count
    state.count++;
    return true;
  }

  /**
   * Log to console with appropriate styling
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.category}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.data || '');
        if (entry.stack) {
          console.error('Stack:', entry.stack);
        }
        break;
      case LogLevel.CRITICAL:
        console.error('🚨', prefix, entry.message, entry.data || '');
        if (entry.stack) {
          console.error('Stack:', entry.stack);
        }
        break;
    }
  }

  /**
   * Get all stored logs
   */
  public getLogs(filter?: {
    level?: LogLevel;
    category?: LogCategory;
    since?: number; // timestamp
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.level !== undefined) {
        filtered = filtered.filter((log) => log.level >= filter.level!);
      }
      if (filter.category) {
        filtered = filtered.filter((log) => log.category === filter.category);
      }
      if (filter.since) {
        filtered = filtered.filter((log) => log.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    errorRate: number; // errors per minute
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentLogs = this.logs.filter((log) => log.timestamp >= oneMinuteAgo);
    const recentErrors = recentLogs.filter((log) => log.level >= LogLevel.ERROR);

    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.logs.forEach((log) => {
      if (log.level >= LogLevel.ERROR) {
        const levelName = LogLevel[log.level];
        byLevel[levelName] = (byLevel[levelName] || 0) + 1;
        byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      }
    });

    return {
      total: this.logs.filter((log) => log.level >= LogLevel.ERROR).length,
      byLevel,
      byCategory,
      errorRate: recentErrors.length, // errors in last minute
    };
  }

  /**
   * Clear all stored logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  public exportLogsCSV(): string {
    const header = 'Timestamp,Level,Category,Message,Data\n';
    const rows = this.logs.map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const level = LogLevel[log.level];
      const data = log.data ? JSON.stringify(log.data).replace(/"/g, '""') : '';
      const message = log.message.replace(/"/g, '""');
      return `"${timestamp}","${level}","${log.category}","${message}","${data}"`;
    });
    return header + rows.join('\n');
  }

  /**
   * Create a category-specific logger
   */
  public forCategory(category: LogCategory): CategoryLogger {
    return new CategoryLogger(this, category);
  }
}

/**
 * Category-specific loggers
 * Provides convenient loggers for each category
 */
export class CategoryLogger {
  constructor(
    private logger: Logger,
    private category: LogCategory
  ) {}

  public debug(message: string, data?: any): void {
    this.logger.debug(message, data, this.category);
  }

  public info(message: string, data?: any): void {
    this.logger.info(message, data, this.category);
  }

  public warn(message: string, data?: any): void {
    this.logger.warn(message, data, this.category);
  }

  public error(message: string, data?: any): void {
    this.logger.error(message, data, this.category);
  }

  public critical(message: string, data?: any): void {
    this.logger.critical(message, data, this.category);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export category-specific loggers
export const storageLogger = new CategoryLogger(logger, LogCategory.STORAGE);
export const gameStateLogger = new CategoryLogger(logger, LogCategory.GAME_STATE);
export const networkLogger = new CategoryLogger(logger, LogCategory.NETWORK);
export const renderLogger = new CategoryLogger(logger, LogCategory.RENDER);
export const audioLogger = new CategoryLogger(logger, LogCategory.AUDIO);
export const analyticsLogger = new CategoryLogger(logger, LogCategory.ANALYTICS);
export const adsLogger = new CategoryLogger(logger, LogCategory.ADS);
export const gdprLogger = new CategoryLogger(logger, LogCategory.GDPR);
export const performanceLogger = new CategoryLogger(logger, LogCategory.PERFORMANCE);
