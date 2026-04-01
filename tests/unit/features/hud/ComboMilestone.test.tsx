import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComboMilestone } from '../../../../src/features/hud/components/ComboMilestone';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe('ComboMilestone', () => {
  describe('Combo milestone triggers (Task 7.8)', () => {
    it('should render for combo milestone 5', () => {
      render(<ComboMilestone combo={5} show={true} />);
      expect(screen.getByText('COMBO x5!')).toBeInTheDocument();
    });

    it('should render for combo milestone 10', () => {
      render(<ComboMilestone combo={10} show={true} />);
      expect(screen.getByText('COMBO x10!')).toBeInTheDocument();
    });

    it('should render for combo milestone 15', () => {
      render(<ComboMilestone combo={15} show={true} />);
      expect(screen.getByText('COMBO x15!')).toBeInTheDocument();
    });

    it('should render for combo milestone 20', () => {
      render(<ComboMilestone combo={20} show={true} />);
      expect(screen.getByText('COMBO x20!')).toBeInTheDocument();
    });

    it('should not render for non-milestone combo values', () => {
      const { container } = render(<ComboMilestone combo={7} show={true} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when show is false', () => {
      const { container } = render(<ComboMilestone combo={5} show={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render for combo 0', () => {
      const { container } = render(<ComboMilestone combo={0} show={true} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Overlay properties (Task 7.4)', () => {
    it('should have pointer-events none for overlay', () => {
      render(<ComboMilestone combo={5} show={true} />);
      const overlay = screen.getByText('COMBO x5!').closest('div');
      expect(overlay).toHaveStyle({ pointerEvents: 'none' });
    });
  });
});
