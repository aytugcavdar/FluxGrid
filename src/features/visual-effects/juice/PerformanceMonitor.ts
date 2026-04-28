/**
 * Performance Monitor
 * 
 * Monitors frame times and automatically adjusts quality settings
 * to maintain smooth performance across different devices.
 */

export interface PerformanceMetrics {
  averageFPS: number;
  frameTime: number;
  jankyFramePercentage: number;
  qualityRecommendation: 'high' | 'medium' | 'low';
}

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private jankyFrames: number = 0;
  private totalFrames: number = 0;
  private lastFrameTime: number = 0;
  private readonly maxSamples = 120; // 2 seconds at 60fps
  private readonly jankyThreshold = 16.67; // 60fps threshold in ms
  
  // Quality thresholds
  private readonly HIGH_QUALITY_MIN_FPS = 55;
  private readonly MEDIUM_QUALITY_MIN_FPS = 45;
  private readonly LOW_QUALITY_MIN_FPS = 30;
  
  private currentQuality: 'high' | 'medium' | 'low' = 'high';
  private qualityChangeCallback?: (quality: 'high' | 'medium' | 'low') => void;
  private updateCounter: number = 0;
  private readonly UPDATE_INTERVAL = 10; // Only update every 10 frames
  private initialQualitySet: boolean = false;
  
  constructor() {
    this.lastFrameTime = performance.now();
    this.detectInitialQuality();
  }
  
  /**
   * Detect initial quality based on device capabilities
   * OPTIMIZED: Set quality immediately to avoid stuttering during detection
   */
  private detectInitialQuality(): void {
    // Check for weak device indicators
    const isWeakDevice = this.isWeakDevice();
    
    if (isWeakDevice) {
      this.currentQuality = 'low';
      console.log('[PerformanceMonitor] Weak device detected, starting with low quality');
    } else {
      // Start with medium for unknown devices, will adjust after measurement
      this.currentQuality = 'medium';
      console.log('[PerformanceMonitor] Starting with medium quality');
    }
    
    this.initialQualitySet = true;
    
    // Notify immediately
    if (this.qualityChangeCallback) {
      this.qualityChangeCallback(this.currentQuality);
    }
  }
  
  /**
   * Detect if device is weak based on hardware capabilities
   */
  private isWeakDevice(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    
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
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hasLowRAM = deviceMemory <= 4;
    
    // Combine checks: Known weak device OR low RAM = weak
    return isKnownWeakDevice || hasLowRAM;
  }
  
  /**
   * Register callback for quality changes
   */
  onQualityChange(callback: (quality: 'high' | 'medium' | 'low') => void): void {
    this.qualityChangeCallback = callback;
  }
  
  /**
   * Update performance metrics (call every frame)
   * OPTIMIZED: Only process every 10th frame to reduce CPU overhead
   */
  update(): void {
    this.updateCounter++;
    
    // Only process every 10th frame to reduce CPU load
    if (this.updateCounter % this.UPDATE_INTERVAL !== 0) {
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    // Record frame time
    this.frameTimes.push(deltaTime);
    this.totalFrames++;
    
    // Check if frame is janky
    if (deltaTime > this.jankyThreshold) {
      this.jankyFrames++;
    }
    
    // Keep only recent samples
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
    
    // Update quality every 2 seconds (120 frames)
    if (this.totalFrames % 120 === 0 && this.frameTimes.length >= this.maxSamples) {
      this.evaluateQuality();
    }
    
    this.lastFrameTime = currentTime;
  }
  
  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const averageFPS = 1000 / averageFrameTime;
    const jankyPercentage = (this.jankyFrames / this.totalFrames) * 100;
    
    return {
      averageFPS,
      frameTime: averageFrameTime,
      jankyFramePercentage: jankyPercentage,
      qualityRecommendation: this.currentQuality,
    };
  }
  
  /**
   * Evaluate and adjust quality based on performance
   */
  private evaluateQuality(): void {
    const metrics = this.getMetrics();
    const { averageFPS, jankyFramePercentage } = metrics;
    
    let newQuality: 'high' | 'medium' | 'low' = this.currentQuality;
    
    // Determine quality based on FPS and janky frame percentage
    if (averageFPS >= this.HIGH_QUALITY_MIN_FPS && jankyFramePercentage < 5) {
      newQuality = 'high';
    } else if (averageFPS >= this.MEDIUM_QUALITY_MIN_FPS && jankyFramePercentage < 15) {
      newQuality = 'medium';
    } else {
      newQuality = 'low';
    }
    
    // Only change quality if it's different
    if (newQuality !== this.currentQuality) {
      this.currentQuality = newQuality;
      
      // Notify callback
      if (this.qualityChangeCallback) {
        this.qualityChangeCallback(newQuality);
      }
      
      // Reset metrics after quality change
      this.resetMetrics();
    }
  }
  
  /**
   * Reset performance metrics
   */
  private resetMetrics(): void {
    this.frameTimes = [];
    this.jankyFrames = 0;
    this.totalFrames = 0;
  }
  
  /**
   * Get current quality recommendation
   */
  getCurrentQuality(): 'high' | 'medium' | 'low' {
    return this.currentQuality;
  }
  
  /**
   * Manually set quality (for testing or user preference)
   */
  setQuality(quality: 'high' | 'medium' | 'low'): void {
    if (quality !== this.currentQuality) {
      this.currentQuality = quality;
      
      if (this.qualityChangeCallback) {
        this.qualityChangeCallback(quality);
      }
    }
  }
}
