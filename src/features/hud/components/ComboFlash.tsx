import React from 'react';
import { motion } from 'framer-motion';

interface ComboFlashProps {
  combo: number;
}

export const ComboFlash: React.FC<ComboFlashProps> = ({ combo }) => {
  if (combo <= 1) return null;
  
  // Determine intensity based on combo level
  const isHighCombo = combo >= 5;
  const isMediumCombo = combo >= 3;
  
  return (
    <motion.div
      key={combo}
      initial={{ opacity: 0.6, scale: 0.95 }}
      animate={{ 
        opacity: [0.6, 0.8, 0],
        scale: [0.95, 1.02, 1]
      }}
      transition={{ 
        duration: 0.8,
        times: [0, 0.2, 1],
        ease: "easeOut"
      }}
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        background: `radial-gradient(circle at center, ${
          isHighCombo 
            ? 'rgba(245,158,11,0.12)' 
            : isMediumCombo 
              ? 'rgba(99,102,241,0.08)' 
              : 'rgba(59,130,246,0.06)'
        } 0%, transparent 60%)`,
      }}
    />
  );
};
