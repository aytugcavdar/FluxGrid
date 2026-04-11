# Crash Reporter Service

The Crash Reporter service provides comprehensive crash reporting and error tracking functionality for FluxGrid using Firebase Crashlytics.

## Features

- **Fatal Crash Logging**: Captures and reports fatal application crashes
- **Non-Fatal Error Logging**: Logs handled errors with severity levels
- **Breadcrumb Trail**: Maintains last 20 user actions for debugging context
- **Custom Key-Value Data**: Attach custom metadata to crash reports
- **Device Information**: Automatically collects device and platform info
- **Rate Limiting**: Prevents log flooding (max 100 errors/minute)
- **Global Error Handlers**: Catches uncaught errors and unhandled promise rejections

## Usage

### Initialize the Service

```typescript
import { crashReporter } from '@/services/crash/crashReporter';

// Initialize and start the service
await crashReporter.initialize();
await crashReporter.start();
```

### Log Errors

```typescript
import { CrashSeverity } from '@/services/crash/crashReporter';

// Log a non-fatal error
try {
  // Some operation
} catch (error) {
  crashReporter.logError(error as Error, CrashSeverity.ERROR, {
    gameState: 'playing',
    customData: { level: 5 }
  });
}

// Log a fatal crash
crashReporter.logCrash(new Error('Critical failure'), {
  gameState: 'game_over',
  customData: { score: 1000 }
});
```

### Track User Actions (Breadcrumbs)

```typescript
// Log user actions for debugging context
crashReporter.logBreadcrumb('User started game');
crashReporter.logBreadcrumb('User used ability', { abilityType: 'time_freeze' });
crashReporter.logBreadcrumb('User paused game');

// Breadcrumbs are automatically included in crash reports
```

### Set Custom Data

```typescript
// Set user identifier (anonymous)
crashReporter.setUserId('user-12345');

// Set custom key-value data
crashReporter.setCustomKey('gameMode', 'survival');
crashReporter.setCustomKey('level', 10);
crashReporter.setCustomKey('isPremium', true);
```

### Get Error Statistics

```typescript
const stats = crashReporter.getErrorStats();
console.log(`Total errors: ${stats.count}`);
console.log(`Recent errors (last minute): ${stats.recentErrors}`);
```

## Severity Levels

- `INFO`: Informational messages
- `WARNING`: Warning messages
- `ERROR`: Non-fatal errors
- `FATAL`: Fatal crashes

## Crash Context

Each crash report includes:

- Error message and stack trace
- Severity level
- Timestamp
- Last 20 user actions (breadcrumbs)
- Custom key-value data
- Device information:
  - Platform (Android/iOS/Web)
  - OS version
  - App version
  - Device model
  - Screen size
  - Available memory

## Rate Limiting

The service implements rate limiting to prevent log flooding:
- Maximum 100 errors per minute
- Errors exceeding the limit are dropped with a warning

## Global Error Handling

The service automatically captures:
- Uncaught JavaScript errors (`window.onerror`)
- Unhandled promise rejections (`window.unhandledrejection`)

## Firebase Crashlytics Integration

### Android Setup

Firebase Crashlytics is configured in the Android project:

1. **Gradle Dependencies** (`android/app/build.gradle`):
   ```gradle
   implementation 'com.google.firebase:firebase-crashlytics'
   ```

2. **Gradle Plugin** (`android/build.gradle`):
   ```gradle
   classpath 'com.google.firebase:firebase-crashlytics-gradle:3.0.2'
   ```

3. **MainActivity Initialization**:
   ```java
   FirebaseCrashlytics crashlytics = FirebaseCrashlytics.getInstance();
   crashlytics.setCrashlyticsCollectionEnabled(true);
   ```

### Web Limitations

Firebase Crashlytics has limited functionality on web platforms. For production web deployments, consider:
- Using Firebase Analytics custom events for error tracking
- Integrating a third-party service like Sentry for comprehensive web crash reporting

## Testing

Run the unit tests:

```bash
npm test -- src/services/crash/crashReporter.test.ts
```

## Requirements Mapping

- **Requirement 2.1**: Firebase Crashlytics integration ✓
- **Requirement 2.2**: Crash reports with full context ✓
- **Requirement 2.3**: Custom data and breadcrumbs ✓
- **Requirement 2.4**: Non-fatal error logging ✓
- **Requirement 2.5**: User ID in crash reports ✓
- **Requirement 2.8**: Rate limiting ✓

## Best Practices

1. **Log Breadcrumbs Liberally**: Track important user actions to provide context
2. **Use Appropriate Severity**: Choose the right severity level for each error
3. **Include Context**: Always provide relevant context data with errors
4. **Set User ID Early**: Set the user ID as soon as it's available
5. **Don't Log Sensitive Data**: Never include passwords, tokens, or PII in crash reports

## Example Integration

```typescript
import { crashReporter, CrashSeverity } from '@/services/crash/crashReporter';

// In your app initialization
async function initializeApp() {
  await crashReporter.initialize();
  await crashReporter.start();
  
  // Set user ID
  const userId = getUserId(); // Your user ID logic
  crashReporter.setUserId(userId);
  
  // Set app-level custom data
  crashReporter.setCustomKey('appVersion', '1.0.0');
  crashReporter.setCustomKey('environment', 'production');
}

// In your game logic
function startGame() {
  crashReporter.logBreadcrumb('Game started');
  crashReporter.setCustomKey('gameMode', 'classic');
  
  try {
    // Game logic
  } catch (error) {
    crashReporter.logError(error as Error, CrashSeverity.ERROR, {
      gameState: 'starting',
      customData: { timestamp: Date.now() }
    });
  }
}
```
