import { describe, expect, it } from 'vitest';
import { createWidgetHighScoreProjection, normalizeWidgetMode } from './widgetHelper';

describe('widgetHelper', () => {
  it('normalizes widget mode keys to lowercase', () => {
    expect(normalizeWidgetMode('ENDLESS')).toBe('endless');
    expect(normalizeWidgetMode(' TIMED ')).toBe('timed');
  });

  it('projects uppercase game store high scores to widget keys', () => {
    expect(createWidgetHighScoreProjection({
      ENDLESS: 3200,
      TIMED: 1400,
    })).toEqual({
      endless: 3200,
      timed: 1400,
    });
  });

  it('falls back to zero for missing or invalid widget scores', () => {
    expect(createWidgetHighScoreProjection({
      ENDLESS: -10,
    })).toEqual({
      endless: 0,
      timed: 0,
    });
  });
});
