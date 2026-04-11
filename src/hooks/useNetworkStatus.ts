/**
 * useNetworkStatus Hook
 * 
 * React hook for monitoring network status and queue state.
 * Provides real-time updates on network connectivity.
 */

import { useEffect, useState } from 'react';
import { networkManager, NetworkStatus, NetworkInfo } from '../services/network/networkManager';

export interface UseNetworkStatusReturn {
  status: NetworkStatus;
  isOnline: boolean;
  queuedRequests: number;
  networkInfo: NetworkInfo;
}

/**
 * Hook to monitor network status
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { isOnline, status, queuedRequests } = useNetworkStatus();
 *   
 *   return (
 *     <div>
 *       <p>Status: {status}</p>
 *       {queuedRequests > 0 && (
 *         <p>{queuedRequests} requests queued</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [status, setStatus] = useState<NetworkStatus>(networkManager.getNetworkStatus());
  const [isOnline, setIsOnline] = useState(networkManager.isOnline());
  const [queuedRequests, setQueuedRequests] = useState(0);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(networkManager.getNetworkInfo());

  useEffect(() => {
    // Update initial state
    setQueuedRequests(networkManager.getQueuedRequestCount());

    // Subscribe to network status changes
    const unsubscribe = networkManager.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsOnline(newStatus !== NetworkStatus.OFFLINE);
      setQueuedRequests(networkManager.getQueuedRequestCount());
      setNetworkInfo(networkManager.getNetworkInfo());
    });

    return unsubscribe;
  }, []);

  return {
    status,
    isOnline,
    queuedRequests,
    networkInfo,
  };
}
