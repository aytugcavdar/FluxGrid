import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings, Video } from 'lucide-react';
import { useGameStore } from '../features/game/store/gameStore';
import { useAuthStore } from '../features/auth/store/authStore';
import { useLeaderboardStore } from '../features/leaderboard/store/leaderboardStore';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';

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
  const { initGame } = useGameStore();
  const { fetchUserRank, userRanks } = useLeaderboardStore();
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.ENDLESS);
  const user = useAuthStore(state => state.user);

  // Fetch user rank for selected mode
  useEffect(() => {
    if (user?.uid) {
      fetchUserRank(user.uid, selectedMode);
    }
  }, [user?.uid, selectedMode, fetchUserRank]);

  // Get mode info
  const getModeInfo = (mode: GameMode) => {
    const modeInfo: Record<GameMode, { 
      label: string; 
      labelEn: string;
      description: string;
      descriptionEn: string;
      icon: string;
      color: string;
    }> = {
      [GameMode.ENDLESS]: { 
        label: 'SONSUZ MOD', 
        labelEn: 'ENDLESS MODE',
        description: 'Reflekslerini sınırla',
        descriptionEn: 'Test your reflexes',
        icon: '∞',
        color: '#a855f7' 
      },
      [GameMode.TIMED]: { 
        label: 'ZAMANLI MOD', 
        labelEn: 'TIMED MODE',
        description: 'Zamana karşı yarış',
        descriptionEn: 'Race against time',
        icon: '⏱️',
        color: '#f59e0b' 
      },
      [GameMode.ZEN]: { 
        label: 'ZEN MOD', 
        labelEn: 'ZEN MODE',
        description: 'Rahatla ve oyna',
        descriptionEn: 'Relax and play',
        icon: '🧘',
        color: '#6b7280' 
      },
      [GameMode.DAILY_CHALLENGE]: { 
        label: 'GÜNLÜK MOD', 
        labelEn: 'DAILY MODE',
        description: 'Günlük meydan okuma',
        descriptionEn: 'Daily challenge',
        icon: '📅',
        color: '#10b981' 
      },
    };
    return modeInfo[mode] || modeInfo[GameMode.ENDLESS];
  };

  const selectedModeInfo = getModeInfo(selectedMode);

  // Get best score for selected mode (memoized to avoid repeated localStorage reads)
  const selectedModeBestScore = useMemo(() => {
    try {
      const stored = localStorage.getItem('flux_highscores');
      if (stored) {
        const scores = JSON.parse(stored);
        const val = scores[selectedMode];
        return typeof val === 'number' && val >= 0 ? val : 0;
      }
    } catch (e) {
      console.error('Failed to read high score:', e);
    }
    return 0;
  }, [selectedMode]);

  // Get user rank for selected mode
  const userRank = userRanks.get(selectedMode);
  const rankDisplay = userRank 
    ? (typeof userRank === 'number' ? `#${userRank.toLocaleString()}` : userRank)
    : '—';

  return (
    <motion.div
      key="home-quantum"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col p-4 overflow-y-auto"
      style={{ 
        background: '#0a0e1a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: 80,
      }}
    >
      <div className="w-full max-w-md mx-auto">
        {/* TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          {/* Video Icon */}
          <button
            onClick={() => { playClick(); }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Video size={20} color="rgba(0,212,255,0.8)" />
          </button>

          {/* Logo - Centered */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            FLUXGRID
          </h1>

          {/* Settings Button */}
          <button
            onClick={() => { playClick(); onOpenThemeSelector(); }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Settings size={20} color="rgba(0,212,255,0.8)" />
          </button>
        </div>

        {/* MODE TABS */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 24,
          background: 'rgba(255,255,255,0.03)',
          padding: 4,
          borderRadius: 12,
        }}>
          {[
            { mode: GameMode.ENDLESS, label: 'SONSUZ' },
            { mode: GameMode.TIMED, label: 'TIMED' },
            { mode: GameMode.ZEN, label: 'ZEN' },
            { mode: GameMode.DAILY_CHALLENGE, label: 'GÜNLÜK' }
          ].map(({ mode, label }) => {
            const isActive = selectedMode === mode;
            return (
              <button
                key={mode}
                onClick={() => { playClick(); setSelectedMode(mode); }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(0,212,255,0.15)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* MAIN CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: 32,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Large Icon */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: 24 
          }}>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(0,212,255,0.1)',
              border: '2px solid rgba(0,212,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
            }}>
              {selectedModeInfo.icon}
            </div>
          </div>

          {/* Mode Name */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 900,
            color: 'white',
            fontStyle: 'italic',
            marginBottom: 8,
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}>
            {selectedModeInfo.label}
          </h2>

          {/* Description */}
          <div style={{ 
            fontSize: 13, 
            fontWeight: 500, 
            color: 'rgba(0,212,255,0.7)',
            letterSpacing: '0.05em',
            marginBottom: 32,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            {selectedModeInfo.description}
          </div>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>
                Yüksek Skor
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 900,
                color: '#a855f7',
              }}>
                {selectedModeBestScore.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>
                Sıralama
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 900,
                color: '#00d4ff',
              }}>
                {rankDisplay}
              </div>
            </div>
          </div>

          {/* Play Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { playClick(); initGame(selectedMode); }}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: 50,
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: '0 8px 24px rgba(0,212,255,0.3)',
            }}
          >
            OYNA
          </motion.button>
        </motion.div>

        {/* LIVE CHALLENGE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Canlı Meydan Okuma
            </div>
            <div style={{ 
              fontSize: 11, 
              fontWeight: 600, 
              color: '#f59e0b',
              background: 'rgba(245,158,11,0.1)',
              padding: '4px 8px',
              borderRadius: 6,
            }}>
              Kalan: 04:22:10
            </div>
          </div>

          {/* Task */}
          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
            Neon Rift Turnuvası
          </div>

          {/* Progress */}
          <div style={{ 
            width: '100%', 
            height: 8, 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 12,
          }}>
            <div style={{ 
              width: '68%', 
              height: '100%', 
              background: 'linear-gradient(90deg, #00d4ff, #a855f7)',
            }} />
          </div>

          {/* Competitors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: -4 }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: '#ef4444',
                border: '2px solid #0a0e1a',
              }} />
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: '#10b981',
                border: '2px solid #0a0e1a',
                marginLeft: -8,
              }} />
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: '#a855f7',
                border: '2px solid #0a0e1a',
                marginLeft: -8,
              }} />
            </div>
          </div>
        </motion.div>

        {/* MISSION MAP CARD - Removed */}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10,14,26,0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,212,255,0.1)',
        padding: '12px 16px 16px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
        <button
          onClick={() => { playClick(); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          <div style={{
            fontSize: 20,
            color: '#00d4ff',
          }}>
            ▦
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.05em' }}>
            DASHBOARD
          </span>
        </button>

        <button
          onClick={() => { playClick(); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          <div style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.4)',
          }}>
            ⚡
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
            QUESTS
          </span>
        </button>

        {/* Login Button - Only show if not logged in */}
        {!user && (
          <button
            onClick={() => { playClick(); useAuthStore.getState().signInWithGoogle(); }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 12,
              cursor: 'pointer',
              padding: '12px 20px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))';
            }}
          >
            <div style={{
              fontSize: 20,
              color: 'rgba(96, 165, 250, 1)',
            }}>
              🔐
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(96, 165, 250, 1)', letterSpacing: '0.05em' }}>
              GİRİŞ YAP
            </span>
          </button>
        )}

        <button
          onClick={() => { playClick(); onOpenLeaderboard(GameMode.ENDLESS); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          <div style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.4)',
          }}>
            🏆
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
            RANK
          </span>
        </button>

        <button
          onClick={() => { playClick(); onOpenProfile(); }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          <div style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.4)',
          }}>
            👤
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
            PROFILE
          </span>
        </button>
      </div>
    </motion.div>
  );
};
