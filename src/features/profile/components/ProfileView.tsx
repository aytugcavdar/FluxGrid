import React from 'react';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/profileStore';
import { ChevronLeft, Download, User, TrendingUp, Clock, Target, Trophy } from 'lucide-react';
import { playClick } from '../../../utils/audio';
import { useAuthStore } from '../../auth/store/authStore';
import { GameMode } from '@shared/types';
import clsx from 'clsx';

export const ProfileView: React.FC<{ onClose: () => void; onOpenLeaderboard: (mode: GameMode) => void }> = ({ onClose, onOpenLeaderboard }) => {
  const { profile, calculateDerivedStats, exportProfile } = useProfileStore();
  const { user, isAnonymous, signInWithGoogle, signOut } = useAuthStore();

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

  const handleGoogleSignIn = async () => {
    playClick();
    try {
      // Sign out anonymous user first
      await signOut();
      // Then sign in with Google
      await signInWithGoogle();
    } catch (error) {
      console.error('Google Sign-In failed:', error);
    }
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
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full" />
            ) : (
              <User size={32} className="text-blue-400" />
            )}
          </div>
          <h2 className="text-2xl font-black text-white mb-1">
            {user?.displayName || 'OYUNCU'}
          </h2>
          <p className="text-xs text-white/40 uppercase tracking-widest">
            {isAnonymous ? 'Anonim Kullanıcı' : 'FluxGrid Ustası'}
          </p>
          
          {/* Google Sign-In Button */}
          {isAnonymous && (
            <button
              onClick={handleGoogleSignIn}
              className="mt-4 w-full flex items-center justify-center gap-3 px-6 py-3 bg-white rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              <span className="text-sm font-bold text-gray-900">Google ile Giriş Yap</span>
            </button>
          )}
        </div>

        {/* Leaderboard Button */}
        <button
          onClick={() => { playClick(); onOpenLeaderboard(GameMode.ENDLESS); }}
          className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl hover:from-amber-500/20 hover:to-orange-500/20 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Trophy size={24} className="text-amber-400" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-white">LİDERLİK TABLOSU</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest">En İyi Oyuncular</p>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

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
