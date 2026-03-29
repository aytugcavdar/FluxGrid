import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { ChevronLeft, Download, Flame } from 'lucide-react';
import { playClick } from '../../../utils/audio';
import { GameMode } from '@shared/types';
import clsx from 'clsx';

interface ProfileViewProps {
  onClose: () => void;
  onOpenLeaderboard: (mode: GameMode) => void;
}

type TabType = 'stats' | 'modes' | 'skills' | 'achievements';

export const ProfileView: React.FC<ProfileViewProps> = ({ onClose, onOpenLeaderboard }) => {
  const { stats, achievements, highScore, maxLevelReached } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('stats');

  // Use real data from gameStore
  const derivedStats = {
    currentStreak: 0, // TODO: Get from Firebase
    longestStreak: 0, // TODO: Get from Firebase
    averageScore: stats.gamesPlayed > 0 ? Math.floor(stats.totalScore / stats.gamesPlayed) : 0,
  };

  const handleExport = () => {
    playClick();
    // Export gameStore data instead of profile
    const data = JSON.stringify({
      stats,
      achievements,
      highScore,
      exportedAt: Date.now(),
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluxgrid-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatPlaytime = (): string => {
    // Oyun sayısı başına ortalama 2 dakika varsayalım
    const estimatedMinutes = stats.gamesPlayed * 2;
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    
    if (hours > 0) return `${hours}s ${minutes}dk`;
    return `${minutes}dk`;
  };

  const getInitials = (): string => {
    return 'OY'; // Default initials for "OYUNCU"
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const tabs = [
    { id: 'stats' as TabType, label: 'İstatistik', icon: '📊' },
    { id: 'modes' as TabType, label: 'Modlar', icon: '🎮' },
    { id: 'skills' as TabType, label: 'Yetenekler', icon: '⚡' },
    { id: 'achievements' as TabType, label: 'Başarımlar', icon: '🏆' },
  ];

  const modeConfigs = [
    { mode: GameMode.ENDLESS, icon: '∞', label: 'Sonsuz', color: 'from-purple-500 to-pink-500' },
    { mode: GameMode.TIMED, icon: '⚡', label: 'Rush', color: 'from-amber-500 to-orange-500' },
    { mode: GameMode.DAILY_CHALLENGE, icon: '📅', label: 'Günlük', color: 'from-blue-500 to-cyan-500' },
    { mode: GameMode.ZEN, icon: '☁️', label: 'Zen', color: 'from-green-500 to-emerald-500' },
  ];

  // Get high score for a mode from localStorage
  const getHighScoreForMode = (mode: GameMode): number => {
    try {
      const stored = localStorage.getItem('flux_highscores');
      if (!stored) return 0;
      const scores = JSON.parse(stored);
      return scores[mode] || 0;
    } catch {
      return 0;
    }
  };

  // Format score with k notation
  const formatScore = (score: number): string => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-[#060c17] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#060c17]/95 backdrop-blur-md z-10 px-4 py-4 border-b border-cyan-500/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => { playClick(); onClose(); }}
              className="w-10 h-10 shrink-0 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-white tracking-tight truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                PROFİLİM
              </h1>
              <p className="text-xs text-gray-500 truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                İSTATİSTİKLER · BAŞARIMLAR
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 shrink-0 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all text-sm font-bold"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Dışa Aktar</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6 pb-20">
        {/* Profile Card */}
        <div className="relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:p-6 overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />
          
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Avatar with gradient ring */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full blur-sm" />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gray-900 rounded-full flex items-center justify-center border-2 border-gray-800">
                <span className="text-xl sm:text-2xl font-black text-cyan-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {getInitials()}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg sm:text-xl font-black text-white truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  OYUNCU
                </h2>
                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-xs font-bold text-blue-400">
                  Yerel Profil
                </span>
              </div>

              {/* Mini stats */}
              <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                <span>{stats.gamesPlayed} oyun</span>
                <span>{stats.linesCleared} satır</span>
                <span><Flame size={12} className="inline" /> {derivedStats.currentStreak || 0} seri</span>
                <span>{formatPlaytime()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anonymous User CTA */}
        {/* Leaderboard Teaser - TODO: Get real rank from Firebase */}
        <button
          onClick={() => { playClick(); onOpenLeaderboard(GameMode.ENDLESS); }}
          className="w-full bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-4 sm:p-6 hover:from-amber-900/30 hover:to-orange-900/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-amber-500/30">
                <span className="text-xl sm:text-2xl font-black text-amber-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  ?
                </span>
              </div>
              <div className="text-left">
                <div className="text-base sm:text-lg font-bold text-white mb-1">Sıralamayı Gör</div>
                <div className="text-xs sm:text-sm text-gray-400">Sonsuz modu</div>
              </div>
            </div>
            <ChevronLeft size={20} className="text-amber-400 rotate-180 sm:w-6 sm:h-6" />
          </div>
        </button>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 border-b border-gray-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { playClick(); setActiveTab(tab.id); }}
              className={clsx(
                "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 font-bold transition-all text-xs sm:text-sm whitespace-nowrap",
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <span className="text-sm sm:text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3 sm:space-y-4 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Best Score - Highlighted */}
                <div className="col-span-2 relative bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-2 border-cyan-500/30 p-4 sm:p-6 rounded-xl">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
                  <div className="text-xs text-cyan-400 mb-1 sm:mb-2 font-bold uppercase tracking-wider">En İyi Skor</div>
                  <div className="text-4xl sm:text-5xl font-black text-cyan-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {highScore.toLocaleString()}
                  </div>
                </div>

                {/* Other Stats */}
                <StatCard label="Oyun" value={stats.gamesPlayed.toString()} color="gray" />
                <StatCard label="Yerleştirilen Blok" value={stats.blocksPlaced.toString()} color="purple" />
                <StatCard label="Temizlenen Satır" value={stats.linesCleared.toString()} color="green" />
                <StatCard label="Günlük Seri" value={`🔥 ${derivedStats.currentStreak || 0}`} color="orange" />
                <StatCard label="Patlatılan Bomba" value={stats.bombsExploded.toString()} color="pink" />
              </div>

              {/* Total Play Time */}
              <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Toplam Oyun</div>
                  <div className="text-2xl font-black text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {stats.gamesPlayed}
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${Math.min(100, (stats.gamesPlayed / 100) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Tahmini süre: {formatPlaytime()}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'modes' && (
            <motion.div
              key="modes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3 sm:space-y-4 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent"
            >
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {modeConfigs.map((config) => {
                  const score = getHighScoreForMode(config.mode);
                  const rank = '-';
                  const hasPlayed = score > 0;

                  return (
                    <div
                      key={config.mode}
                      className={clsx(
                        "p-3 sm:p-4 rounded-xl border",
                        hasPlayed
                          ? `bg-gradient-to-br ${config.color} bg-opacity-10 border-opacity-30`
                          : "bg-gray-800/30 border-gray-700/30"
                      )}
                    >
                      <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{config.icon}</div>
                      <div className="text-xs sm:text-sm font-bold text-white mb-1">{config.label}</div>
                      {hasPlayed ? (
                        <>
                          <div className="text-2xl font-black text-white mb-1">{formatScore(score)}</div>
                          <div className="text-xs text-gray-400">#{rank} sırada</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-gray-500 mb-2">Henüz oynanmadı</div>
                          <button className="text-xs text-cyan-400 hover:text-cyan-300">Oyna →</button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Career Progress */}
              <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-400">Kariyer İlerlemesi</div>
                  <div className="text-lg font-bold text-white">Seviye {maxLevelReached || 1}</div>
                </div>
                <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
                    style={{ width: `${Math.min(100, ((maxLevelReached || 1) / 100) * 100)}%` }} 
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2 sm:space-y-3 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent"
            >
              <SkillRow icon="🔄" name="Reroll" count={stats.skillUses?.REROLL || 0} color="green" />
              <SkillRow icon="🔨" name="Shatter" count={stats.skillUses?.SHATTER || 0} color="red" />
              <SkillRow icon="💣" name="Bomba" count={stats.skillUses?.BOMB || 0} color="orange" />

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6">
                <div className="bg-gray-800/50 border border-gray-700/50 p-3 sm:p-4 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-black text-cyan-400 mb-1">
                    {(stats.skillUses?.REROLL || 0) + (stats.skillUses?.SHATTER || 0) + (stats.skillUses?.BOMB || 0)}
                  </div>
                  <div className="text-xs text-gray-400">Toplam Kullanım</div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 p-3 sm:p-4 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-black text-purple-400 mb-1">{stats.bombsExploded}</div>
                  <div className="text-xs text-gray-400">Bomba Sayısı</div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 p-3 sm:p-4 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-black text-amber-400 mb-1">
                    {stats.gamesPlayed > 0 ? Math.round(((stats.skillUses?.REROLL || 0) + (stats.skillUses?.SHATTER || 0) + (stats.skillUses?.BOMB || 0)) / stats.gamesPlayed) : 0}
                  </div>
                  <div className="text-xs text-gray-400">Ort/Oyun</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3 sm:space-y-4 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent"
            >
              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">{unlockedCount} / {totalCount} açıldı</div>
                  <div className="text-sm font-bold text-cyan-400">{Math.round((unlockedCount / totalCount) * 100)}%</div>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Achievement List - Ultra compact for mobile */}
              <div className="space-y-1.5">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={clsx(
                      "flex items-center gap-2 p-2 rounded-lg border",
                      ach.unlocked
                        ? "bg-green-900/10 border-green-500/30"
                        : "bg-gray-800/30 border-gray-700/30 opacity-40"
                    )}
                  >
                    <div className={clsx(
                      "w-6 h-6 rounded flex items-center justify-center text-sm shrink-0",
                      ach.unlocked ? "bg-green-500/20" : "bg-gray-700/30 grayscale"
                    )}>
                      {ach.unlocked ? '✓' : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-white truncate">{ach.name}</h3>
                      <p className="text-xs text-gray-400 truncate">{ach.description}</p>
                      {!ach.unlocked && ach.currentValue > 0 && (
                        <div className="mt-1">
                          <div className="w-full h-0.5 bg-gray-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gray-600" 
                              style={{ width: `${Math.min(100, (ach.currentValue / ach.targetValue) * 100)}%` }} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const colorMap: Record<string, { border: string; text: string; accent: string }> = {
    gray: { border: 'border-gray-700/50', text: 'text-white', accent: 'bg-gray-500' },
    purple: { border: 'border-purple-500/30', text: 'text-purple-400', accent: 'bg-purple-500' },
    green: { border: 'border-green-500/30', text: 'text-green-400', accent: 'bg-green-500' },
    orange: { border: 'border-orange-500/30', text: 'text-orange-400', accent: 'bg-orange-500' },
    pink: { border: 'border-pink-500/30', text: 'text-pink-400', accent: 'bg-pink-500' },
  };

  const colors = colorMap[color] || colorMap.gray;

  return (
    <div className={clsx("relative bg-gray-800/50 border p-3 sm:p-4 rounded-xl", colors.border)}>
      <div className={clsx("absolute top-0 left-0 right-0 h-1", colors.accent)} />
      <div className="text-xs text-gray-400 mb-1 sm:mb-2">{label}</div>
      <div className={clsx("text-2xl sm:text-3xl font-black", colors.text)} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        {value}
      </div>
    </div>
  );
};

const SkillRow: React.FC<{ icon: string; name: string; count: number; color: string }> = ({ icon, name, count, color }) => {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-gray-800/50 border border-gray-700/50 p-3 sm:p-4 rounded-xl">
      <div className="text-xl sm:text-2xl">{icon}</div>
      <div className="flex-1">
        <div className="text-xs sm:text-sm font-bold text-white mb-1 sm:mb-2">{name}</div>
        <div className="w-full h-1.5 sm:h-2 bg-gray-900 rounded-full overflow-hidden">
          <div className={clsx("h-full", colorMap[color])} style={{ width: `${Math.min(100, count)}%` }} />
        </div>
      </div>
      <div className="text-base sm:text-lg font-bold text-white">{count}</div>
    </div>
  );
};
