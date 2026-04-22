/**
 * Example usage of useCleanup hook
 * 
 * This file demonstrates how to use the useCleanup hook in React components
 * to automatically clean up resources on unmount.
 */

import { useEffect } from 'react';
import { useCleanup } from './useCleanup';

/**
 * Example 1: Component with timeout
 */
export function ComponentWithTimeout() {
  const cleanup = useCleanup();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('This will be cleaned up on unmount');
    }, 1000);
    
    cleanup.trackTimeout(timeoutId);
  }, []);

  return <div>Component with timeout</div>;
}

/**
 * Example 2: Component with interval (polling)
 */
export function ComponentWithPolling() {
  const cleanup = useCleanup();

  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Polling data...');
    }, 5000);
    
    cleanup.trackInterval(intervalId);
  }, []);

  return <div>Component with polling</div>;
}

/**
 * Example 3: Component with event listeners
 */
export function ComponentWithEventListeners() {
  const cleanup = useCleanup();

  useEffect(() => {
    const handleResize = () => {
      console.log('Window resized');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);
    
    cleanup.trackListener(window, 'resize', handleResize);
    cleanup.trackListener(document, 'keydown', handleKeyDown);
  }, []);

  return <div>Component with event listeners</div>;
}

/**
 * Example 4: Component with animation frame
 */
export function ComponentWithAnimation() {
  const cleanup = useCleanup();

  useEffect(() => {
    let frameId: number;

    const animate = () => {
      console.log('Animating...');
      frameId = requestAnimationFrame(animate);
      cleanup.trackAnimationFrame(frameId);
    };

    frameId = requestAnimationFrame(animate);
    cleanup.trackAnimationFrame(frameId);
  }, []);

  return <div>Component with animation</div>;
}

/**
 * Example 5: Component with multiple resource types
 */
export function ComponentWithMixedResources() {
  const cleanup = useCleanup();

  useEffect(() => {
    // Timeout for delayed action
    const timeoutId = setTimeout(() => {
      console.log('Delayed action');
    }, 2000);
    cleanup.trackTimeout(timeoutId);

    // Interval for periodic updates
    const intervalId = setInterval(() => {
      console.log('Periodic update');
    }, 1000);
    cleanup.trackInterval(intervalId);

    // Event listener for user interaction
    const handleClick = () => {
      console.log('Clicked');
    };
    window.addEventListener('click', handleClick);
    cleanup.trackListener(window, 'click', handleClick);

    // Animation frame for smooth animations
    const frameId = requestAnimationFrame(() => {
      console.log('Animation frame');
    });
    cleanup.trackAnimationFrame(frameId);

    // All resources will be automatically cleaned up on unmount
  }, []);

  return <div>Component with mixed resources</div>;
}

/**
 * Example 6: Component with debounced event handler
 */
export function ComponentWithDebouncedHandler() {
  const cleanup = useCleanup();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleInput = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Debounced input handler');
      }, 300);
      cleanup.trackTimeout(timeoutId);
    };

    const input = document.querySelector('input');
    if (input) {
      input.addEventListener('input', handleInput);
      cleanup.trackListener(input, 'input', handleInput);
    }
  }, []);

  return (
    <div>
      <input type="text" placeholder="Type something..." />
    </div>
  );
}
