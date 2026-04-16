/**
 * Firebase App Check Middleware
 * 
 * Enforces App Check verification on Cloud Functions to ensure
 * only legitimate clients can access backend services.
 * 
 * Requirements: 1.7
 */

import * as functions from 'firebase-functions';

/**
 * Middleware to require valid App Check token
 * Wraps Cloud Functions to enforce App Check verification
 * 
 * @param handler - The Cloud Function handler to wrap
 * @returns Wrapped handler that requires App Check
 * 
 * @example
 * export const myFunction = requireAppCheck(async (data, context) => {
 *   // Function logic here
 *   return { success: true };
 * });
 */
export const requireAppCheck = (
  handler: (data: any, context: functions.https.CallableContext) => Promise<any>
) => {
  return async (data: any, context: functions.https.CallableContext) => {
    // Check if App Check token is present
    if (!context.app) {
      console.warn('[AppCheck] Request rejected: No App Check token', {
        uid: context.auth?.uid,
        timestamp: new Date().toISOString(),
      });
      
      throw new functions.https.HttpsError(
        'failed-precondition',
        'App Check verification failed. Please update your app to the latest version.',
        { code: 'APP_CHECK_REQUIRED' }
      );
    }

    // App Check token is valid, proceed with handler
    console.log('[AppCheck] Request verified', {
      uid: context.auth?.uid,
      appId: context.app.appId,
      timestamp: new Date().toISOString(),
    });

    return handler(data, context);
  };
};

/**
 * Optional middleware that logs App Check status but doesn't enforce
 * Useful for gradual rollout or monitoring
 * 
 * @param handler - The Cloud Function handler to wrap
 * @returns Wrapped handler that logs App Check status
 */
export const logAppCheck = (
  handler: (data: any, context: functions.https.CallableContext) => Promise<any>
) => {
  return async (data: any, context: functions.https.CallableContext) => {
    if (context.app) {
      console.log('[AppCheck] Request has valid App Check token', {
        uid: context.auth?.uid,
        appId: context.app.appId,
      });
    } else {
      console.warn('[AppCheck] Request missing App Check token', {
        uid: context.auth?.uid,
      });
    }

    return handler(data, context);
  };
};
