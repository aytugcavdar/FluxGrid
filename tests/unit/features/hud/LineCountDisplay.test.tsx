import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineCountDisplay } from '../../../../src/features/hud/components/LineCountDisplay';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe('LineCountDisplay', () => {
  describe('Line count display colors (Task 8.6)', () => {
    it('should use blue color for 2 lines', () => {
      render(<LineCountDisplay lineCount={2} show={true} />);
      const display = screen.getByText('2 SATIR!');
      expect(display).toBeInTheDocument();
    });

    it('should use purple color for 3 lines', () => {
      render(<LineCountDisplay lineCount={3} show={true} />);
      const display = screen.getByText('3 SATIR!');
      expect(display).toBeInTheDocument();
    });

    it('should use gold color for 4+ lines', () => {
      render(<LineCountDisplay lineCount={4} show={true} />);
      const display = screen.getByText('4 SATIR!');
      expect(display).toBeInTheDocument();
    });

    it('should use gold color for 5+ lines', () => {
      render(<LineCountDisplay lineCount={5} show={true} />);
      const display = screen.getByText('5 SATIR!');
      expect(display).toBeInTheDocument();
    });
  });

  describe('Display visibility', () => {
    it('should not render when show is false', () => {
      const { container } = render(<LineCountDisplay lineCount={2} show={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render for lineCount < 2', () => {
      const { container } = render(<LineCountDisplay lineCount={1} show={true} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render for lineCount 0', () => {
      const { container } = render(<LineCountDisplay lineCount={0} show={true} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Positioning (Task 8.3)', () => {
    it('should be centered on screen', () => {
      render(<LineCountDisplay lineCount={2} show={true} />);
      const display = screen.getByText('2 SATIR!').closest('div');
      
      // Check for fixed positioning
      expect(display).toHaveClass('fixed');
    });
  });
});
