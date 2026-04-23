/**
 * BaseService - Abstract base class for all services
 * 
 * Provides common functionality for service lifecycle management,
 * logging, and initialization status tracking.
 */
export abstract class BaseService {
  protected serviceName: string;
  protected initialized: boolean = false;
  protected started: boolean = false;
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }
  
  /**
   * Initialize the service
   * Must be implemented by subclasses
   */
  abstract initialize(): Promise<void>;
  
  /**
   * Cleanup service resources
   * Must be implemented by subclasses
   */
  abstract cleanup(): void;
  
  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Check if service is started
   */
  isStarted(): boolean {
    return this.started;
  }
  
  /**
   * Log informational message
   */
  protected log(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.serviceName}] ${message}`, ...args);
    }
  }
  
  /**
   * Log error message
   */
  protected error(message: string, error?: Error): void {
    console.error(`[${this.serviceName}] ${message}`, error);
  }
  
  /**
   * Log warning message
   */
  protected warn(message: string, ...args: any[]): void {
    console.warn(`[${this.serviceName}] ${message}`, ...args);
  }
  
  /**
   * Mark service as initialized
   */
  protected markInitialized(): void {
    this.initialized = true;
    this.log('Service initialized');
  }
  
  /**
   * Mark service as started
   */
  protected markStarted(): void {
    this.started = true;
    this.log('Service started');
  }
}
