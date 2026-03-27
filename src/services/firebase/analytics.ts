import { getAnalytics, logEvent, Analytics, isSupported } from 'firebase/analytics';
import { getApps } from 'firebase/app';

let analytics: Analytics | null = null;
let analyticsInitialized = false;

/**
 * Initialize Firebase Analytics (lazy)
 * SAFE: Only called when needed, uses getApps() to get Firebase app
 */
async function ensureAnalytics(): Promise<Analytics | null> {
  if (analyticsInitialized) {
    return analytics;
  }

  if (typeof window === 'undefined') {
    analyticsInitialized = true;
    return null;
  }

  try {
    // Check if analytics is supported
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Analytics not supported in this environment');
      analyticsInitialized = true;
      return null;
    }

    // Get Firebase app (lazy)
    const apps = getApps();
    if (apps.length === 0) {
      console.warn('Firebase app not initialized');
      return null; // Don't mark as initialized, retry later
    }

    analytics = getAnalytics(apps[0]);
    analyticsInitialized = true;
    return analytics;
  } catch (error) {
    console.warn('Firebase Analytics not available:', error);
    analyticsInitialized = true;
    return null;
  }
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  eventName: 'anonymous_created' | 'account_upgraded' | 'sign_in_prompted' | 'sign_in_dismissed',
  params?: Record<string, any>
): void {
  ensureAnalytics().then((a) => {
    if (a) {
      logEvent(a, eventName, {
        ...params,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Log migration events
 */
export function logMigrationEvent(
  eventName: 'migration_started' | 'migration_completed' | 'migration_failed',
  params?: Record<string, any>
): void {
  ensureAnalytics().then((a) => {
    if (a) {
      logEvent(a, eventName, {
        ...params,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Log sync events
 */
export function logSyncEvent(
  eventName: 'score_synced' | 'stats_synced' | 'achievement_synced' | 'daily_synced',
  params?: Record<string, any>
): void {
  ensureAnalytics().then((a) => {
    if (a) {
      logEvent(a, eventName, {
        ...params,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Log notification events
 */
export function logNotificationEvent(
  eventName: 'notification_sent' | 'notification_opened' | 'notification_permission_requested' | 'notification_permission_granted' | 'notification_permission_denied',
  params?: Record<string, any>
): void {
  ensureAnalytics().then((a) => {
    if (a) {
      logEvent(a, eventName, {
        ...params,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Log error events
 */
export function logErrorEvent(
  errorCode: string,
  errorMessage: string,
  context?: Record<string, any>
): void {
  ensureAnalytics().then((a) => {
    if (a) {
      logEvent(a, 'error_occurred', {
        error_code: errorCode,
        error_message: errorMessage,
        ...context,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Log custom event
 */
export function logCustomEvent(eventName: string, params?: Record<string, any>): void {
  ensureAnalytics().then((a) => {
    if (a) {
      logEvent(a, eventName, {
        ...params,
        timestamp: Date.now(),
      });
    }
  });
}
