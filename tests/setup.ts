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

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Return unsubscribe function
    return vi.fn();
  }),
  signInAnonymously: vi.fn(() => Promise.resolve({ user: { uid: 'test-uid', isAnonymous: true } })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  linkWithCredential: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  updateDoc: vi.fn(() => Promise.resolve()),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [], size: 0 })),
  serverTimestamp: vi.fn(() => Date.now()),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => vi.fn(() => Promise.resolve({ data: {} }))),
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(() => null),
  getToken: vi.fn(() => Promise.resolve('mock-token')),
  onMessage: vi.fn(),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(() => ({})),
  trace: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    putAttribute: vi.fn(),
    putMetric: vi.fn(),
  })),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),
}));

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
