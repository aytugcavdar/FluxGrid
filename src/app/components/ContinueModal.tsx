import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Play, X, Tv2, CheckCircle2, Clock } from 'lucide-react';

export interface ContinueModalProps {
  isVisible: boolean;
  onContinue: () => void;
  onDecline: () => void;
  canContinue: boolean;
  usesRemaining: number;
  isLoading?: boolean;
}

const COUNTDOWN_SECONDS = 7;
const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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
  }, [isVisible, onDecline]);

  // Pulse ad button after 1s
  useEffect(() => {
    if (!isVisible || !canContinue) return;
    const t = setTimeout(() => setAdButtonPulsed(true), 1000);
    return () => clearTimeout(t);
  }, [isVisible, canContinue]);

  const progress = countdown / COUNTDOWN_SECONDS;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const benefits = [
    t('continueModal.benefit1'),
    t('continueModal.benefit2'),
    t('continueModal.benefit3'),
  ];

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
            onClick={onDecline}
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

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

                {/* Benefits */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {benefits.map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <CheckCircle2 size={14} color="#a78bfa" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                        {benefit}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Ad note */}
                {canContinue && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.18)',
                    marginBottom: 16,
                  }}>
                    <Tv2 size={12} color="#818cf8" strokeWidth={2} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                      {t('continueModal.adNote')}
                    </span>
                  </div>
                )}

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

                {/* Uses remaining */}
                <div style={{
                  textAlign: 'center', fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  marginBottom: 14,
                }}>
                  {t('continueModal.remaining_other', { count: usesRemaining })}
                </div>

                {/* Bottom row: decline + countdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Countdown ring */}
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="22" cy="22" r={RADIUS} fill="none"
                        stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                      <motion.circle cx="22" cy="22" r={RADIUS} fill="none"
                        stroke={countdown <= 3 ? '#f87171' : '#6366f1'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        animate={{ strokeDashoffset: dashOffset }}
                        transition={{ duration: 0.8, ease: 'linear' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800,
                      color: countdown <= 3 ? '#f87171' : 'rgba(255,255,255,0.7)',
                    }}>
                      {countdown}
                    </div>
                  </div>

                  {/* Decline button */}
                  <button
                    onClick={onDecline}
                    style={{
                      flex: 1, padding: '11px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 13, fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <X size={13} />
                    {t('continueModal.noThanks')}
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
