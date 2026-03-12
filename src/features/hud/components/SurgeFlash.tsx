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
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.18, 0.05] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, times: [0, 0.15, 1] }}
        className="fixed inset-0 pointer-events-none z-40"
        style={{ background: 'radial-gradient(circle at center, rgba(251,191,36,0.1) 0%, transparent 60%)' }}
      />
    )}
  </AnimatePresence>
);
