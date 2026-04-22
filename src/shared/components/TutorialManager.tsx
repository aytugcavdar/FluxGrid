import React, { useEffect, useRef, useState } from 'react';
import { useTutorialStore } from '../store/tutorialStore';
import { useGameStore } from '@features/game/store/gameStore';
import { TutorialTooltip } from './TutorialTooltip';
import { TutorialHighlight } from './TutorialHighlight';
import { TutorialConfetti } from './TutorialConfetti';

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_SELECTORS: Record<number, string | null> = {
  1: '[data-piece-slot="0"]',     // İlk piece slot
  2: 'canvas',                    // 3D grid canvas
  3: null,                        // No highlight (flux removed)
  4: null,                        // Highlight yok, sadece confetti
};

// ============================================================================
// COMPONENT
// ============================================================================

export const TutorialManager: React.FC = React.memo(() => {
  const { isActive, currentStep, nextStep, skip, complete } = useTutorialStore();
  const { lastAction } = useGameStore();
  
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Track previous lastAction to detect changes
  const prevLastActionRef = useRef(lastAction);
  
  // Timer refs for cleanup
  const step3TimerRef = useRef<number | null>(null);
  const step4TimerRef = useRef<number | null>(null);
  
  // Step 1 -> 2: Detect piece placement
  useEffect(() => {
    if (!isActive || currentStep !== 1) return;
    
    // Check if lastAction changed AND type is PLACE
    if (
      lastAction &&
      lastAction !== prevLastActionRef.current &&
      lastAction.type === 'PLACE'
    ) {
      console.log('[TutorialManager] Step 1 complete: piece placed');
      nextStep();
    }
    
    prevLastActionRef.current = lastAction;
  }, [isActive, currentStep, lastAction, nextStep]);
  
  // Step 2 -> 3: Detect line clear
  useEffect(() => {
    if (!isActive || currentStep !== 2) return;
    
    // Check if lastAction changed AND type is CLEAR
    if (
      lastAction &&
      lastAction !== prevLastActionRef.current &&
      lastAction.type === 'CLEAR'
    ) {
      console.log('[TutorialManager] Step 2 complete: line cleared');
      nextStep();
    }
    
    prevLastActionRef.current = lastAction;
  }, [isActive, currentStep, lastAction, nextStep]);
  
  // Step 3 -> 4: Auto-advance after 4 seconds
  useEffect(() => {
    if (!isActive || currentStep !== 3) {
      // Clear timer if step changed
      if (step3TimerRef.current) {
        clearTimeout(step3TimerRef.current);
        step3TimerRef.current = null;
      }
      return;
    }
    
    console.log('[TutorialManager] Step 3 active, auto-advancing in 4 seconds');
    step3TimerRef.current = window.setTimeout(() => {
      console.log('[TutorialManager] Step 3 complete: auto-advance');
      nextStep();
    }, 4000);
    
    return () => {
      if (step3TimerRef.current) {
        clearTimeout(step3TimerRef.current);
        step3TimerRef.current = null;
      }
    };
  }, [isActive, currentStep, nextStep]);
  
  // Step 4 -> Complete: Show confetti and complete after 2 seconds
  useEffect(() => {
    if (!isActive || currentStep !== 4) {
      // Clear timer if step changed
      if (step4TimerRef.current) {
        clearTimeout(step4TimerRef.current);
        step4TimerRef.current = null;
      }
      setShowConfetti(false);
      return;
    }
    
    console.log('[TutorialManager] Step 4 active, showing confetti');
    setShowConfetti(true);
    
    step4TimerRef.current = window.setTimeout(() => {
      console.log('[TutorialManager] Step 4 complete: tutorial finished');
      complete();
    }, 2000);
    
    return () => {
      if (step4TimerRef.current) {
        clearTimeout(step4TimerRef.current);
        step4TimerRef.current = null;
      }
    };
  }, [isActive, currentStep, complete]);
  
  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (step3TimerRef.current) {
        clearTimeout(step3TimerRef.current);
      }
      if (step4TimerRef.current) {
        clearTimeout(step4TimerRef.current);
      }
    };
  }, []);
  
  // Don't render if tutorial not active
  if (!isActive) {
    return null;
  }
  
  return (
    <>
      {/* Highlight ring */}
      <TutorialHighlight
        targetSelector={STEP_SELECTORS[currentStep]}
        isActive={isActive}
      />
      
      {/* Tooltip */}
      <TutorialTooltip
        step={currentStep}
        isActive={isActive}
        onSkip={skip}
      />
      
      {/* Step 4 confetti */}
      {showConfetti && <TutorialConfetti />}
      
      {/* Karartma overlay — sadece step 1'de, çok hafif */}
      {currentStep === 1 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            zIndex: 9998,
          }}
        />
      )}
    </>
  );
});
