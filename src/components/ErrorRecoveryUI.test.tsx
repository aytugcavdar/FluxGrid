/**
 * ErrorRecoveryUI Component Tests
 * 
 * Tests for error recovery UI components including modal, toast, and inline errors.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ErrorRecoveryModal,
  ErrorToast,
  InlineError,
  getErrorMessage,
} from './ErrorRecoveryUI';
import { ErrorCategory, ErrorSeverity } from '@utils/errorHandler';

describe('getErrorMessage', () => {
  it('should return correct message for STORAGE category', () => {
    const result = getErrorMessage(ErrorCategory.STORAGE);
    expect(result.title).toBe('Veri Hatası');
    expect(result.message).toContain('Verileriniz kaydedilirken');
  });

  it('should return correct message for GAME_STATE category', () => {
    const result = getErrorMessage(ErrorCategory.GAME_STATE);
    expect(result.title).toBe('Oyun Hatası');
    expect(result.message).toContain('Oyun durumu bozuldu');
  });

  it('should return correct message for NETWORK category', () => {
    const result = getErrorMessage(ErrorCategory.NETWORK);
    expect(result.title).toBe('Bağlantı Hatası');
    expect(result.message).toContain('İnternet bağlantınızı');
  });

  it('should return correct message for RENDER category', () => {
    const result = getErrorMessage(ErrorCategory.RENDER);
    expect(result.title).toBe('Görüntüleme Hatası');
    expect(result.message).toContain('Ekran görüntülenirken');
  });

  it('should return correct message for AUDIO category', () => {
    const result = getErrorMessage(ErrorCategory.AUDIO);
    expect(result.title).toBe('Ses Hatası');
    expect(result.message).toContain('Ses çalınırken');
  });

  it('should return correct message for VALIDATION category', () => {
    const result = getErrorMessage(ErrorCategory.VALIDATION);
    expect(result.title).toBe('Doğrulama Hatası');
    expect(result.message).toContain('Girdiğiniz bilgiler');
  });

  it('should return correct message for UNKNOWN category', () => {
    const result = getErrorMessage(ErrorCategory.UNKNOWN);
    expect(result.title).toBe('Bilinmeyen Hata');
    expect(result.message).toContain('Beklenmeyen bir hata');
  });
});

describe('ErrorRecoveryModal', () => {
  const mockError = new Error('Test error');

  it('should render modal with error message', () => {
    render(
      <ErrorRecoveryModal
        error={mockError}
        category={ErrorCategory.STORAGE}
        severity={ErrorSeverity.HIGH}
      />
    );

    expect(screen.getByText('Veri Hatası')).toBeInTheDocument();
    expect(screen.getByText(/Verileriniz kaydedilirken/)).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = vi.fn();

    render(
      <ErrorRecoveryModal
        error={mockError}
        category={ErrorCategory.STORAGE}
        severity={ErrorSeverity.HIGH}
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByText('Tekrar Dene');
    expect(retryButton).toBeInTheDocument();

    retryButton.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render reload button when onReload is provided', () => {
    const onReload = vi.fn();

    render(
      <ErrorRecoveryModal
        error={mockError}
        category={ErrorCategory.STORAGE}
        severity={ErrorSeverity.HIGH}
        onReload={onReload}
      />
    );

    const reloadButton = screen.getByText('Sayfayı Yenile');
    expect(reloadButton).toBeInTheDocument();

    reloadButton.click();
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('should render dismiss button for non-critical errors', () => {
    const onDismiss = vi.fn();

    render(
      <ErrorRecoveryModal
        error={mockError}
        category={ErrorCategory.STORAGE}
        severity={ErrorSeverity.MEDIUM}
        onDismiss={onDismiss}
      />
    );

    const dismissButton = screen.getByText('Kapat');
    expect(dismissButton).toBeInTheDocument();

    dismissButton.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not render dismiss button for critical errors', () => {
    const onDismiss = vi.fn();

    render(
      <ErrorRecoveryModal
        error={mockError}
        category={ErrorCategory.STORAGE}
        severity={ErrorSeverity.CRITICAL}
        onDismiss={onDismiss}
      />
    );

    expect(screen.queryByText('Kapat')).not.toBeInTheDocument();
  });

  it('should display error details in dev mode', () => {
    const originalEnv = import.meta.env.DEV;
    // @ts-ignore - mocking env
    import.meta.env.DEV = true;

    render(
      <ErrorRecoveryModal
        error={mockError}
        category={ErrorCategory.STORAGE}
        severity={ErrorSeverity.HIGH}
      />
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();

    // @ts-ignore - restore env
    import.meta.env.DEV = originalEnv;
  });

  it('should use red styling for critical errors', () => {
    const { container } = render(
      <ErrorRecoveryModal
        error={mockError}
        category={ErrorCategory.STORAGE}
        severity={ErrorSeverity.CRITICAL}
      />
    );

    const iconContainer = container.querySelector('.bg-red-500\\/20');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should use yellow styling for non-critical errors', () => {
    const { container } = render(
      <ErrorRecoveryModal
        error={mockError}
        category={ErrorCategory.STORAGE}
        severity={ErrorSeverity.MEDIUM}
      />
    );

    const iconContainer = container.querySelector('.bg-yellow-500\\/20');
    expect(iconContainer).toBeInTheDocument();
  });
});

describe('ErrorToast', () => {
  const mockError = new Error('Test error');

  it('should render toast with error message', () => {
    render(<ErrorToast error={mockError} category={ErrorCategory.NETWORK} />);

    expect(screen.getByText('Bağlantı Hatası')).toBeInTheDocument();
    expect(screen.getByText(/İnternet bağlantınızı/)).toBeInTheDocument();
  });

  it('should render dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();

    render(
      <ErrorToast error={mockError} category={ErrorCategory.NETWORK} onDismiss={onDismiss} />
    );

    const dismissButton = screen.getByLabelText('Kapat');
    expect(dismissButton).toBeInTheDocument();

    dismissButton.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not render dismiss button when onDismiss is not provided', () => {
    render(<ErrorToast error={mockError} category={ErrorCategory.NETWORK} />);

    expect(screen.queryByLabelText('Kapat')).not.toBeInTheDocument();
  });
});

describe('InlineError', () => {
  it('should render inline error message', () => {
    render(<InlineError message="Invalid input" />);

    expect(screen.getByText('Invalid input')).toBeInTheDocument();
  });

  it('should render error icon', () => {
    const { container } = render(<InlineError message="Invalid input" />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
