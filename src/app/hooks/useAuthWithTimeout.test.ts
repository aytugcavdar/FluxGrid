import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuthWithTimeout } from './useAuthWithTimeout';
import { useAuthStore } from '@features/auth/store/authStore';

// Mock the auth store
vi.mock('@features/auth/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('useAuthWithTimeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return auth state from authStore', () => {
    // Arrange
    const mockAuthState = {
      user: { uid: 'test-uid', displayName: 'Test User' },
      isAnonymous: false,
      isLoading: false,
    };
    vi.mocked(useAuthStore).mockReturnValue(mockAuthState as any);

    // Act
    const { result } = renderHook(() => useAuthWithTimeout());

    // Assert
    expect(result.current.user).toEqual(mockAuthState.user);
    expect(result.current.isAnonymous).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.timedOut).toBe(false);
  });

  it('should timeout after 1000ms when isLoading is true', async () => {
    // Arrange
    const mockAuthState = {
      user: null,
      isAnonymous: false,
      isLoading: true,
    };
    vi.mocked(useAuthStore).mockReturnValue(mockAuthState as any);

    // Act
    const { result } = renderHook(() => useAuthWithTimeout());

    // Assert - initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.timedOut).toBe(false);

    // Fast-forward time by 1000ms and run all timers
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();
    });

    // After timeout, isLoading should be false
    expect(result.current.timedOut).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should use custom timeout duration', async () => {
    // Arrange
    const mockAuthState = {
      user: null,
      isAnonymous: false,
      isLoading: true,
    };
    vi.mocked(useAuthStore).mockReturnValue(mockAuthState as any);

    // Act
    const { result } = renderHook(() => useAuthWithTimeout(500));

    // Assert - initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.timedOut).toBe(false);

    // Fast-forward time by 500ms
    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    expect(result.current.timedOut).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should reset timedOut when loading completes before timeout', async () => {
    // Arrange
    const mockAuthState = {
      user: null,
      isAnonymous: false,
      isLoading: true,
    };
    const mockUseAuthStore = vi.mocked(useAuthStore);
    mockUseAuthStore.mockReturnValue(mockAuthState as any);

    // Act
    const { result, rerender } = renderHook(() => useAuthWithTimeout());

    // Assert - initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.timedOut).toBe(false);

    // Fast-forward time by 500ms (before timeout)
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Update auth store to loading complete
    mockUseAuthStore.mockReturnValue({
      user: { uid: 'test-uid', displayName: 'Test User' },
      isAnonymous: false,
      isLoading: false,
    } as any);

    // Trigger re-render
    await act(async () => {
      rerender();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.timedOut).toBe(false);
  });

  it('should cleanup timer on unmount', async () => {
    // Arrange
    const mockAuthState = {
      user: null,
      isAnonymous: false,
      isLoading: true,
    };
    vi.mocked(useAuthStore).mockReturnValue(mockAuthState as any);

    // Act
    const { unmount } = renderHook(() => useAuthWithTimeout());

    // Unmount before timeout
    await act(async () => {
      unmount();
    });

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Assert - no errors should occur (timer was cleaned up)
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should handle anonymous user state', () => {
    // Arrange
    const mockAuthState = {
      user: { uid: 'anon-uid', isAnonymous: true },
      isAnonymous: true,
      isLoading: false,
    };
    vi.mocked(useAuthStore).mockReturnValue(mockAuthState as any);

    // Act
    const { result } = renderHook(() => useAuthWithTimeout());

    // Assert
    expect(result.current.user).toEqual(mockAuthState.user);
    expect(result.current.isAnonymous).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.timedOut).toBe(false);
  });

  it('should handle null user state', () => {
    // Arrange
    const mockAuthState = {
      user: null,
      isAnonymous: false,
      isLoading: false,
    };
    vi.mocked(useAuthStore).mockReturnValue(mockAuthState as any);

    // Act
    const { result } = renderHook(() => useAuthWithTimeout());

    // Assert
    expect(result.current.user).toBeNull();
    expect(result.current.isAnonymous).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.timedOut).toBe(false);
  });

  it('should not timeout if loading completes exactly at timeout duration', async () => {
    // Arrange
    const mockAuthState = {
      user: null,
      isAnonymous: false,
      isLoading: true,
    };
    const mockUseAuthStore = vi.mocked(useAuthStore);
    mockUseAuthStore.mockReturnValue(mockAuthState as any);

    // Act
    const { result, rerender } = renderHook(() => useAuthWithTimeout(1000));

    // Fast-forward time by 999ms (just before timeout)
    await act(async () => {
      vi.advanceTimersByTime(999);
    });

    // Update auth store to loading complete
    mockUseAuthStore.mockReturnValue({
      user: { uid: 'test-uid', displayName: 'Test User' },
      isAnonymous: false,
      isLoading: false,
    } as any);

    // Trigger re-render
    await act(async () => {
      rerender();
    });

    // Should not have timed out
    expect(result.current.isLoading).toBe(false);
    expect(result.current.timedOut).toBe(false);
  });

  it('should handle errors from auth store and fallback to default state', () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Auth store error');
    vi.mocked(useAuthStore).mockImplementation(() => {
      throw mockError;
    });

    // Act
    const { result } = renderHook(() => useAuthWithTimeout());

    // Assert - should fallback to default state
    expect(result.current.user).toBeNull();
    expect(result.current.isAnonymous).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.timedOut).toBe(false);
    
    // Should log error to console
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error accessing auth store:', mockError);
    
    consoleErrorSpy.mockRestore();
  });

  it('should not set up timeout when auth store throws error', async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(useAuthStore).mockImplementation(() => {
      throw new Error('Auth store error');
    });

    // Act
    const { result } = renderHook(() => useAuthWithTimeout());

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Assert - should remain in default state, not timeout
    expect(result.current.isLoading).toBe(false);
    expect(result.current.timedOut).toBe(false);
    expect(vi.getTimerCount()).toBe(0); // No timers should be active
    
    consoleErrorSpy.mockRestore();
  });
});
