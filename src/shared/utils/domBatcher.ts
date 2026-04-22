/**
 * DOMBatcher - Batches DOM read and write operations to prevent layout thrashing
 * 
 * Layout thrashing occurs when JavaScript alternates between reading and writing
 * to the DOM, forcing the browser to recalculate layout multiple times per frame.
 * 
 * This utility batches all DOM reads and writes, executing them in optimal order:
 * 1. All reads first (measure phase)
 * 2. All writes second (mutate phase)
 * 
 * This ensures the browser only needs to recalculate layout once per frame.
 * 
 * Usage:
 * ```typescript
 * import { domBatcher } from './domBatcher';
 * 
 * // Schedule a DOM read
 * domBatcher.scheduleRead(() => {
 *   const height = element.offsetHeight;
 *   // Use height...
 * });
 * 
 * // Schedule a DOM write
 * domBatcher.scheduleWrite(() => {
 *   element.style.height = '100px';
 * });
 * ```
 */

type DOMCallback = () => void;

export class DOMBatcher {
  private readQueue: DOMCallback[] = [];
  private writeQueue: DOMCallback[] = [];
  private rafId: number | null = null;
  private isProcessing = false;

  /**
   * Schedule a DOM read operation
   * Reads are executed before writes to prevent layout thrashing
   * @param callback - Function that reads from the DOM
   */
  scheduleRead(callback: DOMCallback): void {
    this.readQueue.push(callback);
    this.scheduleFlush();
  }

  /**
   * Schedule a DOM write operation
   * Writes are executed after reads to prevent layout thrashing
   * @param callback - Function that writes to the DOM
   */
  scheduleWrite(callback: DOMCallback): void {
    this.writeQueue.push(callback);
    this.scheduleFlush();
  }

  /**
   * Schedule a flush of the queues in the next animation frame
   */
  private scheduleFlush(): void {
    if (this.rafId !== null || this.isProcessing) {
      // Already scheduled or currently processing
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.flush();
    });
  }

  /**
   * Flush all queued operations in optimal order (reads → writes)
   */
  private flush(): void {
    this.rafId = null;
    this.isProcessing = true;

    try {
      // Execute all reads first
      const reads = this.readQueue.splice(0);
      reads.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('[DOMBatcher] Read callback error:', error);
        }
      });

      // Then execute all writes
      const writes = this.writeQueue.splice(0);
      writes.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('[DOMBatcher] Write callback error:', error);
        }
      });
    } finally {
      this.isProcessing = false;

      // If new operations were queued during processing, schedule another flush
      if (this.readQueue.length > 0 || this.writeQueue.length > 0) {
        this.scheduleFlush();
      }
    }
  }

  /**
   * Clear all pending operations (useful for cleanup)
   */
  clear(): void {
    this.readQueue = [];
    this.writeQueue = [];
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Get the number of pending read operations
   */
  getPendingReads(): number {
    return this.readQueue.length;
  }

  /**
   * Get the number of pending write operations
   */
  getPendingWrites(): number {
    return this.writeQueue.length;
  }

  /**
   * Check if a flush is currently scheduled
   */
  isFlushScheduled(): boolean {
    return this.rafId !== null;
  }
}

// Export singleton instance
export const domBatcher = new DOMBatcher();
