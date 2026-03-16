/**
 * Unit tests for HUD components
 * Tests ChainCounter, ComboFlash, PerfectBonus, and SurgeFlash
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChainCounter } from '@features/hud/components/ChainCounter';
import { ComboFlash } from '@features/hud/components/ComboFlash';
import { PerfectBonus } from '@features/hud/components/PerfectBonus';
import { SurgeFlash } from '@features/hud/components/SurgeFlash';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ChainCounter', () => {
  it('should not render when chain is less than 2', () => {
    const { container } = render(<ChainCounter chain={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when chain is 0', () => {
    const { container } = render(<ChainCounter chain={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when chain is 2', () => {
    render(<ChainCounter chain={2} />);
    expect(screen.getByText(/x2 ZİNCİR/i)).toBeInTheDocument();
    expect(screen.getByText(/Zincir Reaksiyon/i)).toBeInTheDocument();
  });

  it('should render when chain is 3', () => {
    render(<ChainCounter chain={3} />);
    expect(screen.getByText(/x3 ZİNCİR/i)).toBeInTheDocument();
  });

  it('should render when chain is 4 or higher', () => {
    render(<ChainCounter chain={5} />);
    expect(screen.getByText(/x5 ZİNCİR/i)).toBeInTheDocument();
  });

  it('should apply blue color for chain 2', () => {
    const { container } = render(<ChainCounter chain={2} />);
    const chainText = container.querySelector('span');
    expect(chainText?.style.color).toBe('rgb(96, 165, 250)'); // #60a5fa
  });

  it('should apply purple color for chain 3', () => {
    const { container } = render(<ChainCounter chain={3} />);
    const chainText = container.querySelector('span');
    expect(chainText?.style.color).toBe('rgb(167, 139, 250)'); // #a78bfa
  });

  it('should apply amber color for chain 4+', () => {
    const { container } = render(<ChainCounter chain={4} />);
    const chainText = container.querySelector('span');
    expect(chainText?.style.color).toBe('rgb(245, 158, 11)'); // #f59e0b
  });

  it('should display correct chain number', () => {
    render(<ChainCounter chain={10} />);
    expect(screen.getByText(/x10 ZİNCİR/i)).toBeInTheDocument();
  });
});

describe('ComboFlash', () => {
  it('should not render when combo is 0', () => {
    const { container } = render(<ComboFlash combo={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when combo is 1', () => {
    const { container } = render(<ComboFlash combo={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when combo is 2', () => {
    const { container } = render(<ComboFlash combo={2} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('should render when combo is higher', () => {
    const { container } = render(<ComboFlash combo={5} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('should have pointer-events-none class', () => {
    const { container } = render(<ComboFlash combo={2} />);
    const flash = container.firstChild as HTMLElement;
    expect(flash?.className).toContain('pointer-events-none');
  });

  it('should have fixed positioning', () => {
    const { container } = render(<ComboFlash combo={2} />);
    const flash = container.firstChild as HTMLElement;
    expect(flash?.className).toContain('fixed');
    expect(flash?.className).toContain('inset-0');
  });

  it('should apply blue gradient for combo 2', () => {
    const { container } = render(<ComboFlash combo={2} />);
    const flash = container.firstChild as HTMLElement;
    expect(flash?.style.background).toContain('59, 130, 246');
  });

  it('should apply indigo gradient for combo 3-4', () => {
    const { container } = render(<ComboFlash combo={3} />);
    const flash = container.firstChild as HTMLElement;
    expect(flash?.style.background).toContain('99, 102, 241');
  });

  it('should apply amber gradient for combo 5+', () => {
    const { container } = render(<ComboFlash combo={5} />);
    const flash = container.firstChild as HTMLElement;
    expect(flash?.style.background).toContain('245, 158, 11');
  });
});

describe('PerfectBonus', () => {
  it('should not render when show is false', () => {
    const { container } = render(<PerfectBonus show={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when show is true', () => {
    render(<PerfectBonus show={true} />);
    expect(screen.getByText(/✦ PERFECT!/i)).toBeInTheDocument();
  });

  it('should display bonus text', () => {
    render(<PerfectBonus show={true} />);
    expect(screen.getByText(/\+%50 Renk Bonusu/i)).toBeInTheDocument();
  });

  it('should have amber color for perfect text', () => {
    const { container } = render(<PerfectBonus show={true} />);
    const perfectText = container.querySelector('span');
    expect(perfectText?.style.color).toBe('rgb(251, 191, 36)'); // #fbbf24
  });

  it('should have large font size', () => {
    const { container } = render(<PerfectBonus show={true} />);
    const perfectText = container.querySelector('span');
    expect(perfectText?.className).toContain('text-3xl');
    expect(perfectText?.className).toContain('md:text-5xl');
  });

  it('should have font-black weight', () => {
    const { container } = render(<PerfectBonus show={true} />);
    const perfectText = container.querySelector('span');
    expect(perfectText?.className).toContain('font-black');
  });
});

describe('SurgeFlash', () => {
  it('should not render when active is false', () => {
    const { container } = render(<SurgeFlash active={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when active is true', () => {
    const { container } = render(<SurgeFlash active={true} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('should have pointer-events-none class', () => {
    const { container } = render(<SurgeFlash active={true} />);
    const flash = container.firstChild as HTMLElement;
    expect(flash?.className).toContain('pointer-events-none');
  });

  it('should have fixed positioning', () => {
    const { container } = render(<SurgeFlash active={true} />);
    const flash = container.firstChild as HTMLElement;
    expect(flash?.className).toContain('fixed');
    expect(flash?.className).toContain('inset-0');
  });

  it('should have high z-index', () => {
    const { container } = render(<SurgeFlash active={true} />);
    const flash = container.firstChild as HTMLElement;
    expect(flash?.className).toContain('z-40');
  });

  it('should have amber radial gradient', () => {
    const { container } = render(<SurgeFlash active={true} />);
    const flash = container.firstChild as HTMLElement;
    expect(flash?.style.background).toContain('radial-gradient');
    expect(flash?.style.background).toContain('251, 191, 36');
  });
});
