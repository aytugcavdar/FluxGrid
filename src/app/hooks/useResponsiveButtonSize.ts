import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook that calculates responsive button sizes based on viewport width.
 * Ensures proper touch targets across different mobile device sizes.
 * 
 * Size breakpoints:
 * - < 320px: 40x40px
 * - 320px - 374px: 44x44px
 * - 375px+: 48x48px
 * 
 * Uses debouncing (300ms) and requestAnimationFrame to prevent layout thrashing
 * during window resize events.
 * 
 * @returns Button size object with width and height in pixels
 * 
 * **Validates: Requirements 1.4, 4.1, 4.3, 4.4**
 */
export function useResponsiveButtonSize() {
  const [buttonSize, setButtonSize] = useState({ width: 44, height: 44 });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      
      if (vw < 320) {
        setButtonSize({ width: 40, height: 40 });
      } else if (vw < 375) {
        setButtonSize({ width: 44, height: 44 });
      } else {
        setButtonSize({ width: 48, height: 48 });
      }
    };

    // Debounced resize handler with requestAnimationFrame
    const handleResize = () => {
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Clear any pending animation frame
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Debounce the resize event (300ms)
      debounceTimerRef.current = setTimeout(() => {
        // Use requestAnimationFrame for layout updates
        rafIdRef.current = requestAnimationFrame(() => {
          updateSize();
        });
      }, 300);
    };

    // Set initial size
    updateSize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup listener and timers on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return buttonSize;
}
