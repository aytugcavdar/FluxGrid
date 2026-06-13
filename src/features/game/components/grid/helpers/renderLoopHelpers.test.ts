import { describe, expect, it } from 'vitest';
import {
  getNativeRenderTargetFps,
  NATIVE_ACTIVE_FPS,
  NATIVE_SETTLED_FPS,
} from './renderLoopHelpers';

describe('getNativeRenderTargetFps', () => {
  it('keeps recent interaction at 60 FPS', () => {
    expect(getNativeRenderTargetFps({
      lastTouchAgeMs: 999,
      isDragging: false,
      activeAnimationCount: 0,
    })).toBe(NATIVE_ACTIVE_FPS);
  });

  it('uses 30 FPS while the player is briefly inactive', () => {
    expect(getNativeRenderTargetFps({
      lastTouchAgeMs: 1000,
      isDragging: false,
      activeAnimationCount: 0,
    })).toBe(NATIVE_SETTLED_FPS);
  });

  it('returns to 60 FPS for drag and animations', () => {
    expect(getNativeRenderTargetFps({
      lastTouchAgeMs: 5000,
      isDragging: true,
      activeAnimationCount: 0,
    })).toBe(NATIVE_ACTIVE_FPS);

    expect(getNativeRenderTargetFps({
      lastTouchAgeMs: 5000,
      isDragging: false,
      activeAnimationCount: 1,
    })).toBe(NATIVE_ACTIVE_FPS);
  });
});
