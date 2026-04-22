/**
 * Combo Display Component
 * 
 * Shows minimal combo counter with smooth animations
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { detectReducedMotion } from '../../visual-effects/utils/reducedMotionDetector';

// Get color based on combo level
const getComboColor = (combo: number): string => {
  if (combo >= 10) return '#ef4444'; // Red - Epic
  if (combo >= 5) return '#f97316'; // Orange - Great
  return '#3b82f6'; // Blue - Good
};

export const ComboDisplay: React.FC = React.memo(() => {
  const { combo } = useGameStore();
  
  const [showCombo, setShowCombo] = useState(false);
  const [prefersReducedMotion] = useState(detectReducedMotion());
  const [isBreaking, setIsBreaking] = useState(false);
  const [breakFinalValue, setBreakFinalValue] = useState(0);
  const [prevCombo, setPrevCombo] = useState(0);
  const [bounceKey, setBounceKey] = useState(0); // For triggering bounce animation
  
  // Memoize controls to prevent re-creation on every render
  const controls = React.useMemo(() => {
    return {
      scale: [1, 1.15, 1],
      transition: { duration: 0.3, ease: 'easeOut' as const }
    };
  }, []);

  useEffect(() => {
    // PERFORMANCE: Disable combo display for combo >= 10 to prevent freeze
    if (combo >= 10) {
      setShowCombo(false);
      setPrevCombo(combo);
      return;
    }
    
    // Detect combo break (combo went from >0 to 0)
    if (prevCombo >= 2 && combo === 0) {
      setIsBreaking(true);
      setBreakFinalValue(prevCombo);
      setShowCombo(true);
      
      // Show break animation for 1 second
      const breakTimer = setTimeout(() => {
        setIsBreaking(false);
        setShowCombo(false);
      }, 1000);
      
      return () => clearTimeout(breakTimer);
    }
    
    // Show combo when it's 2 or higher (but less than 10)
    if (combo >= 2 && combo < 10) {
      setShowCombo(true);
      setIsBreaking(false);
      
      // Trigger bounce animation on combo increase
      if (combo > prevCombo && prevCombo >= 2) {
        setBounceKey(prev => prev + 1); // Trigger animation by changing key
      }
      
      // Auto-hide after 2.5 seconds
      const timer = setTimeout(() => {
        setShowCombo(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    } else {
      if (!isBreaking) {
        setShowCombo(false);
      }
    }
    
    setPrevCombo(combo);
  }, [combo, prevCombo, isBreaking]); // Removed controls from dependencies

  const displayCombo = isBreaking ? breakFinalValue : combo;
  const comboColor = isBreaking ? '#ef4444' : getComboColor(displayCombo); // Calculate color directly

  return (
    <AnimatePresence>
      {showCombo && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
          }}
          exit={{ 
            scale: isBreaking ? 0.8 : 0.7, 
            opacity: 0,
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 500, 
            damping: 30,
          }}
          style={{
            position: 'fixed',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {/* Simple combo number with bounce */}
          <motion.div
            key={bounceKey} // Use key to trigger animation
            animate={controls}
            style={{
              position: 'relative',
              display: 'inline-block',
            }}
          >
            {/* Main number */}
            <motion.div
              animate={{ 
                color: comboColor,
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{
                fontSize: 120,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-4px',
                textShadow: `
                  0 0 30px ${comboColor}aa,
                  0 0 60px ${comboColor}55,
                  0 6px 20px rgba(0,0,0,0.8)
                `,
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))',
              }}
            >
              {/* Number with smooth transition */}
              <motion.span
                key={displayCombo}
                initial={{ opacity: 0, y: -15, scale: 1.2 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ display: 'inline-block' }}
              >
                {displayCombo}×
              </motion.span>
            </motion.div>
            
            {/* Subtle glow layer */}
            <motion.div
              animate={{ 
                color: comboColor,
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                fontSize: 120,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-4px',
                filter: 'blur(20px)',
                opacity: 0.4,
                zIndex: -1,
              }}
            >
              {displayCombo}×
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
