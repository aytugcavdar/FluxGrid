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

/* ─── Floating score delta popup ─── */
interface ScoreDelta { id: number; value: number; combo: number }

const FloatingDelta: React.FC<{ delta: ScoreDelta }> = ({ delta }) => {
    const isCombo  = delta.combo >= 3;
    const isBig    = delta.value >= 500;
    const color    = delta.combo >= 8 ? '#f472b6' : delta.combo >= 5 ? '#f59e0b' : '#34d399';

    return (
        <motion.span
            key={delta.id}
            initial={{ opacity: 1, y: 0, scale: 0.85 }}
            animate={{ opacity: 0, y: -28, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isBig ? 1.1 : 0.85, ease: 'easeOut' }}
            style={{
                position: 'absolute',
                top: 0, right: 0,
                pointerEvents: 'none',
                fontSize: isBig ? 13 : 11,
                fontWeight: 800,
                color: isCombo ? color : 'rgba(255,255,255,0.7)',
                textShadow: isCombo ? `0 0 12px ${color}CC` : 'none',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                zIndex: 20,
                letterSpacing: '-0.3px',
            }}
        >
            +{delta.value.toLocaleString()}
        </motion.span>
    );
};

/* ─── Animated score number ─── */
const AnimatedScore: React.FC<{ value: number; color: string }> = ({ value, color }) => {
    const prevRef  = useRef(value);
    const [bump, setBump] = useState(false);

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
                fontSize: 24,
                fontWeight: 800,
                color,
                letterSpacing: '-0.8px',
                lineHeight: 1,
                display: 'inline-block',
            }}
        >
            {value.toLocaleString()}
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

    /* ── Score delta tracking ── */
    const prevScoreRef       = useRef(score);
    const prevComboRef       = useRef(combo);
    const deltaIdRef         = useRef(0);
    const [deltas, setDeltas] = useState<ScoreDelta[]>([]);

    useEffect(() => {
        const diff = score - prevScoreRef.current;
        if (diff > 0) {
            const id = ++deltaIdRef.current;
            setDeltas(d => [...d.slice(-4), { id, value: diff, combo: prevComboRef.current }]);
            setTimeout(() => setDeltas(d => d.filter(x => x.id !== id)), 1200);
        }
        prevScoreRef.current  = score;
        prevComboRef.current  = combo;
    }, [score]);

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
                        minWidth: 0, overflow: 'visible',
                        height: 44,
                    }}>
                        {/* Floating score deltas */}
                        <AnimatePresence>
                            {deltas.map(d => <FloatingDelta key={d.id} delta={d} />)}
                        </AnimatePresence>

                        {/* Sol: Score + Combo */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                            <AnimatedScore value={score} color={scoreColor} />

                            <AnimatePresence>
                                {combo >= 2 && (
                                    <motion.span
                                        key={combo}
                                        initial={{ scale: 0.6, opacity: 0, y: -6 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.6, opacity: 0, y: 4 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                        style={{
                                            fontSize: 11, fontWeight: 800, lineHeight: 1,
                                            color: combo >= 8 ? '#f472b6' : combo >= 5 ? '#f59e0b' : '#34d399',
                                            background: combo >= 8
                                                ? 'rgba(244,114,182,0.15)'
                                                : combo >= 5 ? 'rgba(245,158,11,0.15)'
                                                : 'rgba(52,211,153,0.15)',
                                            border: `1px solid ${combo >= 8
                                                ? 'rgba(244,114,182,0.45)'
                                                : combo >= 5 ? 'rgba(245,158,11,0.45)'
                                                : 'rgba(52,211,153,0.45)'}`,
                                            padding: '2px 7px', borderRadius: 6,
                                            boxShadow: combo >= 8
                                                ? '0 0 10px rgba(244,114,182,0.3)'
                                                : combo >= 5 ? '0 0 10px rgba(245,158,11,0.25)' : 'none',
                                        }}
                                    >
                                        {combo}×
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Dikey ayırıcı */}
                        <div style={{
                            width: 1, alignSelf: 'stretch',
                            margin: '10px 10px 10px 4px',
                            background: 'rgba(255,255,255,0.07)',
                            flexShrink: 0,
                        }} />

                        {/* Sağ: EN İYİ */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 2 }}>
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
