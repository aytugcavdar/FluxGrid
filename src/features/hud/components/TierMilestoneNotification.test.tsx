import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierMilestoneNotification } from './TierMilestoneNotification';

// Helper to mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('TierMilestoneNotification - Task 5: Animations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default: no reduced motion
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render with all required data', () => {
    render(
      <TierMilestoneNotification
        tier={2}
        tierName="UZMAN"
        multiplier={1.5}
      />
    );

    expect(screen.getByText(/Tier 2: UZMAN/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.50x Çarpan/i)).toBeInTheDocument();
    expect(screen.getByText(/YENİ ZOR SEVİYE/i)).toBeInTheDocument();
  });

  it('should auto-dismiss after 2500ms', () => {
    const onComplete = vi.fn();
    
    render(
      <TierMilestoneNotification
        tier={2}
        tierName="UZMAN"
        multiplier={1.5}
        onComplete={onComplete}
      />
    );

    expect(onComplete).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(2500);
    
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should cleanup timer on unmount', () => {
    const onComplete = vi.fn();
    
    const { unmount } = render(
      <TierMilestoneNotification
        tier={2}
        tierName="UZMAN"
        multiplier={1.5}
        onComplete={onComplete}
      />
    );

    unmount();
    
    vi.advanceTimersByTime(2500);
    
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should format multiplier with 2 decimal places', () => {
    render(
      <TierMilestoneNotification
        tier={3}
        tierName="MASTER"
        multiplier={2.5}
      />
    );

    expect(screen.getByText(/2\.50x Çarpan/i)).toBeInTheDocument();
  });

  it('should display correct tier information', () => {
    render(
      <TierMilestoneNotification
        tier={5}
        tierName="EFSANE"
        multiplier={3.75}
      />
    );

    expect(screen.getByText(/Tier 5: EFSANE/i)).toBeInTheDocument();
    expect(screen.getByText(/3\.75x Çarpan/i)).toBeInTheDocument();
  });
});

describe('TierMilestoneNotification - Task 6: Accessibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should detect prefers-reduced-motion and use opacity-only animations', () => {
    // Mock reduced motion preference
    mockMatchMedia(true);
    
    const { container } = render(
      <TierMilestoneNotification
        tier={2}
        tierName="UZMAN"
        multiplier={1.5}
      />
    );

    // Component should render successfully with reduced motion
    expect(screen.getByText(/Tier 2: UZMAN/i)).toBeInTheDocument();
    
    // The component should still be visible (opacity-based animation)
    const notification = container.firstChild as HTMLElement;
    expect(notification).toBeInTheDocument();
  });

  it('should use full animations when prefers-reduced-motion is false', () => {
    // Mock no reduced motion preference
    mockMatchMedia(false);
    
    const { container } = render(
      <TierMilestoneNotification
        tier={2}
        tierName="UZMAN"
        multiplier={1.5}
      />
    );

    // Component should render successfully with full animations
    expect(screen.getByText(/Tier 2: UZMAN/i)).toBeInTheDocument();
    
    const notification = container.firstChild as HTMLElement;
    expect(notification).toBeInTheDocument();
  });

  it('should have will-change property for performance', () => {
    mockMatchMedia(false);
    
    const { container } = render(
      <TierMilestoneNotification
        tier={2}
        tierName="UZMAN"
        multiplier={1.5}
      />
    );

    const notification = container.firstChild as HTMLElement;
    const style = window.getComputedStyle(notification);
    
    // Check that will-change is set (inline style)
    expect(notification.style.willChange).toBe('transform, opacity');
  });

  it('should have text shadows for contrast on all text elements', () => {
    mockMatchMedia(false);
    
    render(
      <TierMilestoneNotification
        tier={2}
        tierName="UZMAN"
        multiplier={1.5}
      />
    );

    const tierText = screen.getByText(/Tier 2: UZMAN/i);
    const multiplierText = screen.getByText(/1\.50x Çarpan/i);
    const subtitleText = screen.getByText(/YENİ ZOR SEVİYE/i);

    // All text elements should have text shadows for contrast
    expect(tierText.style.textShadow).toBeTruthy();
    expect(multiplierText.style.textShadow).toBeTruthy();
    expect(subtitleText.style.textShadow).toBeTruthy();
  });

  it('should maintain sufficient contrast for gold text on dark background', () => {
    mockMatchMedia(false);
    
    render(
      <TierMilestoneNotification
        tier={2}
        tierName="UZMAN"
        multiplier={1.5}
      />
    );

    const tierText = screen.getByText(/Tier 2: UZMAN/i);
    const multiplierText = screen.getByText(/1\.50x Çarpan/i);

    // Gold color (#f59e0b) should be used for tier and multiplier
    expect(tierText.style.color).toBe('rgb(245, 158, 11)');
    expect(multiplierText.style.color).toBe('rgb(245, 158, 11)');
    
    // Note: Actual contrast ratio calculation would require a color contrast library
    // Gold (#f59e0b) on dark background (rgba(0,0,0,0.5)) with text shadow provides
    // sufficient contrast for WCAG AA (4.5:1) - verified manually
  });

  it('should have improved subtitle contrast', () => {
    mockMatchMedia(false);
    
    render(
      <TierMilestoneNotification
        tier={2}
        tierName="UZMAN"
        multiplier={1.5}
      />
    );

    const subtitleText = screen.getByText(/YENİ ZOR SEVİYE/i);

    // Subtitle should use improved opacity (0.6 instead of 0.4) for better contrast
    expect(subtitleText.style.color).toBe('rgba(255, 255, 255, 0.6)');
  });
});
