import React, { useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { Zap, RefreshCw, Hammer, Volume2, VolumeX, Home, RotateCw } from 'lucide-react';
import { FLUX_COST, ZEN_PALETTES, TIMED_MODE } from '../../game/constants';
import { SkillType } from '../../game/types';
import { GameMode, AppState } from '@shared/types';
import { getMuted, toggleMute, playClick, playSkill } from '../../../utils/audio';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_CONFIG: Record<'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID', { label: string; color: string; bg: string }> = {
    ICE_STORM: { label: 'Buz Fırtınası', color: '#185FA5', bg: 'rgba(56,138,221,0.12)' },
    GRAVITY_RUSH: { label: 'Gravity Rush — yön değişiyor!', color: '#BA7517', bg: 'rgba(186,117,23,0.12)' },
    QUAKE:     { label: 'Deprem!', color: '#D85A30', bg: 'rgba(216,90,48,0.12)' },
    MIRROR:    { label: 'Ayna Modu', color: '#D4537E', bg: 'rgba(212,83,126,0.12)' },
    CHAOS:     { label: 'Kaos Modu — her şey değişiyor!', color: '#9933FF', bg: 'rgba(153,51,255,0.12)' },
    VOID:      { label: 'Void — satırlar siliniyor!', color: '#E24B4A', bg: 'rgba(226,75,74,0.12)' },
};

export const HUD: React.FC = () => {
    const {
        score, highScore, flux, combo, activateSkill, activeSkill, isSurgeActive,
        gameMode, timeLeft, setAppState,
        zenSessionTime, zenBlocksPlaced, zenPaletteIndex,
        activeEvent, eventMovesRemaining, timedBoostMovesLeft,
        bonusRerolls, bonusShatter, bonusBomb
    } = useGameStore();
    const colors = useThemeStore(state => state.getThemeColors());
    const [muted, setMuted] = useState(getMuted);

    const handleMute = () => {
        const newVal = toggleMute();
        setMuted(newVal);
    };

    const handleSkill = (skill: SkillType) => {
        playSkill();
        activateSkill(skill);
    };
    
    const handleCancelSkill = () => {
        playClick();
        activateSkill(activeSkill!); // Toggle off
    };
    
    // Calculate HUD height dynamically based on active event
    const hudHeight = activeEvent ? 122 : 100; // 100 (base) + 22 (compact event banner)

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
                {/* ROW 1: Home + Score/Flux + Timer/Moves + Mute */}
                <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px' }}>
                    {/* Home button - 36×36px */}
                    <button
                        onClick={() => { playClick(); setAppState(AppState.HOME); }}
                        style={{
                            width: 36,
                            height: 36,
                            minWidth: 36,
                            minHeight: 36,
                            borderRadius: 9,
                            border: `1px solid ${colors.hudBorder}`,
                            background: colors.hudBackground,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.textTertiary,
                            flexShrink: 0,
                            cursor: 'pointer'
                        }}
                    >
                        <Home size={16} />
                    </button>

                    {/* Center content - Score + Flux bar */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, padding: '0 4px' }}>
                        {/* Score row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                                    {gameMode === GameMode.ZEN ? zenBlocksPlaced : score.toLocaleString()}
                                </span>
                                {isSurgeActive && (
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: '#f59e0b',
                                        background: 'rgba(245,158,11,0.15)',
                                        border: '0.5px solid rgba(245,158,11,0.3)',
                                        padding: '2px 6px',
                                        borderRadius: 8
                                    }}>
                                        ⚡ 2×
                                    </span>
                                )}
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
                            <span style={{ fontSize: 9, color: colors.textTertiary }}>
                                {(gameMode === GameMode.ENDLESS || gameMode === GameMode.TIMED) && `en iyi: ${highScore.toLocaleString()}`}
                                {gameMode === GameMode.ZEN && 'blok'}
                            </span>
                        </div>
                        
                        {/* Flux bar row */}
                        {gameMode !== GameMode.ZEN ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Zap size={10} color={flux >= 100 || isSurgeActive ? '#f59e0b' : (flux >= 80 ? '#f59e0b' : '#3b82f6')} fill={flux >= 100 || isSurgeActive ? '#f59e0b' : 'none'} />
                                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
                                    <motion.div
                                        style={{
                                            height: '100%',
                                            background: flux >= 100 || isSurgeActive ? '#f59e0b' : (flux >= 80 ? '#f59e0b' : '#3b82f6'),
                                            borderRadius: 3,
                                            transition: 'width .25s, background .3s'
                                        }}
                                        animate={{ width: `${Math.min(flux, 100)}%` }}
                                    />
                                </div>
                                <span style={{ fontSize: 9, color: colors.textTertiary }}>{Math.floor(flux)}%</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                    {ZEN_PALETTES[zenPaletteIndex].map((color, i) => (
                                        <div key={i} style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: color,
                                            opacity: 0.7
                                        }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: 9, color: colors.textTertiary, fontWeight: 600 }}>
                                    palet {zenPaletteIndex + 1}/4
                                </span>
                            </div>
                        )}
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

                    {gameMode === GameMode.ZEN && (
                        <div style={{ 
                            fontSize: 11, 
                            color: colors.textSecondary, 
                            padding: '0 8px', 
                            flexShrink: 0,
                            fontWeight: 600
                        }}>
                            {Math.floor(zenSessionTime / 60)}:{(zenSessionTime % 60).toString().padStart(2, '0')}
                        </div>
                    )}

                    {/* Mute button - 36×36px */}
                    <button
                        onClick={handleMute}
                        style={{
                            width: 36,
                            height: 36,
                            minWidth: 36,
                            minHeight: 36,
                            borderRadius: 9,
                            border: `1px solid ${colors.hudBorder}`,
                            background: colors.hudBackground,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            cursor: 'pointer'
                        }}
                    >
                        {muted ? <VolumeX size={16} style={{ color: colors.textTertiary, opacity: 0.4 }} /> : <Volume2 size={16} style={{ color: colors.textTertiary }} />}
                    </button>
                </div>

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

                {/* ROW 2: Skill buttons */}
                <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px' }}>
                    <MobileSkillButton
                        icon={<RotateCw size={17} />}
                        cost={FLUX_COST.REROLL}
                        currentFlux={flux}
                        isActive={false}
                        onClick={() => handleSkill(SkillType.REROLL)}
                        accentColor="#10b981"
                        accentBg={gameMode === GameMode.ZEN ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.1)'}
                        accentBorder="rgba(16,185,129,0.2)"
                        label="Yenile"
                        desc="Tüm parçaları değiştir"
                    />

                    <MobileSkillButton
                        icon={<Hammer size={17} />}
                        cost={FLUX_COST.SHATTER}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.SHATTER}
                        onClick={() => handleSkill(SkillType.SHATTER)}
                        accentColor="#ef4444"
                        accentBg={gameMode === GameMode.ZEN ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.1)'}
                        accentBorder="rgba(239,68,68,0.2)"
                        label="Kır"
                        desc="Bir bloğa dokun → kır"
                    />

                    <MobileSkillButton
                        icon={
                            <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="8" r="5" stroke="currentColor" strokeWidth="1.2"/>
                                <path d="M7 3L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                <circle cx="9.5" cy="0.5" r="1" fill="currentColor"/>
                            </svg>
                        }
                        cost={FLUX_COST.BOMB}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.BOMB}
                        onClick={() => handleSkill(SkillType.BOMB)}
                        accentColor="#f97316"
                        accentBg={gameMode === GameMode.ZEN ? 'rgba(255,255,255,0.06)' : 'rgba(249,115,22,0.1)'}
                        accentBorder="rgba(249,115,22,0.2)"
                        label="Bomba"
                        desc="3×3 alanı temizle"
                    />
                </div>

                {/* FLUX EKSIKLIK HINT */}
                {flux < 75 && flux >= 40 && (
                    <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(249,115,22,0.5)', marginTop: 2, padding: '0 6px' }}>
                        Bomba için +{75 - flux}⚡ daha
                    </div>
                )}
                {flux < 40 && flux >= 20 && (
                    <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(239,68,68,0.5)', marginTop: 2, padding: '0 6px' }}>
                        Kır için +{40 - flux}⚡ daha
                    </div>
                )}
                {flux < 20 && (
                    <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(16,185,129,0.5)', marginTop: 2, padding: '0 6px' }}>
                        Yenile için +{20 - flux}⚡ daha
                    </div>
                )}

                {/* SURGE INLINE BANNER */}
                {isSurgeActive && (
                    <div style={{
                        margin: '0 0 4px',
                        padding: '4px 0',
                        borderRadius: 7,
                        textAlign: 'center',
                        background: 'rgba(245,158,11,0.1)',
                        border: '0.5px solid rgba(245,158,11,0.25)'
                    }}>
                        <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#f59e0b',
                            letterSpacing: '.06em'
                        }}>
                            ⚡ SURGE AKTİF — satır temizlemede 2× puan
                        </span>
                    </div>
                )}
            </div>

            {/* DESKTOP LAYOUT */}
            <div className="hidden md:flex w-full items-center gap-3 justify-between h-full">
                <button
                    onClick={() => { playClick(); setAppState(AppState.HOME); }}
                    className="flex-shrink-0 w-12 h-full bg-white/[0.04] rounded-xl border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                    <Home size={18} />
                </button>

                <div className="flex-1 flex flex-col bg-white/[0.04] px-4 py-2 rounded-xl border border-white/[0.06] min-w-0 h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider truncate">
                                {gameMode === GameMode.ENDLESS && `Sonsuz Mod`}
                                {gameMode === GameMode.TIMED && `Quantum Rush`}
                                {gameMode === GameMode.ZEN && `ZEN Modu`}
                            </span>
                            {gameMode !== GameMode.ZEN && (
                                <span className="text-xs text-white/40 truncate font-medium italic">En İyi: {highScore.toLocaleString()}</span>
                            )}
                        </div>

                        {gameMode === GameMode.TIMED ? (
                            <div 
                                className={clsx(
                                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black tracking-tight transition-all duration-500",
                                    (timeLeft <= 10 ? "bg-rose-500/20 text-rose-400 animate-pulse" : timeLeft <= 30 ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400")
                                )}
                                style={{
                                    animation: timeLeft === 30 ? 'pulse 0.5s ease-in-out 3' : undefined
                                }}
                            >
                                <span>{timeLeft} Saniye</span>
                            </div>
                        ) : gameMode === GameMode.ZEN ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-400">
                                <span>⏱ {Math.floor(zenSessionTime / 60)}:{(zenSessionTime % 60).toString().padStart(2, '0')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-white/40">
                                <span>Sınırsız</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar">
                        {gameMode === GameMode.ZEN ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[20px] font-black text-purple-400 italic tracking-tight">
                                    🧱 {zenBlocksPlaced}
                                </span>
                                <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Blok</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-[20px] font-black text-white italic tracking-tight">
                                    {score.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Skor</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={clsx(
                    "w-32 relative rounded-lg border overflow-hidden flex flex-col justify-center px-2 py-1 transition-all",
                    isSurgeActive ? "bg-amber-900/25 border-amber-500/40" : "bg-white/[0.03] border-white/[0.05]"
                )}>
                    <AnimatePresence>
                        {isSurgeActive && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                            >
                                <motion.span
                                    animate={{ opacity: [1, 0.6, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="text-[10px] font-black tracking-widest text-amber-300"
                                >
                                    ⚡SURGE
                                </motion.span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={clsx("flex justify-between items-center z-10 mb-0.5", isSurgeActive && "opacity-20")}>
                        <span className={clsx(
                            "text-[10px] font-semibold flex items-center gap-1",
                            isSurgeActive ? "text-amber-400" : "text-blue-400"
                        )}>
                            <Zap size={9} className={clsx(flux >= 100 || isSurgeActive ? "fill-current" : "")} />
                            FLUX
                        </span>
                        <span className="text-[9px] text-white/40">{Math.floor(isSurgeActive ? 100 : flux)}%</span>
                    </div>

                    <div className={clsx("w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden", isSurgeActive && "opacity-20")}>
                        <motion.div
                            className={clsx(
                                "h-full rounded-full",
                                isSurgeActive ? "bg-amber-400" : (flux >= 80 ? "bg-amber-500" : "bg-blue-500")
                            )}
                            animate={{ width: `${Math.min(isSurgeActive ? 100 : flux, 100)}%` }}
                            transition={{ type: "spring", stiffness: 40, damping: 15 }}
                        />
                    </div>
                </div>

                {/* Event Duration Display - Desktop */}
                {activeEvent && (
                    <div className="flex-shrink-0 px-3 py-2 rounded-lg border flex flex-col justify-center gap-1"
                        style={{
                            background: EVENT_CONFIG[activeEvent].bg,
                            borderColor: `${EVENT_CONFIG[activeEvent].color}40`,
                        }}
                    >
                        <span className="text-[10px] font-bold tracking-wide" style={{ color: EVENT_CONFIG[activeEvent].color }}>
                            {EVENT_CONFIG[activeEvent].label}
                        </span>
                        {eventMovesRemaining < 9999 && (
                            <span className="text-[9px] font-semibold" style={{ color: EVENT_CONFIG[activeEvent].color, opacity: 0.7 }}>
                                {eventMovesRemaining} hamle kaldı
                            </span>
                        )}
                    </div>
                )}

                <div className="flex gap-1.5">
                    <SkillButton
                        icon={<RefreshCw size={14} />}
                        cost={FLUX_COST.REROLL}
                        currentFlux={flux}
                        isActive={false}
                        onClick={() => handleSkill(SkillType.REROLL)}
                        colorClass="text-emerald-400 border-emerald-500/20 bg-emerald-900/10"
                        activeClass="bg-emerald-500 text-white"
                        desc="Tüm parçaları değiştir"
                        bonusCount={bonusRerolls}
                    />

                    <SkillButton
                        icon={<Hammer size={14} />}
                        cost={FLUX_COST.SHATTER}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.SHATTER}
                        onClick={() => handleSkill(SkillType.SHATTER)}
                        colorClass="text-rose-400 border-rose-500/20 bg-rose-900/10"
                        activeClass="bg-rose-500 text-white ring-2 ring-rose-400/50"
                        desc="Bir bloğa dokun → kır"
                        bonusCount={bonusShatter}
                    />

                    <SkillButton
                        icon={
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="8" r="5" stroke="currentColor" strokeWidth="1.2"/>
                                <path d="M7 3L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                <circle cx="9.5" cy="0.5" r="1" fill="currentColor"/>
                            </svg>
                        }
                        cost={FLUX_COST.BOMB}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.BOMB}
                        onClick={() => handleSkill(SkillType.BOMB)}
                        colorClass="text-orange-400 border-orange-500/20 bg-orange-900/10"
                        activeClass="bg-orange-500 text-white ring-2 ring-orange-400/50"
                        desc="3×3 alanı temizle"
                        bonusCount={bonusBomb}
                    />
                </div>

                <button onClick={handleMute} className="w-12 h-full bg-white/[0.04] rounded-xl border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-colors">
                    {muted ? <VolumeX size={16} className="text-white/25" /> : <Volume2 size={16} className="text-white/40" />}
                </button>
            </div>
        </>
    );
};

const MobileSkillButton = ({ icon, cost, currentFlux, isActive, onClick, accentColor, accentBg, accentBorder, label, desc }: any) => {
    const canUse = currentFlux >= cost || isActive;
    const disabled = !canUse && !isActive;
    
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <button
                onClick={() => { playClick(); onClick(); }}
                disabled={disabled}
                data-testid="mobile-skill-button"
                style={{
                    width: '100%',
                    minHeight: 44,
                    borderRadius: 8,
                    border: isActive ? `1px solid ${accentColor}` : (disabled ? '0.5px solid rgba(255,255,255,0.06)' : `0.5px solid ${accentBorder}`),
                    background: isActive ? `${accentColor}20` : (disabled ? 'rgba(255,255,255,0.02)' : accentBg),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    opacity: disabled ? 0.35 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all .15s',
                    padding: '6px 4px 4px',
                    gap: 2
                }}
            >
                {/* Icon */}
                <div 
                    data-testid="icon-container"
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: 17,
                        color: canUse ? accentColor : 'rgba(255,255,255,0.2)'
                    }}
                >
                    {icon}
                </div>
                
                {/* Label */}
                <span style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: isActive ? 'white' : (canUse ? accentColor : 'rgba(255,255,255,0.2)'),
                    lineHeight: 1
                }}>
                    {label}
                </span>
                
                {/* Cost + ⚡ */}
                <div style={{
                    fontSize: 8,
                    color: `${accentColor}70`,
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <span>{cost}</span>
                    <span>⚡</span>
                </div>
            </button>
            
            {/* Active Description Strip */}
            {isActive && (
                <div style={{
                    width: '100%',
                    padding: '3px 5px',
                    background: `${accentColor}12`,
                    borderTop: `0.5px solid ${accentColor}20`,
                    borderRadius: '0 0 8px 8px',
                    textAlign: 'center',
                    marginTop: -8
                }}>
                    <span style={{
                        fontSize: 8,
                        color: accentColor,
                        lineHeight: 1.4
                    }}>
                        {desc}
                    </span>
                </div>
            )}
        </div>
    );
};

const SkillButton = ({ icon, cost, currentFlux, isActive, onClick, colorClass, activeClass, mobile, desc, bonusCount }: any) => {
    const disabled = currentFlux < cost && !isActive && (!bonusCount || bonusCount === 0);
    const isAffordable = (currentFlux >= cost || (bonusCount && bonusCount > 0)) && !isActive;

    return (
        <button
            onClick={() => { playClick(); onClick(); }}
            disabled={disabled}
            title={desc}
            className={clsx(
                "rounded border transition-all relative overflow-hidden",
                mobile ? "w-7 h-full" : "w-11 h-full",
                "flex flex-col items-center justify-center gap-0",
                isActive ? activeClass : (disabled ? "bg-white/[0.02] border-white/[0.04] text-white/15 cursor-not-allowed" : `${colorClass} hover:brightness-110 active:scale-95`),
                isAffordable && "ring-1 ring-white/10"
            )}
        >
            <div className="z-10 flex flex-col items-center gap-0">
                {icon}
                <span className={clsx("font-semibold opacity-70 leading-none", mobile ? "text-[6px]" : "text-[8px]")}>{cost}</span>
            </div>
            
            {/* Bonus count badge */}
            {bonusCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-20 shadow-lg">
                    +{bonusCount}
                </div>
            )}
        </button>
    );
};
