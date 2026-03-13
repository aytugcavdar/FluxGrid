import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

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
