import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityManager } from '@services/security/securityManager';

describe('SecurityManager', () => {
  let security: SecurityManager;

  beforeEach(() => {
    security = new SecurityManager();
    vi.clearAllMocks();
  });

  describe('Score Validation', () => {
    it('should validate reasonable scores', () => {
      const result = security.validateScore(1000, 'classic', 120);
      
      expect(result.isValid).toBe(true);
      expect(result.suspicionLevel).toBe('none');
    });

    it('should detect impossibly high scores', () => {
      const result = security.validateScore(1000000, 'classic', 60);
      
      expect(result.isValid).toBe(false);
      expect(result.suspicionLevel).toBe('high');
      expect(result.reason).toMatch(/too high/i);
    });

    it('should detect impossible score per second', () => {
      const result = security.validateScore(10000, 'classic', 10); // 1000 points/sec
      
      expect(result.isValid).toBe(false);
      expect(result.suspicionLevel).toBe('high');
      expect(result.reason).toMatch(/rate/i);
    });

    it('should validate different game modes', () => {
      const classicResult = security.validateScore(5000, 'classic', 300);
      const timedResult = security.validateScore(3000, 'timed', 60);
      
      expect(classicResult.isValid).toBe(true);
      expect(timedResult.isValid).toBe(true);
    });

    it('should detect negative scores', () => {
      const result = security.validateScore(-100, 'classic', 60);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/negative/i);
    });

    it('should detect zero duration', () => {
      const result = security.validateScore(1000, 'classic', 0);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/duration/i);
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect repeated identical scores', () => {
      for (let i = 0; i < 10; i++) {
        security.validateScore(1000, 'classic', 120);
      }
      
      const isSuspicious = security.isSuspiciousPattern();
      expect(isSuspicious).toBe(true);
    });

    it('should detect rapid score submissions', () => {
      const now = Date.now();
      
      for (let i = 0; i < 20; i++) {
        security.recordScoreSubmission(1000 + i, now + i * 100); // 10 scores per second
      }
      
      const isSuspicious = security.isSuspiciousPattern();
      expect(isSuspicious).toBe(true);
    });

    it('should allow normal play patterns', () => {
      const now = Date.now();
      
      // Normal: 1 game every 2 minutes
      for (let i = 0; i < 5; i++) {
        security.recordScoreSubmission(1000 + i * 100, now + i * 120000);
      }
      
      const isSuspicious = security.isSuspiciousPattern();
      expect(isSuspicious).toBe(false);
    });
  });

  describe('Root Detection', () => {
    it('should detect rooted device', async () => {
      // Mock rooted device
      vi.stubGlobal('navigator', {
        userAgent: 'Android; rooted',
      });
      
      const isRooted = await security.isDeviceRooted();
      expect(isRooted).toBe(true);
    });

    it('should detect normal device', async () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Android',
      });
      
      const isRooted = await security.isDeviceRooted();
      expect(isRooted).toBe(false);
    });
  });

  describe('Tamper Detection', () => {
    it('should detect code tampering', () => {
      const originalCode = 'function test() { return 42; }';
      const checksum = security.calculateChecksum(originalCode);
      
      // Verify original
      expect(security.verifyChecksum(originalCode, checksum)).toBe(true);
      
      // Detect tampering
      const tamperedCode = 'function test() { return 999; }';
      expect(security.verifyChecksum(tamperedCode, checksum)).toBe(false);
    });

    it('should calculate consistent checksums', () => {
      const data = 'test data';
      
      const checksum1 = security.calculateChecksum(data);
      const checksum2 = security.calculateChecksum(data);
      
      expect(checksum1).toBe(checksum2);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      for (let i = 0; i < 10; i++) {
        const allowed = security.checkRateLimit('api_call', 100, 60000);
        expect(allowed).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        security.checkRateLimit('api_call', 100, 60000);
      }
      
      // 101st request should be blocked
      const allowed = security.checkRateLimit('api_call', 100, 60000);
      expect(allowed).toBe(false);
    });

    it('should reset after time window', () => {
      vi.useFakeTimers();
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        security.checkRateLimit('api_call', 100, 60000);
      }
      
      // Should be blocked
      expect(security.checkRateLimit('api_call', 100, 60000)).toBe(false);
      
      // Advance time by 61 seconds
      vi.advanceTimersByTime(61000);
      
      // Should be allowed again
      expect(security.checkRateLimit('api_call', 100, 60000)).toBe(true);
      
      vi.useRealTimers();
    });

    it('should handle different rate limit keys', () => {
      // Fill up one key
      for (let i = 0; i < 100; i++) {
        security.checkRateLimit('key1', 100, 60000);
      }
      
      // Different key should still work
      const allowed = security.checkRateLimit('key2', 100, 60000);
      expect(allowed).toBe(true);
    });
  });

  describe('Data Encryption', () => {
    it('should encrypt and decrypt data', async () => {
      const originalData = 'sensitive information';
      
      const encrypted = await security.encrypt(originalData);
      expect(encrypted).not.toBe(originalData);
      
      const decrypted = await security.decrypt(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should produce different ciphertext for same data', async () => {
      const data = 'test data';
      
      const encrypted1 = await security.encrypt(data);
      const encrypted2 = await security.encrypt(data);
      
      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      expect(await security.decrypt(encrypted1)).toBe(data);
      expect(await security.decrypt(encrypted2)).toBe(data);
    });

    it('should fail to decrypt tampered data', async () => {
      const data = 'test data';
      const encrypted = await security.encrypt(data);
      
      // Tamper with encrypted data
      const tampered = encrypted.slice(0, -5) + 'xxxxx';
      
      await expect(security.decrypt(tampered)).rejects.toThrow();
    });
  });

  describe('Security Logging', () => {
    it('should log suspicious activity', () => {
      const logSpy = vi.spyOn(security, 'logSecurityEvent');
      
      security.validateScore(1000000, 'classic', 10);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'suspicious_score',
          severity: 'high',
        })
      );
    });

    it('should log rate limit violations', () => {
      const logSpy = vi.spyOn(security, 'logSecurityEvent');
      
      // Exceed rate limit
      for (let i = 0; i < 101; i++) {
        security.checkRateLimit('test', 100, 60000);
      }
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rate_limit_exceeded',
        })
      );
    });
  });
});
