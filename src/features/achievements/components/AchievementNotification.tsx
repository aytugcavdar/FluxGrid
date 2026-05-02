import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useAchievementStore } from '../achievementStore';
import styles from './AchievementNotification.module.css';

/**
 * Achievement Notification Component
 * 
 * Displays achievement unlock notifications with animations
 * Supports swipe-to-dismiss (left or right)
 */
export const AchievementNotification = React.memo(() => {
  const { recentUnlock, clearRecentUnlock } = useAchievementStore();
  
  // Motion values for drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);

  if (!recentUnlock) return null;

  const handleDragEnd = (_: any, info: any) => {
    // If dragged more than 100px horizontally or 50px upwards, dismiss
    if (Math.abs(info.offset.x) > 100 || info.offset.y < -50) {
      clearRecentUnlock();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.container}
        initial={{ y: -100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ 
          y: -100, 
          opacity: 0, 
          scale: 0.8,
          transition: { duration: 0.2 }
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        drag={true}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={{ top: 0.7, bottom: 0, left: 0.7, right: 0.7 }}
        onDragEnd={handleDragEnd}
        style={{ x, y, opacity }}
        onClick={clearRecentUnlock}
      >
        {/* Glow effect */}
        <div className={styles.glow} />
        
        {/* Content */}
        <div className={styles.content}>
          {/* Icon with pulse animation */}
          <motion.div
            className={styles.icon}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            {recentUnlock.icon}
          </motion.div>
          
          {/* Text */}
          <div className={styles.text}>
            <div className={styles.badge}>Başarım Kazanıldı!</div>
            <div className={styles.title}>{recentUnlock.title}</div>
            <div className={styles.description}>{recentUnlock.description}</div>
          </div>
        </div>
        
        {/* Progress bar animation */}
        <motion.div
          className={styles.progressBar}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        
        {/* Confetti particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.particle}
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: '50%',
            }}
            initial={{ scale: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0.5],
              y: [0, -50 - Math.random() * 50, -100 - Math.random() * 50],
              x: [(Math.random() - 0.5) * 100],
              opacity: [1, 1, 0],
              rotate: [0, Math.random() * 360],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.05,
              ease: 'easeOut',
            }}
          />
        ))}
        
        {/* Swipe indicator */}
        <div className={styles.swipeIndicator}>
          ↑ Üste veya Yana Kaydır ←→
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
