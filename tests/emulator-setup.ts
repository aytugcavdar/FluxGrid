import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

afterEach(() => {
  localStorageMock.clear();
});

// NOTE: We do NOT mock Firebase modules here because we want to use the real SDK
// to connect to the Firebase Emulator
