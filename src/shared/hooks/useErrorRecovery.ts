/**
 * Error Recovery Hook
 * 
 * React hook for managing error recovery UI state and actions.
 * Provides a simple API for showing error messages and handling recovery.
 * 
 * Requirements: 2.6, 10.8, 10.9
 */

import { useState, useCallback, useEffect } from 'react';
import { errorHandler, ErrorCategory, ErrorSeverity, GameError } from '@/src/utils/managers/errorHandler';

export interface ErrorRecoveryState {
  error: GameError | null;
  isVisible: boolean;
}

export interface ErrorRecoveryActions {
  showError: (error: Error, category: ErrorCategory, severity: ErrorSeverity) => void;
  dismissError: () => void;
  retryLastAction: () => void;
  reloadPage: () => void;
}

export function useErrorRecovery(
  onRetry?: () => void
): [ErrorRecoveryState, ErrorRecoveryActions] {
  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isVisible: false,
  });

  // Listen to error handler events
  useEffect(() => {
    const unsubscribe = errorHandler.onError((gameError) => {
      // Only show UI for medium and high severity errors
      if (
        gameError.severity === ErrorSeverity.MEDIUM ||
        gameError.severity === ErrorSeverity.HIGH ||
        gameError.severity === ErrorSeverity.CRITICAL
      ) {
        setState({
          error: gameError,
          isVisible: true,
        });
      }
    });

    return unsubscribe;
  }, []);

  const showError = useCallback(
    (error: Error, category: ErrorCategory, severity: ErrorSeverity) => {
      const gameError = errorHandler.handleError(error, category, severity);
      setState({
        error: gameError,
        isVisible: true,
      });
    },
    []
  );

  const dismissError = useCallback(() => {
    setState({
      error: null,
      isVisible: false,
    });
  }, []);

  const retryLastAction = useCallback(() => {
    dismissError();
    onRetry?.();
  }, [dismissError, onRetry]);

  const reloadPage = useCallback(() => {
    window.location.reload();
  }, []);

  return [
    state,
    {
      showError,
      dismissError,
      retryLastAction,
      reloadPage,
    },
  ];
}
