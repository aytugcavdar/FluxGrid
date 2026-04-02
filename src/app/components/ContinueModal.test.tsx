import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ContinueModal } from './ContinueModal';

describe('ContinueModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render with correct props', () => {
    const onContinue = vi.fn();
    const onDecline = vi.fn();

    render(
      <ContinueModal
        isVisible={true}
        onContinue={onContinue}
        onDecline={onDecline}
        canContinue={true}
        usesRemaining={2}
      />
    );

    expect(screen.getByText('Continue?')).toBeInTheDocument();
    expect(screen.getByText(/2.*uses.*remaining/i)).toBeInTheDocument();
    expect(screen.getByText('💀')).toBeInTheDocument();
  });

  it('should call onContinue when Watch Ad button clicked', () => {
    const onContinue = vi.fn();
    const onDecline = vi.fn();

    render(
      <ContinueModal
        isVisible={true}
        onContinue={onContinue}
        onDecline={onDecline}
        canContinue={true}
        usesRemaining={2}
      />
    );

    const button = screen.getByRole('button', { name: /watch ad/i });
    fireEvent.click(button);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('should disable button when canContinue is false', () => {
    render(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
        canContinue={false}
        usesRemaining={0}
      />
    );

    const button = screen.getByRole('button', { name: /daily limit reached/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/daily limit reached/i)).toBeInTheDocument();
  });

  it('should display uses remaining count', () => {
    render(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
        canContinue={true}
        usesRemaining={1}
      />
    );

    expect(screen.getByText(/1 use remaining today/i)).toBeInTheDocument();
  });

  it('should display plural uses for multiple remaining', () => {
    render(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
        canContinue={true}
        usesRemaining={3}
      />
    );

    expect(screen.getByText(/3 uses remaining today/i)).toBeInTheDocument();
  });

  it('should auto-decline after 5 seconds', async () => {
    const onDecline = vi.fn();

    render(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={onDecline}
        canContinue={true}
        usesRemaining={2}
      />
    );

    // Fast-forward 5 seconds
    await vi.advanceTimersByTimeAsync(5000);

    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('should call onDecline when "No, exit" link clicked', () => {
    const onDecline = vi.fn();

    render(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={onDecline}
        canContinue={true}
        usesRemaining={2}
      />
    );

    const exitButton = screen.getByRole('button', { name: /no, exit/i });
    fireEvent.click(exitButton);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('should update countdown timer', async () => {
    render(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
        canContinue={true}
        usesRemaining={2}
      />
    );

    // Initial countdown should be 5
    expect(screen.getByText('5')).toBeInTheDocument();

    // Advance 1 second
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText('4')).toBeInTheDocument();

    // Advance another second
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should not render when isVisible is false', () => {
    render(
      <ContinueModal
        isVisible={false}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
        canContinue={true}
        usesRemaining={2}
      />
    );

    expect(screen.queryByText('Continue?')).not.toBeInTheDocument();
  });

  it('should reset countdown when modal becomes visible again', async () => {
    const { rerender } = render(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
        canContinue={true}
        usesRemaining={2}
      />
    );

    // Advance 2 seconds
    await vi.advanceTimersByTimeAsync(2000);
    expect(screen.getByText('3')).toBeInTheDocument();

    // Hide modal
    rerender(
      <ContinueModal
        isVisible={false}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
        canContinue={true}
        usesRemaining={2}
      />
    );

    // Show modal again
    rerender(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
        canContinue={true}
        usesRemaining={2}
      />
    );

    // Countdown should reset to 5
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display grid clear info', () => {
    render(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={vi.fn()}
        canContinue={true}
        usesRemaining={2}
      />
    );

    expect(screen.getByText(/grid will be partially cleared/i)).toBeInTheDocument();
    expect(screen.getByText(/you'll get 3 new pieces/i)).toBeInTheDocument();
  });

  it('should call onDecline when backdrop is clicked', () => {
    const onDecline = vi.fn();

    render(
      <ContinueModal
        isVisible={true}
        onContinue={vi.fn()}
        onDecline={onDecline}
        canContinue={true}
        usesRemaining={2}
      />
    );

    // Click the backdrop (the first div with backdrop-blur)
    const backdrop = document.querySelector('.backdrop-blur-md');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onDecline).toHaveBeenCalledTimes(1);
    }
  });
});
