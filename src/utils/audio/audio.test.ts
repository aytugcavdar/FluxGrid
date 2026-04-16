import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { playCombo, unlockAudio } from './audio';

// Mock Web Audio API
let mockOscillatorCalls: any[] = [];
let mockGainCalls: any[] = [];

const createMockOscillator = () => ({
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  frequency: {
    setValueAtTime: vi.fn(),
  },
  type: 'sine',
});

const createMockGain = () => ({
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
});

class MockAudioContext {
  destination = {};
  currentTime = 0;
  state = 'running';
  
  createOscillator() {
    const osc = createMockOscillator();
    mockOscillatorCalls.push(osc);
    return osc;
  }
  
  createGain() {
    const gain = createMockGain();
    mockGainCalls.push(gain);
    return gain;
  }
  
  createBuffer() {
    return {};
  }
  
  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
    };
  }
  
  resume() {
    return Promise.resolve();
  }
}

describe('playCombo', () => {
  beforeEach(() => {
    // Reset call tracking
    mockOscillatorCalls = [];
    mockGainCalls = [];
    
    // Mock AudioContext
    (globalThis as any).AudioContext = MockAudioContext;
    (globalThis as any).webkitAudioContext = MockAudioContext;
    
    // Clear localStorage
    localStorage.clear();
    
    // Unlock audio
    unlockAudio();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should play 5 notes for combo level 5', () => {
    playCombo(5);
    
    // Should create 5 oscillators (one per note)
    expect(mockOscillatorCalls).toHaveLength(5);
    expect(mockGainCalls).toHaveLength(5);
  });

  it('should play 7 notes for combo level 10', () => {
    playCombo(10);
    
    // Should create 7 oscillators (one per note)
    expect(mockOscillatorCalls).toHaveLength(7);
    expect(mockGainCalls).toHaveLength(7);
  });

  it('should play 7 notes for combo level greater than 10', () => {
    playCombo(15);
    
    // Should create 7 oscillators (one per note)
    expect(mockOscillatorCalls).toHaveLength(7);
    expect(mockGainCalls).toHaveLength(7);
  });

  it('should play up to 5 notes for combo levels less than 5', () => {
    playCombo(3);
    
    // Should create 3 oscillators (one per note)
    expect(mockOscillatorCalls).toHaveLength(3);
    expect(mockGainCalls).toHaveLength(3);
  });

  it('should use pentatonic scale frequencies', () => {
    const PENTATONIC_SCALE = [
      261.63,  // C4
      293.66,  // D4
      329.63,  // E4
      392.00,  // G4
      440.00,  // A4
      523.25,  // C5
      587.33,  // D5
      659.25,  // E5
      783.99,  // G5
      880.00,  // A5
    ];

    playCombo(5);
    
    // Check that frequencies are from the pentatonic scale
    mockOscillatorCalls.forEach((osc) => {
      const frequencyCalls = osc.frequency.setValueAtTime.mock.calls;
      expect(frequencyCalls.length).toBeGreaterThan(0);
      
      frequencyCalls.forEach((call: any[]) => {
        const frequency = call[0];
        expect(PENTATONIC_SCALE).toContain(frequency);
      });
    });
  });

  it('should not play when audio is muted', () => {
    localStorage.setItem('flux_muted', 'true');
    
    playCombo(5);
    
    // Should not create any oscillators when muted
    expect(mockOscillatorCalls).toHaveLength(0);
    expect(mockGainCalls).toHaveLength(0);
  });

  it('should stagger notes with 60ms timing', () => {
    playCombo(3);
    
    // Check that oscillators start at staggered times
    expect(mockOscillatorCalls).toHaveLength(3);
    
    // Each note should start 0.06 seconds (60ms) after the previous one
    const startCalls = mockOscillatorCalls.map(osc => osc.start.mock.calls[0][0]);
    expect(startCalls[0]).toBeCloseTo(0.0, 2);
    expect(startCalls[1]).toBeCloseTo(0.06, 2);
    expect(startCalls[2]).toBeCloseTo(0.12, 2);
  });

  it('should connect oscillator to gain and gain to destination', () => {
    playCombo(2);
    
    // Each oscillator should connect to its gain node
    expect(mockOscillatorCalls).toHaveLength(2);
    expect(mockGainCalls).toHaveLength(2);
    
    mockOscillatorCalls.forEach((osc, index) => {
      expect(osc.connect).toHaveBeenCalledWith(mockGainCalls[index]);
    });
    
    // Each gain node should connect to destination
    mockGainCalls.forEach((gain) => {
      expect(gain.connect).toHaveBeenCalled();
    });
  });
});
