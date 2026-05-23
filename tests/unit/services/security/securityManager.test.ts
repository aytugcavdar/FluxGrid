import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityManager } from '@services/security/securityManager';

describe('SecurityManager', () => {
  let security: SecurityManager;

  beforeEach(() => {
    security = new SecurityManager();
    localStorage.clear();
  });

  it('validates plausible score data with the current compatibility signature', () => {
    const result = (security as any).validateScore(1000, 'classic', 120);

    expect(result.isValid).toBe(true);
    expect(result.suspicionLevel).toBe('none');
  });

  it('rejects impossible score data', () => {
    const result = (security as any).validateScore(2_000_000, 'classic', 60);

    expect(result.isValid).toBe(false);
    expect(result.suspicionLevel).toBe('high');
  });

  it('checks rate limits and exposes remaining tokens', () => {
    expect(security.checkRateLimit('submit_score', { capacity: 1, refillRate: 0, cost: 1 })).toBe(true);
    expect(security.checkRateLimit('submit_score', { capacity: 1, refillRate: 0, cost: 1 })).toBe(false);
    expect(security.getRateLimitStatus('submit_score')?.tokens).toBe(0);
  });

  it('calculates and verifies checksums through the compatibility API', async () => {
    const checksum = await (security as any).calculateChecksum('payload');

    expect(await (security as any).verifyChecksum('payload', checksum)).toBe(true);
    expect(await (security as any).verifyChecksum('tampered', checksum)).toBe(false);
  });
});
