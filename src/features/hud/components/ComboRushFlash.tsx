import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComboRushFlashProps {
  active: boolean;
  movesLeft: number;
  onStart?: boolean; // true = başlangıç animasyonu, false = bitiş animasyonu
}

export const ComboRushFlash: React.FC<ComboRushFlashProps> = ({ active, movesLeft, onStart = false }) => {
  if (!active) return null;

  return (
    <AnimatePresence>
      {onStart ? (
        // RUSH başlangıç animasyonu - refined (0.8s, scale 0.9 to 1.0)
        <motion.div
          key="rush-start"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center">
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.4, repeat: 1 }}
              className="text-4xl md:text-6xl font-black tracking-tight"
              style={{ color: '#10b981' }}
            >
              RUSH!
            </motion.span>
            <span className="text-xs md:text-sm text-white/60 uppercase tracking-widest mt-2">
              3 hamle boyunca 3× puan
            </span>
          </div>
        </motion.div>
      ) : (
        // RUSH bitiş animasyonu - refined (0.2s quick flash)
        <motion.div
          key="rush-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, times: [0, 0.5, 1] }}
          className="fixed inset-0 pointer-events-none z-40"
          style={{ background: 'radial-gradient(circle at center, rgba(245,158,11,0.3) 0%, transparent 60%)' }}
        />
      )}
    </AnimatePresence>
  );
};
