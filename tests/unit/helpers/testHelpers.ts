import { vi } from 'vitest';

/**
 * Mock logger for testing services
 */
export const createMockLogger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  critical: vi.fn(),
});

/**
 * Add mock logger to a service instance
 */
export const addMockLogger = (service: any) => {
  service.logger = createMockLogger();
  return service;
};
