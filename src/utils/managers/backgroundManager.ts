/**
 * Background Manager
 * 
 * Manages app behavior when going to background/foreground.
 * Pauses rendering and saves state to optimize battery and performance.
 * Requirements: 5.8
 */

export type AppVisibilityState = 'visible' | 'hidden';
export type VisibilityCallback = (state: AppVisibilityState) => void;

export interface BackgroundManagerConfig {
  pauseRendering?: boolean;
  pauseAudio?: boolean;
  saveState?: boolean;
  throttleUpdates?: boolean;
}

export class BackgroundManager {
  private isVisible: boolean = true;
  private callbacks: VisibilityCallback[] = [];
  private config: Required<BackgroundManagerConfig>;
  private visibilityChangeHandler: (() => void) | null = null;
  private blurHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  
  constructor(config: BackgroundManagerConfig = {}) {
    this.config = {
      pauseRendering: config.pauseRendering ?? true,
      pauseAudio: config.pauseAudio ?? true,
      saveState: config.saveState ?? true,
      throttleUpdates: config.throttleUpdates ?? true,
    };
    
    this.initialize();
  }
  
  /**
   * Initialize background detection
   */
  private initialize(): void {
    // Page Visibility API (primary method)
    this.visibilityChangeHandler = () => {
      const isHidden = document.hidden;
      this.handleVisibilityChange(isHidden ? 'hidden' : 'visible');
    };
    
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    
    // Window blur/focus (fallback for older browsers)
    this.blurHandler = () => {
      this.handleVisibilityChange('hidden');
    };
    
    this.focusHandler = () => {
      this.handleVisibilityChange('visible');
    };
    
    window.addEventListener('blur', this.blurHandler);
    window.addEventListener('focus', this.focusHandler);
    
    // Capacitor app state (for mobile)
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
          this.handleVisibilityChange(isActive ? 'visible' : 'hidden');
        });
      }).catch(err => {
        console.warn('[BackgroundManager] Capacitor App plugin not available:', err);
      });
    }
  }
  
  /**
   * Handle visibility change
   */
  private handleVisibilityChange(state: AppVisibilityState): void {
    const wasVisible = this.isVisible;
    this.isVisible = state === 'visible';
    
    // Only trigger if state actually changed
    if (wasVisible === this.isVisible) return;
    
    console.log(`[BackgroundManager] App ${state}`);
    
    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[BackgroundManager] Callback error:', error);
      }
    });
    
    // Apply automatic optimizations
    if (state === 'hidden') {
      this.onBackground();
    } else {
      this.onForeground();
    }
  }
  
  /**
   * Handle app going to background
   */
  private onBackground(): void {
    console.log('[BackgroundManager] Applying background optimizations');
    
    // Pause audio
    if (this.config.pauseAudio) {
      this.pauseAudio();
    }
    
    // Save state
    if (this.config.saveState) {
      this.saveAppState();
    }
    
    // Throttle updates
    if (this.config.throttleUpdates) {
      this.throttleBackgroundUpdates();
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app-background'));
  }
  
  /**
   * Handle app coming to foreground
   */
  private onForeground(): void {
    console.log('[BackgroundManager] Resuming from background');
    
    // Resume audio
    if (this.config.pauseAudio) {
      this.resumeAudio();
    }
    
    // Restore normal update rate
    if (this.config.throttleUpdates) {
      this.restoreNormalUpdates();
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app-foreground'));
  }
  
  /**
   * Pause audio playback
   */
  private pauseAudio(): void {
    // Pause all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.dataset.wasPlaying = 'true';
      }
    });
    
    // Pause Web Audio API contexts
    if (typeof window !== 'undefined' && (window as any).audioContext) {
      const ctx = (window as any).audioContext as AudioContext;
      if (ctx.state === 'running') {
        ctx.suspend();
      }
    }
  }
  
  /**
   * Resume audio playback
   */
  private resumeAudio(): void {
    // Resume audio elements that were playing
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (audio.dataset.wasPlaying === 'true') {
        audio.play().catch(err => {
          console.warn('[BackgroundManager] Failed to resume audio:', err);
        });
        delete audio.dataset.wasPlaying;
      }
    });
    
    // Resume Web Audio API contexts
    if (typeof window !== 'undefined' && (window as any).audioContext) {
      const ctx = (window as any).audioContext as AudioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    }
  }
  
  /**
   * Save app state to localStorage
   */
  private saveAppState(): void {
    try {
      const event = new CustomEvent('app-save-state');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('[BackgroundManager] Failed to save state:', error);
    }
  }
  
  /**
   * Throttle background updates
   */
  private throttleBackgroundUpdates(): void {
    // Reduce requestAnimationFrame rate when in background
    // This is handled by the browser automatically, but we can
    // add additional throttling for game loops
    window.dispatchEvent(new CustomEvent('throttle-updates', {
      detail: { throttle: true }
    }));
  }
  
  /**
   * Restore normal update rate
   */
  private restoreNormalUpdates(): void {
    window.dispatchEvent(new CustomEvent('throttle-updates', {
      detail: { throttle: false }
    }));
  }
  
  /**
   * Register a visibility callback
   * @param callback Function to call on visibility change
   */
  onVisibilityChange(callback: VisibilityCallback): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Check if app is currently visible
   */
  isAppVisible(): boolean {
    return this.isVisible;
  }
  
  /**
   * Get current visibility state
   */
  getVisibilityState(): AppVisibilityState {
    return this.isVisible ? 'visible' : 'hidden';
  }
  
  /**
   * Manually trigger background mode (for testing)
   */
  simulateBackground(): void {
    this.handleVisibilityChange('hidden');
  }
  
  /**
   * Manually trigger foreground mode (for testing)
   */
  simulateForeground(): void {
    this.handleVisibilityChange('visible');
  }
  
  /**
   * Cleanup and remove event listeners
   */
  dispose(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    
    if (this.blurHandler) {
      window.removeEventListener('blur', this.blurHandler);
    }
    
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
    }
    
    this.callbacks = [];
  }
}

// Global background manager instance
let globalBackgroundManager: BackgroundManager | null = null;

/**
 * Get or create the global background manager
 */
export function getBackgroundManager(): BackgroundManager {
  if (!globalBackgroundManager) {
    globalBackgroundManager = new BackgroundManager({
      pauseRendering: true,
      pauseAudio: true,
      saveState: true,
      throttleUpdates: true,
    });
  }
  return globalBackgroundManager;
}

/**
 * Initialize background manager with custom config
 */
export function initializeBackgroundManager(config?: BackgroundManagerConfig): BackgroundManager {
  if (globalBackgroundManager) {
    globalBackgroundManager.dispose();
  }
  globalBackgroundManager = new BackgroundManager(config);
  return globalBackgroundManager;
}

/**
 * Reset the global background manager
 */
export function resetBackgroundManager(): void {
  if (globalBackgroundManager) {
    globalBackgroundManager.dispose();
  }
  globalBackgroundManager = null;
}
