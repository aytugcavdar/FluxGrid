import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getMessaging, Messaging } from 'firebase/messaging';

// Firebase configuration
// TODO: Replace with your Firebase project configuration from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;
let messaging: Messaging | null = null;

export const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
    
    // Messaging is only available in browsers that support service workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.warn('Firebase Messaging not available:', error);
      }
    }
  }
  
  return { app, auth, db, functions, messaging };
};

// Export initialized instances
export const getFirebaseAuth = () => {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
};

export const getFirebaseFirestore = () => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

export const getFirebaseFunctions = () => {
  if (!functions) {
    initializeFirebase();
  }
  return functions;
};

export const getFirebaseMessaging = () => {
  if (!messaging) {
    initializeFirebase();
  }
  return messaging;
};

export { app, auth, db, functions, messaging };
