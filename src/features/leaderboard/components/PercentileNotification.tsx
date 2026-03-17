import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PercentileNotificationProps {
  percentile: number;
  onDismiss?: () => void;
  autoHideDuration?: number;
}

export function PercentileNotification({
  percentile,
  onDismiss,
  autoHideDuration = 5000,
}: PercentileNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) {
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [autoHideDuration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      setTimeout(onDismiss, 300);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
            {/* Trophy Icon */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-3xl"
            >
              🏆
            </motion.div>

            {/* Message */}
            <div className="flex flex-col">
              <div className="text-sm font-medium opacity-90">You're in the</div>
              <div className="text-2xl font-bold">
                Top {percentile.toFixed(1)}%
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="ml-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              aria-label="Dismiss notification"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: autoHideDuration / 1000, ease: 'linear' }}
            className="h-1 bg-white/30 rounded-full mt-2 origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
