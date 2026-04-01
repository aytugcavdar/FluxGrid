import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTutorialStore } from '../store/tutorialStore';
import { useGameStore } from '../../features/game/store/gameStore';

// ============================================================================
// TYPES
// ============================================================================

interface SpotlightConfig {
  clipPath: string;
  targetRect: DOMRect | null;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowDirection: 'up' | 'down' | 'left' | 'right';
}

// ============================================================================
// CONFETTI EFFECT COMPONENT
// ============================================================================

const ConfettiEffect: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f7b731);
          animation: confetti-fall 2s ease-out forwards;
        }
      `}</style>
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${10 + i * 2}%`,
            top: 0,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </>
  );
};

// ============================================================================
// SPOTLIGHT CALCULATION
// ============================================================================

const calculateSpotlight = (targetSelector: string): SpotlightConfig => {
  const element = document.querySelector(targetSelector);
  
  if (!element) {
    console.warn(`Tutorial target element not found: ${targetSelector}`);
    return { clipPath: 'none', targetRect: null };
  }
  
  const rect = element.getBoundingClientRect();
  const padding = 8; // 8px padding around target
  
  // Create inset clip-path that excludes the spotlight area
  const clipPath = `polygon(
    0% 0%,
    0% 100%,
    ${rect.left - padding}px 100%,
    ${rect.left - padding}px ${rect.top - padding}px,
    ${rect.right + padding}px ${rect.top - padding}px,
    ${rect.right + padding}px ${rect.bottom + padding}px,
    ${rect.left - padding}px ${rect.bottom + padding}px,
    ${rect.left - padding}px 100%,
    100% 100%,
    100% 0%
  )`;
  
  return { clipPath, targetRect: rect };
};

// ============================================================================
// RESPONSIVE TOOLTIP CONFIG
// ============================================================================

const getResponsiveTooltipConfig = (): { width: number; height: number } => {
  const viewportWidth = window.innerWidth;
  
  if (viewportWidth < 768) {
    // Mobile: Smaller tooltip
    return { width: 260, height: 100 };
  } else if (viewportWidth < 1024) {
    // Tablet: Medium tooltip
    return { width: 300, height: 120 };
  } else {
    // Desktop: Larger tooltip
    return { width: 320, height: 140 };
  }
};

// ============================================================================
// TOOLTIP POSITIONING
// ============================================================================

const calculateTooltipPosition = (
  targetRect: DOMRect | null,
  preferredPosition: 'top' | 'bottom' | 'left' | 'right'
): TooltipPosition => {
  const { width: tooltipWidth, height: tooltipHeight } = getResponsiveTooltipConfig();
  const arrowSize = 12;
  const margin = 16;
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  
  // Fallback to center if no target rect
  if (!targetRect) {
    return {
      top: viewport.height / 2 - tooltipHeight / 2,
      left: viewport.width / 2 - tooltipWidth / 2,
      arrowDirection: 'down',
    };
  }
  
  let top = 0;
  let left = 0;
  let arrowDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  
  switch (preferredPosition) {
    case 'top':
      top = targetRect.top - tooltipHeight - arrowSize - margin;
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
      arrowDirection = 'down';
      
      // Fallback to bottom if not enough space
      if (top < margin) {
        top = targetRect.bottom + arrowSize + margin;
        arrowDirection = 'up';
      }
      break;
      
    case 'bottom':
      top = targetRect.bottom + arrowSize + margin;
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
      arrowDirection = 'up';
      
      // Fallback to top if not enough space
      if (top + tooltipHeight > viewport.height - margin) {
        top = targetRect.top - tooltipHeight - arrowSize - margin;
        arrowDirection = 'down';
      }
      break;
      
    case 'left':
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      left = targetRect.left - tooltipWidth - arrowSize - margin;
      arrowDirection = 'right';
      
      // Fallback to right if not enough space
      if (left < margin) {
        left = targetRect.right + arrowSize + margin;
        arrowDirection = 'left';
      }
      break;
      
    case 'right':
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      left = targetRect.right + arrowSize + margin;
      arrowDirection = 'left';
      
      // Fallback to left if not enough space
      if (left + tooltipWidth > viewport.width - margin) {
        left = targetRect.left - tooltipWidth - arrowSize - margin;
        arrowDirection = 'right';
      }
      break;
  }
  
  // Constrain to viewport
  left = Math.max(margin, Math.min(left, viewport.width - tooltipWidth - margin));
  top = Math.max(margin, Math.min(top, viewport.height - tooltipHeight - margin));
  
  return { top, left, arrowDirection };
};

// ============================================================================
// TUTORIAL OVERLAY COMPONENT
// ============================================================================

export const TutorialOverlay: React.FC = () => {
  const { isActive, currentStep, skip, getStepConfig } = useTutorialStore();
  const { t } = useTranslation();
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    arrowDirection: 'down',
  });
  const [spotlightConfig, setSpotlightConfig] = useState<SpotlightConfig>({
    clipPath: 'none',
    targetRect: null,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Check for reduced motion preference and listen for changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Listen for tutorial completion event to trigger confetti
  useEffect(() => {
    const handleTutorialComplete = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000); // Match tutorialStore delay
    };
    
    window.addEventListener('tutorial-complete', handleTutorialComplete);
    return () => window.removeEventListener('tutorial-complete', handleTutorialComplete);
  }, []);
  
  // Calculate spotlight and tooltip position when step changes
  useEffect(() => {
    if (!isActive) return;
    
    const stepConfig = getStepConfig(currentStep);
    
    // Wait for DOM to be ready (especially for canvas and pieces)
    const calculatePositions = () => {
      const config = calculateSpotlight(stepConfig.targetElement);
      setSpotlightConfig(config);
      
      const tooltipPos = calculateTooltipPosition(config.targetRect, stepConfig.tooltipPosition);
      setTooltipPosition(tooltipPos);
      
      // Debug logging
      console.log('[Tutorial] Step', currentStep, 'spotlight config:', {
        selector: stepConfig.targetElement,
        found: config.targetRect !== null,
        rect: config.targetRect ? {
          x: config.targetRect.left,
          y: config.targetRect.top,
          width: config.targetRect.width,
          height: config.targetRect.height
        } : null
      });
    };
    
    // Retry logic for step 1 - pieces may not be rendered yet
    if (currentStep === 1) {
      let attempts = 0;
      const maxAttempts = 10;
      const retryDelay = 200;
      
      const tryCalculate = () => {
        attempts++;
        const element = document.querySelector(stepConfig.targetElement);
        
        if (element) {
          console.log('[Tutorial] Element found on attempt', attempts);
          calculatePositions();
        } else if (attempts < maxAttempts) {
          console.log('[Tutorial] Element not found, retrying... (attempt', attempts, '/', maxAttempts, ')');
          setTimeout(tryCalculate, retryDelay);
        } else {
          console.error('[Tutorial] Element not found after', maxAttempts, 'attempts');
          calculatePositions(); // Calculate anyway with fallback
        }
      };
      
      // Start first attempt after initial delay
      const timer = setTimeout(tryCalculate, 500);
      return () => clearTimeout(timer);
    } else {
      // For other steps, use simple delay
      const timer = setTimeout(calculatePositions, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, getStepConfig]);
  
  // Recalculate spotlight and tooltip on window resize (throttled)
  useEffect(() => {
    if (!isActive) return;
    
    const handleResize = () => {
      // Clear previous timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      // Throttle to 100ms
      resizeTimeoutRef.current = setTimeout(() => {
        const stepConfig = getStepConfig(currentStep);
        const config = calculateSpotlight(stepConfig.targetElement);
        setSpotlightConfig(config);
        
        const tooltipPos = calculateTooltipPosition(config.targetRect, stepConfig.tooltipPosition);
        setTooltipPosition(tooltipPos);
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [isActive, currentStep, getStepConfig]);
  
  // Flux change listener for step 4
  useEffect(() => {
    if (!isActive || currentStep !== 4) return;
    
    let prevFlux = useGameStore.getState().flux;
    const unsubscribe = useGameStore.subscribe(
      (state) => {
        if (state.flux !== prevFlux) {
          prevFlux = state.flux;
          console.log('[Tutorial] Flux changed - advancing to next step');
          useTutorialStore.getState().nextStep();
        }
      }
    );
    
    return unsubscribe;
  }, [isActive, currentStep]);
  
  // Auto-complete timer for step 6
  useEffect(() => {
    if (!isActive || currentStep !== 6) return;
    
    const timer = setTimeout(() => {
      console.log('[Tutorial] Step 6 complete - finishing tutorial');
      useTutorialStore.getState().complete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isActive, currentStep]);
  
  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skip();
          break;
        case 'ArrowRight':
        case 'Enter':
          // Only allow manual progression on non-game-action steps
          if (![1, 2, 5].includes(currentStep)) {
            useTutorialStore.getState().nextStep();
          }
          break;
        case 'ArrowLeft':
          if (currentStep > 1) {
            useTutorialStore.getState().previousStep();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, skip]);
  
  // Focus management - focus skip button when tooltip opens
  useEffect(() => {
    if (!isActive) return;
    
    const skipButton = document.querySelector('.tutorial-skip') as HTMLButtonElement;
    if (skipButton) {
      skipButton.focus();
    }
  }, [isActive, currentStep]);
  
  // Don't render anything when tutorial is not active
  if (!isActive && !showConfetti) {
    return null;
  }
  
  // Only render confetti when tutorial is not active but confetti should show
  if (!isActive && showConfetti && !prefersReducedMotion) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
        <ConfettiEffect />
      </div>
    );
  }
  
  // If tutorial is not active and no confetti, return null
  if (!isActive) {
    return null;
  }
  
  const { width: tooltipWidth, height: tooltipHeight } = getResponsiveTooltipConfig();
  const stepConfig = getStepConfig(currentStep);
  
  // Hand animation variants
  const handAnimationVariants = {
    initial: { 
      x: 0, 
      y: 0, 
      opacity: 0,
      scale: 0.8,
    },
    animate: (custom: { startX: number; startY: number; endX: number; endY: number }) => ({
      x: prefersReducedMotion ? 0 : [custom.startX, custom.endX, custom.startX],
      y: prefersReducedMotion ? 0 : [custom.startY, custom.endY, custom.startY],
      opacity: prefersReducedMotion ? 1 : [0, 1, 1, 0],
      scale: prefersReducedMotion ? 1 : [0.8, 1, 1, 0.8],
      transition: prefersReducedMotion ? {} : {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        times: [0, 0.4, 0.6, 1],
      },
    }),
  };
  
  // Tooltip animation variants
  const tooltipVariants = {
    hidden: { 
      opacity: 0, 
      scale: prefersReducedMotion ? 1 : 0.9,
      y: prefersReducedMotion ? 0 : -10,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : {
        duration: 0.3,
        ease: 'easeOut' as const,
      },
    },
    exit: { 
      opacity: 0, 
      scale: prefersReducedMotion ? 1 : 0.9,
      y: prefersReducedMotion ? 0 : 10,
      transition: prefersReducedMotion ? { duration: 0 } : {
        duration: 0.2,
        ease: 'easeIn' as const,
      },
    },
  };
  
  // Arrow styles based on direction
  const getArrowStyle = (direction: 'up' | 'down' | 'left' | 'right') => {
    const baseStyle = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };
    
    switch (direction) {
      case 'up':
        return {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '0 8px 8px 8px',
          borderColor: 'transparent transparent rgba(30, 30, 30, 0.95) transparent',
        };
      case 'down':
        return {
          ...baseStyle,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '8px 8px 0 8px',
          borderColor: 'rgba(30, 30, 30, 0.95) transparent transparent transparent',
        };
      case 'left':
        return {
          ...baseStyle,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: '8px 8px 8px 0',
          borderColor: 'transparent rgba(30, 30, 30, 0.95) transparent transparent',
        };
      case 'right':
        return {
          ...baseStyle,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: '8px 0 8px 8px',
          borderColor: 'transparent transparent transparent rgba(30, 30, 30, 0.95)',
        };
    }
  };
  
  return (
    <>
      {isActive && (
        <div
          className="tutorial-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Game Tutorial"
          aria-describedby="tutorial-description"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        >
          {/* Backdrop layer with spotlight cutout - only render if target found */}
          {spotlightConfig.targetRect && spotlightConfig.clipPath !== 'none' && (
            <div
              className="tutorial-backdrop"
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                clipPath: spotlightConfig.clipPath,
                pointerEvents: 'auto',
                zIndex: 9998,
              }}
            />
          )}
          
          {/* Spotlight border (animated pulse) */}
          {spotlightConfig.targetRect && (
            <motion.div
              key={`spotlight-${currentStep}`}
              className="tutorial-spotlight-border"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'fixed',
                left: spotlightConfig.targetRect.left - 8,
                top: spotlightConfig.targetRect.top - 8,
                width: spotlightConfig.targetRect.width + 16,
                height: spotlightConfig.targetRect.height + 16,
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                pointerEvents: 'none',
                zIndex: 9999,
              }}
            />
          )}
          
          {/* Tooltip balloon */}
          <motion.div
            key={currentStep}
            className="tutorial-tooltip"
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'absolute',
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              width: tooltipWidth,
              minHeight: tooltipHeight,
              background: 'rgba(30, 30, 30, 0.98)',
              borderRadius: '12px',
              padding: '16px',
              pointerEvents: 'auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              zIndex: 10001,
            }}
          >
            <div className="tutorial-content">
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '8px',
                }}
              >
                {t(`tutorial.step${currentStep}.title`)}
              </p>
              <p
                id="tutorial-description"
                style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.5,
                  marginBottom: '12px',
                }}
              >
                {t(`tutorial.step${currentStep}.description`)}
              </p>
              
              {/* Progress indicator */}
              <div
                className="tutorial-progress"
                style={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'center',
                  marginTop: '12px',
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i + 1 === currentStep ? '10px' : '6px',
                      height: i + 1 === currentStep ? '10px' : '6px',
                      borderRadius: '50%',
                      background:
                        i + 1 === currentStep
                          ? '#3b82f6' // Current step: blue
                          : i + 1 < currentStep
                          ? '#10b981' // Completed: green
                          : 'rgba(255, 255, 255, 0.2)', // Upcoming: gray
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Arrow pointer */}
            <div
              className="tutorial-arrow"
              style={getArrowStyle(tooltipPosition.arrowDirection)}
            />
          </motion.div>
          
          {/* Animated hand icon */}
          {stepConfig.showHandAnimation && stepConfig.handPath && (
            <motion.div
              key={`hand-${currentStep}`}
              className="tutorial-hand"
              variants={handAnimationVariants}
              initial="initial"
              animate="animate"
              custom={stepConfig.handPath}
              style={{
                position: 'absolute',
                fontSize: '32px',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
            >
              👆
            </motion.div>
          )}
          
          {/* Controls (skip button and step counter) */}
          <div
            className="tutorial-controls"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              pointerEvents: 'auto',
              zIndex: 10000, // Ensure controls are always on top
            }}
          >
            <span
              className="tutorial-counter"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {currentStep}/6
            </span>
            
            <button
              onClick={skip}
              className="tutorial-skip"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              aria-label="Tutorial'ı atla"
            >
              {t('tutorial.skip')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
