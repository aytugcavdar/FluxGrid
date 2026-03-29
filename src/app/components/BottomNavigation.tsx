import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavButton } from './NavButton';
import { useResponsiveButtonSize } from '../hooks/useResponsiveButtonSize';
import { getSafeAreaInsets } from '@utils/responsive';
import { GameMode } from '@shared/types';
import styles from './BottomNavigation.module.css';

export interface BottomNavigationProps {
  onOpenProfile: () => void;
  onOpenLeaderboard: (mode: GameMode) => void;
  activeTab?: 'dashboard' | 'quests' | 'rank' | 'profile';
}

/**
 * BottomNavigation Component
 * 
 * Main bottom navigation component with responsive layout and animations.
 * 
 * Features:
 * - Responsive CSS Grid layout
 * - Safe area insets support
 * - Framer Motion animations
 * 
 * **Validates: Requirements 1.1, 1.2, 1.5, 4.4, 4.5, 5.4, 5.5**
 */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onOpenProfile,
  onOpenLeaderboard,
  activeTab = 'dashboard',
}) => {
  // Responsive button sizing
  const buttonSize = useResponsiveButtonSize();
  
  // Get safe area insets for device compatibility
  const safeAreaInsets = useMemo(() => getSafeAreaInsets(), []);
  
  // Fixed button count (no auth button)
  const buttonCount = 4;
  
  // Track animation completion to remove will-change
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Remove will-change after initial animation completes (300ms + stagger)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 500); // 300ms animation + 200ms buffer
    
    return () => clearTimeout(timer);
  }, []);
  
  // Memoized empty handler for dashboard and quests (not yet implemented)
  const handleDashboard = useCallback(() => {}, []);
  const handleQuests = useCallback(() => {}, []);
  
  // Memoized handler for rank button
  const handleRank = useCallback(() => {
    onOpenLeaderboard(GameMode.ENDLESS);
  }, [onOpenLeaderboard]);
  
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  
  // Framer Motion animation variants - memoized to prevent re-creation
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: prefersReducedMotion ? 0 : 0.3,
          staggerChildren: prefersReducedMotion ? 0 : 0.05,
        },
      },
    }),
    [prefersReducedMotion]
  );
  
  const buttonVariants = useMemo(
    () => ({
      hidden: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.8 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: prefersReducedMotion ? 0 : 0.2 },
      },
    }),
    [prefersReducedMotion]
  );
  
  // Memoized button configurations to prevent re-creation on every render
  const buttonConfigs = useMemo(
    () => [
      {
        id: 'dashboard',
        icon: '▦',
        label: 'HOME',
        isActive: activeTab === 'dashboard',
        onClick: handleDashboard,
      },
      {
        id: 'quests',
        icon: '⚔️',
        label: 'BATTLE',
        isActive: activeTab === 'quests',
        onClick: handleQuests,
      },
      {
        id: 'rank',
        icon: '🏅',
        label: 'RANK',
        isActive: activeTab === 'rank',
        onClick: handleRank,
      },
      {
        id: 'profile',
        icon: '👤',
        label: 'PROFILE',
        isActive: activeTab === 'profile',
        onClick: onOpenProfile,
      },
    ],
    [activeTab, handleDashboard, handleQuests, handleRank, onOpenProfile]
  );
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      data-button-count={buttonCount}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${buttonCount}, 1fr)`,
        gap: 8,
        padding: '12px 16px',
        paddingBottom: Math.max(16, safeAreaInsets.bottom),
        background: 'rgba(10, 14, 26, 0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 212, 255, 0.1)',
        zIndex: 1000,
      }}
    >
      {/* Dashboard Button */}
      <motion.div 
        variants={buttonVariants}
        className={`${styles.buttonWrapper} ${animationComplete ? styles.animationComplete : ''}`}
      >
        <NavButton
          icon={buttonConfigs[0].icon}
          label={buttonConfigs[0].label}
          isActive={buttonConfigs[0].isActive}
          onClick={buttonConfigs[0].onClick}
        />
      </motion.div>
      
      {/* Quests Button */}
      <motion.div 
        variants={buttonVariants}
        className={`${styles.buttonWrapper} ${animationComplete ? styles.animationComplete : ''}`}
      >
        <NavButton
          icon={buttonConfigs[1].icon}
          label={buttonConfigs[1].label}
          isActive={buttonConfigs[1].isActive}
          onClick={buttonConfigs[1].onClick}
        />
      </motion.div>
      
      {/* Rank Button */}
      <motion.div 
        variants={buttonVariants}
        className={`${styles.buttonWrapper} ${animationComplete ? styles.animationComplete : ''}`}
      >
        <NavButton
          icon={buttonConfigs[2].icon}
          label={buttonConfigs[2].label}
          isActive={buttonConfigs[2].isActive}
          onClick={buttonConfigs[2].onClick}
        />
      </motion.div>
      
      {/* Profile Button */}
      <motion.div 
        variants={buttonVariants}
        className={`${styles.buttonWrapper} ${animationComplete ? styles.animationComplete : ''}`}
      >
        <NavButton
          icon={buttonConfigs[3].icon}
          label={buttonConfigs[3].label}
          isActive={buttonConfigs[3].isActive}
          onClick={buttonConfigs[3].onClick}
        />
      </motion.div>
    </motion.div>
  );
};
