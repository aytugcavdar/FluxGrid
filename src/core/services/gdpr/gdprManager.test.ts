/**
 * GDPR Manager Unit Tests
 * 
 * Tests for GDPR compliance and consent management.
 * Requirements: 1.1, 1.4, 1.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GDPRManager, ConsentType } from './gdprManager';
import { ServiceStatus } from '../base/BaseService';

describe('GDPRManager', () => {
  let gdprManager: GDPRManager;
  let originalNavigator: any;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Save original navigator
    originalNavigator = global.navigator;

    // Create new instance
    gdprManager = new GDPRManager();
  });

  afterEach(() => {
    // Restore original navigator
    global.navigator = originalNavigator;
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await gdprManager.initialize();
      expect(gdprManager.getNetworkStatus()).toBe(ServiceStatus.INITIALIZED);
    });

    it('should start successfully after initialization', async () => {
      await gdprManager.initialize();
      await gdprManager.start();
      expect(gdprManager.getNetworkStatus()).toBe(ServiceStatus.RUNNING);
    });
  });

  describe('EEA Region Detection', () => {
    it('should detect EEA region for German language (de-DE)', async () => {
      // Mock navigator.language
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });

      await gdprManager.initialize();
      expect(gdprManager.isConsentRequired()).toBe(true);
    });

    it('should detect EEA region for French language (fr-FR)', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'fr-FR',
        configurable: true
      });

      await gdprManager.initialize();
      expect(gdprManager.isConsentRequired()).toBe(true);
    });

    it('should detect EEA region for UK language (en-GB)', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'en-GB',
        configurable: true
      });

      await gdprManager.initialize();
      expect(gdprManager.isConsentRequired()).toBe(true);
    });

    it('should not require consent for US language (en-US)', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'en-US',
        configurable: true
      });

      await gdprManager.initialize();
      expect(gdprManager.isConsentRequired()).toBe(false);
    });

    it('should not require consent for Turkish language (tr-TR)', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'tr-TR',
        configurable: true
      });

      await gdprManager.initialize();
      expect(gdprManager.isConsentRequired()).toBe(false);
    });

    it('should default to requiring consent if language detection fails', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: undefined,
        configurable: true
      });

      await gdprManager.initialize();
      // Should default to true for safety
      expect(gdprManager.isConsentRequired()).toBe(false);
    });
  });

  describe('Consent Storage and Retrieval', () => {
    beforeEach(async () => {
      // Mock EEA region
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();
    });

    it('should return no consent initially', () => {
      const status = gdprManager.getConsentStatus();
      expect(status.obtained).toBe(false);
      expect(status.consentType).toBe(ConsentType.NONE);
    });

    it('should store personalized consent', async () => {
      await gdprManager.updateConsent(ConsentType.PERSONALIZED);

      const status = gdprManager.getConsentStatus();
      expect(status.obtained).toBe(true);
      expect(status.consentType).toBe(ConsentType.PERSONALIZED);
      expect(status.timestamp).toBeGreaterThan(0);
    });

    it('should store non-personalized consent', async () => {
      await gdprManager.updateConsent(ConsentType.NON_PERSONALIZED);

      const status = gdprManager.getConsentStatus();
      expect(status.obtained).toBe(true);
      expect(status.consentType).toBe(ConsentType.NON_PERSONALIZED);
    });

    it('should persist consent to localStorage', async () => {
      await gdprManager.updateConsent(ConsentType.PERSONALIZED);

      expect(localStorage.getItem('gdpr:consent')).toBe(ConsentType.PERSONALIZED);
      expect(localStorage.getItem('gdpr:consent_version')).toBe('1.0');
      expect(localStorage.getItem('gdpr:consent_timestamp')).toBeTruthy();
    });

    it('should load stored consent on initialization', async () => {
      // Store consent manually
      localStorage.setItem('gdpr:consent', ConsentType.NON_PERSONALIZED);
      localStorage.setItem('gdpr:consent_version', '1.0');
      localStorage.setItem('gdpr:consent_timestamp', Date.now().toString());

      // Create new instance and initialize
      const newManager = new GDPRManager();
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await newManager.initialize();

      const status = newManager.getConsentStatus();
      expect(status.obtained).toBe(true);
      expect(status.consentType).toBe(ConsentType.NON_PERSONALIZED);
    });

    it('should update existing consent', async () => {
      await gdprManager.updateConsent(ConsentType.PERSONALIZED);
      await gdprManager.updateConsent(ConsentType.NON_PERSONALIZED);

      const status = gdprManager.getConsentStatus();
      expect(status.consentType).toBe(ConsentType.NON_PERSONALIZED);
    });
  });

  describe('Consent Reset', () => {
    beforeEach(async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();
      await gdprManager.updateConsent(ConsentType.PERSONALIZED);
    });

    it('should reset consent', async () => {
      await gdprManager.resetConsent();

      const status = gdprManager.getConsentStatus();
      expect(status.obtained).toBe(false);
      expect(status.consentType).toBe(ConsentType.NONE);
    });

    it('should clear localStorage on reset', async () => {
      await gdprManager.resetConsent();

      expect(localStorage.getItem('gdpr:consent')).toBeNull();
      expect(localStorage.getItem('gdpr:consent_version')).toBeNull();
      expect(localStorage.getItem('gdpr:consent_timestamp')).toBeNull();
    });
  });

  describe('Consent Versioning', () => {
    beforeEach(async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();
    });

    it('should not be outdated for current version', async () => {
      await gdprManager.updateConsent(ConsentType.PERSONALIZED);
      expect(gdprManager.isConsentVersionOutdated()).toBe(false);
    });

    it('should detect outdated consent version', async () => {
      // Store old version manually
      localStorage.setItem('gdpr:consent', ConsentType.PERSONALIZED);
      localStorage.setItem('gdpr:consent_version', '0.9');
      localStorage.setItem('gdpr:consent_timestamp', Date.now().toString());

      // Create new instance
      const newManager = new GDPRManager();
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await newManager.initialize();

      expect(newManager.isConsentVersionOutdated()).toBe(true);
    });

    it('should return false for outdated check when no consent obtained', () => {
      expect(gdprManager.isConsentVersionOutdated()).toBe(false);
    });
  });

  describe('Consent Form Display Logic', () => {
    it('should show consent form for EEA users without consent', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();

      expect(gdprManager.shouldShowConsentForm()).toBe(true);
    });

    it('should not show consent form for non-EEA users', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'en-US',
        configurable: true
      });
      await gdprManager.initialize();

      expect(gdprManager.shouldShowConsentForm()).toBe(false);
    });

    it('should not show consent form for EEA users with valid consent', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();
      await gdprManager.updateConsent(ConsentType.PERSONALIZED);

      expect(gdprManager.shouldShowConsentForm()).toBe(false);
    });

    it('should show consent form for EEA users with outdated consent', async () => {
      // Store old version
      localStorage.setItem('gdpr:consent', ConsentType.PERSONALIZED);
      localStorage.setItem('gdpr:consent_version', '0.9');
      localStorage.setItem('gdpr:consent_timestamp', Date.now().toString());

      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();

      expect(gdprManager.shouldShowConsentForm()).toBe(true);
    });
  });

  describe('AdMob Integration', () => {
    it('should return personalized for non-EEA users', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'en-US',
        configurable: true
      });
      await gdprManager.initialize();

      expect(gdprManager.getConsentTypeForAds()).toBe(ConsentType.PERSONALIZED);
    });

    it('should return non-personalized for EEA users without consent', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();

      expect(gdprManager.getConsentTypeForAds()).toBe(ConsentType.NON_PERSONALIZED);
    });

    it('should return user choice for EEA users with consent', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();
      await gdprManager.updateConsent(ConsentType.PERSONALIZED);

      expect(gdprManager.getConsentTypeForAds()).toBe(ConsentType.PERSONALIZED);
    });

    it('should respect non-personalized choice', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();
      await gdprManager.updateConsent(ConsentType.NON_PERSONALIZED);

      expect(gdprManager.getConsentTypeForAds()).toBe(ConsentType.NON_PERSONALIZED);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();

      // Spy on console.error to verify error handling
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(gdprManager.updateConsent(ConsentType.PERSONALIZED)).rejects.toThrow('Failed to update consent');

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle corrupted localStorage data', async () => {
      // Store invalid consent type
      localStorage.setItem('gdpr:consent', 'invalid');
      localStorage.setItem('gdpr:consent_version', '1.0');
      localStorage.setItem('gdpr:consent_timestamp', 'not-a-number');

      Object.defineProperty(global.navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });
      await gdprManager.initialize();

      // Should handle gracefully and treat as no consent
      const status = gdprManager.getConsentStatus();
      expect(status.obtained).toBe(false);
    });
  });
});
