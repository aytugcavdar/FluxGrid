import * as BABYLON from 'babylonjs';
import { ParticleEmitter } from '../particles/ParticleEmitter';
import { HapticManager } from '../../../utils/haptics';

/**
 * PerfectClearCelebration - Handles perfect clear celebration
 * 
 * Requirements: 7.1-7.8
 * 
 * Effects:
 * - Full-screen white flash (0.6 → 0.0 opacity, 400ms)
 * - 100 confetti particles with rainbow colors
 * - "PERFECT CLEAR!" text animation (0.5x → 1.5x, 600ms)
 * - Celebration haptic pattern
 * - Triumphant sound effect
 * - Input unblock after 400ms
 */

const RAINBOW_COLORS = [
  new BABYLON.Color3(0.94, 0.27, 0.27), // Red
  new BABYLON.Color3(0.94, 0.62, 0.04), // Orange
  new BABYLON.Color3(0.06, 0.73, 0.51), // Green
  new BABYLON.Color3(0.23, 0.51, 0.96), // Blue
  new BABYLON.Color3(0.66, 0.55, 0.98), // Purple
  new BABYLON.Color3(0.93, 0.28, 0.60)  // Pink
];

export class PerfectClearCelebration {
  private particleEmitter: ParticleEmitter;
  private hapticManager: HapticManager;
  private prefersReducedMotion: boolean = false;
  private qualityPreset: 'high' | 'medium' | 'low' = 'high';
  public allowInput: boolean = true;
  
  constructor(
    particleEmitter: ParticleEmitter,
    hapticManager: HapticManager
  ) {
    this.particleEmitter = particleEmitter;
    this.hapticManager = hapticManager;
  }
  
  /**
   * Trigger perfect clear celebration
   * Requirements: 7.1-7.8
   */
  trigger(): void {
    // Block input for 400ms
    this.allowInput = false;
    
    if (this.prefersReducedMotion) {
      // Reduced motion: only show text
      this.showPerfectClearText(true);
    } else {
      // Full celebration
      // 1. Screen flash
      this.triggerFullScreenFlash();
      
      // 2. Confetti
      this.emitConfetti();
      
      // 3. Text animation
      this.showPerfectClearText(false);
    }
    
    // 4. Haptic
    this.hapticManager.play('perfect_clear');
    
    // 5. Audio (handled by caller - audio.ts playGameOver or new sound)
    
    // 6. Unblock input after 400ms
    setTimeout(() => {
      this.allowInput = true;
    }, 400);
  }
  
  /**
   * Trigger full-screen white flash
   * Requirements: 7.1
   */
  private triggerFullScreenFlash(): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      opacity: 0.6;
      pointer-events: none;
      z-index: 9999;
      transition: opacity 400ms ease-out;
    `;
    
    document.body.appendChild(overlay);
    
    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
      }, 400);
    });
  }
  
  /**
   * Emit confetti particles
   * Requirements: 7.2
   */
  private emitConfetti(): void {
    // Adjust count based on quality
    let count = 100;
    if (this.qualityPreset === 'medium') {
      count = 60;
    } else if (this.qualityPreset === 'low') {
      count = 40;
    }
    
    this.particleEmitter.emitCelebration(count, RAINBOW_COLORS);
  }
  
  /**
   * Show "PERFECT CLEAR!" text animation
   * Requirements: 7.3
   */
  private showPerfectClearText(reducedMotion: boolean): void {
    const textElement = document.createElement('div');
    textElement.id = 'perfect-clear-text';
    textElement.innerHTML = 'PERFECT CLEAR!';
    textElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 64px;
      font-weight: bold;
      color: white;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.5);
      z-index: 10000;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    document.body.appendChild(textElement);
    
    if (reducedMotion) {
      // Simple fade-in/fade-out
      // Requirements: 7.7
      textElement.animate([
        { opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { opacity: 1, offset: 0.8 },
        { opacity: 0 }
      ], {
        duration: 800,
        easing: 'ease-out'
      }).onfinish = () => textElement.remove();
    } else {
      // Full animation: scale from 0.5x to 1.5x
      // Requirements: 7.3, 7.6
      textElement.animate([
        { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 1, offset: 0.3 },
        { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 1, offset: 0.7 },
        { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 }
      ], {
        duration: 2000,
        easing: 'ease-out'
      }).onfinish = () => textElement.remove();
    }
  }
  
  /**
   * Set reduced motion preference
   * Requirements: 7.7
   */
  setReducedMotion(enabled: boolean): void {
    this.prefersReducedMotion = enabled;
  }
  
  /**
   * Set quality preset
   */
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void {
    this.qualityPreset = preset;
  }
}
