/**
 * Offline Indicator Component
 * 
 * Displays a notification when the user is offline or has a slow connection.
 * Automatically shows/hides based on network status.
 * 
 * Requirements: 11.3
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { networkManager, NetworkStatus } from '../../services/network/networkManager';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showSlowConnection?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showSlowConnection = true,
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    networkManager.getNetworkStatus()
  );
  const [queuedRequests, setQueuedRequests] = useState(0);

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkManager.onStatusChange((status) => {
      setNetworkStatus(status);
      setQueuedRequests(networkManager.getQueuedRequestCount());
    });

    // Update queued requests count
    setQueuedRequests(networkManager.getQueuedRequestCount());

    return unsubscribe;
  }, []);

  const shouldShow =
    networkStatus === NetworkStatus.OFFLINE ||
    (showSlowConnection && networkStatus === NetworkStatus.SLOW);

  const getMessage = (): string => {
    if (networkStatus === NetworkStatus.OFFLINE) {
      if (queuedRequests > 0) {
        return `You're offline. ${queuedRequests} request${queuedRequests > 1 ? 's' : ''} queued.`;
      }
      return "You're offline. Some features may be unavailable.";
    }
    if (networkStatus === NetworkStatus.SLOW) {
      return 'Slow connection detected. Experience may be affected.';
    }
    return '';
  };

  const getIcon = (): string => {
    if (networkStatus === NetworkStatus.OFFLINE) {
      return '📡';
    }
    if (networkStatus === NetworkStatus.SLOW) {
      return '🐌';
    }
    return '';
  };

  const getBackgroundColor = (): string => {
    if (networkStatus === NetworkStatus.OFFLINE) {
      return 'rgba(239, 68, 68, 0.95)'; // red-500
    }
    if (networkStatus === NetworkStatus.SLOW) {
      return 'rgba(251, 146, 60, 0.95)'; // orange-400
    }
    return '';
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            [position]: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            padding: '12px 16px',
            backgroundColor: getBackgroundColor(),
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>{getIcon()}</span>
          <span>{getMessage()}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
