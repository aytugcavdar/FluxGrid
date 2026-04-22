/**
 * Perfect Clear Popup Component
 * 
 * Displays "PERFECT CLEAR!" message with gold color and glow effect
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerfectClearPopupProps {
  show: boolean;
  onComplete?: () => void;
}

export const PerfectClearPopup: React.FC<PerfectClearPopupProps> = ({ show, onComplete }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -10 }}
          animate={{ 
            scale: [0, 1.3, 1.1, 1],
            opacity: 1,
            rotate: 0,
          }}
          exit={{ scale: 0.8, opacity: 0, y: -50 }}
          transition={{ 
            duration: 0.6,
            ease: 'easeOut',
            scale: {
              times: [0, 0.4, 0.7, 1],
            }
          }}
          onAnimationComplete={(definition) => {
            if (definition === 'exit' && onComplete) {
              onComplete();
            }
          }}
          style={{
            position: 'fixed',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 200,
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          {/* Main text */}
          <motion.div
            animate={{
              textShadow: [
                '0 0 20px #fbbf2480, 0 0 40px #fbbf2460',
                '0 0 30px #fbbf24FF, 0 0 60px #fbbf2480',
                '0 0 20px #fbbf2480, 0 0 40px #fbbf2460',
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: 2,
              ease: 'easeInOut',
            }}
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: '#fbbf24',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              lineHeight: 1,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
            }}
          >
            PERFECT CLEAR!
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#fbbf24',
              marginTop: 12,
              letterSpacing: '2px',
              textShadow: '0 0 10px #fbbf2460',
            }}
          >
            All blocks cleared!
          </motion.div>

          {/* Sparkle effects */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                x: Math.cos((i / 8) * Math.PI * 2) * 150,
                y: Math.sin((i / 8) * Math.PI * 2) * 150,
              }}
              transition={{
                duration: 1.5,
                delay: 0.2 + (i * 0.05),
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#fbbf24',
                boxShadow: '0 0 10px #fbbf24',
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
