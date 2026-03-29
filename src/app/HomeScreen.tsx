import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../features/game/store/gameStore';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';
import { useCountUp } from '../shared/hooks/useCountUp';

interface HomeScreenProps {
  onOpenThemeSelector: () => void;
}

const MODE_INFO = {
  [GameMode.ENDLESS]: {
    label: 'Sonsuz Mod',
    desc: 'Reflekslerini sınırla',
    descLong: 'Limit yok · Yerçekimi · Yetenekler',
    icon: '∞',
    color: '#a855f7',
  },
  [GameMode.TIMED]: {
    label: 'Timed Mod',
    desc: '60 saniye, max skor',
    descLong: 'Chrono bloklar · Sprint bonus · Combo rush',
    icon: '⏱',
    color: '#f59e0b',
  },
};

const MODES = [GameMode.ENDLESS, GameMode.TIMED];

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Theme constants
const THEME = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '32px',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '14px',
    xl: '40px',
  },
  iconSize: {
    sm: '20px',
    md: '26px',
    lg: '44px',
    xl: '60px',
  },
};

type BottomTab = 'home' | 'stats' | 'profile';

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenThemeSelector,
}) => {
  const { initGame, highScores, stats } = useGameStore();
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.ENDLESS);
  const [activeTab, setActiveTab] = useState<BottomTab>('home');

  // Get best score for selected mode
  const selectedModeBestScore = useMemo(() => {
    const val = highScores[selectedMode];
    return typeof val === 'number' && val >= 0 ? val : 0;
  }, [selectedMode, highScores]);

  const selectedModeInfo = MODE_INFO[selectedMode];
  const selectedColor = selectedModeInfo.color;

  // Animated score for selected mode
  const animatedScore = useCountUp(selectedModeBestScore, 600);

  // Daily streak from localStorage
  const dailyStreak = parseInt(localStorage.getItem('flux_daily_streak') || '0');

  // Memoized rgba colors for performance
  const selectedRgba = useMemo(() => ({
    bg: hexToRgba(selectedColor, 0.13),
    border: hexToRgba(selectedColor, 0.35),
    light: hexToRgba(selectedColor, 0.08),
    lightBorder: hexToRgba(selectedColor, 0.18),
    text: hexToRgba(selectedColor, 0.7),
    chip: hexToRgba(selectedColor, 0.65),
    chipBorder: hexToRgba(selectedColor, 0.15),
    button: hexToRgba(selectedColor, 0.12),
    buttonBorder: hexToRgba(selectedColor, 0.3),
  }), [selectedColor]);

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
          {/* ══════════════════════════════════════════════════════════════
              1. HERO ZONE
              ══════════════════════════════════════════════════════════════ */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '32px' 
          }}>
            {/* Placeholder */}
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

          {/* ══════════════════════════════════════════════════════════════
              2. TAB SATIRI
              ══════════════════════════════════════════════════════════════ */}
          <div style={{ 
            display: 'flex', 
            gap: '0px', 
            marginBottom: THEME.spacing.md,
            background: 'rgba(255,255,255,0.04)',
            padding: '3px',
            borderRadius: THEME.borderRadius.sm,
          }}>
            {MODES.map((mode) => {
              const isActive = selectedMode === mode;
              const modeInfo = MODE_INFO[mode];
              const modeRgba = hexToRgba(modeInfo.color, isActive ? 0.13 : 0);
              const modeBorder = hexToRgba(modeInfo.color, 0.35);
              return (
                <button
                  key={mode}
                  onClick={() => { playClick(); setSelectedMode(mode); }}
                  aria-label={`${modeInfo.label} seç`}
                  aria-pressed={isActive}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: THEME.borderRadius.sm,
                    background: isActive ? modeRgba : 'transparent',
                    border: isActive ? `0.5px solid ${modeBorder}` : 'none',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isActive ? modeInfo.color : 'rgba(255,255,255,0.32)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {modeInfo.icon}  {mode === GameMode.ENDLESS ? 'SONSUZ' : 'TIMED'}
                </button>
              );
            })}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              3. ANA MOD KARTI (selectedMode)
              ══════════════════════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `0.5px solid ${selectedRgba.chipBorder}`,
                borderRadius: THEME.borderRadius.lg,
                padding: THEME.spacing.lg,
                marginBottom: THEME.spacing.md,
              }}
            >
              {/* Üst satır */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                alignItems: 'center', 
                marginBottom: '12px' 
              }}>
                {/* Sol - ikon circle */}
                <div style={{
                  width: THEME.iconSize.xl,
                  height: THEME.iconSize.xl,
                  borderRadius: '30px',
                  background: selectedRgba.light,
                  border: `0.5px solid ${selectedRgba.lightBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: THEME.iconSize.md,
                  flexShrink: 0,
                }}>
                  {selectedModeInfo.icon}
                </div>

                {/* Sağ */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#e0f2fe',
                    marginBottom: '2px',
                  }}>
                    {selectedModeInfo.label}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: selectedRgba.text,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: THEME.spacing.sm,
                  }}>
                    {selectedModeInfo.desc}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.3)',
                    marginBottom: '2px',
                  }}>
                    En İyi Skor
                  </div>
                  <div style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: selectedModeBestScore > 0 ? selectedColor : 'rgba(255,255,255,0.25)',
                  }}>
                    {selectedModeBestScore > 0 ? (
                      <motion.span key={selectedMode}>
                        {animatedScore.toLocaleString()}
                      </motion.span>
                    ) : (
                      <span style={{ fontSize: '13px' }}>Henüz oynanmadı</span>
                    )}
                  </div>
                </div>
              </div>

              {/* İnce ayırıcı */}
              <div style={{
                height: '1px',
                background: 'rgba(255,255,255,0.05)',
                marginBottom: '10px',
              }} />

              {/* Özellik chips */}
              <div style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                marginBottom: '14px',
              }}>
                {selectedModeInfo.descLong.split(' · ').map((chip: string, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '8px',
                      padding: '3px 10px',
                      borderRadius: '10px',
                      background: selectedRgba.light,
                      border: `0.5px solid ${selectedRgba.chipBorder}`,
                      color: selectedRgba.chip,
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>

              {/* OYNA butonu */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => { playClick(); initGame(selectedMode); }}
                aria-label={`${selectedModeInfo.label} oyna`}
                style={{
                  width: '100%',
                  height: '28px',
                  borderRadius: THEME.borderRadius.lg,
                  background: selectedRgba.button,
                  border: `0.5px solid ${selectedRgba.buttonBorder}`,
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: selectedColor,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                OYNA
              </motion.button>
            </motion.div>
          </AnimatePresence>

          {/* ══════════════════════════════════════════════════════════════
              5. STATS SATIRI
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'home' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', gap: THEME.spacing.md, marginBottom: THEME.spacing.lg }}
            >
              {/* Sol kart - Günlük Seri */}
              <div style={{
                flex: 1,
                padding: THEME.spacing.md,
                borderRadius: THEME.borderRadius.md,
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  fontSize: '8px',
                  color: 'rgba(255,255,255,0.3)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}>
                  🔥 Günlük Seri
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#f59e0b',
                }}>
                  {dailyStreak}
                </div>
                <div style={{
                  fontSize: '9px',
                  color: 'rgba(245,158,11,0.55)',
                }}>
                  gün
                </div>
                <div style={{
                  fontSize: '7px',
                  color: 'rgba(255,255,255,0.2)',
                  marginTop: '2px',
                }}>
                  Devam ediyor
                </div>
              </div>

              {/* Sağ kart - Toplam Oyun */}
              <div style={{
                flex: 1,
                padding: THEME.spacing.md,
                borderRadius: THEME.borderRadius.md,
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  fontSize: '8px',
                  color: 'rgba(255,255,255,0.3)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}>
                  🎮 Toplam Oyun
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#60a5fa',
                }}>
                  {stats.gamesPlayed || 0}
                </div>
                <div style={{
                  fontSize: '9px',
                  color: 'rgba(96,165,250,0.55)',
                }}>
                  oyun
                </div>
                <div style={{
                  fontSize: '7px',
                  color: 'rgba(255,255,255,0.2)',
                  marginTop: '2px',
                }}>
                  Tüm zamanlar
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Tab Content */}
          {activeTab === 'stats' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ marginBottom: THEME.spacing.lg }}
            >
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid rgba(255,255,255,0.05)',
                borderRadius: THEME.borderRadius.md,
                padding: THEME.spacing.lg,
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#e0f2fe',
                  marginBottom: THEME.spacing.md,
                  margin: 0,
                }}>
                  📊 İstatistikler
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: THEME.spacing.sm }}>
                  <StatRow label="Toplam Skor" value={stats.totalScore?.toLocaleString() || '0'} color="#a855f7" />
                  <StatRow label="Blok Yerleştirildi" value={stats.blocksPlaced?.toLocaleString() || '0'} color="#3b82f6" />
                  <StatRow label="Satır Temizlendi" value={stats.linesCleared?.toLocaleString() || '0'} color="#10b981" />
                  <StatRow label="Bomba Patlatıldı" value={stats.bombsExploded?.toLocaleString() || '0'} color="#ef4444" />
                  <StatRow label="Buz Kırıldı" value={stats.iceBroken?.toLocaleString() || '0'} color="#06b6d4" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ marginBottom: THEME.spacing.lg }}
            >
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid rgba(255,255,255,0.05)',
                borderRadius: THEME.borderRadius.md,
                padding: THEME.spacing.lg,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '48px', marginBottom: THEME.spacing.md }}>👤</div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#e0f2fe',
                  marginBottom: THEME.spacing.sm,
                  margin: 0,
                }}>
                  Profil
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)',
                  margin: 0,
                }}>
                  Yakında gelecek özellikler...
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM NAVIGATION
          ══════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10,14,26,0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        padding: '8px 16px 12px',
      }}>
        <div style={{
          maxWidth: '448px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}>
          {/* Home Tab */}
          <button
            onClick={() => { playClick(); setActiveTab('home'); }}
            aria-label="Ana sayfa"
            aria-pressed={activeTab === 'home'}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              fontSize: '20px',
              opacity: activeTab === 'home' ? 1 : 0.4,
              transition: 'all 0.2s ease',
            }}>
              🏠
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: activeTab === 'home' ? '#00d4ff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s ease',
            }}>
              Ana Sayfa
            </span>
            {activeTab === 'home' && (
              <motion.div
                layoutId="activeTab"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '32px',
                  height: '2px',
                  background: '#00d4ff',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>

          {/* Stats Tab */}
          <button
            onClick={() => { playClick(); setActiveTab('stats'); }}
            aria-label="İstatistikler"
            aria-pressed={activeTab === 'stats'}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              fontSize: '20px',
              opacity: activeTab === 'stats' ? 1 : 0.4,
              transition: 'all 0.2s ease',
            }}>
              📊
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: activeTab === 'stats' ? '#00d4ff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s ease',
            }}>
              İstatistikler
            </span>
            {activeTab === 'stats' && (
              <motion.div
                layoutId="activeTab"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '32px',
                  height: '2px',
                  background: '#00d4ff',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => { playClick(); setActiveTab('profile'); }}
            aria-label="Profil"
            aria-pressed={activeTab === 'profile'}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              fontSize: '20px',
              opacity: activeTab === 'profile' ? 1 : 0.4,
              transition: 'all 0.2s ease',
            }}>
              👤
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: activeTab === 'profile' ? '#00d4ff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s ease',
            }}>
              Profil
            </span>
            {activeTab === 'profile' && (
              <motion.div
                layoutId="activeTab"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '32px',
                  height: '2px',
                  background: '#00d4ff',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for stat rows
const StatRow: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '0.5px solid rgba(255,255,255,0.05)',
  }}>
    <span style={{
      fontSize: '11px',
      color: 'rgba(255,255,255,0.6)',
    }}>
      {label}
    </span>
    <span style={{
      fontSize: '13px',
      fontWeight: 700,
      color: color,
    }}>
      {value}
    </span>
  </div>
);
