import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, pageKey }) => {
  const isGameScreen = pageKey === 'game';
  const [showContent, setShowContent] = useState(false);
  
  // Delay content rendering for game screen until curtains close
  useEffect(() => {
    if (isGameScreen) {
      setShowContent(false);
      // Show content after curtains close (0.6s)
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [isGameScreen, pageKey]);
  
  // Special transition for game screen
  if (isGameScreen) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={pageKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            background: '#000000', // Pure black background
          }}
        >
          {/* Curtain effect - left side */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: ['0%', '0%', '-100%'] }}
            transition={{
              duration: 1.4,
              times: [0, 0.5, 1],
              ease: [0.87, 0, 0.13, 1], // More dramatic easing
            }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, #0f0f23 0%, #1a1a3e 50%, #0f1729 100%)',
              boxShadow: '4px 0 40px rgba(0, 0, 0, 0.8)',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            {/* Decorative edge glow - left curtain */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '2px',
                height: '100%',
                background: 'linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)',
              }}
            />
          </motion.div>
          
          {/* Curtain effect - right side */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: ['0%', '0%', '100%'] }}
            transition={{
              duration: 1.4,
              times: [0, 0.5, 1],
              ease: [0.87, 0, 0.13, 1], // More dramatic easing
            }}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, #0f1729 0%, #1a1a3e 50%, #0f0f23 100%)',
              boxShadow: '-4px 0 40px rgba(0, 0, 0, 0.8)',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            {/* Decorative edge glow - right curtain */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '2px',
                height: '100%',
                background: 'linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)',
              }}
            />
          </motion.div>
          
          {/* Center seam glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0, 0.6, 0],
            }}
            transition={{
              duration: 1.4,
              times: [0, 0.4, 0.5, 0.7],
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              width: '4px',
              height: '100%',
              background: 'linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.6) 30%, rgba(139, 92, 246, 0.6) 70%, transparent 100%)',
              filter: 'blur(8px)',
              zIndex: 10000,
              pointerEvents: 'none',
            }}
          />
          
          {/* Center flash burst - appears when curtains start opening */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0, 0, 0.8, 0],
              scale: [0.5, 0.5, 2, 3],
            }}
            transition={{
              duration: 1.4,
              times: [0, 0.5, 0.7, 1],
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(139, 92, 246, 0.3) 30%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 10000,
              pointerEvents: 'none',
              filter: 'blur(20px)',
            }}
          />
          
          {/* Sparkle particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0, 1, 0],
                scale: [0, 0, 1, 0],
                x: [0, 0, (Math.cos(i * Math.PI / 4) * 100)],
                y: [0, 0, (Math.sin(i * Math.PI / 4) * 100)],
              }}
              transition={{
                duration: 1.4,
                times: [0, 0.5, 0.65, 0.85],
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '4px',
                height: '4px',
                background: '#ffffff',
                borderRadius: '50%',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                zIndex: 10001,
                pointerEvents: 'none',
              }}
            />
          ))}
          
          {/* Game content - only show after curtains close */}
          {showContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              {children}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }
  
  // Regular transition for menu screens
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
