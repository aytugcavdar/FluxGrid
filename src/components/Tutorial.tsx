/**
 * Tutorial Component
 * 
 * Onboarding tutorial system for first-time users.
 * Provides step-by-step guidance through game mechanics, controls, and special abilities.
 * 
 * Requirements: 8.1
 * 
 * Features:
 * - Step-by-step tutorial flow with highlights and tooltips
 * - Automatic display on first app launch
 * - Tutorial completion status stored in localStorage
 * - Skip functionality
 * - Replay capability from settings
 * 
 * Usage:
 * ```tsx
 * import { Tutorial } from '@/components/Tutorial';
 * 
 * // In your app component
 * <Tutorial />
 * 
 * // To manually start tutorial
 * import { useTutorialStore } from '@/shared/store/tutorialStore';
 * const { start } = useTutorialStore();
 * start();
 * 
 * // To check if tutorial should be shown
 * const { shouldShow } = useTutorialStore();
 * if (shouldShow()) {
 *   // Show tutorial
 * }
 * 
 * // To reset tutorial (for testing)
 * const { reset } = useTutorialStore();
 * reset();
 * ```
 */

import React, { useEffect } from 'react';
import { TutorialManager } from '../shared/components/TutorialManager';
import { useTutorialStore } from '../shared/store/tutorialStore';

// ============================================================================
// TYPES
// ============================================================================

export interface TutorialProps {
  /**
   * Whether to automatically start the tutorial on first launch.
   * Default: true
   */
  autoStart?: boolean;
  
  /**
   * Delay in milliseconds before starting the tutorial.
   * Useful to wait for game canvas to load.
   * Default: 500ms
   */
  startDelay?: number;
  
  /**
   * Callback when tutorial is completed.
   */
  onComplete?: () => void;
  
  /**
   * Callback when tutorial is skipped.
   */
  onSkip?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Tutorial component that manages the onboarding experience for first-time users.
 * 
 * This component:
 * - Automatically shows tutorial on first app launch
 * - Provides step-by-step guidance with visual highlights
 * - Stores completion status in localStorage
 * - Can be replayed from settings
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Tutorial />
 * 
 * // With callbacks
 * <Tutorial
 *   onComplete={() => console.log('Tutorial completed')}
 *   onSkip={() => console.log('Tutorial skipped')}
 * />
 * 
 * // Custom delay
 * <Tutorial startDelay={1000} />
 * 
 * // Disable auto-start
 * <Tutorial autoStart={false} />
 * ```
 */
export const Tutorial: React.FC<TutorialProps> = ({
  autoStart = true,
  startDelay = 500,
  onComplete,
  onSkip,
}) => {
  const { shouldShow, start, isActive, isCompleted } = useTutorialStore();
  
  // Auto-start tutorial on first launch
  useEffect(() => {
    if (!autoStart) return;
    
    // Check if tutorial should be shown (first launch)
    if (shouldShow()) {
      console.log('[Tutorial] First launch detected, starting tutorial');
      
      // Start tutorial after delay (wait for canvas to load)
      const timer = setTimeout(() => {
        start();
      }, startDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, startDelay, shouldShow, start]);
  
  // Listen for tutorial completion events
  useEffect(() => {
    const handleComplete = () => {
      console.log('[Tutorial] Tutorial completed');
      onComplete?.();
    };
    
    const handleSkip = () => {
      console.log('[Tutorial] Tutorial skipped');
      onSkip?.();
    };
    
    // Listen for custom events from tutorialStore
    window.addEventListener('tutorial-complete', handleComplete);
    
    // Note: Skip event is handled through the skip button in TutorialTooltip
    // We can detect it by checking if tutorial becomes inactive without completion
    const checkSkip = () => {
      if (!isActive && !isCompleted) {
        handleSkip();
      }
    };
    
    // Check skip status when tutorial becomes inactive
    if (!isActive && isCompleted) {
      handleComplete();
    }
    
    return () => {
      window.removeEventListener('tutorial-complete', handleComplete);
    };
  }, [isActive, isCompleted, onComplete, onSkip]);
  
  // Render the TutorialManager component
  return <TutorialManager />;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default Tutorial;

// Re-export tutorial store for convenience
export { useTutorialStore } from '../shared/store/tutorialStore';

/**
 * Tutorial API
 * 
 * Provides programmatic access to tutorial functionality.
 */
export const TutorialAPI = {
  /**
   * Start the tutorial manually.
   */
  start: () => {
    useTutorialStore.getState().start();
  },
  
  /**
   * Skip the tutorial.
   */
  skip: () => {
    useTutorialStore.getState().skip();
  },
  
  /**
   * Complete the tutorial.
   */
  complete: () => {
    useTutorialStore.getState().complete();
  },
  
  /**
   * Check if tutorial should be shown (first launch).
   */
  shouldShow: () => {
    return useTutorialStore.getState().shouldShow();
  },
  
  /**
   * Reset tutorial (for testing).
   */
  reset: () => {
    useTutorialStore.getState().reset();
  },
  
  /**
   * Get current tutorial state.
   */
  getState: () => {
    const state = useTutorialStore.getState();
    return {
      isActive: state.isActive,
      currentStep: state.currentStep,
      isCompleted: state.isCompleted,
    };
  },
};
