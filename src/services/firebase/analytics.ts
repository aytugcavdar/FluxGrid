import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { app } from './config';

let analytics: Analytics | null = null;

/**
 * Initialize Firebase Analytics
 */
export function initializeAnalytics(): Analytics | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    analytics = getAnalytics(app);
    return analytics;
  } catch (error) {
    console.warn('Firebase Analytics not available:', error);
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
  if (!analytics) {
    analytics = initializeAnalytics();
  }

  if (analytics) {
    logEvent(analytics, eventName, {
      ...params,
      timestamp: Date.now(),
    });
  }
}

/**
 * Log migration events
 */
export function logMigrationEvent(
  eventName: 'migration_started' | 'migration_completed' | 'migration_failed',
  params?: Record<string, any>
): void {
  if (!analytics) {
    analytics = initializeAnalytics();
  }

  if (analytics) {
    logEvent(analytics, eventName, {
      ...params,
      timestamp: Date.now(),
    });
  }
}

/**
 * Log sync events
 */
export function logSyncEvent(
  eventName: 'score_synced' | 'stats_synced' | 'achievement_synced' | 'daily_synced',
  params?: Record<string, any>
): void {
  if (!analytics) {
    analytics = initializeAnalytics();
  }

  if (analytics) {
    logEvent(analytics, eventName, {
      ...params,
      timestamp: Date.now(),
    });
  }
}

/**
 * Log notification events
 */
export function logNotificationEvent(
  eventName: 'notification_sent' | 'notification_opened' | 'notification_permission_requested' | 'notification_permission_granted' | 'notification_permission_denied',
  params?: Record<string, any>
): void {
  if (!analytics) {
    analytics = initializeAnalytics();
  }

  if (analytics) {
    logEvent(analytics, eventName, {
      ...params,
      timestamp: Date.now(),
    });
  }
}

/**
 * Log error events
 */
export function logErrorEvent(
  errorCode: string,
  errorMessage: string,
  context?: Record<string, any>
): void {
  if (!analytics) {
    analytics = initializeAnalytics();
  }

  if (analytics) {
    logEvent(analytics, 'error_occurred', {
      error_code: errorCode,
      error_message: errorMessage,
      ...context,
      timestamp: Date.now(),
    });
  }
}

/**
 * Log custom event
 */
export function logCustomEvent(eventName: string, params?: Record<string, any>): void {
  if (!analytics) {
    analytics = initializeAnalytics();
  }

  if (analytics) {
    logEvent(analytics, eventName, {
      ...params,
      timestamp: Date.now(),
    });
  }
}
