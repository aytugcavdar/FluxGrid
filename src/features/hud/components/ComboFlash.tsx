import React from 'react';
import { motion } from 'framer-motion';

interface ComboFlashProps {
  combo: number;
}

export const ComboFlash: React.FC<ComboFlashProps> = ({ combo }) => {
  if (combo <= 1) return null;
  
  // Determine intensity based on combo level
  const isHighCombo = combo >= 10;
  const isMediumCombo = combo >= 5;
  const isLowCombo = combo >= 2;
  
  // Detect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Calculate shake intensity based on combo level (for combo 2x)
  const shakeIntensity = isLowCombo && !prefersReducedMotion ? 3 : 0;
  
  // Determine if we should show combo text (for combo 5x+)
  const showComboText = isMediumCombo;
  
  // Determine if we should show full screen flash (for combo 10x+)
  const showScreenFlash = isHighCombo;
  
  return (
    <>
      {/* Background gradient with optional screen shake */}
      <motion.div
        key={combo}
        initial={{ opacity: 0.6, scale: 0.95 }}
        animate={{ 
          opacity: [0.6, 0.8, 0],
          scale: [0.95, 1.02, 1],
          x: prefersReducedMotion ? 0 : [0, shakeIntensity, -shakeIntensity, shakeIntensity, 0],
          y: prefersReducedMotion ? 0 : [0, -shakeIntensity, shakeIntensity, -shakeIntensity, 0]
        }}
        transition={{ 
          duration: 0.8,
          times: [0, 0.2, 1],
          ease: "easeOut",
          x: { duration: 0.2, times: [0, 0.25, 0.5, 0.75, 1] },
          y: { duration: 0.2, times: [0, 0.25, 0.5, 0.75, 1] }
        }}
        className="fixed inset-0 pointer-events-none z-30"
        style={{
          background: `radial-gradient(circle at center, ${
            isHighCombo 
              ? 'rgba(245,158,11,0.12)' 
              : isMediumCombo 
                ? 'rgba(99,102,241,0.08)' 
                : 'rgba(59,130,246,0.06)'
          } 0%, transparent 60%)`,
          // Border pulse for reduced motion instead of shake
          ...(prefersReducedMotion && isLowCombo ? {
            border: '4px solid rgba(59,130,246,0.4)',
            boxShadow: '0 0 20px rgba(59,130,246,0.3)'
          } : {})
        }}
      />
      
      {/* Combo text slide animation (for combo 5x+) */}
      {showComboText && (
        <motion.div
          key={`text-${combo}`}
          initial={{ 
            x: prefersReducedMotion ? 0 : -100, 
            opacity: prefersReducedMotion ? 1 : 0 
          }}
          animate={{ 
            x: prefersReducedMotion ? 0 : [0, 20, 0],
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: prefersReducedMotion ? 0.8 : 0.6,
            times: prefersReducedMotion ? [0, 0.8, 1] : [0, 0.7, 1],
            ease: "easeOut"
          }}
          className="fixed top-1/3 left-1/2 transform -translate-x-1/2 pointer-events-none z-40"
          style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: isHighCombo ? '#f59e0b' : '#6366f1',
            textShadow: '0 0 10px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap'
          }}
        >
          COMBO x{combo}!
        </motion.div>
      )}
      
      {/* Full screen flash for high combos (10x+) */}
      {showScreenFlash && (
        <motion.div
          key={`flash-${combo}`}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 0.8, 0] }}
          transition={{ 
            duration: 0.15,
            times: [0, 0.3, 1],
            ease: "easeOut"
          }}
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: 'rgba(245,158,11,0.3)',
            mixBlendMode: 'screen'
          }}
        />
      )}
    </>
  );
};
