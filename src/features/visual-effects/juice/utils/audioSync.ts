/**
 * Audio-Visual Synchronization Utilities
 * 
 * Utilities for synchronizing visual effects with audio playback.
 * Accounts for audio latency to ensure effects feel responsive.
 * 
 * Requirements: 12.1-12.7
 */

import { AUDIO_SYNC_CONFIG } from '../config/juice.config';

/**
 * Measure audio latency using Web Audio API
 * 
 * @returns Audio latency in milliseconds
 */
export function measureAudioLatency(): number {
  try {
    // Try to get audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.warn('[AudioSync] Web Audio API not available, using default latency');
      return AUDIO_SYNC_CONFIG.defaultLatency;
    }
    
    // Get or create audio context
    const audioContext = new AudioContext();
    
    // Try to read output latency (most accurate)
    if (typeof audioContext.outputLatency === 'number') {
      const latency = audioContext.outputLatency * 1000; // Convert to ms
      return clampLatency(latency);
    }
    
    // Fallback to base latency
    if (typeof audioContext.baseLatency === 'number') {
      const latency = audioContext.baseLatency * 1000; // Convert to ms
      return clampLatency(latency);
    }
    
    // Final fallback
    console.warn('[AudioSync] Could not measure audio latency, using default');
    return AUDIO_SYNC_CONFIG.defaultLatency;
    
  } catch (error) {
    console.error('[AudioSync] Error measuring audio latency:', error);
    return AUDIO_SYNC_CONFIG.defaultLatency;
  }
}

/**
 * Clamp latency to reasonable range
 * 
 * @param latency Measured latency in milliseconds
 * @returns Clamped latency
 */
function clampLatency(latency: number): number {
  return Math.max(
    AUDIO_SYNC_CONFIG.minLatency,
    Math.min(AUDIO_SYNC_CONFIG.maxLatency, latency)
  );
}

/**
 * Calculate visual effect delay to synchronize with audio
 * 
 * @param audioPlaybackTime Audio playback time in milliseconds
 * @param audioLatency Audio latency in milliseconds
 * @returns Visual delay in milliseconds
 */
export function calculateSyncDelay(
  audioPlaybackTime: number,
  audioLatency: number
): number {
  // Visual effect should start slightly before audio to account for latency
  const visualDelay = audioPlaybackTime - audioLatency;
  
  // Ensure non-negative delay
  return Math.max(0, visualDelay);
}

/**
 * Handle muted audio case
 * When audio is muted, visual effects should continue without delay
 * 
 * @param audioMuted Whether audio is muted
 * @returns Visual delay (0 if muted, otherwise calculated)
 */
export function handleMutedAudio(audioMuted: boolean): number {
  if (audioMuted) {
    return 0; // No delay when muted
  }
  
  // Normal synchronization
  const audioLatency = measureAudioLatency();
  return audioLatency;
}

/**
 * Get synchronized timing for effect
 * 
 * @param effectType Type of effect ('dust', 'explosion', 'icy', 'gridPulse', 'ripple')
 * @param audioMuted Whether audio is muted
 * @returns Delay in milliseconds before triggering effect
 */
export function getSynchronizedTiming(
  effectType: 'dust' | 'explosion' | 'icy' | 'gridPulse' | 'ripple',
  audioMuted: boolean = false
): number {
  if (audioMuted) {
    return 0; // Immediate trigger when muted
  }
  
  // Measure audio latency
  const audioLatency = measureAudioLatency();
  
  // Different effects may have different timing requirements
  // For now, all effects use the same latency compensation
  return audioLatency;
}

/**
 * Shared timing source for audio and visual effects
 * Uses performance.now() for high-resolution timing
 * 
 * @returns Current time in milliseconds
 */
export function getSharedTimingSource(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  
  // Fallback to Date.now()
  return Date.now();
}
