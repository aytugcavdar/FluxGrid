import { Variant } from 'framer-motion';

export interface AnimationVariants {
  pulse: {
    initial: Variant;
    animate: Variant;
    transition: any;
  };
  flash: {
    initial: Variant;
    animate: Variant;
    transition: any;
  };
  glow: {
    initial: Variant;
    animate: Variant;
    transition: any;
  };
}

export const createAnimationVariants = (prefersReducedMotion: boolean): AnimationVariants => {
  if (prefersReducedMotion) {
    // Reduced motion: opacity-only transitions with 50% reduced duration
    return {
      pulse: {
        initial: { opacity: 0.8 },
        animate: { opacity: 1 },
        transition: { duration: 0.15 } // 300ms * 0.5
      },
      
      flash: {
        initial: { opacity: 0 },
        animate: { opacity: [0, 0.3, 0] },
        transition: { duration: 0.1 } // 200ms * 0.5
      },
      
      glow: {
        initial: { opacity: 0.5 },
        animate: { opacity: 0.8 },
        transition: { duration: 0.2 } // 400ms * 0.5
      }
    };
  }
  
  // Full animations: scale, translate, and opacity
  return {
    pulse: {
      initial: { scale: 1, opacity: 0.8 },
      animate: { scale: 1.05, opacity: 1 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    
    flash: {
      initial: { opacity: 0, scale: 1 },
      animate: { 
        opacity: [0, 0.6, 0], 
        scale: [1, 1.02, 1] 
      },
      transition: { duration: 0.2, ease: 'easeInOut' }
    },
    
    glow: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { 
        opacity: [0, 0.8, 0.5],
        scale: [0.95, 1.05, 1],
      },
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };
};
