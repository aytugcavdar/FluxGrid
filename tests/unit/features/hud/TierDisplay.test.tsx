import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierDisplay } from '@features/hud/components/TierDisplay';
import { TIER_SCORE_MULTIPLIERS } from '@features/game/constants';

describe('TierDisplay', () => {
  describe('Mobile Layout', () => {
    it('should render tier 0 with correct multiplier', () => {
      const { container } = render(<TierDisplay tier={0} isMobile={true} />);
      
      expect(container.textContent).toContain('T0');
      expect(container.textContent).toContain('1.00×');
    });

    it('should render tier 3 with correct multiplier', () => {
      const { container } = render(<TierDisplay tier={3} isMobile={true} />);
      
      expect(container.textContent).toContain('T3');
      expect(container.textContent).toContain('1.60×');
    });

    it('should render tier 6 with correct multiplier', () => {
      const { container } = render(<TierDisplay tier={6} isMobile={true} />);
      
      expect(container.textContent).toContain('T6');
      expect(container.textContent).toContain('3.00×');
    });

    it('should display multiplier with 2 decimal places', () => {
      const { container } = render(<TierDisplay tier={1} isMobile={true} />);
      
      expect(container.textContent).toContain('1.15×');
    });
  });

  describe('Desktop Layout', () => {
    it('should render tier 0 with name and multiplier', () => {
      const { container } = render(<TierDisplay tier={0} isMobile={false} />);
      
      expect(container.textContent).toContain('Tier 0');
      expect(container.textContent).toContain('1.00×');
      expect(container.textContent).toContain('Başlangıç');
    });

    it('should render tier 1 with correct name', () => {
      const { container } = render(<TierDisplay tier={1} isMobile={false} />);
      
      expect(container.textContent).toContain('Tier 1');
      expect(container.textContent).toContain('1.15×');
      expect(container.textContent).toContain('Gelişmiş');
    });

    it('should render tier 5 with correct name', () => {
      const { container } = render(<TierDisplay tier={5} isMobile={false} />);
      
      expect(container.textContent).toContain('Tier 5');
      expect(container.textContent).toContain('2.50×');
      expect(container.textContent).toContain('Kaos');
    });

    it('should render tier 6 with correct name', () => {
      const { container } = render(<TierDisplay tier={6} isMobile={false} />);
      
      expect(container.textContent).toContain('Tier 6');
      expect(container.textContent).toContain('3.00×');
      expect(container.textContent).toContain('Void');
    });
  });

  describe('Multiplier Accuracy', () => {
    it('should display correct multiplier for all tiers', () => {
      for (let tier = 0; tier <= 6; tier++) {
        const { container } = render(<TierDisplay tier={tier} isMobile={false} />);
        const expectedMultiplier = TIER_SCORE_MULTIPLIERS[tier].toFixed(2);
        
        expect(container.textContent).toContain(`${expectedMultiplier}×`);
      }
    });
  });

  describe('Real-time Updates', () => {
    it('should update when tier prop changes', () => {
      const { container, rerender } = render(<TierDisplay tier={0} isMobile={false} />);
      
      expect(container.textContent).toContain('Tier 0');
      expect(container.textContent).toContain('1.00×');
      
      rerender(<TierDisplay tier={3} isMobile={false} />);
      
      expect(container.textContent).toContain('Tier 3');
      expect(container.textContent).toContain('1.60×');
    });

    it('should update multiplier in real-time', () => {
      const { container, rerender } = render(<TierDisplay tier={1} isMobile={true} />);
      
      expect(container.textContent).toContain('1.15×');
      
      rerender(<TierDisplay tier={6} isMobile={true} />);
      
      expect(container.textContent).toContain('3.00×');
    });
  });

  describe('ENDLESS Mode Isolation', () => {
    it('should render for tier 0 (ENDLESS mode)', () => {
      const { container } = render(<TierDisplay tier={0} isMobile={false} />);
      
      expect(container.textContent).toBeTruthy();
    });

    it('should render for any valid tier', () => {
      for (let tier = 0; tier <= 6; tier++) {
        const { container } = render(<TierDisplay tier={tier} isMobile={false} />);
        expect(container.textContent).toBeTruthy();
      }
    });
  });
});
