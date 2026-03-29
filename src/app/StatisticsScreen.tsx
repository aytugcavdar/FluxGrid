import React from 'react';
import { useGameStore } from '../features/game/store/gameStore';
import { useThemeStore } from '../shared/store/themeStore';
import { GameMode } from '@shared/types';
import { PerformanceCard, ProgressBar, StatCard, AchievementCard } from '../shared/components';
import { Achievement } from '../shared/types/ui';

export const StatisticsScreen: React.FC = () => {
  const { highScores, stats, achievements: gameAchievements } = useGameStore();
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();

  // Get mode-specific data
  const sonsuzBestScore = highScores[GameMode.ENDLESS] || 0;
  const timedBestScore = highScores[GameMode.TIMED] || 0;

  // Convert game achievements to UI format
  const achievements: Achievement[] = gameAchievements.map(ach => {
    const progress = ach.targetValue > 0 
      ? Math.floor((ach.currentValue / ach.targetValue) * 100) 
      : 0;
    
    return {
      id: ach.id,
      title: ach.name,
      description: ach.description,
      icon: '🏆', // Default icon, can be customized based on category
      status: ach.unlocked ? 'unlocked' : (progress > 0 ? 'in-progress' : 'locked'),
      progress: progress,
    };
  });

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: colors.background }}
    >
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="w-full max-w-[448px] mx-auto">
          {/* MOD PERFORMANSI Section */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
              MOD PERFORMANSI
            </h2>
            
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
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
              GENEL İLERLEME
            </h2>
            
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
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
              GENEL
            </h2>
            
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

          {/* BAŞARIMLAR Section */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
              BAŞARIMLAR
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  status={achievement.status}
                  progress={achievement.progress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
