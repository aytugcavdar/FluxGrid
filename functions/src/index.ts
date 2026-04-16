import * as admin from 'firebase-admin';
import { initializeSentry } from './monitoring/sentry';

// Initialize Sentry for error tracking
initializeSentry();

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions
export { calculatePercentile } from './calculatePercentile';
export { retentionAnalysis } from './retentionAnalysis';
export { validateScore } from './validateScore';
export { updateLeaderboardMeta } from './updateLeaderboardMeta';
export { transferAnonymousScores } from './transferAnonymousScores'; // NEW - Requirement 6.1
export { submitScore } from './submitScore'; // NEW - Requirement 1.7 (App Check enforced)
export { cleanupExpiredNonces } from './cleanupExpiredNonces'; // NEW - Requirement 2.10
export { logSecurityAudit, getSecurityAudits } from './logSecurityAudit'; // NEW - Requirement 5.11
export { saveFCMToken } from './saveFCMToken'; // NEW - Push Notifications
export { 
  sendPushNotification,
  sendDailyChallengeReminder,
  sendDailyRewardReminder 
} from './sendPushNotification'; // NEW - Push Notifications
