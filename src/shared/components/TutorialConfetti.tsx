import React, { useMemo, useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ConfettiPiece {
  id: number;
  left: number;      // 0-100 (%)
  color: string;
  size: number;      // 6-12px
  duration: number;  // ms
  delay: number;     // ms
  isCircle: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
const PARTICLE_COUNT = 20;

// ============================================================================
// HELPERS
// ============================================================================

const generateConfettiPieces = (): ConfettiPiece[] => {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 6, // 6-12px
    duration: 1200 + Math.random() * 800, // 1.2s-2s
    delay: Math.random() * 500, // 0-0.5s
    isCircle: Math.random() > 0.5,
  }));
};

// ============================================================================
// COMPONENT
// ============================================================================

export const TutorialConfetti: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const pieces = useMemo(() => generateConfettiPieces(), []);
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  
  // Auto-hide after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Don't render if reduced motion is preferred
  if (prefersReducedMotion) {
    return null;
  }
  
  // CSS animation keyframes
  const animationCSS = `
    @keyframes confetti-fall {
      0% { 
        transform: translateY(-20px) rotate(0deg); 
        opacity: 1; 
      }
      100% { 
        transform: translateY(100vh) rotate(720deg); 
        opacity: 0; 
      }
    }
  `;
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10001,
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      <style>{animationCSS}</style>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'fixed',
            left: `${piece.left}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.isCircle ? '50%' : '2px',
            animation: `confetti-fall ${piece.duration}ms ease-in forwards`,
            animationDelay: `${piece.delay}ms`,
          }}
        />
      ))}
    </div>
  );
};
