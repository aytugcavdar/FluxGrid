import React from 'react';
import { motion } from 'framer-motion';

interface ComboFlashProps {
  combo: number;
}

export const ComboFlash: React.FC<ComboFlashProps> = ({ combo }) => {
  if (combo <= 1) return null;
  return (
    <motion.div
      key={combo}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        background: `radial-gradient(circle at center, ${combo >= 5 ? 'rgba(245,158,11,0.06)' : combo >= 3 ? 'rgba(99,102,241,0.05)' : 'rgba(59,130,246,0.04)'} 0%, transparent 60%)`,
      }}
    />
  );
};
