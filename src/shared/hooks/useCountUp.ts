import { useState, useEffect } from 'react';

/**
 * Custom hook for animating a number from 0 to a target value with smooth easing
 * @param target - The target number to count up to
 * @param duration - Animation duration in milliseconds (default: 600ms)
 * @param enabled - Whether the animation is enabled (default: true)
 * @returns The current animated value
 */
export const useCountUp = (
  target: number,
  duration: number = 600,
  enabled: boolean = true
): number => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // If animation is disabled, duration is invalid, or RAF is not available, show target immediately
    if (!enabled || duration <= 0 || typeof requestAnimationFrame === 'undefined') {
      setCurrent(target);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(startValue + (target - startValue) * eased);
      
      setCurrent(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, enabled]);

  return current;
};
