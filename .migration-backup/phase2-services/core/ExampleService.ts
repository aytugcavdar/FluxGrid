/**
 * Example Service Implementation
 * 
 * This is a reference implementation showing how to create a service
 * using the BaseService architecture. Use this as a template for creating
 * new services in the application.
 */

import { BaseService } from './BaseService';

export class ExampleService extends BaseService {
  private config: Record<string, any> = {};
  private isActive = false;

  constructor() {
    super({
      name: 'ExampleService',
      version: '1.0.0',
      dependencies: [], // Add service dependencies here if needed
    });
  }

  /**
   * Initialize: Load configuration and setup resources
   */
  protected async onInitialize(): Promise<void> {
    // Load configuration
    this.config = {
      enabled: true,
      timeout: 5000,
    };

    // Setup resources (e.g., event listeners, connections)
    console.log(`[${this.metadata.name}] Initialized with config:`, this.config);
  }

  /**
   * Start: Begin service operations
   */
  protected async onStart(): Promise<void> {
    this.isActive = true;
    console.log(`[${this.metadata.name}] Started`);
  }

  /**
   * Stop: Cleanup and release resources
   */
  protected async onStop(): Promise<void> {
    this.isActive = false;
    console.log(`[${this.metadata.name}] Stopped`);
  }

  /**
   * Public API: Example method
   */
  public doSomething(): void {
    if (!this.isActive) {
      throw new Error('Service is not running');
    }
    console.log(`[${this.metadata.name}] Doing something...`);
  }

  /**
   * Public API: Get configuration
   */
  public getConfig(): Record<string, any> {
    return { ...this.config };
  }
}
