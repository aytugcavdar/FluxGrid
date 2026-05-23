/**
 * Achievement Notification Component
 * 
 * Toast-style notification that appears when an achievement is unlocked.
 * Requirements: 8.9
 */

import React, { useEffect } from 'react';
import { useGameStore } from '@features/game/store/gameStore';

export const AchievementNotification: React.FC = () => {
  const { achievements, unlockedAchievementId, clearAchievementNotification } = useGameStore();
  const recentUnlock = achievements.find(achievement => achievement.id === unlockedAchievementId);

  useEffect(() => {
    if (recentUnlock) {
      // Auto-dismiss after 5 seconds (handled by store)
      // But also allow manual dismiss
      const timer = setTimeout(() => {
        clearAchievementNotification();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [recentUnlock, clearAchievementNotification]);

  if (!recentUnlock) return null;

  return (
    <div
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down"
      style={{
        maxWidth: '90%',
        width: '320px',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      }}
    >
      <div
        className="rounded-xl p-4 shadow-lg backdrop-blur-sm"
        style={{
          background: 'rgba(16, 185, 129, 0.95)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }}
        onClick={clearAchievementNotification}
      >
        <div className="flex items-center gap-3">
          <div className="text-4xl">🏆</div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white/80 mb-1">
              BAŞARIM KAZANILDI!
            </div>
            <div className="text-sm font-bold text-white mb-1">
              {recentUnlock.name}
            </div>
            <div className="text-xs text-white/90">
              {recentUnlock.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
