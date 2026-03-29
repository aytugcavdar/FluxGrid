export interface PerformanceMetrics {
  fps: number;
  activeEffectCount: number;
  droppedFrames: number;
  averageFrameTime: number; // ms
  lastMeasurement: number; // timestamp
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private frameTimestamps: number[] = [];
  private maxFrameHistory = 60; // Track last 60 frames
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;

  constructor() {
    this.metrics = {
      fps: 60,
      activeEffectCount: 0,
      droppedFrames: 0,
      averageFrameTime: 16.67, // 60 FPS = ~16.67ms per frame
      lastMeasurement: Date.now(),
    };
  }

  measureFrame(): void {
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.frameTimestamps.push(frameTime);
      
      // Keep only recent frames
      if (this.frameTimestamps.length > this.maxFrameHistory) {
        this.frameTimestamps.shift();
      }
      
      // Calculate metrics
      this.updateMetrics();
    }
    
    this.lastFrameTime = now;
  }

  private updateMetrics(): void {
    if (this.frameTimestamps.length === 0) return;
    
    // Calculate average frame time
    const sum = this.frameTimestamps.reduce((a, b) => a + b, 0);
    const avgFrameTime = sum / this.frameTimestamps.length;
    
    // Calculate FPS
    const fps = 1000 / avgFrameTime;
    
    // Count dropped frames (frames that took longer than 16.67ms)
    const droppedFrames = this.frameTimestamps.filter(t => t > 16.67).length;
    
    this.metrics = {
      ...this.metrics,
      fps: Math.round(fps),
      averageFrameTime: Math.round(avgFrameTime * 100) / 100,
      droppedFrames,
      lastMeasurement: Date.now(),
    };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  shouldThrottle(): boolean {
    // Throttle if FPS is below 45 or if we have many dropped frames
    return this.metrics.fps < 45 || this.metrics.droppedFrames > 10;
  }

  getRecommendedQuality(): 'high' | 'medium' | 'low' {
    const { fps } = this.metrics;
    
    if (fps < 30) {
      return 'low';
    } else if (fps < 45) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  setActiveEffectCount(count: number): void {
    this.metrics.activeEffectCount = count;
  }

  startMonitoring(callback?: (metrics: PerformanceMetrics) => void): void {
    const measure = () => {
      this.measureFrame();
      
      if (callback) {
        callback(this.getMetrics());
      }
      
      this.animationFrameId = requestAnimationFrame(measure);
    };
    
    this.animationFrameId = requestAnimationFrame(measure);
  }

  stopMonitoring(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  reset(): void {
    this.frameTimestamps = [];
    this.lastFrameTime = 0;
    this.metrics = {
      fps: 60,
      activeEffectCount: 0,
      droppedFrames: 0,
      averageFrameTime: 16.67,
      lastMeasurement: Date.now(),
    };
  }
}
