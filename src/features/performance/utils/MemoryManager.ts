/**
 * Memory Manager with Object Pooling
 * 
 * Manages object pools and resource disposal to minimize garbage collection
 */

import type { ObjectPool, MemoryStats, PoolStats } from '../types';

interface Disposable {
  dispose(): void;
}

export class MemoryManager {
  private pools: Map<string, ObjectPool<any>>;
  private stats: MemoryStats;
  private cleanupInterval: NodeJS.Timeout | null;
  
  constructor() {
    this.pools = new Map();
    this.stats = {
      totalUsage: 0,
      poolStats: new Map(),
      disposedCount: 0,
      gcHints: 0
    };
    this.cleanupInterval = null;
  }
  
  /**
   * Create a new object pool
   */
  createPool<T>(config: Omit<ObjectPool<T>, 'active' | 'inactive'>): void {
    const pool: ObjectPool<T> = {
      ...config,
      active: new Set(),
      inactive: []
    };
    
    // Pre-allocate initial objects
    for (let i = 0; i < config.initialSize; i++) {
      const obj = config.factory();
      pool.inactive.push(obj);
    }
    
    this.pools.set(config.name, pool);
    
    // Initialize pool stats
    this.stats.poolStats.set(config.name, {
      name: config.name,
      active: 0,
      inactive: config.initialSize,
      total: config.initialSize,
      hits: 0,
      misses: 0
    });
    
    console.log(`[MemoryManager] Created pool "${config.name}" with ${config.initialSize} objects`);
  }
  
  /**
   * Acquire an object from the pool
   */
  acquire<T>(poolName: string): T {
    const pool = this.pools.get(poolName) as ObjectPool<T> | undefined;
    
    if (!pool) {
      throw new Error(`[MemoryManager] Pool "${poolName}" does not exist`);
    }
    
    const poolStats = this.stats.poolStats.get(poolName)!;
    
    let obj: T;
    
    if (pool.inactive.length > 0) {
      // Pool hit: reuse existing object
      obj = pool.inactive.pop()!;
      poolStats.hits++;
    } else {
      // Pool miss: create new object
      if (pool.active.size >= pool.maxSize) {
        console.warn(`[MemoryManager] Pool "${poolName}" at max capacity (${pool.maxSize})`);
      }
      obj = pool.factory();
      poolStats.misses++;
      poolStats.total++;
    }
    
    pool.active.add(obj);
    poolStats.active = pool.active.size;
    poolStats.inactive = pool.inactive.length;
    
    return obj;
  }
  
  /**
   * Release an object back to the pool
   */
  release<T>(poolName: string, obj: T): void {
    const pool = this.pools.get(poolName) as ObjectPool<T> | undefined;
    
    if (!pool) {
      console.warn(`[MemoryManager] Cannot release to non-existent pool "${poolName}"`);
      return;
    }
    
    if (!pool.active.has(obj)) {
      console.warn(`[MemoryManager] Object not in active set for pool "${poolName}"`);
      return;
    }
    
    // Reset object to default state
    pool.reset(obj);
    
    // Move from active to inactive
    pool.active.delete(obj);
    
    // Only keep up to maxSize objects in pool
    if (pool.inactive.length < pool.maxSize) {
      pool.inactive.push(obj);
    } else {
      // Dispose excess object
      if ('dispose' in (obj as any)) {
        (obj as any).dispose();
      }
    }
    
    const poolStats = this.stats.poolStats.get(poolName)!;
    poolStats.active = pool.active.size;
    poolStats.inactive = pool.inactive.length;
  }
  
  /**
   * Dispose a resource immediately
   */
  dispose(resource: Disposable): void {
    try {
      resource.dispose();
      this.stats.disposedCount++;
    } catch (error) {
      console.error('[MemoryManager] Disposal failed:', error);
    }
  }
  
  /**
   * Start periodic cleanup
   */
  startCleanup(): void {
    if (this.cleanupInterval) {
      return; // Already running
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every 60 seconds
    
    console.log('[MemoryManager] Started periodic cleanup (60s interval)');
  }
  
  /**
   * Stop periodic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[MemoryManager] Stopped periodic cleanup');
    }
  }
  
  /**
   * Run cleanup cycle
   */
  cleanup(): void {
    console.log('[MemoryManager] Running cleanup cycle...');
    
    // 1. Trim pools to initial size
    this.pools.forEach((pool, name) => {
      while (pool.inactive.length > pool.initialSize) {
        const obj = pool.inactive.pop();
        if (obj && 'dispose' in obj) {
          (obj as any).dispose();
        }
      }
      
      const poolStats = this.stats.poolStats.get(name)!;
      poolStats.inactive = pool.inactive.length;
      poolStats.total = pool.active.size + pool.inactive.length;
    });
    
    // 2. Check memory usage
    const memoryUsage = this.getMemoryUsage();
    this.stats.totalUsage = memoryUsage;
    
    if (memoryUsage > 180) {
      console.warn(`[MemoryManager] High memory usage: ${memoryUsage}MB - triggering aggressive cleanup`);
      this.aggressiveCleanup();
    }
    
    // 3. Trigger GC hint
    this.triggerGC();
    
    console.log('[MemoryManager] Cleanup complete. Memory:', memoryUsage, 'MB');
  }
  
  /**
   * Aggressive cleanup when memory is high
   */
  private aggressiveCleanup(): void {
    // Clear all inactive pooled objects
    this.pools.forEach((pool, name) => {
      pool.inactive.forEach(obj => {
        if ('dispose' in obj) {
          (obj as any).dispose();
        }
      });
      pool.inactive = [];
      
      const poolStats = this.stats.poolStats.get(name)!;
      poolStats.inactive = 0;
      poolStats.total = pool.active.size;
    });
    
    console.log('[MemoryManager] Aggressive cleanup completed');
  }
  
  /**
   * Get current memory usage in MB
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }
  
  /**
   * Trigger garbage collection hint
   */
  private triggerGC(): void {
    // Modern browsers will GC automatically, but we can hint
    if ('gc' in window) {
      (window as any).gc();
      this.stats.gcHints++;
    }
  }
  
  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    this.stats.totalUsage = this.getMemoryUsage();
    return { ...this.stats };
  }
}

// Singleton instance
export const memoryManager = new MemoryManager();
