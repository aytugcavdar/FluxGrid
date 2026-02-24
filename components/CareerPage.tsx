import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { AppState } from '../types';
import { ChevronLeft, BarChart3, Target, Layout, Zap, Trophy, Bomb, IceCream } from 'lucide-react';
import { playClick } from '../utils/audio';
import clsx from 'clsx';

export const CareerPage: React.FC = () => {
    const { stats, achievements, setAppState } = useGameStore();

    const statCards = [
        { label: 'TOPLAM SKOR', value: stats.totalScore.toLocaleString(), icon: <Trophy size={18} />, color: 'text-amber-400' },
        { label: 'TEMİZLENEN SATIRLAR', value: stats.linesCleared, icon: <Layout size={18} />, color: 'text-blue-400' },
        { label: 'YERLEŞTİRİLEN BLOKLAR', value: stats.blocksPlaced, icon: <Target size={18} />, color: 'text-emerald-400' },
        { label: 'OYNANAN OYUNLAR', value: stats.gamesPlayed, icon: <BarChart3 size={18} />, color: 'text-purple-400' },
        { label: 'PATLATILAN BOMBALAR', value: stats.bombsExploded, icon: <Bomb size={18} />, color: 'text-orange-400' },
        { label: 'KIRILAN BUZLAR', value: stats.iceBroken, icon: <IceCream size={18} />, color: 'text-cyan-400' },
    ];

    return (
        <div className="fixed inset-0 bg-gray-900 z-[40] overflow-y-auto no-scrollbar pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 px-6 py-8 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { playClick(); setAppState(AppState.MAP); }}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight italic uppercase">KARİYER</h1>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">İstatistikler ve Başarımlar</p>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto p-6 space-y-8">
                {/* Stats Grid */}
                <div>
                    <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <BarChart3 size={12} /> GENEL İSTATİSTİKLER
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {statCards.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white/[0.03] border border-white/[0.05] p-5 rounded-2xl flex flex-col justify-between"
                            >
                                <div className={stat.color}>{stat.icon}</div>
                                <div className="mt-4">
                                    <p className="text-2xl font-black text-white leading-none">{stat.value}</p>
                                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-wider mt-1.5">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Achievements Section */}
                <div>
                    <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Trophy size={12} /> BAŞARIMLAR ({achievements.filter(a => a.unlocked).length}/{achievements.length})
                    </h2>
                    <div className="space-y-3">
                        {achievements.map((ach, i) => (
                            <motion.div
                                key={ach.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (i * 0.05) }}
                                className={clsx(
                                    "flex items-center gap-5 p-4 rounded-2xl border transition-all duration-300",
                                    ach.unlocked
                                        ? "bg-blue-500/5 border-blue-500/20"
                                        : "bg-white/[0.02] border-white/[0.05] grayscale opacity-40"
                                )}
                            >
                                <div className={clsx(
                                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0",
                                    ach.unlocked ? "bg-blue-500/20" : "bg-white/5"
                                )}>
                                    {ach.unlocked ? '🏅' : '🔒'}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black text-white tracking-tight leading-none mb-1 uppercase">{ach.name}</h3>
                                    <p className="text-[10px] text-white/40 font-medium leading-tight">{ach.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
