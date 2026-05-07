/**
 * FluxGrid Sound Effects — Web Audio API
 * Lightweight synthesized sounds, no external files needed.
 */

let audioCtx: AudioContext | null = null;
let unlocked = false;

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

/** Must be called on first user gesture (pointerdown) to unlock mobile audio */
export const unlockAudio = () => {
  if (unlocked) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  // Play a silent buffer to unlock
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
  unlocked = true;
};

const isMuted = (): boolean => {
  try {
    return localStorage.getItem('flux_muted') === 'true';
  } catch {
    return false;
  }
};

export const toggleMute = (): boolean => {
  const newVal = !isMuted();
  try { localStorage.setItem('flux_muted', String(newVal)); } catch {}
  return newVal;
};

export const getMuted = (): boolean => isMuted();

// ─── Sound Effects ───

/** Short thud for piece placement with low pulse and high bounce */
export const playPlace = () => {
  if (isMuted()) return;
  const ctx = getCtx();
  
  // Low frequency pulse (180Hz → 80Hz)
  const oscLow = ctx.createOscillator();
  const gainLow = ctx.createGain();
  oscLow.connect(gainLow);
  gainLow.connect(ctx.destination);

  oscLow.type = 'sine';
  oscLow.frequency.setValueAtTime(180, ctx.currentTime);
  oscLow.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
  gainLow.gain.setValueAtTime(0.15, ctx.currentTime);
  gainLow.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  oscLow.start(ctx.currentTime);
  oscLow.stop(ctx.currentTime + 0.1);

  // High pitch bounce (400Hz spike)
  const oscHigh = ctx.createOscillator();
  const gainHigh = ctx.createGain();
  oscHigh.connect(gainHigh);
  gainHigh.connect(ctx.destination);

  oscHigh.type = 'sine';
  oscHigh.frequency.setValueAtTime(400, ctx.currentTime + 0.05);
  gainHigh.gain.setValueAtTime(0.08, ctx.currentTime + 0.05);
  gainHigh.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  oscHigh.start(ctx.currentTime + 0.05);
  oscHigh.stop(ctx.currentTime + 0.1);
};

/** Three-part sound for line clear: sweep up, crystal ping, bass drop */
export const playClear = (lines: number = 1) => {
  if (isMuted()) return;
  const ctx = getCtx();
  
  // Part 1: Frequency sweep (400Hz → 800Hz)
  const oscSweep = ctx.createOscillator();
  const gainSweep = ctx.createGain();
  oscSweep.connect(gainSweep);
  gainSweep.connect(ctx.destination);

  oscSweep.type = 'triangle';
  oscSweep.frequency.setValueAtTime(400, ctx.currentTime);
  oscSweep.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  gainSweep.gain.setValueAtTime(0.12, ctx.currentTime);
  gainSweep.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  oscSweep.start(ctx.currentTime);
  oscSweep.stop(ctx.currentTime + 0.2);

  // Part 2: Crystal ping (1200Hz)
  const oscPing = ctx.createOscillator();
  const gainPing = ctx.createGain();
  oscPing.connect(gainPing);
  gainPing.connect(ctx.destination);

  oscPing.type = 'sine';
  oscPing.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
  gainPing.gain.setValueAtTime(0.1, ctx.currentTime + 0.1);
  gainPing.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  oscPing.start(ctx.currentTime + 0.1);
  oscPing.stop(ctx.currentTime + 0.25);

  // Part 3: Bass drop (200Hz → 100Hz)
  const oscBass = ctx.createOscillator();
  const gainBass = ctx.createGain();
  oscBass.connect(gainBass);
  gainBass.connect(ctx.destination);

  oscBass.type = 'sine';
  oscBass.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
  oscBass.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
  gainBass.gain.setValueAtTime(0.15, ctx.currentTime + 0.2);
  gainBass.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

  oscBass.start(ctx.currentTime + 0.2);
  oscBass.stop(ctx.currentTime + 0.45);
};

// Pentatonic Scale (C Major Pentatonic) for pleasant-sounding melodies
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

/** Escalating tone for combo using pentatonic scale */
export const playCombo = (level: number) => {
  if (isMuted()) return;
  const ctx = getCtx();

  // Determine number of notes based on combo level
  let noteCount: number;
  if (level >= 10) {
    noteCount = 7;  // High combo: 7 notes
  } else if (level >= 5) {
    noteCount = 5;  // Medium combo: 5 notes
  } else {
    noteCount = Math.min(level, 5);  // Low combo: up to 5 notes
  }

  // Play melody using pentatonic scale
  for (let i = 0; i < noteCount; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    // Use pentatonic scale frequencies, wrapping around if needed
    const freq = PENTATONIC_SCALE[i % PENTATONIC_SCALE.length];
    const t = ctx.currentTime + (i * 0.06);
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.start(t);
    osc.stop(t + 0.12);
  }
};

/** Descending notes for game over */
export const playGameOver = () => {
  if (isMuted()) return;
  const ctx = getCtx();
  const notes = [400, 350, 280, 200, 150];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    const t = ctx.currentTime + (i * 0.15);
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  });
};

/** Skill activation sound */
export const playSkill = () => {
  if (isMuted()) return;
  const ctx = getCtx();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
};

/** Button click feedback */
export const playClick = () => {
  if (isMuted()) return;
  const ctx = getCtx();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.04);
};

/** Surge Mode activation sound (Energetic ramp up) */
export const playSurgeStart = () => {
  if (isMuted()) return;
  const ctx = getCtx();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'square';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
};

/** Surge Mode deactivation sound (Power down) */
export const playSurgeEnd = () => {
  if (isMuted()) return;
  const ctx = getCtx();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
};

/** Timer tick sound for last 10 seconds (TIMED/BLITZ modes) */
export const playTick = () => {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'square';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
};

/** CHRONO bonus sound - bright ping for time addition */
export const playChronoBonus = () => {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
};

// ─── Haptic Feedback ───

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticPattern =
  | 'hover'           // very light, drag hover on grid
  | 'place'           // block placed
  | 'clear_single'    // 1 line cleared
  | 'clear_multi'     // 2+ lines cleared (more intense)
  | 'combo'           // combo increment
  | 'combo_milestone' // 5x / 10x / 15x milestone
  | 'surge'           // surge mode activated
  | 'game_over'       // game ended
  | 'skill'           // skill used
  | 'achievement'     // achievement unlocked
  | 'success';        // generic success

// Web Vibration API fallback patterns (ms on/off alternating)
const WEB_PATTERNS: Record<HapticPattern, number | number[]> = {
  hover:           4,
  place:           [12, 8, 18],
  clear_single:    [30, 15, 50],
  clear_multi:     [40, 20, 80, 20, 120],
  combo:           [20, 10, 40],
  combo_milestone: [30, 15, 60, 15, 100, 15, 140],
  surge:           [80, 40, 80, 40, 120],
  game_over:       [100, 60, 180, 60, 250],
  skill:           [50, 30, 80],
  achievement:     [20, 10, 20, 10, 80, 40, 120],
  success:         [30, 20, 60],
};

// Helper: sequential Capacitor impacts to simulate patterns
const nativePattern = async (
  impacts: Array<{ style: ImpactStyle; delay?: number }>
): Promise<void> => {
  for (const { style, delay = 0 } of impacts) {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    await Haptics.impact({ style });
  }
};

const L = ImpactStyle.Light;
const M = ImpactStyle.Medium;
const H = ImpactStyle.Heavy;

// Native Capacitor pattern definitions
const NATIVE_PATTERNS: Record<HapticPattern, Array<{ style: ImpactStyle; delay?: number }>> = {
  hover:           [{ style: L }],
  place:           [{ style: L }, { style: M, delay: 40 }],
  clear_single:    [{ style: M }, { style: H, delay: 60 }],
  clear_multi:     [{ style: M }, { style: H, delay: 50 }, { style: H, delay: 80 }],
  combo:           [{ style: L }, { style: M, delay: 50 }],
  combo_milestone: [{ style: M }, { style: H, delay: 60 }, { style: H, delay: 80 }],
  surge:           [{ style: H }, { style: H, delay: 100 }, { style: H, delay: 100 }],
  game_over:       [{ style: H }, { style: M, delay: 120 }, { style: H, delay: 180 }],
  skill:           [{ style: M }, { style: H, delay: 80 }],
  achievement:     [{ style: L }, { style: L, delay: 60 }, { style: H, delay: 80 }],
  success:         [{ style: M }, { style: H, delay: 100 }],
};

/** Centralized haptic feedback — Capacitor native or web vibration fallback */
export const playHaptic = async (pattern: HapticPattern): Promise<void> => {
  const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

  try {
    if (isNative) {
      await nativePattern(NATIVE_PATTERNS[pattern]);
    } else if (navigator.vibrate) {
      navigator.vibrate(WEB_PATTERNS[pattern]);
    }
  } catch {
    // Silently fail — haptics are non-critical
  }
};
