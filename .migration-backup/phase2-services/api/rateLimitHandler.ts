/**
 * Rate Limit Error Handler
 * 
 * Handles rate limit errors from Cloud Functions.
 * Displays user-friendly messages and respects Retry-After header.
 * 
 * Requirements: 4.4, 4.6
 */

import { logger, LogCategory } from '../logging/logger';

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number // seconds
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Handle rate limit error from Cloud Function
 * 
 * @param error - Error from Cloud Function
 * @returns RateLimitError if rate limited, null otherwise
 */
export function handleRateLimitError(error: any): RateLimitError | null {
  // Check if error is rate limit (HTTP 429)
  if (error.code === 'resource-exhausted' || error.code === 'unavailable') {
    // Extract retry-after from error details
    const retryAfter = error.details?.retryAfter || 60; // Default 60 seconds
    
    logger.warn('[RateLimit] Rate limit exceeded', {
      retryAfter,
      message: error.message,
    }, LogCategory.GENERAL);
    
    return new RateLimitError(
      'Too many requests. Please try again later.',
      retryAfter
    );
  }
  
  return null;
}

/**
 * Format retry time for user display
 * 
 * @param seconds - Seconds until retry
 * @returns Formatted string (e.g., "1 minute", "30 seconds")
 */
export function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Get user-friendly rate limit message
 * 
 * @param retryAfter - Seconds until retry
 * @returns User-friendly message
 */
export function getRateLimitMessage(retryAfter: number): string {
  const retryTime = formatRetryTime(retryAfter);
  return `You're doing that too often. Please wait ${retryTime} before trying again.`;
}

/**
 * Wait for retry-after duration
 * 
 * @param retryAfter - Seconds to wait
 * @returns Promise that resolves after wait
 */
export function waitForRetry(retryAfter: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, retryAfter * 1000);
  });
}
