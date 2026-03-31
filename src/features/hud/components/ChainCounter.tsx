import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ChainCounterProps {
  chain: number;
}

// Utility function to calculate ChainCounter position
const getChainCounterPosition = (viewportHeight: number, isMobile: boolean): number => {
  const topOffset = 120; // Minimum distance from top (HUD)
  const mobilePercentage = 0.65; // 65% of viewport height for mobile
  const desktopPercentage = 0.55; // 55% of viewport height for desktop
  
  const targetPosition = isMobile 
    ? viewportHeight * mobilePercentage 
    : viewportHeight * desktopPercentage;
    
  return Math.max(topOffset, targetPosition);
};

export const ChainCounter: React.FC<ChainCounterProps> = ({ chain }) => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Update viewport dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (chain < 2) return null;
  
  // Calculate position
  const topPosition = getChainCounterPosition(viewportHeight, isMobile);
  
  // Determine color based on chain value
  const chainColor = chain >= 4 ? '#f59e0b' : chain === 3 ? '#a78bfa' : '#60a5fa';
  
  // Detect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Animation variants based on reduced motion preference
  const animationVariants = prefersReducedMotion
    ? {
        // Reduced motion: opacity-only transitions
        initial: { opacity: 0 },
        animate: { 
          opacity: 1,
          transition: {
            duration: 0.3,
            ease: 'easeInOut' as const
          }
        },
        exit: { 
          opacity: 0,
          transition: {
            duration: 0.2,
            ease: 'easeInOut' as const
          }
        }
      }
    : {
        // Full animations: scale, translate, and opacity with vertical movement
        initial: { opacity: 0, scale: 0.5, y: 20 },
        animate: { 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1] as const // spring-like cubic bezier for entrance
          }
        },
        exit: { 
          opacity: 0, 
          scale: 1.3, 
          y: -40,
          transition: {
            duration: 0.3,
            ease: 'easeOut' as const // easeOut for exit
          }
        }
      };
  
  return (
    <motion.div
      key={`chain-${chain}-${Date.now()}`}
      initial={animationVariants.initial}
      animate={animationVariants.animate}
      exit={animationVariants.exit}
      className="flex flex-col items-center"
      style={{
        position: 'fixed',
        top: topPosition,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Safari support
        border: `1px solid ${chainColor}`,
        borderRadius: '12px',
        padding: '8px 16px',
        boxShadow: `0 0 20px ${chainColor}40, 0 0 40px ${chainColor}20`,
        willChange: 'transform, opacity'
      }}
    >
      <motion.span 
        className="text-[20px] sm:text-[28px] font-extrabold tracking-tight"
        style={{
          color: chainColor,
          textShadow: `0 2px 8px ${chainColor}80`
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        x{chain}
      </motion.span>
    </motion.div>
  );
};
