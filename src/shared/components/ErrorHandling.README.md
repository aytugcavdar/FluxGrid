# Error Handling Components

This directory contains the error handling infrastructure for FluxGrid, including error boundaries, recovery UI components, and hooks.

## Overview

The error handling system provides:
- **Error Boundaries**: React error boundaries to catch component errors
- **Global Error Handlers**: Window-level error and promise rejection handlers
- **Recovery UI**: User-facing error messages and recovery options
- **Error Tracking**: Integration with error handler for logging and monitoring

## Components

### ErrorBoundary

React error boundary component that catches errors in the component tree.

**Usage:**

```tsx
import { ErrorBoundary } from '@/components';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

**Props:**

- `children`: React nodes to wrap
- `fallback`: Custom fallback UI (optional)
- `onError`: Callback when error is caught (optional)
- `resetKeys`: Array of keys that trigger error reset when changed (optional)

**Features:**

- Catches React component errors
- Logs errors to error handler
- Provides default recovery UI
- Supports custom fallback UI
- Auto-reset on key changes

### ErrorRecoveryModal

Full-screen modal for critical errors with recovery options.

**Usage:**

```tsx
import { ErrorRecoveryModal } from '@/components';

function MyComponent() {
  return (
    <ErrorRecoveryModal
      error={error}
      category={ErrorCategory.STORAGE}
      severity={ErrorSeverity.HIGH}
      onRetry={() => retryAction()}
      onReload={() => window.location.reload()}
    />
  );
}
```

**Props:**

- `error`: Error object
- `category`: Error category (STORAGE, NETWORK, etc.)
- `severity`: Error severity (LOW, MEDIUM, HIGH, CRITICAL)
- `onRetry`: Retry callback (optional)
- `onDismiss`: Dismiss callback (optional, not shown for critical errors)
- `onReload`: Reload callback (optional)

### ErrorToast

Non-intrusive toast notification for low/medium severity errors.

**Usage:**

```tsx
import { ErrorToast } from '@/components';

function MyComponent() {
  return (
    <ErrorToast
      error={error}
      category={ErrorCategory.NETWORK}
      onDismiss={() => dismissError()}
    />
  );
}
```

**Props:**

- `error`: Error object
- `category`: Error category
- `onDismiss`: Dismiss callback (optional)

### InlineError

Inline error message for form validation and input errors.

**Usage:**

```tsx
import { InlineError } from '@/components';

function MyForm() {
  return (
    <div>
      <input type="text" />
      {error && <InlineError message="Invalid input" />}
    </div>
  );
}
```

**Props:**

- `message`: Error message to display

## Hooks

### useErrorRecovery

React hook for managing error recovery UI state and actions.

**Usage:**

```tsx
import { useErrorRecovery } from '@/components';

function MyComponent() {
  const [errorState, errorActions] = useErrorRecovery(() => {
    // Retry action
    console.log('Retrying...');
  });

  const handleAction = () => {
    try {
      // Some action
    } catch (error) {
      errorActions.showError(error, ErrorCategory.STORAGE, ErrorSeverity.HIGH);
    }
  };

  return (
    <div>
      {errorState.isVisible && (
        <ErrorRecoveryModal
          error={errorState.error}
          category={errorState.error.category}
          severity={errorState.error.severity}
          onRetry={errorActions.retryLastAction}
          onDismiss={errorActions.dismissError}
          onReload={errorActions.reloadPage}
        />
      )}
    </div>
  );
}
```

**Returns:**

- `[0]`: Error state
  - `error`: Current error (GameError | null)
  - `isVisible`: Whether error UI should be shown
- `[1]`: Error actions
  - `showError(error, category, severity)`: Show error
  - `dismissError()`: Dismiss error
  - `retryLastAction()`: Retry last action
  - `reloadPage()`: Reload page

## Global Error Handlers

Global error handlers are automatically set up by the error handler utility:

- `window.onerror`: Catches unhandled JavaScript errors
- `window.unhandledrejection`: Catches unhandled promise rejections

These handlers automatically log errors to the error handler and can trigger recovery UI.

## Error Categories

- `STORAGE`: localStorage/storage errors
- `GAME_STATE`: Game state corruption
- `NETWORK`: Network/API errors
- `RENDER`: Rendering errors
- `AUDIO`: Audio playback errors
- `VALIDATION`: Data validation errors
- `UNKNOWN`: Uncategorized errors

## Error Severities

- `LOW`: Minor issues, log only
- `MEDIUM`: Show user notification (toast)
- `HIGH`: Show error modal, attempt recovery
- `CRITICAL`: Show error modal, force restart

## Integration with Error Handler

All error components integrate with the centralized error handler (`@utils/errorHandler`):

```tsx
import { handleError, ErrorCategory, ErrorSeverity } from '@utils/errorHandler';

// Log error
handleError(error, ErrorCategory.STORAGE, ErrorSeverity.HIGH, {
  context: 'additional context',
});
```

## Best Practices

1. **Wrap your app with ErrorBoundary**: Always wrap your root component with ErrorBoundary
2. **Use appropriate severity**: Choose the right severity level for each error
3. **Provide context**: Include relevant context when logging errors
4. **Test error scenarios**: Test error boundaries and recovery UI
5. **Localize error messages**: Use i18n for error messages (currently Turkish)
6. **Don't show technical details in production**: Only show technical details in dev mode

## Requirements Coverage

This implementation covers the following requirements:

- **2.6**: Error boundaries with recovery UI
- **2.9**: React error boundaries for UI crashes
- **10.4**: Error context and user-facing messages
- **10.8**: Error recovery strategies
- **10.9**: User-facing error messages with localization

## Testing

Run tests with:

```bash
npm run test -- src/components
```

All components have comprehensive unit tests covering:
- Error catching and handling
- UI rendering
- User interactions
- Integration with error handler
- Dev vs production behavior
