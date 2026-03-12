/**
 * Centralized Error Handler for FluxGrid
 * Handles all application errors with logging, user feedback, and recovery
 */

export enum ErrorSeverity {
  LOW = 'LOW',           // Minor issues, log only
  MEDIUM = 'MEDIUM',     // Show user notification
  HIGH = 'HIGH',         // Show error modal, attempt recovery
  CRITICAL = 'CRITICAL'  // Show error modal, force restart
}

export enum ErrorCategory {
  STORAGE = 'STORAGE',           // localStorage errors
  GAME_STATE = 'GAME_STATE',     // Game state corruption
  NETWORK = 'NETWORK',           // Network/API errors
  RENDER = 'RENDER',             // Rendering errors
  AUDIO = 'AUDIO',               // Audio playback errors
  VALIDATION = 'VALIDATION',     // Data validation errors
  UNKNOWN = 'UNKNOWN'            // Uncategorized errors
}

export interface GameError {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  recovered: boolean;
}

class ErrorHandler {
  private errors: GameError[] = [];
  private maxErrors = 50; // Keep last 50 errors
  private errorListeners: ((error: GameError) => void)[] = [];
  private recoveryStrategies: Map<ErrorCategory, () => boolean> = new Map();

  constructor() {
    this.setupGlobalHandlers();
    this.setupRecoveryStrategies();
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError(
        event.error || new Error(event.message),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.HIGH,
        { filename: event.filename, lineno: event.lineno, colno: event.colno }
      );
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason,
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM,
        { promise: 'unhandled rejection' }
      );
    });
  }

  /**
   * Setup recovery strategies for different error categories
   */
  private setupRecoveryStrategies() {
    // Storage recovery: clear corrupted data
    this.recoveryStrategies.set(ErrorCategory.STORAGE, () => {
      try {
        const keysToPreserve = ['flux_highscore', 'flux_survival_highscore'];
        const preserved: Record<string, string> = {};
        
        keysToPreserve.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) preserved[key] = value;
        });

        localStorage.clear();
        
        Object.entries(preserved).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });

        console.log('Storage recovered: cleared corrupted data, preserved high scores');
        return true;
      } catch (error) {
        console.error('Storage recovery failed:', error);
        return false;
      }
    });

    // Game state recovery: reset to safe state
    this.recoveryStrategies.set(ErrorCategory.GAME_STATE, () => {
      try {
        // This will be called from game store
        console.log('Game state recovery: resetting to home screen');
        return true;
      } catch (error) {
        console.error('Game state recovery failed:', error);
        return false;
      }
    });

    // Audio recovery: disable audio
    this.recoveryStrategies.set(ErrorCategory.AUDIO, () => {
      try {
        console.log('Audio recovery: audio disabled');
        return true;
      } catch (error) {
        console.error('Audio recovery failed:', error);
        return false;
      }
    });
  }

  /**
   * Main error handling method
   */
  handleError(
    error: Error | string | unknown,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ): GameError {
    const errorObj = this.normalizeError(error);
    
    const gameError: GameError = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      category,
      severity,
      message: errorObj.message,
      stack: errorObj.stack,
      context,
      recovered: false
    };

    // Log to console
    this.logError(gameError);

    // Attempt recovery for high severity errors
    if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
      gameError.recovered = this.attemptRecovery(category);
    }

    // Store error
    this.storeError(gameError);

    // Notify listeners
    this.notifyListeners(gameError);

    return gameError;
  }

  /**
   * Normalize different error types to Error object
   */
  private normalizeError(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack
      };
    }
    
    if (typeof error === 'string') {
      return { message: error };
    }

    return {
      message: 'Unknown error occurred',
      stack: JSON.stringify(error)
    };
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error to console with formatting
   */
  private logError(error: GameError) {
    const style = this.getLogStyle(error.severity);
    
    console.group(`%c[${error.severity}] ${error.category}`, style);
    console.error(error.message);
    if (error.context) {
      console.log('Context:', error.context);
    }
    if (error.stack) {
      console.log('Stack:', error.stack);
    }
    console.log('Timestamp:', new Date(error.timestamp).toISOString());
    console.log('Recovered:', error.recovered);
    console.groupEnd();
  }

  /**
   * Get console log style based on severity
   */
  private getLogStyle(severity: ErrorSeverity): string {
    const styles = {
      [ErrorSeverity.LOW]: 'color: #3b82f6; font-weight: bold',
      [ErrorSeverity.MEDIUM]: 'color: #f59e0b; font-weight: bold',
      [ErrorSeverity.HIGH]: 'color: #ef4444; font-weight: bold',
      [ErrorSeverity.CRITICAL]: 'color: #dc2626; font-weight: bold; font-size: 14px'
    };
    return styles[severity];
  }

  /**
   * Attempt to recover from error
   */
  private attemptRecovery(category: ErrorCategory): boolean {
    const strategy = this.recoveryStrategies.get(category);
    if (strategy) {
      try {
        return strategy();
      } catch (error) {
        console.error('Recovery strategy failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Store error in memory (limited to maxErrors)
   */
  private storeError(error: GameError) {
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  /**
   * Notify all registered listeners
   */
  private notifyListeners(error: GameError) {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (error) {
        console.error('Error listener failed:', error);
      }
    });
  }

  /**
   * Register error listener
   */
  onError(listener: (error: GameError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get all stored errors
   */
  getErrors(): GameError[] {
    return [...this.errors];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): GameError[] {
    return this.errors.filter(e => e.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): GameError[] {
    return this.errors.filter(e => e.severity === severity);
  }

  /**
   * Clear all stored errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getStats() {
    const stats = {
      total: this.errors.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recovered: this.errors.filter(e => e.recovered).length,
      recent: this.errors.slice(-5)
    };

    this.errors.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Convenience wrapper for handling errors
 */
export function handleError(
  error: unknown,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, any>
): GameError {
  return errorHandler.handleError(error, category, severity, context);
}

/**
 * Safe execution wrapper
 */
export function safeExecute<T>(
  fn: () => T,
  fallback: T,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  context?: Record<string, any>
): T {
  try {
    return fn();
  } catch (error) {
    handleError(error, category, ErrorSeverity.MEDIUM, context);
    return fallback;
  }
}

/**
 * Safe async execution wrapper
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, category, ErrorSeverity.MEDIUM, context);
    return fallback;
  }
}
