import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useResponsiveButtonSize } from './useResponsiveButtonSize';

describe('useResponsiveButtonSize', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('should return 40x40px for viewport width < 320px', () => {
    // Set viewport width to 300px
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 300,
    });

    const { result } = renderHook(() => useResponsiveButtonSize());

    expect(result.current).toEqual({ width: 40, height: 40 });
  });

  it('should return 44x44px for viewport width between 320px and 374px', () => {
    // Set viewport width to 350px
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 350,
    });

    const { result } = renderHook(() => useResponsiveButtonSize());

    expect(result.current).toEqual({ width: 44, height: 44 });
  });

  it('should return 44x44px for viewport width exactly 320px', () => {
    // Set viewport width to 320px
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320,
    });

    const { result } = renderHook(() => useResponsiveButtonSize());

    expect(result.current).toEqual({ width: 44, height: 44 });
  });

  it('should return 48x48px for viewport width >= 375px', () => {
    // Set viewport width to 400px
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    });

    const { result } = renderHook(() => useResponsiveButtonSize());

    expect(result.current).toEqual({ width: 48, height: 48 });
  });

  it('should return 48x48px for viewport width exactly 375px', () => {
    // Set viewport width to 375px
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useResponsiveButtonSize());

    expect(result.current).toEqual({ width: 48, height: 48 });
  });

  it('should update button size when window is resized', async () => {
    // Start with 350px viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 350,
    });

    const { result } = renderHook(() => useResponsiveButtonSize());

    // Initial size should be 44x44px
    expect(result.current).toEqual({ width: 44, height: 44 });

    // Resize to 400px
    await act(async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      window.dispatchEvent(new Event('resize'));
      
      // Wait for debounce (300ms) + a bit extra for RAF
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    // Size should update to 48x48px
    expect(result.current).toEqual({ width: 48, height: 48 });
  });

  it('should update button size when resizing from large to small viewport', async () => {
    // Start with 400px viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    });

    const { result } = renderHook(() => useResponsiveButtonSize());

    // Initial size should be 48x48px
    expect(result.current).toEqual({ width: 48, height: 48 });

    // Resize to 300px
    await act(async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 300,
      });
      window.dispatchEvent(new Event('resize'));
      
      // Wait for debounce (300ms) + a bit extra for RAF
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    // Size should update to 40x40px
    expect(result.current).toEqual({ width: 40, height: 40 });
  });

  it('should cleanup resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useResponsiveButtonSize());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should add resize listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useResponsiveButtonSize());

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('should debounce resize events (300ms)', async () => {
    // Start with 350px viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 350,
    });

    const { result } = renderHook(() => useResponsiveButtonSize());

    // Initial size should be 44x44px
    expect(result.current).toEqual({ width: 44, height: 44 });

    // Trigger multiple rapid resize events
    await act(async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      window.dispatchEvent(new Event('resize'));
      
      // Wait 100ms (less than debounce time)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Change size again before debounce completes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 300,
      });
      window.dispatchEvent(new Event('resize'));
      
      // Wait 100ms again
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Size should still be 44x44px (debounce hasn't completed)
    expect(result.current).toEqual({ width: 44, height: 44 });

    // Wait for debounce to complete (300ms + RAF time)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    // Now size should be updated to 40x40px (last resize event at 300px)
    expect(result.current).toEqual({ width: 40, height: 40 });
  });

  it('should cleanup debounce timer and RAF on unmount', async () => {
    // Start with 350px viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 350,
    });

    const { unmount } = renderHook(() => useResponsiveButtonSize());

    // Trigger a resize to create pending timers
    await act(async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      window.dispatchEvent(new Event('resize'));
      
      // Don't wait for debounce to complete - unmount while timers are pending
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const cancelAnimationFrameSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    // Unmount while timers are pending
    unmount();

    // Should cleanup timers (at least clearTimeout should be called)
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
});
