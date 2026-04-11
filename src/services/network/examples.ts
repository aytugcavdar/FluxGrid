/**
 * Network Manager Usage Examples
 * 
 * Demonstrates common patterns and use cases for the Network Manager service.
 */

import { networkManager, NetworkStatus } from './networkManager';
import { analyticsService } from '../analytics/analyticsService';
import { logger } from '../logging/logger';

// ============================================================================
// Example 1: Basic Network Status Check
// ============================================================================

export function example1_BasicStatusCheck() {
  // Check if online
  const isOnline = networkManager.isOnline();
  console.log('Is online:', isOnline);

  // Get current status
  const status = networkManager.getNetworkStatus();
  console.log('Network status:', status);

  // Get detailed network info
  const info = networkManager.getNetworkInfo();
  console.log('Network info:', {
    status: info.status,
    effectiveType: info.effectiveType,
    downlink: info.downlink,
    rtt: info.rtt,
  });
}

// ============================================================================
// Example 2: API Request with Timeout
// ============================================================================

export async function example2_ApiRequestWithTimeout() {
  const url = 'https://api.fluxgrid.com/scores';
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123',
    },
    body: JSON.stringify({
      score: 1000,
      level: 5,
    }),
  };

  try {
    // Make request with 10-second timeout
    const response = await networkManager.fetchWithTimeout(url, options);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Score submitted:', data);
  } catch (error) {
    console.error('Request failed:', error);

    // Queue for later if timeout or offline
    if (error instanceof Error && error.message.includes('timeout')) {
      networkManager.queueRequest({
        url,
        method: 'POST',
        headers: options.headers,
        body: JSON.parse(options.body),
      });
      console.log('Request queued for later');
    }
  }
}

// ============================================================================
// Example 3: Request Queueing for Offline Support
// ============================================================================

export async function example3_RequestQueueing() {
  const scoreData = {
    score: 1500,
    level: 10,
    timestamp: Date.now(),
  };

  // Check if online before making request
  if (!networkManager.isOnline()) {
    console.log('Offline - queueing request');
    networkManager.queueRequest({
      url: 'https://api.fluxgrid.com/scores',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: scoreData,
    });
    return;
  }

  // Make request if online
  try {
    const response = await networkManager.fetchWithTimeout(
      'https://api.fluxgrid.com/scores',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      }
    );

    console.log('Score submitted successfully');
  } catch (error) {
    // Queue on error
    networkManager.queueRequest({
      url: 'https://api.fluxgrid.com/scores',
      method: 'POST',
      body: scoreData,
    });
    console.log('Request failed - queued for later');
  }
}

// ============================================================================
// Example 4: Network Status Listener
// ============================================================================

export function example4_StatusListener() {
  // Subscribe to network status changes
  const unsubscribe = networkManager.onStatusChange((status) => {
    console.log('Network status changed:', status);

    switch (status) {
      case NetworkStatus.ONLINE:
        console.log('Back online! Processing queued requests...');
        // UI: Hide offline indicator
        // UI: Show success message
        break;

      case NetworkStatus.OFFLINE:
        console.log('Gone offline. Requests will be queued.');
        // UI: Show offline indicator
        // UI: Disable online-only features
        break;

      case NetworkStatus.SLOW:
        console.log('Slow connection detected.');
        // UI: Show slow connection warning
        // UI: Reduce quality settings
        break;
    }

    // Log to analytics
    analyticsService.logEvent('network_status_changed', {
      status,
      queuedRequests: networkManager.getQueuedRequestCount(),
    });
  });

  // Unsubscribe when done (e.g., component unmount)
  return unsubscribe;
}

// ============================================================================
// Example 5: Manual Queue Processing
// ============================================================================

export async function example5_ManualQueueProcessing() {
  // Check queue status
  const queuedCount = networkManager.getQueuedRequestCount();
  console.log('Queued requests:', queuedCount);

  if (queuedCount === 0) {
    console.log('No requests to process');
    return;
  }

  // Check if online
  if (!networkManager.isOnline()) {
    console.log('Cannot process queue: offline');
    return;
  }

  // Process queue
  console.log('Processing queue...');
  await networkManager.processQueue();

  // Check remaining
  const remaining = networkManager.getQueuedRequestCount();
  console.log('Queue processed. Remaining:', remaining);
}

// ============================================================================
// Example 6: Retry Strategy with Exponential Backoff
// ============================================================================

export async function example6_RetryStrategy(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries}`);

      const response = await networkManager.fetchWithTimeout(url, options);

      if (response.ok) {
        console.log('Request succeeded');
        return response;
      }

      throw new Error(`Request failed: ${response.status}`);
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      // Don't wait after last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Queue after all retries failed
  console.log('All retries failed - queueing request');
  networkManager.queueRequest({
    url,
    method: options.method || 'GET',
    headers: options.headers as Record<string, string>,
    body: options.body,
  });

  throw lastError!;
}

// ============================================================================
// Example 7: Network-Aware Feature Loading
// ============================================================================

export async function example7_NetworkAwareLoading() {
  const status = networkManager.getNetworkStatus();
  const info = networkManager.getNetworkInfo();

  console.log('Loading assets based on network status...');

  if (status === NetworkStatus.OFFLINE) {
    console.log('Offline - loading cached assets only');
    return loadCachedAssets();
  }

  if (status === NetworkStatus.SLOW || info.effectiveType === '2g') {
    console.log('Slow connection - loading low-quality assets');
    return loadLowQualityAssets();
  }

  console.log('Good connection - loading high-quality assets');
  return loadHighQualityAssets();
}

// Helper functions for example 7
async function loadCachedAssets() {
  return { quality: 'cached', size: 'small' };
}

async function loadLowQualityAssets() {
  return { quality: 'low', size: 'medium' };
}

async function loadHighQualityAssets() {
  return { quality: 'high', size: 'large' };
}

// ============================================================================
// Example 8: Optimistic UI Updates
// ============================================================================

export async function example8_OptimisticUpdate(postId: string) {
  // Update UI immediately (optimistic)
  updatePostLikes(postId, +1);
  console.log('UI updated optimistically');

  // Queue request if offline
  if (!networkManager.isOnline()) {
    networkManager.queueRequest({
      url: `https://api.fluxgrid.com/posts/${postId}/like`,
      method: 'POST',
    });
    console.log('Request queued - UI will stay updated');
    return;
  }

  // Make request
  try {
    await networkManager.fetchWithTimeout(
      `https://api.fluxgrid.com/posts/${postId}/like`,
      { method: 'POST' }
    );
    console.log('Like confirmed by server');
  } catch (error) {
    // Revert UI on error
    updatePostLikes(postId, -1);
    console.error('Like failed - UI reverted');
    throw error;
  }
}

// Helper function for example 8
function updatePostLikes(postId: string, delta: number) {
  console.log(`Post ${postId} likes ${delta > 0 ? '+' : ''}${delta}`);
}

// ============================================================================
// Example 9: Background Data Sync
// ============================================================================

export class BackgroundSyncManager {
  private syncInterval: number | null = null;
  private unsubscribe: (() => void) | null = null;

  start() {
    console.log('Starting background sync manager');

    // Subscribe to network status changes
    this.unsubscribe = networkManager.onStatusChange((status) => {
      if (status === NetworkStatus.ONLINE) {
        this.startSync();
      } else {
        this.stopSync();
      }
    });

    // Start immediately if online
    if (networkManager.isOnline()) {
      this.startSync();
    }
  }

  stop() {
    console.log('Stopping background sync manager');
    this.stopSync();

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private startSync() {
    if (this.syncInterval) {
      return; // Already syncing
    }

    console.log('Starting periodic sync');

    // Sync every 5 minutes
    this.syncInterval = window.setInterval(() => {
      this.syncData();
    }, 5 * 60 * 1000);

    // Sync immediately
    this.syncData();
  }

  private stopSync() {
    if (this.syncInterval) {
      console.log('Stopping periodic sync');
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncData() {
    console.log('Syncing data...');

    try {
      // Process queued requests
      await networkManager.processQueue();

      // Sync other data
      await this.syncGameProgress();
      await this.syncAchievements();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  private async syncGameProgress() {
    console.log('Syncing game progress...');
    // Implementation
  }

  private async syncAchievements() {
    console.log('Syncing achievements...');
    // Implementation
  }
}

// ============================================================================
// Example 10: Custom Timeout Based on Connection Speed
// ============================================================================

export async function example10_AdaptiveTimeout(url: string, options: RequestInit) {
  const status = networkManager.getNetworkStatus();
  const info = networkManager.getNetworkInfo();

  // Adjust timeout based on connection speed
  let timeout = 10000; // Default 10 seconds

  if (status === NetworkStatus.SLOW || info.effectiveType === '2g') {
    timeout = 30000; // 30 seconds for slow connections
  } else if (info.effectiveType === '3g') {
    timeout = 20000; // 20 seconds for 3G
  }

  console.log(`Using ${timeout}ms timeout for ${info.effectiveType} connection`);

  try {
    const response = await networkManager.fetchWithTimeout(url, options, timeout);
    return response;
  } catch (error) {
    console.error('Request failed with adaptive timeout:', error);
    throw error;
  }
}

// ============================================================================
// Example 11: Queue Management
// ============================================================================

export async function example11_QueueManagement() {
  // Get queue status
  const queuedCount = networkManager.getQueuedRequestCount();
  console.log('Current queue size:', queuedCount);

  // Check if queue is getting too large
  if (queuedCount > 50) {
    console.warn('Queue is getting large - consider clearing old requests');

    // Option 1: Clear entire queue
    // await networkManager.clearQueue();

    // Option 2: Process queue if online
    if (networkManager.isOnline()) {
      await networkManager.processQueue();
    }
  }

  // Monitor queue size
  const unsubscribe = networkManager.onStatusChange(() => {
    const count = networkManager.getQueuedRequestCount();
    if (count > 0) {
      console.log(`Queue status: ${count} requests pending`);
    }
  });

  return unsubscribe;
}

// ============================================================================
// Example 12: Integration with Analytics
// ============================================================================

export function example12_AnalyticsIntegration() {
  // Track network status changes
  networkManager.onStatusChange((status) => {
    const info = networkManager.getNetworkInfo();

    analyticsService.logEvent('network_status_changed', {
      status,
      effectiveType: info.effectiveType,
      downlink: info.downlink,
      rtt: info.rtt,
      queuedRequests: networkManager.getQueuedRequestCount(),
    });
  });

  // Track queue processing
  const originalProcessQueue = networkManager.processQueue.bind(networkManager);
  networkManager.processQueue = async function () {
    const startTime = Date.now();
    const queueSize = networkManager.getQueuedRequestCount();

    try {
      await originalProcessQueue();

      const duration = Date.now() - startTime;
      analyticsService.logEvent('queue_processed', {
        queueSize,
        duration,
        success: true,
      });
    } catch (error) {
      analyticsService.logEvent('queue_processing_failed', {
        queueSize,
        error: (error as Error).message,
      });
      throw error;
    }
  };
}

// ============================================================================
// Example 13: React Hook
// ============================================================================

export function useNetworkStatus() {
  // This would be in a separate hooks file
  // Shown here for completeness

  /*
  import { useEffect, useState } from 'react';
  
  const [status, setStatus] = useState(networkManager.getStatus());
  const [isOnline, setIsOnline] = useState(networkManager.isOnline());
  const [queuedRequests, setQueuedRequests] = useState(0);

  useEffect(() => {
    const unsubscribe = networkManager.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsOnline(newStatus !== NetworkStatus.OFFLINE);
      setQueuedRequests(networkManager.getQueuedRequestCount());
    });

    return unsubscribe;
  }, []);

  return {
    status,
    isOnline,
    queuedRequests,
    networkInfo: networkManager.getNetworkInfo(),
  };
  */
}

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllExamples() {
  console.log('=== Network Manager Examples ===\n');

  console.log('Example 1: Basic Status Check');
  example1_BasicStatusCheck();
  console.log('');

  console.log('Example 2: API Request with Timeout');
  await example2_ApiRequestWithTimeout();
  console.log('');

  console.log('Example 3: Request Queueing');
  await example3_RequestQueueing();
  console.log('');

  console.log('Example 4: Status Listener');
  const unsubscribe4 = example4_StatusListener();
  console.log('');

  console.log('Example 5: Manual Queue Processing');
  await example5_ManualQueueProcessing();
  console.log('');

  console.log('Example 7: Network-Aware Loading');
  await example7_NetworkAwareLoading();
  console.log('');

  console.log('Example 11: Queue Management');
  const unsubscribe11 = await example11_QueueManagement();
  console.log('');

  // Cleanup
  unsubscribe4();
  unsubscribe11();

  console.log('=== Examples Complete ===');
}
