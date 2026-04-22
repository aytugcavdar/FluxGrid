import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorialStore } from '../store/tutorialStore';

// ============================================================================
// TYPES
// ============================================================================

interface TutorialTooltipProps {
  step: number;          // 1-4
  isActive: boolean;
  onSkip: () => void;
}

interface StepContent {
  title: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_CONTENT: Record<number, StepContent> = {
  1: {
    title: 'Parçayı Sürükle 👆',
    description: 'Alttaki parçayı tutup ızgaraya bırak',
  },
  2: {
    title: 'Satır Doldur ⚡',
    description: 'Bir satırı veya sütunu tamamen doldurarak temizle ve puan kazan!',
  },
  3: {
    title: 'Kombo Yap 🔥',
    description: 'Arka arkaya satır temizleyerek kombo yap ve daha fazla puan kazan!',
  },
  4: {
    title: 'Hazırsın! 🎉',
    description: 'Artık FluxGrid ustasısın. İyi oyunlar!',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  step,
  isActive,
  onSkip,
}) => {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  
  const content = STEP_CONTENT[step];
  
  if (!content) {
    console.warn(`[TutorialTooltip] No content for step ${step}`);
    return null;
  }
  
  const isStep4 = step === 4;
  
  // Animation variants
  const containerVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
      };
  
  const stepVariants = prefersReducedMotion
    ? undefined
    : {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
      };
  
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: 'easeOut' as const };
  
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="tooltip"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={transition}
          style={{
            position: 'fixed',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            maxWidth: 'min(360px, 90vw)',
            width: '100%',
          }}
        >
          <motion.div
            key={step}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            transition={transition}
            style={{
              background: 'rgba(10, 14, 26, 0.97)',
              border: isStep4
                ? '1px solid rgba(16, 185, 129, 0.6)'
                : '1px solid rgba(59, 130, 246, 0.6)',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.2)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: isStep4 ? '#10b981' : 'white',
                marginBottom: '6px',
              }}
            >
              {content.title}
            </div>
            
            {/* Description */}
            <div
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '12px',
              }}
            >
              {content.description}
            </div>
            
            {/* Progress dots and skip button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* Progress dots */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                {[1, 2, 3, 4].map((dotStep) => {
                  const isActive = dotStep === step;
                  const isCompleted = dotStep < step;
                  
                  return (
                    <div
                      key={dotStep}
                      data-testid={isActive ? 'progress-dot-filled' : 'progress-dot'}
                      style={{
                        width: isActive ? '8px' : '6px',
                        height: isActive ? '8px' : '6px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted
                          ? '#10b981'
                          : isActive
                          ? '#3b82f6'
                          : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  );
                })}
              </div>
              
              {/* Skip button - hide on step 4 */}
              {!isStep4 && (
                <button
                  onClick={onSkip}
                  aria-label="Atla"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  }}
                >
                  Atla
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
