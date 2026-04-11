# Localization Service

Comprehensive internationalization (i18n) service for FluxGrid, providing multi-language support, RTL layout, and dynamic translation management.

## Features

- **Multi-Language Support**: TR, EN, DE, FR, ES, AR
- **Device Language Detection**: Automatically detects and uses device language
- **RTL Support**: Full right-to-left layout support for Arabic
- **Number Formatting**: Locale-aware number formatting
- **Date Formatting**: Locale-aware date and time formatting
- **Currency Formatting**: Multi-currency support with proper locale formatting
- **Dynamic Translations**: Load translations from Firebase Remote Config
- **Fallback System**: Graceful fallback to English if translation missing

## Usage

### Basic Setup

```typescript
import { initializeLocalizationService } from '@services/i18n/localizationService';

// Initialize with default config
const localizationService = await initializeLocalizationService();

// Or with custom config
const localizationService = await initializeLocalizationService({
  defaultLanguage: SupportedLanguage.TR,
  fallbackLanguage: SupportedLanguage.EN,
  enableRemoteTranslations: true,
});
```

### Change Language

```typescript
import { getLocalizationService, SupportedLanguage } from '@services/i18n/localizationService';

const localizationService = getLocalizationService();

// Change to German
await localizationService.changeLanguage(SupportedLanguage.DE);

// Get current language
const currentLang = localizationService.getCurrentLanguage();
```

### Using Translations in React Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.tagline')}</h1>
      <button>{t('home.play')}</button>
    </div>
  );
}
```

### RTL Support

```typescript
const localizationService = getLocalizationService();

// Check if current language is RTL
if (localizationService.isRTL()) {
  // Apply RTL-specific styles
}

// Get direction for any language
const direction = localizationService.getLanguageDirection(SupportedLanguage.AR);
// Returns 'rtl' or 'ltr'
```

### Number Formatting

```typescript
const localizationService = getLocalizationService();

// Format decimal number
const formatted = localizationService.formatNumber(1234.56);
// TR: "1.234,56"
// EN: "1,234.56"
// DE: "1.234,56"

// Format with custom options
const formatted = localizationService.formatNumber(1234.56, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
```

### Date Formatting

```typescript
const localizationService = getLocalizationService();

// Format date
const formatted = localizationService.formatDate(new Date(), {
  dateStyle: 'long',
  timeStyle: 'short',
});
// TR: "15 Ocak 2024 14:30"
// EN: "January 15, 2024, 2:30 PM"
// DE: "15. Januar 2024, 14:30"
```

### Currency Formatting

```typescript
const localizationService = getLocalizationService();

// Format currency
const formatted = localizationService.formatCurrency(1234.56, 'USD');
// TR: "1.234,56 $"
// EN: "$1,234.56"
// DE: "1.234,56 $"

// Format with different currency
const formatted = localizationService.formatCurrency(1234.56, 'EUR');
// TR: "1.234,56 €"
// EN: "€1,234.56"
// DE: "1.234,56 €"
```

### Percentage Formatting

```typescript
const localizationService = getLocalizationService();

// Format percentage (value should be 0-1)
const formatted = localizationService.formatPercent(0.75);
// All locales: "75%"

const formatted = localizationService.formatPercent(0.7532);
// All locales: "75.32%"
```

### Remote Translations

```typescript
// Enable remote translations in config
const localizationService = await initializeLocalizationService({
  enableRemoteTranslations: true,
});

// Load remote translations from Firebase Remote Config
await localizationService.loadRemoteTranslations();

// Get remote translations for a language
const remoteTr = localizationService.getRemoteTranslations(SupportedLanguage.TR);
```

### Language Change Events

```typescript
// Listen for language changes
window.addEventListener('languageChanged', (event: CustomEvent) => {
  console.log('Language changed to:', event.detail.language);
  // Update UI or perform other actions
});
```

## Supported Languages

| Code | Language | Native Name | Direction |
|------|----------|-------------|-----------|
| `tr` | Turkish | Türkçe | LTR |
| `en` | English | English | LTR |
| `de` | German | Deutsch | LTR |
| `fr` | French | Français | LTR |
| `es` | Spanish | Español | LTR |
| `ar` | Arabic | العربية | RTL |

## Translation File Structure

Translation files are located in `src/i18n/locales/` and follow this structure:

```json
{
  "home": {
    "tagline": "Zen Puzzle",
    "play": "PLAY",
    "settings": "SETTINGS"
  },
  "game": {
    "gameOver": "Game Over",
    "tryAgain": "Try Again"
  }
}
```

## Adding New Translations

1. Add the translation key to all language files
2. Use the key in your component with `t('category.key')`
3. Test with different languages

Example:

```json
// en.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

```typescript
// Component
const { t } = useTranslation();
<h1>{t('newFeature.title')}</h1>
```

## RTL Layout Considerations

When supporting RTL languages:

1. Use logical CSS properties:
   - `margin-inline-start` instead of `margin-left`
   - `padding-inline-end` instead of `padding-right`

2. Use Tailwind's RTL utilities:
   - `ltr:ml-4 rtl:mr-4`
   - `start-0` instead of `left-0`

3. Test with Arabic language to ensure proper layout

## Remote Config Integration

To enable dynamic translations via Firebase Remote Config:

1. Set `enableRemoteTranslations: true` in config
2. Add translation JSON to Remote Config with keys:
   - `translations_tr`
   - `translations_en`
   - `translations_de`
   - `translations_fr`
   - `translations_es`
   - `translations_ar`

3. Translations will be merged with local translations on load

## Best Practices

1. **Always use translation keys**: Never hardcode text in components
2. **Use namespaces**: Group related translations (e.g., `home.*`, `game.*`)
3. **Provide context**: Use descriptive keys (`game.confirmExit` not `confirm`)
4. **Test all languages**: Ensure UI works with longer/shorter text
5. **Handle plurals**: Use i18next plural features when needed
6. **Format numbers/dates**: Always use formatting methods for locale-aware display

## Requirements Fulfilled

- ✅ 13.1: i18n framework (react-i18next)
- ✅ 13.2: 5+ languages (TR, EN, DE, FR, ES)
- ✅ 13.3: Language switching
- ✅ 13.4: Device language detection
- ✅ 13.5: RTL support
- ✅ 13.6: Number formatting
- ✅ 13.7: Date/time formatting
- ✅ 13.8: Currency formatting
- ✅ 13.9: Fallback to EN
- ✅ 13.10: Remote Config integration
