import { vi } from 'vitest';

// Mock Howl instance
export const mockHowlInstance = {
  play: vi.fn(() => 1), // Returns sound ID
  pause: vi.fn(),
  stop: vi.fn(),
  volume: vi.fn(),
  mute: vi.fn(),
  fade: vi.fn(),
  rate: vi.fn(),
  seek: vi.fn(),
  loop: vi.fn(),
  playing: vi.fn(() => false),
  duration: vi.fn(() => 0),
  state: vi.fn(() => 'loaded'),
  load: vi.fn(),
  unload: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
};

// Mock Howl constructor
export const mockHowl = vi.fn(() => mockHowlInstance);

// Mock Howler global
export const mockHowler = {
  volume: vi.fn(),
  mute: vi.fn(),
  stop: vi.fn(),
  unload: vi.fn(),
};

// Reset all mocks
export const resetAudioMocks = () => {
  mockHowlInstance.play.mockReset();
  mockHowlInstance.pause.mockReset();
  mockHowlInstance.stop.mockReset();
  mockHowlInstance.volume.mockReset();
  mockHowlInstance.mute.mockReset();
  mockHowlInstance.fade.mockReset();
  mockHowlInstance.rate.mockReset();
  mockHowlInstance.seek.mockReset();
  mockHowlInstance.loop.mockReset();
  mockHowlInstance.playing.mockReset();
  mockHowlInstance.duration.mockReset();
  mockHowlInstance.state.mockReset();
  mockHowlInstance.load.mockReset();
  mockHowlInstance.unload.mockReset();
  mockHowlInstance.on.mockReset();
  mockHowlInstance.once.mockReset();
  mockHowlInstance.off.mockReset();
  mockHowl.mockReset();
  mockHowler.volume.mockReset();
  mockHowler.mute.mockReset();
  mockHowler.stop.mockReset();
  mockHowler.unload.mockReset();
};
