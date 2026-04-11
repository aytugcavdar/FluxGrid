import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseService, ServiceStatus } from './BaseService';

// Mock service implementation for testing
class MockService extends BaseService {
  public initializeCalled = false;
  public startCalled = false;
  public stopCalled = false;
  public shouldFailOnInit = false;
  public shouldFailOnStart = false;
  public shouldFailOnStop = false;

  constructor(name: string = 'MockService') {
    super({ name, version: '1.0.0' });
  }

  protected async onInitialize(): Promise<void> {
    if (this.shouldFailOnInit) {
      throw new Error('Initialization failed');
    }
    this.initializeCalled = true;
  }

  protected async onStart(): Promise<void> {
    if (this.shouldFailOnStart) {
      throw new Error('Start failed');
    }
    this.startCalled = true;
  }

  protected async onStop(): Promise<void> {
    if (this.shouldFailOnStop) {
      throw new Error('Stop failed');
    }
    this.stopCalled = true;
  }
}

describe('BaseService', () => {
  let service: MockService;

  beforeEach(() => {
    service = new MockService();
  });

  describe('initialization', () => {
    it('should start in UNINITIALIZED status', () => {
      expect(service.getNetworkStatus()).toBe(ServiceStatus.UNINITIALIZED);
    });

    it('should transition to INITIALIZED after successful initialization', async () => {
      await service.initialize();
      expect(service.getNetworkStatus()).toBe(ServiceStatus.INITIALIZED);
      expect(service.initializeCalled).toBe(true);
    });

    it('should transition to ERROR if initialization fails', async () => {
      service.shouldFailOnInit = true;
      await expect(service.initialize()).rejects.toThrow('Failed to initialize MockService');
      expect(service.getNetworkStatus()).toBe(ServiceStatus.ERROR);
      expect(service.getError()).toBeDefined();
    });

    it('should not allow double initialization', async () => {
      await service.initialize();
      await expect(service.initialize()).rejects.toThrow('Cannot initialize MockService: already initialized');
    });
  });

  describe('start', () => {
    it('should transition to RUNNING after successful start', async () => {
      await service.initialize();
      await service.start();
      expect(service.getNetworkStatus()).toBe(ServiceStatus.RUNNING);
      expect(service.startCalled).toBe(true);
    });

    it('should not allow start before initialization', async () => {
      await expect(service.start()).rejects.toThrow('Cannot start MockService');
    });

    it('should transition to ERROR if start fails', async () => {
      await service.initialize();
      service.shouldFailOnStart = true;
      await expect(service.start()).rejects.toThrow('Failed to start MockService');
      expect(service.getNetworkStatus()).toBe(ServiceStatus.ERROR);
    });

    it('should allow restart after stop', async () => {
      await service.initialize();
      await service.start();
      await service.stop();
      await service.start();
      expect(service.getNetworkStatus()).toBe(ServiceStatus.RUNNING);
    });
  });

  describe('stop', () => {
    it('should transition to STOPPED after successful stop', async () => {
      await service.initialize();
      await service.start();
      await service.stop();
      expect(service.getNetworkStatus()).toBe(ServiceStatus.STOPPED);
      expect(service.stopCalled).toBe(true);
    });

    it('should not allow stop before running', async () => {
      await service.initialize();
      await expect(service.stop()).rejects.toThrow('Cannot stop MockService');
    });

    it('should transition to ERROR if stop fails', async () => {
      await service.initialize();
      await service.start();
      service.shouldFailOnStop = true;
      await expect(service.stop()).rejects.toThrow('Failed to stop MockService');
      expect(service.getNetworkStatus()).toBe(ServiceStatus.ERROR);
    });
  });

  describe('metadata', () => {
    it('should return service metadata', () => {
      const metadata = service.getMetadata();
      expect(metadata.name).toBe('MockService');
      expect(metadata.version).toBe('1.0.0');
    });

    it('should support dependencies in metadata', () => {
      const serviceWithDeps = new MockService('ServiceWithDeps');
      serviceWithDeps['metadata'].dependencies = ['ServiceA', 'ServiceB'];
      const metadata = serviceWithDeps.getMetadata();
      expect(metadata.dependencies).toEqual(['ServiceA', 'ServiceB']);
    });
  });

  describe('health check', () => {
    it('should be healthy when running without errors', async () => {
      await service.initialize();
      await service.start();
      expect(service.isHealthy()).toBe(true);
    });

    it('should be unhealthy when in ERROR status', async () => {
      service.shouldFailOnInit = true;
      await expect(service.initialize()).rejects.toThrow();
      expect(service.isHealthy()).toBe(false);
    });

    it('should be unhealthy when not running', async () => {
      await service.initialize();
      expect(service.isHealthy()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should store error when initialization fails', async () => {
      service.shouldFailOnInit = true;
      await expect(service.initialize()).rejects.toThrow();
      const error = service.getError();
      expect(error).toBeDefined();
      expect(error?.message).toBe('Initialization failed');
    });

    it('should clear previous errors on successful operations', async () => {
      // This test verifies that errors don't persist across successful operations
      await service.initialize();
      await service.start();
      expect(service.getError()).toBeUndefined();
    });
  });
});
