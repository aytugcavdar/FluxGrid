import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NetworkManager, NetworkStatus } from '@services/network/networkManager';

const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  },
};

describe('NetworkManager', () => {
  let manager: NetworkManager;

  beforeEach(() => {
    vi.stubGlobal('navigator', mockNavigator);
    manager = new NetworkManager();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reports default online status and connection info', () => {
    expect(manager.getNetworkStatus()).toBe(NetworkStatus.ONLINE);
    expect(manager.isOnline()).toBe(true);
    expect(manager.getNetworkInfo()).toMatchObject({
      status: NetworkStatus.ONLINE,
      effectiveType: '4g',
      downlink: 10,
    });
  });

  it('queues and clears requests using the current request shape', async () => {
    manager.queueRequest({
      url: '/api/test',
      method: 'POST',
      body: { ok: true },
    });

    expect(manager.getQueueSize()).toBe(1);

    await manager.clearQueue();
    expect(manager.getQueueSize()).toBe(0);
  });

  it('derives connection quality from Network Information API values', () => {
    expect(manager.getConnectionSpeed()).toBe(10);
    expect(manager.isSlowConnection()).toBe(false);
    expect(manager.getConnectionQuality()).toBe('excellent');
  });
});
