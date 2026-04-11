/**
 * Service Initializer
 * 
 * Centralized service initialization and wiring.
 * Initializes all production-ready services in correct order.
 * 
 * Requirements: All requirements - final integration
 */

import { getServiceContainer } from './core/ServiceContainer';
import { gdprManager } from './gdpr/gdprManager';
import { crashReporter } from './crash/crashReporter';
import { analyticsService } from './analytics/analyticsService';
import { performanceMonitor } from './performance/performanceMonitor';
import { qualityAdjuster } from './performance/qualityAdjuster';
import { storageManager } from './storage/storageManager';
import { adManagerEnhanced } from './ads/adManagerEnhanced';
import { abTestManager } from './ab-test/abTestManager';
import { logger } from './logging/logger';
import { sessionTracker } from './analytics/gameEvents';
import { networkManager } from './network/networkManager';
import { securityManager } from './security/securityManager';

/**
 * Service initialization order (critical for dependencies)
 */
const INITIALIZATION_ORDER = [
  'Logger',
  'StorageManager',
  'NetworkManager',
  'SecurityManager',
  'GDPRManager',
  'CrashReporter',
  'AnalyticsService',
  'ABTestManager',
  'PerformanceMonitor',
  'QualityAdjuster',
  'AdManagerEnhanced',
] as const;

/**
 * Service health status
 */
export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  initialized: boolean;
  started: boolean;
  error?: string;
}

/**
 * Service Initializer
 * Manages initialization and lifecycle of all services
 */
export class ServiceInitializer {
  private isInitialized = false;
  private isStarted = false;
  private initializationErrors: Map<string, Error> = new Map();

  /**
   * Initialize all services
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Services already initialized');
      return;
    }

    logger.info('Initializing production services...');

    try {
      // Register all services in container
      this.registerServices();

      // Initialize services in order
      for (const serviceName of INITIALIZATION_ORDER) {
        try {
          logger.info(`Initializing ${serviceName}...`);
          const service = this.getService(serviceName);
          
          if (service) {
            await service.initialize();
            logger.info(`✓ ${serviceName} initialized`);
          }
        } catch (error) {
          logger.error(`✗ ${serviceName} initialization failed`, { error });
          this.initializationErrors.set(serviceName, error as Error);
          
          // Continue with other services (graceful degradation)
          // Only critical services should stop initialization
          if (this.isCriticalService(serviceName)) {
            throw error;
          }
        }
      }

      // Set up service integrations
      this.setupIntegrations();

      this.isInitialized = true;
      logger.info('✓ All services initialized successfully');
    } catch (error) {
      logger.critical('Failed to initialize services', { error });
      throw error;
    }
  }

  /**
   * Start all services
   */
  public async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Services must be initialized before starting');
    }

    if (this.isStarted) {
      logger.warn('Services already started');
      return;
    }

    logger.info('Starting production services...');

    try {
      // Start services in order
      for (const serviceName of INITIALIZATION_ORDER) {
        try {
          const service = this.getService(serviceName);
          
          if (service && !this.initializationErrors.has(serviceName)) {
            await service.start();
            logger.info(`✓ ${serviceName} started`);
          }
        } catch (error) {
          logger.error(`✗ ${serviceName} start failed`, { error });
          
          // Continue with other services
          if (this.isCriticalService(serviceName)) {
            throw error;
          }
        }
      }

      // Start session tracking
      sessionTracker.start();

      // Start quality monitoring
      qualityAdjuster.start();

      this.isStarted = true;
      logger.info('✓ All services started successfully');
    } catch (error) {
      logger.critical('Failed to start services', { error });
      throw error;
    }
  }

  /**
   * Stop all services
   */
  public async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    logger.info('Stopping production services...');

    // Stop in reverse order
    const reverseOrder = [...INITIALIZATION_ORDER].reverse();

    for (const serviceName of reverseOrder) {
      try {
        const service = this.getService(serviceName);
        
        if (service) {
          await service.stop();
          logger.info(`✓ ${serviceName} stopped`);
        }
      } catch (error) {
        logger.error(`✗ ${serviceName} stop failed`, { error });
      }
    }

    // Stop trackers
    sessionTracker.stop();
    qualityAdjuster.stop();

    this.isStarted = false;
    logger.info('✓ All services stopped');
  }

  /**
   * Get service health status
   */
  public getHealthStatus(): ServiceHealth[] {
    const statuses: ServiceHealth[] = [];

    for (const serviceName of INITIALIZATION_ORDER) {
      const service = this.getService(serviceName);
      const error = this.initializationErrors.get(serviceName);

      if (!service) {
        statuses.push({
          name: serviceName,
          status: 'failed',
          initialized: false,
          started: false,
          error: 'Service not found',
        });
        continue;
      }

      const state = service.getState();
      const status: ServiceHealth = {
        name: serviceName,
        status: error ? 'failed' : state === 'started' ? 'healthy' : 'degraded',
        initialized: state !== 'idle',
        started: state === 'started',
        error: error?.message,
      };

      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Check if all critical services are healthy
   */
  public isHealthy(): boolean {
    const statuses = this.getHealthStatus();
    const criticalServices = statuses.filter((s) => this.isCriticalService(s.name));
    return criticalServices.every((s) => s.status === 'healthy');
  }

  /**
   * Get initialization errors
   */
  public getErrors(): Map<string, Error> {
    return new Map(this.initializationErrors);
  }

  // Private methods

  /**
   * Register all services in container
   */
  private registerServices(): void {
    const serviceContainer = getServiceContainer();
    
    // Note: Services are already singletons, but we register them for consistency
    serviceContainer.register('Logger', () => logger as any);
    serviceContainer.register('StorageManager', () => storageManager);
    serviceContainer.register('NetworkManager', () => networkManager as any);
    serviceContainer.register('SecurityManager', () => securityManager);
    serviceContainer.register('GDPRManager', () => gdprManager);
    serviceContainer.register('CrashReporter', () => crashReporter);
    serviceContainer.register('AnalyticsService', () => analyticsService);
    serviceContainer.register('ABTestManager', () => abTestManager);
    serviceContainer.register('PerformanceMonitor', () => performanceMonitor);
    serviceContainer.register('QualityAdjuster', () => qualityAdjuster as any);
    serviceContainer.register('AdManagerEnhanced', () => adManagerEnhanced);
  }

  /**
   * Set up service integrations
   */
  private setupIntegrations(): void {
    // Integrate logger with crash reporter
    logger.setCrashReporter(crashReporter);

    logger.info('Service integrations configured');
  }

  /**
   * Get service by name
   */
  private getService(name: string): any {
    switch (name) {
      case 'Logger':
        return logger;
      case 'StorageManager':
        return storageManager;
      case 'NetworkManager':
        return networkManager;
      case 'SecurityManager':
        return securityManager;
      case 'GDPRManager':
        return gdprManager;
      case 'CrashReporter':
        return crashReporter;
      case 'AnalyticsService':
        return analyticsService;
      case 'ABTestManager':
        return abTestManager;
      case 'PerformanceMonitor':
        return performanceMonitor;
      case 'QualityAdjuster':
        return qualityAdjuster;
      case 'AdManagerEnhanced':
        return adManagerEnhanced;
      default:
        return null;
    }
  }

  /**
   * Check if service is critical
   */
  private isCriticalService(name: string): boolean {
    // Critical services that must initialize successfully
    const critical = ['Logger', 'StorageManager', 'CrashReporter'];
    return critical.includes(name);
  }
}

// Export singleton instance
export const serviceInitializer = new ServiceInitializer();

/**
 * Initialize all production services
 * Call this at app startup
 */
export async function initializeProductionServices(): Promise<void> {
  await serviceInitializer.initialize();
  await serviceInitializer.start();
}

/**
 * Shutdown all production services
 * Call this at app shutdown
 */
export async function shutdownProductionServices(): Promise<void> {
  await serviceInitializer.stop();
}
