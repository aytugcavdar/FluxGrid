/**
 * ConsentModal Component Tests
 * 
 * Tests for GDPR consent modal UI component
 * Requirements: 1.3, 1.5, 1.7
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConsentModal } from './ConsentModal';
import { ConsentType } from '@core/services/gdpr';

describe('ConsentModal', () => {
  it('should render consent modal with title and description', () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    expect(screen.getByText('Gizlilik Tercihleri')).toBeInTheDocument();
    expect(
      screen.getByText(/FluxGrid'i kullanmaya devam etmek için/)
    ).toBeInTheDocument();
  });

  it('should render both consent options', () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    expect(screen.getByText('Kişiselleştirilmiş Reklamlar')).toBeInTheDocument();
    expect(screen.getByText('Kişiselleştirilmemiş Reklamlar')).toBeInTheDocument();
  });

  it('should render privacy policy link with default URL', () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    const privacyLink = screen.getByText('Gizlilik Politikamızı');
    expect(privacyLink).toHaveAttribute('href', 'https://fluxgrid.app/privacy');
    expect(privacyLink).toHaveAttribute('target', '_blank');
    expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render privacy policy link with custom URL', () => {
    const onConsent = vi.fn();
    const customUrl = 'https://custom.com/privacy';
    render(<ConsentModal onConsent={onConsent} privacyPolicyUrl={customUrl} />);

    const privacyLink = screen.getByText('Gizlilik Politikamızı');
    expect(privacyLink).toHaveAttribute('href', customUrl);
  });

  it('should have submit button disabled by default', () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when personalized ads selected', () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    const personalizedOption = screen.getByText('Kişiselleştirilmiş Reklamlar').closest('button');
    fireEvent.click(personalizedOption!);

    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should enable submit button when non-personalized ads selected', () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    const nonPersonalizedOption = screen
      .getByText('Kişiselleştirilmemiş Reklamlar')
      .closest('button');
    fireEvent.click(nonPersonalizedOption!);

    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onConsent with PERSONALIZED when personalized option selected and submitted', async () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    // Select personalized ads
    const personalizedOption = screen.getByText('Kişiselleştirilmiş Reklamlar').closest('button');
    fireEvent.click(personalizedOption!);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onConsent).toHaveBeenCalledWith(ConsentType.PERSONALIZED);
    });
  });

  it('should call onConsent with NON_PERSONALIZED when non-personalized option selected and submitted', async () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    // Select non-personalized ads
    const nonPersonalizedOption = screen
      .getByText('Kişiselleştirilmemiş Reklamlar')
      .closest('button');
    fireEvent.click(nonPersonalizedOption!);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onConsent).toHaveBeenCalledWith(ConsentType.NON_PERSONALIZED);
    });
  });

  it('should allow changing selection before submitting', async () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    // Select personalized
    const personalizedOption = screen.getByText('Kişiselleştirilmiş Reklamlar').closest('button');
    fireEvent.click(personalizedOption!);

    // Change to non-personalized
    const nonPersonalizedOption = screen
      .getByText('Kişiselleştirilmemiş Reklamlar')
      .closest('button');
    fireEvent.click(nonPersonalizedOption!);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onConsent).toHaveBeenCalledWith(ConsentType.NON_PERSONALIZED);
    });
  });

  it('should show loading state while submitting', async () => {
    const onConsent = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
    render(<ConsentModal onConsent={onConsent} />);

    // Select option
    const personalizedOption = screen.getByText('Kişiselleştirilmiş Reklamlar').closest('button');
    fireEvent.click(personalizedOption!);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    fireEvent.click(submitButton);

    // Check loading state
    expect(screen.getByText('Kaydediliyor...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(onConsent).toHaveBeenCalled();
    });
  });

  it('should handle async onConsent callback', async () => {
    const onConsent = vi.fn(async (): Promise<void> => {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    });
    render(<ConsentModal onConsent={onConsent} />);

    // Select and submit
    const personalizedOption = screen.getByText('Kişiselleştirilmiş Reklamlar').closest('button');
    fireEvent.click(personalizedOption!);

    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onConsent).toHaveBeenCalledWith(ConsentType.PERSONALIZED);
    });
  });

  it('should handle errors during consent submission', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onConsent = vi.fn(() => Promise.reject(new Error('Network error')));
    render(<ConsentModal onConsent={onConsent} />);

    // Select and submit
    const personalizedOption = screen.getByText('Kişiselleştirilmiş Reklamlar').closest('button');
    fireEvent.click(personalizedOption!);

    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating consent:',
        expect.any(Error)
      );
    });

    // Button should be re-enabled after error
    expect(submitButton).not.toBeDisabled();

    consoleErrorSpy.mockRestore();
  });

  it('should visually indicate selected option', () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    const personalizedOption = screen.getByText('Kişiselleştirilmiş Reklamlar').closest('button');
    fireEvent.click(personalizedOption!);

    // Check for visual indicator (blue border and background)
    expect(personalizedOption).toHaveClass('border-blue-500');
    expect(personalizedOption).toHaveClass('bg-blue-500/10');
  });

  it('should not submit when no option is selected', () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    
    // Try to click disabled button (should not call onConsent)
    fireEvent.click(submitButton);

    expect(onConsent).not.toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    const onConsent = vi.fn();
    render(<ConsentModal onConsent={onConsent} />);

    // Check that options are buttons (keyboard accessible)
    const personalizedOption = screen.getByText('Kişiselleştirilmiş Reklamlar').closest('button');
    const nonPersonalizedOption = screen
      .getByText('Kişiselleştirilmemiş Reklamlar')
      .closest('button');

    expect(personalizedOption?.tagName).toBe('BUTTON');
    expect(nonPersonalizedOption?.tagName).toBe('BUTTON');

    // Check submit button
    const submitButton = screen.getByRole('button', { name: /Devam Et/i });
    expect(submitButton).toBeInTheDocument();
  });
});
