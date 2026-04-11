/**
 * Error Handling Example
 * 
 * Demonstrates how to use the error handling system in FluxGrid.
 * This file is for documentation purposes and can be removed in production.
 */

import { useState } from 'react';
import { ErrorBoundary, ErrorRecoveryModal, ErrorToast, useErrorRecovery } from './index';
import { ErrorCategory, ErrorSeverity } from '@utils/errorHandler';

/**
 * Example 1: Basic ErrorBoundary usage
 */
export function Example1_BasicErrorBoundary() {
  return (
    <ErrorBoundary>
      <div>
        <h1>My App</h1>
        {/* Your app components */}
      </div>
    </ErrorBoundary>
  );
}

/**
 * Example 2: ErrorBoundary with custom fallback
 */
export function Example2_CustomFallback() {
  const customFallback = (
    <div className="p-6 text-center">
      <h2>Oops! Something went wrong</h2>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );

  return (
    <ErrorBoundary fallback={customFallback}>
      <div>My App</div>
    </ErrorBoundary>
  );
}

/**
 * Example 3: ErrorBoundary with error callback
 */
export function Example3_ErrorCallback() {
  const handleError = (error: Error) => {
    console.log('Error caught:', error);
    // Send to analytics, etc.
  };

  return (
    <ErrorBoundary onError={handleError}>
      <div>My App</div>
    </ErrorBoundary>
  );
}

/**
 * Example 4: ErrorBoundary with reset keys
 */
export function Example4_ResetKeys() {
  const [userId, setUserId] = useState('user1');

  return (
    <ErrorBoundary resetKeys={[userId]}>
      <div>
        <h1>User: {userId}</h1>
        <button onClick={() => setUserId('user2')}>Switch User</button>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Example 5: Using useErrorRecovery hook
 */
export function Example5_UseErrorRecovery() {
  const [errorState, errorActions] = useErrorRecovery(() => {
    console.log('Retrying action...');
    // Retry logic here
  });

  const handleRiskyAction = () => {
    try {
      // Some risky operation
      throw new Error('Something went wrong');
    } catch (error) {
      errorActions.showError(
        error as Error,
        ErrorCategory.STORAGE,
        ErrorSeverity.HIGH
      );
    }
  };

  return (
    <div>
      <button onClick={handleRiskyAction}>Do Risky Action</button>

      {errorState.isVisible && errorState.error && (
        <ErrorRecoveryModal
          error={new Error(errorState.error.message)}
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

/**
 * Example 6: Using ErrorToast for non-critical errors
 */
export function Example6_ErrorToast() {
  const [showToast, setShowToast] = useState(false);

  const handleNetworkError = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000); // Auto-dismiss after 5s
  };

  return (
    <div>
      <button onClick={handleNetworkError}>Trigger Network Error</button>

      {showToast && (
        <ErrorToast
          error={new Error('Network request failed')}
          category={ErrorCategory.NETWORK}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

/**
 * Example 7: Nested ErrorBoundaries for granular error handling
 */
export function Example7_NestedBoundaries() {
  return (
    <ErrorBoundary>
      <div>
        <h1>App</h1>

        <ErrorBoundary
          fallback={<div>Sidebar failed to load</div>}
        >
          <Sidebar />
        </ErrorBoundary>

        <ErrorBoundary
          fallback={<div>Main content failed to load</div>}
        >
          <MainContent />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

function Sidebar() {
  return <div>Sidebar</div>;
}

function MainContent() {
  return <div>Main Content</div>;
}

/**
 * Example 8: Complete app setup with error handling
 */
export function Example8_CompleteSetup() {
  const [errorState, errorActions] = useErrorRecovery(() => {
    // Global retry logic
    window.location.reload();
  });

  return (
    <ErrorBoundary
      onError={(error) => {
        // Log to analytics
        console.error('App error:', error);
      }}
    >
      <div className="app">
        {/* Your app content */}
        <h1>FluxGrid</h1>

        {/* Global error modal */}
        {errorState.isVisible && errorState.error && (
          <ErrorRecoveryModal
            error={new Error(errorState.error.message)}
            category={errorState.error.category}
            severity={errorState.error.severity}
            onRetry={errorActions.retryLastAction}
            onDismiss={
              errorState.error.severity !== ErrorSeverity.CRITICAL
                ? errorActions.dismissError
                : undefined
            }
            onReload={errorActions.reloadPage}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
