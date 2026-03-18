import React, { useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { Zap, RefreshCw, Hammer, Volume2, VolumeX, Home, RotateCw } from 'lucide-react';
import { FLUX_COST, ZEN_PALETTES } from '../../game/constants';
import { SkillType } from '../../game/types';
import { GameMode, AppState } from '@shared/types';
import { getMuted, toggleMute, playClick, playSkill } from '../../../utils/audio';
import { generateLevel } from '../../career/utils/levelGenerator';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const HUD: React.FC = () => {
    const {
        score, highScore, flux, combo, activateSkill, activeSkill, isSurgeActive,
        currentLevelIndex, movesLeft, levelObjectives, gameMode, timeLeft, setAppState,
        zenSessionTime, zenBlocksPlaced, survivalNextPush, survivalPushInterval, zenPaletteIndex, survivalTime,
        bossType
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

    const currentLevelDef = gameMode === GameMode.CAREER ? generateLevel(currentLevelIndex) : null;

    return (
        <>
            {/* MOBILE LAYOUT - 2 ROWS */}
            <div className="md:hidden w-full h-full flex flex-col" style={{ gap: 4 }}>
                {/* ROW 1: Home + Score/Flux + Timer/Moves + Mute */}
                <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px' }}>
                    {/* Home button - 32×32px */}
                    <button
                        onClick={() => { playClick(); setAppState(AppState.HOME); }}
                        style={{
                            width: 32,
                            height: 32,
                            minWidth: 32,
                            minHeight: 32,
                            borderRadius: 8,
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
                            <span style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                                {gameMode === GameMode.ZEN ? zenBlocksPlaced : score.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 9, color: colors.textTertiary }}>
                                {(gameMode === GameMode.ENDLESS || gameMode === GameMode.TIMED || gameMode === GameMode.SURVIVAL) && `en iyi: ${highScore.toLocaleString()}`}
                                {gameMode === GameMode.CAREER && (currentLevelDef?.name ?? '')}
                                {gameMode === GameMode.ZEN && 'blok'}
                            </span>
                        </div>
                        
                        {/* Flux bar row */}
                        {gameMode !== GameMode.ZEN ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Zap size={10} color={flux >= 100 ? colors.surgeColor : colors.accentColor} fill={flux >= 100 ? colors.surgeColor : 'none'} />
                                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                                    <motion.div
                                        style={{
                                            height: '100%',
                                            background: flux >= 80 ? colors.surgeColor : colors.accentColor,
                                            borderRadius: 2
                                        }}
                                        animate={{ width: `${Math.min(flux, 100)}%` }}
                                        transition={{ type: 'spring', stiffness: 40, damping: 15 }}
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
                            background: (timeLeft <= 10 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)'),
                            border: `1px solid ${timeLeft <= 10 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}`,
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            animation: (gameMode === GameMode.TIMED && timeLeft <= 10) ? 'gentle-pulse 1.5s ease-in-out infinite' : 'none'
                        }}>
                            <div style={{ 
                                fontSize: 16, 
                                fontWeight: 700, 
                                color: (timeLeft <= 10 ? '#ef4444' : '#f59e0b'), 
                                lineHeight: 1 
                            }}>
                                {timeLeft}
                            </div>
                            <div style={{ 
                                fontSize: 11, 
                                color: (timeLeft <= 10 ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)'), 
                                textAlign: 'center',
                                marginTop: 2
                            }}>
                                SN
                            </div>
                        </div>
                    )}

                    {gameMode === GameMode.CAREER && (
                        <div style={{
                            padding: '6px 12px',
                            borderRadius: 12,
                            background: (bossType === 'SPEED_SURGE' || movesLeft <= 10) ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${(bossType === 'SPEED_SURGE' || movesLeft <= 10) ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            animation: (bossType === 'SPEED_SURGE' && movesLeft <= 10) ? 'gentle-pulse 1.5s ease-in-out infinite' : 'none'
                        }}>
                            <div style={{ 
                                fontSize: 16, 
                                fontWeight: 700, 
                                color: (bossType === 'SPEED_SURGE' || movesLeft <= 10) ? '#ef4444' : colors.textPrimary, 
                                lineHeight: 1 
                            }}>
                                {movesLeft}
                            </div>
                            <div style={{ 
                                fontSize: 11, 
                                color: (bossType === 'SPEED_SURGE' || movesLeft <= 10) ? 'rgba(239,68,68,0.6)' : colors.textTertiary, 
                                textAlign: 'center',
                                marginTop: 2
                            }}>
                                HAMLE
                            </div>
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

                    {gameMode === GameMode.SURVIVAL && (
                        <div style={{
                            padding: '6px 12px',
                            borderRadius: 12,
                            background: 'rgba(107,114,128,0.15)',
                            border: '1px solid rgba(107,114,128,0.25)',
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <div style={{ 
                                fontSize: 16, 
                                fontWeight: 700, 
                                color: '#9ca3af', 
                                lineHeight: 1 
                            }}>
                                {survivalNextPush}
                            </div>
                            <div style={{ 
                                fontSize: 11, 
                                color: 'rgba(156,163,175,0.6)', 
                                textAlign: 'center',
                                marginTop: 2
                            }}>
                                SN
                            </div>
                        </div>
                    )}

                    {/* Mute button - 32×32px */}
                    <button
                        onClick={handleMute}
                        style={{
                            width: 32,
                            height: 32,
                            minWidth: 32,
                            minHeight: 32,
                            borderRadius: 8,
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

                {/* ROW 2: Skill buttons */}
                <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px' }}>
                    <MobileSkillButton
                        icon={<RotateCw size={14} />}
                        cost={FLUX_COST.REROLL}
                        currentFlux={flux}
                        isActive={false}
                        onClick={() => handleSkill(SkillType.REROLL)}
                        accentColor="#10b981"
                        accentBg={gameMode === GameMode.ZEN ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.1)'}
                        accentBorder="rgba(16,185,129,0.2)"
                    />

                    <MobileSkillButton
                        icon={<Hammer size={14} />}
                        cost={FLUX_COST.SHATTER}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.SHATTER}
                        onClick={() => handleSkill(SkillType.SHATTER)}
                        accentColor="#ef4444"
                        accentBg={gameMode === GameMode.ZEN ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.1)'}
                        accentBorder="rgba(239,68,68,0.2)"
                    />

                    <MobileSkillButton
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
                        accentColor="#f97316"
                        accentBg={gameMode === GameMode.ZEN ? 'rgba(255,255,255,0.06)' : 'rgba(249,115,22,0.1)'}
                        accentBorder="rgba(249,115,22,0.2)"
                    />
                </div>
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
                                {gameMode === GameMode.CAREER && `Seviye ${currentLevelIndex}`}
                                {gameMode === GameMode.ENDLESS && `Sonsuz Mod`}
                                {gameMode === GameMode.TIMED && `Quantum Rush`}
                                {gameMode === GameMode.ZEN && `ZEN Modu`}
                                {gameMode === GameMode.SURVIVAL && `SURVIVAL`}
                            </span>
                            {gameMode === GameMode.CAREER && currentLevelDef && (
                                <span className="text-xs text-white/60 truncate font-medium">- {currentLevelDef.name}</span>
                            )}
                            {(gameMode !== GameMode.CAREER && gameMode !== GameMode.ZEN) && (
                                <span className="text-xs text-white/40 truncate font-medium italic">En İyi: {highScore.toLocaleString()}</span>
                            )}
                        </div>

                        {gameMode === GameMode.TIMED ? (
                            <div className={clsx(
                                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black tracking-tight",
                                (timeLeft <= 10 ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-amber-500/20 text-amber-400")
                            )}>
                                <span>{timeLeft} Saniye</span>
                            </div>
                        ) : gameMode === GameMode.ZEN ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-400">
                                <span>⏱ {Math.floor(zenSessionTime / 60)}:{(zenSessionTime % 60).toString().padStart(2, '0')}</span>
                            </div>
                        ) : (
                            <div className={clsx(
                                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold",
                                (gameMode === GameMode.CAREER && (bossType === 'SPEED_SURGE' || movesLeft <= 10)) ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-white/5 text-white/40"
                            )}>
                                <span>{gameMode === GameMode.CAREER ? `${movesLeft} Hamle` : 'Sınırsız'}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar">
                        {gameMode === GameMode.CAREER ? levelObjectives.map((obj, i) => (
                            <div key={i} className="flex flex-col flex-shrink-0 min-w-[70px]">
                                <div className="flex justify-between items-end mb-0.5">
                                    <span className="text-[8px] uppercase text-white/30 truncate mr-2">
                                        {obj.type === 'SCORE' ? 'Puan' :
                                            obj.type === 'CLEAR_LINES' ? 'Satır' :
                                                obj.type === 'BREAK_ICE' ? 'Buz' :
                                                    obj.type === 'CHAIN_REACTION' ? 'Zincir' : obj.type}
                                    </span>
                                    <span className={clsx(
                                        "text-[9px] font-mono",
                                        obj.current >= obj.target ? "text-emerald-400 font-bold" : "text-white/60"
                                    )}>
                                        {obj.current}/{obj.target}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(obj.current / obj.target) * 100}%` }}
                                        className={clsx(
                                            "h-full rounded-full",
                                            obj.current >= obj.target ? "bg-emerald-500" : "bg-blue-500/60"
                                        )}
                                    />
                                </div>
                            </div>
                        )) : gameMode === GameMode.ZEN ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[20px] font-black text-purple-400 italic tracking-tight">
                                    🧱 {zenBlocksPlaced}
                                </span>
                                <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Blok</span>
                            </div>
                        ) : gameMode === GameMode.SURVIVAL ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[20px] font-black text-white italic tracking-tight">
                                        {score.toLocaleString()}
                                    </span>
                                    <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Skor</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 6,
                                    border: '0.5px solid rgba(255,255,255,0.06)',
                                    padding: '4px 8px',
                                    minWidth: 80
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>SONRAKI SATIR</span>
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: survivalNextPush <= 3 ? '#ef4444' : '#9ca3af'
                                        }}>
                                            {survivalNextPush}s
                                        </span>
                                    </div>
                                    <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${((survivalPushInterval - survivalNextPush) / survivalPushInterval) * 100}%`,
                                            background: survivalNextPush <= 3 ? '#ef4444' : '#6b7280',
                                            borderRadius: 2,
                                            transition: 'width 1s linear'
                                        }} />
                                    </div>
                                </div>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                                    {Math.floor(survivalTime / 60)}:{(survivalTime % 60).toString().padStart(2, '0')} hayatta
                                </span>
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

                <div className="flex gap-1.5">
                    <SkillButton
                        icon={<RefreshCw size={14} />}
                        cost={FLUX_COST.REROLL}
                        currentFlux={flux}
                        isActive={false}
                        onClick={() => handleSkill(SkillType.REROLL)}
                        colorClass="text-emerald-400 border-emerald-500/20 bg-emerald-900/10"
                        activeClass="bg-emerald-500 text-white"
                    />

                    <SkillButton
                        icon={<Hammer size={14} />}
                        cost={FLUX_COST.SHATTER}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.SHATTER}
                        onClick={() => handleSkill(SkillType.SHATTER)}
                        colorClass="text-rose-400 border-rose-500/20 bg-rose-900/10"
                        activeClass="bg-rose-500 text-white ring-2 ring-rose-400/50"
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
                    />
                </div>

                <button onClick={handleMute} className="w-12 h-full bg-white/[0.04] rounded-xl border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition-colors">
                    {muted ? <VolumeX size={16} className="text-white/25" /> : <Volume2 size={16} className="text-white/40" />}
                </button>
            </div>
        </>
    );
};

const MobileSkillButton = ({ icon, cost, currentFlux, isActive, onClick, accentColor, accentBg, accentBorder }: any) => {
    const disabled = currentFlux < cost && !isActive;
    
    return (
        <button
            onClick={() => { playClick(); onClick(); }}
            disabled={disabled}
            data-testid="mobile-skill-button"
            style={{
                flex: 1,
                height: 36,
                borderRadius: 8,
                border: `1px solid ${isActive ? accentColor : (disabled ? 'rgba(255,255,255,0.04)' : accentBorder)}`,
                background: isActive ? accentColor : (disabled ? 'rgba(255,255,255,0.02)' : accentBg),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease',
                padding: 0
            }}
        >
            {/* Icon */}
            <div 
                data-testid="icon-container"
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: isActive ? 'white' : (disabled ? 'rgba(255,255,255,0.2)' : accentColor)
                }}
            >
                {icon}
            </div>
            
            {/* Flux Cost Badge - positioned at bottom right */}
            <div 
                data-testid="cost-badge"
                style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    background: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)',
                    borderRadius: 4,
                    padding: '1px 3px',
                    fontSize: 9,
                    fontWeight: 600,
                    color: isActive ? 'white' : accentColor,
                    lineHeight: 1
                }}
            >
                {cost}
            </div>
        </button>
    );
};

const SkillButton = ({ icon, cost, currentFlux, isActive, onClick, colorClass, activeClass, mobile }: any) => {
    const disabled = currentFlux < cost && !isActive;
    const isAffordable = currentFlux >= cost && !isActive;

    return (
        <button
            onClick={() => { playClick(); onClick(); }}
            disabled={disabled}
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
        </button>
    );
};
