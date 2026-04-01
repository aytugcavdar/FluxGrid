import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface TutorialHighlightProps {
  targetSelector: string | null;  // CSS selector or null (no highlight)
  isActive: boolean;
  color?: string;  // default "#3b82f6"
}

// ============================================================================
// CUSTOM HOOK: useHighlightPosition
// ============================================================================

function useHighlightPosition(selector: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  
  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    
    const updatePosition = () => {
      try {
        const element = document.querySelector(selector);
        
        if (!element) {
          console.warn(`[TutorialHighlight] Target element not found: ${selector}`);
          setRect(null);
          return;
        }
        
        const boundingRect = element.getBoundingClientRect();
        
        // Check if element is in viewport
        const isInViewport =
          boundingRect.top >= 0 &&
          boundingRect.left >= 0 &&
          boundingRect.bottom <= window.innerHeight &&
          boundingRect.right <= window.innerWidth;
        
        if (!isInViewport) {
          console.warn(`[TutorialHighlight] Target element is outside viewport: ${selector}`);
          setRect(null);
          return;
        }
        
        setRect(boundingRect);
      } catch (error) {
        console.error(`[TutorialHighlight] Error getting element position:`, error);
        setRect(null);
      }
    };
    
    // Initial position update
    updatePosition();
    
    // Polling (for Babylon.js canvas that loads late)
    pollingIntervalRef.current = window.setInterval(updatePosition, 500);
    
    // ResizeObserver for window resize
    resizeObserverRef.current = new ResizeObserver(() => {
      updatePosition();
    });
    
    // Observe document body for resize
    resizeObserverRef.current.observe(document.body);
    
    // MutationObserver for DOM changes
    mutationObserverRef.current = new MutationObserver(() => {
      updatePosition();
    });
    
    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    
    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [selector]);
  
  return rect;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TutorialHighlight: React.FC<TutorialHighlightProps> = ({
  targetSelector,
  isActive,
  color = '#3b82f6',
}) => {
  const rect = useHighlightPosition(targetSelector);
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  
  // Don't render if not active, no selector, or no rect
  if (!isActive || !targetSelector || !rect) {
    return null;
  }
  
  // Add padding around target element
  const padding = 4;
  const highlightStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${rect.left - padding}px`,
    top: `${rect.top - padding}px`,
    width: `${rect.width + padding * 2}px`,
    height: `${rect.height + padding * 2}px`,
    background: 'transparent',
    border: `2px solid ${color}`,
    borderRadius: '10px',
    boxShadow: `0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.4)`,
    pointerEvents: 'none',
    zIndex: 9999,
    transition: 'all 0.3s ease',
  };
  
  // Animation variants
  const pulseAnimation = prefersReducedMotion
    ? { opacity: 0.8 }
    : {
        opacity: [0.6, 1, 0.6],
      };
  
  const transition = prefersReducedMotion
    ? undefined
    : {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      };
  
  return (
    <motion.div
      style={highlightStyle}
      animate={pulseAnimation}
      transition={transition}
    />
  );
};
