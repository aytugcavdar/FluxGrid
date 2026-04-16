import React from 'react';
import * as Sentry from '@sentry/react';

/**
 * Error Boundary component that captures errors with Sentry
 * Wraps the app to catch unhandled React errors
 */
export const SentryErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#0d1117',
          color: '#ffffff',
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '16px', marginBottom: '24px', color: '#8b949e' }}>
            We've been notified and are working on a fix.
          </p>
          <button
            onClick={resetError}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#238636',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#161b22',
              borderRadius: '6px',
              textAlign: 'left',
              overflow: 'auto',
              maxWidth: '100%',
            }}>
              {error.toString()}
            </pre>
          )}
        </div>
      )}
      beforeCapture={(scope) => {
        // Add additional context before capturing error
        scope.setTag('error_boundary', 'react');
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};
