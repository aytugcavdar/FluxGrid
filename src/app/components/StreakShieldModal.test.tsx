import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreakShieldModal } from './StreakShieldModal';

describe('StreakShieldModal', () => {
  it('should not render when isVisible is false', () => {
    const onWatchAd = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <StreakShieldModal
        isVisible={false}
        currentStreak={10}
        streakBroken={false}
        onWatchAd={onWatchAd}
        onClose={onClose}
        shieldsAvailable={1}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render Mode A (Earn Shield) when streakBroken is false', () => {
    const onWatchAd = vi.fn();
    const onClose = vi.fn();

    render(
      <StreakShieldModal
        isVisible={true}
        currentStreak={15}
        streakBroken={false}
        onWatchAd={onWatchAd}
        onClose={onClose}
        shieldsAvailable={1}
      />
    );

    expect(screen.getByText('Protect Your Streak!')).toBeInTheDocument();
    expect(screen.getByText(/15 days/)).toBeInTheDocument();
    expect(screen.getByText(/Shields: 1\/2/)).toBeInTheDocument();
    expect(screen.getByText(/Watch Ad → Earn Shield/)).toBeInTheDocument();
  });

  it('should render Mode B (Save Streak) when streakBroken is true', () => {
    const onWatchAd = vi.fn();
    const onClose = vi.fn();

    render(
      <StreakShieldModal
        isVisible={true}
        currentStreak={10}
        streakBroken={true}
        onWatchAd={onWatchAd}
        onClose={onClose}
        shieldsAvailable={1}
      />
    );

    expect(screen.getByText('Streak Broken!')).toBeInTheDocument();
    expect(screen.getByText(/10-day streak/)).toBeInTheDocument();
    expect(screen.getByText(/Watch Ad → Save Streak/)).toBeInTheDocument();
  });

  it('should call onWatchAd when Watch Ad button clicked', () => {
    const onWatchAd = vi.fn();
    const onClose = vi.fn();

    render(
      <StreakShieldModal
        isVisible={true}
        currentStreak={5}
        streakBroken={false}
        onWatchAd={onWatchAd}
        onClose={onClose}
        shieldsAvailable={0}
      />
    );

    const button = screen.getByRole('button', { name: /Watch Ad → Earn Shield/ });
    fireEvent.click(button);
    expect(onWatchAd).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button clicked', () => {
    const onWatchAd = vi.fn();
    const onClose = vi.fn();

    render(
      <StreakShieldModal
        isVisible={true}
        currentStreak={5}
        streakBroken={false}
        onWatchAd={onWatchAd}
        onClose={onClose}
        shieldsAvailable={1}
      />
    );

    const closeButton = screen.getAllByRole('button')[0]; // First button is close
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should disable Watch Ad button when shieldsAvailable >= 2 in Mode A', () => {
    const onWatchAd = vi.fn();
    const onClose = vi.fn();

    render(
      <StreakShieldModal
        isVisible={true}
        currentStreak={5}
        streakBroken={false}
        onWatchAd={onWatchAd}
        onClose={onClose}
        shieldsAvailable={2}
      />
    );

    const button = screen.getByRole('button', { name: /Watch Ad → Earn Shield/ });
    expect(button).toBeDisabled();
  });

  it('should disable Watch Ad button when shieldsAvailable is 0 in Mode B', () => {
    const onWatchAd = vi.fn();
    const onClose = vi.fn();

    render(
      <StreakShieldModal
        isVisible={true}
        currentStreak={5}
        streakBroken={true}
        onWatchAd={onWatchAd}
        onClose={onClose}
        shieldsAvailable={0}
      />
    );

    const button = screen.getByRole('button', { name: /No Shields Available/ });
    expect(button).toBeDisabled();
  });

  it('should call onClose when backdrop is clicked', () => {
    const onWatchAd = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <StreakShieldModal
        isVisible={true}
        currentStreak={5}
        streakBroken={false}
        onWatchAd={onWatchAd}
        onClose={onClose}
        shieldsAvailable={1}
      />
    );

    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
