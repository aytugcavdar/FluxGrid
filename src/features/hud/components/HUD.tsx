import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { useStreakStore } from '@shared/store/streakStore';
import { Volume2, VolumeX, Home } from 'lucide-react';
import { GameMode, AppState } from '@shared/types';
import { getMuted, toggleMute, playClick } from '../../../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { StreakBadge } from '@shared/components/StreakBadge';
import { StreakShieldModal } from '../../../app/components/StreakShieldModal';
import { AdManager } from '../../../core/services/ads/AdManager';
import { TierProgressBar } from './TierProgressBar';
import { TimedHUD } from './TimedHUD';

/* ─── Event config ─── */
const EVENT_CONFIG: Record<
  'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID',
  { label: string; color: string; bg: string; icon: string }
> = {
    ICE_STORM:    { label: 'Buz Fırtınası',              color: '#38adf5', bg: 'rgba(56,173,245,0.1)',   icon: '❄️' },
    QUAKE:        { label: 'Deprem!',                    color: '#f97316', bg: 'rgba(249,115,22,0.1)',   icon: '🌋' },
    MIRROR:       { label: 'Ayna Modu',                  color: '#f472b6', bg: 'rgba(244,114,182,0.1)', icon: '🪞' },
    CHAOS:        { label: 'Kaos!',                      color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  icon: '💥' },
    VOID:         { label: 'Void — satırlar siliniyor!', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: '🕳️' },
};

/* ─── Animated score number ─── */
const AnimatedScore: React.FC<{ value: number; color: string }> = ({ value, color }) => {
    const prevRef  = useRef(value);
    const [bump, setBump] = useState(false);
    const formatted = value.toLocaleString();
    const digitCount = String(Math.max(0, Math.floor(value))).length;
    const fontSize = digitCount >= 9 ? 16 : digitCount >= 8 ? 18 : digitCount >= 7 ? 20 : 24;

    useEffect(() => {
        if (value > prevRef.current) {
            setBump(true);
            const t = setTimeout(() => setBump(false), 200);
            prevRef.current = value;
            return () => clearTimeout(t);
        }
        prevRef.current = value;
    }, [value]);

    return (
        <motion.span
            animate={bump ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
                fontSize,
                fontWeight: 800,
                color,
                letterSpacing: 0,
                lineHeight: 1,
                display: 'block',
                flex: '1 1 auto',
                maxWidth: '100%',
                minWidth: 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
            }}
        >
            {formatted}
        </motion.span>
    );
};



/* ══════════════════════════════════════════════════════════════ */
export const HUD: React.FC = React.memo(() => {
    const {
        score, highScore, combo,
        gameMode, setAppState,
        activeEvent, eventMovesRemaining,
        progressionState, difficultyTier, isGameOver,
    } = useGameStore();

    const { currentStreak, todayPlayed, streakShields, addStreakShield } = useStreakStore();
    const colors = useThemeStore(state => state.getThemeColors());
    const [muted, setMuted]           = useState(getMuted);
    const [showShieldModal, setShowShieldModal] = useState(false);

    const handleMute = () => { const v = toggleMute(); setMuted(v); };
    const handleShieldPress = () => { playClick(); setShowShieldModal(true); };
    const handleWatchAd = async () => {
        const result = await AdManager.showRewardedStreakShield();
        if (result.success) addStreakShield();
        setShowShieldModal(false);
    };

    /* ── Score text color — pulses on high combo ── */
    const scoreColor = combo >= 8
        ? '#f472b6'
        : combo >= 5
        ? '#fbbf24'
        : colors.textPrimary;

    /* ── Timed mode'da özel HUD ── */
    if (gameMode === GameMode.TIMED) {
        return <TimedHUD />;
    }

    return (
        <>
            {/* ══ MOBILE LAYOUT ══ */}
            <div className="md:hidden w-full h-full flex flex-col" style={{ gap: 5 }}>

                {/* ── ROW 1: Home │ Score card │ Timer │ Streak │ Mute ── */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 6, padding: '0 10px', height: 56,
                }}>

                    {/* Home button */}
                    <button
                        id="hud-home-btn"
                        onClick={() => {
                            playClick();
                            document.body.classList.remove('dragging');
                            useGameStore.getState().setDraggedPiece(null);
                            if (!isGameOver) useGameStore.getState().saveCurrentGame();
                            setAppState(AppState.HOME);
                        }}
                        style={{
                            width: 40, height: 40, minWidth: 40,
                            borderRadius: 11,
                            border: `1px solid ${colors.hudBorder}`,
                            background: colors.hudBackground,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: colors.textTertiary, flexShrink: 0, cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                    >
                        <Home size={18} />
                    </button>

                    {/* ── Score card ── */}
                    <div className="combo-display" style={{
                        flex: 1, position: 'relative',
                        display: 'flex', alignItems: 'center',
                        padding: '0 12px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 13,
                        border: `1px solid ${colors.hudBorder}`,
                        boxShadow: combo >= 5
                            ? `0 0 18px ${combo >= 8 ? 'rgba(244,114,182,0.2)' : 'rgba(251,191,36,0.15)'}`
                            : '0 2px 8px rgba(0,0,0,0.12)',
                        transition: 'box-shadow 0.4s ease',
                        minWidth: 0, overflow: 'hidden',
                        height: 44,
                    }}>
                        {/* Score only; combo uses the dedicated side bar. */}
                        <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                            <AnimatedScore value={score} color={scoreColor} />

                        </div>

                        {/* Dikey ayırıcı */}
                        <div style={{
                            width: 1, alignSelf: 'stretch',
                            margin: '10px 8px 10px 4px',
                            background: 'rgba(255,255,255,0.07)',
                            flexShrink: 0,
                        }} />

                        {/* Sağ: EN İYİ */}
                        <div style={{ width: 58, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 2, overflow: 'hidden' }}>
                            <span style={{
                                fontSize: 9, fontWeight: 700, lineHeight: 1,
                                letterSpacing: '0.5px', textTransform: 'uppercase',
                                color: colors.textTertiary, opacity: 0.55,
                            }}>
                                EN İYİ
                            </span>
                            <span style={{
                                fontSize: 13, fontWeight: 800, lineHeight: 1,
                                color: colors.textTertiary,
                                maxWidth: '100%',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                fontVariantNumeric: 'tabular-nums',
                            }}>
                                {highScore.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Streak */}
                    <div style={{ flexShrink: 0 }}>
                        <StreakBadge
                            streak={currentStreak}
                            todayPlayed={todayPlayed}
                            shields={streakShields}
                            onShieldPress={handleShieldPress}
                        />
                    </div>

                    {/* Mute */}
                    <button
                        id="hud-mute-btn"
                        onClick={handleMute}
                        style={{
                            width: 40, height: 40, minWidth: 40, borderRadius: 11,
                            border: `1px solid ${colors.hudBorder}`,
                            background: colors.hudBackground,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                    >
                        {muted
                            ? <VolumeX size={18} style={{ color: colors.textTertiary, opacity: 0.4 }} />
                            : <Volume2 size={18} style={{ color: colors.textTertiary }} />
                        }
                    </button>
                </div>

                {/* ── ROW 2: Tier Progress Bar ── */}
                {gameMode === GameMode.ENDLESS && progressionState && (
                    <div style={{ padding: '0 10px' }}>
                        <TierProgressBar tier={difficultyTier} score={score} />
                    </div>
                )}

                {/* ── EVENT BANNER ── */}
                <AnimatePresence>
                    {activeEvent && (
                        <motion.div
                            key={activeEvent}
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            style={{
                                margin: '0 10px',
                                padding: '7px 12px',
                                borderRadius: 10,
                                background: EVENT_CONFIG[activeEvent].bg,
                                border: `1px solid ${EVENT_CONFIG[activeEvent].color}40`,
                                boxShadow: `0 0 14px ${EVENT_CONFIG[activeEvent].color}18`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            {/* Sol: pulse dot + icon + label */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                        background: EVENT_CONFIG[activeEvent].color,
                                        boxShadow: `0 0 6px ${EVENT_CONFIG[activeEvent].color}`,
                                    }}
                                />
                                <span style={{
                                    fontSize: 11, fontWeight: 700, lineHeight: 1,
                                    color: EVENT_CONFIG[activeEvent].color,
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                    {EVENT_CONFIG[activeEvent].icon} {EVENT_CONFIG[activeEvent].label}
                                </span>
                            </div>

                            {/* Sağ: hamle badge */}
                            {eventMovesRemaining < 9999 && (
                                <span style={{
                                    fontSize: 10, fontWeight: 700, lineHeight: 1,
                                    color: EVENT_CONFIG[activeEvent].color,
                                    background: `${EVENT_CONFIG[activeEvent].color}18`,
                                    border: `1px solid ${EVENT_CONFIG[activeEvent].color}35`,
                                    padding: '3px 8px', borderRadius: 6,
                                }}>
                                    {eventMovesRemaining} hamle
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Modals ── */}
            <StreakShieldModal
                isVisible={showShieldModal}
                currentStreak={currentStreak}
                streakBroken={false}
                onWatchAd={handleWatchAd}
                onClose={() => setShowShieldModal(false)}
                shieldsAvailable={streakShields}
            />
        </>
    );
});
