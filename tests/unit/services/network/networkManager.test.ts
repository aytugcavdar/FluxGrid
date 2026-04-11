import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NetworkManager } from '@services/network/networkManager';

// Mock Navigator
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  },
};

describe('NetworkManager', () => {
  let manager: NetworkManager;

  beforeEach(() => {
    vi.stubGlobal('navigator', mockNavigator);
    manager = new NetworkManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Network Status Detection', () => {
    it('should detect online status', () => {
      mockNavigator.onLine = true;
      
      expect(manager.isOnline()).toBe(true);
    });

    it('should detect offline status', () => {
      mockNavigator.onLine = false;
      
      expect(manager.isOnline()).toBe(false);
    });

    it('should listen to status changes', () => {
      const callback = vi.fn();
      manager.onStatusChange(callback);
      
      // Simulate going offline
      mockNavigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
      
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('should listen to online event', () => {
      const callback = vi.fn();
      manager.onStatusChange(callback);
      
      // Simulate going online
      mockNavigator.onLine = true;
      window.dispatchEvent(new Event('online'));
      
      expect(callback).toHaveBeenCalledWith(true);
    });
  });

  describe('Connection Speed Detection', () => {
    it('should detect 4G connection', () => {
      mockNavigator.connection.effectiveType = '4g';
      
      const speed = manager.getConnectionSpeed();
      expect(speed).toBe('4g');
    });

    it('should detect 3G connection', () => {
      mockNavigator.connection.effectiveType = '3g';
      
      const speed = manager.getConnectionSpeed();
      expect(speed).toBe('3g');
    });

    it('should detect slow connection', () => {
      mockNavigator.connection.effectiveType = 'slow-2g';
      
      const isSlow = manager.isSlowConnection();
      expect(isSlow).toBe(true);
    });

    it('should detect fast connection', () => {
      mockNavigator.connection.effectiveType = '4g';
      
      const isSlow = manager.isSlowConnection();
      expect(isSlow).toBe(false);
    });
  });

  describe('Request Queue', () => {
    it('should queue requests when offline', async () => {
      mockNavigator.onLine = false;
      
      await manager.queueRequest({
        url: '/api/test',
        method: 'POST',
        data: { test: 'data' },
      });
      
      const queueSize = manager.getQueueSize();
      expect(queueSize).toBe(1);
    });

    it('should process queue when online', async () => {
      mockNavigator.onLine = false;
      
      // Queue multiple requests
      await manager.queueRequest({ url: '/api/test1', method: 'GET' });
      await manager.queueRequest({ url: '/api/test2', method: 'POST', data: {} });
      
      expect(manager.getQueueSize()).toBe(2);
      
      // Go online and process queue
      mockNavigator.onLine = true;
      await manager.processQueue();
      
      expect(manager.getQueueSize()).toBe(0);
    });

    it('should retry failed requests', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      
      vi.stubGlobal('fetch', mockFetch);
      
      await manager.queueRequest({ url: '/api/test', method: 'GET' });
      await manager.processQueue();
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should remove failed requests after max retries', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);
      
      await manager.queueRequest({ url: '/api/test', method: 'GET' });
      
      // Try to process multiple times
      for (let i = 0; i < 5; i++) {
        await manager.processQueue();
      }
      
      // Should eventually give up and remove from queue
      expect(manager.getQueueSize()).toBe(0);
    });
  });

  describe('Request Timeout', () => {
    it('should timeout after 10 seconds', async () => {
      const mockFetch = vi.fn(() => new Promise(resolve => setTimeout(resolve, 15000)));
      vi.stubGlobal('fetch', mockFetch);
      
      await expect(
        manager.fetchWithTimeout('/api/test', { timeout: 10000 })
      ).rejects.toThrow(/timeout/i);
    });

    it('should succeed before timeout', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });
      vi.stubGlobal('fetch', mockFetch);
      
      const result = await manager.fetchWithTimeout('/api/test', { timeout: 10000 });
      expect(result).toBeDefined();
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry on network error', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      
      vi.stubGlobal('fetch', mockFetch);
      
      const result = await manager.fetchWithRetry('/api/test', { maxRetries: 3 });
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });

    it('should use exponential backoff', async () => {
      const delays: number[] = [];
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);
      
      const originalSetTimeout = global.setTimeout;
      vi.stubGlobal('setTimeout', (fn: Function, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0);
      });
      
      try {
        await manager.fetchWithRetry('/api/test', { maxRetries: 3 });
      } catch (error) {
        // Expected to fail
      }
      
      // Check exponential backoff: 1s, 2s, 4s
      expect(delays[0]).toBe(1000);
      expect(delays[1]).toBe(2000);
      expect(delays[2]).toBe(4000);
    });
  });

  describe('Connection Quality', () => {
    it('should calculate connection quality', () => {
      mockNavigator.connection.effectiveType = '4g';
      mockNavigator.connection.downlink = 10;
      mockNavigator.connection.rtt = 50;
      
      const quality = manager.getConnectionQuality();
      
      expect(quality).toBe('excellent');
    });

    it('should detect poor connection', () => {
      mockNavigator.connection.effectiveType = 'slow-2g';
      mockNavigator.connection.downlink = 0.5;
      mockNavigator.connection.rtt = 500;
      
      const quality = manager.getConnectionQuality();
      
      expect(quality).toBe('poor');
    });
  });
});
