import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getRemoteConfig, RemoteConfig } from 'firebase/remote-config';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getPerformance, FirebasePerformance } from 'firebase/performance';
import { appCheckService } from '../security/appCheckService';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let remoteConfig: RemoteConfig | null = null;
let analytics: Analytics | null = null;
let performance: FirebasePerformance | null = null;
let appCheckInitialized = false;

/**
 * Initialize Firebase app if not already initialized
 */
export function initializeFirebase(): FirebaseApp {
  if (!app) {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
    
    // Initialize App Check after Firebase app is created
    if (!appCheckInitialized) {
      initializeAppCheck();
    }
  }
  return app;
}

/**
 * Initialize Firebase App Check
 * Called automatically after Firebase app initialization
 */
async function initializeAppCheck(): Promise<void> {
  if (appCheckInitialized) {
    return;
  }
  
  try {
    await appCheckService.initialize();
    appCheckInitialized = true;
    console.log('[Firebase] App Check initialized successfully');
  } catch (error) {
    console.error('[Firebase] App Check initialization failed:', error);
    // Don't throw - graceful degradation
  }
}

/**
 * Get Firebase Remote Config instance
 */
export function getFirebaseRemoteConfig(): RemoteConfig {
  if (!remoteConfig) {
    const firebaseApp = initializeFirebase();
    remoteConfig = getRemoteConfig(firebaseApp);
  }
  return remoteConfig;
}

/**
 * Get Firebase Analytics instance
 */
export function getFirebaseAnalytics(): Analytics | null {
  try {
    if (!analytics) {
      const firebaseApp = initializeFirebase();
      analytics = getAnalytics(firebaseApp);
    }
    return analytics;
  } catch (error) {
    console.warn('[Firebase] Analytics not available:', error);
    return null;
  }
}

/**
 * Get Firebase Performance instance
 */
export function getFirebasePerformance(): FirebasePerformance | null {
  try {
    if (!performance) {
      const firebaseApp = initializeFirebase();
      performance = getPerformance(firebaseApp);
    }
    return performance;
  } catch (error) {
    console.warn('[Firebase] Performance not available:', error);
    return null;
  }
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}
