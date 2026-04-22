import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@shared/store/themeStore';

export interface ContinueModalProps {
  isVisible: boolean;
  onContinue: () => void;
  onDecline: () => void;
  canContinue: boolean;
  usesRemaining: number;
  isLoading?: boolean; // Yeni prop
}

export const ContinueModal: React.FC<ContinueModalProps> = React.memo(({
  isVisible,
  onContinue,
  onDecline,
  canContinue,
  usesRemaining,
  isLoading = false,
}) => {
  const { getColors } = useThemeStore();
  const colors = getColors();
  const [countdown, setCountdown] = useState(5);

  // Detect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Countdown timer
  useEffect(() => {
    if (!isVisible) {
      setCountdown(5);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onDecline]);

  // Calculate circular progress
  const progress = (countdown / 5) * 100;
  const circumference = 2 * Math.PI * 18; // radius = 18
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop Overlay with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
            onClick={onDecline}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: prefersReducedMotion ? 1 : 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: prefersReducedMotion ? 1 : 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 flex items-center justify-center p-4 z-[70] pointer-events-none"
          >
            <div
              className="rounded-2xl p-6 max-w-md w-full pointer-events-auto"
              style={{
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
                borderWidth: '1px',
              }}
            >
              {/* Skull Emoji */}
              <div className="text-6xl text-center mb-4">💀</div>

              {/* Title */}
              <h2
                className="text-2xl font-bold text-center mb-4"
                style={{ color: colors.textPrimary }}
              >
                Continue?
              </h2>

              {/* Game State Info */}
              <div
                className="text-center mb-6 space-y-1"
                style={{ color: colors.textSecondary }}
              >
                <p className="text-sm">Grid will be partially cleared</p>
                <p className="text-sm">You'll get 3 new pieces</p>
              </div>

              {/* Watch Ad Button */}
              <button
                onClick={onContinue}
                disabled={!canContinue || isLoading}
                className="w-full font-bold py-3 rounded-lg transition-all mb-4 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: (canContinue && !isLoading) ? colors.accentPrimary : colors.gridSlot,
                  color: (canContinue && !isLoading) ? '#ffffff' : colors.textTertiary,
                  opacity: (canContinue && !isLoading) ? 1 : 0.5,
                  cursor: (canContinue && !isLoading) ? 'pointer' : 'not-allowed',
                  pointerEvents: (canContinue && !isLoading) ? 'auto' : 'none',
                }}
              >
                {isLoading ? '⏳ Loading ad...' : canContinue ? '📺 Watch Ad' : 'Daily limit reached'}
              </button>

              {/* Uses Remaining */}
              <div
                className="text-center text-sm mb-4"
                style={{ color: colors.textSecondary }}
              >
                {usesRemaining} {usesRemaining === 1 ? 'use' : 'uses'} remaining today
              </div>

              {/* Countdown with Circular Progress */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <svg width="48" height="48" className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke={colors.gridEdge}
                      strokeWidth="3"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke={colors.accentTimed}
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  {/* Countdown number */}
                  <div
                    className="absolute inset-0 flex items-center justify-center text-lg font-bold"
                    style={{ color: colors.textPrimary }}
                  >
                    {countdown}
                  </div>
                </div>
              </div>

              {/* No, exit link */}
              <button
                onClick={onDecline}
                className="w-full text-center py-2 transition-opacity hover:opacity-70"
                style={{ color: colors.textSecondary }}
              >
                No, exit
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
