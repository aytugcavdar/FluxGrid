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
    <AnimatePresence mode="popLayout">
      {popups.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 40, scale: 0.5 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [40, -10, -20, -60],
            scale: [0.5, 1.2, 1, 0.8]
          }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ 
            duration: 1.2,
            times: [0, 0.2, 0.7, 1],
            ease: [0.34, 1.56, 0.64, 1] // Custom spring-like easing
          }}
          className="flex items-center gap-2 mb-1"
        >
          <motion.span 
            className="text-lg md:text-xl font-bold text-white/90"
            animate={{ 
              textShadow: [
                "0 0 8px rgba(255,255,255,0.3)",
                "0 0 16px rgba(255,255,255,0.6)",
                "0 0 8px rgba(255,255,255,0.3)"
              ]
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            +{p.value.toLocaleString()}
          </motion.span>
          {p.combo > 1 && (
            <motion.span 
              className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 15,
                delay: 0.1
              }}
            >
              x{p.combo} Kombo
            </motion.span>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);
