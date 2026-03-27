import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions
export { calculatePercentile } from './calculatePercentile';
export { retentionAnalysis } from './retentionAnalysis';
export { validateScore } from './validateScore';
export { updateLeaderboardMeta } from './updateLeaderboardMeta';
export { transferAnonymousScores } from './transferAnonymousScores'; // NEW - Requirement 6.1
