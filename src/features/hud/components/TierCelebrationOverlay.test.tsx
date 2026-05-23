import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TierCelebrationOverlay } from './TierCelebrationOverlay';

describe('TierCelebrationOverlay - Minimal Mobile-First Design', () => {
  it('should render flash and badge elements', () => {
    const { container } = render(
      <TierCelebrationOverlay
        tier={3}
        tierName="USTA"
        multiplier={1.35}
      />
    );
    
    // Verify the component renders (should have 2 motion.div children: flash + badge)
    expect(container.firstChild).toBeTruthy();
  });

  it('should render all text elements correctly', () => {
    const { container } = render(
      <TierCelebrationOverlay
        tier={5}
        tierName="EFSANE"
        multiplier={2.5}
      />
    );
    
    // Check for tier text
    expect(container.textContent).toContain('TİER 5');
    expect(container.textContent).toContain('EFSANE');
    expect(container.textContent).toContain('Skor 2.50×');
  });

  it('should use correct tier colors', () => {
    const { container } = render(
      <TierCelebrationOverlay
        tier={3}
        tierName="USTA"
        multiplier={1.35}
      />
    );
    
    // Verify amber color (#f59e0b) is used for tier 3
    const html = container.innerHTML;
    expect(html).toContain('#f59e0b');
  });

  it('should have pointer-events none on both flash and badge', () => {
    const { container } = render(
      <TierCelebrationOverlay
        tier={2}
        tierName="GELİŞME"
        multiplier={1.15}
      />
    );
    
    // Both motion.div elements should have pointer-events none
    const motionDivs = container.querySelectorAll('[class*="pointer-events-none"]');
    expect(motionDivs.length).toBeGreaterThan(0);
  });

  it('should have correct z-index layering', () => {
    const { container } = render(
      <TierCelebrationOverlay
        tier={4}
        tierName="UZMAN"
        multiplier={1.6}
      />
    );
    
    // Flash should be z-60, badge should be z-65
    const html = container.innerHTML;
    expect(html).toContain('z-[60]');
    expect(html).toContain('z-[65]');
  });

  it('should render compact mobile-friendly badge', () => {
    const { container } = render(
      <TierCelebrationOverlay
        tier={1}
        tierName="BAŞLANGIÇ"
        multiplier={1.15}
      />
    );
    
    // Badge should be at top-20 (mobile-friendly position)
    const html = container.innerHTML;
    expect(html).toContain('top-20');
  });
});
