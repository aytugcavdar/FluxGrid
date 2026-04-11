import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalizationService } from '@services/i18n/localizationService';
import i18n from 'i18next';

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    changeLanguage: vi.fn(),
    language: 'en',
    t: vi.fn((key: string) => key),
    dir: vi.fn(() => 'ltr'),
  },
}));

describe('LocalizationService', () => {
  let service: LocalizationService;

  beforeEach(() => {
    service = new LocalizationService();
    vi.clearAllMocks();
  });

  describe('Language Management', () => {
    it('should change language', async () => {
      await service.changeLanguage('tr');
      
      expect(i18n.changeLanguage).toHaveBeenCalledWith('tr');
    });

    it('should get current language', () => {
      const lang = service.getCurrentLanguage();
      
      expect(lang).toBe('en');
    });

    it('should support multiple languages', async () => {
      const languages = ['tr', 'en', 'de', 'fr', 'es'];
      
      for (const lang of languages) {
        await service.changeLanguage(lang);
        expect(i18n.changeLanguage).toHaveBeenCalledWith(lang);
      }
    });

    it('should fallback to English for unsupported language', async () => {
      await service.changeLanguage('xx'); // Unsupported
      
      expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
    });
  });

  describe('Device Language Detection', () => {
    it('should detect device language', () => {
      vi.stubGlobal('navigator', {
        language: 'tr-TR',
        languages: ['tr-TR', 'en-US'],
      });
      
      const lang = service.detectDeviceLanguage();
      
      expect(lang).toBe('tr');
    });

    it('should handle language codes with region', () => {
      vi.stubGlobal('navigator', {
        language: 'en-GB',
        languages: ['en-GB'],
      });
      
      const lang = service.detectDeviceLanguage();
      
      expect(lang).toBe('en');
    });

    it('should fallback to English if device language not supported', () => {
      vi.stubGlobal('navigator', {
        language: 'ja-JP',
        languages: ['ja-JP'],
      });
      
      const lang = service.detectDeviceLanguage();
      
      expect(lang).toBe('en');
    });
  });

  describe('RTL Support', () => {
    it('should detect RTL languages', () => {
      expect(service.isRTL('ar')).toBe(true);
      expect(service.isRTL('he')).toBe(true);
      expect(service.isRTL('fa')).toBe(true);
    });

    it('should detect LTR languages', () => {
      expect(service.isRTL('en')).toBe(false);
      expect(service.isRTL('tr')).toBe(false);
      expect(service.isRTL('de')).toBe(false);
    });

    it('should get text direction', () => {
      expect(service.getTextDirection('ar')).toBe('rtl');
      expect(service.getTextDirection('en')).toBe('ltr');
    });
  });

  describe('Number Formatting', () => {
    it('should format numbers with locale', () => {
      const formatted = service.formatNumber(1234.56, 'en');
      
      expect(formatted).toBe('1,234.56');
    });

    it('should format numbers in Turkish', () => {
      const formatted = service.formatNumber(1234.56, 'tr');
      
      expect(formatted).toBe('1.234,56');
    });

    it('should format numbers in German', () => {
      const formatted = service.formatNumber(1234.56, 'de');
      
      expect(formatted).toBe('1.234,56');
    });

    it('should format with custom decimal places', () => {
      const formatted = service.formatNumber(1234.5678, 'en', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      
      expect(formatted).toBe('1,234.57');
    });
  });

  describe('Date Formatting', () => {
    it('should format dates with locale', () => {
      const date = new Date('2024-01-15');
      const formatted = service.formatDate(date, 'en');
      
      expect(formatted).toContain('2024');
      expect(formatted).toContain('15');
    });

    it('should format dates in Turkish', () => {
      const date = new Date('2024-01-15');
      const formatted = service.formatDate(date, 'tr');
      
      expect(formatted).toBeDefined();
    });

    it('should format with custom options', () => {
      const date = new Date('2024-01-15');
      const formatted = service.formatDate(date, 'en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency in USD', () => {
      const formatted = service.formatCurrency(1234.56, 'USD', 'en');
      
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
    });

    it('should format currency in EUR', () => {
      const formatted = service.formatCurrency(1234.56, 'EUR', 'de');
      
      expect(formatted).toContain('€');
      expect(formatted).toContain('1.234,56');
    });

    it('should format currency in TRY', () => {
      const formatted = service.formatCurrency(1234.56, 'TRY', 'tr');
      
      expect(formatted).toContain('₺');
      expect(formatted).toContain('1.234,56');
    });
  });

  describe('Remote Translations', () => {
    it('should load remote translations', async () => {
      const remoteTranslations = {
        en: {
          'new.key': 'New translation',
        },
        tr: {
          'new.key': 'Yeni çeviri',
        },
      };
      
      await service.loadRemoteTranslations(remoteTranslations);
      
      // Verify translations were added
      expect(service.hasTranslation('new.key', 'en')).toBe(true);
      expect(service.hasTranslation('new.key', 'tr')).toBe(true);
    });

    it('should update existing translations', async () => {
      const remoteTranslations = {
        en: {
          'existing.key': 'Updated translation',
        },
      };
      
      await service.loadRemoteTranslations(remoteTranslations);
      
      const translation = service.translate('existing.key', 'en');
      expect(translation).toBe('Updated translation');
    });
  });

  describe('Translation Keys', () => {
    it('should translate keys', () => {
      vi.mocked(i18n.t).mockReturnValue('Translated text');
      
      const result = service.translate('test.key');
      
      expect(result).toBe('Translated text');
    });

    it('should handle missing keys', () => {
      vi.mocked(i18n.t).mockReturnValue('test.key');
      
      const result = service.translate('missing.key');
      
      expect(result).toBe('test.key');
    });

    it('should interpolate variables', () => {
      vi.mocked(i18n.t).mockReturnValue('Hello, John!');
      
      const result = service.translate('greeting', { name: 'John' });
      
      expect(result).toBe('Hello, John!');
    });
  });

  describe('Pluralization', () => {
    it('should handle plural forms', () => {
      vi.mocked(i18n.t).mockReturnValue('1 item');
      
      const result = service.translate('items', { count: 1 });
      
      expect(result).toBe('1 item');
    });

    it('should handle multiple items', () => {
      vi.mocked(i18n.t).mockReturnValue('5 items');
      
      const result = service.translate('items', { count: 5 });
      
      expect(result).toBe('5 items');
    });
  });
});
