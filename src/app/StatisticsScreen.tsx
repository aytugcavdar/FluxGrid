import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../features/game/store/gameStore';
import { useThemeStore } from '../shared/store/themeStore';
import { GameMode } from '@shared/types';
import { PerformanceCard, ProgressBar, StatCard, SectionHeader, RecentLogsTimeline, TrendAnalysisChart } from '../shared/components';
import { useCountUp } from '../shared/hooks/useCountUp';
import { ScoreDistributionChart } from '../shared/components/ScoreDistributionChart';
import { Achievement } from '../shared/types/ui';
import { usePerformanceMetrics } from '../shared/hooks/usePerformanceMetrics';
import { useTrendData } from '../shared/hooks/useTrendData';
import { TrendPeriod } from '../shared/utils/trendDataAggregation';

type TabType = 'overview' | 'achievements';

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

/* ── Single achievement row ── */
const AchRow: React.FC<{ ach: Achievement; index?: number }> = ({ ach, index = 0 }) => {
  const meta   = CAT_META[ach.category || ''] ?? { icon: '🏅', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
  const pct    = Math.min(100, ach.progress ?? 0);
  const done   = ach.status === 'unlocked';
  const locked = ach.status === 'locked' && pct === 0;

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
          }}>{ach.title}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: done ? meta.color : 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
            {done ? '✓ Tamamlandı' : `${ach.currentValue ?? 0}/${ach.targetValue ?? 0}`}
          </span>
        </div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 5px', lineHeight: 1.3 }}>
          {ach.description}
        </p>
        {/* Progress track */}
        {!done && (
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
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('daily');

  const trendData = useTrendData(trendPeriod);

  const recentLogs = Array.isArray(gameLogs)
    ? gameLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
    : [];

  const scoreDistribution = useMemo(() => {
    if (!Array.isArray(gameLogs) || gameLogs.length === 0) {
      return [
        { range: '0-500', count: 0, color: '#6366f1' },
        { range: '500-1K', count: 0, color: '#8b5cf6' },
        { range: '1K-2K', count: 0, color: '#a855f7' },
        { range: '2K-5K', count: 0, color: '#d946ef' },
        { range: '5K+',  count: 0, color: '#f97316' },
      ];
    }
    return [
      { range: '0-500',   color: '#6366f1', count: gameLogs.filter(l => l.score < 500).length },
      { range: '500-1K',  color: '#8b5cf6', count: gameLogs.filter(l => l.score >= 500  && l.score < 1000).length },
      { range: '1K-2K',   color: '#a855f7', count: gameLogs.filter(l => l.score >= 1000 && l.score < 2000).length },
      { range: '2K-5K',   color: '#d946ef', count: gameLogs.filter(l => l.score >= 2000 && l.score < 5000).length },
      { range: '5K+',     color: '#f97316', count: gameLogs.filter(l => l.score >= 5000).length },
    ];
  }, [gameLogs]);

  const sonsuzBestScore = highScores?.[GameMode.ENDLESS] || 0;
  const timedBestScore  = highScores?.[GameMode.TIMED]   || 0;

  const achievements: Achievement[] = (Array.isArray(gameAchievements) ? gameAchievements : []).map(ach => {
    const progress = ach.targetValue > 0 ? Math.floor((ach.currentValue / ach.targetValue) * 100) : 0;
    return {
      id: ach.id, title: ach.name, description: ach.description,
      icon: '🏆',
      status: ach.unlocked ? 'unlocked' : (progress > 0 ? 'in-progress' : 'locked'),
      progress, category: ach.category, hidden: ach.hidden,
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
      style={{ background: 'linear-gradient(160deg, #0a0812 0%, #110d22 50%, #0c0918 100%)' }}>

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

                {/* ─ Trend section ─ */}
                <div>
                  <SectionHeader title={t('stats.trendAnalysis', 'Trend Analizi')} />
                  <div className="flex gap-2 mb-3">
                    {(['daily', 'weekly', 'monthly'] as TrendPeriod[]).map(p => (
                      <button key={p} onClick={() => setTrendPeriod(p)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: trendPeriod === p ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)',
                          color: trendPeriod === p ? '#c084fc' : 'rgba(255,255,255,0.35)',
                          border: `1px solid ${trendPeriod === p ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          cursor: 'pointer',
                        }}>
                        {p === 'daily' ? '📅 Günlük' : p === 'weekly' ? '📊 Haftalık' : '📈 Aylık'}
                      </button>
                    ))}
                  </div>
                  <TrendAnalysisChart data={trendData}
                    lines={[{ dataKey: 'score', color: '#a855f7', label: 'SKOR' }, { dataKey: 'combo', color: '#f59e0b', label: 'KOMBO' }]}
                    height={180} showGrid showLegend />
                </div>

                {/* ─ Score distribution ─ */}
                <ScoreDistributionChart data={scoreDistribution} height={160} />

                {/* ─ Mode performance ─ */}
                <div>
                  <SectionHeader title={t('stats.modePerformance', 'Mod Performansı')} />
                  <div className="space-y-3">
                    <PerformanceCard mode={GameMode.ENDLESS} bestScore={sonsuzBestScore}
                      maxCombo={stats.endlessMaxCombo || 0} maxTier={stats.endlessMaxTier || 0} color="#a855f7" />
                    <PerformanceCard mode={GameMode.TIMED} bestScore={timedBestScore}
                      maxCombo={stats.timedMaxCombo || 0} chronoBonus={stats.timedChronoBonus || 0} color="#f59e0b" />
                  </div>
                </div>

                {/* ─ Progress bars ─ */}
                <div>
                  <SectionHeader title={t('stats.overallProgress', 'Genel İlerleme')} />
                  <div className="rounded-2xl p-4 space-y-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <ProgressBar label={t('stats.totalBlocks', 'Blok')} value={stats.blocksPlaced || 0} maxValue={5000} color="#a855f7" />
                    <ProgressBar label={t('stats.linesCleared', 'Satır')} value={stats.linesCleared || 0} maxValue={500} color="#3b82f6" />
                    <ProgressBar label={t('stats.bombsExploded', 'Bomba')} value={stats.bombsExploded || 0} maxValue={100} color="#ef4444" />
                    <ProgressBar label={t('stats.iceBroken', 'Buz')} value={stats.iceBroken || 0} maxValue={100} color="#06b6d4" />
                    <ProgressBar label={t('stats.totalGames', 'Oyun')} value={stats.gamesPlayed || 0} maxValue={150} color="#10b981" />
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
