import React from 'react';
import { motion } from 'framer-motion';

interface PerfectBonusProps {
  show: boolean;
}

export const PerfectBonus: React.FC<PerfectBonusProps> = ({ show }) => {
  if (!show) return null;
  return (
    <motion.div
      key={`perfect-${Date.now()}`}
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1.1, y: -10 }}
      exit={{ opacity: 0, scale: 0.8, y: -40 }}
      transition={{ duration: 0.4, ease: 'backOut' }}
      className="flex flex-col items-center"
    >
      <span className="text-3xl md:text-5xl font-black tracking-tight"
        style={{ color: '#fbbf24' }}>
        ✦ PERFECT!
      </span>
      <span className="text-[10px] tracking-widest text-amber-400/60 uppercase">+%50 Renk Bonusu</span>
    </motion.div>
  );
};
