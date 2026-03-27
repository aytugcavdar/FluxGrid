import { describe, it, expect } from 'vitest';
import { MultiplierBreakdownDisplay } from '../../../../src/features/hud/components/MultiplierBreakdownDisplay';

describe('MultiplierBreakdownDisplay', () => {
  it('should be defined and exportable', () => {
    expect(MultiplierBreakdownDisplay).toBeDefined();
    expect(typeof MultiplierBreakdownDisplay).toBe('function');
  });

  it('should have correct display name', () => {
    expect(MultiplierBreakdownDisplay.name).toBe('MultiplierBreakdownDisplay');
  });
});
