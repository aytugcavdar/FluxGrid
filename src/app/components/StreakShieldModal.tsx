import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@shared/store/themeStore';
import { X } from 'lucide-react';

interface StreakShieldModalProps {
  isVisible: boolean;
  currentStreak: number;
  streakBroken: boolean;
  onWatchAd: () => void;
  onClose: () => void;
  shieldsAvailable: number;
}

export const StreakShieldModal: React.FC<StreakShieldModalProps> = ({
  isVisible,
  currentStreak,
  streakBroken,
  onWatchAd,
  onClose,
  shieldsAvailable
}) => {
  const colors = useThemeStore(state => state.getThemeColors());

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' as const }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: colors.modalOverlay,
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.cardBackground,
              border: `1px solid ${streakBroken ? '#ef4444' : colors.cardBorder}`,
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              position: 'relative',
              boxShadow: streakBroken
                ? '0 0 40px rgba(239, 68, 68, 0.3)'
                : '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${colors.hudBorder}`,
                background: colors.hudBackground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: colors.textSecondary
              }}
            >
              <X size={16} />
            </button>

            {/* Content based on mode */}
            {streakBroken ? (
              // Mode B: Streak Broken
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💔</div>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#ef4444',
                    marginBottom: 16
                  }}
                >
                  Streak Broken!
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8
                  }}
                >
                  Your {currentStreak}-day streak is at risk!
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 20
                  }}
                >
                  Shields: {shieldsAvailable}/2
                </p>

                {shieldsAvailable > 0 ? (
                  <>
                    <p
                      style={{
                        fontSize: 13,
                        color: colors.textTertiary,
                        marginBottom: 20
                      }}
                    >
                      Use a shield to save your streak by watching an ad.
                    </p>
                    <button
                      onClick={onWatchAd}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        borderRadius: 12,
                        border: 'none',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      📺 Watch Ad → Save Streak
                    </button>
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        fontSize: 13,
                        color: colors.textTertiary,
                        marginBottom: 20
                      }}
                    >
                      No shields available. Your streak has been reset.
                    </p>
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        borderRadius: 12,
                        border: 'none',
                        background: colors.cardBorder,
                        color: colors.textTertiary,
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: 'not-allowed',
                        opacity: 0.5
                      }}
                    >
                      No Shields Available
                    </button>
                  </>
                )}
              </div>
            ) : (
              // Mode A: Earn Shield
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    marginBottom: 16
                  }}
                >
                  Protect Your Streak!
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 8
                  }}
                >
                  Current: 🔥 {currentStreak} days
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginBottom: 20
                  }}
                >
                  Shields: {shieldsAvailable}/2
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: colors.textTertiary,
                    marginBottom: 20
                  }}
                >
                  Watch an ad to earn a shield that protects your streak if you
                  miss a day.
                </p>
                <button
                  onClick={onWatchAd}
                  disabled={shieldsAvailable >= 2}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background:
                      shieldsAvailable >= 2
                        ? colors.cardBorder
                        : colors.accentPrimary,
                    color: shieldsAvailable >= 2 ? colors.textTertiary : 'white',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: shieldsAvailable >= 2 ? 'not-allowed' : 'pointer',
                    opacity: shieldsAvailable >= 2 ? 0.5 : 1,
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseDown={(e) => {
                    if (shieldsAvailable < 2) {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }
                  }}
                  onMouseUp={(e) => {
                    if (shieldsAvailable < 2) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  📺 Watch Ad → Earn Shield
                </button>
                <p
                  style={{
                    fontSize: 11,
                    color: colors.textTertiary,
                    marginTop: 12
                  }}
                >
                  Max 2 shields
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
