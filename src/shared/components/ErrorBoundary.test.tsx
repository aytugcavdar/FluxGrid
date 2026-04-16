/**
 * ErrorBoundary Component Tests
 * 
 * Tests for React error boundary component including error catching,
 * recovery UI, and integration with error handler.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import * as errorHandler from '@/src/utils/managers/errorHandler';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Bir hata oluştu')).toBeInTheDocument();
    expect(screen.getByText('Üzgünüz, bir şeyler yanlış gitti. Lütfen tekrar deneyin.')).toBeInTheDocument();
  });

  it('should call handleError when error is caught', () => {
    const handleErrorSpy = vi.spyOn(errorHandler, 'handleError');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.any(Error),
      errorHandler.ErrorCategory.RENDER,
      errorHandler.ErrorSeverity.HIGH,
      expect.objectContaining({
        componentStack: expect.any(String),
        errorBoundary: true,
      })
    );
  });

  it('should display custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Bir hata oluştu')).not.toBeInTheDocument();
  });

  it('should call onError callback when error is caught', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should display retry and reload buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
    expect(screen.getByText('Sayfayı Yenile')).toBeInTheDocument();
  });

  it('should reset error state when retry button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Bir hata oluştu')).toBeInTheDocument();

    const retryButton = screen.getByText('Tekrar Dene');
    retryButton.click();

    // After reset, re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should reset error state when resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Bir hata oluştu')).toBeInTheDocument();

    // Change resetKeys to trigger reset
    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should display error message in dev mode', () => {
    const originalEnv = import.meta.env.DEV;
    // @ts-ignore - mocking env
    import.meta.env.DEV = true;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();

    // @ts-ignore - restore env
    import.meta.env.DEV = originalEnv;
  });

  it('should not display error message in production mode', () => {
    const originalEnv = import.meta.env.DEV;
    // @ts-ignore - mocking env
    import.meta.env.DEV = false;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Test error')).not.toBeInTheDocument();

    // @ts-ignore - restore env
    import.meta.env.DEV = originalEnv;
  });
});
