import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SCORE_IMPACT_EVENT,
  type ScoreImpactDetail,
} from './ScoreImpactValue';
import { getTierVisualState, TierProgressInline } from './TierProgressInline';

describe('getTierVisualState', () => {
  it('returns actionable progress data for the current tier', () => {
    expect(getTierVisualState(6_000)).toEqual({
      tier: 1,
      progress: 10,
      scoreNeeded: 9_000,
      isMaxTier: false,
      loop: 0,
    });
  });

  it('caps progress at the maximum tier', () => {
    expect(getTierVisualState(200_000)).toEqual({
      tier: 6,
      progress: 100,
      scoreNeeded: 0,
      isMaxTier: true,
      loop: 1,
    });
  });
});

describe('TierProgressInline score synchronization', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for score arrival and completes the old tier before advancing', () => {
    vi.useFakeTimers();
    const { rerender } = render(<TierProgressInline score={4_000} deferImpact={false} />);

    expect(screen.getByText('T0 NORMAL')).toBeInTheDocument();
    expect(screen.getByText('1.000 KALDI')).toBeInTheDocument();

    rerender(<TierProgressInline score={6_000} deferImpact />);
    expect(screen.getByText('T0 NORMAL')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent<ScoreImpactDetail>(SCORE_IMPACT_EVENT, {
        detail: { score: 6_000, delta: 2_000, combo: 2, color: '#34d399' },
      }));
      vi.advanceTimersByTime(60);
    });

    expect(screen.getByText('TIER UP')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    act(() => {
      vi.advanceTimersByTime(240);
    });

    expect(screen.getByText('T1 BUZ')).toBeInTheDocument();
    expect(screen.getByText('9.000 KALDI')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');
  });

  it('uses the max-tier progress area for gravity charge', () => {
    const { container } = render(
      <TierProgressInline score={140_000} deferImpact={false} gravityCharge={2} />
    );
    const progress = screen.getByRole('progressbar');

    expect(progress).toHaveAttribute('aria-valuemax', '3');
    expect(progress).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByText('YERCEKIMI 2/3')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-filled="false"]')).toHaveLength(1);
  });

  it('shows loop labels after tier 6 endgame thresholds', () => {
    render(<TierProgressInline score={300_000} deferImpact={false} gravityCharge={1} />);

    expect(screen.getByText('T6 LOOP 2')).toBeInTheDocument();
    expect(screen.getByText('YERCEKIMI 1/3')).toBeInTheDocument();
  });

  it('briefly shows a full charge when gravity triggers', () => {
    vi.useFakeTimers();
    const { container } = render(
      <TierProgressInline
        score={140_000}
        deferImpact={false}
        gravityCharge={0}
        gravityTriggered
      />
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
    expect(screen.getByText('YERCEKIMI 3/3')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(3);

    act(() => {
      vi.advanceTimersByTime(520);
    });

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('YERCEKIMI 0/3')).toBeInTheDocument();
  });
});
