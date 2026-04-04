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
    if (this.state.completeCalled) {
      console.warn('[SplashCoordinator] splashComplete already called, skipping');
      return;
    }

    console.log('[SplashCoordinator] Dismissing web splash');
    this.state.webVisible = false;
    this.state.completeCalled = true;

    // Call window.splashComplete() exactly once
    if (typeof (window as any).splashComplete === 'function') {
      (window as any).splashComplete();
      delete (window as any).splashComplete; // Prevent future calls
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
