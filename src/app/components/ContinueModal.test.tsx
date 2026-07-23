import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContinueModal } from './ContinueModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'continueModal.title': 'CONTINUE?',
        'continueModal.subtitle': "Your game isn't over!",
        'continueModal.summaryTitle': 'Safe space + 3 new pieces',
        'continueModal.summarySubtitle': 'Your score stays safe.',
        'continueModal.watchAd': 'Watch Ad & Continue',
        'continueModal.loading': 'Loading ad...',
        'continueModal.limitReached': 'Daily limit reached',
        'continueModal.remaining_other': `${options?.count ?? 0} uses remaining today`,
        'continueModal.noThanks': 'No thanks, exit',
      };
      return translations[key] ?? key;
    },
  }),
}));

const renderModal = (overrides: Partial<ComponentProps<typeof ContinueModal>> = {}) => {
  const props: ComponentProps<typeof ContinueModal> = {
    isVisible: true,
    onContinue: vi.fn(),
    onDecline: vi.fn(),
    canContinue: true,
    usesRemaining: 2,
    ...overrides,
  };
  return { ...render(<ContinueModal {...props} />), props };
};

describe('ContinueModal', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders the current continue offer', () => {
    renderModal();

    expect(screen.getByText('CONTINUE?')).toBeInTheDocument();
    expect(screen.getByText('2 uses remaining today')).toBeInTheDocument();
    expect(screen.getByText('Safe space + 3 new pieces')).toBeInTheDocument();
  });

  it('calls onContinue from the rewarded button', () => {
    const onContinue = vi.fn();
    renderModal({ onContinue });

    fireEvent.click(screen.getByRole('button', { name: /watch ad/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('disables rewarded continue when unavailable', () => {
    renderModal({ canContinue: false, usesRemaining: 0 });

    expect(screen.getByRole('button', { name: /daily limit reached/i })).toBeDisabled();
    expect(screen.queryByText(/uses remaining today/i)).not.toBeInTheDocument();
  });

  it('auto-declines after seven seconds', async () => {
    const onDecline = vi.fn();
    renderModal({ onDecline });

    await act(async () => vi.advanceTimersByTimeAsync(7000));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('calls onDecline from the exit button', () => {
    const onDecline = vi.fn();
    renderModal({ onDecline });

    fireEvent.click(screen.getByRole('button', { name: /no thanks, exit/i }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('updates the countdown once per second', async () => {
    renderModal();
    expect(screen.getByText(/\(7\)$/)).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByText(/\(5\)$/)).toBeInTheDocument();
  });

  it('does not render while hidden', () => {
    renderModal({ isVisible: false });
    expect(screen.queryByText('CONTINUE?')).not.toBeInTheDocument();
  });

  it('resets the countdown when reopened', async () => {
    const { rerender, props } = renderModal();
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByText(/\(5\)$/)).toBeInTheDocument();

    rerender(<ContinueModal {...props} isVisible={false} />);
    rerender(<ContinueModal {...props} isVisible={true} />);
    expect(screen.getByText(/\(7\)$/)).toBeInTheDocument();
  });

  it('declines when the backdrop is pressed', () => {
    const onDecline = vi.fn();
    renderModal({ onDecline });

    fireEvent.click(screen.getByTestId('continue-backdrop'));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('pauses the countdown while an ad is loading', async () => {
    const onDecline = vi.fn();
    renderModal({ isLoading: true, onDecline });

    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(onDecline).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /loading ad/i })).toBeDisabled();
  });

  it('blocks dismiss actions while an ad is loading', () => {
    const onDecline = vi.fn();
    renderModal({ isLoading: true, onDecline });

    const exitButton = screen.getByRole('button', { name: /no thanks, exit/i });
    expect(exitButton).toBeDisabled();

    fireEvent.click(exitButton);
    fireEvent.click(screen.getByTestId('continue-backdrop'));
    expect(onDecline).not.toHaveBeenCalled();
  });
});
