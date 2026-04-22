import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';

export const GridBreathingEffect: React.FC = React.memo(() => {
  const combo = useGameStore((state) => state.combo);
  const isSurgeActive = useGameStore((state) => state.isSurgeActive);
  
  // Calculate intensity based on combo and surge
  const intensity = Math.min(combo * 0.1 + (isSurgeActive ? 0.3 : 0), 0.8);
  
  if (intensity === 0) return null;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-40"
      animate={{
        background: [
          `radial-gradient(circle at center, rgba(59, 130, 246, ${intensity * 0.1}) 0%, transparent 60%)`,
          `radial-gradient(circle at center, rgba(59, 130, 246, ${intensity * 0.2}) 0%, transparent 60%)`,
          `radial-gradient(circle at center, rgba(59, 130, 246, ${intensity * 0.1}) 0%, transparent 60%)`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});
