import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Play } from 'lucide-react';

interface StreakShieldModalProps {
  isVisible: boolean;
  currentStreak: number;
  streakBroken: boolean;
  onWatchAd: () => void;
  onClose: () => void;
  shieldsAvailable: number;
}

/* ── Kalkan slot göstergesi ── */
const ShieldSlots: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
    {[0, 1].map(i => (
      <div
        key={i}
        style={{
          width: 30, height: 30, borderRadius: 8,
          background: i < count ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${i < count ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        <Shield size={14} color={i < count ? '#60a5fa' : 'rgba(255,255,255,0.18)'} />
      </div>
    ))}
    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 2 }}>
      {count}/2 kalkan
    </span>
  </div>
);

export const StreakShieldModal: React.FC<StreakShieldModalProps> = ({
  isVisible,
  currentStreak,
  streakBroken,
  onWatchAd,
  onClose,
  shieldsAvailable,
}) => {
  const accentColor = streakBroken ? '#ef4444' : '#818cf8';
  const glowColor   = streakBroken ? 'rgba(239,68,68,0.22)' : 'rgba(129,140,248,0.22)';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.86, y: 24 }}
            transition={{ duration: 0.32, ease: [0.34, 1.46, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #1c1d2e 0%, #141522 100%)',
              border: `1px solid ${accentColor}35`,
              borderRadius: 24,
              padding: '32px 26px 28px',
              maxWidth: 370,
              width: '100%',
              position: 'relative',
              boxShadow: `0 0 70px ${glowColor}, 0 24px 64px rgba(0,0,0,0.55)`,
              overflow: 'hidden',
            }}
          >
            {/* Arka plan glow blobu */}
            <div style={{
              position: 'absolute', top: -80, left: '50%',
              transform: 'translateX(-50%)',
              width: 240, height: 240, borderRadius: '50%',
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* Kapat butonu */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 30, height: 30, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.35)',
              }}
            >
              <X size={14} />
            </button>

            {streakBroken ? (
              /* ══ MOD B: Seri Kırıldı ══ */
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 76, height: 76, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 32px rgba(239,68,68,0.2)',
                  }}
                >
                  <span style={{ fontSize: 34, lineHeight: 1 }}>💔</span>
                </motion.div>

                <h2 style={{
                  fontSize: 22, fontWeight: 900, color: '#ef4444',
                  marginBottom: 8, letterSpacing: '-0.03em', lineHeight: 1.1,
                }}>
                  Seriniz Kırıldı!
                </h2>

                <p style={{
                  fontSize: 14, color: 'rgba(255,255,255,0.55)',
                  marginBottom: 16, lineHeight: 1.5,
                }}>
                  {currentStreak} günlük seriniz tehlikede.
                </p>

                <div style={{ marginBottom: 24 }}>
                  <ShieldSlots count={shieldsAvailable} />
                </div>

                {shieldsAvailable > 0 ? (
                  <>
                    <p style={{
                      fontSize: 13, color: 'rgba(255,255,255,0.4)',
                      marginBottom: 20, lineHeight: 1.55,
                    }}>
                      Bir reklam izleyerek kalkanınızı kullanın ve serinizi kurtarın.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={onWatchAd}
                      style={{
                        width: '100%', padding: '15px 20px',
                        borderRadius: 14, border: 'none',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white', fontSize: 15, fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 4px 22px rgba(239,68,68,0.38)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      <Play size={16} fill="white" strokeWidth={0} />
                      Reklam İzle → Seriyi Kurtar
                    </motion.button>
                  </>
                ) : (
                  <>
                    <p style={{
                      fontSize: 13, color: 'rgba(255,255,255,0.4)',
                      marginBottom: 20, lineHeight: 1.55,
                    }}>
                      Kalkanınız yok. Seriniz sıfırlandı — yeni bir seri başlat!
                    </p>
                    <button
                      disabled
                      style={{
                        width: '100%', padding: '15px 20px',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.07)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.28)', fontSize: 15, fontWeight: 700,
                        cursor: 'not-allowed',
                      }}
                    >
                      Kalkan Yok
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* ══ MOD A: Kalkan Kazan ══ */
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 76, height: 76, borderRadius: '50%',
                    background: 'rgba(129,140,248,0.1)',
                    border: '1px solid rgba(129,140,248,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 32px rgba(129,140,248,0.2)',
                  }}
                >
                  <span style={{ fontSize: 34, lineHeight: 1 }}>🛡️</span>
                </motion.div>

                <h2 style={{
                  fontSize: 22, fontWeight: 900, color: 'white',
                  marginBottom: 12, letterSpacing: '-0.03em', lineHeight: 1.1,
                }}>
                  Serini Koru!
                </h2>

                {/* Mevcut seri pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.2)',
                  borderRadius: 10, padding: '6px 14px',
                  marginBottom: 18,
                }}>
                  <span style={{ fontSize: 15 }}>🔥</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', lineHeight: 1 }}>
                    {currentStreak} günlük seri
                  </span>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <ShieldSlots count={shieldsAvailable} />
                </div>

                <p style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.4)',
                  marginBottom: 22, lineHeight: 1.55,
                }}>
                  Reklam izleyerek kalkan kazan. Bir gün oynamamak serinizi bozmaz.
                </p>

                <motion.button
                  whileTap={shieldsAvailable < 2 ? { scale: 0.97 } : {}}
                  onClick={shieldsAvailable < 2 ? onWatchAd : undefined}
                  disabled={shieldsAvailable >= 2}
                  style={{
                    width: '100%', padding: '15px 20px',
                    borderRadius: 14,
                    border: shieldsAvailable >= 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    background: shieldsAvailable >= 2
                      ? 'rgba(255,255,255,0.04)'
                      : 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                    color: shieldsAvailable >= 2 ? 'rgba(255,255,255,0.28)' : 'white',
                    fontSize: 15, fontWeight: 800,
                    cursor: shieldsAvailable >= 2 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: shieldsAvailable >= 2 ? 'none' : '0 4px 22px rgba(129,140,248,0.38)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {shieldsAvailable >= 2 ? (
                    '✓ Kalkanlar Dolu'
                  ) : (
                    <>
                      <Play size={16} fill="white" strokeWidth={0} />
                      Reklam İzle → Kalkan Kazan
                    </>
                  )}
                </motion.button>

                {shieldsAvailable < 2 && (
                  <p style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.22)',
                    marginTop: 12, lineHeight: 1,
                  }}>
                    Maksimum 2 kalkan
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
