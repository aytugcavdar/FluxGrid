import React, { useState } from 'react';
import { useGameStore } from '../features/game/store/gameStore';
import { useThemeStore } from '../shared/store/themeStore';
import { GameMode } from '@shared/types';
import { PerformanceCard, ProgressBar, StatCard, AchievementCard, SectionHeader } from '../shared/components';
import { Achievement } from '../shared/types/ui';

type TabType = 'stats' | 'achievements';

export const StatisticsScreen: React.FC = () => {
  const { highScores, stats, achievements: gameAchievements } = useGameStore();
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('stats');

  // Get mode-specific data - handle undefined highScores
  const sonsuzBestScore = highScores?.[GameMode.ENDLESS] || 0;
  const timedBestScore = highScores?.[GameMode.TIMED] || 0;

  // Convert game achievements to UI format - handle undefined achievements
  const achievements: Achievement[] = (gameAchievements || []).map(ach => {
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
    SCORE: 'Skor Başarımları',
    COMBO: 'Kombo Başarımları',
    SPECIAL_BLOCKS: 'Özel Blok Başarımları',
    ABILITIES: 'Yetenek Başarımları',
    PROGRESSION: 'İlerleme Başarımları',
  };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ 
        background: colors.background
      }}
    >
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
        İstatistikler
      </h1>
      
      {/* Fixed Tab Header */}
      <div 
        className="flex-shrink-0 px-4 pb-3"
        style={{ 
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          borderBottom: `1px solid ${colors.cardBorderTransparent}`,
        }}
      >
        <div className="w-full max-w-[448px] mx-auto flex gap-2">
          <button
            onClick={() => setActiveTab('stats')}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === 'stats' ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === 'stats' ? '#3b82f6' : colors.textSecondary,
              border: activeTab === 'stats' ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            }}
            aria-pressed={activeTab === 'stats'}
          >
            İstatistik
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === 'achievements' ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === 'achievements' ? '#3b82f6' : colors.textSecondary,
              border: activeTab === 'achievements' ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            }}
            aria-pressed={activeTab === 'achievements'}
          >
            Başarımlar
          </button>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        <div className="w-full max-w-[448px] mx-auto">
          {activeTab === 'stats' && (
            <>
          {/* MOD PERFORMANSI Section */}
          <div className="mb-6">
            <SectionHeader title="MOD PERFORMANSI" />
            
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
            <SectionHeader title="GENEL İLERLEME" />
            
            <div
              className="rounded-xl p-4 space-y-4"
              style={{
                background: colors.cardBackgroundTransparent,
                border: `1px solid ${colors.cardBorderTransparent}`,
              }}
            >
              <ProgressBar
                label="Toplam Blok"
                value={stats.blocksPlaced || 0}
                maxValue={5000}
                color="#a855f7"
              />
              
              <ProgressBar
                label="Satır Temizlendi"
                value={stats.linesCleared || 0}
                maxValue={500}
                color="#3b82f6"
              />
              
              <ProgressBar
                label="Bomba Patlatıldı"
                value={stats.bombsExploded || 0}
                maxValue={100}
                color="#ef4444"
              />
              
              <ProgressBar
                label="Buz Kırıldı"
                value={stats.iceBroken || 0}
                maxValue={100}
                color="#06b6d4"
              />
              
              <ProgressBar
                label="Toplam Oyun"
                value={stats.gamesPlayed || 0}
                maxValue={150}
                color="#10b981"
              />
            </div>
          </div>

          {/* GENEL Section */}
          <div className="mb-6">
            <SectionHeader title="GENEL" />
            
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon="🎮"
                label="Toplam Oyun"
                value={stats.gamesPlayed || 0}
                color="#a855f7"
              />
              
              <StatCard
                icon="🏆"
                label="Toplam Skor"
                value={stats.totalScore || 0}
                color="#f59e0b"
              />
              
              <StatCard
                icon="⚡"
                label="Satır"
                value={stats.linesCleared || 0}
                color="#06b6d4"
              />
              
              <StatCard
                icon="💣"
                label="Bomba"
                value={stats.bombsExploded || 0}
                color="#ef4444"
              />
            </div>
          </div>
            </>
          )}

          {activeTab === 'achievements' && (
            <>
          {/* Achievement Summary */}
          <div className="mb-6">
            <div
              className="rounded-xl p-4"
              style={{
                background: colors.cardBackgroundTransparent,
                border: `1px solid ${colors.cardBorderTransparent}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {unlockedCount} / {totalCount} açıldı
                </span>
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  %{overallProgress}
                </span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: colors.cardBorderTransparent }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${overallProgress}%`,
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
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
