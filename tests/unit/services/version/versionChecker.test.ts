import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VersionChecker } from '@services/version/versionChecker';

// Mock Remote Config
vi.mock('@services/firebase/firebaseConfig', () => ({
  remoteConfig: {
    getValue: vi.fn(),
    fetchAndActivate: vi.fn(),
  },
}));

describe('VersionChecker', () => {
  let checker: VersionChecker;

  beforeEach(() => {
    checker = new VersionChecker();
    vi.clearAllMocks();
  });

  describe('Version Comparison', () => {
    it('should compare semantic versions', () => {
      expect(checker.compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(checker.compareVersions('1.0.1', '1.0.0')).toBeGreaterThan(0);
      expect(checker.compareVersions('1.0.0', '1.0.1')).toBeLessThan(0);
    });

    it('should handle major version differences', () => {
      expect(checker.compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
      expect(checker.compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    });

    it('should handle minor version differences', () => {
      expect(checker.compareVersions('1.2.0', '1.1.9')).toBeGreaterThan(0);
      expect(checker.compareVersions('1.1.0', '1.2.0')).toBeLessThan(0);
    });

    it('should handle patch version differences', () => {
      expect(checker.compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0);
      expect(checker.compareVersions('1.0.1', '1.0.2')).toBeLessThan(0);
    });

    it('should handle multi-digit versions', () => {
      expect(checker.compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
      expect(checker.compareVersions('1.0.10', '1.0.9')).toBeGreaterThan(0);
    });
  });

  describe('Update Check', () => {
    it('should detect no update needed', async () => {
      const currentVersion = '1.0.0';
      const minVersion = '1.0.0';
      const recommendedVersion = '1.0.0';
      
      const result = await checker.checkForUpdate(
        currentVersion,
        minVersion,
        recommendedVersion
      );
      
      expect(result.updateRequired).toBe(false);
      expect(result.updateRecommended).toBe(false);
    });

    it('should detect required update', async () => {
      const currentVersion = '1.0.0';
      const minVersion = '1.1.0';
      const recommendedVersion = '1.2.0';
      
      const result = await checker.checkForUpdate(
        currentVersion,
        minVersion,
        recommendedVersion
      );
      
      expect(result.updateRequired).toBe(true);
      expect(result.updateRecommended).toBe(true);
    });

    it('should detect recommended update', async () => {
      const currentVersion = '1.1.0';
      const minVersion = '1.0.0';
      const recommendedVersion = '1.2.0';
      
      const result = await checker.checkForUpdate(
        currentVersion,
        minVersion,
        recommendedVersion
      );
      
      expect(result.updateRequired).toBe(false);
      expect(result.updateRecommended).toBe(true);
    });

    it('should include version info in result', async () => {
      const currentVersion = '1.0.0';
      const minVersion = '1.1.0';
      const recommendedVersion = '1.2.0';
      
      const result = await checker.checkForUpdate(
        currentVersion,
        minVersion,
        recommendedVersion
      );
      
      expect(result.currentVersion).toBe(currentVersion);
      expect(result.minVersion).toBe(minVersion);
      expect(result.recommendedVersion).toBe(recommendedVersion);
    });
  });

  describe('Remote Config Integration', () => {
    it('should fetch version info from remote config', async () => {
      const mockRemoteConfig = {
        min_version: '1.0.0',
        recommended_version: '1.1.0',
      };
      
      vi.mocked(checker['remoteConfig'].getValue).mockReturnValue({
        asString: () => JSON.stringify(mockRemoteConfig),
      } as any);
      
      const versionInfo = await checker.fetchVersionInfo();
      
      expect(versionInfo.minVersion).toBe('1.0.0');
      expect(versionInfo.recommendedVersion).toBe('1.1.0');
    });

    it('should handle remote config fetch errors', async () => {
      vi.mocked(checker['remoteConfig'].fetchAndActivate).mockRejectedValue(
        new Error('Network error')
      );
      
      // Should not throw, but return default values
      const versionInfo = await checker.fetchVersionInfo();
      
      expect(versionInfo).toBeDefined();
    });
  });

  describe('Update Messages', () => {
    it('should generate update message for required update', () => {
      const message = checker.getUpdateMessage('required', 'en');
      
      expect(message).toContain('update');
      expect(message).toContain('required');
    });

    it('should generate update message for recommended update', () => {
      const message = checker.getUpdateMessage('recommended', 'en');
      
      expect(message).toContain('update');
      expect(message).toContain('available');
    });

    it('should support multiple languages', () => {
      const languages = ['tr', 'en', 'de', 'fr', 'es'];
      
      languages.forEach(lang => {
        const message = checker.getUpdateMessage('required', lang);
        expect(message).toBeDefined();
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should include version numbers in message', () => {
      const message = checker.getUpdateMessage('required', 'en', {
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
      });
      
      expect(message).toContain('1.0.0');
      expect(message).toContain('1.1.0');
    });
  });

  describe('Update URL', () => {
    it('should generate Play Store URL', () => {
      const url = checker.getUpdateURL('android', 'com.example.app');
      
      expect(url).toContain('play.google.com');
      expect(url).toContain('com.example.app');
    });

    it('should generate App Store URL', () => {
      const url = checker.getUpdateURL('ios', '123456789');
      
      expect(url).toContain('apps.apple.com');
      expect(url).toContain('123456789');
    });

    it('should handle web platform', () => {
      const url = checker.getUpdateURL('web', 'https://example.com');
      
      expect(url).toBe('https://example.com');
    });
  });

  describe('Version Validation', () => {
    it('should validate semantic version format', () => {
      expect(checker.isValidVersion('1.0.0')).toBe(true);
      expect(checker.isValidVersion('1.2.3')).toBe(true);
      expect(checker.isValidVersion('10.20.30')).toBe(true);
    });

    it('should reject invalid version formats', () => {
      expect(checker.isValidVersion('1.0')).toBe(false);
      expect(checker.isValidVersion('1')).toBe(false);
      expect(checker.isValidVersion('v1.0.0')).toBe(false);
      expect(checker.isValidVersion('1.0.0-beta')).toBe(false);
      expect(checker.isValidVersion('invalid')).toBe(false);
    });
  });

  describe('Update Frequency', () => {
    it('should check update frequency', () => {
      const lastCheck = Date.now() - 1000 * 60 * 60; // 1 hour ago
      
      const shouldCheck = checker.shouldCheckForUpdate(lastCheck, 30 * 60 * 1000); // 30 min interval
      
      expect(shouldCheck).toBe(true);
    });

    it('should not check too frequently', () => {
      const lastCheck = Date.now() - 1000 * 60 * 10; // 10 minutes ago
      
      const shouldCheck = checker.shouldCheckForUpdate(lastCheck, 30 * 60 * 1000); // 30 min interval
      
      expect(shouldCheck).toBe(false);
    });

    it('should check on first launch', () => {
      const shouldCheck = checker.shouldCheckForUpdate(null, 30 * 60 * 1000);
      
      expect(shouldCheck).toBe(true);
    });
  });

  describe('Update Dialog State', () => {
    it('should track if update dialog was shown', () => {
      checker.markUpdateDialogShown('1.1.0');
      
      expect(checker.wasUpdateDialogShown('1.1.0')).toBe(true);
    });

    it('should not show dialog again for same version', () => {
      checker.markUpdateDialogShown('1.1.0');
      
      const shouldShow = checker.shouldShowUpdateDialog('1.1.0');
      
      expect(shouldShow).toBe(false);
    });

    it('should show dialog for new version', () => {
      checker.markUpdateDialogShown('1.1.0');
      
      const shouldShow = checker.shouldShowUpdateDialog('1.2.0');
      
      expect(shouldShow).toBe(true);
    });
  });
});
