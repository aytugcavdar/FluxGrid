import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyRewardStore, RewardDefinition, WEEKLY_REWARDS } from '@shared/store/dailyRewardStore';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RewardDayCardProps {
  reward: RewardDefinition;
  status: 'past' | 'current' | 'future';
}

/* ─── Confetti ─── */
const CONFETTI_COLORS = ['#f59e0b', '#f472b6', '#818cf8', '#34d399', '#fb923c', '#60a5fa', '#fbbf24'];
const Confetti: React.FC = () => {
  const particles = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i, x: 5 + (i / 28) * 90,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.5,
      duration: 1.1 + Math.random() * 1,
      size: 6 + Math.random() * 7,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: '-4vh', rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', rotate: 540, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute', width: p.size, height: p.size,
            background: p.color, borderRadius: Math.random() > 0.5 ? '50%' : 2,
          }}
        />
      ))}
    </div>
  );
};

/* ─── Day card ─── */
const RewardDayCard: React.FC<RewardDayCardProps> = ({ reward, status }) => {
  const isCurrent = status === 'current';
  const isPast = status === 'past';

  return (
    <div style={{
      borderRadius: 12, padding: '7px 4px', textAlign: 'center',
      background: isCurrent
        ? 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(99,102,241,0.2))'
        : isPast ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isCurrent ? 'rgba(168,85,247,0.55)' : isPast ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`,
      boxShadow: isCurrent ? '0 0 16px rgba(168,85,247,0.25)' : 'none',
      opacity: status === 'future' ? 0.5 : 1,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* shimmer on current */}
      {isCurrent && (
        <motion.div
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div style={{ fontSize: isPast ? 14 : 18, lineHeight: 1.2 }}>
        {isPast ? '✅' : reward.icon}
      </div>
      <div style={{
        fontSize: 8, fontWeight: 700, marginTop: 3,
        color: isCurrent ? '#c084fc' : isPast ? '#34d399' : 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        lineHeight: 1,
      }}>
        {isPast ? 'Alındı' : `Gün ${reward.day}`}
      </div>
    </div>
  );
};

/* ─── Main modal ─── */
export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClose }) => {
  const { currentStreak, canClaimToday, currentReward, claimDailyReward, streakBroken, clearStreakBrokenFlag } = useDailyRewardStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimed, setClaimed]           = useState(false);
  const [boxOpen, setBoxOpen]           = useState(false);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Reset state when modal reopens
  useEffect(() => {
    if (isOpen) { setClaimed(false); setBoxOpen(false); }
  }, [isOpen]);

  const handleClaim = () => {
    if (claimed) return;
    setBoxOpen(true);
    setTimeout(() => {
      claimDailyReward();
      setClaimed(true);
      if (!prefersReducedMotion) setShowConfetti(true);
    }, 400);
    setTimeout(() => {
      onClose();
      setShowConfetti(false);
      clearStreakBrokenFlag();
    }, 2800);
  };

  const handleClose = () => { onClose(); clearStreakBrokenFlag(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {showConfetti && <Confetti />}

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed inset-0 flex items-center justify-center p-5 z-[70] pointer-events-none"
          >
            <div style={{
              width: '100%', maxWidth: 340,
              borderRadius: 28, overflow: 'hidden',
              background: 'linear-gradient(160deg, #13102a 0%, #1c1840 100%)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
              pointerEvents: 'auto',
              position: 'relative',
            }}>
              {/* Top rainbow accent */}
              <div style={{
                height: 3,
                background: 'linear-gradient(90deg, #818cf8, #a855f7, #f472b6, #f59e0b, #34d399)',
              }} />

              <div style={{ padding: '22px 20px 24px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Günlük Ödül
                  </div>
                  <div style={{
                    fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #c084fc, #f472b6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                    {currentStreak} Günlük Seri! 🔥
                  </div>
                </div>

                {/* Streak broken warning */}
                <AnimatePresence>
                  {streakBroken && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{
                        padding: '8px 12px', borderRadius: 12, marginBottom: 14,
                        background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
                        textAlign: 'center', fontSize: 12, color: '#fb923c', fontWeight: 600,
                      }}
                    >
                      ⚠️ Serin kırıldı! Bugün yeniden başlıyor.
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Calendar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 22 }}>
                  {WEEKLY_REWARDS.map(reward => {
                    const status =
                      reward.day < currentStreak ? 'past' :
                      reward.day === currentStreak ? 'current' : 'future';
                    return <RewardDayCard key={reward.day} reward={reward} status={status} />;
                  })}
                </div>

                {/* Reward box */}
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  {/* Gift box with open animation */}
                  <motion.div
                    animate={boxOpen
                      ? { scale: [1, 1.2, 0.9, 1.05, 1], rotate: [0, -6, 6, -3, 0] }
                      : prefersReducedMotion ? {} : { scale: [1, 1.04, 1] }
                    }
                    transition={boxOpen
                      ? { duration: 0.55, ease: 'easeOut' }
                      : { duration: 1.8, repeat: Infinity, repeatDelay: 0.8 }
                    }
                    style={{ fontSize: 56, lineHeight: 1, display: 'inline-block', cursor: canClaimToday && !claimed ? 'pointer' : 'default' }}
                    onClick={canClaimToday && !claimed ? handleClaim : undefined}
                  >
                    {claimed ? '🎁' : currentReward.icon}
                  </motion.div>

                  <AnimatePresence>
                    {claimed && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        style={{ marginTop: 8 }}
                      >
                        <div style={{
                          fontSize: 16, fontWeight: 800,
                          background: 'linear-gradient(135deg, #fbbf24, #f472b6)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                          {currentReward.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#34d399', fontWeight: 700, marginTop: 3 }}>
                          ✓ Ödül alındı!
                        </div>
                      </motion.div>
                    )}
                    {!claimed && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ marginTop: 8 }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                          {currentReward.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          {canClaimToday ? 'Almak için dokun 👆' : 'Yarın gel'}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Claim button */}
                {canClaimToday ? (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleClaim}
                    disabled={claimed}
                    style={{
                      width: '100%', padding: '14px 0',
                      borderRadius: 16, border: 'none',
                      background: claimed
                        ? 'rgba(52,211,153,0.2)'
                        : 'linear-gradient(135deg, #7c3aed, #a855f7, #f472b6)',
                      boxShadow: claimed ? 'none' : '0 8px 28px rgba(168,85,247,0.45)',
                      color: claimed ? '#34d399' : 'white',
                      fontSize: 15, fontWeight: 800,
                      cursor: claimed ? 'default' : 'pointer',
                      transition: 'all 0.3s',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {claimed ? '✓ Alındı!' : '🎁 AL!'}
                  </motion.button>
                ) : (
                  <div style={{
                    textAlign: 'center', padding: '12px 0',
                    fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 600,
                  }}>
                    Yarın geri gel 🌙
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
