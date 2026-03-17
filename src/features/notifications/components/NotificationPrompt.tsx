import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  requestNotificationPermission,
  areNotificationsSupported,
  getNotificationPermissionStatus,
} from '../../../services/firebase/fcmService';
import { useAuthStore } from '../../auth';

interface NotificationPromptProps {
  onClose?: () => void;
}

export function NotificationPrompt({ onClose }: NotificationPromptProps) {
  const { user } = useAuthStore();
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show if notifications not supported
  if (!areNotificationsSupported()) {
    return null;
  }

  // Don't show if already granted or denied
  const permission = getNotificationPermissionStatus();
  if (permission !== 'default') {
    return null;
  }

  const handleAccept = async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);

    try {
      const token = await requestNotificationPermission(user.uid);

      if (token) {
        // Store permission state
        localStorage.setItem('notification_permission_requested', 'true');
        localStorage.setItem('notification_permission_granted', 'true');
        
        // Close prompt
        setIsVisible(false);
        if (onClose) {
          setTimeout(onClose, 300);
        }
      } else {
        // Permission denied
        localStorage.setItem('notification_permission_requested', 'true');
        localStorage.setItem('notification_permission_granted', 'false');
        
        setIsVisible(false);
        if (onClose) {
          setTimeout(onClose, 300);
        }
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    localStorage.setItem('notification_permission_requested', 'true');
    localStorage.setItem('notification_permission_granted', 'false');
    
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-3xl">
                🔔
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-2">
              Stay in the Game
            </h2>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Get notified when your rank is dropping or when competitors are catching up. Never miss a chance to reclaim your spot!
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-green-500 text-xl">✓</div>
                <div className="text-sm">
                  <div className="font-medium">Rank Alerts</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Know when competitors pass you
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="text-green-500 text-xl">✓</div>
                <div className="text-sm">
                  <div className="font-medium">Smart Timing</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Notifications sent at your peak play time
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="text-green-500 text-xl">✓</div>
                <div className="text-sm">
                  <div className="font-medium">No Spam</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Only important updates, nothing more
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Not Now
              </button>
              
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enabling...</span>
                  </>
                ) : (
                  'Enable Notifications'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
