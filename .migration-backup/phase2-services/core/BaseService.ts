/**
 * Base Service Abstract Class
 * 
 * Provides lifecycle management for all services in the application.
 * All services should extend this class to ensure consistent initialization,
 * startup, and shutdown behavior.
 */

import { logger, LogCategory } from '../logging/logger';

export enum ServiceStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export interface ServiceMetadata {
  name: string;
  version: string;
  dependencies?: string[];
}

export abstract class BaseService {
  protected status: ServiceStatus = ServiceStatus.UNINITIALIZED;
  protected error?: Error;
  protected metadata: ServiceMetadata;
  protected logger: ReturnType<typeof logger.forCategory>;

  constructor(metadata: ServiceMetadata) {
    this.metadata = metadata;
    // Create a category logger for this service
    this.logger = logger.forCategory(LogCategory.GENERAL);
  }

  /**
   * Initialize the service (load config, setup resources)
   * Called once during app startup
   */
  async initialize(): Promise<void> {
    if (this.status !== ServiceStatus.UNINITIALIZED) {
      throw new Error(`Cannot initialize ${this.metadata.name}: already ${this.status}`);
    }

    try {
      this.status = ServiceStatus.INITIALIZING;
      await this.onInitialize();
      this.status = ServiceStatus.INITIALIZED;
    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.error = error as Error;
      throw new Error(`Failed to initialize ${this.metadata.name}: ${(error as Error).message}`);
    }
  }

  /**
   * Start the service (begin operations)
   * Called after initialization
   */
  async start(): Promise<void> {
    if (this.status !== ServiceStatus.INITIALIZED && this.status !== ServiceStatus.STOPPED) {
      throw new Error(`Cannot start ${this.metadata.name}: current status is ${this.status}`);
    }

    try {
      this.status = ServiceStatus.STARTING;
      await this.onStart();
      this.status = ServiceStatus.RUNNING;
    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.error = error as Error;
      throw new Error(`Failed to start ${this.metadata.name}: ${(error as Error).message}`);
    }
  }

  /**
   * Stop the service (cleanup, release resources)
   * Called during app shutdown or service restart
   */
  async stop(): Promise<void> {
    if (this.status !== ServiceStatus.RUNNING) {
      throw new Error(`Cannot stop ${this.metadata.name}: current status is ${this.status}`);
    }

    try {
      this.status = ServiceStatus.STOPPING;
      await this.onStop();
      this.status = ServiceStatus.STOPPED;
    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.error = error as Error;
      throw new Error(`Failed to stop ${this.metadata.name}: ${(error as Error).message}`);
    }
  }

  /**
   * Get current service status
   */
  getNetworkStatus(): ServiceStatus {
    return this.status;
  }

  /**
   * Get service metadata
   */
  getMetadata(): ServiceMetadata {
    return this.metadata;
  }

  /**
   * Get last error if any
   */
  getError(): Error | undefined {
    return this.error;
  }

  /**
   * Check if service is healthy
   */
  isHealthy(): boolean {
    return this.status === ServiceStatus.RUNNING && !this.error;
  }

  /**
   * Abstract method: Initialize service resources
   * Override this in derived classes
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Abstract method: Start service operations
   * Override this in derived classes
   */
  protected abstract onStart(): Promise<void>;

  /**
   * Abstract method: Stop service and cleanup
   * Override this in derived classes
   */
  protected abstract onStop(): Promise<void>;
}
