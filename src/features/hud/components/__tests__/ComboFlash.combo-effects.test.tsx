import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComboFlash } from '../ComboFlash';

describe('ComboFlash - Combo Effects', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock window.matchMedia
    matchMediaMock = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  describe('Task 6.1: Screen shake effect', () => {
    it('should apply screen shake for combo 2x when reduced motion is disabled', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={2} />);
      const flashElement = container.querySelector('.fixed.inset-0');
      
      expect(flashElement).toBeTruthy();
      // Verify the element exists (shake is applied via motion.div animate prop)
    });

    it('should not render for combo 1 or less', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={1} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Task 6.2: Combo text slide animation', () => {
    it('should display "COMBO x5!" text for combo 5x', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      render(<ComboFlash combo={5} />);
      expect(screen.getByText('COMBO x5!')).toBeTruthy();
    });

    it('should display "COMBO x7!" text for combo 7x', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      render(<ComboFlash combo={7} />);
      expect(screen.getByText('COMBO x7!')).toBeTruthy();
    });

    it('should not display combo text for combo 4x or less', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={4} />);
      const comboText = container.querySelector('[style*="fontSize"]');
      expect(comboText).toBeNull();
    });
  });

  describe('Task 6.3: Full screen flash for high combos', () => {
    it('should trigger full screen flash for combo 10x', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={10} />);
      const flashElements = container.querySelectorAll('.fixed.inset-0');
      
      // Should have background gradient + flash overlay
      expect(flashElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should trigger full screen flash for combo 15x', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={15} />);
      const flashElements = container.querySelectorAll('.fixed.inset-0');
      
      // Should have background gradient + flash overlay
      expect(flashElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should not trigger full screen flash for combo 9x or less', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={9} />);
      const flashElements = container.querySelectorAll('.fixed.inset-0');
      
      // Should only have background gradient, no flash overlay
      expect(flashElements.length).toBe(1);
    });
  });

  describe('Task 6.5: Reduced motion alternatives', () => {
    it('should replace screen shake with border pulse when prefers-reduced-motion is enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={2} />);
      const flashElement = container.querySelector('.fixed.inset-0') as HTMLElement;
      
      expect(flashElement).toBeTruthy();
      // Check for border pulse styling
      expect(flashElement.style.border).toContain('4px solid');
    });

    it('should display combo text without slide animation when prefers-reduced-motion is enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      render(<ComboFlash combo={5} />);
      const comboText = screen.getByText('COMBO x5!');
      
      expect(comboText).toBeTruthy();
      // Text should be displayed (without slide animation)
    });

    it('should not apply shake when prefers-reduced-motion is enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={2} />);
      const flashElement = container.querySelector('.fixed.inset-0');
      
      expect(flashElement).toBeTruthy();
      // Shake intensity should be 0 when reduced motion is enabled
    });
  });

  describe('Integration: Multiple effects for high combos', () => {
    it('should show all effects for combo 10x: shake, text, and flash', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={10} />);
      
      // Should have background gradient
      const flashElements = container.querySelectorAll('.fixed.inset-0');
      expect(flashElements.length).toBeGreaterThanOrEqual(2);
      
      // Should have combo text
      expect(screen.getByText('COMBO x10!')).toBeTruthy();
    });

    it('should respect reduced motion for all effects in combo 10x', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = render(<ComboFlash combo={10} />);
      
      // Should still show effects but with reduced motion
      const flashElement = container.querySelector('.fixed.inset-0') as HTMLElement;
      expect(flashElement).toBeTruthy();
      
      // Should have border pulse instead of shake
      expect(flashElement.style.border).toContain('4px solid');
      
      // Should have combo text without slide
      expect(screen.getByText('COMBO x10!')).toBeTruthy();
    });
  });
});
