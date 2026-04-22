import { useEffect, useRef } from 'react';
import { CleanupTracker } from '../utils/cleanupTracker';

/**
 * useCleanup - React hook for automatic resource cleanup
 * 
 * This hook wraps CleanupTracker in a React hook for easy use in components.
 * It automatically cleans up all tracked resources when the component unmounts.
 * 
 * @returns An object with methods to track timeouts, intervals, event listeners, and animation frames
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const cleanup = useCleanup();
 *   
 *   useEffect(() => {
 *     // Track a timeout
 *     const timeoutId = setTimeout(() => console.log('Hello'), 1000);
 *     cleanup.trackTimeout(timeoutId);
 *     
 *     // Track an event listener
 *     const handleClick = () => console.log('Clicked');
 *     window.addEventListener('click', handleClick);
 *     cleanup.trackListener(window, 'click', handleClick);
 *     
 *     // Track an animation frame
 *     const frameId = requestAnimationFrame(() => console.log('Frame'));
 *     cleanup.trackAnimationFrame(frameId);
 *   }, []);
 *   
 *   return <div>Component content</div>;
 * }
 * ```
 */
export function useCleanup() {
  const trackerRef = useRef<CleanupTracker | null>(null);

  // Initialize tracker on first render
  if (trackerRef.current === null) {
    trackerRef.current = new CleanupTracker();
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      trackerRef.current?.cleanup();
    };
  }, []);

  return trackerRef.current;
}
