import React from 'react';
import { motion } from 'framer-motion';

interface ChainCounterProps {
  chain: number;
}

export const ChainCounter: React.FC<ChainCounterProps> = ({ chain }) => {
  if (chain < 2) return null;
  return (
    <motion.div
      key={`chain-${chain}-${Date.now()}`}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.3, y: -40 }}
      transition={{ duration: 0.35, ease: 'backOut' }}
      className="flex flex-col items-center"
    >
      <span className="text-2xl md:text-4xl font-black tracking-tight"
        style={{
          color: chain >= 4 ? '#f59e0b' : chain >= 3 ? '#a78bfa' : '#60a5fa'
        }}>
        x{chain} ZİNCİR
      </span>
      <span className="text-[10px] tracking-widest text-white/40 uppercase">Zincir Reaksiyon</span>
    </motion.div>
  );
};
