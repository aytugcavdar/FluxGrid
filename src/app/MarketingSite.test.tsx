import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MarketingSite } from './MarketingSite';

describe('MarketingSite', () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it('explains the current 2D gravity game on the home page', () => {
    window.history.replaceState({}, '', '/');
    const { container } = render(<MarketingSite />);

    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Clear the grid. Shift the board. Build the chain.',
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gravity changes the board' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Special blocks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Timed runs' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Privacy' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Privacy' })[0]).toHaveAttribute('href', '/privacy');
    expect(container.querySelectorAll('.marketing-demo-cell')).toHaveLength(100);
    expect(document.title).toBe('FluxGrid - 2D Gravity Block Puzzle');
  });

  it('keeps the privacy route available', () => {
    window.history.replaceState({}, '', '/privacy');
    render(<MarketingSite />);

    expect(screen.getByRole('heading', { level: 1, name: 'FluxGrid Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByText('Last updated: June 7, 2026')).toBeInTheDocument();
  });
});
