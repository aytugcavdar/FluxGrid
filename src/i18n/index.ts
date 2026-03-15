import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './locales/tr.json';
import en from './locales/en.json';

const savedLang = localStorage.getItem('flux_language') ?? 'tr';

// Initialize i18n synchronously to prevent React Hooks order issues
i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'tr',
    interpolation: { 
      escapeValue: false 
    },
    react: {
      useSuspense: false // Disable Suspense to ensure synchronous initialization
    }
  });

export default i18n;
