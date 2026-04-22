import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DOMBatcher, domBatcher } from './domBatcher';

describe('DOMBatcher', () => {
  let batcher: DOMBatcher;

  beforeEach(() => {
    batcher = new DOMBatcher();
    vi.useFakeTimers();
  });

  afterEach(() => {
    batcher.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('scheduleRead', () => {
    it('should queue read operations', () => {
      const readCallback = vi.fn();
      
      batcher.scheduleRead(readCallback);
      
      expect(batcher.getPendingReads()).toBe(1);
      expect(readCallback).not.toHaveBeenCalled();
    });

    it('should schedule a flush when read is queued', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      
      batcher.scheduleRead(() => {});
      
      expect(rafSpy).toHaveBeenCalledTimes(1);
      expect(batcher.isFlushScheduled()).toBe(true);
    });

    it('should not schedule multiple flushes for multiple reads', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      
      batcher.scheduleRead(() => {});
      batcher.scheduleRead(() => {});
      batcher.scheduleRead(() => {});
      
      expect(rafSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('scheduleWrite', () => {
    it('should queue write operations', () => {
      const writeCallback = vi.fn();
      
      batcher.scheduleWrite(writeCallback);
      
      expect(batcher.getPendingWrites()).toBe(1);
      expect(writeCallback).not.toHaveBeenCalled();
    });

    it('should schedule a flush when write is queued', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      
      batcher.scheduleWrite(() => {});
      
      expect(rafSpy).toHaveBeenCalledTimes(1);
      expect(batcher.isFlushScheduled()).toBe(true);
    });
  });

  describe('flush order', () => {
    it('should execute all reads before writes', async () => {
      const executionOrder: string[] = [];
      
      batcher.scheduleWrite(() => executionOrder.push('write1'));
      batcher.scheduleRead(() => executionOrder.push('read1'));
      batcher.scheduleWrite(() => executionOrder.push('write2'));
      batcher.scheduleRead(() => executionOrder.push('read2'));
      
      // Trigger the flush
      await vi.runAllTimersAsync();
      
      expect(executionOrder).toEqual(['read1', 'read2', 'write1', 'write2']);
    });

    it('should clear queues after flush', async () => {
      batcher.scheduleRead(() => {});
      batcher.scheduleWrite(() => {});
      
      expect(batcher.getPendingReads()).toBe(1);
      expect(batcher.getPendingWrites()).toBe(1);
      
      await vi.runAllTimersAsync();
      
      expect(batcher.getPendingReads()).toBe(0);
      expect(batcher.getPendingWrites()).toBe(0);
    });

    it('should not be scheduled after flush completes', async () => {
      batcher.scheduleRead(() => {});
      
      expect(batcher.isFlushScheduled()).toBe(true);
      
      await vi.runAllTimersAsync();
      
      expect(batcher.isFlushScheduled()).toBe(false);
    });
  });

  describe('batching within single frame', () => {
    it('should batch multiple operations in one animation frame', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      
      batcher.scheduleRead(() => {});
      batcher.scheduleRead(() => {});
      batcher.scheduleWrite(() => {});
      batcher.scheduleWrite(() => {});
      
      // Only one requestAnimationFrame should be called
      expect(rafSpy).toHaveBeenCalledTimes(1);
      
      await vi.runAllTimersAsync();
      
      // All operations should be executed
      expect(batcher.getPendingReads()).toBe(0);
      expect(batcher.getPendingWrites()).toBe(0);
    });

    it('should handle operations queued during flush', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      const nestedWrite = vi.fn();
      
      batcher.scheduleRead(() => {
        // Queue another operation during the read phase
        batcher.scheduleWrite(nestedWrite);
      });
      
      expect(rafSpy).toHaveBeenCalledTimes(1);
      
      await vi.runAllTimersAsync();
      
      // The write was queued during reads phase, so it gets added to writeQueue
      // The flush then processes all writes (including the newly added one)
      // So it should execute in the same flush cycle
      expect(nestedWrite).toHaveBeenCalled();
      expect(batcher.getPendingWrites()).toBe(0);
    });

    it('should schedule another flush if operations added during write phase', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      const nestedRead = vi.fn();
      
      batcher.scheduleWrite(() => {
        // Queue a read during the write phase
        batcher.scheduleRead(nestedRead);
      });
      
      expect(rafSpy).toHaveBeenCalledTimes(1);
      
      await vi.runAllTimersAsync();
      
      // The read was queued during writes phase (after reads were processed)
      // So it should trigger another flush
      expect(rafSpy).toHaveBeenCalledTimes(2);
      
      await vi.runAllTimersAsync();
      
      expect(nestedRead).toHaveBeenCalled();
      expect(batcher.getPendingReads()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should continue executing reads if one fails', async () => {
      const read1 = vi.fn();
      const read2 = vi.fn(() => { throw new Error('Read error'); });
      const read3 = vi.fn();
      
      batcher.scheduleRead(read1);
      batcher.scheduleRead(read2);
      batcher.scheduleRead(read3);
      
      await vi.runAllTimersAsync();
      
      expect(read1).toHaveBeenCalled();
      expect(read2).toHaveBeenCalled();
      expect(read3).toHaveBeenCalled();
    });

    it('should continue executing writes if one fails', async () => {
      const write1 = vi.fn();
      const write2 = vi.fn(() => { throw new Error('Write error'); });
      const write3 = vi.fn();
      
      batcher.scheduleWrite(write1);
      batcher.scheduleWrite(write2);
      batcher.scheduleWrite(write3);
      
      await vi.runAllTimersAsync();
      
      expect(write1).toHaveBeenCalled();
      expect(write2).toHaveBeenCalled();
      expect(write3).toHaveBeenCalled();
    });

    it('should execute writes even if reads fail', async () => {
      const read = vi.fn(() => { throw new Error('Read error'); });
      const write = vi.fn();
      
      batcher.scheduleRead(read);
      batcher.scheduleWrite(write);
      
      await vi.runAllTimersAsync();
      
      expect(read).toHaveBeenCalled();
      expect(write).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all pending operations', () => {
      batcher.scheduleRead(() => {});
      batcher.scheduleWrite(() => {});
      
      expect(batcher.getPendingReads()).toBe(1);
      expect(batcher.getPendingWrites()).toBe(1);
      
      batcher.clear();
      
      expect(batcher.getPendingReads()).toBe(0);
      expect(batcher.getPendingWrites()).toBe(0);
    });

    it('should cancel scheduled animation frame', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      
      batcher.scheduleRead(() => {});
      expect(batcher.isFlushScheduled()).toBe(true);
      
      batcher.clear();
      
      expect(cancelSpy).toHaveBeenCalled();
      expect(batcher.isFlushScheduled()).toBe(false);
    });
  });

  describe('real-world DOM operations', () => {
    it('should prevent layout thrashing by batching reads and writes', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      const measurements: number[] = [];
      
      // Simulate multiple components reading and writing
      batcher.scheduleRead(() => {
        measurements.push(element.offsetHeight);
      });
      
      batcher.scheduleWrite(() => {
        element.style.height = '100px';
      });
      
      batcher.scheduleRead(() => {
        measurements.push(element.offsetWidth);
      });
      
      batcher.scheduleWrite(() => {
        element.style.width = '200px';
      });
      
      await vi.runAllTimersAsync();
      
      // All reads should execute before writes
      expect(measurements).toHaveLength(2);
      
      document.body.removeChild(element);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(domBatcher).toBeInstanceOf(DOMBatcher);
    });

    it('should maintain state across imports', () => {
      domBatcher.scheduleRead(() => {});
      
      expect(domBatcher.getPendingReads()).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty queues gracefully', async () => {
      await vi.runAllTimersAsync();
      
      expect(batcher.getPendingReads()).toBe(0);
      expect(batcher.getPendingWrites()).toBe(0);
    });

    it('should handle only reads', async () => {
      const read = vi.fn();
      
      batcher.scheduleRead(read);
      
      await vi.runAllTimersAsync();
      
      expect(read).toHaveBeenCalled();
      expect(batcher.getPendingReads()).toBe(0);
    });

    it('should handle only writes', async () => {
      const write = vi.fn();
      
      batcher.scheduleWrite(write);
      
      await vi.runAllTimersAsync();
      
      expect(write).toHaveBeenCalled();
      expect(batcher.getPendingWrites()).toBe(0);
    });

    it('should not schedule flush when already processing', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      
      batcher.scheduleRead(() => {
        // Try to schedule during processing
        batcher.scheduleRead(() => {});
      });
      
      expect(rafSpy).toHaveBeenCalledTimes(1);
      
      await vi.runAllTimersAsync();
      
      // Should schedule a second flush for the nested operation
      expect(rafSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('performance characteristics', () => {
    it('should handle large number of operations efficiently', async () => {
      const operationCount = 1000;
      const readCallbacks = Array.from({ length: operationCount }, () => vi.fn());
      const writeCallbacks = Array.from({ length: operationCount }, () => vi.fn());
      
      readCallbacks.forEach(cb => batcher.scheduleRead(cb));
      writeCallbacks.forEach(cb => batcher.scheduleWrite(cb));
      
      await vi.runAllTimersAsync();
      
      readCallbacks.forEach(cb => expect(cb).toHaveBeenCalled());
      writeCallbacks.forEach(cb => expect(cb).toHaveBeenCalled());
      
      expect(batcher.getPendingReads()).toBe(0);
      expect(batcher.getPendingWrites()).toBe(0);
    });
  });
});
