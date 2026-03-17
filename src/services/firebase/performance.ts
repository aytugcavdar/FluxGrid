import { getPerformance, trace, Performance } from 'firebase/performance';
import { app } from './config';

let performance: Performance | null = null;

/**
 * Initialize Firebase Performance Monitoring
 */
export function initializePerformance(): Performance | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    performance = getPerformance(app);
    return performance;
  } catch (error) {
    console.warn('Firebase Performance Monitoring not available:', error);
    return null;
  }
}

/**
 * Create and start a custom trace
 */
export function startTrace(traceName: string): (() => void) | null {
  if (!performance) {
    performance = initializePerformance();
  }

  if (!performance) {
    return null;
  }

  const customTrace = trace(performance, traceName);
  customTrace.start();

  return () => {
    customTrace.stop();
  };
}

/**
 * Trace migration operation
 */
export async function traceMigration<T>(fn: () => Promise<T>): Promise<T> {
  const stopTrace = startTrace('migration_operation');

  try {
    const result = await fn();
    return result;
  } finally {
    if (stopTrace) {
      stopTrace();
    }
  }
}

/**
 * Trace sync operation
 */
export async function traceSync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const stopTrace = startTrace(`sync_${operation}`);

  try {
    const result = await fn();
    return result;
  } finally {
    if (stopTrace) {
      stopTrace();
    }
  }
}

/**
 * Trace leaderboard query
 */
export async function traceLeaderboardQuery<T>(fn: () => Promise<T>): Promise<T> {
  const stopTrace = startTrace('leaderboard_query');

  try {
    const result = await fn();
    return result;
  } finally {
    if (stopTrace) {
      stopTrace();
    }
  }
}

/**
 * Trace Cloud Function execution
 */
export async function traceCloudFunction<T>(
  functionName: string,
  fn: () => Promise<T>
): Promise<T> {
  const stopTrace = startTrace(`cloud_function_${functionName}`);

  try {
    const result = await fn();
    return result;
  } finally {
    if (stopTrace) {
      stopTrace();
    }
  }
}
