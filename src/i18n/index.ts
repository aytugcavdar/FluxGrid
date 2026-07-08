import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './locales/tr.json';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

const SUPPORTED_LANGUAGES = ['tr', 'en', 'de', 'fr', 'es'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

function normalizeLanguage(value: string | null | undefined): SupportedLanguage {
  const normalized = (value || 'tr').toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)
    ? normalized as SupportedLanguage
    : 'tr';
}

const savedLang = normalizeLanguage(
  typeof localStorage !== 'undefined' ? localStorage.getItem('flux_language') : null
);

// Initialize i18n synchronously to prevent React Hooks order issues
i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
    },
    lng: savedLang,
    fallbackLng: 'en', // Changed to EN as per requirements
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    cleanCode: true,
    interpolation: { 
      escapeValue: false 
    },
    react: {
      useSuspense: false // Disable Suspense to ensure synchronous initialization
    }
  });

if (typeof window !== 'undefined') {
  (window as any).i18n = i18n;
}

export default i18n;
