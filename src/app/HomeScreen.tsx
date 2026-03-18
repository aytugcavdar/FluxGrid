import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Settings } from 'lucide-react';
import { useGameStore } from '../features/game/store/gameStore';
import { useAuthStore } from '../features/auth/store/authStore';
import { GameMode, AppState } from '@shared/types';
import { playClick } from '@utils/audio';
import { getStreak, getDailyPlayedToday, getDayNumber } from '@utils/streakManager';
import { useTranslation } from 'react-i18next';
import { getFirebaseFirestore } from '../services/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface HomeScreenProps {
  onOpenProfile: () => void;
  onOpenThemeSelector: () => void;
  onOpenLeaderboard: (mode: GameMode) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenProfile,
  onOpenThemeSelector,
  onOpenLeaderboard,
}) => {
  const { initGame, stats, highScore, maxLevelReached, startLevel, setAppState, flux } = useGameStore();
  const [streak] = useState(getStreak);
  const [dailyPlayedToday] = useState(getDailyPlayedToday);
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.ENDLESS);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const user = useAuthStore(state => state.user);

  // Fetch online users count (last 5 minutes)
  useEffect(() => {
    try {
      const db = getFirebaseFirestore();
      
      // Create timestamp for 5 minutes ago
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const usersQuery = query(
        collection(db, 'users'),
        where('lastSeenAt', '>=', fiveMinutesAgo)
      );

      const unsubscribe = onSnapshot(
        usersQuery,
        (snapshot) => {
          setOnlineCount(snapshot.size);
        },
        (error) => {
          console.warn('Failed to fetch online users:', error);
          setOnlineCount(null); // Hide pill on error
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.warn('Failed to setup online users listener:', error);
      setOnlineCount(null);
    }
  }, []);

  // Get mode info
  const getModeInfo = (mode: GameMode) => {
    const modeInfo: Record<GameMode, { icon: string; label: string; color: string }> = {
      [GameMode.ENDLESS]: { icon: '∞', label: 'SONSUZ', color: '#00d4ff' },
      [GameMode.CAREER]: { icon: '🗺️', label: 'KARİYER', color: '#3b82f6' },
      [GameMode.TIMED]: { icon: '⚡', label: 'TIMED', color: '#f59e0b' },
      [GameMode.ZEN]: { icon: '☁️', label: 'ZEN', color: '#6b7280' },
      [GameMode.DAILY_CHALLENGE]: { icon: '📅', label: 'GÜNLÜK', color: '#f59e0b' },
      [GameMode.SURVIVAL]: { icon: '💀', label: 'HAYATTA KAL', color: '#6b7280' },
    };
    return modeInfo[mode] || modeInfo[GameMode.ENDLESS];
  };

  const selectedModeInfo = getModeInfo(selectedMode);

  // Get best score for selected mode
  const getModeBestScore = (mode: GameMode) => {
    try {
      const stored = localStorage.getItem(`flux_highscore_${mode}`);
      if (stored) {
        const parsed = parseInt(stored, 10);
        return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
      }
    } catch (e) {
      console.error('Failed to read high score:', e);
    }
    return 0;
  };

  const selectedModeBestScore = getModeBestScore(selectedMode);

  return (
    <motion.div
      key="home-quantum"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #0a0e1a 0%, #111827 100%)' }}
    >
      <div className="w-full max-w-xs">
        {/* TOP BAR */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}
        >
          {/* Profile Button */}
          <button
            onClick={() => { playClick(); onOpenProfile(); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <User size={18} color="rgba(255,255,255,0.4)" />
          </button>

          {/* Online Pill */}
          {onlineCount !== null && (
            <div
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(16,185,129,0.08)',
                border: '0.5px solid rgba(16,185,129,0.2)',
                fontSize: 10,
                fontWeight: 600,
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 8 }}>🟢</span>
              <span>{onlineCount} çevrimiçi</span>
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={() => { playClick(); onOpenThemeSelector(); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Settings size={18} color="rgba(255,255,255,0.4)" />
          </button>
        </motion.div>

        {/* LOGO */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: 16 }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 12vw, 56px)',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: '#00d4ff', textShadow: '0 0 30px rgba(0,212,255,0.4)' }}>FLUX</span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>GRID</span>
          </h1>
          <div
            style={{
              marginTop: 8,
              height: 1,
              width: 120,
              margin: '8px auto 6px',
              background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9,
              letterSpacing: '0.25em',
              color: 'rgba(255,255,255,0.2)',
              fontWeight: 400,
            }}
          >
            KUANTUM BLOK BULMACASI
          </div>
        </motion.div>

        {/* FLUX STRIP */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
          style={{
            marginBottom: 16,
            padding: '8px 12px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: '#00d4ff', fontFamily: 'var(--font-display)' }}>
            ⚡ FLUX ENERJİSİ
          </span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${flux}%`,
                background: 'linear-gradient(90deg, #00d4ff, #a855f7)',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff' }}>%{flux}</span>
        </motion.div>

        {/* STATS ROW */}
        {stats && stats.gamesPlayed > 5 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '10px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#00d4ff' }}>
                {highScore >= 1000 ? `${(highScore / 1000).toFixed(1)}k` : highScore}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>En iyi skor</div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '10px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'white' }}>
                {stats.gamesPlayed}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Oyun sayısı</div>
            </div>
            <div
              style={{
                background: streak > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${streak > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 10,
                padding: '10px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: streak > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>
                {streak > 0 ? `🔥 ${streak}` : '--'}
              </div>
              <div style={{ fontSize: 8, color: streak > 0 ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.3)', marginTop: 2 }}>Streak</div>
            </div>
          </motion.div>
        )}

        {/* MAIN CTA BUTTON */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.25 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { playClick(); initGame(selectedMode); }}
          style={{
            width: '100%',
            padding: '20px 24px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.10), rgba(168,85,247,0.10))',
            border: '1px solid rgba(0,212,255,0.25)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          {/* Decorative L-corner */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 20,
              height: 20,
              borderTop: '2px solid rgba(0,212,255,0.3)',
              borderRight: '2px solid rgba(0,212,255,0.3)',
            }}
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 40, lineHeight: 1 }}>{selectedModeInfo.icon}</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 900,
                color: '#00d4ff',
                textShadow: '0 0 20px rgba(0,212,255,0.4)',
                letterSpacing: '0.05em',
              }}
            >
              {selectedModeInfo.label}
            </div>
            {selectedModeBestScore > 0 && (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
                En iyi: {selectedModeBestScore.toLocaleString()}
              </div>
            )}
          </div>
        </motion.button>

        {/* CAREER CHIP */}
        {maxLevelReached > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { playClick(); startLevel(maxLevelReached + 1); }}
            style={{
              width: '100%',
              marginTop: 8,
              marginBottom: 16,
              padding: '6px 12px',
              borderRadius: 10,
              background: 'rgba(59,130,246,0.08)',
              border: '0.5px solid rgba(59,130,246,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 11,
              fontWeight: 600,
              color: '#93c5fd',
            }}
          >
            <span>kardan devam et</span>
            <span style={{ opacity: 0.6 }}>→</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(59,130,246,0.15)',
                fontWeight: 700,
              }}
            >
              SEVİYE {maxLevelReached + 1}
            </span>
          </motion.button>
        )}

        {/* DAILY CARD */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { playClick(); initGame(GameMode.DAILY_CHALLENGE); }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            marginBottom: 16,
            background: dailyPlayedToday ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.1)',
            border: `0.5px solid ${dailyPlayedToday ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.25)'}`,
            borderLeft: `3px solid ${dailyPlayedToday ? '#10b981' : '#f59e0b'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dailyPlayedToday ? '#10b981' : '#f59e0b',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: dailyPlayedToday ? '#34d399' : '#fbbf24' }}>
              Günlük Meydan Okuma · Gün {getDayNumber()}
            </div>
            <div style={{ fontSize: 8, color: dailyPlayedToday ? 'rgba(52,211,153,0.5)' : 'rgba(251,191,36,0.4)', marginTop: 2 }}>
              {dailyPlayedToday ? 'Bugün tamamlandı ✓' : 'Bugün henüz oynanmadı · 🔥 serin koru'}
            </div>
          </div>
          {!dailyPlayedToday && <span style={{ fontSize: 14, color: 'rgba(245,158,11,0.6)' }}>→</span>}
        </motion.button>

        {/* MODE TABS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.35 }}
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: '0.15em',
              fontFamily: 'var(--font-display)',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 8,
              fontWeight: 400,
            }}
          >
            MODLAR
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[GameMode.ENDLESS, GameMode.CAREER, GameMode.TIMED, GameMode.ZEN].map((mode) => {
              const info = getModeInfo(mode);
              const isActive = selectedMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => { playClick(); setSelectedMode(mode); }}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: 20, lineHeight: 1 }}>{info.icon}</div>
                  <div
                    style={{
                      fontSize: 9,
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {info.label}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* BOTTOM NAV */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}
        >
          <button
            onClick={() => { playClick(); setAppState(AppState.LEVEL_MAP); }}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>🗺️ Görev Haritası</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
              Seviye {maxLevelReached} / 100
            </div>
          </button>
          <button
            onClick={() => { playClick(); onOpenLeaderboard(GameMode.ENDLESS); }}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>🏆 Liderlik Tablosu</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
              {user ? 'Oyna ve sıralan' : 'Oyna ve sıralan'}
            </div>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
