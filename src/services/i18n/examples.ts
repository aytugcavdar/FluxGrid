/**
 * Localization Service Examples
 * 
 * This file demonstrates various use cases of the LocalizationService.
 */

import { 
  getLocalizationService, 
  initializeLocalizationService,
  SupportedLanguage 
} from './localizationService';

/**
 * Example 1: Initialize and change language
 */
export async function example1_InitializeAndChangeLanguage() {
  // Initialize service
  const service = await initializeLocalizationService({
    defaultLanguage: SupportedLanguage.TR,
    fallbackLanguage: SupportedLanguage.EN,
  });

  console.log('Current language:', service.getCurrentLanguage());

  // Change to German
  await service.changeLanguage(SupportedLanguage.DE);
  console.log('Changed to:', service.getCurrentLanguage());

  // Get translation
  console.log('Translation:', service.t('home.play'));
}

/**
 * Example 2: Device language detection
 */
export async function example2_DeviceLanguageDetection() {
  // Service will automatically detect device language on initialization
  const service = await initializeLocalizationService();
  
  console.log('Detected and set language:', service.getCurrentLanguage());
}

/**
 * Example 3: RTL support
 */
export async function example3_RTLSupport() {
  const service = getLocalizationService();

  // Check if current language is RTL
  console.log('Is RTL:', service.isRTL());

  // Change to Arabic (RTL language)
  await service.changeLanguage(SupportedLanguage.AR);
  console.log('Is RTL now:', service.isRTL());

  // Get direction for any language
  console.log('Arabic direction:', service.getLanguageDirection(SupportedLanguage.AR));
  console.log('English direction:', service.getLanguageDirection(SupportedLanguage.EN));
}

/**
 * Example 4: Number formatting
 */
export function example4_NumberFormatting() {
  const service = getLocalizationService();

  const number = 1234567.89;

  // Format with current locale
  console.log('Formatted number:', service.formatNumber(number));

  // Format with specific options
  console.log('With 2 decimals:', service.formatNumber(number, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }));

  // Format as percentage
  console.log('As percentage:', service.formatPercent(0.75));
}

/**
 * Example 5: Date formatting
 */
export function example5_DateFormatting() {
  const service = getLocalizationService();

  const date = new Date('2024-01-15T14:30:00');

  // Format with current locale
  console.log('Formatted date:', service.formatDate(date, {
    dateStyle: 'long',
    timeStyle: 'short',
  }));

  // Format date only
  console.log('Date only:', service.formatDate(date, {
    dateStyle: 'medium',
  }));

  // Format time only
  console.log('Time only:', service.formatDate(date, {
    timeStyle: 'short',
  }));
}

/**
 * Example 6: Currency formatting
 */
export function example6_CurrencyFormatting() {
  const service = getLocalizationService();

  const amount = 1234.56;

  // Format as USD
  console.log('USD:', service.formatCurrency(amount, 'USD'));

  // Format as EUR
  console.log('EUR:', service.formatCurrency(amount, 'EUR'));

  // Format as TRY
  console.log('TRY:', service.formatCurrency(amount, 'TRY'));
}

/**
 * Example 7: Language change event listener
 */
export function example7_LanguageChangeListener() {
  // Listen for language changes
  window.addEventListener('languageChanged', (event: CustomEvent) => {
    console.log('Language changed to:', event.detail.language);
    
    // Update UI or perform other actions
    updateUIForLanguage(event.detail.language);
  });
}

function updateUIForLanguage(language: SupportedLanguage) {
  // Example: Update document title
  const service = getLocalizationService();
  document.title = service.t('home.tagline');
  
  // Example: Update meta tags
  document.documentElement.lang = language;
}

/**
 * Example 8: Get all available languages
 */
export function example8_AvailableLanguages() {
  const service = getLocalizationService();

  const languages = service.getAvailableLanguages();
  
  console.log('Available languages:');
  languages.forEach(lang => {
    console.log(`- ${lang}: ${service.getLanguageName(lang)}`);
  });
}

/**
 * Example 9: Check translation existence
 */
export function example9_CheckTranslation() {
  const service = getLocalizationService();

  // Check if translation exists
  const exists = service.hasTranslation('home.play');
  console.log('Translation exists:', exists);

  // Check for non-existent key
  const notExists = service.hasTranslation('nonexistent.key');
  console.log('Non-existent key:', notExists);
}

/**
 * Example 10: Remote translations
 */
export async function example10_RemoteTranslations() {
  // Initialize with remote translations enabled
  const service = await initializeLocalizationService({
    enableRemoteTranslations: true,
  });

  // Load remote translations
  await service.loadRemoteTranslations();

  // Get remote translations for Turkish
  const remoteTr = service.getRemoteTranslations(SupportedLanguage.TR);
  console.log('Remote translations for TR:', remoteTr);
}

/**
 * Example 11: Format game score with locale
 */
export function example11_FormatGameScore() {
  const service = getLocalizationService();

  const score = 1234567;

  // Format score with current locale
  const formattedScore = service.formatNumber(score, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  console.log('Game score:', formattedScore);
  // TR: "1.234.567"
  // EN: "1,234,567"
  // DE: "1.234.567"
}

/**
 * Example 12: Format game duration
 */
export function example12_FormatGameDuration() {
  const service = getLocalizationService();

  const startTime = new Date('2024-01-15T14:00:00');
  const endTime = new Date('2024-01-15T14:30:00');

  const formattedStart = service.formatDate(startTime, {
    timeStyle: 'short',
  });

  const formattedEnd = service.formatDate(endTime, {
    timeStyle: 'short',
  });

  console.log(`Game played from ${formattedStart} to ${formattedEnd}`);
}

/**
 * Example 13: Multi-language settings UI
 */
export function example13_LanguageSelector() {
  const service = getLocalizationService();
  const languages = service.getAvailableLanguages();

  // Create language selector options
  const options = languages.map(lang => ({
    value: lang,
    label: service.getLanguageName(lang),
    direction: service.getLanguageDirection(lang),
    current: lang === service.getCurrentLanguage(),
  }));

  console.log('Language selector options:', options);
  
  return options;
}

/**
 * Example 14: Format ad revenue
 */
export function example14_FormatAdRevenue() {
  const service = getLocalizationService();

  const revenue = 0.05; // $0.05 per ad

  const formatted = service.formatCurrency(revenue, 'USD');
  console.log('Ad revenue:', formatted);
}

/**
 * Example 15: Format achievement progress
 */
export function example15_FormatAchievementProgress() {
  const service = getLocalizationService();

  const progress = 0.75; // 75% complete

  const formatted = service.formatPercent(progress);
  console.log('Achievement progress:', formatted);
}

// Export all examples for easy testing
export const examples = {
  example1_InitializeAndChangeLanguage,
  example2_DeviceLanguageDetection,
  example3_RTLSupport,
  example4_NumberFormatting,
  example5_DateFormatting,
  example6_CurrencyFormatting,
  example7_LanguageChangeListener,
  example8_AvailableLanguages,
  example9_CheckTranslation,
  example10_RemoteTranslations,
  example11_FormatGameScore,
  example12_FormatGameDuration,
  example13_LanguageSelector,
  example14_FormatAdRevenue,
  example15_FormatAchievementProgress,
};

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== Localization Service Examples ===\n');

  console.log('Example 1: Initialize and change language');
  await example1_InitializeAndChangeLanguage();
  console.log('\n');

  console.log('Example 2: Device language detection');
  await example2_DeviceLanguageDetection();
  console.log('\n');

  console.log('Example 3: RTL support');
  await example3_RTLSupport();
  console.log('\n');

  console.log('Example 4: Number formatting');
  example4_NumberFormatting();
  console.log('\n');

  console.log('Example 5: Date formatting');
  example5_DateFormatting();
  console.log('\n');

  console.log('Example 6: Currency formatting');
  example6_CurrencyFormatting();
  console.log('\n');

  console.log('Example 8: Available languages');
  example8_AvailableLanguages();
  console.log('\n');

  console.log('Example 9: Check translation');
  example9_CheckTranslation();
  console.log('\n');

  console.log('Example 11: Format game score');
  example11_FormatGameScore();
  console.log('\n');

  console.log('Example 13: Language selector');
  example13_LanguageSelector();
  console.log('\n');

  console.log('Example 14: Format ad revenue');
  example14_FormatAdRevenue();
  console.log('\n');

  console.log('Example 15: Format achievement progress');
  example15_FormatAchievementProgress();
  console.log('\n');
}
