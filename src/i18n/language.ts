export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const LANGUAGE_STORAGE_KEY = 'flux_language';

export function normalizeSupportedLanguage(
  value: string | null | undefined
): SupportedLanguage | null {
  if (!value) return null;

  const normalized = value.toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)
    ? normalized as SupportedLanguage
    : null;
}

export function resolveInitialLanguage(
  savedLanguage: string | null | undefined,
  deviceLanguages: readonly string[]
): SupportedLanguage {
  const saved = normalizeSupportedLanguage(savedLanguage);
  if (saved) return saved;

  for (const language of deviceLanguages) {
    const supported = normalizeSupportedLanguage(language);
    if (supported) return supported;
  }

  return DEFAULT_LANGUAGE;
}

export function getDeviceLanguages(): string[] {
  if (typeof navigator === 'undefined') return [];

  const languages = Array.isArray(navigator.languages)
    ? [...navigator.languages]
    : [];

  if (navigator.language && !languages.includes(navigator.language)) {
    languages.push(navigator.language);
  }

  return languages;
}

export function getDeviceLanguage(): SupportedLanguage {
  return resolveInitialLanguage(null, getDeviceLanguages());
}

export function getInitialLanguage(): SupportedLanguage {
  let savedLanguage: string | null = null;

  try {
    if (typeof localStorage !== 'undefined') {
      savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }

  return resolveInitialLanguage(savedLanguage, getDeviceLanguages());
}
