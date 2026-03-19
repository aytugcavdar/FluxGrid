import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { useProfileStore } from '../../profile/store/profileStore';
import { AppState, GameMode } from '@shared/types';
import { ChevronLeft, Trophy } from 'lucide-react';
import { playClick } from '../../../utils/audio';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export const CareerPage: React.FC = () => {
  const { stats, achievements, setAppState, highScore } = useGameStore();
  const { calculateDerivedStats } = useProfileStore();
  
  const derivedStats = calculateDerivedStats();

  // Mode configurations
  const modeConfigs = [
    { mode: GameMode.ENDLESS, icon: '∞', label: 'Sonsuz', color: 'from-purple-500 to-pink-500' },
    { mode: GameMode.TIMED, icon: '⚡', label: 'Rush', color: 'from-amber-500 to-orange-500' },
    { mode: GameMode.DAILY_CHALLENGE, icon: '📅', label: 'Günlük', color: 'from-blue-500 to-cyan-500' },
    { mode: GameMode.ZEN, icon: '☁️', label: 'Zen', color: 'from-green-500 to-emerald-500' },
  ];

  // Get high score for a mode (placeholder - will come from Firebase)
  const getModeHighScore = (): number => {
    // TODO: Get from Firebase highScores
    return 0;
  };

  // Get rank for a mode (placeholder - will come from Firebase)
  const getModeRank = (): string => {
    // TODO: Get from Firebase leaderboard
    return '-';
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const achievementProgress = (unlockedCount / totalCount) * 100;

  return (
    <div className="fixed inset-0 bg-gray-950 z-[40] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/95 backdrop-blur-md z-10 px-4 py-6 border-b border-cyan-500/10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => { playClick(); setAppState(AppState.HOME); }}
            className="w-10 h-10 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Profil</h1>
            <p className="text-xs text-gray-500">İstatistikler ve Başarımlar</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        {/* Stats Cards - 2 Column Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Best Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-2 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 p-6 rounded-xl"
          >
            <div className="text-xs text-cyan-400 mb-2 font-bold uppercase tracking-wider">En İyi Skor</div>
            <div className="text-5xl font-black text-cyan-400">{highScore.toLocaleString()}</div>
          </motion.div>

          {/* Games Played */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl"
          >
            <div className="text-xs text-gray-400 mb-2">Oynanan Oyun</div>
            <div className="text-3xl font-black text-white">{stats.gamesPlayed}</div>
          </motion.div>

          {/* Blocks Placed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl"
          >
            <div className="text-xs text-purple-400 mb-2">Yerleştirilen Blok</div>
            <div className="text-3xl font-black text-purple-400">{stats.blocksPlaced}</div>
          </motion.div>

          {/* Lines Cleared */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl"
          >
            <div className="text-xs text-green-400 mb-2">Temizlenen Satır</div>
            <div className="text-3xl font-black text-green-400">{stats.linesCleared}</div>
          </motion.div>

          {/* Bombs Exploded */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl"
          >
            <div className="text-xs text-orange-400 mb-2 flex items-center gap-1">
              💣 Patlatılan Bomba
            </div>
            <div className="text-3xl font-black text-orange-400">{stats.bombsExploded}</div>
          </motion.div>
        </div>

        {/* Total Score Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Toplam Skor</div>
            <div className="text-2xl font-black text-white">{stats.totalScore.toLocaleString()}</div>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ width: `${Math.min(100, (stats.totalScore / 100000) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Ortalama: {stats.gamesPlayed > 0 ? Math.floor(stats.totalScore / stats.gamesPlayed).toLocaleString() : 0} / oyun
          </div>
        </motion.div>

        {/* Mode High Scores */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mod Bazlı En İyi Skorlar</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {modeConfigs.map((config, i) => {
              const score = getModeHighScore();
              const rank = getModeRank();
              const hasPlayed = score > 0;

              return (
                <motion.div
                  key={config.mode}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.05) }}
                  className={clsx(
                    "flex-shrink-0 w-48 p-4 rounded-xl border",
                    hasPlayed
                      ? `bg-gradient-to-br ${config.color} bg-opacity-10 border-opacity-30`
                      : "bg-gray-800/30 border-gray-700/30"
                  )}
                >
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <div className="text-sm font-bold text-white mb-1">{config.label}</div>
                  {hasPlayed ? (
                    <>
                      <div className="text-2xl font-black text-white mb-1">{score.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">#{rank} sırada</div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-500 italic">Henüz oynanmadı</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Trophy size={14} /> Başarımlar
            </h2>
            <div className="text-xs text-gray-500">{unlockedCount} / {totalCount}</div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${achievementProgress}%` }}
            />
          </div>

          {/* Achievement List */}
          <div className="space-y-2">
            {achievements.map((ach, i) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.03) }}
                className={clsx(
                  "flex items-center gap-4 p-3 rounded-lg border transition-all",
                  ach.unlocked
                    ? "bg-green-900/10 border-green-500/30"
                    : "bg-gray-800/30 border-gray-700/30 opacity-40"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0",
                  ach.unlocked ? "bg-green-500/20" : "bg-gray-700/30"
                )}>
                  {ach.unlocked ? '✓' : '🔒'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white leading-tight">{ach.name}</h3>
                  <p className="text-xs text-gray-400 leading-tight">{ach.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
