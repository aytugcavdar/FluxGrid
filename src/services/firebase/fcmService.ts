import {
  getToken,
  onMessage,
  MessagePayload,
  Messaging,
} from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getFirebaseMessaging, getFirebaseFirestore } from './config';

const db = getFirebaseFirestore();

// VAPID key from Firebase Console > Project Settings > Cloud Messaging
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

// Validate VAPID key configuration
if (!VAPID_KEY) {
  console.warn(
    'VITE_FIREBASE_VAPID_KEY not configured. ' +
    'Get this from Firebase Console > Project Settings > Cloud Messaging'
  );
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(uid: string): Promise<string | null> {
  try {
    const messaging = getFirebaseMessaging();
    
    if (!messaging) {
      console.warn('Firebase Messaging not available');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      // Register token in Firestore
      await registerDeviceToken(uid, token);
      return token;
    }

    return null;
  } catch (error) {
    console.error('Failed to get notification permission:', error);
    return null;
  }
}

/**
 * Register device token in Firestore
 */
export async function registerDeviceToken(uid: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      deviceTokens: arrayUnion(token),
    });

    console.log('Device token registered:', token);
  } catch (error) {
    console.error('Failed to register device token:', error);
    throw error;
  }
}

/**
 * Remove device token from Firestore
 */
export async function removeDeviceToken(uid: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      deviceTokens: arrayRemove(token),
    });

    console.log('Device token removed:', token);
  } catch (error) {
    console.error('Failed to remove device token:', error);
    throw error;
  }
}

/**
 * Set up foreground message listener
 */
export function setupForegroundMessageListener(
  onMessageReceived: (payload: MessagePayload) => void
): (() => void) | null {
  try {
    const messaging = getFirebaseMessaging();
    
    if (!messaging) {
      return null;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      onMessageReceived(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Failed to set up foreground message listener:', error);
    return null;
  }
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermissionStatus(): string {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  
  return Notification.permission;
}
