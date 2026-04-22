import React, { useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { useStreakStore } from '@shared/store/streakStore';
import { Zap, Volume2, VolumeX, Home } from 'lucide-react';
import { TIMED_MODE } from '../../game/constants';
import { GameMode, AppState } from '@shared/types';
import { getMuted, toggleMute, playClick, playSkill } from '../../../utils/audio';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { StreakBadge } from '@shared/components/StreakBadge';
import { StreakShieldModal } from '../../../app/components/StreakShieldModal';
import { AdManager } from '../../../utils/managers/adManager';
// MiniEventIndicators removed - mini-event system deprecated
import { TierProgressBar } from './TierProgressBar';
import { MilestonePopup } from './MilestonePopup';

const EVENT_CONFIG: Record<'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID', { label: string; color: string; bg: string }> = {
    ICE_STORM: { label: 'Buz Fırtınası', color: '#185FA5', bg: 'rgba(56,138,221,0.12)' },
    GRAVITY_RUSH: { label: 'Gravity Rush — yön değişiyor!', color: '#BA7517', bg: 'rgba(186,117,23,0.12)' },
    QUAKE:     { label: 'Deprem!', color: '#D85A30', bg: 'rgba(216,90,48,0.12)' },
    MIRROR:    { label: 'Ayna Modu', color: '#D4537E', bg: 'rgba(212,83,126,0.12)' },
    CHAOS:     { label: 'Kaos Modu — her şey değişiyor!', color: '#9933FF', bg: 'rgba(153,51,255,0.12)' },
    VOID:      { label: 'Void — satırlar siliniyor!', color: '#E24B4A', bg: 'rgba(226,75,74,0.12)' },
};

export const HUD: React.FC = React.memo(() => {
    const {
        score, highScore, combo,
        gameMode, timeLeft, setAppState,
        activeEvent, eventMovesRemaining, timedBoostMovesLeft,
        miniEventState, progressionState, difficultyTier, isGameOver
    } = useGameStore();
    const { currentStreak, todayPlayed, streakShields, addStreakShield } = useStreakStore();
    const colors = useThemeStore(state => state.getThemeColors());
    const [muted, setMuted] = useState(getMuted);
    const [showShieldModal, setShowShieldModal] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState<any>(null);

    const handleMute = () => {
        const newVal = toggleMute();
        setMuted(newVal);
    };

    const handleShieldPress = () => {
        playClick();
        setShowShieldModal(true);
    };

    const handleWatchAd = async () => {
        const result = await AdManager.showRewardedStreakShield();
        if (result.success) {
            addStreakShield();
        }
        setShowShieldModal(false);
    };
    
    // Calculate HUD height dynamically based on active event
    const hudHeight = activeEvent ? 82 : 60; // Sadece ROW 1 (60px) + event banner (22px)

    return (
        <>
            {/* Red tint background overlay for final seconds warning */}
            {gameMode === GameMode.TIMED && timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(239,68,68,0.05)',
                    pointerEvents: 'none',
                    zIndex: 5,
                    transition: 'opacity 0.5s ease',
                }} />
            )}

            {/* MOBILE LAYOUT - 2 ROWS */}
            <div 
                className="md:hidden w-full h-full flex flex-col" 
                style={{ 
                    gap: 4,
                    '--hud-height': `${hudHeight}px`
                } as React.CSSProperties}
            >
                {/* ROW 1: Home + Score/Flux + Timer/Moves + Streak + Mute */}
                <div style={{ height: 60, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
                    {/* Home button - 44×44px (daha büyük, daha kolay dokunma) */}
                    <button
                        onClick={() => { 
                            playClick(); 
                            // Save game before going to home
                            if (!isGameOver) {
                                useGameStore.getState().saveCurrentGame();
                            }
                            setAppState(AppState.HOME); 
                        }}
                        style={{
                            width: 44,
                            height: 44,
                            minWidth: 44,
                            minHeight: 44,
                            borderRadius: 12,
                            border: `1px solid ${colors.hudBorder}`,
                            background: colors.hudBackground,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.textTertiary,
                            flexShrink: 0,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                    >
                        <Home size={20} />
                    </button>

                    {/* Center content - Score only - Clean and simple */}
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 4, 
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 12,
                        border: `1px solid ${colors.hudBorder}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        justifyContent: 'center'
                    }}>
                        {/* Score row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 24, fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.5px' }}>
                                    {score.toLocaleString()}
                                </span>
                                {gameMode === GameMode.TIMED && timedBoostMovesLeft > 0 && (
                                    <motion.span
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#10b981',
                                            background: 'rgba(16,185,129,0.15)',
                                            border: '0.5px solid rgba(16,185,129,0.3)',
                                            padding: '2px 6px',
                                            borderRadius: 8
                                        }}
                                    >
                                        RUSH ×{timedBoostMovesLeft}
                                    </motion.span>
                                )}
                                {gameMode === GameMode.TIMED && timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD && timeLeft > 0 && (
                                    <motion.span
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#ef4444',
                                            background: 'rgba(239,68,68,0.15)',
                                            border: '0.5px solid rgba(239,68,68,0.3)',
                                            padding: '2px 6px',
                                            borderRadius: 8
                                        }}
                                    >
                                        ×1.5
                                    </motion.span>
                                )}
                            </div>
                            <span style={{ fontSize: 10, color: colors.textTertiary, fontWeight: 600 }}>
                                {(gameMode === GameMode.ENDLESS || gameMode === GameMode.TIMED) && `en iyi: ${highScore.toLocaleString()}`}
                            </span>
                        </div>
                    </div>

                    {/* Timer/Moves pill - conditional */}
                    {(gameMode === GameMode.TIMED) && (
                        <div style={{
                            padding: '6px 12px',
                            borderRadius: 12,
                            background: (timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD ? 'rgba(239,68,68,0.12)' : timeLeft <= TIMED_MODE.WARNING_THRESHOLD ? 'rgba(249,115,22,0.1)' : 'rgba(59,130,246,0.08)'),
                            border: `1px solid ${timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD ? 'rgba(239,68,68,0.55)' : timeLeft <= TIMED_MODE.WARNING_THRESHOLD ? 'rgba(249,115,22,0.45)' : 'rgba(59,130,246,0.35)'}`,
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: 34,
                            animation: (timeLeft === 30 ? 'pulse 0.5s ease-in-out 3' : (gameMode === GameMode.TIMED && timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD) ? 'gentle-pulse 1.5s ease-in-out infinite' : 'none'),
                            transition: 'background 0.5s ease, border-color 0.5s ease'
                        }}>
                            <span style={{ 
                                fontSize: 15, 
                                fontWeight: 700, 
                                color: (timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD ? '#ef4444' : timeLeft <= TIMED_MODE.WARNING_THRESHOLD ? '#f97316' : '#3b82f6'), 
                                lineHeight: 1 
                            }}>
                                {timeLeft}
                            </span>
                            <span style={{ 
                                fontSize: 8, 
                                color: `${timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD ? '#ef4444' : timeLeft <= TIMED_MODE.WARNING_THRESHOLD ? '#f97316' : '#3b82f6'}70`, 
                                marginTop: 1
                            }}>
                                SN
                            </span>
                        </div>
                    )}

                    {/* Streak Badge */}
                    <div style={{ flexShrink: 0 }}>
                        <StreakBadge
                            streak={currentStreak}
                            todayPlayed={todayPlayed}
                            shields={streakShields}
                            onShieldPress={handleShieldPress}
                        />
                    </div>

                    {/* Mute button - 44×44px (daha büyük) */}
                    <button
                        onClick={handleMute}
                        style={{
                            width: 44,
                            height: 44,
                            minWidth: 44,
                            minHeight: 44,
                            borderRadius: 12,
                            border: `1px solid ${colors.hudBorder}`,
                            background: colors.hudBackground,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                    >
                        {muted ? <VolumeX size={20} style={{ color: colors.textTertiary, opacity: 0.4 }} /> : <Volume2 size={20} style={{ color: colors.textTertiary }} />}
                    </button>
                </div>

                {/* Mini-Event Indicators removed - mini-event system deprecated */}

                {/* Tier Progress Bar - Mobile */}
                {gameMode === GameMode.ENDLESS && progressionState && (
                    <div style={{ padding: '0 6px' }}>
                        <TierProgressBar tier={difficultyTier} score={score} />
                    </div>
                )}

                {/* Event Banner - Between ROW 1 and ROW 2 - Compact */}
                {activeEvent && (
                    <div style={{
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 8px',
                        background: EVENT_CONFIG[activeEvent].bg,
                        borderBottom: `1px solid ${EVENT_CONFIG[activeEvent].color}40`,
                    }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: EVENT_CONFIG[activeEvent].color }}>
                            {EVENT_CONFIG[activeEvent].label}
                        </span>
                        {eventMovesRemaining < 9999 && (
                            <span style={{ fontSize: 9, color: EVENT_CONFIG[activeEvent].color, opacity: 0.7 }}>
                                {eventMovesRemaining} hamle
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Streak Shield Modal */}
            <StreakShieldModal
                isVisible={showShieldModal}
                currentStreak={currentStreak}
                streakBroken={false}
                onWatchAd={handleWatchAd}
                onClose={() => setShowShieldModal(false)}
                shieldsAvailable={streakShields}
            />

            {/* Milestone Popup */}
            <MilestonePopup
                milestone={currentMilestone}
                onClose={() => setCurrentMilestone(null)}
            />
        </>
    );
});
