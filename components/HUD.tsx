import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Zap, RefreshCw, Hammer, Trophy, Bomb, Volume2, VolumeX } from 'lucide-react';
import { FLUX_COST } from '../constants';
import { SkillType } from '../types';
import { getMuted, toggleMute, playClick, playSkill } from '../utils/audio';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const HUD: React.FC = () => {
    const { score, highScore, flux, combo, activateSkill, activeSkill } = useGameStore();
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

            {/* Score + High Score */}
            <div className="flex-1 flex items-center justify-between bg-white/5 backdrop-blur-xl px-2 md:px-3 py-1.5 md:py-2 rounded-xl border border-white/10 shadow-xl min-w-0 h-full">
                <div className="flex flex-col overflow-hidden min-w-0">
                    <span className="text-[8px] md:text-[9px] text-cyan-200/60 font-display uppercase tracking-wider truncate">Skor</span>
                    <span className="text-lg md:text-2xl font-bold font-mono text-white leading-none drop-shadow-md truncate">{score.toLocaleString()}</span>
                </div>

                {/* High Score (small) */}
                <div className="hidden sm:flex items-center gap-1 text-yellow-500/50 ml-2">
                    <Trophy size={10} />
                    <span className="text-[9px] font-mono">{highScore.toLocaleString()}</span>
                </div>

                {/* Dynamic Combo Indicator */}
                <div className="flex justify-center w-7 md:w-8 flex-shrink-0">
                    <AnimatePresence mode='wait'>
                        {combo > 1 && (
                            <motion.div
                                key={combo}
                                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                                animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <span className="text-yellow-400 font-black text-base md:text-xl italic font-display drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">x{combo}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Action Bar: Flux & Skills */}
            <div className="flex gap-1 md:gap-1.5 h-full flex-shrink-0">

                {/* Flux Meter */}
                <div className="w-16 md:w-28 relative bg-black/40 rounded-lg border border-white/5 overflow-hidden flex flex-col justify-center px-1.5 md:px-2.5 shadow-inner">
                    <div className="flex justify-between items-center z-10 relative mb-0.5">
                        <span className="text-[8px] md:text-[10px] font-bold text-cyan-400 font-display flex items-center gap-0.5">
                            <Zap size={8} className={clsx("transition-all", flux >= 100 ? "fill-cyan-400 animate-pulse" : "fill-transparent")} />
                            <span className="hidden md:inline">FLUX</span>
                        </span>
                        <span className="text-[8px] md:text-[9px] text-white/50 font-mono">{Math.floor(flux)}%</span>
                    </div>

                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_12px_#06b6d4]"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(flux, 100)}%` }}
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
                        colorClass="text-emerald-400 border-emerald-500/50 bg-emerald-900/20"
                        activeClass="bg-emerald-500 text-white"
                    />

                    <SkillButton
                        icon={<Hammer size={13} />}
                        cost={FLUX_COST.SHATTER}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.SHATTER}
                        onClick={() => handleSkill(SkillType.SHATTER)}
                        colorClass="text-rose-400 border-rose-500/50 bg-rose-900/20"
                        activeClass="bg-rose-500 text-white ring-2 ring-rose-400 ring-offset-1 ring-offset-black animate-pulse"
                    />

                    <SkillButton
                        icon={<Bomb size={13} />}
                        cost={FLUX_COST.BOMB}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.BOMB}
                        onClick={() => handleSkill(SkillType.BOMB)}
                        colorClass="text-orange-400 border-orange-500/50 bg-orange-900/20"
                        activeClass="bg-orange-500 text-white ring-2 ring-orange-400 ring-offset-1 ring-offset-black animate-pulse"
                    />
                </div>

                {/* Mute Toggle */}
                <button onClick={handleMute} className="mute-btn flex-shrink-0 self-center">
                    {muted
                        ? <VolumeX size={14} className="text-white/30" />
                        : <Volume2 size={14} className="text-cyan-400/60" />
                    }
                </button>
            </div>
        </div>
    );
};

// Helper Component for Buttons
const SkillButton = ({ icon, cost, currentFlux, isActive, onClick, colorClass, activeClass }: any) => {
    const disabled = currentFlux < cost && !isActive;
    const isAffordable = currentFlux >= cost && !isActive;

    return (
        <button
            onClick={() => { playClick(); onClick(); }}
            disabled={disabled}
            className={clsx(
                "skill-btn rounded-xl flex flex-col items-center justify-center gap-0 border transition-all duration-200 relative overflow-hidden",
                isActive ? activeClass : (disabled ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed" : `${colorClass} hover:brightness-125 active:scale-90`),
                isAffordable && "shadow-[0_0_12px_rgba(255,255,255,0.08)] ring-1 ring-white/20"
            )}
        >
            <div className="z-10 flex flex-col items-center">
                <div className={clsx("transition-transform duration-200", isAffordable && "scale-110")}>
                    {icon}
                </div>
                <span className="text-[8px] md:text-[9px] font-bold font-mono opacity-80">{cost}</span>
            </div>

            {isAffordable && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-white pointer-events-none"
                />
            )}

            {!disabled && !isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            )}
        </button>
    );
};