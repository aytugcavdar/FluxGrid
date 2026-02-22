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

            {/* Score */}
            <div className="flex-1 flex items-center justify-between bg-white/[0.04] px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl border border-white/[0.06] min-w-0 h-full">
                <div className="flex flex-col overflow-hidden min-w-0">
                    <span className="text-[8px] md:text-[9px] text-white/40 uppercase tracking-wider truncate font-medium">Skor</span>
                    <span className="text-lg md:text-2xl font-bold text-white leading-none truncate">{score.toLocaleString()}</span>
                </div>

                {/* High Score */}
                <div className="flex items-center gap-1 text-amber-400/60 ml-2 flex-shrink-0">
                    <Trophy size={10} />
                    <span className="text-[9px] font-medium">{highScore.toLocaleString()}</span>
                    {score > 0 && score >= highScore && (
                        <motion.span
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="text-[10px] animate-gentle-pulse"
                        >⭐</motion.span>
                    )}
                </div>

                {/* Combo */}
                <div className="flex justify-center w-7 md:w-8 flex-shrink-0">
                    <AnimatePresence mode='wait'>
                        {combo > 1 && (
                            <motion.div
                                key={combo}
                                initial={{ scale: 0.5, opacity: 0, y: 5 }}
                                animate={{ scale: 1.1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.5, opacity: 0, y: -5 }}
                                className="flex flex-col items-center"
                            >
                                <span className={clsx(
                                    "font-bold text-base md:text-xl",
                                    combo >= 5 ? "text-amber-300" : combo >= 3 ? "text-amber-400" : "text-blue-400"
                                )}>x{combo}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-1 md:gap-1.5 h-full flex-shrink-0">

                {/* Flux Meter */}
                <div className="w-16 md:w-28 relative bg-white/[0.03] rounded-lg border border-white/[0.05] overflow-hidden flex flex-col justify-center px-1.5 md:px-2.5">
                    <div className="flex justify-between items-center z-10 relative mb-0.5">
                        <span className="text-[8px] md:text-[10px] font-semibold text-blue-400 flex items-center gap-0.5">
                            <Zap size={8} className={clsx("transition-all", flux >= 100 ? "fill-blue-400" : "fill-transparent")} />
                            <span className="hidden md:inline">FLUX</span>
                        </span>
                        <span className="text-[8px] md:text-[9px] text-white/40">{Math.floor(flux)}%</span>
                    </div>

                    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500 rounded-full"
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