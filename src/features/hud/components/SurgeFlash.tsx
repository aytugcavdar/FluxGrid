import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SurgeFlashProps {
  active: boolean;
}

export const SurgeFlash: React.FC<SurgeFlashProps> = ({ active }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        key="surge-flash"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: [0, 0.25, 0.08, 0],
          scale: [0.9, 1.05, 1, 1]
        }}
        exit={{ opacity: 0 }}
        transition={{ 
          duration: 1.5,
          times: [0, 0.15, 0.5, 1],
          ease: "easeOut"
        }}
        className="fixed inset-0 pointer-events-none z-5"
        style={{ 
          background: 'radial-gradient(circle at center, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.08) 40%, transparent 70%)',
          mixBlendMode: 'screen'
        }}
      />
    )}
  </AnimatePresence>
);
