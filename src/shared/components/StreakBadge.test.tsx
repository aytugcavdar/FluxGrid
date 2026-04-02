import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreakBadge } from './StreakBadge';

describe('StreakBadge', () => {
  it('should render with streak number', () => {
    const onShieldPress = vi.fn();

    render(
      <StreakBadge
        streak={15}
        todayPlayed={true}
        shields={0}
        onShieldPress={onShieldPress}
      />
    );

    expect(screen.getByText(/15/)).toBeInTheDocument();
    expect(screen.getByText(/🔥/)).toBeInTheDocument();
  });

  it('should display shield badge when shields > 0', () => {
    const onShieldPress = vi.fn();

    render(
      <StreakBadge
        streak={10}
        todayPlayed={true}
        shields={2}
        onShieldPress={onShieldPress}
      />
    );

    expect(screen.getByText(/🛡️/)).toBeInTheDocument();
  });

  it('should call onShieldPress when clicked', () => {
    const onShieldPress = vi.fn();

    render(
      <StreakBadge
        streak={5}
        todayPlayed={true}
        shields={1}
        onShieldPress={onShieldPress}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onShieldPress).toHaveBeenCalledTimes(1);
  });

  it('should have reduced opacity when todayPlayed is false', () => {
    const onShieldPress = vi.fn();

    const { container } = render(
      <StreakBadge
        streak={5}
        todayPlayed={false}
        shields={0}
        onShieldPress={onShieldPress}
      />
    );

    const button = container.querySelector('button');
    expect(button).toHaveStyle({ opacity: '0.5' });
  });

  it('should have full opacity when todayPlayed is true', () => {
    const onShieldPress = vi.fn();

    const { container } = render(
      <StreakBadge
        streak={5}
        todayPlayed={true}
        shields={0}
        onShieldPress={onShieldPress}
      />
    );

    const button = container.querySelector('button');
    expect(button).toHaveStyle({ opacity: '1' });
  });
});
