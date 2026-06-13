import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';

export const GridBreathingEffect: React.FC = React.memo(() => {
  const combo = useGameStore((state) => state.combo);
  
  // Calculate intensity based on combo.
  const intensity = Math.min(combo * 0.1, 0.8);
  
  if (intensity === 0) return null;

  return (
    <motion.div
      key={combo}
      className="fixed inset-0 pointer-events-none z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      style={{
        background: `radial-gradient(circle at center, rgba(59, 130, 246, ${intensity * 0.16}) 0%, transparent 60%)`,
      }}
      transition={{
        duration: 0.65,
        ease: "easeInOut",
      }}
    />
  );
});
