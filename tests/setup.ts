import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

// Web Audio API mock
class MockAudioContext {
  destination = {};
  currentTime = 0;
  state = 'running';
  
  createOscillator = vi.fn().mockReturnValue({
    connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    type: 'sine',
  });
  
  createGain = vi.fn().mockReturnValue({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
  });
  
  createBufferSource = vi.fn().mockReturnValue({
    connect: vi.fn(), start: vi.fn(), buffer: null,
  });
  
  resume = vi.fn().mockResolvedValue(undefined);
}

(window as any).AudioContext = MockAudioContext;

// navigator.vibrate mock
Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });

// window.matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

afterEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// i18next configuration for tests
i18n
  .use(initReactI18next)
  .init({
    lng: 'tr',
    fallbackLng: 'tr',
    ns: ['translation'],
    defaultNS: 'translation',
    resources: {
      tr: {
        translation: {
          home: {
            play: 'OYNA',
            howToPlay: 'Nasıl Oynanır?',
            bestScore: 'En İyi Skor',
            games: 'Oyun',
            streak: 'Seri',
            dailyChallenge: 'Günlük Meydan Okuma',
            dailyNotPlayed: 'Bugün oynanmadı',
            map: 'Harita',
            allModes: 'Tüm Modlar',
            settings: 'Ayarlar',
          },
        },
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });
