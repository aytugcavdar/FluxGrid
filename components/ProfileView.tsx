import React from 'react';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/profileStore';
import { ChevronLeft, Download, User, TrendingUp, Clock, Target } from 'lucide-react';
import { playClick } from '../utils/audio';
import clsx from 'clsx';

export const ProfileView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { profile, calculateDerivedStats, exportProfile } = useProfileStore();

  const handleExport = () => {
    playClick();
    const data = exportProfile();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluxgrid-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!profile) {
    return null;
  }

  const derivedStats = calculateDerivedStats();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}s ${minutes}d`;
    return `${minutes}d`;
  };

  const statCards = [
    { label: 'TOPLAM SKOR', value: profile.stats.totalScore.toLocaleString(), icon: <TrendingUp size={18} />, color: 'text-amber-400' },
    { label: 'OYNANAN OYUN', value: profile.stats.gamesPlayed, icon: <Target size={18} />, color: 'text-blue-400' },
    { label: 'OYUN SÜRESİ', value: `${derivedStats.playtimeHours}s ${derivedStats.playtimeMinutes}d`, icon: <Clock size={18} />, color: 'text-purple-400' },
    { label: 'ORTALAMA SKOR', value: derivedStats.averageScore.toLocaleString(), icon: <TrendingUp size={18} />, color: 'text-emerald-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-gray-900 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 px-6 py-8 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight italic uppercase">PROFİLİM</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">İstatistikler ve Veriler</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          <Download size={16} />
          <span className="text-xs font-bold">Dışa Aktar</span>
        </button>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-8">
        {/* Profile Header */}
        <div className="bg-white/[0.03] border border-white/[0.05] p-6 rounded-3xl text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">OYUNCU</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest">FluxGrid Ustası</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/[0.03] border border-white/[0.05] p-5 rounded-2xl"
            >
              <div className={stat.color}>{stat.icon}</div>
              <div className="mt-4">
                <p className="text-2xl font-black text-white leading-none">{stat.value}</p>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-wider mt-1.5">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Stats */}
        <div>
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">DETAYLI İSTATİSTİKLER</h3>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl divide-y divide-white/5">
            <StatRow label="Yerleştirilen Bloklar" value={profile.stats.blocksPlaced.toLocaleString()} />
            <StatRow label="Temizlenen Satırlar" value={profile.stats.linesCleared.toLocaleString()} />
            <StatRow label="Patlatılan Bombalar" value={profile.stats.bombsExploded.toLocaleString()} />
            <StatRow label="Kırılan Buzlar" value={profile.stats.iceBroken.toLocaleString()} />
            <StatRow label="En Yüksek Kombo" value={profile.stats.highestCombo.toString()} />
            <StatRow label="En Uzun Oturum" value={`${Math.floor(profile.stats.longestSession / 60000)}d`} />
          </div>
        </div>

        {/* Skill Usage */}
        <div>
          <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">YETENEKLERİM</h3>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl divide-y divide-white/5">
            {Array.from(profile.stats.skillUses.entries()).map(([skill, count]) => (
              <StatRow key={skill} label={skill} value={count.toString()} />
            ))}
            {profile.stats.skillUses.size === 0 && (
              <div className="p-4 text-center text-white/40 text-sm">Henüz yetenek kullanılmadı</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between p-4">
    <span className="text-sm text-white/60">{label}</span>
    <span className="text-lg font-bold text-white">{value}</span>
  </div>
);
