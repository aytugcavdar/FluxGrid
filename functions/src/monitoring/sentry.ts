import * as Sentry from '@sentry/node';
import * as functions from 'firebase-functions';

/**
 * Initialize Sentry for Cloud Functions error tracking
 * Should be called once at the start of the functions module
 */
export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.FUNCTION_ENV || 'production';

  // Skip initialization if DSN is not configured
  if (!dsn) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Error sampling
    sampleRate: 1.0, // 100% of errors
    
    // Integrations for Node.js
    integrations: [
      // HTTP instrumentation
      Sentry.httpIntegration(),
      
      // Express instrumentation (if using Express)
      Sentry.expressIntegration(),
    ],
  });

  console.log(`[Sentry] Initialized for ${environment} environment`);
}

/**
 * Wrap a Cloud Function with Sentry error handling
 * Automatically captures exceptions and adds context
 * 
 * @param fn - The Cloud Function to wrap
 * @returns Wrapped function with Sentry error handling
 * 
 * @example
 * export const myFunction = wrapFunction(
 *   functions.https.onCall(async (data, context) => {
 *     // Your function logic
 *   })
 * );
 */
export function wrapFunction<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    return Sentry.startSpan(
      {
        name: fn.name || 'cloud-function',
        op: 'function.call',
      },
      async () => {
        try {
          return await fn(...args);
        } catch (error) {
          // Add context to error
          Sentry.setContext('function', {
            name: fn.name,
            args: JSON.stringify(args).substring(0, 1000), // Limit size
          });
          
          // Capture exception
          Sentry.captureException(error);
          
          // Re-throw to maintain normal error handling
          throw error;
        }
      }
    );
  }) as T;
}

/**
 * Wrap a callable Cloud Function with Sentry error handling
 * Adds user context and request data
 * 
 * @param handler - The callable function handler
 * @returns Wrapped handler with Sentry error handling
 * 
 * @example
 * export const submitScore = functions.https.onCall(
 *   wrapCallableFunction(async (data, context) => {
 *     // Your function logic
 *   })
 * );
 */
export function wrapCallableFunction<T, R>(
  handler: (data: T, context: functions.https.CallableContext) => Promise<R>
): (data: T, context: functions.https.CallableContext) => Promise<R> {
  return async (data: T, context: functions.https.CallableContext): Promise<R> => {
    return Sentry.startSpan(
      {
        name: 'callable-function',
        op: 'function.call',
      },
      async () => {
        try {
          // Add user context if authenticated
          if (context.auth) {
            Sentry.setUser({
              id: context.auth.uid,
            });
          }
          
          // Add request context
          Sentry.setContext('request', {
            data: JSON.stringify(data).substring(0, 1000), // Limit size
            appCheck: context.app ? 'verified' : 'not-verified',
          });
          
          return await handler(data, context);
        } catch (error) {
          // Capture exception with context
          Sentry.captureException(error);
          
          // Re-throw to maintain normal error handling
          throw error;
        } finally {
          // Clear user context
          Sentry.setUser(null);
        }
      }
    );
  };
}

/**
 * Manually capture an error with additional context
 * 
 * @param error - Error object or message
 * @param context - Additional context for debugging
 */
export function captureError(
  error: Error | string,
  context?: Record<string, any>
): void {
  if (context) {
    Sentry.setContext('custom', context);
  }
  
  if (typeof error === 'string') {
    Sentry.captureMessage(error, 'error');
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Add breadcrumb for tracking function execution flow
 * 
 * @param message - Description of the action
 * @param category - Category of the action
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
