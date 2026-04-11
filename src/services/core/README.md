# Core Service Architecture

This directory contains the base service architecture and dependency injection container for FluxGrid.

## Overview

The service architecture provides:
- **Lifecycle Management**: Consistent initialization, start, and stop behavior
- **Dependency Injection**: Centralized service registration and resolution
- **Health Monitoring**: Service status tracking and health checks
- **Error Handling**: Structured error management across services

## Components

### BaseService

Abstract base class that all services should extend. Provides lifecycle management:

- `initialize()`: Load configuration and setup resources
- `start()`: Begin service operations
- `stop()`: Cleanup and release resources

**Service States:**
- `UNINITIALIZED` → `INITIALIZING` → `INITIALIZED` → `STARTING` → `RUNNING` → `STOPPING` → `STOPPED`
- `ERROR` (if any operation fails)

### ServiceContainer

Dependency injection container for managing services:

- `register(name, factory, singleton)`: Register a service
- `resolve(name)`: Get a service instance
- `initializeAll()`: Initialize all services in dependency order
- `startAll()`: Start all initialized services
- `stopAll()`: Stop all running services
- `getHealthStatus()`: Get health status of all services

## Usage

### 1. Create a Service

```typescript
import { BaseService } from './core';

export class MyService extends BaseService {
  constructor() {
    super({
      name: 'MyService',
      version: '1.0.0',
      dependencies: ['OtherService'], // Optional
    });
  }

  protected async onInitialize(): Promise<void> {
    // Load config, setup resources
  }

  protected async onStart(): Promise<void> {
    // Begin operations
  }

  protected async onStop(): Promise<void> {
    // Cleanup
  }

  // Public API methods
  public doSomething(): void {
    // Implementation
  }
}
```

### 2. Register Services

```typescript
import { getServiceContainer } from './core';
import { MyService } from './MyService';

const container = getServiceContainer();

// Register as singleton (default)
container.register('MyService', () => new MyService());

// Register as non-singleton
container.register('MyService', () => new MyService(), false);
```

### 3. Initialize and Start Services

```typescript
// Initialize all services (respects dependencies)
await container.initializeAll();

// Start all services
await container.startAll();

// Use services
const myService = container.resolve<MyService>('MyService');
myService.doSomething();
```

### 4. Monitor Health

```typescript
const health = container.getHealthStatus();
console.log(health);
// {
//   MyService: { status: 'running', healthy: true },
//   OtherService: { status: 'running', healthy: true }
// }
```

### 5. Shutdown

```typescript
// Stop all services (reverse order)
await container.stopAll();
```

## Best Practices

1. **Single Responsibility**: Each service should have one clear purpose
2. **Dependency Declaration**: Always declare dependencies in metadata
3. **Error Handling**: Use try-catch in lifecycle methods and throw meaningful errors
4. **Resource Cleanup**: Always cleanup resources in `onStop()`
5. **Idempotency**: Ensure operations can be safely retried
6. **Testing**: Mock services using the factory pattern

## Example

See `ExampleService.ts` for a complete reference implementation.

## Testing

Run tests:
```bash
npm test -- src/services/core
```

All services should have unit tests covering:
- Initialization
- Start/stop lifecycle
- Error handling
- Public API methods
