import React from 'react';
import { motion } from 'framer-motion';

export interface GradientCardBaseProps {
  gradient: string;
  borderColor: string;
  glowColor?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hoverScale?: number;
  animateOnMount?: boolean;
}

export const GradientCardBase: React.FC<GradientCardBaseProps> = ({
  gradient,
  borderColor,
  glowColor,
  children,
  onClick,
  className = '',
  hoverScale = 1.02,
  animateOnMount = false,
}) => {
  // Detect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const baseStyles: React.CSSProperties = {
    background: gradient,
    border: `1px solid ${borderColor}`,
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
  };

  const hoverAnimation = prefersReducedMotion
    ? {}
    : {
        scale: hoverScale,
        transition: { duration: 0.2, ease: 'easeOut' },
      };

  const mountAnimation = animateOnMount && !prefersReducedMotion
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
      }
    : {};

  return (
    <motion.div
      style={baseStyles}
      className={className}
      onClick={onClick}
      whileHover={hoverAnimation}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      {...mountAnimation}
    >
      {/* Glow effect layer */}
      {glowColor && !prefersReducedMotion && (
        <motion.div
          style={{
            position: 'absolute',
            inset: -2,
            background: glowColor,
            borderRadius: '16px',
            opacity: 0,
            filter: 'blur(8px)',
            zIndex: -1,
          }}
          animate={{
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      
      {children}
    </motion.div>
  );
};
