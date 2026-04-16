import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';

export const BackgroundEffects: React.FC = () => {
  const combo = useGameStore((state) => state.combo);
  const difficultyTier = useGameStore((state) => state.difficultyTier);
  const isSurgeActive = useGameStore((state) => state.isSurgeActive);
  
  // Determine background color based on combo and tier
  const getBackgroundGradient = () => {
    if (isSurgeActive) {
      return 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)';
    }
    
    if (combo >= 10) {
      return 'radial-gradient(circle at center, rgba(236, 72, 153, 0.12) 0%, transparent 70%)';
    }
    
    if (combo >= 7) {
      return 'radial-gradient(circle at center, rgba(245, 158, 11, 0.1) 0%, transparent 70%)';
    }
    
    if (combo >= 5) {
      return 'radial-gradient(circle at center, rgba(139, 92, 246, 0.08) 0%, transparent 70%)';
    }
    
    if (difficultyTier >= 5) {
      return 'radial-gradient(circle at center, rgba(59, 130, 246, 0.06) 0%, transparent 70%)';
    }
    
    return 'transparent';
  };

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      animate={{
        background: getBackgroundGradient(),
      }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
      }}
    />
  );
};
