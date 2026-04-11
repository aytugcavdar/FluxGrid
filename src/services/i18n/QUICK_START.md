# Localization Service - Quick Start Guide

Get started with FluxGrid's localization service in 5 minutes.

## 1. Initialize the Service

Add to your app initialization:

```typescript
import { initializeLocalizationService } from '@services/i18n';

// In your app startup
await initializeLocalizationService({
  defaultLanguage: 'tr',
  fallbackLanguage: 'en',
});
```

## 2. Use Translations in Components

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

## 3. Change Language

```typescript
import { getLocalizationService } from '@services/i18n';

const service = getLocalizationService();
await service.changeLanguage('de'); // Switch to German
```

## 4. Format Numbers

```typescript
import { getLocalizationService } from '@services/i18n';

const service = getLocalizationService();
const score = 1234567;
const formatted = service.formatNumber(score);
// TR: "1.234.567"
// EN: "1,234,567"
```

## 5. Format Currency

```typescript
const service = getLocalizationService();
const price = 99.99;
const formatted = service.formatCurrency(price, 'USD');
// TR: "99,99 $"
// EN: "$99.99"
```

## Available Languages

- 🇹🇷 Turkish (tr) - Primary
- 🇬🇧 English (en) - Fallback
- 🇩🇪 German (de)
- 🇫🇷 French (fr)
- 🇪🇸 Spanish (es)

## Common Use Cases

### Game Score Display
```typescript
const service = getLocalizationService();
const { t } = useTranslation();

<div>
  <h2>{t('game.gameOver')}</h2>
  <p>{service.formatNumber(score)}</p>
</div>
```

### Date Display
```typescript
const service = getLocalizationService();
const date = new Date();
const formatted = service.formatDate(date, { dateStyle: 'medium' });
```

### Language Selector
```typescript
const service = getLocalizationService();
const languages = service.getAvailableLanguages();

<select onChange={(e) => service.changeLanguage(e.target.value)}>
  {languages.map(lang => (
    <option key={lang} value={lang}>
      {service.getLanguageName(lang)}
    </option>
  ))}
</select>
```

## Need More?

- 📖 Full documentation: [README.md](./README.md)
- 🔧 Integration guide: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- 💡 Examples: [examples.ts](./examples.ts)
- 📋 Implementation details: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
