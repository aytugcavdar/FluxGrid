import * as admin from 'firebase-admin';
import { initializeSentry } from './monitoring/sentry';

// Initialize Sentry for error tracking
initializeSentry();

// Initialize Firebase Admin
admin.initializeApp();

// Active Cloud Functions
// Keep the Firebase surface small while leaderboard/admin tooling is disabled.
// Engagement reminders are scheduled locally on device to avoid duplicate phone notifications.
export { saveFCMToken } from './saveFCMToken';
