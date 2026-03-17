import { FirebaseError } from 'firebase/app';

export interface FirebaseErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  shouldRetry: boolean;
}

/**
 * Parse Firebase error and return user-friendly information
 */
export function parseFirebaseError(error: unknown): FirebaseErrorInfo {
  if (error instanceof FirebaseError) {
    const { code, message } = error;

    switch (code) {
      // Auth errors
      case 'auth/network-request-failed':
        return {
          code,
          message,
          userMessage: 'Network error. Please check your connection and try again.',
          shouldRetry: true,
        };

      case 'auth/too-many-requests':
        return {
          code,
          message,
          userMessage: 'Too many attempts. Please try again later.',
          shouldRetry: false,
        };

      case 'auth/user-disabled':
        return {
          code,
          message,
          userMessage: 'This account has been disabled.',
          shouldRetry: false,
        };

      case 'auth/credential-already-in-use':
        return {
          code,
          message,
          userMessage: 'This Google account is already linked to another user.',
          shouldRetry: false,
        };

      // Firestore errors
      case 'permission-denied':
        return {
          code,
          message,
          userMessage: 'Permission denied. Please sign in and try again.',
          shouldRetry: false,
        };

      case 'unavailable':
        return {
          code,
          message,
          userMessage: 'Service temporarily unavailable. Please try again.',
          shouldRetry: true,
        };

      case 'deadline-exceeded':
        return {
          code,
          message,
          userMessage: 'Request timed out. Please try again.',
          shouldRetry: true,
        };

      case 'resource-exhausted':
        return {
          code,
          message,
          userMessage: 'Quota exceeded. Please try again later.',
          shouldRetry: false,
        };

      case 'not-found':
        return {
          code,
          message,
          userMessage: 'Data not found.',
          shouldRetry: false,
        };

      case 'already-exists':
        return {
          code,
          message,
          userMessage: 'This data already exists.',
          shouldRetry: false,
        };

      default:
        return {
          code,
          message,
          userMessage: 'An error occurred. Please try again.',
          shouldRetry: true,
        };
    }
  }

  // Non-Firebase error
  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.',
    shouldRetry: true,
  };
}

/**
 * Exponential backoff delay calculator
 */
export function calculateBackoffDelay(retryCount: number, baseDelay = 1000): number {
  return Math.min(baseDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorInfo = parseFirebaseError(error);

      // Don't retry if error is not retryable
      if (!errorInfo.shouldRetry) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      const delay = calculateBackoffDelay(attempt, baseDelay);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Log error with context
 */
export function logError(
  operation: string,
  error: unknown,
  context?: Record<string, any>
): void {
  const errorInfo = parseFirebaseError(error);
  
  console.error('Firebase Error:', {
    operation,
    code: errorInfo.code,
    message: errorInfo.message,
    userMessage: errorInfo.userMessage,
    shouldRetry: errorInfo.shouldRetry,
    context,
    timestamp: new Date().toISOString(),
  });
}
