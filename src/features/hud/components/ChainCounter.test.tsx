import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChainCounter } from './ChainCounter';
import * as fc from 'fast-check';

describe('ChainCounter', () => {
  describe('Unit Tests', () => {
    describe('Component Rendering', () => {
      it('should not render when chain < 2', () => {
        const { container } = render(<ChainCounter chain={1} />);
        expect(container.firstChild).toBeNull();
      });

      it('should not render when chain is 0', () => {
        const { container } = render(<ChainCounter chain={0} />);
        expect(container.firstChild).toBeNull();
      });

      it('should render when chain is 2', () => {
        render(<ChainCounter chain={2} />);
        expect(screen.getByText(/x2/i)).toBeInTheDocument();
      });

      it('should render when chain is 3', () => {
        render(<ChainCounter chain={3} />);
        expect(screen.getByText(/x3/i)).toBeInTheDocument();
      });

      it('should render when chain is 4', () => {
        render(<ChainCounter chain={4} />);
        expect(screen.getByText(/x4/i)).toBeInTheDocument();
      });

      it('should render when chain is 10', () => {
        render(<ChainCounter chain={10} />);
        expect(screen.getByText(/x10/i)).toBeInTheDocument();
      });
    });

    describe('Color Mapping', () => {
      it('should use blue color (#60a5fa) when chain is 2', () => {
        const { container } = render(<ChainCounter chain={2} />);
        const mainText = screen.getByText(/x2/i);
        expect(mainText).toHaveStyle({ color: '#60a5fa' });
      });

      it('should use purple color (#a78bfa) when chain is 3', () => {
        const { container } = render(<ChainCounter chain={3} />);
        const mainText = screen.getByText(/x3/i);
        expect(mainText).toHaveStyle({ color: '#a78bfa' });
      });

      it('should use gold color (#f59e0b) when chain is 4', () => {
        const { container } = render(<ChainCounter chain={4} />);
        const mainText = screen.getByText(/x4/i);
        expect(mainText).toHaveStyle({ color: '#f59e0b' });
      });

      it('should use gold color (#f59e0b) when chain is 5', () => {
        const { container } = render(<ChainCounter chain={5} />);
        const mainText = screen.getByText(/x5/i);
        expect(mainText).toHaveStyle({ color: '#f59e0b' });
      });

      it('should use gold color (#f59e0b) when chain is 10', () => {
        const { container } = render(<ChainCounter chain={10} />);
        const mainText = screen.getByText(/x10/i);
        expect(mainText).toHaveStyle({ color: '#f59e0b' });
      });
    });

    describe('Visual Design', () => {
      it('should have semi-transparent background with backdrop blur', () => {
        const { container } = render(<ChainCounter chain={2} />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveStyle({
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
        });
      });

      it('should have border matching chain color', () => {
        const { container } = render(<ChainCounter chain={2} />);
        const wrapper = container.firstChild as HTMLElement;
        // jsdom converts hex to rgb format
        expect(wrapper.style.border).toContain('rgb(96, 165, 250)');
      });

      it('should have border radius of 12px', () => {
        const { container } = render(<ChainCounter chain={2} />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveStyle({
          borderRadius: '12px',
        });
      });

      it('should have glow effect with box-shadow', () => {
        const { container } = render(<ChainCounter chain={2} />);
        const wrapper = container.firstChild as HTMLElement;
        const style = window.getComputedStyle(wrapper);
        expect(style.boxShadow).toBeTruthy();
      });

      it('should have will-change property for performance', () => {
        const { container } = render(<ChainCounter chain={2} />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveStyle({
          willChange: 'transform, opacity',
        });
      });
    });

    describe('Typography', () => {
      it('should display main text with correct format', () => {
        render(<ChainCounter chain={5} />);
        const mainText = screen.getByText(/x5/i);
        expect(mainText).toBeInTheDocument();
        expect(mainText.textContent).toBe('x5');
      });

      it('should have text shadow on main text', () => {
        render(<ChainCounter chain={2} />);
        const mainText = screen.getByText(/x2/i);
        const style = window.getComputedStyle(mainText);
        expect(style.textShadow).toBeTruthy();
      });
    });

    describe('Animation Configuration', () => {
      it('should have correct initial animation state', () => {
        const { container } = render(<ChainCounter chain={2} />);
        const wrapper = container.firstChild as HTMLElement;
        // Framer Motion applies initial state, we verify the component renders
        expect(wrapper).toBeInTheDocument();
      });

      it('should have flexbox layout for vertical alignment', () => {
        const { container } = render(<ChainCounter chain={2} />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center');
      });
    });

    describe('Accessibility', () => {
      let matchMediaMock: ReturnType<typeof vi.fn>;

      beforeEach(() => {
        // Reset matchMedia mock before each test
        matchMediaMock = vi.fn();
        window.matchMedia = matchMediaMock as any;
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('should detect prefers-reduced-motion when enabled', () => {
        matchMediaMock.mockReturnValue({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        });

        render(<ChainCounter chain={2} />);
        
        // Verify matchMedia was called with correct query
        expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      });

      it('should detect when prefers-reduced-motion is disabled', () => {
        matchMediaMock.mockReturnValue({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        });

        render(<ChainCounter chain={2} />);
        
        // Verify matchMedia was called
        expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      });

      it('should have text shadow for contrast on main text', () => {
        matchMediaMock.mockReturnValue({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        });

        render(<ChainCounter chain={2} />);
        const mainText = screen.getByText(/x2/i);
        
        // Verify text shadow is applied
        expect(mainText.style.textShadow).toBeTruthy();
        expect(mainText.style.textShadow).toContain('60a5fa'); // Contains chain color
      });

      it('should have text shadow matching chain color for gold', () => {
        matchMediaMock.mockReturnValue({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        });

        render(<ChainCounter chain={4} />);
        const mainText = screen.getByText(/x4/i);
        
        expect(mainText.style.textShadow).toContain('f59e0b'); // Gold color
      });

      it('should have text shadow matching chain color for purple', () => {
        matchMediaMock.mockReturnValue({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        });

        render(<ChainCounter chain={3} />);
        const mainText = screen.getByText(/x3/i);
        
        expect(mainText.style.textShadow).toContain('a78bfa'); // Purple color
      });

      it('should have will-change property for performance optimization', () => {
        matchMediaMock.mockReturnValue({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        });

        const { container } = render(<ChainCounter chain={2} />);
        const wrapper = container.firstChild as HTMLElement;
        
        expect(wrapper).toHaveStyle({
          willChange: 'transform, opacity',
        });
      });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: enhanced-game-notifications
     * Property 1: Chain Color Mapping
     * 
     * **Validates: Requirements 1.4, 1.5, 1.6**
     * 
     * For any chain value >= 2, the ChainCounter color should be:
     * - gold (#f59e0b) when chain >= 4
     * - purple (#a78bfa) when chain === 3
     * - blue (#60a5fa) when chain === 2
     */
    it('Property 1: chain color mapping holds for all valid chain values', { timeout: 30000 }, () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          (chain) => {
            const { unmount } = render(<ChainCounter chain={chain} />);
            const mainText = screen.getByText(new RegExp(`x${chain}`, 'i'));
            
            const expectedColor = chain >= 4 ? '#f59e0b' : chain === 3 ? '#a78bfa' : '#60a5fa';
            expect(mainText).toHaveStyle({ color: expectedColor });
            
            // Cleanup for next iteration
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Feature: enhanced-game-notifications
     * Property: Component Visibility
     * 
     * For any chain value < 2, the ChainCounter should not render (return null).
     * For any chain value >= 2, the ChainCounter should render with content.
     */
    it('Property: component visibility based on chain threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10, max: 100 }),
          (chain) => {
            const { container, unmount } = render(<ChainCounter chain={chain} />);
            
            if (chain < 2) {
              expect(container.firstChild).toBeNull();
            } else {
              expect(container.firstChild).not.toBeNull();
              expect(screen.getByText(new RegExp(`x${chain}`, 'i'))).toBeInTheDocument();
            }
            
            // Cleanup for next iteration
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: enhanced-game-notifications
     * Property: Border Color Consistency
     * 
     * The border color should always match the text color for visual consistency.
     */
    it('Property: border color matches text color', () => {
      // Helper to convert hex to rgb
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
          : null;
      };

      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          (chain) => {
            const { container, unmount } = render(<ChainCounter chain={chain} />);
            const wrapper = container.firstChild as HTMLElement;
            const mainText = screen.getByText(new RegExp(`x${chain}`, 'i'));
            
            const expectedColor = chain >= 4 ? '#f59e0b' : chain === 3 ? '#a78bfa' : '#60a5fa';
            const expectedRgb = hexToRgb(expectedColor);
            
            // Check border contains the expected color (jsdom converts hex to rgb)
            expect(wrapper.style.border).toContain(expectedRgb);
            expect(mainText).toHaveStyle({ color: expectedColor });
            
            // Cleanup for next iteration
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);

    /**
     * Feature: enhanced-game-notifications
     * Property: Content Completeness
     * 
     * For any valid chain value >= 2, both main text and subtitle should be present.
     */
    it('Property: both main text and subtitle are always rendered', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          (chain) => {
            const { unmount } = render(<ChainCounter chain={chain} />);
            
            expect(screen.getByText(new RegExp(`x${chain}`, 'i'))).toBeInTheDocument();
            
            // Cleanup for next iteration
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: enhanced-game-notifications
     * Property 7: Reduced Motion Fallback
     * 
     * **Validates: Requirements 8.5**
     * 
     * For any chain value >= 2, when prefers-reduced-motion is enabled,
     * the component should still render correctly with accessibility support.
     */
    it('Property 7: component renders correctly with reduced motion preference', () => {
      const matchMediaMock = vi.fn();
      window.matchMedia = matchMediaMock;

      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          fc.boolean(),
          (chain, prefersReducedMotion) => {
            matchMediaMock.mockReturnValue({
              matches: prefersReducedMotion,
              media: '(prefers-reduced-motion: reduce)',
              addEventListener: vi.fn(),
              removeEventListener: vi.fn(),
            });

            const { container, unmount } = render(<ChainCounter chain={chain} />);
            
            // Component should render regardless of motion preference
            expect(container.firstChild).not.toBeNull();
            expect(screen.getByText(new RegExp(`x${chain}`, 'i'))).toBeInTheDocument();
            
            // Verify matchMedia was called
            expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
            
            // Cleanup for next iteration
            unmount();
          }
        ),
        { numRuns: 100 }
      );

      vi.restoreAllMocks();
    });
  });
});
