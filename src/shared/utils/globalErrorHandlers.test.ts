/**
 * Global Error Handlers Tests
 * 
 * Tests for window.onerror and unhandledrejection handlers.
 * Requirements: 2.6, 2.9, 10.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/src/utils/managers/errorHandler';

describe('Global Error Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler.clearErrors();
  });

  afterEach(() => {
    // Clean up any error listeners
    errorHandler.clearErrors();
  });

  describe('window.onerror', () => {
    it('should catch unhandled errors', () => {
      const handleErrorSpy = vi.spyOn(errorHandler, 'handleError');

      // Trigger a window error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error'),
      });

      window.dispatchEvent(errorEvent);

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.HIGH,
        expect.objectContaining({
          filename: 'test.js',
          lineno: 10,
          colno: 5,
          type: 'window.onerror',
        })
      );
    });

    it('should handle errors without error object', () => {
      const handleErrorSpy = vi.spyOn(errorHandler, 'handleError');

      // Trigger error event without error object
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error message',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
      });

      window.dispatchEvent(errorEvent);

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error message',
        }),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.HIGH,
        expect.any(Object)
      );
    });

    it('should prevent default error handling', () => {
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error: new Error('Test error'),
      });

      const preventDefaultSpy = vi.spyOn(errorEvent, 'preventDefault');

      window.dispatchEvent(errorEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('window.unhandledrejection', () => {
    it('should catch unhandled promise rejections', async () => {
      const handleErrorSpy = vi.spyOn(errorHandler, 'handleError');

      // Create a promise that we'll reject
      const promise = Promise.resolve();
      
      // Trigger unhandled rejection event
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason: new Error('Promise rejection'),
      });

      window.dispatchEvent(rejectionEvent);

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM,
        expect.objectContaining({
          promise: 'unhandled rejection',
          type: 'unhandledrejection',
        })
      );
    });

    it('should handle string rejection reasons', () => {
      const handleErrorSpy = vi.spyOn(errorHandler, 'handleError');

      // Create a resolved promise (not rejected to avoid test errors)
      const promise = Promise.resolve();
      
      // Trigger rejection with string reason
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason: 'String error',
      });

      window.dispatchEvent(rejectionEvent);

      expect(handleErrorSpy).toHaveBeenCalled();
    });

    it('should prevent default rejection handling', () => {
      const promise = Promise.resolve();
      
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason: new Error('Test'),
      });

      const preventDefaultSpy = vi.spyOn(rejectionEvent, 'preventDefault');

      window.dispatchEvent(rejectionEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handler Integration', () => {
    it('should store errors in error handler', () => {
      // Trigger an error
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error: new Error('Test error'),
      });

      window.dispatchEvent(errorEvent);

      // Check that error was stored
      const errors = errorHandler.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[errors.length - 1].message).toBe('Test error');
    });

    it('should categorize errors correctly', () => {
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error: new Error('Test error'),
      });

      window.dispatchEvent(errorEvent);

      const errors = errorHandler.getErrors();
      expect(errors[errors.length - 1].category).toBe(ErrorCategory.UNKNOWN);
    });

    it('should set correct severity for window errors', () => {
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error: new Error('Test error'),
      });

      window.dispatchEvent(errorEvent);

      const errors = errorHandler.getErrors();
      expect(errors[errors.length - 1].severity).toBe(ErrorSeverity.HIGH);
    });

    it('should set correct severity for promise rejections', () => {
      const promise = Promise.resolve();
      
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason: new Error('Test'),
      });

      window.dispatchEvent(rejectionEvent);

      const errors = errorHandler.getErrors();
      expect(errors[errors.length - 1].severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('Error Listener Integration', () => {
    it('should notify error listeners when error occurs', () => {
      const listener = vi.fn();
      const unsubscribe = errorHandler.onError(listener);

      // Trigger an error
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error: new Error('Test error'),
      });

      window.dispatchEvent(errorEvent);

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.HIGH,
        })
      );

      unsubscribe();
    });

    it('should allow multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = errorHandler.onError(listener1);
      const unsubscribe2 = errorHandler.onError(listener2);

      // Trigger an error
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error: new Error('Test error'),
      });

      window.dispatchEvent(errorEvent);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      unsubscribe1();
      unsubscribe2();
    });
  });
});
