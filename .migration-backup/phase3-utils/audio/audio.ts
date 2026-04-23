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

import { Haptics, ImpactStyle } from '@capacitor/haptics';

type HapticPattern = 'hover' | 'place' | 'clear' | 'clear_single' | 'clear_multi' | 'combo' | 'combo_milestone' | 'surge' | 'game_over' | 'skill';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  hover: 4,
  place: [15, 5, 15],
  clear: [20, 10, 20],
  clear_single: [30, 20, 60],
  clear_multi: [50, 30, 100, 30, 150],
  combo: [30, 20, 60, 20, 80],
  combo_milestone: [30, 20, 60, 20, 80, 20, 120],
  surge: [100, 50, 100],
  game_over: [200, 100, 200, 100, 300],
  skill: [80, 50, 80]
};

/** Map haptic patterns to Capacitor ImpactStyle with Android API level adaptation */
const mapPatternToImpactStyle = async (pattern: HapticPattern): Promise<ImpactStyle> => {
  // For Android, use Medium instead of Heavy for better compatibility
  // Heavy impact requires API 29+ and may not work on all devices
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  switch (pattern) {
    case 'surge':
    case 'game_over':
    case 'skill':
      // Use Medium on Android for better compatibility, Heavy on iOS
      return isAndroid ? ImpactStyle.Medium : ImpactStyle.Heavy;
    case 'clear_multi':
    case 'combo_milestone':
    case 'clear':
      return ImpactStyle.Medium;
    default:
      return ImpactStyle.Light;
  }
};

/** Centralized haptic feedback with Capacitor Haptics and web fallback */
export const playHaptic = async (pattern: HapticPattern): Promise<void> => {
  // Check if native Capacitor platform
  const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
  
  try {
    if (isNative) {
      // Use Capacitor Haptics on native platform
      const style = await mapPatternToImpactStyle(pattern);
      await Haptics.impact({ style });
    } else {
      // Fallback to web vibration API
      if (navigator.vibrate) {
        const vibrationPattern = HAPTIC_PATTERNS[pattern];
        navigator.vibrate(vibrationPattern);
      }
    }
  } catch (e) {
    // Silently fail if haptics not available
  }
};
