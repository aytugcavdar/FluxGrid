import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getMessaging, Messaging } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Lazy-initialized instances (no module-level initialization)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app (only once)
 * CRITICAL: Uses getApps() to prevent multiple initializations
 */
const ensureFirebaseApp = (): FirebaseApp => {
  if (!app) {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
};

/**
 * Get Firebase Auth instance (lazy initialization)
 * SAFE: Only called when needed, never at module load time
 */
export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    const firebaseApp = ensureFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
};

/**
 * Get Firestore instance (lazy initialization)
 * SAFE: Only called when needed, never at module load time
 */
export const getFirebaseFirestore = (): Firestore => {
  if (!db) {
    const firebaseApp = ensureFirebaseApp();
    db = getFirestore(firebaseApp);
  }
  return db;
};

/**
 * Get Firebase Functions instance (lazy initialization)
 * SAFE: Only called when needed, never at module load time
 */
export const getFirebaseFunctions = (): Functions => {
  if (!functions) {
    const firebaseApp = ensureFirebaseApp();
    functions = getFunctions(firebaseApp);
  }
  return functions;
};

/**
 * Get Firebase Messaging instance (lazy initialization)
 * SAFE: Only called when needed, never at module load time
 * Returns null if service workers are not supported
 */
export const getFirebaseMessaging = (): Messaging | null => {
  if (!messaging) {
    // Messaging is only available in browsers that support service workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const firebaseApp = ensureFirebaseApp();
        messaging = getMessaging(firebaseApp);
      } catch (error) {
        console.warn('Firebase Messaging not available:', error);
        return null;
      }
    }
  }
  return messaging;
};

/**
 * Initialize Firebase (call getters to trigger lazy init)
 * NO SIDE EFFECTS: Just ensures instances are created
 */
export const initializeFirebase = () => {
  getFirebaseAuth();
  getFirebaseFirestore();
  getFirebaseFunctions();
  getFirebaseMessaging();
};
