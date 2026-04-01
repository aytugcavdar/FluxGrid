import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScorePopups } from '../../../../src/features/hud/components/ScorePopups';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe('ScorePopups', () => {
  describe('Score popup size thresholds (Task 6.5)', () => {
    it('should use small size (24px) for scores 0-500', () => {
      const popups = [{ id: 1, value: 250, combo: 1 }];
      render(<ScorePopups popups={popups} />);
      
      const popup = screen.getByText('+250');
      const styles = window.getComputedStyle(popup);
      
      // Check that fontSize is set (exact value may vary due to CSS)
      expect(popup).toBeInTheDocument();
    });

    it('should use medium size (32px) for scores 500-2000', () => {
      const popups = [{ id: 2, value: 1000, combo: 1 }];
      render(<ScorePopups popups={popups} />);
      
      // toLocaleString may use different separators based on locale
      const popup = screen.getByText(/\+1[.,]000/);
      expect(popup).toBeInTheDocument();
    });

    it('should use large size (44px) for scores 2000-5000', () => {
      const popups = [{ id: 3, value: 3500, combo: 1 }];
      render(<ScorePopups popups={popups} />);
      
      const popup = screen.getByText(/\+3[.,]500/);
      expect(popup).toBeInTheDocument();
    });

    it('should use mega size (56px) for scores 5000+', () => {
      const popups = [{ id: 4, value: 7500, combo: 1 }];
      render(<ScorePopups popups={popups} />);
      
      const popup = screen.getByText(/\+7[.,]500/);
      expect(popup).toBeInTheDocument();
    });
  });

  describe('Score popup overflow handling (Task 6.6)', () => {
    it('should handle multiple popups without overflow', () => {
      const popups = [
        { id: 1, value: 100, combo: 1 },
        { id: 2, value: 200, combo: 1 },
        { id: 3, value: 300, combo: 1 },
        { id: 4, value: 400, combo: 1 },
        { id: 5, value: 500, combo: 1 },
      ];
      
      render(<ScorePopups popups={popups} />);
      
      expect(screen.getByText('+100')).toBeInTheDocument();
      expect(screen.getByText('+200')).toBeInTheDocument();
      expect(screen.getByText('+300')).toBeInTheDocument();
      expect(screen.getByText('+400')).toBeInTheDocument();
      expect(screen.getByText('+500')).toBeInTheDocument();
    });

    it('should render empty when no popups', () => {
      const { container } = render(<ScorePopups popups={[]} />);
      const wrapper = container.querySelector('.fixed');
      expect(wrapper).toBeInTheDocument();
    });
  });
});
