import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

interface GoogleSignInModalProps {
  score: number;
  mode: string;
  onClose?: () => void;
}

export function GoogleSignInModal({ score, mode, onClose }: GoogleSignInModalProps) {
  const { upgradeToGoogleAccount, isLoading, error } = useAuthStore();
  const [isVisible, setIsVisible] = useState(true);
  const [dismissCount, setDismissCount] = useState(
    parseInt(localStorage.getItem('signin_dismiss_count') || '0', 10)
  );

  const handleSignIn = async () => {
    await upgradeToGoogleAccount();
    
    if (!error) {
      setIsVisible(false);
      if (onClose) {
        setTimeout(onClose, 300);
      }
    }
  };

  const handleDismiss = () => {
    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    localStorage.setItem('signin_dismiss_count', newCount.toString());
    
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
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-3xl">
                🎉
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-2">
              Amazing Score!
            </h2>

            {/* Score Display */}
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500">
                {score.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {mode.toUpperCase()} Mode
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Save your progress and compete on the global leaderboard! Sign in with Google to keep your scores forever.
            </p>

            {/* Benefits */}
            <div className="space-y-2 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>Save all your high scores</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>Compete on global leaderboards</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>Sync progress across devices</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>Track your improvement over time</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Maybe Later
              </button>
              
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Dismiss hint */}
            {dismissCount >= 2 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                You can always sign in later from the settings menu
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
