import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Zap, RefreshCw, Hammer, Trophy, Bomb, Volume2, VolumeX, Home } from 'lucide-react';
import { FLUX_COST } from '../constants';
import { SkillType, GameMode, AppState } from '../types';
import { getMuted, toggleMute, playClick, playSkill } from '../utils/audio';
import { LEVELS } from '../constants';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const HUD: React.FC = () => {
    const {
        score, highScore, flux, combo, activateSkill, activeSkill, isSurgeActive,
        currentLevelIndex, movesLeft, levelObjectives, gameMode, timeLeft, setAppState
    } = useGameStore();
    const [muted, setMuted] = useState(getMuted);

    const handleMute = () => {
        const newVal = toggleMute();
        setMuted(newVal);
    };

    const handleSkill = (skill: SkillType) => {
        playSkill();
        activateSkill(skill);
    };

    return (
        <div className="w-full flex items-center gap-1.5 md:gap-3 justify-between h-full">

            {/* Home Button */}
            <button
                onClick={() => { playClick(); setAppState(AppState.HOME); }}
                className="flex-shrink-0 w-10 md:w-12 h-full bg-white/[0.04] rounded-xl border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
                <Home size={18} />
            </button>

            {/* Level & Objectives */}
            <div className="flex-1 flex flex-col bg-white/[0.04] px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl border border-white/[0.06] min-w-0 h-full overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[9px] md:text-[10px] font-bold text-blue-400 uppercase tracking-wider truncate">
                            {gameMode === GameMode.CAREER && `Seviye ${currentLevelIndex + 1}`}
                            {gameMode === GameMode.ENDLESS && `Sonsuz Mod`}
                            {gameMode === GameMode.TIMED && `Quantum Rush`}
                        </span>
                        {gameMode === GameMode.CAREER && (
                            <span className="text-[10px] md:text-xs text-white/60 truncate font-medium">-{LEVELS[currentLevelIndex].name}</span>
                        )}
                        {gameMode !== GameMode.CAREER && (
                            <span className="text-[10px] md:text-xs text-white/40 truncate font-medium italic">En İyi: {highScore.toLocaleString()}</span>
                        )}
                    </div>

                    {gameMode === GameMode.TIMED ? (
                        <div className={clsx(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-tighter",
                            timeLeft <= 10 ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-amber-500/20 text-amber-400"
                        )}>
                            <span>{timeLeft} Saniye</span>
                        </div>
                    ) : (
                        <div className={clsx(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold",
                            (gameMode === GameMode.CAREER && movesLeft <= 5) ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-white/5 text-white/40"
                        )}>
                            <span>{gameMode === GameMode.CAREER ? `${movesLeft} Hamle` : 'Sınırsız'}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth">
                    {gameMode === GameMode.CAREER ? levelObjectives.map((obj, i) => (
                        <div key={i} className="flex flex-col flex-shrink-0 min-w-[60px]">
                            <div className="flex justify-between items-end mb-0.5">
                                <span className="text-[7px] md:text-[8px] uppercase text-white/30 truncate mr-2">
                                    {obj.type === 'SCORE' ? 'Puan' :
                                        obj.type === 'CLEAR_LINES' ? 'Satır' :
                                            obj.type === 'BREAK_ICE' ? 'Buz' :
                                                obj.type === 'CHAIN_REACTION' ? 'Zincir' : obj.type}
                                </span>
                                <span className={clsx(
                                    "text-[8px] md:text-[9px] font-mono",
                                    obj.current >= obj.target ? "text-emerald-400 font-bold" : "text-white/60"
                                )}>
                                    {obj.current}/{obj.target}
                                </span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
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
                    )) : (
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] md:text-[18px] font-black text-white italic tracking-tight">
                                {score.toLocaleString()}
                            </span>
                            <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Mevcut Skor</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-1 md:gap-1.5 h-full flex-shrink-0">

                {/* Flux Meter */}
                <div className={clsx(
                    "w-16 md:w-28 relative rounded-lg border overflow-hidden flex flex-col justify-center px-1.5 md:px-2.5 transition-all duration-300",
                    isSurgeActive
                        ? "bg-amber-900/25 border-amber-500/40"
                        : "bg-white/[0.03] border-white/[0.05]"
                )}>
                    {/* SURGE! rozeti */}
                    <AnimatePresence>
                        {isSurgeActive && (
                            <motion.div
                                key="surge-badge"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                            >
                                <motion.span
                                    animate={{ opacity: [1, 0.6, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="text-[9px] md:text-[10px] font-black tracking-widest text-amber-300 drop-shadow-lg"
                                >
                                    ⚡SURGE
                                </motion.span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={clsx("flex justify-between items-center z-10 relative mb-0.5", isSurgeActive && "opacity-20")}>
                        <span className={clsx(
                            "text-[8px] md:text-[10px] font-semibold flex items-center gap-0.5 transition-colors",
                            isSurgeActive ? "text-amber-400" : "text-blue-400"
                        )}>
                            <Zap size={8} className={clsx("transition-all", flux >= 100 || isSurgeActive ? "fill-current" : "fill-transparent")} />
                            <span className="hidden md:inline">FLUX</span>
                        </span>
                        <span className="text-[8px] md:text-[9px] text-white/40">{Math.floor(isSurgeActive ? 100 : flux)}%</span>
                    </div>

                    <div className={clsx("w-full h-1 bg-white/[0.06] rounded-full overflow-hidden", isSurgeActive && "opacity-20")}>
                        <motion.div
                            className={clsx(
                                "h-full rounded-full transition-colors duration-300",
                                isSurgeActive ? "bg-amber-400" : (flux >= 80 ? "bg-amber-500" : "bg-blue-500")
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(isSurgeActive ? 100 : flux, 100)}%` }}
                            transition={{ type: "spring", stiffness: 40, damping: 15 }}
                        />
                    </div>
                </div>

                {/* Skills */}
                <div className="flex gap-1">
                    <SkillButton
                        icon={<RefreshCw size={13} />}
                        cost={FLUX_COST.REROLL}
                        currentFlux={flux}
                        isActive={false}
                        onClick={() => handleSkill(SkillType.REROLL)}
                        colorClass="text-emerald-400 border-emerald-500/20 bg-emerald-900/10"
                        activeClass="bg-emerald-500 text-white"
                    />

                    <SkillButton
                        icon={<Hammer size={13} />}
                        cost={FLUX_COST.SHATTER}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.SHATTER}
                        onClick={() => handleSkill(SkillType.SHATTER)}
                        colorClass="text-rose-400 border-rose-500/20 bg-rose-900/10"
                        activeClass="bg-rose-500 text-white ring-2 ring-rose-400/50 ring-offset-1 ring-offset-gray-900"
                    />

                    <SkillButton
                        icon={<Bomb size={13} />}
                        cost={FLUX_COST.BOMB}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.BOMB}
                        onClick={() => handleSkill(SkillType.BOMB)}
                        colorClass="text-orange-400 border-orange-500/20 bg-orange-900/10"
                        activeClass="bg-orange-500 text-white ring-2 ring-orange-400/50 ring-offset-1 ring-offset-gray-900"
                    />
                </div>

                {/* Mute */}
                <button onClick={handleMute} className="mute-btn flex-shrink-0 self-center">
                    {muted
                        ? <VolumeX size={14} className="text-white/25" />
                        : <Volume2 size={14} className="text-white/40" />
                    }
                </button>
            </div>
        </div>
    );
};

const SkillButton = ({ icon, cost, currentFlux, isActive, onClick, colorClass, activeClass }: any) => {
    const disabled = currentFlux < cost && !isActive;
    const isAffordable = currentFlux >= cost && !isActive;

    return (
        <button
            onClick={() => { playClick(); onClick(); }}
            disabled={disabled}
            className={clsx(
                "skill-btn rounded-xl flex flex-col items-center justify-center gap-0 border transition-all duration-150 relative overflow-hidden",
                isActive ? activeClass : (disabled ? "bg-white/[0.02] border-white/[0.04] text-white/15 cursor-not-allowed" : `${colorClass} hover:brightness-110 active:scale-92`),
                isAffordable && "ring-1 ring-white/10"
            )}
        >
            <div className="z-10 flex flex-col items-center">
                <div className={clsx("transition-transform duration-150", isAffordable && "scale-105")}>
                    {icon}
                </div>
                <span className="text-[8px] md:text-[9px] font-semibold opacity-70">{cost}</span>
            </div>

            {!disabled && !isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            )}
        </button>
    );
};