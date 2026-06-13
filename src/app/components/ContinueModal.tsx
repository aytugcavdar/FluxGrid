import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Play, X, Clock } from 'lucide-react';

export interface ContinueModalProps {
  isVisible: boolean;
  onContinue: () => void;
  onDecline: () => void;
  canContinue: boolean;
  usesRemaining: number;
  isLoading?: boolean;
}

const COUNTDOWN_SECONDS = 7;

export const ContinueModal: React.FC<ContinueModalProps> = React.memo(({
  isVisible,
  onContinue,
  onDecline,
  canContinue,
  usesRemaining,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [adButtonPulsed, setAdButtonPulsed] = useState(false);

  // Reset + countdown
  useEffect(() => {
    if (!isVisible) {
      setCountdown(COUNTDOWN_SECONDS);
      return;
    }
    if (isLoading) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, isVisible, onDecline]);

  // Pulse ad button after 1s
  useEffect(() => {
    if (!isVisible || !canContinue) return;
    const t = setTimeout(() => setAdButtonPulsed(true), 1000);
    return () => clearTimeout(t);
  }, [isVisible, canContinue]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(16px)',
              zIndex: 60,
            }}
            onClick={isLoading ? undefined : onDecline}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            style={{
              position: 'fixed', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20, zIndex: 70, pointerEvents: 'none',
            }}
          >
            <div style={{
              width: '100%', maxWidth: 340,
              pointerEvents: 'auto',
              background: 'linear-gradient(160deg, #1a1b2e 0%, #0f1117 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
            }}>

              {/* Top accent bar */}
              <div style={{
                height: 3,
                background: canContinue
                  ? 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)'
                  : 'rgba(255,255,255,0.1)',
              }} />

              <div style={{ padding: '24px 24px 20px' }}>

                {/* Header: icon + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 0] }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0,
                    }}
                  >
                    💀
                  </motion.div>
                  <div>
                    <div style={{
                      fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em',
                      color: '#f1f5f9', lineHeight: 1.1,
                    }}>
                      {t('continueModal.title')}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                      {t('continueModal.subtitle')}
                    </div>
                  </div>
                </div>

                <div style={{
                  margin: '16px 0 18px',
                  padding: '11px 12px',
                  borderRadius: 13,
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 850, color: 'rgba(255,255,255,0.82)', lineHeight: 1.25 }}>
                    {t('continueModal.summaryTitle')}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 4, lineHeight: 1.25 }}>
                    {t('continueModal.summarySubtitle')}
                  </div>
                </div>

                {/* Watch Ad Button */}
                <motion.button
                  onClick={canContinue && !isLoading ? onContinue : undefined}
                  disabled={!canContinue || isLoading}
                  animate={adButtonPulsed && canContinue && !isLoading
                    ? { boxShadow: ['0 0 0px rgba(139,92,246,0)', '0 0 24px rgba(139,92,246,0.5)', '0 0 0px rgba(139,92,246,0)'] }
                    : { boxShadow: '0 0 0px transparent' }
                  }
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 14,
                    border: 'none',
                    cursor: (canContinue && !isLoading) ? 'pointer' : 'not-allowed',
                    fontWeight: 800,
                    fontSize: 14,
                    letterSpacing: '0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: (canContinue && !isLoading)
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
                      : 'rgba(255,255,255,0.06)',
                    color: (canContinue && !isLoading) ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    opacity: (canContinue && !isLoading) ? 1 : 0.6,
                    marginBottom: 10,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isLoading
                    ? <><Clock size={15} style={{ opacity: 0.7 }} /> {t('continueModal.loading')}</>
                    : canContinue
                      ? <><Play size={15} fill="white" /> {t('continueModal.watchAd')}</>
                      : t('continueModal.limitReached')
                  }
                </motion.button>

                {canContinue && (
                  <div style={{
                    textAlign: 'center', fontSize: 11,
                    color: 'rgba(255,255,255,0.3)',
                    marginBottom: 12,
                  }}>
                    {t('continueModal.remaining_other', { count: usesRemaining })}
                  </div>
                )}

                <div>
                  <button
                    onClick={isLoading ? undefined : onDecline}
                    disabled={isLoading}
                    style={{
                      width: '100%', padding: '11px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 13, fontWeight: 600,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.55 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <X size={13} />
                    {t('continueModal.noThanks')} ({countdown})
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
