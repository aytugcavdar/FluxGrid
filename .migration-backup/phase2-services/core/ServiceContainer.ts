/**
 * Service Container
 * 
 * Dependency injection container for managing service lifecycle and dependencies.
 * Provides centralized service registration, resolution, and initialization.
 */

import { BaseService, ServiceStatus } from './BaseService';

export type ServiceFactory<T extends BaseService> = () => T;

interface ServiceRegistration<T extends BaseService> {
  factory: ServiceFactory<T>;
  instance?: T;
  singleton: boolean;
}

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, ServiceRegistration<any>> = new Map();
  private initializationOrder: string[] = [];

  private constructor() {}

  /**
   * Get singleton instance of ServiceContainer
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service with the container
   * @param name - Unique service identifier
   * @param factory - Factory function to create service instance
   * @param singleton - Whether to reuse the same instance (default: true)
   */
  register<T extends BaseService>(
    name: string,
    factory: ServiceFactory<T>,
    singleton: boolean = true
  ): void {
    if (this.services.has(name)) {
      throw new Error(`Service '${name}' is already registered`);
    }

    this.services.set(name, {
      factory,
      singleton,
    });
  }

  /**
   * Resolve a service by name
   * @param name - Service identifier
   * @returns Service instance
   */
  resolve<T extends BaseService>(name: string): T {
    const registration = this.services.get(name);

    if (!registration) {
      throw new Error(`Service '${name}' is not registered`);
    }

    // Return existing instance for singletons
    if (registration.singleton && registration.instance) {
      return registration.instance as T;
    }

    // Create new instance
    const instance = registration.factory();

    // Store instance for singletons
    if (registration.singleton) {
      registration.instance = instance;
    }

    return instance as T;
  }

  /**
   * Check if a service is registered
   * @param name - Service identifier
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Initialize all registered services in dependency order
   */
  async initializeAll(): Promise<void> {
    const servicesToInit: Array<{ name: string; service: BaseService }> = [];

    // Resolve all services
    for (const [name] of this.services) {
      const service = this.resolve(name);
      servicesToInit.push({ name, service });
    }

    // Sort by dependencies (topological sort)
    const sorted = this.topologicalSort(servicesToInit);

    // Initialize in order
    for (const { name, service } of sorted) {
      if (service.getNetworkStatus() === ServiceStatus.UNINITIALIZED) {
        await service.initialize();
        this.initializationOrder.push(name);
      }
    }
  }

  /**
   * Start all initialized services
   */
  async startAll(): Promise<void> {
    for (const name of this.initializationOrder) {
      const service = this.resolve(name);
      if (service.getNetworkStatus() === ServiceStatus.INITIALIZED) {
        await service.start();
      }
    }
  }

  /**
   * Stop all running services in reverse order
   */
  async stopAll(): Promise<void> {
    const reverseOrder = [...this.initializationOrder].reverse();

    for (const name of reverseOrder) {
      const service = this.resolve(name);
      if (service.getNetworkStatus() === ServiceStatus.RUNNING) {
        await service.stop();
      }
    }
  }

  /**
   * Get health status of all services
   */
  getHealthStatus(): Record<string, { status: ServiceStatus; healthy: boolean; error?: string }> {
    const status: Record<string, { status: ServiceStatus; healthy: boolean; error?: string }> = {};

    for (const [name] of this.services) {
      const service = this.resolve(name);
      status[name] = {
        status: service.getNetworkStatus(),
        healthy: service.isHealthy(),
        error: service.getError()?.message,
      };
    }

    return status;
  }

  /**
   * Clear all services (for testing)
   */
  clear(): void {
    this.services.clear();
    this.initializationOrder = [];
  }

  /**
   * Topological sort for dependency resolution
   * Services with no dependencies are initialized first
   */
  private topologicalSort(
    services: Array<{ name: string; service: BaseService }>
  ): Array<{ name: string; service: BaseService }> {
    const sorted: Array<{ name: string; service: BaseService }> = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (item: { name: string; service: BaseService }) => {
      if (visited.has(item.name)) return;
      if (visiting.has(item.name)) {
        throw new Error(`Circular dependency detected: ${item.name}`);
      }

      visiting.add(item.name);

      const dependencies = item.service.getMetadata().dependencies || [];
      for (const depName of dependencies) {
        const dep = services.find((s) => s.name === depName);
        if (dep) {
          visit(dep);
        }
      }

      visiting.delete(item.name);
      visited.add(item.name);
      sorted.push(item);
    };

    for (const item of services) {
      visit(item);
    }

    return sorted;
  }
}

/**
 * Convenience function to get the global service container
 */
export const getServiceContainer = (): ServiceContainer => {
  return ServiceContainer.getInstance();
};
