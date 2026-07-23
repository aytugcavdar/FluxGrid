import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { Volume2, VolumeX, Home } from 'lucide-react';
import { GameMode, AppState } from '@shared/types';
import { getMuted, toggleMute, playClick } from '../../../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { COMBO_TIMER } from '../../game/constants';
import { TimedHUD } from './TimedHUD';
import { ScoreImpactValue } from './ScoreImpactValue';
import { TierProgressInline } from './TierProgressInline';
import { Capacitor } from '@capacitor/core';
import { usePerformanceStore } from '../../performance/store/performanceStore';
import { useTranslation } from 'react-i18next';

const EVENT_CONFIG: Record<
  'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID',
  { labelKey: string; color: string; bg: string; icon: string }
> = {
    ICE_STORM:    { labelKey: 'hud.events.iceStorm', color: '#38adf5', bg: 'rgba(56,173,245,0.1)', icon: '❄️' },
    QUAKE:        { labelKey: 'hud.events.quake', color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: '🌋' },
    MIRROR:       { labelKey: 'hud.events.mirror', color: '#f472b6', bg: 'rgba(244,114,182,0.1)', icon: '🪞' },
    CHAOS:        { labelKey: 'hud.events.chaos', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: '💥' },
    VOID:         { labelKey: 'hud.events.void', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '🕳️' },
};

/* ─── Animated score number ─── */
const AnimatedScore: React.FC<{ value: number; color: string; deferImpact: boolean }> = ({ value, color, deferImpact }) => {
    const digitCount = String(Math.max(0, Math.floor(value))).length;
    const fontSize = digitCount >= 9 ? 16 : digitCount >= 8 ? 18 : digitCount >= 7 ? 20 : 24;

    return (
        <ScoreImpactValue
            value={value}
            color={color}
            deferImpact={deferImpact}
            wrapperStyle={{ flex: '1 1 auto', maxWidth: '100%', overflow: 'hidden' }}
            style={{
                fontSize,
                fontWeight: 800,
                letterSpacing: 0,
                flex: '1 1 auto',
                maxWidth: '100%',
            }}
        />
    );
};

const getComboFeedback = (combo: number) => {
    if (combo >= 12) return { color: '#c084fc', glow: 12 };
    if (combo >= 8) return { color: '#f472b6', glow: 10 };
    if (combo >= 5) return { color: '#fbbf24', glow: 8 };
    if (combo >= 3) return { color: '#34d399', glow: 6 };
    return { color: '#22c55e', glow: 5 };
};

const ComboBadge: React.FC = React.memo(() => {
    const { t } = useTranslation();
    const combo = useGameStore(state => state.combo);
    const comboTimeLeft = useGameStore(state => state.comboTimeLeft);
    const comboTimerDuration = useGameStore(state => state.comboTimerDuration);
    const comboTimerStartTime = useGameStore(state => state.comboTimerStartTime);
    const isGameOver = useGameStore(state => state.isGameOver);
    const deviceTier = usePerformanceStore(state => state.deviceTier);
    const [now, setNow] = useState(() => Date.now());
    const useReducedGameplayMotion = Capacitor.isNativePlatform() ||
        deviceTier === 'low' ||
        deviceTier === 'low-mid' ||
        deviceTier === 'mid-low' ||
        deviceTier === 'mid';

    useEffect(() => {
        if (combo <= 1 || isGameOver || comboTimerStartTime === null) return;

        const tick = () => setNow(Date.now());
        tick();
        const intervalId = window.setInterval(
            tick,
            useReducedGameplayMotion ? 1000 : 500
        );
        return () => window.clearInterval(intervalId);
    }, [combo, comboTimerStartTime, isGameOver, useReducedGameplayMotion]);

    if (combo <= 1 || isGameOver) return null;

    const durationMs = comboTimerDuration > 0 ? comboTimerDuration : COMBO_TIMER.DURATION;
    const durationSeconds = durationMs / 1000;
    const timeLeft = comboTimerStartTime !== null
        ? Math.max(0, (comboTimerStartTime + durationMs - now) / 1000)
        : Math.max(0, comboTimeLeft);
    const fillPercent = Math.max(0, Math.min(100, (timeLeft / durationSeconds) * 100));
    const isCritical = timeLeft <= COMBO_TIMER.CRITICAL_THRESHOLD;
    const isWarning = timeLeft <= COMBO_TIMER.WARNING_THRESHOLD;
    const feedback = getComboFeedback(combo);
    const color = feedback.color;
    const timerColor = isCritical ? '#ef4444'
        : isWarning ? '#f59e0b'
        : color;

    return (
        <motion.div
            key={combo}
            initial={{ scale: 0.72, opacity: 0, rotate: -3 }}
            animate={useReducedGameplayMotion
                ? { scale: 1, opacity: 1, rotate: 0 }
                : {
                    scale: combo >= 8 ? [0.72, 1.2, 1] : [0.72, 1.12, 1],
                    opacity: 1,
                    rotate: [-3, 1, 0],
                }}
            transition={{ duration: useReducedGameplayMotion ? 0.12 : 0.26, times: [0, 0.58, 1], ease: 'easeOut' }}
            style={{
                width: combo >= 10 ? 50 : 44,
                minWidth: combo >= 10 ? 50 : 44,
                height: 28,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 9,
                background: `linear-gradient(145deg, ${color}26, ${color}0d)`,
                border: `1px solid ${color}80`,
                boxShadow: useReducedGameplayMotion
                    ? '0 1px 4px rgba(0,0,0,0.18)'
                    : `0 0 ${feedback.glow}px ${color}${combo >= 5 ? '34' : '22'}`,
                overflow: 'hidden',
                position: 'relative',
                color,
            }}
            aria-label={t('hud.comboTimeAria', { combo, seconds: Math.ceil(timeLeft) })}
        >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, lineHeight: 1 }}>
                <span style={{ fontSize: combo >= 10 ? 13 : 14, fontWeight: 950, fontVariantNumeric: 'tabular-nums' }}>
                    x{combo}
                </span>
                <span style={{ fontSize: 7, fontWeight: 900, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.ceil(timeLeft)}s
                </span>
            </div>
            <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 3,
                background: 'rgba(255,255,255,0.09)',
            }} />
            <div style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: `${fillPercent}%`,
                height: 3,
                background: timerColor,
                boxShadow: useReducedGameplayMotion ? 'none' : `0 0 6px ${timerColor}66`,
            }} />
        </motion.div>
    );
});



/* ══════════════════════════════════════════════════════════════ */
export const HUD: React.FC = React.memo(() => {
    const { t } = useTranslation();
    const {
        score, highScore, combo,
        gameMode, setAppState,
        activeEvent, eventMovesRemaining,
        isGameOver, lastAction, tier6GravityCharge,
    } = useGameStore();

    const colors = useThemeStore(state => state.getThemeColors());
    const [muted, setMuted] = useState(getMuted);
    const isNativeApp = Capacitor.isNativePlatform();
    const hudButtonShadow = isNativeApp ? '0 1px 3px rgba(0,0,0,0.16)' : '0 2px 8px rgba(0,0,0,0.2)';
    const hudCardShadow = isNativeApp
        ? '0 1px 4px rgba(0,0,0,0.14)'
        : combo >= 5
        ? `0 0 14px ${combo >= 8 ? 'rgba(244,114,182,0.14)' : 'rgba(251,191,36,0.11)'}`
        : '0 2px 8px rgba(0,0,0,0.12)';
    const handleMute = () => { const v = toggleMute(); setMuted(v); };

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
            <div className="md:hidden w-full h-full flex flex-col" style={{ gap: 4 }}>

                {/* ── ROW 1: Home │ Score card │ Timer │ Streak │ Mute ── */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 7, padding: '0 8px', height: 60,
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
                            width: 36, height: 36, minWidth: 36,
                            borderRadius: 10,
                            border: `1px solid ${colors.hudBorder}`,
                            background: colors.hudBackground,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: colors.textTertiary, flexShrink: 0, cursor: 'pointer',
                            boxShadow: hudButtonShadow,
                        }}
                    >
                        <Home size={18} />
                    </button>

                    {/* ── Score card ── */}
                    <div className="combo-display" style={{
                        flex: 1, position: 'relative',
                        display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                        justifyContent: 'center',
                        padding: '5px 10px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 13,
                        border: `1px solid ${colors.hudBorder}`,
                        boxShadow: hudCardShadow,
                        transition: isNativeApp ? 'none' : 'box-shadow 0.4s ease',
                        minWidth: 0, overflow: 'hidden',
                        height: 56,
                    }}>
                        <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                    fontSize: 7, fontWeight: 800, lineHeight: 1,
                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                    color: colors.textTertiary, opacity: 0.52,
                                }}>
                                    {t('hud.score')}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                                    <AnimatedScore
                                        value={score}
                                        color={scoreColor}
                                        deferImpact={lastAction?.type === 'CLEAR'}
                                    />
                                    <ComboBadge />
                                </div>
                            </div>
                        </div>

                        {/* Dikey ayırıcı */}
                        <div style={{
                            width: 1, alignSelf: 'stretch',
                            margin: '3px 8px 3px 2px',
                            background: 'rgba(255,255,255,0.07)',
                            flexShrink: 0,
                        }} />

                        {/* Sağ: EN İYİ */}
                        <div style={{ width: 62, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 3, overflow: 'hidden' }}>
                            <span style={{
                                fontSize: 8, fontWeight: 700, lineHeight: 1,
                                letterSpacing: '0.5px', textTransform: 'uppercase',
                                color: colors.textTertiary, opacity: 0.55,
                            }}>
                                {t('hud.best')}
                            </span>
                            <span style={{
                                fontSize: 12, fontWeight: 800, lineHeight: 1,
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

                        {gameMode === GameMode.ENDLESS && (
                            <div style={{ marginTop: 4 }}>
                                <TierProgressInline
                                    score={score}
                                    deferImpact={lastAction?.type === 'CLEAR'}
                                    gravityCharge={tier6GravityCharge}
                                    gravityTriggered={lastAction?.tier6GravityTriggered === true}
                                />
                            </div>
                        )}

                    </div>

                    {/* Mute */}
                    <button
                        id="hud-mute-btn"
                        onClick={handleMute}
                        style={{
                            width: 36, height: 36, minWidth: 36, borderRadius: 10,
                            border: `1px solid ${colors.hudBorder}`,
                            background: colors.hudBackground,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, cursor: 'pointer',
                            boxShadow: hudButtonShadow,
                        }}
                    >
                        {muted
                            ? <VolumeX size={18} style={{ color: colors.textTertiary, opacity: 0.4 }} />
                            : <Volume2 size={18} style={{ color: colors.textTertiary }} />
                        }
                    </button>
                </div>

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
                                boxShadow: isNativeApp ? '0 1px 4px rgba(0,0,0,0.16)' : `0 0 10px ${EVENT_CONFIG[activeEvent].color}14`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <motion.div
                                    animate={isNativeApp ? { opacity: 1 } : { opacity: [1, 0.3, 1] }}
                                    transition={isNativeApp ? { duration: 0 } : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                        background: EVENT_CONFIG[activeEvent].color,
                                        boxShadow: isNativeApp ? 'none' : `0 0 5px ${EVENT_CONFIG[activeEvent].color}`,
                                    }}
                                />
                                <span style={{
                                    fontSize: 11, fontWeight: 700, lineHeight: 1,
                                    color: EVENT_CONFIG[activeEvent].color,
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                    {EVENT_CONFIG[activeEvent].icon} {t(EVENT_CONFIG[activeEvent].labelKey)}
                                </span>
                            </div>

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
        </>
    );
});
