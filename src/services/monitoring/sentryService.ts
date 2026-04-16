import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Configures environment-specific settings, integrations, and PII filtering
 */
export function initializeSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  // Skip initialization if DSN is not configured (e.g., in development)
  if (!dsn || environment === 'development') {
    console.log('[Sentry] Skipping initialization in development mode');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release: `fluxgrid@${appVersion}`,

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

    // Error sampling
    sampleRate: 1.0, // 100% of errors

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Track navigation and page load performance
        tracePropagationTargets: ['localhost', /^https:\/\/.*\.fluxgrid\.app/],
      }),

      // Session replay for debugging
      Sentry.replayIntegration({
        maskAllText: true, // Mask all text for privacy
        blockAllMedia: true, // Block all media for privacy
      }),
    ],

    // Session replay sampling
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter sensitive data before sending to Sentry
    beforeSend(event, hint) {
      // Remove PII from user context
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            // Remove potential PII from breadcrumb data
            const sanitizedData = { ...breadcrumb.data };
            delete sanitizedData.email;
            delete sanitizedData.phone;
            delete sanitizedData.address;
            return { ...breadcrumb, data: sanitizedData };
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Add global context
    initialScope: {
      tags: {
        platform: Capacitor.getPlatform(),
        native: Capacitor.isNativePlatform() ? 'true' : 'false',
      },
    },
  });

  console.log(`[Sentry] Initialized for ${environment} environment`);
}

/**
 * Set user context for error tracking
 * @param userId - Anonymous user ID (no PII)
 */
export function setUserContext(userId: string): void {
  Sentry.setUser({
    id: userId,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for user action tracking
 * @param message - Description of the action
 * @param category - Category of the action (e.g., 'navigation', 'user-action')
 * @param data - Additional context data
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture an error manually
 * @param error - Error object or message
 * @param context - Additional context for debugging
 */
export function captureError(
  error: Error | string,
  context?: Record<string, any>
): void {
  if (typeof error === 'string') {
    Sentry.captureMessage(error, {
      level: 'error',
      contexts: { custom: context },
    });
  } else {
    Sentry.captureException(error, {
      contexts: { custom: context },
    });
  }
}

/**
 * Start a performance transaction
 * @param name - Transaction name
 * @param op - Operation type (e.g., 'navigation', 'http.request')
 * @returns Transaction object
 */
export function startTransaction(name: string, op: string) {
  // Note: startTransaction is deprecated in Sentry v8+
  // Using startSpan instead for compatibility
  return Sentry.startSpan({
    name,
    op,
  }, (span) => span);
}
