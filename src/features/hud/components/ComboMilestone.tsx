import React from 'react';
import { motion } from 'framer-motion';

interface ComboMilestoneProps {
  combo: number;
  show: boolean;
}

export const ComboMilestone: React.FC<ComboMilestoneProps> = ({ combo, show }) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Only show for milestones: 5, 10, 15, 20
  const isMilestone = [5, 10, 15, 20].includes(combo);
  
  if (!show || !isMilestone) return null;
  
  return (
    <motion.div
      key={`milestone-${combo}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.8, times: [0, 0.1, 0.7, 1] }}
      className="fixed inset-0 pointer-events-none z-60 flex items-center justify-center"
      style={{ pointerEvents: 'none' }}
    >
      {/* Glow ring effect */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.2, 1.5], opacity: [0, 0.6, 0] }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(245, 158, 11, 0.3) 70%, transparent 100%)',
          border: '4px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '50%'
        }}
      />
      
      {/* Text animation */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0 } : { x: -100, opacity: 0 }}
        animate={
          prefersReducedMotion
            ? { opacity: [0, 1, 1, 0] }
            : {
                x: [-100, 0, 0, 100],
                opacity: [0, 1, 1, 0]
              }
        }
        transition={{ duration: 0.8, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
        className="text-6xl md:text-8xl font-black tracking-tight"
        style={{
          color: '#f59e0b',
          textShadow: '0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(245, 158, 11, 0.4)',
          WebkitTextStroke: '2px rgba(0, 0, 0, 0.3)'
        }}
      >
        COMBO x{combo}!
      </motion.div>
    </motion.div>
  );
};
