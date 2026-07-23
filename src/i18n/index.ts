import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './locales/tr.json';
import en from './locales/en.json';
import {
  DEFAULT_LANGUAGE,
  getInitialLanguage,
  normalizeSupportedLanguage,
  SUPPORTED_LANGUAGES,
} from './language';

const initialLanguage = getInitialLanguage();

// Initialize i18n synchronously to prevent React Hooks order issues
i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
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

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
  i18n.on('languageChanged', language => {
    document.documentElement.lang = normalizeSupportedLanguage(language) ?? DEFAULT_LANGUAGE;
  });
}

export default i18n;
