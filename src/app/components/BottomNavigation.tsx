import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavButton } from './NavButton';
import { AuthButton } from './AuthButton';
import { useAuthWithTimeout } from '../hooks/useAuthWithTimeout';
import { useResponsiveButtonSize } from '../hooks/useResponsiveButtonSize';
import { getSafeAreaInsets } from '@utils/responsive';
import { useAuthStore } from '@features/auth/store/authStore';
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
 * Main bottom navigation component that integrates NavButton and AuthButton components
 * with responsive layout and animations.
 * 
 * Features:
 * - Responsive CSS Grid layout
 * - Conditional auth button rendering
 * - Loading state management with timeout
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
  // Auth state with timeout to prevent flash effect
  const { user, isAnonymous, isLoading } = useAuthWithTimeout(1000);
  
  // Responsive button sizing
  const buttonSize = useResponsiveButtonSize();
  
  // Get safe area insets for device compatibility
  const safeAreaInsets = useMemo(() => getSafeAreaInsets(), []);
  
  // Calculate if auth button should be visible
  const isAuthButtonVisible = !user || isAnonymous;
  
  // Calculate button count for grid layout
  const buttonCount = isAuthButtonVisible ? 5 : 4;
  
  // Track animation completion to remove will-change
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Remove will-change after initial animation completes (300ms + stagger)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 500); // 300ms animation + 200ms buffer
    
    return () => clearTimeout(timer);
  }, []);
  
  // Auth button handlers - memoized to prevent re-creation on every render
  const handleLogin = useCallback(() => {
    useAuthStore.getState().signInWithGoogle();
  }, []);
  
  const handleSaveAccount = useCallback(() => {
    useAuthStore.getState().linkWithGoogle();
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
          isLoading={isLoading}
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
          isLoading={isLoading}
        />
      </motion.div>
      
      {/* Auth Button (conditional) */}
      {isAuthButtonVisible && (
        <motion.div 
          variants={buttonVariants}
          className={`${styles.buttonWrapper} ${animationComplete ? styles.animationComplete : ''}`}
        >
          <AuthButton
            user={user}
            isAnonymous={isAnonymous}
            isLoading={isLoading}
            onLogin={handleLogin}
            onSaveAccount={handleSaveAccount}
            prefersReducedMotion={prefersReducedMotion}
          />
        </motion.div>
      )}
      
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
          isLoading={isLoading}
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
          isLoading={isLoading}
        />
      </motion.div>
    </motion.div>
  );
};
