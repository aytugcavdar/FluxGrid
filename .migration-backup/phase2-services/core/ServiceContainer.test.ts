import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceContainer } from './ServiceContainer';
import { BaseService, ServiceStatus } from './BaseService';

// Mock services for testing
class ServiceA extends BaseService {
  constructor() {
    super({ name: 'ServiceA', version: '1.0.0' });
  }

  protected async onInitialize(): Promise<void> {
    // Simulate initialization
  }

  protected async onStart(): Promise<void> {
    // Simulate start
  }

  protected async onStop(): Promise<void> {
    // Simulate stop
  }
}

class ServiceB extends BaseService {
  constructor() {
    super({ name: 'ServiceB', version: '1.0.0', dependencies: ['ServiceA'] });
  }

  protected async onInitialize(): Promise<void> {
    // Simulate initialization
  }

  protected async onStart(): Promise<void> {
    // Simulate start
  }

  protected async onStop(): Promise<void> {
    // Simulate stop
  }
}

class ServiceC extends BaseService {
  constructor() {
    super({ name: 'ServiceC', version: '1.0.0', dependencies: ['ServiceB'] });
  }

  protected async onInitialize(): Promise<void> {
    // Simulate initialization
  }

  protected async onStart(): Promise<void> {
    // Simulate start
  }

  protected async onStop(): Promise<void> {
    // Simulate stop
  }
}

class FailingService extends BaseService {
  constructor() {
    super({ name: 'FailingService', version: '1.0.0' });
  }

  protected async onInitialize(): Promise<void> {
    throw new Error('Initialization failed');
  }

  protected async onStart(): Promise<void> {
    // Simulate start
  }

  protected async onStop(): Promise<void> {
    // Simulate stop
  }
}

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    // Get a fresh container instance and clear it
    container = ServiceContainer.getInstance();
    container.clear();
  });

  describe('registration', () => {
    it('should register a service', () => {
      container.register('ServiceA', () => new ServiceA());
      expect(container.has('ServiceA')).toBe(true);
    });

    it('should not allow duplicate registration', () => {
      container.register('ServiceA', () => new ServiceA());
      expect(() => container.register('ServiceA', () => new ServiceA())).toThrow(
        "Service 'ServiceA' is already registered"
      );
    });

    it('should register multiple services', () => {
      container.register('ServiceA', () => new ServiceA());
      container.register('ServiceB', () => new ServiceB());
      expect(container.has('ServiceA')).toBe(true);
      expect(container.has('ServiceB')).toBe(true);
    });
  });

  describe('resolution', () => {
    it('should resolve a registered service', () => {
      container.register('ServiceA', () => new ServiceA());
      const service = container.resolve<ServiceA>('ServiceA');
      expect(service).toBeInstanceOf(ServiceA);
    });

    it('should throw error when resolving unregistered service', () => {
      expect(() => container.resolve('NonExistent')).toThrow(
        "Service 'NonExistent' is not registered"
      );
    });

    it('should return same instance for singleton services', () => {
      container.register('ServiceA', () => new ServiceA(), true);
      const instance1 = container.resolve<ServiceA>('ServiceA');
      const instance2 = container.resolve<ServiceA>('ServiceA');
      expect(instance1).toBe(instance2);
    });

    it('should return different instances for non-singleton services', () => {
      container.register('ServiceA', () => new ServiceA(), false);
      const instance1 = container.resolve<ServiceA>('ServiceA');
      const instance2 = container.resolve<ServiceA>('ServiceA');
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('initialization', () => {
    it('should initialize all services', async () => {
      container.register('ServiceA', () => new ServiceA());
      container.register('ServiceB', () => new ServiceB());

      await container.initializeAll();

      const serviceA = container.resolve<ServiceA>('ServiceA');
      const serviceB = container.resolve<ServiceB>('ServiceB');

      expect(serviceA.getNetworkStatus()).toBe(ServiceStatus.INITIALIZED);
      expect(serviceB.getNetworkStatus()).toBe(ServiceStatus.INITIALIZED);
    });

    it('should initialize services in dependency order', async () => {
      const initOrder: string[] = [];

      class TrackedServiceA extends ServiceA {
        protected async onInitialize(): Promise<void> {
          initOrder.push('ServiceA');
        }
      }

      class TrackedServiceB extends ServiceB {
        protected async onInitialize(): Promise<void> {
          initOrder.push('ServiceB');
        }
      }

      class TrackedServiceC extends ServiceC {
        protected async onInitialize(): Promise<void> {
          initOrder.push('ServiceC');
        }
      }

      container.register('ServiceA', () => new TrackedServiceA());
      container.register('ServiceB', () => new TrackedServiceB());
      container.register('ServiceC', () => new TrackedServiceC());

      await container.initializeAll();

      // ServiceA should be initialized before ServiceB, and ServiceB before ServiceC
      expect(initOrder.indexOf('ServiceA')).toBeLessThan(initOrder.indexOf('ServiceB'));
      expect(initOrder.indexOf('ServiceB')).toBeLessThan(initOrder.indexOf('ServiceC'));
    });

    it('should handle initialization failures', async () => {
      container.register('FailingService', () => new FailingService());

      await expect(container.initializeAll()).rejects.toThrow('Failed to initialize FailingService');
    });
  });

  describe('start and stop', () => {
    beforeEach(async () => {
      container.register('ServiceA', () => new ServiceA());
      container.register('ServiceB', () => new ServiceB());
      await container.initializeAll();
    });

    it('should start all initialized services', async () => {
      await container.startAll();

      const serviceA = container.resolve<ServiceA>('ServiceA');
      const serviceB = container.resolve<ServiceB>('ServiceB');

      expect(serviceA.getNetworkStatus()).toBe(ServiceStatus.RUNNING);
      expect(serviceB.getNetworkStatus()).toBe(ServiceStatus.RUNNING);
    });

    it('should stop all running services', async () => {
      await container.startAll();
      await container.stopAll();

      const serviceA = container.resolve<ServiceA>('ServiceA');
      const serviceB = container.resolve<ServiceB>('ServiceB');

      expect(serviceA.getNetworkStatus()).toBe(ServiceStatus.STOPPED);
      expect(serviceB.getNetworkStatus()).toBe(ServiceStatus.STOPPED);
    });
  });

  describe('health status', () => {
    it('should return health status of all services', async () => {
      container.register('ServiceA', () => new ServiceA());
      container.register('ServiceB', () => new ServiceB());

      await container.initializeAll();
      await container.startAll();

      const health = container.getHealthStatus();

      expect(health.ServiceA.status).toBe(ServiceStatus.RUNNING);
      expect(health.ServiceA.healthy).toBe(true);
      expect(health.ServiceB.status).toBe(ServiceStatus.RUNNING);
      expect(health.ServiceB.healthy).toBe(true);
    });

    it('should report unhealthy services', async () => {
      container.register('FailingService', () => new FailingService());

      try {
        await container.initializeAll();
      } catch {
        // Expected to fail
      }

      const health = container.getHealthStatus();

      expect(health.FailingService.status).toBe(ServiceStatus.ERROR);
      expect(health.FailingService.healthy).toBe(false);
      expect(health.FailingService.error).toBeDefined();
    });
  });

  describe('singleton pattern', () => {
    it('should return same container instance', () => {
      const container1 = ServiceContainer.getInstance();
      const container2 = ServiceContainer.getInstance();
      expect(container1).toBe(container2);
    });
  });

  describe('clear', () => {
    it('should clear all registered services', () => {
      container.register('ServiceA', () => new ServiceA());
      container.register('ServiceB', () => new ServiceB());

      container.clear();

      expect(container.has('ServiceA')).toBe(false);
      expect(container.has('ServiceB')).toBe(false);
    });
  });
});
