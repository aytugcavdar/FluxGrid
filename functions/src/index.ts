import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions
export { calculatePercentile } from './calculatePercentile';
export { retentionAnalysis } from './retentionAnalysis';
export { validateScore } from './validateScore';
