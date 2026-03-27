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

/** Short thud for piece placement */
export const playPlace = () => {
  if (isMuted()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

/** Swoosh for line clear */
export const playClear = (lines: number = 1) => {
  if (isMuted()) return;
  const ctx = getCtx();
  
  const baseFreq = 400 + (lines * 100);
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
};

/** Escalating tone for combo */
export const playCombo = (level: number) => {
  if (isMuted()) return;
  const ctx = getCtx();

  for (let i = 0; i < Math.min(level, 5); i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const freq = 500 + (i * 150);
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

type HapticPattern = 'hover' | 'place' | 'clear' | 'clear_multi' | 'combo' | 'surge' | 'game_over' | 'skill';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  hover: 4,
  place: 15,
  clear: [20, 10, 20],
  clear_multi: [50, 30, 50, 30, 100],
  combo: [30, 20, 30, 20, 50],
  surge: [100, 50, 100],
  game_over: [200, 100, 200, 100, 300],
  skill: [80, 50, 80]
};

/** Centralized haptic feedback with pattern table */
export const playHaptic = (pattern: HapticPattern): void => {
  if (!navigator.vibrate) return;
  
  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  } catch (e) {
    // Ignore if vibration not allowed
  }
};
