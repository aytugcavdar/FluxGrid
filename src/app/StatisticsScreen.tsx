import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';
import { useGameStore } from '../features/game/store/gameStore';
import { useThemeStore } from '../shared/store/themeStore';
import { GameMode } from '@shared/types';
import { PerformanceCard, SectionHeader, RecentLogsTimeline } from '../shared/components';
import { useCountUp } from '../shared/hooks/useCountUp';

import { Achievement } from '../shared/types/ui';
import { useStreakStore } from '../shared/store/streakStore';

type TabType = 'overview' | 'achievements';

type StatsGameLog = {
  mode: GameMode;
  score: number;
  timestamp: number;
  duration: number;
};

type PersonalInsight = {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  color: string;
};

const MODE_LABELS: Record<GameMode, string> = {
  [GameMode.ENDLESS]: 'Sonsuz',
  [GameMode.TIMED]: 'Timed',
  [GameMode.DAILY_CHALLENGE]: 'Günlük',
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 sn';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes <= 0) return `${remainingSeconds} sn`;
  if (remainingSeconds === 0) return `${minutes} dk`;
  return `${minutes} dk ${remainingSeconds} sn`;
};

const buildPersonalInsights = (logs: StatsGameLog[]): PersonalInsight[] => {
  if (!Array.isArray(logs) || logs.length === 0) {
    return [
      { label: 'En iyi günün', value: '-', detail: 'Henüz oyun kaydı yok', icon: '★', color: '#f59e0b' },
      { label: 'En çok oynadığın mod', value: '-', detail: 'Birkaç oyun sonrası görünür', icon: '◈', color: '#818cf8' },
      { label: 'Ortalama oyun süren', value: '0 sn', detail: 'Oyun ritmin burada oluşur', icon: <Timer size={17} strokeWidth={2.5} />, color: '#34d399' },
      { label: 'Son 7 günde gelişim', value: '-', detail: 'Karşılaştırma için veri lazım', icon: '↗', color: '#f472b6' },
    ];
  }

  const dayTotals = new Map<string, { label: string; score: number; games: number }>();
  const modeCounts = new Map<GameMode, number>();
  let totalDuration = 0;

  logs.forEach(log => {
    const date = new Date(log.timestamp);
    const dayKey = date.toISOString().slice(0, 10);
    const dayLabel = date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
    const currentDay = dayTotals.get(dayKey) || { label: dayLabel, score: 0, games: 0 };
    currentDay.score += log.score;
    currentDay.games += 1;
    dayTotals.set(dayKey, currentDay);

    modeCounts.set(log.mode, (modeCounts.get(log.mode) || 0) + 1);
    totalDuration += log.duration || 0;
  });

  const bestDay = [...dayTotals.values()].sort((a, b) => b.score - a.score)[0];
  const favoriteMode = [...modeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const averageDuration = Math.round(totalDuration / logs.length);
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter(log => now - log.timestamp <= sevenDays);
  const previousLogs = logs.filter(log => now - log.timestamp > sevenDays && now - log.timestamp <= sevenDays * 2);
  const averageScore = (items: StatsGameLog[]) =>
    items.length > 0 ? items.reduce((sum, log) => sum + log.score, 0) / items.length : 0;
  const recentAverage = averageScore(recentLogs);
  const previousAverage = averageScore(previousLogs);
  const improvement = previousAverage > 0
    ? Math.round(((recentAverage - previousAverage) / previousAverage) * 100)
    : null;

  return [
    {
      label: 'En iyi günün',
      value: bestDay?.label || '-',
      detail: bestDay ? `${bestDay.score.toLocaleString('tr-TR')} puan, ${bestDay.games} oyun` : 'Henüz oyun kaydı yok',
      icon: '★',
      color: '#f59e0b',
    },
    {
      label: 'En çok oynadığın mod',
      value: favoriteMode ? MODE_LABELS[favoriteMode[0]] : '-',
      detail: favoriteMode ? `${favoriteMode[1]} oyun` : 'Birkaç oyun sonrası görünür',
      icon: '◈',
      color: '#818cf8',
    },
    {
      label: 'Ortalama oyun süren',
      value: formatDuration(averageDuration),
      detail: `${logs.length} oyun ortalaması`,
      icon: <Timer size={17} strokeWidth={2.5} />,
      color: '#34d399',
    },
    {
      label: 'Son 7 günde gelişim',
      value: improvement === null ? 'Yeni' : `${improvement > 0 ? '+' : ''}${improvement}%`,
      detail: improvement === null
        ? `${recentLogs.length} yeni oyun kaydı`
        : `${Math.round(recentAverage).toLocaleString('tr-TR')} ortalama puan`,
      icon: '↗',
      color: improvement !== null && improvement < 0 ? '#fb7185' : '#f472b6',
    },
  ];
};

/* ── Hero stat card with CountUp ── */
const HeroStatCard: React.FC<{
  stat: { label: string; value: number; icon: string; color: string };
  index: number;
}> = ({ stat, index }) => {
  const animatedValue = useCountUp(stat.value, 900 + index * 100, true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl p-3 text-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid rgba(255,255,255,0.08)`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* Subtle color orb */}
      <div
        className="absolute -top-3 -right-3 w-12 h-12 rounded-full opacity-20 blur-xl pointer-events-none"
        style={{ background: stat.color }}
      />
      <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
      <div
        className="text-base font-black tabular-nums"
        style={{
          background: `linear-gradient(135deg, ${stat.color}, white)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {animatedValue.toLocaleString()}
      </div>
      <div
        className="text-[9px] font-semibold mt-1 uppercase tracking-wide"
        style={{ color: 'rgba(208,208,232,0.45)' }}
      >
        {stat.label}
      </div>
    </motion.div>
  );
};

/* ── Streak Banner ── */
const PersonalInsightGrid: React.FC<{ insights: PersonalInsight[] }> = ({ insights }) => (
  <div>
    <SectionHeader title="Kişisel Özet" />
    <div className="grid grid-cols-2 gap-3">
      {insights.map((insight, index) => (
        <motion.div
          key={insight.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 * index }}
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.025) 100%)',
            border: `1px solid ${insight.color}33`,
          }}
        >
          <div
            className="absolute -top-5 -right-5 w-16 h-16 rounded-full opacity-15 blur-xl pointer-events-none"
            style={{ background: insight.color }}
          />
          <div className="flex items-center justify-between mb-2 gap-2">
            <span style={{ color: insight.color, fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center' }}>{insight.icon}</span>
            <span className="text-[9px] font-bold uppercase text-right leading-tight" style={{ color: `${insight.color}cc` }}>
              {insight.label}
            </span>
          </div>
          <div className="text-lg font-black tabular-nums leading-tight" style={{ color: '#f0f0f8' }}>
            {insight.value}
          </div>
          <p className="text-[10px] mt-1 leading-snug" style={{ color: 'rgba(208,208,232,0.48)' }}>
            {insight.detail}
          </p>
        </motion.div>
      ))}
    </div>
  </div>
);

const StreakBanner: React.FC = () => {
  const { currentStreak, longestStreak, streakShields, todayPlayed } = useStreakStore();

  const streakColor = currentStreak >= 7 ? '#f97316' : currentStreak >= 3 ? '#fbbf24' : '#94a3b8';
  const fireEmoji = currentStreak >= 7 ? '🔥' : currentStreak >= 3 ? '⚡' : '🌙';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(251,191,36,0.06) 100%)`,
        border: `1px solid ${streakColor}30`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Shimmer */}
      <motion.div
        animate={{ x: ['-120%', '220%'] }}
        transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
        className="absolute top-0 left-0 w-1/3 h-full pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }}
      />

      <div className="flex items-center gap-0 px-1 py-1">
        {/* Current streak */}
        <div className="flex-1 flex flex-col items-center py-2">
          <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 3 }}>{fireEmoji}</div>
          <div
            className="text-xl font-black tabular-nums"
            style={{
              background: `linear-gradient(135deg, ${streakColor}, #fff)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {currentStreak}
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(208,208,232,0.45)' }}>
            Günlük Seri
          </div>
          {todayPlayed && (
            <div className="text-[8px] font-bold mt-0.5" style={{ color: streakColor }}>
              ✓ Bugün oynadın
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-10 mx-1" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Longest streak */}
        <div className="flex-1 flex flex-col items-center py-2">
          <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 3 }}>👑</div>
          <div
            className="text-xl font-black tabular-nums"
            style={{ color: '#f0f0f8' }}
          >
            {longestStreak}
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(208,208,232,0.45)' }}>
            En Uzun
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-10 mx-1" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Shields */}
        <div className="flex-1 flex flex-col items-center py-2">
          <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 3 }}>
            {streakShields > 0 ? '🛡️' : '💨'}
          </div>
          <div
            className="text-xl font-black tabular-nums"
            style={{ color: streakShields > 0 ? '#60a5fa' : 'rgba(255,255,255,0.25)' }}
          >
            {streakShields}
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(208,208,232,0.45)' }}>
            Kalkan
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────── */
/* ── Category meta ── */
const CAT_META: Record<string, { icon: string; color: string; bg: string }> = {
  SCORE:          { icon: '🏆', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  COMBO:          { icon: '⚡', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  SPECIAL_BLOCKS: { icon: '💣', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ABILITIES:      { icon: '🔮', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  PROGRESSION:    { icon: '📈', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  SPEED:          { icon: '💨', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  MASTERY:        { icon: '👑', color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
};

const RARITY_META: Record<NonNullable<Achievement['rarity']>, { label: string; color: string; bg: string }> = {
  BRONZE: { label: 'Bronze', color: '#cd7f32', bg: 'rgba(205,127,50,0.16)' },
  SILVER: { label: 'Silver', color: '#cbd5e1', bg: 'rgba(203,213,225,0.14)' },
  GOLD: { label: 'Gold', color: '#facc15', bg: 'rgba(250,204,21,0.16)' },
  MYTHIC: { label: 'Mythic', color: '#c084fc', bg: 'rgba(192,132,252,0.18)' },
};

const getAchievementRarity = (ach: { hidden?: boolean; targetValue?: number; category?: string; id: string }): NonNullable<Achievement['rarity']> => {
  if (ach.hidden || ach.id.includes('1m') || ach.id.includes('tier_6')) return 'MYTHIC';
  const target = ach.targetValue || 0;
  if (target >= 100000 || target >= 5000 || ach.category === 'MASTERY') return 'GOLD';
  if (target >= 50 || ach.category === 'SPEED') return 'SILVER';
  return 'BRONZE';
};

const getHiddenHint = (category?: string) => {
  if (category === 'SPEED') return 'Timed modda güçlü bir hedefi tamamla.';
  if (category === 'MASTERY') return 'Endless modda ileri seviye bir hedefi tamamla.';
  if (category === 'SCORE') return 'Tek oyunda yüksek skor hedeflerinden birine ulaş.';
  if (category === 'COMBO') return 'Kombo seviyeni daha yukarı taşı.';
  if (category === 'SPECIAL_BLOCKS') return 'Özel bloklarla ilgili ileri bir hedefi tamamla.';
  return 'Oyunda ilerledikçe açılır.';
};

/* ── Single achievement row ── */
const AchRow: React.FC<{ ach: Achievement; index?: number }> = ({ ach, index = 0 }) => {
  const meta   = CAT_META[ach.category || ''] ?? { icon: '🏅', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
  const rarity = RARITY_META[ach.rarity || 'BRONZE'];
  const pct    = Math.min(100, ach.progress ?? 0);
  const done   = ach.status === 'unlocked';
  const locked = ach.status === 'locked' && pct === 0;
  const hideDetails = Boolean(ach.hidden && !done);
  const title = hideDetails ? 'Gizli Başarım' : ach.title;
  const description = hideDetails ? getHiddenHint(ach.category) : ach.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.055 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px',
        borderRadius: 14,
        background: done
          ? `linear-gradient(135deg, ${meta.bg} 0%, rgba(255,255,255,0.03) 100%)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${done ? meta.color + '35' : 'rgba(255,255,255,0.07)'}`,
        opacity: locked ? 0.45 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: done ? meta.bg : 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, filter: locked ? 'grayscale(1)' : 'none',
      }}>
        {locked ? '🔒' : meta.icon}
      </div>

      {/* Text + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, lineHeight: 1,
            color: done ? meta.color : 'rgba(255,255,255,0.8)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%',
          }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, lineHeight: 1, padding: '4px 6px', borderRadius: 999,
              color: rarity.color, background: rarity.bg, border: `1px solid ${rarity.color}40`,
            }}>
              {rarity.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: done ? meta.color : 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
              {done ? '✓ Tamamlandı' : (hideDetails ? '???' : `${ach.currentValue ?? 0}/${ach.targetValue ?? 0}`)}
            </span>
          </div>
        </div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 5px', lineHeight: 1.3 }}>
          {description}
        </p>
        {/* Progress track */}
        {!done && !hideDetails && (
          <div style={{
            width: '100%', height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 16 }}
              style={{
                height: '100%', borderRadius: 2,
                background: `linear-gradient(90deg, ${meta.color}99, ${meta.color})`,
                boxShadow: `0 0 6px ${meta.color}66`,
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════ */
export const StatisticsScreen: React.FC = () => {
  const { highScores, stats, achievements: gameAchievements, gameLogs } = useGameStore();
  const { getThemeColors } = useThemeStore();
  const { t } = useTranslation();
  const colors = getThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const sortedGameLogs = useMemo(() => (
    Array.isArray(gameLogs) ? [...gameLogs].sort((a, b) => b.timestamp - a.timestamp) : []
  ), [gameLogs]);

  const recentLogs = sortedGameLogs.slice(0, 5);
  const personalInsights = useMemo(
    () => buildPersonalInsights(sortedGameLogs),
    [sortedGameLogs]
  );



  const sonsuzBestScore = highScores?.[GameMode.ENDLESS] || 0;
  const timedBestScore  = highScores?.[GameMode.TIMED]   || 0;

  const achievements: Achievement[] = (Array.isArray(gameAchievements) ? gameAchievements : []).map(ach => {
    const progress = ach.targetValue > 0 ? Math.floor((ach.currentValue / ach.targetValue) * 100) : 0;
    return {
      id: ach.id, title: ach.name, description: ach.description,
      icon: '🏆',
      status: ach.unlocked ? 'unlocked' : (progress > 0 ? 'in-progress' : 'locked'),
      progress, category: ach.category, hidden: ach.hidden,
      rarity: ach.rarity || getAchievementRarity(ach),
      currentValue: ach.currentValue, targetValue: ach.targetValue,
    };
  });

  const achievementsByCategory = achievements.reduce((acc, ach) => {
    const cat = ach.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ach);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const unlockedCount   = achievements.filter(a => a.status === 'unlocked').length;
  const totalCount      = achievements.length;
  const overallProgress = totalCount > 0 ? Math.floor((unlockedCount / totalCount) * 100) : 0;

  const categoryNames: Record<string, string> = {
    SCORE:          t('stats.scoreAchievements', 'Skor Başarımları'),
    COMBO:          t('stats.comboAchievements', 'Kombo Başarımları'),
    SPECIAL_BLOCKS: t('stats.specialBlockAchievements', 'Özel Blok Başarımları'),
    ABILITIES:      t('stats.abilityAchievements', 'Yetenek Başarımları'),
    PROGRESSION:    t('stats.progressionAchievements', 'İlerleme Başarımları'),
    SPEED:          t('stats.speedAchievements', 'Hız Başarımları'),
    MASTERY:        t('stats.masteryAchievements', 'Ustalık Başarımları'),
  };

  /* ── shared stat hero numbers ── */
  const heroStats = [
    { label: 'Toplam Oyun',  value: stats.gamesPlayed   || 0, icon: '🎮', color: '#818cf8' },
    { label: 'Satır',        value: stats.linesCleared   || 0, icon: '⚡', color: '#34d399' },
    { label: 'Blok',         value: stats.blocksPlaced   || 0, icon: '🧱', color: '#f472b6' },
    { label: 'Bomba',        value: stats.bombsExploded  || 0, icon: '💣', color: '#fb923c' },
  ];

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d1117 0%, #110d22 50%, #0c0918 100%)' }}>

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full blur-[80px] opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[80px] opacity-10"
          style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Hidden H1 */}
      <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {t('stats.title', 'İstatistikler & Başarımlar')}
      </h1>

      {/* ── HEADER & TABS ── */}
      <div className="flex-shrink-0 px-4 pb-3 relative z-10"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          background: 'rgba(10,8,18,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
        <div className="w-full max-w-[448px] mx-auto">
          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #818cf8, #a855f7)' }} />
            <span className="text-base font-black tracking-tight" style={{ color: '#f0f0f8' }}>
              {activeTab === 'overview' ? 'İstatistikler' : 'Başarımlar'}
            </span>
          </div>
          {/* Pill tabs */}
          <div className="flex gap-2" style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {(['overview', 'achievements'] as TabType[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                {activeTab === tab && (
                  <motion.div layoutId="tab-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: tab === 'overview'
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))'
                        : 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(251,146,60,0.25))',
                      border: `1px solid ${tab === 'overview' ? 'rgba(99,102,241,0.4)' : 'rgba(249,115,22,0.4)'}`,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative" style={{
                  color: activeTab === tab
                    ? (tab === 'overview' ? '#a5b4fc' : '#fb923c')
                    : 'rgba(255,255,255,0.35)',
                }}>
                  {tab === 'overview' ? '📊 İstatistik' : '🏆 Başarım'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: '80px' }}>
        <div className="w-full max-w-[448px] mx-auto space-y-5">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div key="overview"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5">

                {/* ─ Hero stat grid ─ */}
                <div className="grid grid-cols-4 gap-2">
                  {heroStats.map((s, idx) => (
                    <HeroStatCard key={s.label} stat={s} index={idx} />
                  ))}
                </div>

                {/* ─ Streak Banner ─ */}
                <StreakBanner />

                <PersonalInsightGrid insights={personalInsights} />

                {/* ─ Mode performance ─ */}
                <div>
                  <SectionHeader title={t('stats.modePerformance', 'Mod Performansı')} />
                  <div className="space-y-3">
                    <PerformanceCard mode={GameMode.ENDLESS} bestScore={sonsuzBestScore}
                      maxCombo={stats.endlessMaxCombo || 0} maxTier={stats.endlessMaxTier || 0} color="#a855f7" />
                    <PerformanceCard mode={GameMode.TIMED} bestScore={timedBestScore}
                      maxCombo={stats.timedMaxCombo || 0} maxDuration={stats.timedMaxDuration || 0} color="#f59e0b" />
                  </div>
                </div>

                {/* ─ Recent games ─ */}
                <div>
                  <SectionHeader title={t('stats.recentGames', 'Son Oyunlar')} />
                  <RecentLogsTimeline logs={recentLogs} maxItems={5} />
                </div>
              </motion.div>

            ) : (
              <motion.div key="achievements"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5">

                {/* ─ Achievement hero banner ─ */}
                <div className="rounded-2xl p-5 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(168,85,247,0.12) 100%)',
                    border: '1px solid rgba(249,115,22,0.25)',
                  }}>
                  {/* shimmer */}
                  <motion.div animate={{ x: ['-120%', '220%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                    className="absolute top-0 left-0 w-1/3 h-full pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-50 mb-1" style={{ color: '#ffa0a0' }}>
                        Başarım İlerlemesi
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black" style={{
                          background: 'linear-gradient(135deg, #fb923c, #f472b6)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>{unlockedCount}</span>
                        <span className="text-sm opacity-50" style={{ color: '#d0d0e8' }}>/ {totalCount}</span>
                        <span className="text-xs opacity-50" style={{ color: '#d0d0e8' }}>tamamlandı</span>
                      </div>
                    </div>
                    <div className="text-4xl">🏆</div>
                  </div>

                  {/* Overall progress bar */}
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div animate={{ width: `${overallProgress}%` }}
                      transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #f97316, #f472b6)',
                        boxShadow: '0 0 12px rgba(249,115,22,0.5)',
                        borderRadius: 999,
                      }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] opacity-40" style={{ color: '#d0d0e8' }}>0%</span>
                    <span className="text-[10px] font-bold" style={{ color: '#fb923c' }}>%{overallProgress}</span>
                    <span className="text-[10px] opacity-40" style={{ color: '#d0d0e8' }}>100%</span>
                  </div>
                </div>

                {/* ─ Per-category achievement lists ─ */}
                {Object.entries(achievementsByCategory).map(([cat, list]) => {
                  const meta = CAT_META[cat] ?? { icon: '🏅', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
                  const catDone = list.filter(a => a.status === 'unlocked').length;
                  return (
                    <div key={cat}>
                      {/* Category header */}
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 14 }}>{meta.icon}</span>
                          <span className="text-xs font-bold" style={{ color: meta.color }}>
                            {categoryNames[cat] || cat}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color: meta.color, opacity: 0.7 }}>
                          {catDone}/{list.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {list.map((ach, i) => <AchRow key={ach.id} ach={ach} index={i} />)}
                      </div>
                    </div>
                  );
                })}
                <div style={{ height: 16 }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
