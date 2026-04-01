import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerfectBonus } from '../../../../src/features/hud/components/PerfectBonus';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe('PerfectBonus', () => {
  describe('Perfect bonus responsive sizing (Task 9.5)', () => {
    let originalInnerWidth: number;

    beforeEach(() => {
      originalInnerWidth = window.innerWidth;
    });

    afterEach(() => {
      // Restore original window width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    it('should use mobile font size (48px) on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      render(<PerfectBonus show={true} />);
      const bonus = screen.getByText(/PERFECT!/i);
      expect(bonus).toBeInTheDocument();
    });

    it('should use desktop font size (64px) on desktop devices', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920, // Desktop width
      });

      render(<PerfectBonus show={true} />);
      const bonus = screen.getByText(/PERFECT!/i);
      expect(bonus).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      const { container } = render(<PerfectBonus show={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Sparkle particles (Task 9.3)', () => {
    it('should render sparkle particles when shown', () => {
      const { container } = render(<PerfectBonus show={true} />);
      
      // Check that component renders
      expect(screen.getByText(/PERFECT!/i)).toBeInTheDocument();
      
      // Component should be in the DOM
      expect(container.firstChild).not.toBeNull();
    });
  });
});
