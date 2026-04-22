/**
 * Tutorial Overlay Component
 * 
 * Interactive tutorial for new players with premium animations
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorialStore } from '../store/tutorialStore';
import type { TutorialStep } from '../types';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: '👋 Hoş Geldin!',
    description: 'Hadi başlayalım! Aşağıdaki parçalardan birini sürükle ve tahtaya yerleştir',
    highlightTarget: '.piece-slot',
    arrowDirection: 'down',
    action: 'place',
    validation: () => true // Will be validated by event
  },
  {
    id: 1,
    title: '🎯 Harika İş!',
    description: 'Şimdi tam bir satır veya sütun doldur. Dolu satırlar otomatik temizlenir ve puan kazanırsın!',
    highlightTarget: '.game-board',
    arrowDirection: null,
    action: 'clear',
    validation: () => true // Will be validated by event
  },
  {
    id: 2,
    title: '🔥 Kombo Zamanı!',
    description: 'Mükemmel! Şimdi ardışık satır temizle ve kombo yap. Her kombo daha fazla puan getirir!',
    highlightTarget: '.combo-display',
    arrowDirection: 'down',
    action: 'combo',
    validation: () => true // Will be validated by event
  }
];

export const TutorialOverlay: React.FC = () => {
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
    addAchievement
  } = useTutorialStore();
  
  const [showSkip, setShowSkip] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [celebrationParticles, setCelebrationParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [spotlightPosition, setSpotlightPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [arrowPosition, setArrowPosition] = useState<{ x: number; y: number; direction: 'up' | 'down' | 'left' | 'right' } | null>(null);
  
  // DEBUG: Log state changes
  useEffect(() => {
    console.log('[TutorialOverlay] State:', { isActive, currentStep, gamesCompleted });
  }, [isActive, currentStep, gamesCompleted]);
  
  // Show skip button after 2 seconds for returning players (games > 0)
  useEffect(() => {
    if (isActive && gamesCompleted > 0) {
      const timer = setTimeout(() => setShowSkip(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive, gamesCompleted]);
  
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
        element.classList.add('tutorial-highlight');
        
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
        
        console.log('[TutorialOverlay] Element found and highlighted:', step.highlightTarget);
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(findElement, 200);
      } else {
        console.warn('[TutorialOverlay] Element not found after retries:', step.highlightTarget);
      }
    };
    
    findElement();
    
    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('tutorial-highlight');
      }
    };
  }, [isActive, currentStep]);
  
  // Handle step validation with achievements
  useEffect(() => {
    if (!isActive) return;
    
    // Check if tutorial is complete (all steps done)
    if (currentStep >= TUTORIAL_STEPS.length) {
      console.log('[TutorialOverlay] All steps completed, calling complete()');
      
      // Celebration particles on completion
      const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setCelebrationParticles(particles);
      
      setTimeout(() => {
        complete();
        setCelebrationParticles([]);
      }, 1500);
      return;
    }
    
    const step = TUTORIAL_STEPS[currentStep];
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
        console.log(`[TutorialOverlay] Step ${currentStep} validated (${step.action})`);
        
        // Check for perfect achievement (first attempt)
        if (firstAttempt && currentStep === 0) {
          addAchievement('perfect');
          setHint('🎯 Mükemmel Başlangıç!');
        }
        
        // Check for combo achievement
        if (expectedAction === 'combo' && event.detail.combo >= 3) {
          addAchievement('combo');
          setHint('🔥 Kombo Ustası!');
        }
        
        // Mini celebration on step completion
        const particles = Array.from({ length: 8 }, (_, i) => ({
          id: i,
          x: 50 + (Math.random() - 0.5) * 30,
          y: 20 + (Math.random() - 0.5) * 20
        }));
        setCelebrationParticles(particles);
        
        setTimeout(() => {
          nextStep();
          setCelebrationParticles([]);
          setHint(null);
        }, 600);
      } else {
        firstAttempt = false;
      }
    };
    
    window.addEventListener('tutorial-validation' as any, handleValidation as any);
    
    return () => {
      window.removeEventListener('tutorial-validation' as any, handleValidation as any);
    };
  }, [isActive, currentStep, nextStep, complete, addAchievement, setHint]);
  
  if (!isActive) {
    console.log('[TutorialOverlay] Not rendering - isActive is false');
    return null;
  }
  
  // Tutorial completed, hide overlay
  if (currentStep >= TUTORIAL_STEPS.length) {
    console.log('[TutorialOverlay] Not rendering - tutorial completed');
    return null;
  }
  
  console.log('[TutorialOverlay] Rendering tutorial card for step', currentStep);
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
            {achievement === 'speed' && '⚡ Hızlı Öğrenen'}
            {achievement === 'perfect' && '🎯 Mükemmel Başlangıç'}
            {achievement === 'combo' && '🔥 Kombo Ustası'}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Overlay backdrop */}
      <div className="tutorial-overlay">
        {/* Tutorial card */}
        <motion.div 
          className="tutorial-card"
          initial={{ scale: 0.8, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <div className="tutorial-header">
            <motion.h2
              key={currentStep}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {step.title}
            </motion.h2>
            <motion.span 
              className="tutorial-progress"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
            >
              {currentStep + 1} / {TUTORIAL_STEPS.length}
            </motion.span>
          </div>
          
          {/* Progress bar */}
          <div className="tutorial-progress-bar">
            <motion.div 
              className="tutorial-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          
          <motion.p 
            className="tutorial-description"
            key={`desc-${currentStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {step.description}
          </motion.p>
          
          {/* Interactive hand pointer for first step */}
          {currentStep === 0 && (
            <motion.div 
              className="tutorial-hand-pointer"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <motion.span 
                className="hand-emoji"
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, -10, 0, 10, 0]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                👆
              </motion.span>
              <motion.span 
                className="hand-text"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Sürükle ve bırak
              </motion.span>
            </motion.div>
          )}
          
          {/* Success checkmark for step 1 and 2 */}
          {currentStep > 0 && (
            <motion.div
              className="tutorial-success-icon"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              ✓
            </motion.div>
          )}
          
          {/* Arrow indicator */}
          {step.arrowDirection === 'down' && (
            <motion.div 
              className="tutorial-arrow"
              animate={{ 
                y: [0, 12, 0],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 1.2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          
          {/* Skip button for returning players */}
          {showSkip && (
            <motion.button
              className="tutorial-skip"
              onClick={skip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Atla
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
          top: 120px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10002;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.5);
          pointer-events: none;
        }
        
        /* Achievement Badges */
        .tutorial-achievement-badge {
          position: fixed;
          right: 20px;
          z-index: 10002;
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.5);
          pointer-events: none;
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
          padding-top: 15vh;
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
          border: 2px solid transparent;
          background-clip: padding-box;
          position: relative;
          border-radius: 12px;
          padding: 10px 12px;
          max-width: 240px;
          width: 80%;
          box-shadow: 
            0 0 0 1px rgba(148, 163, 184, 0.1),
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 100px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          pointer-events: auto;
          backdrop-filter: blur(20px) saturate(180%);
          overflow: visible;
        }
        
        .tutorial-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
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
          margin-bottom: 8px;
        }
        
        .tutorial-header h2 {
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 18px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
          text-shadow: 0 0 30px rgba(96, 165, 250, 0.5);
        }
        
        .tutorial-progress {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%);
          color: #93c5fd;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        
        .tutorial-progress-bar {
          width: 100%;
          height: 3px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
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
          gap: 4px;
          margin: 8px 0;
        }
        
        .hand-emoji {
          font-size: 28px;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }
        
        .hand-text {
          color: #60a5fa;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .tutorial-success-icon {
          position: absolute;
          top: -12px;
          right: -12px;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: white;
          font-weight: bold;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
          border: 3px solid rgba(255, 255, 255, 0.2);
        }
        
        .tutorial-description {
          color: #e2e8f0;
          font-size: 11px;
          line-height: 1.3;
          margin: 0 0 8px 0;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .tutorial-skip {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
          border: 1px solid rgba(148, 163, 184, 0.3);
          color: #cbd5e1;
          padding: 5px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 10px solid #60a5fa;
          margin: 8px auto 0;
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
        
        /* Particle effects */
        .tutorial-card::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          animation: tutorial-particle-rotate 20s linear infinite;
          pointer-events: none;
        }
        
        @keyframes tutorial-particle-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};
