import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../features/game/store/gameStore';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';
import { getDailyPlayedToday, getStreak } from '@utils/streakManager';

interface HomeScreenProps {
  onOpenThemeSelector: () => void;
}

const MODE_INFO: Record<GameMode, { label: string; desc: string; icon: string; color: string }> = {
  [GameMode.ENDLESS]: { label: 'Sonsuz Mod', desc: 'Reflekslerini sınırla', icon: '∞', color: '#a855f7' },
  [GameMode.TIMED]: { label: 'Timed Mod', desc: 'Zamana karşı yarış', icon: '⏱', color: '#f59e0b' },
  [GameMode.ZEN]: { label: 'Zen Mod', desc: 'Rahatla ve oyna', icon: '☁', color: '#a78bfa' },
  [GameMode.DAILY_CHALLENGE]: { label: 'Günlük Mod', desc: 'Günlük meydan okuma', icon: '📅', color: '#10b981' },
};

const WEEK_DAYS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'B'];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenThemeSelector,
}) => {
  const { initGame, highScores } = useGameStore();
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.ENDLESS);

  // Get best score for selected mode
  const selectedModeBestScore = useMemo(() => {
    const val = highScores[selectedMode];
    return typeof val === 'number' && val >= 0 ? val : 0;
  }, [selectedMode, highScores]);

  // NEW FEATURE 1: Daily puzzle state
  const dailyPlayedToday = getDailyPlayedToday();
  const currentStreak = getStreak();

  // NEW FEATURE 2: Get other modes (exclude selected and daily)
  const otherModes = useMemo(() => {
    return Object.values(GameMode).filter(
      m => m !== selectedMode && m !== GameMode.DAILY_CHALLENGE
    );
  }, [selectedMode]);

  const selectedModeInfo = MODE_INFO[selectedMode] || MODE_INFO[GameMode.ENDLESS];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0e1a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Scrollable Content Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '16px',
      }}>
        <div style={{ width: '100%', maxWidth: '448px', margin: '0 auto' }}>
          {/* TOP BAR */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '32px' 
        }}>
          {/* BUG FIX 2: Video button removed, placeholder only */}
          <div style={{ width: '34px', height: '34px' }} />

          {/* Logo */}
          <h1 style={{
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            margin: 0,
          }}>
            <span style={{ color: 'white' }}>FLUX</span>
            <span style={{ color: '#3b82f6' }}>GRID</span>
          </h1>

          {/* Settings Button */}
          <button
            onClick={() => { playClick(); onOpenThemeSelector(); }}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m10 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" />
            </svg>
          </button>
        </div>

        {/* MODE TABS */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          background: 'rgba(255,255,255,0.03)',
          padding: '3px',
          borderRadius: '10px',
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
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
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
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '20px 16px 16px',
            marginBottom: '16px',
          }}
        >
          {/* Mode Icon */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '16px' 
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(0,212,255,0.08)',
              border: '1.5px solid rgba(0,212,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}>
              {selectedModeInfo.icon}
            </div>
          </div>

          {/* Mode Name */}
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#e0f2fe',
            letterSpacing: '-0.02em',
            marginBottom: '6px',
            textAlign: 'center',
            margin: '0 0 6px 0',
          }}>
            {selectedModeInfo.label}
          </h2>

          {/* Description */}
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: 'rgba(0,212,255,0.6)',
            letterSpacing: '0.06em',
            marginBottom: '20px',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            {selectedModeInfo.desc}
          </div>

          {/* Stats Row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}>
            {/* High Score */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '10px', 
                color: 'rgba(255,255,255,0.4)', 
                marginBottom: '4px', 
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                Yüksek Skor
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#a855f7',
              }}>
                {selectedModeBestScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Play Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { playClick(); initGame(selectedMode); }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '40px',
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            OYNA
          </motion.button>
        </motion.div>

        {/* NEW FEATURE 2: OTHER MODES SECTION */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px',
          }}>
            Diğer modlar
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}>
            {otherModes.map((mode) => {
              const modeInfo = MODE_INFO[mode];
              const modeScore = highScores[mode];
              const scoreDisplay = typeof modeScore === 'number' && modeScore > 0
                ? modeScore.toLocaleString()
                : 'Henüz oynanmadı';

              return (
                <motion.div
                  key={mode}
                  onClick={() => { playClick(); initGame(mode); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '0.5px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {/* Mode Icon */}
                  <div style={{ fontSize: '18px' }}>
                    {modeInfo.icon}
                  </div>

                  {/* Mode Name */}
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#e0f2fe',
                    textAlign: 'center',
                  }}>
                    {modeInfo.label}
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.4)',
                    textAlign: 'center',
                  }}>
                    {modeInfo.desc}
                  </div>

                  {/* Score */}
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: typeof modeScore === 'number' && modeScore > 0 
                      ? modeInfo.color
                      : 'rgba(255,255,255,0.3)',
                    textAlign: 'center',
                  }}>
                    {scoreDisplay}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* NEW FEATURE 1: DAILY PUZZLE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={() => { playClick(); initGame(GameMode.DAILY_CHALLENGE); }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(16,185,129,0.25)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Header Row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px' 
          }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: '#e0f2fe',
            }}>
              Günlük Bulmaca
            </div>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              color: dailyPlayedToday ? '#10b981' : '#60a5fa',
              background: dailyPlayedToday 
                ? 'rgba(16,185,129,0.1)' 
                : 'rgba(59,130,246,0.1)',
              border: dailyPlayedToday
                ? '1px solid rgba(16,185,129,0.3)'
                : '1px solid rgba(59,130,246,0.3)',
              padding: '3px 8px',
              borderRadius: '20px',
            }}>
              {dailyPlayedToday ? 'Bugün oynandı' : 'Oyna'}
            </div>
          </div>

          {/* Streak Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}>
              🔥
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {currentStreak > 0 ? (
                <>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#f59e0b',
                  }}>
                    {currentStreak} gün
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    Seri devam ediyor
                  </div>
                </>
              ) : (
                <div style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.4)',
                }}>
                  Henüz seri yok
                </div>
              )}
            </div>
          </div>

          {/* Weekly Dot Grid */}
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            justifyContent: 'center',
            marginTop: '10px',
          }}>
            {WEEK_DAYS.map((day, index) => {
              const isToday = index === 6;
              const isCompleted = isToday && dailyPlayedToday;
              
              return (
                <div
                  key={index}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: isCompleted
                      ? 'rgba(16,185,129,0.25)'
                      : isToday
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(255,255,255,0.05)',
                    border: isCompleted
                      ? '1px solid rgba(16,185,129,0.5)'
                      : isToday
                        ? '1px solid rgba(16,185,129,0.3)'
                        : '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: isToday ? 700 : 600,
                    color: isCompleted
                      ? '#10b981'
                      : isToday
                        ? 'rgba(16,185,129,0.8)'
                        : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};
