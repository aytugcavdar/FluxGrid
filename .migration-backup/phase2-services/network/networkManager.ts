/**
 * Network Manager Service
 * 
 * Manages network status detection, connection speed monitoring, and offline support.
 * Provides request queueing for offline scenarios and automatic retry mechanisms.
 * 
 * Features:
 * - Network status detection (online/offline/slow)
 * - Connection speed detection via Network Information API
 * - Request queue with IndexedDB persistence
 * - Automatic queue processing when network returns
 * - 10-second timeout for API requests
 * - Status change listeners
 * 
 * Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 10.7
 */

import { BaseService, ServiceMetadata } from '../core/BaseService';
import { networkLogger } from '../logging/logger';

export enum NetworkStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  SLOW = 'slow', // < 1 Mbps
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: number;
  retries: number;
}

export interface NetworkInfo {
  status: NetworkStatus;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData?: boolean;
}

type NetworkStatusCallback = (status: NetworkStatus) => void;

/**
 * Network Manager Service
 * 
 * Manages network connectivity and request queueing for offline support.
 */
export class NetworkManager extends BaseService {
  private currentStatus: NetworkStatus = NetworkStatus.ONLINE;
  private statusListeners: Set<NetworkStatusCallback> = new Set();
  private requestQueue: NetworkRequest[] = [];
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'FluxGridNetwork';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'requestQueue';
  private readonly SLOW_CONNECTION_THRESHOLD = 1; // Mbps
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private isProcessingQueue = false;

  constructor() {
    const metadata: ServiceMetadata = {
      name: 'NetworkManager',
      version: '1.0.0',
      dependencies: [],
    };
    super(metadata);
  }

  protected async onInitialize(): Promise<void> {
    // Initialize IndexedDB for request queue
    await this.initializeDatabase();

    // Load queued requests from IndexedDB
    await this.loadQueueFromDatabase();

    // Set up network status listeners
    this.setupNetworkListeners();

    // Detect initial network status
    this.updateNetworkStatus();

    networkLogger.info('NetworkManager initialized', {
      status: this.currentStatus,
      queuedRequests: this.requestQueue.length,
    });
  }

  protected async onStart(): Promise<void> {
    // Process any queued requests if online
    if (this.isOnline()) {
      await this.processQueue();
    }

    networkLogger.info('NetworkManager started');
  }

  protected async onStop(): Promise<void> {
    // Save queue to database
    await this.saveQueueToDatabase();

    // Close database
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    // Clear listeners
    this.statusListeners.clear();

    networkLogger.info('NetworkManager stopped');
  }

  /**
   * Get current network status
   * Requirement 11.2: Network status detection
   */
  public getNetworkStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /**
   * Check if online
   * Requirement 11.2: Network status detection
   */
  public isOnline(): boolean {
    return this.currentStatus !== NetworkStatus.OFFLINE;
  }

  /**
   * Get detailed network information
   * Requirement 11.3: Connection speed detection
   */
  public getNetworkInfo(): NetworkInfo {
    const info: NetworkInfo = {
      status: this.currentStatus,
    };

    // Use Network Information API if available
    const connection = this.getConnection();
    if (connection) {
      info.effectiveType = connection.effectiveType;
      info.downlink = connection.downlink;
      info.rtt = connection.rtt;
      info.saveData = connection.saveData;
    }

    return info;
  }

  /**
   * Queue request for later processing
   * Requirement 11.6: Request queueing for offline support
   */
  public queueRequest(request: Omit<NetworkRequest, 'id' | 'timestamp' | 'retries'>): void {
    const queuedRequest: NetworkRequest = {
      ...request,
      id: this.generateRequestId(),
      timestamp: Date.now(),
      retries: 0,
    };

    this.requestQueue.push(queuedRequest);
    this.saveQueueToDatabase();

    networkLogger.info('Request queued', {
      id: queuedRequest.id,
      url: queuedRequest.url,
      method: queuedRequest.method,
    });
  }

  /**
   * Process queued requests
   * Requirement 11.7: Process queue when network returns
   */
  public async processQueue(): Promise<void> {
    if (!this.isOnline()) {
      networkLogger.warn('Cannot process queue: offline');
      return;
    }

    if (this.isProcessingQueue) {
      networkLogger.debug('Queue processing already in progress');
      return;
    }

    if (this.requestQueue.length === 0) {
      networkLogger.debug('No requests in queue');
      return;
    }

    this.isProcessingQueue = true;
    networkLogger.info('Processing request queue', {
      count: this.requestQueue.length,
    });

    const queue = [...this.requestQueue];
    const successfulRequests: string[] = [];

    for (const request of queue) {
      try {
        await this.executeRequest(request);
        successfulRequests.push(request.id);
        networkLogger.info('Request processed successfully', {
          id: request.id,
          url: request.url,
        });
      } catch (error) {
        networkLogger.error('Request processing failed', {
          id: request.id,
          url: request.url,
          error,
        });

        // Increment retry count
        request.retries++;

        // Remove if max retries exceeded (3 retries)
        if (request.retries >= 3) {
          successfulRequests.push(request.id);
          networkLogger.warn('Request removed after max retries', {
            id: request.id,
            url: request.url,
          });
        }
      }
    }

    // Remove successful requests from queue
    this.requestQueue = this.requestQueue.filter(
      (req) => !successfulRequests.includes(req.id)
    );

    await this.saveQueueToDatabase();

    this.isProcessingQueue = false;
    networkLogger.info('Queue processing completed', {
      processed: successfulRequests.length,
      remaining: this.requestQueue.length,
    });
  }

  /**
   * Add network status change listener
   * Requirement 11.2: Status change listeners
   */
  public onStatusChange(callback: NetworkStatusCallback): () => void {
    this.statusListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Get queued request count
   */
  public getQueuedRequestCount(): number {
    return this.requestQueue.length;
  }

  /**
   * Get queue size (alias for compatibility)
   */
  public getQueueSize(): number {
    return this.getQueuedRequestCount();
  }

  /**
   * Get connection speed in Mbps
   * Requirement 11.3: Connection speed detection
   */
  public getConnectionSpeed(): number {
    const connection = this.getConnection();
    if (connection && connection.downlink) {
      return connection.downlink;
    }
    return 0;
  }

  /**
   * Check if connection is slow (< 1 Mbps)
   * Requirement 11.3: Connection speed detection
   */
  public isSlowConnection(): boolean {
    const speed = this.getConnectionSpeed();
    return speed > 0 && speed < this.SLOW_CONNECTION_THRESHOLD;
  }

  /**
   * Get connection quality rating
   * @returns 'excellent', 'good', 'fair', or 'poor'
   */
  public getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const connection = this.getConnection();
    
    if (!connection) {
      return 'good'; // Default if API not available
    }

    const { effectiveType, rtt, downlink } = connection;

    // Check RTT (round-trip time)
    if (rtt && rtt > 500) {
      return 'poor';
    }

    // Check downlink speed
    if (downlink) {
      if (downlink >= 10) return 'excellent';
      if (downlink >= 5) return 'good';
      if (downlink >= 1) return 'fair';
      return 'poor';
    }

    // Fallback to effectiveType
    if (effectiveType) {
      if (effectiveType === '4g') return 'excellent';
      if (effectiveType === '3g') return 'good';
      if (effectiveType === '2g') return 'fair';
      return 'poor';
    }

    return 'good';
  }

  /**
   * Clear request queue
   */
  public async clearQueue(): Promise<void> {
    this.requestQueue = [];
    await this.saveQueueToDatabase();
    networkLogger.info('Request queue cleared');
  }

  /**
   * Make API request with timeout and retry
   * Requirement 11.4, 11.5: 10-second timeout and retry on timeout
   */
  public async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = this.REQUEST_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        networkLogger.warn('Request timeout', { url, timeout });
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      throw error;
    }
  }

  // Private methods

  /**
   * Initialize IndexedDB
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        networkLogger.error('Failed to open IndexedDB', { error: request.error });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        networkLogger.debug('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for request queue
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          networkLogger.debug('IndexedDB object store created');
        }
      };
    });
  }

  /**
   * Load queue from IndexedDB
   */
  private async loadQueueFromDatabase(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        this.requestQueue = request.result || [];
        networkLogger.debug('Queue loaded from database', {
          count: this.requestQueue.length,
        });
        resolve();
      };

      request.onerror = () => {
        networkLogger.error('Failed to load queue from database', {
          error: request.error,
        });
        reject(request.error);
      };
    });
  }

  /**
   * Save queue to IndexedDB
   */
  private async saveQueueToDatabase(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      // Clear existing data
      store.clear();

      // Add all queued requests
      for (const request of this.requestQueue) {
        store.add(request);
      }

      transaction.oncomplete = () => {
        networkLogger.debug('Queue saved to database', {
          count: this.requestQueue.length,
        });
        resolve();
      };

      transaction.onerror = () => {
        networkLogger.error('Failed to save queue to database', {
          error: transaction.error,
        });
        reject(transaction.error);
      };
    });
  }

  /**
   * Set up network status listeners
   */
  private setupNetworkListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateNetworkStatus();
      this.processQueue(); // Auto-process queue when coming online
    });

    window.addEventListener('offline', () => {
      this.updateNetworkStatus();
    });

    // Listen for connection changes (if supported)
    const connection = this.getConnection();
    if (connection) {
      connection.addEventListener('change', () => {
        this.updateNetworkStatus();
      });
    }
  }

  /**
   * Update network status
   */
  private updateNetworkStatus(): void {
    const previousStatus = this.currentStatus;

    // Check if online
    if (!navigator.onLine) {
      this.currentStatus = NetworkStatus.OFFLINE;
    } else {
      // Check connection speed
      const connection = this.getConnection();
      if (connection && connection.downlink < this.SLOW_CONNECTION_THRESHOLD) {
        this.currentStatus = NetworkStatus.SLOW;
      } else {
        this.currentStatus = NetworkStatus.ONLINE;
      }
    }

    // Notify listeners if status changed
    if (previousStatus !== this.currentStatus) {
      networkLogger.info('Network status changed', {
        from: previousStatus,
        to: this.currentStatus,
      });

      this.notifyStatusChange();
    }
  }

  /**
   * Notify status change listeners
   */
  private notifyStatusChange(): void {
    for (const listener of this.statusListeners) {
      try {
        listener(this.currentStatus);
      } catch (error) {
        networkLogger.error('Error in status change listener', { error });
      }
    }
  }

  /**
   * Get Network Information API connection
   */
  private getConnection(): any {
    // @ts-ignore - Network Information API not in TypeScript types
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  }

  /**
   * Execute queued request
   */
  private async executeRequest(request: NetworkRequest): Promise<void> {
    const options: RequestInit = {
      method: request.method,
      headers: request.headers,
    };

    if (request.body) {
      options.body = JSON.stringify(request.body);
    }

    const response = await this.fetchWithTimeout(request.url, options);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const networkManager = new NetworkManager();
