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
        // RUSH başlangıç animasyonu
        <motion.div
          key="rush-start"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.5, ease: 'backOut' }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center">
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="text-4xl md:text-6xl font-black tracking-tight"
              style={{ color: '#10b981' }}
            >
              COMBO RUSH!
            </motion.span>
            <span className="text-xs md:text-sm text-white/60 uppercase tracking-widest mt-2">
              3 hamle boyunca 3× puan
            </span>
          </div>
        </motion.div>
      ) : (
        // RUSH bitiş animasyonu (screen flash)
        <motion.div
          key="rush-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, times: [0, 0.5, 1] }}
          className="fixed inset-0 pointer-events-none z-40"
          style={{ background: 'radial-gradient(circle at center, rgba(245,158,11,0.2) 0%, transparent 60%)' }}
        />
      )}
    </AnimatePresence>
  );
};
