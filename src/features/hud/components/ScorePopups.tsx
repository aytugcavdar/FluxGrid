import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
}

interface ScorePopupsProps {
  popups: ScorePopup[];
}

export const ScorePopups: React.FC<ScorePopupsProps> = ({ popups }) => (
  <div className="fixed top-16 left-0 right-0 flex flex-col items-center pointer-events-none z-50">
    <AnimatePresence>
      {popups.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.6 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center gap-2 mb-1"
        >
          <span className="text-lg md:text-xl font-bold text-white/90">
            +{p.value.toLocaleString()}
          </span>
          {p.combo > 1 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              x{p.combo} Kombo
            </span>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);
