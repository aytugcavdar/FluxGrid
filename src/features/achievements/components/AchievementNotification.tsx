import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useGameStore } from '@features/game/store/gameStore';
import styles from './AchievementNotification.module.css';

/**
 * Compact achievement toast.
 * Keeps the reward visible without blocking the board; swipe up to dismiss early.
 */
export const AchievementNotification = React.memo(() => {
  const { achievements, unlockedAchievementId, clearAchievementNotification } = useGameStore();
  const recentUnlock = achievements.find(achievement => achievement.id === unlockedAchievementId);

  const y = useMotionValue(0);
  const opacity = useTransform(y, [-90, 0], [0, 1]);

  React.useEffect(() => {
    if (!recentUnlock) return;
    const timer = window.setTimeout(clearAchievementNotification, 2200);
    return () => window.clearTimeout(timer);
  }, [clearAchievementNotification, recentUnlock]);

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y < -34 || info.velocity.y < -420) {
      clearAchievementNotification();
    }
  };

  return (
    <AnimatePresence>
      {recentUnlock && (
        <motion.div
          className={styles.container}
          initial={{ y: -18, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -18, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          drag="y"
          dragMomentum={false}
          dragConstraints={{ top: -72, bottom: 0 }}
          dragElastic={{ top: 0.45, bottom: 0 }}
          onDragEnd={handleDragEnd}
          style={{ y, opacity }}
          onClick={clearAchievementNotification}
          role="status"
          aria-live="polite"
        >
          <div className={styles.content}>
            <div className={styles.icon} aria-hidden="true">🏆</div>
            <div className={styles.text}>
              <div className={styles.badge}>Basarim Acildi</div>
              <div className={styles.title}>{recentUnlock.name}</div>
            </div>
            <div className={styles.dismissHint} aria-hidden="true">↑</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
