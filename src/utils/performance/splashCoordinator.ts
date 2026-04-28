export interface SplashState {
  nativeDismissed: boolean;
  webVisible: boolean;
  assetsLoaded: boolean;
  babylonReady: boolean;
  completeCalled: boolean;
  loadingProgress: number; // 0-100
}

export interface SplashCoordinator {
  initialize(): void;
  reportAssetProgress(loaded: number, total: number): void;
  reportBabylonReady(): void;
  dismissWebSplash(): void;
  getSplashState(): SplashState;
}

/**
 * Detect device performance tier on first launch
 * This runs during splash screen to set optimal quality before game starts
 */
function detectAndSaveDeviceQuality(): void {
  const STORAGE_KEY = 'flux_performance_v1';
  
  console.log('[SplashCoordinator] detectAndSaveDeviceQuality called');
  
  // Detect device capabilities
  const cores = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const ua = navigator.userAgent.toLowerCase();
  
  console.log('[SplashCoordinator] Device info:', { cores, deviceMemory, ua: ua.substring(0, 100) });
  
  // Show device info in alert for debugging
  alert(`Device: cores=${cores}, RAM=${deviceMemory}GB, UA=${ua.substring(0, 80)}`);
  
  let qualityPreset: 'low' | 'medium' | 'high' = 'medium';
  let deviceClassification = 'medium';
  
  // PRIORITY 1: Check User Agent for known weak devices (most reliable)
  const isKnownWeakDevice = 
    ua.includes('sm-j') ||      // Samsung J series (budget)
    ua.includes('sm-a') ||      // Samsung A series (budget)
    ua.includes('sm-g5') ||     // Samsung G5xx series (GM510, etc.)
    ua.includes('sm-g6') ||     // Samsung G6xx series
    ua.includes('sm-g7') ||     // Samsung G7xx series
    ua.includes('redmi') ||     // Xiaomi Redmi (budget)
    ua.includes('poco') ||      // Xiaomi Poco (budget)
    ua.includes('moto e') ||    // Motorola E (budget)
    ua.includes('moto g') ||    // Motorola G (budget)
    ua.includes('android 6') || // Old Android
    ua.includes('android 7') ||
    ua.includes('android 8') ||
    ua.includes('android 9');
  
  // PRIORITY 2: Check RAM (4GB or less = weak for games)
  const hasLowRAM = deviceMemory <= 4;
  
  // PRIORITY 3: Strong device indicators - VERY STRICT
  const isStrongDevice = 
    cores >= 8 && 
    deviceMemory >= 8 &&  // Need 8+ cores AND 8GB+ RAM
    !isKnownWeakDevice;   // AND not in weak device list
  
  // Combine checks: Known weak device OR low RAM = weak
  const isWeakDevice = isKnownWeakDevice || hasLowRAM;
  
  if (isWeakDevice) {
    qualityPreset = 'low';
    deviceClassification = 'low';
    console.log('[SplashCoordinator] Weak device detected:', { cores, deviceMemory });
    alert(`WEAK DEVICE! Quality: LOW`);
  } else if (isStrongDevice) {
    qualityPreset = 'high';
    deviceClassification = 'high';
    console.log('[SplashCoordinator] Strong device detected:', { cores, deviceMemory });
    alert(`Strong device! Quality: HIGH`);
  } else {
    qualityPreset = 'medium';
    deviceClassification = 'medium';
    console.log('[SplashCoordinator] Medium device detected:', { cores, deviceMemory });
    alert(`Medium device! Quality: MEDIUM`);
  }
  
  // Save to localStorage
  try {
    const data = {
      version: 1,
      deviceClassification,
      qualityPreset,
      customSettings: {},
      autoAdjust: false,
      reducedMotion: false,
      lastUpdated: Date.now(),
      detectedOnFirstLaunch: true,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log(`[SplashCoordinator] Initial quality set to: ${qualityPreset}`);
  } catch (error) {
    console.error('[SplashCoordinator] Failed to save quality settings:', error);
  }
}

class SplashCoordinatorImpl implements SplashCoordinator {
  private state: SplashState = {
    nativeDismissed: true, // Native splash dismisses immediately (launchShowDuration: 0)
    webVisible: true,
    assetsLoaded: false,
    babylonReady: false,
    completeCalled: false,
    loadingProgress: 0,
  };

  initialize(): void {
    console.log('[SplashCoordinator] Initialized');
    this.state.webVisible = true;
    this.state.completeCalled = false;
    
    // Detect and save device quality on first launch
    detectAndSaveDeviceQuality();
  }

  reportAssetProgress(loaded: number, total: number): void {
    if (total === 0) {
      this.state.loadingProgress = 0;
      return;
    }

    this.state.loadingProgress = Math.floor((loaded / total) * 100);
    console.log(`[SplashCoordinator] Asset progress: ${loaded}/${total} (${this.state.loadingProgress}%)`);

    if (loaded >= total) {
      this.state.assetsLoaded = true;
      this.checkAndDismiss();
    }
  }

  reportBabylonReady(): void {
    console.log('[SplashCoordinator] Babylon.js engine ready');
    this.state.babylonReady = true;
    this.checkAndDismiss();
  }

  dismissWebSplash(): void {
    console.log('[SplashCoordinator] dismissWebSplash called, completeCalled:', this.state.completeCalled);
    
    if (this.state.completeCalled) {
      console.warn('[SplashCoordinator] splashComplete already called, skipping');
      return;
    }

    console.log('[SplashCoordinator] Dismissing web splash');
    this.state.webVisible = false;
    this.state.completeCalled = true;

    // Call window.splashComplete() exactly once
    if (typeof (window as any).splashComplete === 'function') {
      console.log('[SplashCoordinator] Calling window.splashComplete()');
      (window as any).splashComplete();
      delete (window as any).splashComplete; // Prevent future calls
      console.log('[SplashCoordinator] window.splashComplete() called and deleted');
    } else {
      console.warn('[SplashCoordinator] window.splashComplete is not a function');
    }
  }

  getSplashState(): SplashState {
    return { ...this.state };
  }

  private checkAndDismiss(): void {
    // Only dismiss when both Babylon.js is ready AND assets are loaded
    if (this.state.babylonReady && this.state.assetsLoaded && !this.state.completeCalled) {
      this.dismissWebSplash();
    }
  }
}

// Singleton instance
let coordinatorInstance: SplashCoordinator | null = null;

export function createSplashCoordinator(): SplashCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new SplashCoordinatorImpl();
  }
  return coordinatorInstance;
}

// Export singleton getter
export function getSplashCoordinator(): SplashCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new SplashCoordinatorImpl();
  }
  return coordinatorInstance;
}
