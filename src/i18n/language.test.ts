import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  normalizeSupportedLanguage,
  resolveInitialLanguage,
} from './language';

describe('language resolution', () => {
  it('normalizes supported regional language codes', () => {
    expect(normalizeSupportedLanguage('en-US')).toBe('en');
    expect(normalizeSupportedLanguage('TR-tr')).toBe('tr');
  });

  it('keeps the saved user choice ahead of the device language', () => {
    expect(resolveInitialLanguage('en', ['tr-TR'])).toBe('en');
  });

  it('uses the first supported device language on first launch', () => {
    expect(resolveInitialLanguage(null, ['it-IT', 'tr-TR', 'en-US'])).toBe('tr');
  });

  it('falls back to English for unsupported device languages', () => {
    expect(resolveInitialLanguage(null, ['it-IT', 'ja-JP'])).toBe(DEFAULT_LANGUAGE);
  });
});
