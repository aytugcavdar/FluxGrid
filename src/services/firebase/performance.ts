import { getPerformance, trace } from 'firebase/performance';
import type { PerformanceTrace } from 'firebase/performance';
import { getApps } from 'firebase/app';

let performance: ReturnType<typeof getPerformance> | null = null;
let performanceInitialized = false;

/**
 * Initialize Firebase Performance Monitoring (lazy)
 * SAFE: Only called when needed, uses getApps() to get Firebase app
 */
function ensurePerformance(): ReturnType<typeof getPerformance> | null {
  if (performanceInitialized) {
    return performance;
  }

  if (typeof window === 'undefined') {
    performanceInitialized = true;
    return null;
  }

  try {
    // Get Firebase app (lazy)
    const apps = getApps();
    if (apps.length === 0) {
      console.warn('Firebase app not initialized');
      return null; // Don't mark as initialized, retry later
    }

    performance = getPerformance(apps[0]);
    performanceInitialized = true;
    return performance;
  } catch (error) {
    console.warn('Firebase Performance Monitoring not available:', error);
    performanceInitialized = true;
    return null;
  }
}

/**
 * Create and start a custom trace
 */
export function startTrace(traceName: string): (() => void) | null {
  const perf = ensurePerformance();

  if (!perf) {
    return null;
  }

  const customTrace = trace(perf, traceName);
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
