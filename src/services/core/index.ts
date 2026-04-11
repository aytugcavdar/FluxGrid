/**
 * Core Services Module
 * 
 * Exports base service architecture and dependency injection container
 */

export { BaseService, ServiceStatus } from './BaseService';
export type { ServiceMetadata } from './BaseService';
export { ServiceContainer, getServiceContainer } from './ServiceContainer';
export type { ServiceFactory } from './ServiceContainer';
