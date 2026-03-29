import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface TierMilestoneNotificationProps {
  tier: number;
  tierName: string;
  multiplier: number;
  onComplete?: () => void;
}

export const TierMilestoneNotification: React.FC<TierMilestoneNotificationProps> = ({
  tier,
  tierName,
  multiplier,
  onComplete
}) => {
  // Auto-dismiss after 2500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  // Detect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Animation variants based on reduced motion preference
  const containerVariants = prefersReducedMotion
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
        // Full animations: scale, translate, rotate, and opacity
        initial: { opacity: 0, scale: 0.8, y: -20 },
        animate: { 
          opacity: 1, 
          scale: 1, 
          y: 0,
          rotate: [0, 2, 0], // subtle wobble
          transition: {
            duration: 0.6,
            type: 'spring' as const,
            stiffness: 200,
            damping: 15
          }
        },
        exit: { 
          opacity: 0, 
          scale: 1.1, 
          y: -30,
          transition: {
            duration: 0.3,
            ease: 'easeOut' as const
          }
        }
      };
  
  // Staggered text animation variants
  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay: prefersReducedMotion ? 0 : i * 0.1,
        duration: 0.3
      }
    })
  };
  
  const goldColor = '#f59e0b';
  
  return (
    <motion.div
      key={`tier-${tier}-${Date.now()}`}
      initial={containerVariants.initial}
      animate={containerVariants.animate}
      exit={containerVariants.exit}
      className="flex flex-col items-center gap-1"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', // Safari support
        border: `2px solid rgba(245, 158, 11, 0.4)`,
        borderRadius: '16px',
        padding: '16px 24px',
        boxShadow: `0 8px 32px rgba(245, 158, 11, 0.3)`,
        backgroundImage: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))',
        willChange: 'transform, opacity'
      }}
    >
      {/* Tier number and name */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={textVariants}
        className="text-[20px] sm:text-[28px] font-bold"
        style={{
          color: goldColor,
          textShadow: `0 2px 8px rgba(245,158,11,0.5)`
        }}
      >
        Tier {tier}: {tierName}
      </motion.div>
      
      {/* Multiplier */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={textVariants}
        className="text-[12px] sm:text-[16px] font-semibold"
        style={{
          color: goldColor,
          textShadow: `0 2px 8px rgba(245,158,11,0.5)`
        }}
      >
        {multiplier.toFixed(2)}x Çarpan
      </motion.div>
      
      {/* Subtitle */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={textVariants}
        className="text-[9px] sm:text-[11px] font-semibold tracking-widest uppercase"
        style={{
          color: 'rgba(255, 255, 255, 0.6)',
          letterSpacing: '0.1em',
          textShadow: `0 1px 4px rgba(0, 0, 0, 0.8)`
        }}
      >
        YENİ ZOR SEVİYE
      </motion.div>
    </motion.div>
  );
};
