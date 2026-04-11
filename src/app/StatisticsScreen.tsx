import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../features/game/store/gameStore';
import { useThemeStore } from '../shared/store/themeStore';
import { GameMode } from '@shared/types';
import { PerformanceCard, ProgressBar, StatCard, AchievementCard, SectionHeader, PerformanceDNACard, RecentLogsTimeline, TrendAnalysisChart } from '../shared/components';
import { Achievement } from '../shared/types/ui';
import { usePerformanceMetrics } from '../shared/hooks/usePerformanceMetrics';
import { useTrendData } from '../shared/hooks/useTrendData';
import { TrendPeriod } from '../shared/utils/trendDataAggregation';

type TabType = 'stats' | 'achievements';

export const StatisticsScreen: React.FC = () => {
  const { highScores, stats, achievements: gameAchievements, gameLogs } = useGameStore();
  const { getThemeColors } = useThemeStore();
  const { t } = useTranslation();
  const colors = getThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('daily');
  
  // Get performance metrics
  const performanceMetrics = usePerformanceMetrics();
  
  // Get trend data
  const trendData = useTrendData(trendPeriod);
  
  // Get recent logs (last 5) - safely handle undefined
  const recentLogs = Array.isArray(gameLogs) 
    ? gameLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
    : [];

  // Get mode-specific data - handle undefined highScores
  const sonsuzBestScore = highScores?.[GameMode.ENDLESS] || 0;
  const timedBestScore = highScores?.[GameMode.TIMED] || 0;

  // Convert game achievements to UI format - safely handle undefined/non-array achievements
  const achievements: Achievement[] = (Array.isArray(gameAchievements) ? gameAchievements : []).map(ach => {
    const progress = ach.targetValue > 0 
      ? Math.floor((ach.currentValue / ach.targetValue) * 100) 
      : 0;
    
    // Category-specific icons
    const getCategoryIcon = (category?: string, isLocked?: boolean) => {
      if (isLocked) return '🔒';
      switch (category) {
        case 'SCORE': return '🏆';
        case 'COMBO': return '⚡';
        case 'SPECIAL_BLOCKS': return '💣';
        case 'ABILITIES': return '🔮';
        case 'PROGRESSION': return '📈';
        default: return '🏆';
      }
    };
    
    return {
      id: ach.id,
      title: ach.name,
      description: ach.description,
      icon: getCategoryIcon(ach.category, !ach.unlocked && progress === 0),
      status: ach.unlocked ? 'unlocked' : (progress > 0 ? 'in-progress' : 'locked'),
      progress: progress,
      category: ach.category,
      hidden: ach.hidden,
      currentValue: ach.currentValue,
      targetValue: ach.targetValue,
    };
  });

  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc, ach) => {
    const category = ach.category || 'OTHER';
    if (!acc[category]) acc[category] = [];
    acc[category].push(ach);
    return acc;
  }, {} as Record<string, typeof achievements>);

  // Calculate achievement summary
  const unlockedCount = achievements.filter(a => a.status === 'unlocked').length;
  const totalCount = achievements.length;
  const overallProgress = totalCount > 0 ? Math.floor((unlockedCount / totalCount) * 100) : 0;

  // Category display names
  const categoryNames: Record<string, string> = {
    SCORE: t('stats.scoreAchievements'),
    COMBO: t('stats.comboAchievements'),
    SPECIAL_BLOCKS: t('stats.specialBlockAchievements'),
    ABILITIES: t('stats.abilityAchievements'),
    PROGRESSION: t('stats.progressionAchievements'),
  };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #0f0c1d 0%, #1a1333 50%, #0f0c1d 100%)',
      }}
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #9333ea 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #f97316 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Visually hidden h1 for accessibility */}
      <h1 style={{ 
        position: 'absolute', 
        width: '1px', 
        height: '1px', 
        padding: '0', 
        margin: '-1px', 
        overflow: 'hidden', 
        clip: 'rect(0,0,0,0)', 
        whiteSpace: 'nowrap', 
        border: '0' 
      }}>
        {t('stats.title')}
      </h1>
      
      {/* Fixed Tab Header */}
      <div 
        className="flex-shrink-0 px-4 pb-4 relative z-10 backdrop-blur-xl"
        style={{ 
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          background: 'rgba(15, 12, 29, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="w-full max-w-[448px] mx-auto flex gap-3">
          <button
            onClick={() => setActiveTab('stats')}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeTab === 'stats' 
                ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)' 
                : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'stats' ? '#a855f7' : colors.textSecondary,
              border: activeTab === 'stats' 
                ? '1px solid rgba(168, 85, 247, 0.3)' 
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: activeTab === 'stats' ? '0 4px 16px rgba(168, 85, 247, 0.2)' : 'none',
            }}
            aria-pressed={activeTab === 'stats'}
          >
            📊 {t('stats.title', 'İstatistik')}
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeTab === 'achievements' 
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(251, 146, 60, 0.2) 100%)' 
                : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'achievements' ? '#f97316' : colors.textSecondary,
              border: activeTab === 'achievements' 
                ? '1px solid rgba(249, 115, 22, 0.3)' 
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: activeTab === 'achievements' ? '0 4px 16px rgba(249, 115, 22, 0.2)' : 'none',
            }}
            aria-pressed={activeTab === 'achievements'}
          >
            🏆 {t('stats.achievements', 'Başarımlar')}
          </button>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        <div className="w-full max-w-[448px] mx-auto">
          {activeTab === 'stats' && (
            <>
          {/* Performance DNA Section */}
          <div className="mb-6">
            <PerformanceDNACard
              spectralIndex={performanceMetrics.spectralIndex}
              winRate={performanceMetrics.winRate}
              totalSessions={performanceMetrics.totalSessions}
              activeDays={performanceMetrics.activeDays}
              gradient="linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            />
          </div>
          
          {/* TREND ANALİZİ Section */}
          <div className="mb-6">
            <SectionHeader title={t('stats.trendAnalysis')} />
            
            {/* Period Selector */}
            <div className="flex gap-2 mb-4">
              {(['daily', 'weekly', 'monthly'] as TrendPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: trendPeriod === period 
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    color: trendPeriod === period ? '#a855f7' : colors.textSecondary,
                    border: trendPeriod === period 
                      ? '1px solid rgba(168, 85, 247, 0.3)' 
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: trendPeriod === period ? '0 4px 12px rgba(168, 85, 247, 0.15)' : 'none',
                  }}
                >
                  {period === 'daily' ? `📅 ${t('stats.daily')}` : period === 'weekly' ? `📊 ${t('stats.weekly')}` : `📈 ${t('stats.monthly')}`}
                </button>
              ))}
            </div>
            
            <TrendAnalysisChart
              data={trendData}
              lines={[
                { dataKey: 'score', color: '#a855f7', label: 'SKOR' },
                { dataKey: 'combo', color: '#f59e0b', label: 'KOMBO' },
              ]}
              height={200}
              showGrid={true}
              showLegend={true}
            />
          </div>
          
          {/* MOD PERFORMANSI Section */}
          <div className="mb-6">
            <SectionHeader title={t('stats.modePerformance')} />
            
            <div className="space-y-3">
              <PerformanceCard
                mode={GameMode.ENDLESS}
                bestScore={sonsuzBestScore}
                maxCombo={stats.endlessMaxCombo || 0}
                maxTier={stats.endlessMaxTier || 0}
                color="#a855f7"
              />
              
              <PerformanceCard
                mode={GameMode.TIMED}
                bestScore={timedBestScore}
                maxCombo={stats.timedMaxCombo || 0}
                chronoBonus={stats.timedChronoBonus || 0}
                color="#f59e0b"
              />
            </div>
          </div>

          {/* GENEL İLERLEME Section */}
          <div className="mb-6">
            <SectionHeader title={t('stats.overallProgress')} />
            
            <div
              className="rounded-2xl p-5 space-y-4 backdrop-blur-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <ProgressBar
                label={t('stats.totalBlocks')}
                value={stats.blocksPlaced || 0}
                maxValue={5000}
                color="#a855f7"
              />
              
              <ProgressBar
                label={t('stats.linesCleared')}
                value={stats.linesCleared || 0}
                maxValue={500}
                color="#3b82f6"
              />
              
              <ProgressBar
                label={t('stats.bombsExploded')}
                value={stats.bombsExploded || 0}
                maxValue={100}
                color="#ef4444"
              />
              
              <ProgressBar
                label={t('stats.iceBroken')}
                value={stats.iceBroken || 0}
                maxValue={100}
                color="#06b6d4"
              />
              
              <ProgressBar
                label={t('stats.totalGames')}
                value={stats.gamesPlayed || 0}
                maxValue={150}
                color="#10b981"
              />
            </div>
          </div>

          {/* GENEL Section */}
          <div className="mb-6">
            <SectionHeader title={t('stats.general')} />
            
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon="🎮"
                label={t('stats.totalGames')}
                value={stats.gamesPlayed || 0}
                color="#a855f7"
              />
              
              <StatCard
                icon="🏆"
                label={t('stats.totalScore')}
                value={stats.totalScore || 0}
                color="#f59e0b"
              />
              
              <StatCard
                icon="⚡"
                label={t('stats.lines')}
                value={stats.linesCleared || 0}
                color="#06b6d4"
              />
              
              <StatCard
                icon="💣"
                label={t('stats.bombs')}
                value={stats.bombsExploded || 0}
                color="#ef4444"
              />
            </div>
          </div>
          
          {/* SON OYUNLAR Section */}
          <div className="mb-6">
            <SectionHeader title={t('stats.recentGames')} />
            <RecentLogsTimeline logs={recentLogs} maxItems={5} />
          </div>
            </>
          )}

          {activeTab === 'achievements' && (
            <>
          {/* Achievement Summary */}
          <div className="mb-6">
            <div
              className="rounded-2xl p-5 backdrop-blur-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-200 bg-clip-text text-transparent">
                    {unlockedCount} / {totalCount}
                  </span>
                  <span className="text-sm ml-2" style={{ color: colors.textSecondary }}>
                    {t('stats.unlocked')}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg" style={{
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(251, 146, 60, 0.15) 100%)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                }}>
                  <span className="text-sm font-bold" style={{ color: '#f97316' }}>
                    %{overallProgress}
                  </span>
                </div>
              </div>
              <div
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${overallProgress}%`,
                    background: 'linear-gradient(90deg, #f97316, #fb923c)',
                    boxShadow: '0 0 12px rgba(249, 115, 22, 0.5)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Achievements by Category */}
          {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
            <div key={category} className="mb-6">
              <SectionHeader title={categoryNames[category] || category} />
              
              <div className="space-y-3">
                {categoryAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    status={achievement.status}
                    progress={achievement.progress}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="pb-6" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
