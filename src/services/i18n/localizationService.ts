/**
 * Localization Service
 * 
 * Manages multi-language support, RTL layout, and dynamic translation loading.
 * Integrates with i18next for translation management and Firebase Remote Config
 * for dynamic translation updates.
 */

import { BaseService, ServiceMetadata } from '../core/BaseService';
import i18n from 'i18next';
import { Device } from '@capacitor/device';

export enum SupportedLanguage {
  TR = 'tr',
  EN = 'en',
  DE = 'de',
  FR = 'fr',
  ES = 'es',
  AR = 'ar', // RTL support
}

export interface LocalizationConfig {
  defaultLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  enableRemoteTranslations: boolean;
  remoteConfigKey?: string;
}

export interface NumberFormatOptions {
  locale?: string;
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface DateFormatOptions {
  locale?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
}

/**
 * LocalizationService
 * 
 * Provides comprehensive localization features including:
 * - Multi-language support (TR, EN, DE, FR, ES, AR)
 * - Device language detection
 * - RTL layout support
 * - Number, date, and currency formatting
 * - Dynamic translation loading from Remote Config
 */
export class LocalizationService extends BaseService {
  private config: LocalizationConfig;
  private currentLanguage: SupportedLanguage;
  private rtlLanguages: Set<SupportedLanguage> = new Set([SupportedLanguage.AR]);
  private remoteTranslations: Map<string, Record<string, any>> = new Map();

  constructor(config?: Partial<LocalizationConfig>) {
    super({
      name: 'LocalizationService',
      version: '1.0.0',
      dependencies: [],
    });

    this.config = {
      defaultLanguage: SupportedLanguage.TR,
      fallbackLanguage: SupportedLanguage.EN,
      enableRemoteTranslations: false,
      ...config,
    };

    this.currentLanguage = this.config.defaultLanguage;
  }

  /**
   * Initialize localization service
   */
  protected async onInitialize(): Promise<void> {
    // Detect device language
    const deviceLanguage = await this.detectDeviceLanguage();
    
    // Load saved language preference or use device language
    const savedLanguage = this.loadSavedLanguage();
    const initialLanguage = savedLanguage || deviceLanguage || this.config.defaultLanguage;

    // Set initial language
    await this.changeLanguage(initialLanguage);

    // Load remote translations if enabled
    if (this.config.enableRemoteTranslations) {
      await this.loadRemoteTranslations();
    }
  }

  /**
   * Start localization service
   */
  protected async onStart(): Promise<void> {
    // Service is ready
  }

  /**
   * Stop localization service
   */
  protected async onStop(): Promise<void> {
    // Cleanup if needed
  }

  /**
   * Detect device language using Capacitor Device API
   * Made public for testing
   */
  public async detectDeviceLanguage(): Promise<SupportedLanguage | null> {
    try {
      const languageCode = await Device.getLanguageCode();
      const detectedLang = languageCode.value.toLowerCase().split('-')[0];

      // Check if detected language is supported
      const supportedLangs = Object.values(SupportedLanguage);
      if (supportedLangs.includes(detectedLang as SupportedLanguage)) {
        return detectedLang as SupportedLanguage;
      }

      // Fallback to English for unsupported languages
      return SupportedLanguage.EN;
    } catch (error) {
      console.warn('Failed to detect device language:', error);
      return SupportedLanguage.EN;
    }
  }

  /**
   * Load saved language preference from localStorage
   */
  private loadSavedLanguage(): SupportedLanguage | null {
    try {
      const saved = localStorage.getItem('flux_language');
      if (saved && Object.values(SupportedLanguage).includes(saved as SupportedLanguage)) {
        return saved as SupportedLanguage;
      }
      return null;
    } catch (error) {
      console.warn('Failed to load saved language:', error);
      return null;
    }
  }

  /**
   * Save language preference to localStorage
   */
  private saveLanguage(language: SupportedLanguage): void {
    try {
      localStorage.setItem('flux_language', language);
    } catch (error) {
      console.warn('Failed to save language:', error);
    }
  }

  /**
   * Change current language
   */
  async changeLanguage(language: SupportedLanguage | string): Promise<void> {
    // Validate language
    const supportedLangs = Object.values(SupportedLanguage);
    let targetLanguage: SupportedLanguage;

    if (supportedLangs.includes(language as SupportedLanguage)) {
      targetLanguage = language as SupportedLanguage;
    } else {
      // Fallback to English for unsupported languages
      console.warn(`Unsupported language: ${language}, falling back to English`);
      targetLanguage = this.config.fallbackLanguage;
    }

    try {
      // Change i18next language
      await i18n.changeLanguage(targetLanguage);
      
      this.currentLanguage = targetLanguage;
      this.saveLanguage(targetLanguage);

      // Update HTML dir attribute for RTL support
      this.updateDocumentDirection();

      // Dispatch custom event for language change
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: targetLanguage } 
      }));
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get translation for a key
   */
  t(key: string, params?: Record<string, any>): string {
    return i18n.t(key, params);
  }

  /**
   * Translate a key (alias for t())
   */
  translate(key: string, params?: Record<string, any>): string {
    return this.t(key, params);
  }

  /**
   * Check if current language is RTL
   */
  isRTL(language?: SupportedLanguage | string): boolean {
    const lang = language ? (language as SupportedLanguage) : this.currentLanguage;
    return this.rtlLanguages.has(lang);
  }

  /**
   * Get text direction for a language
   */
  getTextDirection(language?: SupportedLanguage | string): 'ltr' | 'rtl' {
    return this.isRTL(language) ? 'rtl' : 'ltr';
  }

  /**
   * Update document direction based on current language
   */
  private updateDocumentDirection(): void {
    const direction = this.isRTL() ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = this.currentLanguage;
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): SupportedLanguage[] {
    return Object.values(SupportedLanguage);
  }

  /**
   * Format number according to locale
   */
  formatNumber(value: number, localeOrOptions?: string | NumberFormatOptions): string {
    let locale: string;
    let options: NumberFormatOptions | undefined;

    // Handle both string locale and options object
    if (typeof localeOrOptions === 'string') {
      locale = localeOrOptions;
      options = undefined;
    } else {
      locale = localeOrOptions?.locale || this.currentLanguage;
      options = localeOrOptions;
    }
    
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: options?.style || 'decimal',
        currency: options?.currency,
        minimumFractionDigits: options?.minimumFractionDigits,
        maximumFractionDigits: options?.maximumFractionDigits,
      });

      return formatter.format(value);
    } catch (error) {
      console.warn('Failed to format number:', error);
      return value.toString();
    }
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, localeOrOptions?: string | DateFormatOptions): string {
    let locale: string;
    let options: DateFormatOptions | undefined;

    // Handle both string locale and options object
    if (typeof localeOrOptions === 'string') {
      locale = localeOrOptions;
      options = undefined;
    } else {
      locale = localeOrOptions?.locale || this.currentLanguage;
      options = localeOrOptions;
    }
    
    try {
      const formatter = new Intl.DateTimeFormat(locale, {
        dateStyle: options?.dateStyle,
        timeStyle: options?.timeStyle,
      });

      return formatter.format(date);
    } catch (error) {
      console.warn('Failed to format date:', error);
      return date.toLocaleDateString();
    }
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(value: number, currency: string = 'USD', locale?: string): string {
    return this.formatNumber(value, {
      locale: locale || this.currentLanguage,
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Format percentage according to locale
   */
  formatPercent(value: number, locale?: string): string {
    return this.formatNumber(value, {
      locale: locale || this.currentLanguage,
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Load remote translations from Firebase Remote Config
   * This allows updating translations without app updates
   */
  async loadRemoteTranslations(): Promise<void> {
    if (!this.config.enableRemoteTranslations) {
      return;
    }

    try {
      // Get Remote Config instance (will be injected via ServiceContainer)
      const remoteConfig = (window as any).__remoteConfig;
      
      if (!remoteConfig) {
        console.warn('Remote Config not available for translations');
        return;
      }

      // Fetch remote translations for each language
      for (const lang of this.getAvailableLanguages()) {
        const key = `translations_${lang}`;
        const remoteData = remoteConfig.getString(key);
        
        if (remoteData) {
          try {
            const translations = JSON.parse(remoteData);
            this.remoteTranslations.set(lang, translations);
            
            // Merge with existing translations
            i18n.addResourceBundle(lang, 'translation', translations, true, true);
          } catch (error) {
            console.warn(`Failed to parse remote translations for ${lang}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load remote translations:', error);
    }
  }

  /**
   * Get remote translations for a specific language
   */
  getRemoteTranslations(language: SupportedLanguage): Record<string, any> | undefined {
    return this.remoteTranslations.get(language);
  }

  /**
   * Check if a translation key exists
   */
  hasTranslation(key: string, language?: SupportedLanguage): boolean {
    const lang = language || this.currentLanguage;
    return i18n.exists(key, { lng: lang });
  }

  /**
   * Get language name in its native form
   */
  getLanguageName(language: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
      [SupportedLanguage.TR]: 'Türkçe',
      [SupportedLanguage.EN]: 'English',
      [SupportedLanguage.DE]: 'Deutsch',
      [SupportedLanguage.FR]: 'Français',
      [SupportedLanguage.ES]: 'Español',
      [SupportedLanguage.AR]: 'العربية',
    };

    return names[language] || language;
  }

  /**
   * Get language direction (ltr or rtl)
   */
  getLanguageDirection(language: SupportedLanguage): 'ltr' | 'rtl' {
    return this.rtlLanguages.has(language) ? 'rtl' : 'ltr';
  }
}

// Export singleton instance
let localizationServiceInstance: LocalizationService | null = null;

export const getLocalizationService = (): LocalizationService => {
  if (!localizationServiceInstance) {
    localizationServiceInstance = new LocalizationService();
  }
  return localizationServiceInstance;
};

export const initializeLocalizationService = async (config?: Partial<LocalizationConfig>): Promise<LocalizationService> => {
  localizationServiceInstance = new LocalizationService(config);
  await localizationServiceInstance.initialize();
  await localizationServiceInstance.start();
  return localizationServiceInstance;
};
