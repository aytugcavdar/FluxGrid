/**
 * Tutorial Overlay Component
 * 
 * Interactive tutorial for new players with premium animations
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GameMode } from '@shared/types';
import { useTutorialStore } from '../store/tutorialStore';
import { useGameStore } from '../../game/store/gameStore';
import { getTutorialGridState, getTutorialGuidance, getTutorialPieces } from '../data/tutorialPieces';
import type { TutorialStep } from '../types';

export const TutorialOverlay: React.FC = () => {
  const { t } = useTranslation();
  const {
    isActive,
    currentStep,
    nextStep,
    skip,
    complete,
    gamesCompleted,
    currentHint,
    achievements,
    setHint,
    addAchievement,
    trackStepStart,
    trackStepComplete,
    trackInteraction
  } = useTutorialStore();
  const gameMode = useGameStore(state => state.gameMode);
  const isTimedMode = gameMode === GameMode.TIMED;
  
  // Define tutorial steps with i18n
  const TUTORIAL_STEPS: TutorialStep[] = [
    {
      id: 0,
      title: t('tutorial.drag.title'),
      description: t('tutorial.drag.description'),
      highlightTarget: '.piece-slot',
      arrowDirection: 'down',
      action: 'place',
      validation: () => true
    },
    {
      id: 1,
      title: t('tutorial.firstClear.title'),
      description: t('tutorial.firstClear.description'),
      highlightTarget: '.game-board',
      arrowDirection: null,
      action: 'clear',
      validation: () => true
    },
    {
      id: 2,
      title: t('tutorial.combo.title'),
      description: t('tutorial.combo.description'),
      highlightTarget: '.game-board',
      arrowDirection: null,
      action: 'combo',
      validation: () => true
    },
    {
      id: 3,
      title: isTimedMode ? t('tutorial.ready.timedTitle') : t('tutorial.ready.endlessTitle'),
      description: isTimedMode ? t('tutorial.ready.timedDescription') : t('tutorial.ready.endlessDescription'),
      highlightTarget: null,
      arrowDirection: null,
      action: 'complete',
      validation: () => true
    }
  ];
  
  const [showSkip, setShowSkip] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [celebrationParticles, setCelebrationParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [spotlightPosition, setSpotlightPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [arrowPosition, setArrowPosition] = useState<{ x: number; y: number; direction: 'up' | 'down' | 'left' | 'right' } | null>(null);
  const [contextualHint, setContextualHint] = useState<string | null>(null);
  const [idleTime, setIdleTime] = useState(0);
  const [tutorialGridBounds, setTutorialGridBounds] = useState<DOMRect | null>(null);
  const guidance = React.useMemo(() => getTutorialGuidance(currentStep), [currentStep]);

  const applyTutorialSetup = React.useCallback((stepId: number) => {
    const tutorialPieces = getTutorialPieces(stepId);
    const tutorialGrid = getTutorialGridState(stepId);

    if (tutorialPieces.length === 0 && !tutorialGrid) return;

    useGameStore.setState({
      ...(tutorialGrid ? { grid: tutorialGrid } : {}),
      ...(tutorialPieces.length > 0 ? { pieces: tutorialPieces } : {}),
      draggedPiece: null,
    });
  }, []);
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Performance optimization: treat Honor 9X-class 4GB devices as constrained.
  const isLowEndDevice = React.useMemo(() => {
    const memory = (navigator as any).deviceMemory;
    if (memory && memory <= 4) return true;
    
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return true;
    
    return false;
  }, []);
  const reducedTutorialMotion = prefersReducedMotion || isLowEndDevice;
  
  // Track step start time for analytics
  useEffect(() => {
    if (isActive && currentStep < TUTORIAL_STEPS.length) {
      trackStepStart(currentStep);
    }
  }, [isActive, currentStep, trackStepStart]);
  
  // Show skip button after 2 seconds for returning players (games > 0)
  useEffect(() => {
    if (isActive && gamesCompleted > 0) {
      const timer = setTimeout(() => setShowSkip(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive, gamesCompleted]);
  
  // Contextual hints based on idle time
  useEffect(() => {
    if (!isActive || currentStep >= TUTORIAL_STEPS.length) return;
    
    const step = TUTORIAL_STEPS[currentStep];
    
    // Only show hints for action steps (not info/complete)
    if (step.action === 'info' || step.action === 'complete') return;
    
    // Reset idle time on step change
    setIdleTime(0);
    setContextualHint(null);
    
    const idleTimer = setInterval(() => {
      setIdleTime(prev => {
        const newTime = prev + 1;
        
        // Show contextual hint after 6 seconds of inactivity. First-run guidance
        // should stay inside the first few seconds on mobile.
        if (newTime === 6) {
          const hints: Record<string, string> = {
            'place': t('tutorial.hints.tryDragging') || 'Try dragging a piece to the board',
            'clear': t('tutorial.hints.fillLine') || 'Fill a complete row or column',
            'combo': t('tutorial.hints.keepClearing') || 'Keep clearing lines quickly'
          };
          setContextualHint(hints[step.action] || null);
          trackInteraction('contextual_hint_shown');
        }
        
        // Clear hint after 5 seconds
        if (newTime === 11) {
          setContextualHint(null);
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(idleTimer);
  }, [isActive, currentStep, t, trackInteraction]);
  
  // Highlight target element and setup spotlight
  useEffect(() => {
    if (!isActive || currentStep >= TUTORIAL_STEPS.length) return;
    
    const step = TUTORIAL_STEPS[currentStep];
    if (!step.highlightTarget) {
      setHighlightedElement(null);
      setSpotlightPosition(null);
      setArrowPosition(null);
      return;
    }
    
    // Try to find element with retry logic
    let retryCount = 0;
    const maxRetries = 10;
    
    const findElement = () => {
      const element = document.querySelector(step.highlightTarget!) as HTMLElement;
      
      if (element) {
        setHighlightedElement(element);
        if (!reducedTutorialMotion) {
          element.classList.add('tutorial-highlight');
        }
        
        // Calculate spotlight position
        const rect = element.getBoundingClientRect();
        setSpotlightPosition({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
        
        // Calculate arrow position
        const arrowOffset = 60;
        if (step.arrowDirection === 'down') {
          setArrowPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - arrowOffset,
            direction: 'down'
          });
        }
        
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(findElement, 200);
      } else {
        if (import.meta.env.DEV) {
          console.warn('[TutorialOverlay] Element not found after retries:', step.highlightTarget);
        }
      }
    };
    
    findElement();
    
    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('tutorial-highlight');
      }
    };
  }, [isActive, currentStep, reducedTutorialMotion]);

  useEffect(() => {
    if (!isActive) {
      setTutorialGridBounds(null);
      return;
    }

    const hasCellGuidance = Boolean(guidance.targetLines?.length || guidance.fallingCells?.length);
    if (!hasCellGuidance) {
      setTutorialGridBounds(null);
      return;
    }

    let rafId = 0;
    const updateGridBounds = () => {
      const gridElement = document.querySelector('[data-grid-container]') as HTMLElement | null;
      setTutorialGridBounds(gridElement ? gridElement.getBoundingClientRect() : null);
    };

    rafId = window.requestAnimationFrame(updateGridBounds);
    window.addEventListener('resize', updateGridBounds);
    window.addEventListener('orientationchange', updateGridBounds);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateGridBounds);
      window.removeEventListener('orientationchange', updateGridBounds);
    };
  }, [isActive, guidance.targetLines, guidance.fallingCells]);
  
  // Handle step validation with achievements
  useEffect(() => {
    if (!isActive) return;
    
    // Check if tutorial is complete (all steps done)
    if (currentStep >= TUTORIAL_STEPS.length) {
      if (!isLowEndDevice) {
        const particles = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100
        }));
        setCelebrationParticles(particles);
      }
      
      setTimeout(() => {
        complete();
        setCelebrationParticles([]);
      }, isLowEndDevice ? 120 : 1500);
      return;
    }
    
    const step = TUTORIAL_STEPS[currentStep];
    
    // Auto-advance for informational and final steps
    if (step.action === 'info' || step.action === 'complete') {
      const timer = setTimeout(() => {
        if (step.action === 'complete') {
          // Final step - complete tutorial
          complete();
        } else {
          // Info step - auto advance
          nextStep();
        }
      }, step.action === 'complete' ? 2600 : 3200);
      
      return () => clearTimeout(timer);
    }
    
    let firstAttempt = true;
    
    // Set up validation listeners
    const handleValidation = (event: CustomEvent) => {
      const validationMap: Record<string, string> = {
        'piece_placed': 'place',
        'line_cleared': 'clear',
        'combo_achieved': 'combo'
      };
      
      const expectedAction = validationMap[event.detail.type];
      if (expectedAction === step.action) {
        // Check for perfect achievement (first attempt)
        if (firstAttempt && currentStep === 0) {
          addAchievement('perfect');
          setHint(t('tutorial.hints.perfectStart'));
        }
        
        if (!isLowEndDevice) {
          const particles = Array.from({ length: 8 }, (_, i) => ({
            id: i,
            x: 50 + (Math.random() - 0.5) * 30,
            y: 20 + (Math.random() - 0.5) * 20
          }));
          setCelebrationParticles(particles);
        }
        
        setTimeout(() => {
          applyTutorialSetup(currentStep + 1);
          nextStep();
          setCelebrationParticles([]);
          const timedRewardHint = currentStep === 1 && isTimedMode
            ? t('tutorial.hints.timeReward')
            : null;
          setHint(timedRewardHint);
          if (timedRewardHint) {
            window.setTimeout(() => setHint(null), 1700);
          }
          trackStepComplete(currentStep);
        }, isLowEndDevice ? 120 : 600);
      } else {
        firstAttempt = false;
      }
    };
    
    window.addEventListener('tutorial-validation' as any, handleValidation as any);
    
    return () => {
      window.removeEventListener('tutorial-validation' as any, handleValidation as any);
    };
  }, [isActive, currentStep, nextStep, complete, addAchievement, setHint, applyTutorialSetup, isTimedMode, t]);
  
  if (!isActive) {
    return null;
  }
  
  // Tutorial completed, hide overlay
  if (currentStep >= TUTORIAL_STEPS.length) {
    return null;
  }
  
  const step = TUTORIAL_STEPS[currentStep];
  
  return (
    <>
      {/* Spotlight Overlay - Removed for cleaner look */}
      
      {/* Hint Toast */}
      <AnimatePresence>
        {currentHint && (
          <motion.div
            className="tutorial-hint-toast"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {currentHint}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Contextual Hint Toast */}
      <AnimatePresence>
        {contextualHint && (
          <motion.div
            className="tutorial-contextual-hint"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {contextualHint}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tutorial board cell guidance */}
      <AnimatePresence>
        {tutorialGridBounds && (guidance.targetLines?.length || guidance.fallingCells?.length) && (
          <div className="tutorial-board-guidance" aria-hidden="true">
            {guidance.targetLines?.map((line) => {
              const cellSize = tutorialGridBounds.width / 10;
              const isRow = line.type === 'row';
              return (
                <motion.div
                  key={`line-${line.type}-${line.index}`}
                  className={`tutorial-target-line tutorial-target-line-${line.type}`}
                  initial={reducedTutorialMotion ? { opacity: 0 } : { opacity: 0 }}
                  animate={reducedTutorialMotion ? { opacity: 0.55 } : { opacity: [0.26, 0.56, 0.32] }}
                  exit={{ opacity: 0 }}
                  transition={reducedTutorialMotion ? { duration: 0.08 } : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    left: tutorialGridBounds.left + (isRow ? 0 : line.index * cellSize + cellSize * 0.5 - 1),
                    top: tutorialGridBounds.top + (isRow ? line.index * cellSize + cellSize * 0.5 - 1 : 0),
                    width: isRow ? tutorialGridBounds.width : 2,
                    height: isRow ? 2 : tutorialGridBounds.height,
                  }}
                />
              );
            })}
            {guidance.fallingCells?.map((cell) => {
              const cellSize = tutorialGridBounds.width / 10;
              return (
                <motion.div
                  key={`fall-${cell.x}-${cell.y}`}
                  className="tutorial-falling-cell"
                  initial={{ opacity: 0 }}
                  animate={reducedTutorialMotion ? { opacity: 0.75 } : { opacity: [0.38, 0.85, 0.38], y: [0, cellSize * 0.32, 0] }}
                  exit={{ opacity: 0 }}
                  transition={reducedTutorialMotion ? { duration: 0.08 } : { duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    left: tutorialGridBounds.left + cell.x * cellSize + cellSize * 0.2,
                    top: tutorialGridBounds.top + cell.y * cellSize + cellSize * 0.12,
                    width: cellSize * 0.6,
                    height: cellSize * 0.72,
                  }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Achievement Badges */}
      <AnimatePresence>
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement}
            className="tutorial-achievement-badge"
            style={{ top: `${80 + index * 60}px` }}
            initial={{ opacity: 0, x: 100, scale: 0.5 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.5 }}
            transition={{ type: "spring", damping: 15 }}
          >
            {t(`tutorial.achievements.${achievement}`)}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Overlay backdrop */}
      <div 
        className={`tutorial-overlay${reducedTutorialMotion ? ' tutorial-low-motion' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-description"
      >
        {/* Tutorial card */}
        <motion.div 
          className="tutorial-card"
          initial={reducedTutorialMotion ? false : { scale: 0.8, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={reducedTutorialMotion ? undefined : { scale: 0.8, opacity: 0, y: 50 }}
          transition={reducedTutorialMotion ? { duration: 0.08 } : { type: "spring", damping: 20, stiffness: 300 }}
          role="document"
        >
          <div className="tutorial-header">
            <motion.h2
              id="tutorial-title"
              key={currentStep}
              initial={reducedTutorialMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reducedTutorialMotion ? { duration: 0.08 } : { delay: 0.2 }}
            >
              {step.title}
            </motion.h2>
            <motion.span 
              className="tutorial-progress"
              initial={reducedTutorialMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={reducedTutorialMotion ? { duration: 0.08 } : { type: "spring", delay: 0.3 }}
              aria-label={t('tutorial.progress', { current: currentStep + 1, total: TUTORIAL_STEPS.length })}
            >
              {t('tutorial.progress', { current: currentStep + 1, total: TUTORIAL_STEPS.length })}
            </motion.span>
          </div>
          
          {/* Progress bar */}
          <div 
            className="tutorial-progress-bar"
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={TUTORIAL_STEPS.length}
            aria-label={t('tutorial.progress', { current: currentStep + 1, total: TUTORIAL_STEPS.length })}
          >
            <motion.div 
              className="tutorial-progress-fill"
              initial={reducedTutorialMotion ? false : { width: 0 }}
              animate={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
              transition={reducedTutorialMotion ? { duration: 0.08 } : { duration: 0.6, ease: "easeOut" }}
            />
          </div>
          
          <motion.p 
            id="tutorial-description"
            className="tutorial-description"
            key={`desc-${currentStep}`}
            initial={reducedTutorialMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedTutorialMotion ? { duration: 0.08 } : { delay: 0.3 }}
          >
            {step.description}
          </motion.p>
          
          {/* Interactive hand pointer for first step */}
          {currentStep === 0 && (
            <motion.div 
              className="tutorial-hand-pointer"
              initial={reducedTutorialMotion ? false : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reducedTutorialMotion ? { duration: 0.08 } : { delay: 0.5, type: "spring" }}
              aria-hidden="true"
            >
              <motion.span 
                className="hand-emoji"
                animate={reducedTutorialMotion ? {} : { 
                  y: [0, -15, 0],
                  rotate: [0, -10, 0, 10, 0]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ^
              </motion.span>
              <motion.span 
                className="hand-text"
                animate={reducedTutorialMotion ? {} : { opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {t('tutorial.handPointer')}
              </motion.span>
            </motion.div>
          )}
          
          {/* Info step icons */}
          {step.action === 'info' && (
            <motion.div
              className="tutorial-info-icon"
              initial={reducedTutorialMotion ? false : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={reducedTutorialMotion ? { duration: 0.08 } : { type: "spring", damping: 15 }}
            >
              {currentStep === 3 && '⏱'}
              {currentStep === 4 && '⏰'}
            </motion.div>
          )}
          
          {/* Complete step icon */}
          {step.action === 'complete' && (
            <motion.div
              className="tutorial-complete-icon"
              initial={reducedTutorialMotion ? false : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={reducedTutorialMotion ? { duration: 0.08 } : { type: "spring", damping: 15 }}
            >
              ✓
            </motion.div>
          )}
          
          {/* Auto-advance indicator for info steps */}
          {(step.action === 'info' || step.action === 'complete') && (
            <motion.div
              className="tutorial-auto-advance"
              initial={reducedTutorialMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reducedTutorialMotion ? { duration: 0.08 } : { delay: 0.5 }}
            >
              <motion.div
                className="tutorial-auto-advance-bar"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: reducedTutorialMotion ? 0.1 : 4, ease: 'linear' }}
              />
              <span className="tutorial-auto-advance-text">
                {step.action === 'complete' ? t('tutorial.autoAdvance.completing') : t('tutorial.autoAdvance.continuing')}
              </span>
            </motion.div>
          )}
          
          {/* Success checkmark for step 1 and 2 */}
          {currentStep > 0 && (
            <motion.div
              className="tutorial-success-icon"
              initial={reducedTutorialMotion ? false : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={reducedTutorialMotion ? { duration: 0.08 } : { type: "spring", damping: 15 }}
              aria-label={t('tutorial.hints.perfectStart')}
            >
              ✓
            </motion.div>
          )}
          
          {/* Arrow indicator */}
          {step.arrowDirection === 'down' && (
            <motion.div 
              className="tutorial-arrow"
              animate={reducedTutorialMotion ? {} : { 
                y: [0, 12, 0],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 1.2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              aria-hidden="true"
            />
          )}
          
          {/* Skip button for returning players */}
          {showSkip && (
            <motion.button
              className="tutorial-skip"
              onClick={() => {
                trackInteraction('skip_clicked');
                skip();
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t('tutorial.skipButton')}
            >
              {t('tutorial.skip')}
            </motion.button>
          )}
          
          {/* Celebration particles */}
          <AnimatePresence>
            {celebrationParticles.map(particle => (
              <motion.div
                key={particle.id}
                className="celebration-particle"
                initial={{ 
                  x: `${particle.x}%`, 
                  y: `${particle.y}%`,
                  scale: 0,
                  opacity: 1
                }}
                animate={{ 
                  y: `${particle.y - 50}%`,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  position: 'absolute',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: `hsl(${particle.id * 30}, 80%, 60%)`,
                  pointerEvents: 'none'
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      
      <style>{`
        /* Hint Toast */
        .tutorial-hint-toast {
          position: fixed;
          top: clamp(80px, 15vh, 120px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 10002;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: clamp(10px, 2vw, 12px) clamp(16px, 4vw, 24px);
          border-radius: 12px;
          font-size: clamp(13px, 3.5vw, 16px);
          font-weight: 700;
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.5);
          pointer-events: none;
          max-width: 90vw;
          text-align: center;
        }
        
        /* Contextual Hint Toast */
        .tutorial-contextual-hint {
          position: fixed;
          bottom: clamp(100px, 20vh, 140px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 10002;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: clamp(10px, 2vw, 12px) clamp(16px, 4vw, 24px);
          border-radius: 16px;
          font-size: clamp(12px, 3vw, 14px);
          font-weight: 600;
          box-shadow: 0 8px 32px rgba(245, 158, 11, 0.5);
          pointer-events: none;
          max-width: 85vw;
          text-align: center;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        /* Achievement Badges */
        .tutorial-achievement-badge {
          position: fixed;
          right: clamp(12px, 3vw, 20px);
          z-index: 10002;
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          color: white;
          padding: clamp(8px, 2vw, 10px) clamp(14px, 3.5vw, 20px);
          border-radius: 12px;
          font-size: clamp(12px, 3vw, 14px);
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.5);
          pointer-events: none;
          max-width: 45vw;
          word-wrap: break-word;
        }

        .tutorial-board-guidance {
          position: fixed;
          inset: 0;
          z-index: 9998;
          pointer-events: none;
        }

        .tutorial-target-line {
          position: fixed;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(147, 197, 253, 0.24) 12%,
            rgba(219, 234, 254, 0.7) 76%,
            transparent 100%
          );
          box-shadow: 0 0 10px rgba(147, 197, 253, 0.22);
        }

        .tutorial-target-line-column {
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(147, 197, 253, 0.24) 12%,
            rgba(219, 234, 254, 0.7) 76%,
            transparent 100%
          );
        }

        .tutorial-falling-cell {
          position: fixed;
        }

        .tutorial-falling-cell::before,
        .tutorial-falling-cell::after {
          content: '';
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .tutorial-falling-cell::before {
          top: 0;
          width: 2px;
          height: 68%;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(96, 165, 250, 0.1), rgba(96, 165, 250, 0.86));
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.35);
        }

        .tutorial-falling-cell::after {
          bottom: 0;
          width: 9px;
          height: 9px;
          border-right: 2px solid rgba(147, 197, 253, 0.9);
          border-bottom: 2px solid rgba(147, 197, 253, 0.9);
          transform: translateX(-50%) rotate(45deg);
          filter: drop-shadow(0 0 6px rgba(96, 165, 250, 0.5));
        }
        
        .tutorial-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: clamp(86px, 12vh, 140px);
          padding-left: clamp(12px, 3vw, 20px);
          padding-right: clamp(12px, 3vw, 20px);
          z-index: 9999;
          pointer-events: none;
          animation: tutorial-fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes tutorial-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .tutorial-card {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.98) 0%, 
            rgba(30, 41, 59, 0.98) 50%,
            rgba(15, 23, 42, 0.98) 100%);
          border: 1px solid rgba(96, 165, 250, 0.28);
          background-clip: padding-box;
          position: relative;
          border-radius: clamp(12px, 2.5vw, 16px);
          padding: clamp(10px, 2.5vw, 16px) clamp(12px, 3vw, 18px);
          max-width: min(92vw, 340px);
          width: 100%;
          box-shadow: 
            0 0 0 1px rgba(148, 163, 184, 0.1),
            0 14px 38px rgba(0, 0, 0, 0.42),
            0 0 42px rgba(59, 130, 246, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          pointer-events: auto;
          backdrop-filter: blur(20px) saturate(180%);
          overflow: hidden;
        }
        
        /* Mobile optimizations */
        @media (max-width: 375px) {
          .tutorial-card {
            max-width: 95vw;
            padding: 12px 16px;
            border-radius: 14px;
          }
          
          .tutorial-overlay {
            padding-top: 12vh;
          }
        }
        
        /* Landscape mobile */
        @media (max-height: 500px) and (orientation: landscape) {
          .tutorial-overlay {
            padding-top: 5vh;
            align-items: center;
          }
          
          .tutorial-card {
            max-width: min(60vw, 400px);
          }
        }
        
        .tutorial-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: clamp(12px, 2.5vw, 16px);
          padding: 2px;
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.6) 0%, 
            rgba(147, 51, 234, 0.6) 50%,
            rgba(59, 130, 246, 0.6) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: tutorial-border-glow 3s ease-in-out infinite;
          pointer-events: none;
          opacity: 0.55;
        }
        
        @keyframes tutorial-border-glow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        
        .tutorial-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: clamp(8px, 2vw, 12px);
          gap: clamp(8px, 2vw, 12px);
        }
        
        .tutorial-header h2 {
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: clamp(15px, 3.7vw, 18px);
          font-weight: 800;
          margin: 0;
          letter-spacing: 0;
          text-shadow: 0 0 30px rgba(96, 165, 250, 0.5);
          flex: 1;
          min-width: 0;
        }
        
        .tutorial-progress {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%);
          color: #93c5fd;
          font-size: clamp(9px, 2.2vw, 11px);
          font-weight: 700;
          padding: clamp(3px, 1vw, 4px) clamp(6px, 1.5vw, 10px);
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .tutorial-progress-bar {
          width: 100%;
          height: clamp(2px, 0.5vw, 3px);
          background: rgba(59, 130, 246, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: clamp(8px, 2vw, 12px);
        }
        
        .tutorial-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%);
          border-radius: 3px;
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
        }
        
        .tutorial-hand-pointer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(4px, 1vw, 6px);
          margin: clamp(8px, 2vw, 12px) 0;
        }
        
        .hand-emoji {
          font-size: clamp(24px, 6vw, 32px);
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }
        
        .hand-text {
          color: #60a5fa;
          font-size: clamp(9px, 2.2vw, 11px);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .tutorial-success-icon {
          position: absolute;
          top: clamp(-10px, -2vw, -12px);
          right: clamp(-10px, -2vw, -12px);
          width: clamp(32px, 8vw, 44px);
          height: clamp(32px, 8vw, 44px);
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(18px, 4.5vw, 24px);
          color: white;
          font-weight: bold;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
          border: 3px solid rgba(255, 255, 255, 0.2);
        }
        
        .tutorial-info-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(40px, 10vw, 56px);
          margin: clamp(12px, 3vw, 16px) 0;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
        }
        
        .tutorial-complete-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(48px, 12vw, 64px);
          margin: clamp(12px, 3vw, 16px) 0;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
          animation: tutorial-bounce 1s ease-in-out infinite;
        }
        
        @keyframes tutorial-bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
        }
        
        .tutorial-description {
          color: #e2e8f0;
          font-size: clamp(12px, 3vw, 13px);
          line-height: 1.42;
          margin: 0 0 clamp(8px, 2vw, 12px) 0;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .tutorial-skip {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
          border: 1px solid rgba(148, 163, 184, 0.3);
          color: #cbd5e1;
          padding: clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px);
          border-radius: 8px;
          cursor: pointer;
          font-size: clamp(11px, 2.5vw, 13px);
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          width: 100%;
          margin-top: clamp(4px, 1vw, 8px);
        }
        
        .tutorial-skip:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%);
          border-color: rgba(59, 130, 246, 0.5);
          color: #60a5fa;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
        }
        
        .tutorial-skip:active {
          transform: translateY(0);
        }
        
        .tutorial-arrow {
          width: 0;
          height: 0;
          border-left: clamp(8px, 2vw, 10px) solid transparent;
          border-right: clamp(8px, 2vw, 10px) solid transparent;
          border-top: clamp(8px, 2vw, 10px) solid #60a5fa;
          margin: clamp(6px, 1.5vw, 8px) auto 0;
          filter: drop-shadow(0 4px 8px rgba(96, 165, 250, 0.5));
        }
        
        .tutorial-highlight {
          position: relative;
          z-index: 10000;
          box-shadow: 
            0 0 0 4px rgba(59, 130, 246, 0.8),
            0 0 0 8px rgba(59, 130, 246, 0.4),
            0 0 40px rgba(59, 130, 246, 0.6);
          border-radius: 12px;
          animation: tutorial-pulse 2s ease-in-out infinite;
        }
        
        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 
              0 0 0 4px rgba(59, 130, 246, 0.8),
              0 0 0 8px rgba(59, 130, 246, 0.4),
              0 0 40px rgba(59, 130, 246, 0.6);
            transform: scale(1);
          }
          50% {
            box-shadow: 
              0 0 0 6px rgba(59, 130, 246, 1),
              0 0 0 12px rgba(59, 130, 246, 0.6),
              0 0 60px rgba(59, 130, 246, 0.8);
            transform: scale(1.02);
          }
        }
        
        .celebration-particle {
          position: absolute;
          pointer-events: none;
          z-index: 10;
        }
        
        /* Auto-advance indicator */
        .tutorial-auto-advance {
          margin-top: clamp(12px, 3vw, 16px);
          display: flex;
          flex-direction: column;
          gap: clamp(6px, 1.5vw, 8px);
          align-items: center;
        }
        
        .tutorial-auto-advance-bar {
          width: 100%;
          height: clamp(2px, 0.5vw, 3px);
          background: linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%);
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
        }
        
        .tutorial-auto-advance-text {
          color: #93c5fd;
          font-size: clamp(10px, 2.5vw, 12px);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }
        
        /* Particle effects */
        .tutorial-card::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.055) 0%, transparent 70%);
          animation: tutorial-particle-rotate 24s linear infinite;
          pointer-events: none;
        }

        .tutorial-overlay.tutorial-low-motion {
          animation: none;
          background: rgba(2, 6, 23, 0.18);
        }

        .tutorial-low-motion .tutorial-card {
          background: rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(96, 165, 250, 0.32);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.42);
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }

        .tutorial-low-motion .tutorial-card::before,
        .tutorial-low-motion .tutorial-card::after {
          display: none;
          animation: none;
        }

        .tutorial-low-motion .tutorial-header h2 {
          background: none;
          -webkit-text-fill-color: #bfdbfe;
          color: #bfdbfe;
          text-shadow: none;
        }

        .tutorial-low-motion .tutorial-progress,
        .tutorial-low-motion .tutorial-progress-fill,
        .tutorial-low-motion .tutorial-auto-advance-bar,
        .tutorial-low-motion .tutorial-success-icon,
        .tutorial-low-motion .tutorial-skip,
        .tutorial-low-motion .tutorial-hint-toast,
        .tutorial-low-motion .tutorial-contextual-hint,
        .tutorial-low-motion .tutorial-achievement-badge {
          box-shadow: none;
        }

        .tutorial-low-motion .tutorial-info-icon,
        .tutorial-low-motion .tutorial-complete-icon,
        .tutorial-low-motion .tutorial-arrow,
        .tutorial-low-motion .hand-emoji {
          filter: none;
          animation: none;
        }
        
        @keyframes tutorial-particle-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Reduced motion support for auto-advance */
        @media (prefers-reduced-motion: reduce) {
          .tutorial-auto-advance-bar {
            animation: none;
            transition: width 4s linear;
          }
          
          .tutorial-card::before {
            animation: none;
          }
          
          .tutorial-card::after {
            animation: none;
          }
          
          .tutorial-complete-icon {
            animation: none;
          }
        }
        
        /* Performance optimization for low-end devices */
        @media (max-width: 768px) and (max-height: 1024px) {
          .tutorial-card::after {
            display: none; /* Disable particle rotation on mobile */
          }
        }
      `}</style>
    </>
  );
};
