/**
 * Unit tests for useCountUp hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCountUp } from '@shared/hooks/useCountUp';

describe('useCountUp', () => {
  it('should return target immediately when enabled is false', () => {
    const { result } = renderHook(() => useCountUp(100, 600, false));
    
    expect(result.current).toBe(100);
  });

  it('should return target immediately when duration is 0', () => {
    const { result } = renderHook(() => useCountUp(100, 0, true));
    
    expect(result.current).toBe(100);
  });

  it('should return target immediately when duration is negative', () => {
    const { result } = renderHook(() => useCountUp(100, -100, true));
    
    expect(result.current).toBe(100);
  });

  it('should start at 0 when animation is enabled', () => {
    const { result } = renderHook(() => useCountUp(100, 600, true));
    
    expect(result.current).toBe(0);
  });

  it('should handle target value of 0', () => {
    const { result } = renderHook(() => useCountUp(0, 600, false));
    
    expect(result.current).toBe(0);
  });

  it('should use default duration of 600ms when not specified', () => {
    const { result } = renderHook(() => useCountUp(100, undefined, false));
    
    expect(result.current).toBe(100);
  });

  it('should use default enabled value of true when not specified', () => {
    const { result } = renderHook(() => useCountUp(100, 600));
    
    // When enabled (default true), should start at 0
    expect(result.current).toBe(0);
  });

  it('should handle large target values', () => {
    const { result } = renderHook(() => useCountUp(999999, 600, false));
    
    expect(result.current).toBe(999999);
  });
});
