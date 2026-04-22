import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCleanup } from './useCleanup';

describe('useCleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('hook initialization', () => {
    it('should return a CleanupTracker instance', () => {
      const { result } = renderHook(() => useCleanup());

      expect(result.current).toBeDefined();
      expect(result.current.trackTimeout).toBeDefined();
      expect(result.current.trackInterval).toBeDefined();
      expect(result.current.trackListener).toBeDefined();
      expect(result.current.trackAnimationFrame).toBeDefined();
      expect(result.current.cleanup).toBeDefined();
    });

    it('should return the same tracker instance across re-renders', () => {
      const { result, rerender } = renderHook(() => useCleanup());

      const firstInstance = result.current;
      
      rerender();
      
      const secondInstance = result.current;

      expect(firstInstance).toBe(secondInstance);
    });

    it('should create independent tracker instances for different components', () => {
      const { result: result1 } = renderHook(() => useCleanup());
      const { result: result2 } = renderHook(() => useCleanup());

      expect(result1.current).not.toBe(result2.current);
    });
  });

  describe('trackTimeout', () => {
    it('should track a timeout', () => {
      const { result } = renderHook(() => useCleanup());

      const timeoutId = setTimeout(() => {}, 1000);
      result.current.trackTimeout(timeoutId);

      expect(result.current.getTrackedTimeoutsCount()).toBe(1);
    });

    it('should track multiple timeouts', () => {
      const { result } = renderHook(() => useCleanup());

      const id1 = setTimeout(() => {}, 1000);
      const id2 = setTimeout(() => {}, 2000);
      const id3 = setTimeout(() => {}, 3000);

      result.current.trackTimeout(id1);
      result.current.trackTimeout(id2);
      result.current.trackTimeout(id3);

      expect(result.current.getTrackedTimeoutsCount()).toBe(3);
    });
  });

  describe('trackInterval', () => {
    it('should track an interval', () => {
      const { result } = renderHook(() => useCleanup());

      const intervalId = setInterval(() => {}, 1000);
      result.current.trackInterval(intervalId);

      expect(result.current.getTrackedIntervalsCount()).toBe(1);
    });

    it('should track multiple intervals', () => {
      const { result } = renderHook(() => useCleanup());

      const id1 = setInterval(() => {}, 1000);
      const id2 = setInterval(() => {}, 2000);

      result.current.trackInterval(id1);
      result.current.trackInterval(id2);

      expect(result.current.getTrackedIntervalsCount()).toBe(2);
    });
  });

  describe('trackListener', () => {
    it('should track an event listener', () => {
      const { result } = renderHook(() => useCleanup());

      const element = document.createElement('div');
      const handler = vi.fn();

      element.addEventListener('click', handler);
      result.current.trackListener(element, 'click', handler);

      expect(result.current.getTrackedListenersCount()).toBe(1);
    });

    it('should track multiple event listeners', () => {
      const { result } = renderHook(() => useCleanup());

      const element = document.createElement('div');
      const clickHandler = vi.fn();
      const mouseoverHandler = vi.fn();

      element.addEventListener('click', clickHandler);
      element.addEventListener('mouseover', mouseoverHandler);

      result.current.trackListener(element, 'click', clickHandler);
      result.current.trackListener(element, 'mouseover', mouseoverHandler);

      expect(result.current.getTrackedListenersCount()).toBe(2);
    });

    it('should track listeners on window and document', () => {
      const { result } = renderHook(() => useCleanup());

      const windowHandler = vi.fn();
      const documentHandler = vi.fn();

      window.addEventListener('resize', windowHandler);
      document.addEventListener('keydown', documentHandler);

      result.current.trackListener(window, 'resize', windowHandler);
      result.current.trackListener(document, 'keydown', documentHandler);

      expect(result.current.getTrackedListenersCount()).toBe(2);
    });
  });

  describe('trackAnimationFrame', () => {
    it('should track an animation frame', () => {
      const { result } = renderHook(() => useCleanup());

      const frameId = requestAnimationFrame(() => {});
      result.current.trackAnimationFrame(frameId);

      expect(result.current.getTrackedAnimationFramesCount()).toBe(1);
    });

    it('should track multiple animation frames', () => {
      const { result } = renderHook(() => useCleanup());

      const id1 = requestAnimationFrame(() => {});
      const id2 = requestAnimationFrame(() => {});
      const id3 = requestAnimationFrame(() => {});

      result.current.trackAnimationFrame(id1);
      result.current.trackAnimationFrame(id2);
      result.current.trackAnimationFrame(id3);

      expect(result.current.getTrackedAnimationFramesCount()).toBe(3);
    });
  });

  describe('automatic cleanup on unmount', () => {
    it('should cleanup all timeouts on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const callback = vi.fn();
      const timeoutId = setTimeout(callback, 1000);
      result.current.trackTimeout(timeoutId);

      expect(result.current.getTrackedTimeoutsCount()).toBe(1);

      unmount();

      // Advance time to when timeout should fire
      vi.advanceTimersByTime(1000);

      // Callback should not be called because timeout was cleared
      expect(callback).not.toHaveBeenCalled();
    });

    it('should cleanup all intervals on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const callback = vi.fn();
      const intervalId = setInterval(callback, 1000);
      result.current.trackInterval(intervalId);

      expect(result.current.getTrackedIntervalsCount()).toBe(1);

      unmount();

      // Advance time to when interval should fire
      vi.advanceTimersByTime(3000);

      // Callback should not be called because interval was cleared
      expect(callback).not.toHaveBeenCalled();
    });

    it('should cleanup all event listeners on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const element = document.createElement('div');
      const handler = vi.fn();

      element.addEventListener('click', handler);
      result.current.trackListener(element, 'click', handler);

      expect(result.current.getTrackedListenersCount()).toBe(1);

      unmount();

      // Try to trigger the event
      element.click();

      // Handler should not be called because listener was removed
      expect(handler).not.toHaveBeenCalled();
    });

    it('should cleanup all animation frames on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const callback = vi.fn();
      const frameId = requestAnimationFrame(callback);
      result.current.trackAnimationFrame(frameId);

      expect(result.current.getTrackedAnimationFramesCount()).toBe(1);

      unmount();

      // Run all pending timers/frames
      vi.runAllTimers();

      // Callback should not be called because frame was cancelled
      expect(callback).not.toHaveBeenCalled();
    });

    it('should cleanup all resource types on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const timeoutCallback = vi.fn();
      const intervalCallback = vi.fn();
      const frameCallback = vi.fn();
      const clickHandler = vi.fn();

      const timeoutId = setTimeout(timeoutCallback, 1000);
      const intervalId = setInterval(intervalCallback, 1000);
      const frameId = requestAnimationFrame(frameCallback);
      const element = document.createElement('div');

      element.addEventListener('click', clickHandler);

      result.current.trackTimeout(timeoutId);
      result.current.trackInterval(intervalId);
      result.current.trackAnimationFrame(frameId);
      result.current.trackListener(element, 'click', clickHandler);

      expect(result.current.getTrackedTimeoutsCount()).toBe(1);
      expect(result.current.getTrackedIntervalsCount()).toBe(1);
      expect(result.current.getTrackedAnimationFramesCount()).toBe(1);
      expect(result.current.getTrackedListenersCount()).toBe(1);

      unmount();

      // Try to trigger all callbacks
      vi.advanceTimersByTime(2000);
      element.click();

      // No callbacks should fire
      expect(timeoutCallback).not.toHaveBeenCalled();
      expect(intervalCallback).not.toHaveBeenCalled();
      expect(frameCallback).not.toHaveBeenCalled();
      expect(clickHandler).not.toHaveBeenCalled();
    });
  });

  describe('real-world usage scenarios', () => {
    it('should handle component with polling interval', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const pollCallback = vi.fn();
      const intervalId = setInterval(pollCallback, 100);
      result.current.trackInterval(intervalId);

      // Let it poll a few times
      vi.advanceTimersByTime(250);
      expect(pollCallback).toHaveBeenCalledTimes(2);

      // Unmount component
      unmount();

      // Should not poll anymore
      vi.advanceTimersByTime(1000);
      expect(pollCallback).toHaveBeenCalledTimes(2); // Still 2, no new calls
    });

    it('should handle component with animation loop', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      let frameCount = 0;

      const animate = () => {
        frameCount++;
        if (frameCount < 5) {
          const frameId = requestAnimationFrame(animate);
          result.current.trackAnimationFrame(frameId);
        }
      };

      const initialFrameId = requestAnimationFrame(animate);
      result.current.trackAnimationFrame(initialFrameId);

      // Run a few frames
      vi.advanceTimersByTime(100);

      const countBeforeUnmount = frameCount;

      // Unmount should cancel all pending frames
      unmount();

      // Advance more time
      vi.advanceTimersByTime(1000);

      // Frame count should not increase after unmount
      expect(frameCount).toBe(countBeforeUnmount);
    });

    it('should handle component with debounced event listener', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const element = document.createElement('input');
      const debouncedHandler = vi.fn();
      let timeoutId: ReturnType<typeof setTimeout>;

      const handleInput = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(debouncedHandler, 300);
        result.current.trackTimeout(timeoutId);
      };

      element.addEventListener('input', handleInput);
      result.current.trackListener(element, 'input', handleInput);

      // Trigger input events
      element.dispatchEvent(new Event('input'));
      element.dispatchEvent(new Event('input'));
      element.dispatchEvent(new Event('input'));

      // Unmount before debounce fires
      unmount();

      // Advance time
      vi.advanceTimersByTime(500);

      // Debounced handler should not fire
      expect(debouncedHandler).not.toHaveBeenCalled();
    });

    it('should handle component with window resize listener', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const resizeHandler = vi.fn();

      window.addEventListener('resize', resizeHandler);
      result.current.trackListener(window, 'resize', resizeHandler);

      // Trigger resize
      window.dispatchEvent(new Event('resize'));
      expect(resizeHandler).toHaveBeenCalledTimes(1);

      // Unmount
      unmount();

      // Trigger resize again
      window.dispatchEvent(new Event('resize'));

      // Handler should not be called after unmount
      expect(resizeHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle component with multiple timers', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const timeout1 = setTimeout(callback1, 100);
      const timeout2 = setTimeout(callback2, 200);
      const timeout3 = setTimeout(callback3, 300);

      result.current.trackTimeout(timeout1);
      result.current.trackTimeout(timeout2);
      result.current.trackTimeout(timeout3);

      // Advance time partially
      vi.advanceTimersByTime(150);

      // First callback should have fired
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();

      // Unmount
      unmount();

      // Advance time to when remaining timeouts should fire
      vi.advanceTimersByTime(500);

      // Remaining callbacks should not fire
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });
  });

  describe('integration with React lifecycle', () => {
    it('should maintain tracker state across re-renders', () => {
      const { result, rerender } = renderHook(() => useCleanup());

      const timeoutId = setTimeout(() => {}, 1000);
      result.current.trackTimeout(timeoutId);

      expect(result.current.getTrackedTimeoutsCount()).toBe(1);

      // Re-render the component
      rerender();

      // Tracker should still have the timeout
      expect(result.current.getTrackedTimeoutsCount()).toBe(1);
    });

    it('should allow adding resources after re-renders', () => {
      const { result, rerender } = renderHook(() => useCleanup());

      const timeout1 = setTimeout(() => {}, 1000);
      result.current.trackTimeout(timeout1);

      rerender();

      const timeout2 = setTimeout(() => {}, 2000);
      result.current.trackTimeout(timeout2);

      expect(result.current.getTrackedTimeoutsCount()).toBe(2);
    });

    it('should cleanup only once on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const callback = vi.fn();
      const timeoutId = setTimeout(callback, 1000);
      result.current.trackTimeout(timeoutId);

      // Spy on cleanup method
      const cleanupSpy = vi.spyOn(result.current, 'cleanup');

      unmount();

      // Cleanup should be called exactly once
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle unmount with no tracked resources', () => {
      const { unmount } = renderHook(() => useCleanup());

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should handle tracking resources after component re-renders', () => {
      const { result, rerender } = renderHook(() => useCleanup());

      rerender();
      rerender();
      rerender();

      const timeoutId = setTimeout(() => {}, 1000);
      result.current.trackTimeout(timeoutId);

      expect(result.current.getTrackedTimeoutsCount()).toBe(1);
    });

    it('should handle rapid mount/unmount cycles', () => {
      const callback = vi.fn();

      // Mount and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { result, unmount } = renderHook(() => useCleanup());

        const timeoutId = setTimeout(callback, 1000);
        result.current.trackTimeout(timeoutId);

        unmount();
      }

      // Advance time
      vi.advanceTimersByTime(2000);

      // No callbacks should fire
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('memory leak prevention', () => {
    it('should prevent timeout memory leaks on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const callbacks = Array.from({ length: 50 }, () => vi.fn());
      const timeoutIds = callbacks.map(cb => setTimeout(cb, 10000));

      timeoutIds.forEach(id => result.current.trackTimeout(id));

      expect(result.current.getTrackedTimeoutsCount()).toBe(50);

      unmount();

      // Advance time - no callbacks should fire
      vi.advanceTimersByTime(20000);
      callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled());
    });

    it('should prevent interval memory leaks on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const callbacks = Array.from({ length: 25 }, () => vi.fn());
      const intervalIds = callbacks.map(cb => setInterval(cb, 1000));

      intervalIds.forEach(id => result.current.trackInterval(id));

      expect(result.current.getTrackedIntervalsCount()).toBe(25);

      unmount();

      // Advance time - no callbacks should fire
      vi.advanceTimersByTime(10000);
      callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled());
    });

    it('should prevent event listener memory leaks on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const elements = Array.from({ length: 20 }, () => document.createElement('div'));
      const handlers = Array.from({ length: 20 }, () => vi.fn());

      elements.forEach((el, i) => {
        el.addEventListener('click', handlers[i]);
        result.current.trackListener(el, 'click', handlers[i]);
      });

      expect(result.current.getTrackedListenersCount()).toBe(20);

      unmount();

      // Try to trigger events - no handlers should fire
      elements.forEach(el => el.click());
      handlers.forEach(handler => expect(handler).not.toHaveBeenCalled());
    });

    it('should prevent animation frame memory leaks on unmount', () => {
      const { result, unmount } = renderHook(() => useCleanup());

      const callbacks = Array.from({ length: 30 }, () => vi.fn());
      const frameIds = callbacks.map(cb => requestAnimationFrame(cb));

      frameIds.forEach(id => result.current.trackAnimationFrame(id));

      expect(result.current.getTrackedAnimationFramesCount()).toBe(30);

      unmount();

      // Run timers - no callbacks should fire
      vi.runAllTimers();
      callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled());
    });
  });
});
