# Security Manager Service

Comprehensive security and abuse prevention service for FluxGrid.

## Features

### 1. Security Checks
- **Root Detection**: Detects rooted/jailbroken devices (basic web-based check)
- **Debug Mode Detection**: Identifies if app is running in debug mode
- **Tamper Detection**: Uses checksums to detect data tampering

### 2. Score Validation
- **Range Validation**: Ensures scores are within reasonable bounds
- **Rate Validation**: Checks score per second against maximum threshold
- **Consistency Validation**: Validates score against game metrics (lines cleared, duration)
- **Impossible Score Detection**: Identifies scores that couldn't be achieved legitimately

### 3. Rate Limiting
- **Token Bucket Algorithm**: Industry-standard rate limiting
- **Configurable Limits**: Per-action rate limit configuration
- **Automatic Refill**: Tokens refill over time based on configured rate

### 4. Suspicious Activity Detection
- **Pattern Recognition**: Tracks action frequency
- **Threshold Alerts**: Logs when suspicious patterns detected
- **Activity Reports**: Provides detailed suspicious activity reports

### 5. Data Encryption
- **AES-GCM Encryption**: Uses Web Crypto API for strong encryption
- **Simple Interface**: Easy-to-use encrypt/decrypt methods
- **Object Support**: Encrypt/decrypt JavaScript objects directly

## Usage

### Basic Setup

```typescript
import { securityManager } from '@/services/security';
import { getServiceContainer } from '@/services/core';

// Register with service container
const container = getServiceContainer();
container.register('security', () => securityManager);

// Initialize
await container.initializeAll();
await container.startAll();
```

### Security Checks

```typescript
// Perform security checks
const check = await securityManager.performSecurityChecks();

if (check.isRooted) {
  console.warn('Device is rooted');
}

if (check.isTampered) {
  console.error('Data tampering detected!');
}

// Get last check results
const lastCheck = securityManager.getSecurityCheck();
```

### Score Validation

```typescript
// Validate game score
const result = securityManager.validateScore(15000, {
  duration: 120, // 2 minutes
  linesCleared: 50,
  level: 10,
  mode: 'classic'
});

if (!result.valid) {
  console.error('Invalid score:', result.reason);
  
  if (result.suspiciousActivity) {
    // Log to analytics, block submission, etc.
  }
}
```

### Rate Limiting

```typescript
// Check rate limit with default config (10 tokens, 1/sec refill)
if (securityManager.checkRateLimit('game_start')) {
  // Action allowed
  startGame();
} else {
  // Rate limited
  showError('Too many attempts. Please wait.');
}

// Custom rate limit config
if (securityManager.checkRateLimit('api_call', {
  capacity: 5,
  refillRate: 0.5, // 1 token every 2 seconds
  cost: 1
})) {
  // Make API call
}

// Check rate limit status
const status = securityManager.getRateLimitStatus('game_start');
console.log(`Tokens: ${status?.tokens}/${status?.capacity}`);

// Reset rate limit
securityManager.resetRateLimit('game_start');
```

### Suspicious Activity Detection

```typescript
// Track action
const isSuspicious = securityManager.detectSuspiciousActivity('high_score_submit');

if (isSuspicious) {
  // Log to analytics
  analytics.logEvent('suspicious_activity', {
    action: 'high_score_submit'
  });
  
  // Take action (block, flag, etc.)
}

// Get suspicious activity report
const report = securityManager.getSuspiciousActivityReport();
report.forEach(item => {
  console.log(`Suspicious: ${item.action} - ${item.count} times`);
});

// Clear tracking
securityManager.clearSuspiciousActivity();
```

### Data Encryption

```typescript
// Encrypt string
const encrypted = await securityManager.encrypt('sensitive data');
localStorage.setItem('secure_data', encrypted);

// Decrypt string
const decrypted = await securityManager.decrypt(encrypted);

// Encrypt object
const user = { id: '123', email: 'user@example.com' };
const encryptedUser = await securityManager.encryptObject(user);

// Decrypt object
const decryptedUser = await securityManager.decryptObject<typeof user>(encryptedUser);
```

### Checksum Validation

```typescript
// Store data with checksum
const data = JSON.stringify({ score: 1000 });
localStorage.setItem('game:score', data);
await securityManager.storeChecksum('game:score', data);

// Verify checksum later
const storedData = localStorage.getItem('game:score');
if (storedData) {
  const isValid = await securityManager.verifyChecksum('game:score', storedData);
  
  if (!isValid) {
    console.error('Data has been tampered with!');
    // Handle tampering
  }
}
```

## Integration Examples

### Game Score Submission

```typescript
async function submitScore(score: number, gameData: GameData) {
  // 1. Check rate limit
  if (!securityManager.checkRateLimit('score_submit', {
    capacity: 3,
    refillRate: 0.1, // 1 submission per 10 seconds
    cost: 1
  })) {
    throw new Error('Too many score submissions. Please wait.');
  }
  
  // 2. Validate score
  const validation = securityManager.validateScore(score, {
    duration: gameData.duration,
    linesCleared: gameData.linesCleared,
    level: gameData.level,
    mode: gameData.mode
  });
  
  if (!validation.valid) {
    logger.error('Invalid score', { score, reason: validation.reason });
    throw new Error('Invalid score');
  }
  
  // 3. Check for suspicious activity
  if (securityManager.detectSuspiciousActivity('score_submit')) {
    logger.warn('Suspicious score submission pattern detected');
    // Still allow but flag for review
  }
  
  // 4. Submit score
  await api.submitScore(score, gameData);
}
```

### Secure Data Storage

```typescript
async function saveUserData(userData: UserData) {
  // Encrypt sensitive data
  const encrypted = await securityManager.encryptObject(userData);
  
  // Store encrypted data
  localStorage.setItem('user:data', encrypted);
  
  // Store checksum for tamper detection
  await securityManager.storeChecksum('user:data', encrypted);
}

async function loadUserData(): Promise<UserData | null> {
  const encrypted = localStorage.getItem('user:data');
  if (!encrypted) return null;
  
  // Verify checksum
  const isValid = await securityManager.verifyChecksum('user:data', encrypted);
  if (!isValid) {
    logger.error('User data tampering detected');
    return null;
  }
  
  // Decrypt data
  return await securityManager.decryptObject<UserData>(encrypted);
}
```

### API Rate Limiting

```typescript
async function makeApiCall(endpoint: string, data: any) {
  // Rate limit API calls
  if (!securityManager.checkRateLimit(`api:${endpoint}`, {
    capacity: 10,
    refillRate: 1,
    cost: 1
  })) {
    throw new Error('API rate limit exceeded');
  }
  
  // Make call
  return await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
```

## Configuration

### Score Validation Thresholds

Adjust thresholds in `SecurityManager` constructor:

```typescript
private readonly MAX_SCORE_PER_SECOND = 100;
private readonly MAX_SCORE_TOTAL = 1000000;
```

### Suspicious Activity Threshold

```typescript
private readonly SUSPICIOUS_ACTIVITY_THRESHOLD = 10; // Actions per minute
```

### Rate Limit Defaults

```typescript
const defaultConfig: RateLimitConfig = {
  capacity: 10,
  refillRate: 1, // 1 token per second
  cost: 1,
};
```

## Security Best Practices

### 1. Root Detection
- Current implementation is basic (web-based)
- For production Android app, integrate SafetyNet API
- Consider using Capacitor plugin for native root detection

### 2. Score Validation
- Adjust thresholds based on actual game mechanics
- Monitor false positives and adjust accordingly
- Log all validation failures for analysis

### 3. Rate Limiting
- Use different limits for different actions
- More restrictive for sensitive operations (score submit, API calls)
- Less restrictive for UI interactions

### 4. Data Encryption
- Encrypt all sensitive user data
- Use checksums for critical game data
- Regularly verify checksums

### 5. Suspicious Activity
- Track patterns across sessions
- Combine with analytics for deeper insights
- Implement progressive penalties (warnings → blocks)

## Android ProGuard Configuration

ProGuard rules have been configured for security:

```proguard
# Enable aggressive obfuscation
-optimizationpasses 5
-repackageclasses ''
-allowaccessmodification

# Remove logging in production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}

# Obfuscate string constants
-adaptclassstrings
```

Build configuration (`android/app/build.gradle`):

```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

## Requirements Coverage

- ✅ **12.1**: Score validation with range and consistency checks
- ✅ **12.2**: Suspicious activity detection and logging
- ✅ **12.3**: Client-side validation for scores and game data
- ✅ **12.4**: ProGuard obfuscation configured
- ✅ **12.5**: Root detection (basic implementation)
- ✅ **12.7**: Data encryption using Web Crypto API (AES-GCM)
- ✅ **12.9**: Tamper detection using checksums
- ✅ **12.10**: Rate limiting using token bucket algorithm
- ✅ **10.6**: Rate limiting for error prevention

## Testing

```typescript
// Test security checks
const check = await securityManager.performSecurityChecks();
console.log('Security check:', check);

// Test score validation
const validation = securityManager.validateScore(10000, {
  duration: 60,
  linesCleared: 20,
  level: 5,
  mode: 'classic'
});
console.log('Score valid:', validation.valid);

// Test rate limiting
for (let i = 0; i < 15; i++) {
  const allowed = securityManager.checkRateLimit('test_action');
  console.log(`Attempt ${i + 1}: ${allowed ? 'allowed' : 'blocked'}`);
}

// Test encryption
const encrypted = await securityManager.encrypt('test data');
const decrypted = await securityManager.decrypt(encrypted);
console.log('Encryption works:', decrypted === 'test data');
```

## Monitoring

Monitor security events in production:

```typescript
// Log security events to analytics
if (validation.suspiciousActivity) {
  analytics.logEvent('security_suspicious_score', {
    score,
    reason: validation.reason
  });
}

// Monitor rate limit violations
if (!securityManager.checkRateLimit(action)) {
  analytics.logEvent('security_rate_limit_exceeded', {
    action
  });
}

// Track tampering attempts
if (check.isTampered) {
  crashReporter.logError(new Error('Data tampering detected'), {
    severity: 'CRITICAL'
  });
}
```

## Future Enhancements

1. **Server-Side Validation**: Move critical validation to backend
2. **SafetyNet Integration**: Use Google SafetyNet API for Android
3. **Behavioral Analysis**: ML-based cheating detection
4. **Device Fingerprinting**: Track devices across sessions
5. **Challenge-Response**: Verify client authenticity
6. **SSL Pinning**: Prevent man-in-the-middle attacks

## Related Services

- **Storage Manager**: Uses encryption for sensitive data
- **Logger**: Logs security events
- **Analytics**: Tracks security metrics
- **Crash Reporter**: Reports critical security issues
