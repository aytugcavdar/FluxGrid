/**
 * Localization Service - Public API
 * 
 * Export all public interfaces and functions for the localization service.
 */

export {
  LocalizationService,
  getLocalizationService,
  initializeLocalizationService,
  SupportedLanguage,
  type LocalizationConfig,
  type NumberFormatOptions,
  type DateFormatOptions,
} from './localizationService';

// Re-export examples for testing and documentation
export * as LocalizationExamples from './examples';
