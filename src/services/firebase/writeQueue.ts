import { syncGameData, syncScore, syncModeStats, syncDailyChallenge } from './syncManager';
import type { WriteOperation } from './types';

const QUEUE_STORAGE_KEY = 'firebase_write_queue';
const FAILED_QUEUE_STORAGE_KEY = 'firebase_failed_queue';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export class WriteQueue {
  private queue: WriteOperation[] = [];
  private failedQueue: WriteOperation[] = [];
  private isProcessing = false;

  constructor() {
    this.loadQueue();
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const queueData = localStorage.getItem(QUEUE_STORAGE_KEY);
      const failedData = localStorage.getItem(FAILED_QUEUE_STORAGE_KEY);

      if (queueData) {
        this.queue = JSON.parse(queueData);
      }

      if (failedData) {
        this.failedQueue = JSON.parse(failedData);
      }
    } catch (error) {
      console.error('Failed to load write queue:', error);
      this.queue = [];
      this.failedQueue = [];
    }
  }

  /**
   * Persist queue to localStorage
   */
  private persistQueue(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      localStorage.setItem(FAILED_QUEUE_STORAGE_KEY, JSON.stringify(this.failedQueue));
    } catch (error) {
      console.error('Failed to persist write queue:', error);
    }
  }

  /**
   * Add operation to queue
   */
  enqueue(operation: Omit<WriteOperation, 'id' | 'timestamp' | 'retries'>): void {
    const queuedOperation: WriteOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedOperation);
    this.persistQueue();

    // Try to flush immediately if online
    if (navigator.onLine) {
      this.flush();
    }
  }

  /**
   * Execute a single write operation
   */
  private async executeWrite(operation: WriteOperation): Promise<void> {
    const { type, uid, data } = operation;

    switch (type) {
      case 'score':
        await syncScore(
          uid,
          data.mode,
          data.score,
          data.displayName,
          data.photoURL
        );
        break;

      case 'stats':
        await syncModeStats(uid, data.mode, data.stats);
        break;

      case 'daily':
        await syncDailyChallenge(uid, data.date, data.dailyData);
        break;

      case 'achievement':
        await syncGameData(uid, data);
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private getBackoffDelay(retries: number): number {
    return INITIAL_BACKOFF_MS * Math.pow(2, retries);
  }

  /**
   * Wait for specified milliseconds
   */
  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Move operation to failed queue
   */
  private moveToFailedQueue(operation: WriteOperation): void {
    this.failedQueue.push(operation);
    this.persistQueue();
    console.error('Operation moved to failed queue:', operation);
  }

  /**
   * Remove operation from queue
   */
  private removeFromQueue(operationId: string): void {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    this.persistQueue();
  }

  /**
   * Flush all queued writes
   */
  async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    if (!navigator.onLine) {
      console.log('Offline - write queue will flush when connection is restored');
      return;
    }

    this.isProcessing = true;

    // Process queue in chronological order
    const operations = [...this.queue];

    for (const operation of operations) {
      try {
        // Apply exponential backoff if this is a retry
        if (operation.retries > 0) {
          const delay = this.getBackoffDelay(operation.retries);
          await this.wait(delay);
        }

        // Execute the write
        await this.executeWrite(operation);

        // Success - remove from queue
        this.removeFromQueue(operation.id);
      } catch (error) {
        console.error('Write operation failed:', error);

        // Increment retry count
        operation.retries++;

        // Check if max retries exceeded
        if (operation.retries >= MAX_RETRIES) {
          this.moveToFailedQueue(operation);
          this.removeFromQueue(operation.id);
        } else {
          // Update queue with new retry count
          this.persistQueue();
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get failed queue size
   */
  getFailedQueueSize(): number {
    return this.failedQueue.length;
  }

  /**
   * Clear failed queue (for manual intervention)
   */
  clearFailedQueue(): void {
    this.failedQueue = [];
    localStorage.removeItem(FAILED_QUEUE_STORAGE_KEY);
  }

  /**
   * Retry failed operations
   */
  retryFailedOperations(): void {
    this.queue.push(...this.failedQueue.map((op) => ({ ...op, retries: 0 })));
    this.failedQueue = [];
    this.persistQueue();
    this.flush();
  }
}

// Singleton instance
export const writeQueue = new WriteQueue();

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Connection restored - flushing write queue');
    writeQueue.flush();
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost - writes will be queued');
  });
}
