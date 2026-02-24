import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../constants';
import { AppState } from '../types';
import { Trophy, ChevronLeft, Map as MapIcon, Star, Lock } from 'lucide-react';
import clsx from 'clsx';
import { playClick } from '../utils/audio';

export const LevelMap: React.FC = () => {
    const { maxLevelReached, setAppState, startLevel } = useGameStore();

    const handleLevelClick = (idx: number) => {
        if (idx <= maxLevelReached) {
            playClick();
            startLevel(idx);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 z-[40] overflow-y-auto overflow-x-hidden no-scrollbar pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 px-6 py-8 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { playClick(); setAppState(AppState.HOME); }}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight italic">GÖREV HARİTASI</h1>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">FluxGrid Macerası</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <Trophy size={14} className="text-amber-400" />
                    <span className="text-sm font-bold text-white tracking-widest">{maxLevelReached}</span>
                </div>
            </div>

            {/* Map Content */}
            <div className="max-w-md mx-auto px-10 py-12 relative min-h-screen">
                {/* Animated Path Line (Simplified) */}
                <div className="absolute left-1/2 top-10 bottom-40 w-1 bg-white/[0.03] -translate-x-1/2" />

                <div className="flex flex-col gap-16 relative z-10">
                    {LEVELS.map((level, i) => {
                        const isUnlocked = i <= maxLevelReached;
                        const isCurrent = i === maxLevelReached;
                        const isLeft = i % 2 === 0;

                        return (
                            <motion.div
                                key={level.index}
                                initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={clsx(
                                    "flex items-center w-full",
                                    isLeft ? "flex-row" : "flex-row-reverse"
                                )}
                            >
                                {/* Level Node */}
                                <button
                                    onClick={() => handleLevelClick(i)}
                                    disabled={!isUnlocked}
                                    className={clsx(
                                        "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 relative group",
                                        isUnlocked
                                            ? "bg-gray-800 border-2 border-blue-500/30 hover:scale-110 active:scale-95 shadow-xl shadow-blue-900/10"
                                            : "bg-gray-800/50 border-2 border-white/5 grayscale"
                                    )}
                                >
                                    {/* Current Level Pulse */}
                                    {isCurrent && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-blue-500 rounded-3xl"
                                        />
                                    )}

                                    <div className="z-10 flex flex-col items-center">
                                        {isUnlocked ? (
                                            <>
                                                <span className="text-2xl font-black text-white italic">{level.index}</span>
                                                {isCurrent ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                                        <Star size={12} className="text-amber-400 fill-current mt-1" />
                                                    </motion.div>
                                                ) : (
                                                    <Star size={10} className="text-emerald-400/60 mt-1" />
                                                )}
                                            </>
                                        ) : (
                                            <Lock size={20} className="text-white/10" />
                                        )}
                                    </div>

                                    {/* Level Info Banner */}
                                    <div className={clsx(
                                        "absolute top-1/2 -translate-y-1/2 w-40 px-4 transition-opacity",
                                        isLeft ? "left-full pl-6 text-left" : "right-full pr-6 text-right",
                                        !isUnlocked && "opacity-40"
                                    )}>
                                        <h3 className="text-xs font-black text-white truncate uppercase tracking-tight">{level.name}</h3>
                                        <p className="text-[9px] text-white/30 font-bold">Seviye {level.index}</p>
                                    </div>
                                </button>
                            </motion.div>
                        );
                    })}

                    {/* Coming Soon Node */}
                    <div className="w-full flex justify-center mt-8">
                        <div className="px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/20 tracking-widest uppercase">
                            YAKINDA YENİ SEVİYELER...
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent z-20">
                <div className="max-w-md mx-auto flex gap-4">
                    <button
                        onClick={() => { playClick(); setAppState(AppState.CAREER); }}
                        className="flex-1 py-4 rounded-2xl bg-gray-800 border border-white/10 text-white font-black tracking-widest text-xs uppercase hover:bg-gray-700 transition-colors"
                    >
                        KARİYER
                    </button>
                </div>
            </div>
        </div>
    );
};
