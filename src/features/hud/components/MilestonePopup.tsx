import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Milestone } from '../../game/types';

interface MilestonePopupProps {
  milestone: Milestone | null;
  onClose: () => void;
}

/**
 * MilestonePopup Component
 * 
 * Displays animated milestone celebration popup when player reaches score thresholds.
 * Auto-closes after 2 seconds with confetti animation.
 * 
 * @param milestone - Milestone object to display (null if no milestone)
 * @param onClose - Callback to close the popup
 * 
 * @remarks
 * **Validates: Requirements 7.5, 7.6, 7.7**
 */
export const MilestonePopup: React.FC<MilestonePopupProps> = ({ milestone, onClose }) => {
  useEffect(() => {
    if (milestone) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [milestone, onClose]);
  
  if (!milestone) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          zIndex: 9999,
          textAlign: 'center',
          minWidth: 280,
        }}
      >
        {/* Confetti effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          borderRadius: 16,
          pointerEvents: 'none',
        }}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: '50%', 
                y: '50%', 
                scale: 0,
                rotate: 0,
              }}
              animate={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`,
                scale: [0, 1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 1.5,
                delay: Math.random() * 0.3,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: ['#f59e0b', '#3b82f6', '#10b981', '#f472b6'][i % 4],
              }}
            />
          ))}
        </div>
        
        <h2 style={{ 
          fontSize: 24, 
          fontWeight: 700, 
          color: 'white', 
          marginBottom: 8,
          position: 'relative',
          zIndex: 1,
        }}>
          🎉 {milestone.label}
        </h2>
        <p style={{ 
          fontSize: 14, 
          color: 'rgba(255,255,255,0.8)',
          position: 'relative',
          zIndex: 1,
        }}>
          {milestone.threshold.toLocaleString()} puana ulaştın!
        </p>
      </motion.div>
    </AnimatePresence>
  );
};
