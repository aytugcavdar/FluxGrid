import React, { useState } from 'react';
import { useGameStore } from '../../game/store/gameStore';
import { Zap, RefreshCw, Hammer, Bomb, Volume2, VolumeX, Home } from 'lucide-react';
import { FLUX_COST } from '../../game/constants';
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
        zenSessionTime, zenBlocksPlaced
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

    const currentLevelDef = gameMode === GameMode.CAREER ? generateLevel(currentLevelIndex) : null;

    return (
        <>
            {/* MOBILE LAYOUT */}
            <div className="md:hidden w-full h-full flex flex-col gap-0.5">
                {/* Top Row: Home + Score/Level + Timer/Moves */}
                <div className="flex items-center gap-0.5 h-[48%]">
                    <button
                        onClick={() => { playClick(); setAppState(AppState.HOME); }}
                        className="w-7 h-full bg-white/[0.04] rounded-lg border border-white/[0.06] flex items-center justify-center text-white/40"
                    >
                        <Home size={13} />
                    </button>

                    <div className="flex-1 h-full bg-white/[0.04] rounded-lg border border-white/[0.06] px-1.5 flex items-center justify-between overflow-hidden">
                        <div className="flex flex-col justify-center min-w-0">
                            <span className="text-[7px] font-bold text-blue-400 uppercase tracking-wide truncate">
                                {gameMode === GameMode.CAREER && `Lv ${currentLevelIndex}`}
                                {gameMode === GameMode.ENDLESS && `Sonsuz`}
                                {gameMode === GameMode.TIMED && `Rush`}
                                {gameMode === GameMode.ZEN && `Zen`}
                                {gameMode === GameMode.BLITZ && `Blitz`}
                                {gameMode === GameMode.SURVIVAL && `Survival`}
                            </span>
                            <span className="text-[10px] font-black text-white tracking-tight">
                                {gameMode === GameMode.ZEN ? `${zenBlocksPlaced}` : score.toLocaleString()}
                            </span>
                        </div>

                        {gameMode === GameMode.TIMED || gameMode === GameMode.BLITZ ? (
                            <div className={clsx(
                                "px-1.5 py-0.5 rounded-md text-[9px] font-black",
                                timeLeft <= 10 ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-amber-500/20 text-amber-400"
                            )}>
                                {timeLeft}s
                            </div>
                        ) : gameMode === GameMode.ZEN ? (
                            <div className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-purple-500/20 text-purple-400">
                                {Math.floor(zenSessionTime / 60)}:{(zenSessionTime % 60).toString().padStart(2, '0')}
                            </div>
                        ) : gameMode === GameMode.CAREER ? (
                            <div className={clsx(
                                "px-1.5 py-0.5 rounded-md text-[8px] font-bold",
                                movesLeft <= 5 ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-white/5 text-white/40"
                            )}>
                                {movesLeft}
                            </div>
                        ) : null}
                    </div>

                    <button onClick={handleMute} className="w-7 h-full bg-white/[0.04] rounded-lg border border-white/[0.06] flex items-center justify-center">
                        {muted ? <VolumeX size={11} className="text-white/25" /> : <Volume2 size={11} className="text-white/40" />}
                    </button>
                </div>

                {/* Bottom Row: Flux + Skills */}
                <div className="flex items-center gap-0.5 h-[52%]">
                    <div className={clsx(
                        "flex-1 h-full relative rounded-lg border overflow-hidden flex items-center px-1.5 gap-1 transition-all",
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
                                        className="text-[8px] font-black tracking-widest text-amber-300"
                                    >
                                        ⚡SURGE
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={clsx("flex items-center gap-0.5 z-10", isSurgeActive && "opacity-20")}>
                            <Zap size={9} className={clsx("transition-all", flux >= 100 || isSurgeActive ? "fill-current text-blue-400" : "text-blue-400")} />
                            <span className="text-[8px] font-bold text-white/60">{Math.floor(isSurgeActive ? 100 : flux)}%</span>
                        </div>

                        <div className={clsx("flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden", isSurgeActive && "opacity-20")}>
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

                    <SkillButton
                        icon={<RefreshCw size={10} />}
                        cost={FLUX_COST.REROLL}
                        currentFlux={flux}
                        isActive={false}
                        onClick={() => handleSkill(SkillType.REROLL)}
                        colorClass="text-emerald-400 border-emerald-500/20 bg-emerald-900/10"
                        activeClass="bg-emerald-500 text-white"
                        mobile
                    />

                    <SkillButton
                        icon={<Hammer size={10} />}
                        cost={FLUX_COST.SHATTER}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.SHATTER}
                        onClick={() => handleSkill(SkillType.SHATTER)}
                        colorClass="text-rose-400 border-rose-500/20 bg-rose-900/10"
                        activeClass="bg-rose-500 text-white ring-2 ring-rose-400/50"
                        mobile
                    />

                    <SkillButton
                        icon={<Bomb size={10} />}
                        cost={FLUX_COST.BOMB}
                        currentFlux={flux}
                        isActive={activeSkill === SkillType.BOMB}
                        onClick={() => handleSkill(SkillType.BOMB)}
                        colorClass="text-orange-400 border-orange-500/20 bg-orange-900/10"
                        activeClass="bg-orange-500 text-white ring-2 ring-orange-400/50"
                        mobile
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
                                {gameMode === GameMode.BLITZ && `BLITZ`}
                                {gameMode === GameMode.SURVIVAL && `SURVIVAL`}
                            </span>
                            {gameMode === GameMode.CAREER && currentLevelDef && (
                                <span className="text-xs text-white/60 truncate font-medium">- {currentLevelDef.name}</span>
                            )}
                            {(gameMode !== GameMode.CAREER && gameMode !== GameMode.ZEN) && (
                                <span className="text-xs text-white/40 truncate font-medium italic">En İyi: {highScore.toLocaleString()}</span>
                            )}
                        </div>

                        {gameMode === GameMode.TIMED || gameMode === GameMode.BLITZ ? (
                            <div className={clsx(
                                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black tracking-tight",
                                timeLeft <= 10 ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-amber-500/20 text-amber-400"
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
                                (gameMode === GameMode.CAREER && movesLeft <= 5) ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-white/5 text-white/40"
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
                        icon={<Bomb size={14} />}
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

const SkillButton = ({ icon, cost, currentFlux, isActive, onClick, colorClass, activeClass, mobile }: any) => {
    const disabled = currentFlux < cost && !isActive;
    const isAffordable = currentFlux >= cost && !isActive;

    return (
        <button
            onClick={() => { playClick(); onClick(); }}
            disabled={disabled}
            className={clsx(
                "rounded-lg border transition-all relative overflow-hidden",
                mobile ? "w-8 h-full" : "w-11 h-full",
                "flex flex-col items-center justify-center gap-0",
                isActive ? activeClass : (disabled ? "bg-white/[0.02] border-white/[0.04] text-white/15 cursor-not-allowed" : `${colorClass} hover:brightness-110 active:scale-95`),
                isAffordable && "ring-1 ring-white/10"
            )}
        >
            <div className="z-10 flex flex-col items-center gap-0">
                {icon}
                <span className={clsx("font-semibold opacity-70", mobile ? "text-[7px]" : "text-[8px]")}>{cost}</span>
            </div>
        </button>
    );
};
