import { describe, expect, it } from 'vitest';
import { getMagnetizedDragPosition } from './placementHelper';

describe('getMagnetizedDragPosition', () => {
  it('does not change the pointer when outside the snap distance', () => {
    expect(getMagnetizedDragPosition({ x: 0, y: 0 }, { x: 20, y: 0 }))
      .toEqual({ x: 0, y: 0 });
  });

  it('pulls the pointer toward the snap target near the cell center', () => {
    const result = getMagnetizedDragPosition({ x: 0, y: 0 }, { x: 8, y: 0 });

    expect(result.x).toBeGreaterThan(0);
    expect(result.x).toBeLessThan(8);
    expect(result.y).toBe(0);
  });

  it('fully settles when very close to the snap target', () => {
    expect(getMagnetizedDragPosition({ x: 0, y: 0 }, { x: 3, y: 0 }))
      .toEqual({ x: 3, y: 0 });
  });
});
