import { PerformanceMetrics, OptimizationSettings } from '../types';
import { PERFORMANCE_SETTINGS } from '../constants';

class MobileOptimizer {
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    drawCalls: 0
  };

  private settings: OptimizationSettings = {
    particleLimit: PERFORMANCE_SETTINGS.MOBILE_PARTICLE_LIMIT,
    shadowQuality: 'MEDIUM',
    textureQuality: 'MEDIUM',
    antialiasing: true,
    bloomEffect: true
  };

  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsHistory: number[] = [];
  private particlePool: any[] = [];
  private isLowPerformanceMode = false;

  constructor() {
    this.detectDeviceCapabilities();
    this.startMonitoring();
  }

  private detectDeviceCapabilities() {
    // Detect if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      this.settings.particleLimit = PERFORMANCE_SETTINGS.MOBILE_PARTICLE_LIMIT;
      this.settings.shadowQuality = 'LOW';
      this.settings.textureQuality = 'MEDIUM';
    } else {
      this.settings.particleLimit = PERFORMANCE_SETTINGS.DESKTOP_PARTICLE_LIMIT;
      this.settings.shadowQuality = 'HIGH';
      this.settings.textureQuality = 'HIGH';
    }

    // Check for low-end devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      this.applyLowPerformanceMode();
    }
  }

  private startMonitoring() {
    this.monitorFrame();
    
    // Monitor memory if available
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          
          if (this.metrics.memoryUsage > PERFORMANCE_SETTINGS.MEMORY_CRITICAL_THRESHOLD) {
            this.handleMemoryPressure();
          }
        }
      }, 5000);
    }
  }

  private monitorFrame() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Calculate FPS
    const fps = 1000 / delta;
    this.metrics.fps = fps;
    this.metrics.frameTime = delta;

    // Track FPS history
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    // Check for performance issues
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    if (avgFps < PERFORMANCE_SETTINGS.MIN_FPS && !this.isLowPerformanceMode) {
      this.applyLowPerformanceMode();
    }

    requestAnimationFrame(() => this.monitorFrame());
  }

  private applyLowPerformanceMode() {
    this.isLowPerformanceMode = true;
    
    this.settings.particleLimit = Math.floor(this.settings.particleLimit * 0.5);
    this.settings.shadowQuality = 'OFF';
    this.settings.textureQuality = 'LOW';
    this.settings.antialiasing = false;
    this.settings.bloomEffect = false;

    console.log('Low performance mode activated');
  }

  private handleMemoryPressure() {
    // Clear particle pool
    this.particlePool = [];
    
    // Trigger garbage collection hint (if available)
    if ('gc' in window) {
      (window as any).gc();
    }
    
    console.log('Memory pressure detected, clearing caches');
  }

  // Object Pooling
  getFromPool<T>(factory: () => T): T {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop() as T;
    }
    return factory();
  }

  returnToPool(obj: any) {
    if (this.particlePool.length < this.settings.particleLimit * 2) {
      this.particlePool.push(obj);
    }
  }

  clearPool() {
    this.particlePool = [];
  }

  // Particle Management
  limitParticles(particles: any[]): any[] {
    if (particles.length > this.settings.particleLimit) {
      // Remove oldest particles
      return particles.slice(-this.settings.particleLimit);
    }
    return particles;
  }

  // Texture Optimization
  getOptimalTextureSize(baseSize: number): number {
    switch (this.settings.textureQuality) {
      case 'HIGH':
        return baseSize;
      case 'MEDIUM':
        return Math.floor(baseSize * 0.75);
      case 'LOW':
        return Math.floor(baseSize * 0.5);
      default:
        return baseSize;
    }
  }

  // Lazy Loading
  private loadedAssets = new Set<string>();
  private loadingQueue: Array<{ url: string; priority: number }> = [];

  queueAssetLoad(url: string, priority: number = 0) {
    if (this.loadedAssets.has(url)) return;
    
    this.loadingQueue.push({ url, priority });
    this.loadingQueue.sort((a, b) => b.priority - a.priority);
  }

  async loadNextAsset(): Promise<string | null> {
    if (this.loadingQueue.length === 0) return null;
    
    const asset = this.loadingQueue.shift()!;
    this.loadedAssets.add(asset.url);
    
    // Simulate asset loading
    return asset.url;
  }

  isAssetLoaded(url: string): boolean {
    return this.loadedAssets.has(url);
  }

  // Getters
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  getCurrentFPS(): number {
    return this.metrics.fps;
  }

  isLowPerformance(): boolean {
    return this.isLowPerformanceMode;
  }

  // Manual settings override
  updateSettings(updates: Partial<OptimizationSettings>) {
    this.settings = { ...this.settings, ...updates };
  }

  // Hardware acceleration check
  useHardwareAcceleration(): boolean {
    return !this.isLowPerformanceMode;
  }
}

// Singleton instance
let optimizerInstance: MobileOptimizer | null = null;

export function getMobileOptimizer(): MobileOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new MobileOptimizer();
  }
  return optimizerInstance;
}

export function destroyMobileOptimizer() {
  if (optimizerInstance) {
    optimizerInstance.clearPool();
    optimizerInstance = null;
  }
}
