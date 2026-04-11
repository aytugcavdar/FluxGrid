/**
 * Security Manager - Usage Examples
 * 
 * Demonstrates how to use the Security Manager service in various scenarios.
 */

import { securityManager } from './securityManager';
import { logger } from '../logging/logger';
import { analyticsService } from '../analytics/analyticsService';

// ============================================================================
// Example 1: Basic Security Checks
// ============================================================================

export async function performSecurityAudit() {
  console.log('=== Security Audit ===');
  
  // Perform security checks
  const check = await securityManager.performSecurityChecks();
  
  console.log('Root detected:', check.isRooted);
  console.log('Debug mode:', check.isDebugMode);
  console.log('Tampering detected:', check.isTampered);
  
  // Log to analytics if issues found
  if (check.isRooted || check.isTampered) {
    analyticsService.logEvent('security_issue_detected', {
      rooted: check.isRooted,
      tampered: check.isTampered,
      timestamp: check.timestamp
    });
  }
  
  return check;
}

// ============================================================================
// Example 2: Score Validation
// ============================================================================

export interface GameData {
  duration: number;
  linesCleared: number;
  level: number;
  mode: 'classic' | 'survival';
}

export async function submitGameScore(score: number, gameData: GameData) {
  console.log('=== Submitting Score ===');
  
  // 1. Rate limit check
  if (!securityManager.checkRateLimit('score_submit', {
    capacity: 3,
    refillRate: 0.1, // 1 submission per 10 seconds
    cost: 1
  })) {
    throw new Error('Too many score submissions. Please wait.');
  }
  
  // 2. Validate score
  const validation = securityManager.validateScore(score, gameData);
  
  if (!validation.valid) {
    logger.error('Invalid score detected', {
      score,
      reason: validation.reason,
      gameData
    });
    
    // Log to analytics
    analyticsService.logEvent('invalid_score_attempt', {
      score,
      reason: validation.reason,
      suspicious: validation.suspiciousActivity
    });
    
    throw new Error(`Invalid score: ${validation.reason}`);
  }
  
  // 3. Check for suspicious activity
  if (securityManager.detectSuspiciousActivity('score_submit')) {
    logger.warn('Suspicious score submission pattern detected');
    
    // Log but still allow (flag for review)
    analyticsService.logEvent('suspicious_score_pattern', {
      score,
      gameData
    });
  }
  
  // 4. Submit score (would call API here)
  console.log('Score validated and ready for submission:', score);
  
  return { success: true, score };
}

// ============================================================================
// Example 3: Secure Data Storage
// ============================================================================

export async function saveSecureUserData(userId: string, userData: any) {
  console.log('=== Saving Secure Data ===');
  
  // Encrypt sensitive data
  const encrypted = await securityManager.encryptObject({
    userId,
    ...userData,
    timestamp: Date.now()
  });
  
  // Store encrypted data
  localStorage.setItem('user:data', encrypted);
  
  // Store checksum for tamper detection
  await securityManager.storeChecksum('user:data', encrypted);
  
  console.log('User data encrypted and stored securely');
}

export async function loadSecureUserData(): Promise<any | null> {
  console.log('=== Loading Secure Data ===');
  
  const encrypted = localStorage.getItem('user:data');
  if (!encrypted) {
    console.log('No user data found');
    return null;
  }
  
  // Verify checksum
  const isValid = await securityManager.verifyChecksum('user:data', encrypted);
  if (!isValid) {
    logger.error('User data tampering detected!');
    
    // Log security incident
    analyticsService.logEvent('data_tampering_detected', {
      key: 'user:data'
    });
    
    // Clear corrupted data
    localStorage.removeItem('user:data');
    localStorage.removeItem('user:data:checksum');
    
    return null;
  }
  
  // Decrypt data
  const userData = await securityManager.decryptObject(encrypted);
  console.log('User data loaded and verified');
  
  return userData;
}

// ============================================================================
// Example 4: API Rate Limiting
// ============================================================================

export async function makeApiCall(endpoint: string, data: any) {
  console.log('=== Making API Call ===');
  
  // Rate limit API calls per endpoint
  if (!securityManager.checkRateLimit(`api:${endpoint}`, {
    capacity: 10,
    refillRate: 1, // 1 request per second
    cost: 1
  })) {
    throw new Error('API rate limit exceeded. Please slow down.');
  }
  
  // Make the API call (example)
  console.log(`Calling ${endpoint} with data:`, data);
  
  // Simulate API call
  return { success: true, data: 'response' };
}

// ============================================================================
// Example 5: Suspicious Activity Monitoring
// ============================================================================

export function trackUserAction(action: string) {
  console.log('=== Tracking Action ===');
  
  // Track action and check for suspicious patterns
  const isSuspicious = securityManager.detectSuspiciousActivity(action);
  
  if (isSuspicious) {
    logger.warn(`Suspicious activity pattern: ${action}`);
    
    // Log to analytics
    analyticsService.logEvent('suspicious_activity', {
      action,
      timestamp: Date.now()
    });
    
    // Could implement progressive penalties here
    // - First offense: warning
    // - Second offense: temporary restriction
    // - Third offense: account flag
  }
  
  return !isSuspicious;
}

// ============================================================================
// Example 6: Rate Limit Status Monitoring
// ============================================================================

export function checkRateLimitStatus(action: string) {
  console.log('=== Rate Limit Status ===');
  
  const status = securityManager.getRateLimitStatus(action);
  
  if (status) {
    console.log(`Action: ${action}`);
    console.log(`Tokens: ${status.tokens.toFixed(2)}/${status.capacity}`);
    console.log(`Refill rate: ${status.refillRate} tokens/second`);
    
    const percentage = (status.tokens / status.capacity) * 100;
    console.log(`Available: ${percentage.toFixed(0)}%`);
    
    return status;
  }
  
  console.log('No rate limit data for this action');
  return null;
}

// ============================================================================
// Example 7: Security Report
// ============================================================================

export async function generateSecurityReport() {
  console.log('=== Security Report ===');
  
  // Get security check
  const check = await securityManager.performSecurityChecks();
  
  // Get suspicious activity report
  const suspiciousActivities = securityManager.getSuspiciousActivityReport();
  
  const report = {
    timestamp: Date.now(),
    securityCheck: {
      rooted: check.isRooted,
      debugMode: check.isDebugMode,
      tampered: check.isTampered
    },
    suspiciousActivities: suspiciousActivities.map(activity => ({
      action: activity.action,
      count: activity.count,
      duration: activity.lastSeen - activity.firstSeen,
      firstSeen: new Date(activity.firstSeen).toISOString(),
      lastSeen: new Date(activity.lastSeen).toISOString()
    })),
    rateLimits: {
      score_submit: securityManager.getRateLimitStatus('score_submit'),
      api_call: securityManager.getRateLimitStatus('api:leaderboard')
    }
  };
  
  console.log('Security Report:', JSON.stringify(report, null, 2));
  
  return report;
}

// ============================================================================
// Example 8: Complete Game Flow with Security
// ============================================================================

export async function secureGameFlow() {
  console.log('=== Secure Game Flow ===');
  
  try {
    // 1. Initial security check
    const securityCheck = await performSecurityAudit();
    
    if (securityCheck.isRooted) {
      console.warn('Warning: Device is rooted. Some features may be limited.');
    }
    
    // 2. Load user data securely
    const userData = await loadSecureUserData();
    console.log('User data loaded:', userData ? 'success' : 'no data');
    
    // 3. Simulate game play
    console.log('Playing game...');
    
    // 4. Track actions
    trackUserAction('game_start');
    trackUserAction('ability_used');
    trackUserAction('ability_used');
    
    // 5. Submit score
    const gameData: GameData = {
      duration: 120,
      linesCleared: 50,
      level: 10,
      mode: 'classic'
    };
    
    await submitGameScore(15000, gameData);
    
    // 6. Save updated user data
    await saveSecureUserData('user123', {
      highScore: 15000,
      gamesPlayed: 42
    });
    
    // 7. Generate security report
    await generateSecurityReport();
    
    console.log('Game flow completed successfully');
    
  } catch (error) {
    console.error('Error in game flow:', error);
    throw error;
  }
}

// ============================================================================
// Example 9: Testing Rate Limits
// ============================================================================

export function testRateLimiting() {
  console.log('=== Testing Rate Limits ===');
  
  // Reset rate limit for clean test
  securityManager.resetRateLimit('test_action');
  
  // Try 15 actions (limit is 10)
  for (let i = 1; i <= 15; i++) {
    const allowed = securityManager.checkRateLimit('test_action', {
      capacity: 10,
      refillRate: 1,
      cost: 1
    });
    
    console.log(`Attempt ${i}: ${allowed ? '✓ allowed' : '✗ blocked'}`);
    
    if (i === 10) {
      console.log('--- Capacity reached ---');
    }
  }
  
  // Check status
  const status = securityManager.getRateLimitStatus('test_action');
  console.log('Final status:', status);
}

// ============================================================================
// Example 10: Encryption Performance Test
// ============================================================================

export async function testEncryptionPerformance() {
  console.log('=== Encryption Performance Test ===');
  
  const testData = {
    userId: 'user123',
    highScore: 50000,
    achievements: ['first_win', 'combo_master', 'speed_demon'],
    settings: {
      sound: true,
      music: false,
      difficulty: 'hard'
    }
  };
  
  // Test encryption
  const encryptStart = performance.now();
  const encrypted = await securityManager.encryptObject(testData);
  const encryptTime = performance.now() - encryptStart;
  
  console.log(`Encryption time: ${encryptTime.toFixed(2)}ms`);
  console.log(`Encrypted size: ${encrypted.length} bytes`);
  
  // Test decryption
  const decryptStart = performance.now();
  const decrypted = await securityManager.decryptObject(encrypted);
  const decryptTime = performance.now() - decryptStart;
  
  console.log(`Decryption time: ${decryptTime.toFixed(2)}ms`);
  console.log('Data integrity:', JSON.stringify(testData) === JSON.stringify(decrypted) ? '✓' : '✗');
  
  return {
    encryptTime,
    decryptTime,
    totalTime: encryptTime + decryptTime,
    dataSize: encrypted.length
  };
}
