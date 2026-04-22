import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CleanupTracker } from './cleanupTracker';

describe('CleanupTracker', () => {
  let tracker: CleanupTracker;

  beforeEach(() => {
    tracker = new CleanupTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    tracker.cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('trackTimeout', () => {
    it('should track a single timeout', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      tracker.trackTimeout(timeoutId);

      expect(tracker.getTrackedTimeoutsCount()).toBe(1);
    });

    it('should track multiple timeouts', () => {
      const id1 = setTimeout(() => {}, 1000);
      const id2 = setTimeout(() => {}, 2000);
      const id3 = setTimeout(() => {}, 3000);

      tracker.trackTimeout(id1);
      tracker.trackTimeout(id2);
      tracker.trackTimeout(id3);

      expect(tracker.getTrackedTimeoutsCount()).toBe(3);
    });

    it('should not duplicate timeout IDs', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      
      tracker.trackTimeout(timeoutId);
      tracker.trackTimeout(timeoutId);

      expect(tracker.getTrackedTimeoutsCount()).toBe(1);
    });
  });

  describe('trackInterval', () => {
    it('should track a single interval', () => {
      const intervalId = setInterval(() => {}, 1000);
      tracker.trackInterval(intervalId);

      expect(tracker.getTrackedIntervalsCount()).toBe(1);
    });

    it('should track multiple intervals', () => {
      const id1 = setInterval(() => {}, 1000);
      const id2 = setInterval(() => {}, 2000);
      const id3 = setInterval(() => {}, 3000);

      tracker.trackInterval(id1);
      tracker.trackInterval(id2);
      tracker.trackInterval(id3);

      expect(tracker.getTrackedIntervalsCount()).toBe(3);
    });

    it('should not duplicate interval IDs', () => {
      const intervalId = setInterval(() => {}, 1000);
      
      tracker.trackInterval(intervalId);
      tracker.trackInterval(intervalId);

      expect(tracker.getTrackedIntervalsCount()).toBe(1);
    });
  });

  describe('trackListener', () => {
    it('should track a single event listener', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      element.addEventListener('click', handler);
      tracker.trackListener(element, 'click', handler);

      expect(tracker.getTrackedListenersCount()).toBe(1);
    });

    it('should track multiple listeners on same element', () => {
      const element = document.createElement('div');
      const clickHandler = vi.fn();
      const mouseoverHandler = vi.fn();

      element.addEventListener('click', clickHandler);
      element.addEventListener('mouseover', mouseoverHandler);
      
      tracker.trackListener(element, 'click', clickHandler);
      tracker.trackListener(element, 'mouseover', mouseoverHandler);

      expect(tracker.getTrackedListenersCount()).toBe(2);
    });

    it('should track listeners on different elements', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('button');
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      element1.addEventListener('click', handler1);
      element2.addEventListener('click', handler2);
      
      tracker.trackListener(element1, 'click', handler1);
      tracker.trackListener(element2, 'click', handler2);

      expect(tracker.getTrackedListenersCount()).toBe(2);
    });

    it('should track listeners on window and document', () => {
      const windowHandler = vi.fn();
      const documentHandler = vi.fn();

      window.addEventListener('resize', windowHandler);
      document.addEventListener('keydown', documentHandler);
      
      tracker.trackListener(window, 'resize', windowHandler);
      tracker.trackListener(document, 'keydown', documentHandler);

      expect(tracker.getTrackedListenersCount()).toBe(2);
    });

    it('should replace listener if same element and event tracked twice', () => {
      const element = document.createElement('div');
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      element.addEventListener('click', handler1);
      tracker.trackListener(element, 'click', handler1);
      
      element.removeEventListener('click', handler1);
      element.addEventListener('click', handler2);
      tracker.trackListener(element, 'click', handler2);

      expect(tracker.getTrackedListenersCount()).toBe(1);
    });
  });

  describe('trackAnimationFrame', () => {
    it('should track a single animation frame', () => {
      const frameId = requestAnimationFrame(() => {});
      tracker.trackAnimationFrame(frameId);

      expect(tracker.getTrackedAnimationFramesCount()).toBe(1);
    });

    it('should track multiple animation frames', () => {
      const id1 = requestAnimationFrame(() => {});
      const id2 = requestAnimationFrame(() => {});
      const id3 = requestAnimationFrame(() => {});

      tracker.trackAnimationFrame(id1);
      tracker.trackAnimationFrame(id2);
      tracker.trackAnimationFrame(id3);

      expect(tracker.getTrackedAnimationFramesCount()).toBe(3);
    });

    it('should not duplicate animation frame IDs', () => {
      const frameId = requestAnimationFrame(() => {});
      
      tracker.trackAnimationFrame(frameId);
      tracker.trackAnimationFrame(frameId);

      expect(tracker.getTrackedAnimationFramesCount()).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should clear all tracked timeouts', () => {
      const callback = vi.fn();
      const timeoutId = setTimeout(callback, 1000);
      tracker.trackTimeout(timeoutId);

      tracker.cleanup();

      // Advance time to when timeout should fire
      vi.advanceTimersByTime(1000);

      // Callback should not be called because timeout was cleared
      expect(callback).not.toHaveBeenCalled();
      expect(tracker.getTrackedTimeoutsCount()).toBe(0);
    });

    it('should clear all tracked intervals', () => {
      const callback = vi.fn();
      const intervalId = setInterval(callback, 1000);
      tracker.trackInterval(intervalId);

      tracker.cleanup();

      // Advance time to when interval should fire
      vi.advanceTimersByTime(3000);

      // Callback should not be called because interval was cleared
      expect(callback).not.toHaveBeenCalled();
      expect(tracker.getTrackedIntervalsCount()).toBe(0);
    });

    it('should remove all tracked event listeners', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      element.addEventListener('click', handler);
      tracker.trackListener(element, 'click', handler);

      tracker.cleanup();

      // Try to trigger the event
      element.click();

      // Handler should not be called because listener was removed
      expect(handler).not.toHaveBeenCalled();
      expect(tracker.getTrackedListenersCount()).toBe(0);
    });

    it('should cancel all tracked animation frames', () => {
      const callback = vi.fn();
      const frameId = requestAnimationFrame(callback);
      tracker.trackAnimationFrame(frameId);

      tracker.cleanup();

      // Run all pending timers/frames
      vi.runAllTimers();

      // Callback should not be called because frame was cancelled
      expect(callback).not.toHaveBeenCalled();
      expect(tracker.getTrackedAnimationFramesCount()).toBe(0);
    });

    it('should clear all resource types in one call', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const intervalId = setInterval(() => {}, 1000);
      const frameId = requestAnimationFrame(() => {});
      const element = document.createElement('div');
      const handler = vi.fn();

      element.addEventListener('click', handler);

      tracker.trackTimeout(timeoutId);
      tracker.trackInterval(intervalId);
      tracker.trackAnimationFrame(frameId);
      tracker.trackListener(element, 'click', handler);

      expect(tracker.getTrackedTimeoutsCount()).toBe(1);
      expect(tracker.getTrackedIntervalsCount()).toBe(1);
      expect(tracker.getTrackedAnimationFramesCount()).toBe(1);
      expect(tracker.getTrackedListenersCount()).toBe(1);

      tracker.cleanup();

      expect(tracker.getTrackedTimeoutsCount()).toBe(0);
      expect(tracker.getTrackedIntervalsCount()).toBe(0);
      expect(tracker.getTrackedAnimationFramesCount()).toBe(0);
      expect(tracker.getTrackedListenersCount()).toBe(0);
    });

    it('should be safe to call cleanup multiple times', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      tracker.trackTimeout(timeoutId);

      tracker.cleanup();
      tracker.cleanup();
      tracker.cleanup();

      expect(tracker.getTrackedTimeoutsCount()).toBe(0);
    });

    it('should be safe to call cleanup with no tracked resources', () => {
      expect(() => tracker.cleanup()).not.toThrow();
      
      expect(tracker.getTrackedTimeoutsCount()).toBe(0);
      expect(tracker.getTrackedIntervalsCount()).toBe(0);
      expect(tracker.getTrackedAnimationFramesCount()).toBe(0);
      expect(tracker.getTrackedListenersCount()).toBe(0);
    });
  });

  describe('real-world usage scenarios', () => {
    it('should handle component with mixed resource types', () => {
      // Simulate a component that uses multiple resource types
      const element = document.createElement('div');
      const resizeHandler = vi.fn();
      const clickHandler = vi.fn();
      const timeoutCallback = vi.fn();
      const intervalCallback = vi.fn();
      const animationCallback = vi.fn();

      // Setup resources
      window.addEventListener('resize', resizeHandler);
      element.addEventListener('click', clickHandler);
      const timeoutId = setTimeout(timeoutCallback, 1000);
      const intervalId = setInterval(intervalCallback, 500);
      const frameId = requestAnimationFrame(animationCallback);

      // Track all resources
      tracker.trackListener(window, 'resize', resizeHandler);
      tracker.trackListener(element, 'click', clickHandler);
      tracker.trackTimeout(timeoutId);
      tracker.trackInterval(intervalId);
      tracker.trackAnimationFrame(frameId);

      // Verify tracking
      expect(tracker.getTrackedListenersCount()).toBe(2);
      expect(tracker.getTrackedTimeoutsCount()).toBe(1);
      expect(tracker.getTrackedIntervalsCount()).toBe(1);
      expect(tracker.getTrackedAnimationFramesCount()).toBe(1);

      // Cleanup (simulating component unmount)
      tracker.cleanup();

      // Verify all resources are cleaned up
      expect(tracker.getTrackedListenersCount()).toBe(0);
      expect(tracker.getTrackedTimeoutsCount()).toBe(0);
      expect(tracker.getTrackedIntervalsCount()).toBe(0);
      expect(tracker.getTrackedAnimationFramesCount()).toBe(0);

      // Verify callbacks don't fire
      vi.advanceTimersByTime(2000);
      element.click();
      window.dispatchEvent(new Event('resize'));

      expect(timeoutCallback).not.toHaveBeenCalled();
      expect(intervalCallback).not.toHaveBeenCalled();
      expect(animationCallback).not.toHaveBeenCalled();
      expect(clickHandler).not.toHaveBeenCalled();
      expect(resizeHandler).not.toHaveBeenCalled();
    });

    it('should handle animation loop cleanup', () => {
      const frames: number[] = [];
      let frameCount = 0;

      const animate = () => {
        frameCount++;
        if (frameCount < 5) {
          const frameId = requestAnimationFrame(animate);
          tracker.trackAnimationFrame(frameId);
        }
      };

      const initialFrameId = requestAnimationFrame(animate);
      tracker.trackAnimationFrame(initialFrameId);

      // Run a few frames
      vi.advanceTimersByTime(100);

      // Cleanup should cancel all pending frames
      tracker.cleanup();

      const countBeforeCleanup = frameCount;
      
      // Advance more time
      vi.advanceTimersByTime(1000);

      // Frame count should not increase after cleanup
      expect(frameCount).toBe(countBeforeCleanup);
      expect(tracker.getTrackedAnimationFramesCount()).toBe(0);
    });

    it('should handle polling interval cleanup', () => {
      const pollCallback = vi.fn();
      const intervalId = setInterval(pollCallback, 100);
      tracker.trackInterval(intervalId);

      // Let it poll a few times
      vi.advanceTimersByTime(250);
      expect(pollCallback).toHaveBeenCalledTimes(2);

      // Cleanup
      tracker.cleanup();

      // Should not poll anymore
      vi.advanceTimersByTime(1000);
      expect(pollCallback).toHaveBeenCalledTimes(2); // Still 2, no new calls
    });

    it('should handle debounced event listener cleanup', () => {
      const element = document.createElement('input');
      const debouncedHandler = vi.fn();
      let timeoutId: number;

      const handleInput = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(debouncedHandler, 300);
        tracker.trackTimeout(timeoutId);
      };

      element.addEventListener('input', handleInput);
      tracker.trackListener(element, 'input', handleInput);

      // Trigger input events
      element.dispatchEvent(new Event('input'));
      element.dispatchEvent(new Event('input'));
      element.dispatchEvent(new Event('input'));

      // Cleanup before debounce fires
      tracker.cleanup();

      // Advance time
      vi.advanceTimersByTime(500);

      // Debounced handler should not fire
      expect(debouncedHandler).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle tracking after cleanup', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      tracker.trackTimeout(timeoutId);

      tracker.cleanup();
      expect(tracker.getTrackedTimeoutsCount()).toBe(0);

      // Track new resources after cleanup
      const newTimeoutId = setTimeout(() => {}, 1000);
      tracker.trackTimeout(newTimeoutId);

      expect(tracker.getTrackedTimeoutsCount()).toBe(1);
    });

    it('should handle invalid timeout IDs gracefully', () => {
      // clearTimeout with invalid ID should not throw
      expect(() => {
        tracker.trackTimeout(-1);
        tracker.cleanup();
      }).not.toThrow();
    });

    it('should handle invalid interval IDs gracefully', () => {
      // clearInterval with invalid ID should not throw
      expect(() => {
        tracker.trackInterval(-1);
        tracker.cleanup();
      }).not.toThrow();
    });

    it('should handle invalid animation frame IDs gracefully', () => {
      // cancelAnimationFrame with invalid ID should not throw
      expect(() => {
        tracker.trackAnimationFrame(-1);
        tracker.cleanup();
      }).not.toThrow();
    });

    it('should handle removed event listeners before cleanup', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      element.addEventListener('click', handler);
      tracker.trackListener(element, 'click', handler);

      // Manually remove listener before cleanup
      element.removeEventListener('click', handler);

      // Cleanup should not throw even though listener is already removed
      expect(() => tracker.cleanup()).not.toThrow();
    });

    it('should handle detached DOM elements', () => {
      const element = document.createElement('div');
      const handler = vi.fn();

      element.addEventListener('click', handler);
      tracker.trackListener(element, 'click', handler);

      // Element is never attached to document
      // Cleanup should still work
      expect(() => tracker.cleanup()).not.toThrow();
      expect(tracker.getTrackedListenersCount()).toBe(0);
    });
  });

  describe('memory leak prevention', () => {
    it('should prevent timeout memory leaks', () => {
      const callbacks = Array.from({ length: 100 }, () => vi.fn());
      const timeoutIds = callbacks.map(cb => setTimeout(cb, 10000));

      timeoutIds.forEach(id => tracker.trackTimeout(id));

      expect(tracker.getTrackedTimeoutsCount()).toBe(100);

      tracker.cleanup();

      // All timeouts should be cleared
      expect(tracker.getTrackedTimeoutsCount()).toBe(0);

      // Advance time - no callbacks should fire
      vi.advanceTimersByTime(20000);
      callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled());
    });

    it('should prevent interval memory leaks', () => {
      const callbacks = Array.from({ length: 50 }, () => vi.fn());
      const intervalIds = callbacks.map(cb => setInterval(cb, 1000));

      intervalIds.forEach(id => tracker.trackInterval(id));

      expect(tracker.getTrackedIntervalsCount()).toBe(50);

      tracker.cleanup();

      // All intervals should be cleared
      expect(tracker.getTrackedIntervalsCount()).toBe(0);

      // Advance time - no callbacks should fire
      vi.advanceTimersByTime(10000);
      callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled());
    });

    it('should prevent event listener memory leaks', () => {
      const elements = Array.from({ length: 20 }, () => document.createElement('div'));
      const handlers = Array.from({ length: 20 }, () => vi.fn());

      elements.forEach((el, i) => {
        el.addEventListener('click', handlers[i]);
        tracker.trackListener(el, 'click', handlers[i]);
      });

      expect(tracker.getTrackedListenersCount()).toBe(20);

      tracker.cleanup();

      // All listeners should be removed
      expect(tracker.getTrackedListenersCount()).toBe(0);

      // Try to trigger events - no handlers should fire
      elements.forEach(el => el.click());
      handlers.forEach(handler => expect(handler).not.toHaveBeenCalled());
    });

    it('should prevent animation frame memory leaks', () => {
      const callbacks = Array.from({ length: 30 }, () => vi.fn());
      const frameIds = callbacks.map(cb => requestAnimationFrame(cb));

      frameIds.forEach(id => tracker.trackAnimationFrame(id));

      expect(tracker.getTrackedAnimationFramesCount()).toBe(30);

      tracker.cleanup();

      // All frames should be cancelled
      expect(tracker.getTrackedAnimationFramesCount()).toBe(0);

      // Run timers - no callbacks should fire
      vi.runAllTimers();
      callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled());
    });
  });

  describe('multiple tracker instances', () => {
    it('should maintain separate state for different instances', () => {
      const tracker1 = new CleanupTracker();
      const tracker2 = new CleanupTracker();

      const timeout1 = setTimeout(() => {}, 1000);
      const timeout2 = setTimeout(() => {}, 2000);

      tracker1.trackTimeout(timeout1);
      tracker2.trackTimeout(timeout2);

      expect(tracker1.getTrackedTimeoutsCount()).toBe(1);
      expect(tracker2.getTrackedTimeoutsCount()).toBe(1);

      tracker1.cleanup();

      expect(tracker1.getTrackedTimeoutsCount()).toBe(0);
      expect(tracker2.getTrackedTimeoutsCount()).toBe(1);

      tracker2.cleanup();
    });

    it('should allow independent cleanup of different instances', () => {
      const tracker1 = new CleanupTracker();
      const tracker2 = new CleanupTracker();

      const element = document.createElement('div');
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      element.addEventListener('click', handler1);
      element.addEventListener('mouseover', handler2);

      tracker1.trackListener(element, 'click', handler1);
      tracker2.trackListener(element, 'mouseover', handler2);

      tracker1.cleanup();

      element.click();
      element.dispatchEvent(new Event('mouseover'));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();

      tracker2.cleanup();
    });
  });
});
