/**
 * Floating Score Text Component
 * 
 * Shows "+100", "+500" style floating text when score increases
 * Enhanced with source icons, multiplier breakdown, and critical hit effects
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { detectReducedMotion } from '../../visual-effects/utils/reducedMotionDetector';
import type { ScoreSourceType, MultiplierBreakdown } from '../../visual-effects/types/animationTypes';

interface FloatingText {
  id: string;
  value: number;
  x: number;
  y: number;
  color: string;
  source?: ScoreSourceType;
  icon?: string;
  multipliers?: MultiplierBreakdown;
  isCriticalHit: boolean;
  offsetX: number; // For cascade effect
  index: number; // For stacking order
}

// Score source configuration
const SCORE_SOURCES = {
  combo: {
    icon: '🔥',
    color: '#f97316', // Orange
  },
  colorBonus: {
    icon: '🌈',
    color: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #10b981, #3b82f6, #a78bfa)',
  },
  tierMultiplier: {
    icon: '⭐',
    color: '#fbbf24', // Gold
  },
} as const;

export const FloatingScoreText: React.FC = React.memo(() => {
  const { score, lastAction, isGameOver } = useGameStore();
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [prevScore, setPrevScore] = useState(0);
  const [prefersReducedMotion] = useState(detectReducedMotion());
  const [textCounter, setTextCounter] = useState(0); // For cascade offset

  // Reset prevScore when game is over or score resets to 0
  useEffect(() => {
    if (score === 0 || isGameOver) {
      setPrevScore(0);
      setFloatingTexts([]);
      setTextCounter(0);
    }
  }, [score, isGameOver]);

  useEffect(() => {
    // PERFORMANCE: Disable floating text for combo >= 10 to prevent freeze
    const currentCombo = lastAction?.combo || 0;
    if (currentCombo >= 10) {
      setPrevScore(score);
      return;
    }
    
    // Detect score increase
    if (score > prevScore && prevScore >= 0) {
      const scoreDiff = score - prevScore;
      
      // Show for any score increase (1+)
      if (scoreDiff >= 1) {
        // Position at center of screen
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        
        // Determine score source from lastAction
        let source: ScoreSourceType | undefined;
        let icon: string | undefined;
        let sourceColor: string;
        
        if (lastAction && lastAction.type === 'CLEAR' && lastAction.combo && lastAction.combo > 1) {
          source = 'combo';
          icon = SCORE_SOURCES.combo.icon;
          sourceColor = SCORE_SOURCES.combo.color;
        } else if (lastAction && lastAction.type === 'CLEAR' && lastAction.colorBonus) {
          source = 'colorBonus';
          icon = SCORE_SOURCES.colorBonus.icon;
          sourceColor = SCORE_SOURCES.colorBonus.color;
        } else if (lastAction && lastAction.tier && lastAction.tier > 0) {
          source = 'tierMultiplier';
          icon = SCORE_SOURCES.tierMultiplier.icon;
          sourceColor = SCORE_SOURCES.tierMultiplier.color;
        } else {
          // Default color based on score amount
          sourceColor = '#ffffff'; // White - Default
          if (scoreDiff >= 1000) sourceColor = '#ef4444'; // Red - Epic
          else if (scoreDiff >= 500) sourceColor = '#f97316'; // Orange - Amazing
          else if (scoreDiff >= 200) sourceColor = '#eab308'; // Yellow - Great
          else if (scoreDiff >= 100) sourceColor = '#10b981'; // Green - Good
        }
        
        // Build multiplier breakdown
        const multipliers: MultiplierBreakdown = {
          total: 1,
        };
        
        if (lastAction && lastAction.type === 'CLEAR') {
          if (lastAction.combo && lastAction.combo > 1) {
            multipliers.combo = lastAction.combo;
            multipliers.total *= lastAction.combo;
          }
          if (lastAction.colorBonus) {
            multipliers.colorBonus = 1.5; // From POINTS.COLOR_BONUS_MULTIPLIER
            multipliers.total *= 1.5;
          }
        }
        
        if (lastAction && lastAction.tier && lastAction.tier > 0) {
          // Tier multipliers from constants
          const tierMultipliers = [1.0, 1.15, 1.35, 1.6, 2.0, 2.5, 3.0];
          const tierMult = tierMultipliers[lastAction.tier] || 1.0;
          multipliers.tier = tierMult;
          multipliers.total *= tierMult;
        }
        
        // Critical hit detection (1000+ points)
        const isCriticalHit = scoreDiff >= 1000;
        
        // Calculate cascade offset for multiple popups
        const currentIndex = textCounter;
        const offsetX = (currentIndex % 3 - 1) * 40; // -40, 0, 40 pattern
        
        const newText: FloatingText = {
          id: `${Date.now()}-${Math.random()}`,
          value: scoreDiff,
          x,
          y,
          color: sourceColor,
          source,
          icon,
          multipliers: multipliers.total > 1 ? multipliers : undefined,
          isCriticalHit,
          offsetX,
          index: currentIndex,
        };
        
        // Limit max concurrent floating texts to 3 for performance
        setFloatingTexts(prev => {
          const updated = [...prev, newText];
          return updated.slice(-3); // Keep only last 3
        });
        setTextCounter(prev => prev + 1);
        
        // Screen shake for high scores - DISABLED for high combo to prevent jank
        const currentCombo = lastAction?.combo || 0;
        if (scoreDiff >= 500 && !prefersReducedMotion && currentCombo < 5) {
          // Only shake for combo < 5 to prevent FPS drops
          const intensity = scoreDiff >= 2000 ? 5 : scoreDiff >= 1000 ? 3 : 2;
          document.body.style.animation = `screenShake 0.2s ease-in-out`;
          document.body.style.setProperty('--shake-intensity', `${intensity}px`);
          setTimeout(() => {
            document.body.style.animation = '';
          }, 200);
        }
        
        // Remove after animation completes (3 seconds - reduced from 4.5s)
        setTimeout(() => {
          setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
        }, 3000);
      }
    }
    
    setPrevScore(score);
  }, [score, lastAction, prevScore, textCounter, prefersReducedMotion]);

  return (
    <>
      {/* Screen shake keyframes */}
      <style>{`
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(calc(var(--shake-intensity, 5px) * -1), calc(var(--shake-intensity, 5px) * 0.5)); }
          20% { transform: translate(var(--shake-intensity, 5px), calc(var(--shake-intensity, 5px) * -0.5)); }
          30% { transform: translate(calc(var(--shake-intensity, 5px) * -0.8), calc(var(--shake-intensity, 5px) * 0.8)); }
          40% { transform: translate(calc(var(--shake-intensity, 5px) * 0.8), calc(var(--shake-intensity, 5px) * -0.8)); }
          50% { transform: translate(calc(var(--shake-intensity, 5px) * -0.5), calc(var(--shake-intensity, 5px) * 0.5)); }
          60% { transform: translate(calc(var(--shake-intensity, 5px) * 0.5), calc(var(--shake-intensity, 5px) * -0.5)); }
          70% { transform: translate(calc(var(--shake-intensity, 5px) * -0.3), calc(var(--shake-intensity, 5px) * 0.3)); }
          80% { transform: translate(calc(var(--shake-intensity, 5px) * 0.3), calc(var(--shake-intensity, 5px) * -0.3)); }
          90% { transform: translate(calc(var(--shake-intensity, 5px) * -0.1), calc(var(--shake-intensity, 5px) * 0.1)); }
        }
      `}</style>
      
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 150 }}>
        <AnimatePresence>
          {floatingTexts.map((text) => {
          // Reduced motion: simple fade instead of complex motion
          const reducedMotionAnimation = prefersReducedMotion ? {
            initial: { opacity: 0 },
            animate: { opacity: [0, 1, 1, 0] },
            exit: { opacity: 0 },
            transition: { duration: 2.5, ease: 'easeOut' as const }
          } : {
            initial: { 
              x: text.x, 
              y: text.y, 
              opacity: 0, 
              scale: 0.8 
            },
            animate: { 
              x: text.x,
              y: text.y - 80, 
              opacity: [0, 1, 1, 0.8, 0], 
              scale: text.isCriticalHit ? [0.8, 1.2, 1.1, 1, 0.9] : [0.8, 1, 1, 1, 0.9],
            },
            exit: { opacity: 0, scale: 0.8 },
            transition: { 
              duration: 2.5,
              ease: 'easeOut' as const,
              opacity: {
                times: [0, 0.15, 0.6, 0.85, 1],
              },
              scale: {
                times: text.isCriticalHit ? [0, 0.2, 0.35, 0.6, 1] : [0, 0.25, 0.5, 0.75, 1],
              }
            }
          };
          
          return (
            <motion.div
              key={text.id}
              initial={{ 
                opacity: 0, 
                scale: 0.8,
                x: `calc(-50% + ${text.offsetX}px)`,
                y: '-50%',
              }}
              animate={{ 
                opacity: [0, 1, 1, 1, 1, 0.9, 0], 
                scale: text.isCriticalHit ? [0.8, 1.3, 1.15, 1.05, 1, 1, 0.98] : [0.8, 1.1, 1.05, 1, 1, 1, 0.98],
                y: ['-50%', 'calc(-50% - 60px)', 'calc(-50% - 70px)', 'calc(-50% - 80px)'],
                x: `calc(-50% + ${text.offsetX}px)`, // Maintain offset during animation
              }}
              exit={{ opacity: 0, scale: 0.95, y: 'calc(-50% - 90px)' }}
              transition={{ 
                duration: 3.0, // Reduced from 4.5s for better performance
                ease: 'easeOut' as const,
                opacity: {
                  times: [0, 0.1, 0.4, 0.7, 0.85, 0.95, 1],
                  ease: ['easeOut', 'linear', 'linear', 'linear', 'linear', 'easeIn'] as any,
                },
                scale: {
                  times: text.isCriticalHit ? [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1] : [0, 0.2, 0.4, 0.6, 0.75, 0.9, 1],
                  ease: ['easeOut', 'easeOut', 'easeInOut', 'linear', 'linear', 'easeIn'] as any,
                },
                y: {
                  times: [0, 0.4, 0.7, 1],
                  duration: 3.0, // Reduced from 4.5s
                  ease: ['easeOut', 'linear', 'easeIn'] as any,
                }
              }}
              style={{
                position: 'fixed',
                left: '50%',
                top: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {/* Main score with icon */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
              }}>
                {/* Source icon with bounce animation */}
                {text.icon && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: [0, 1.3, 1],
                      rotate: [- 180, 10, 0],
                    }}
                    transition={{ 
                      duration: 0.5,
                      ease: 'easeOut',
                      scale: {
                        times: [0, 0.6, 1],
                      }
                    }}
                    style={{ 
                      fontSize: text.isCriticalHit ? 48 : 40,
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
                      display: 'inline-block',
                    }}
                  >
                    {text.icon}
                    
                    {/* Icon glow ring */}
                    <motion.span
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '120%',
                        height: '120%',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${text.color}40 0%, transparent 70%)`,
                        zIndex: -1,
                      }}
                    />
                  </motion.span>
                )}
                
                {/* Score value with premium styling */}
                <span style={{
                  fontSize: text.isCriticalHit ? 64 : 48,
                  fontWeight: 900,
                  background: text.isCriticalHit 
                    ? 'linear-gradient(135deg, #ff4444, #ff6b00)'
                    : 'linear-gradient(135deg, #ffffff, #eeeeee)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: text.isCriticalHit 
                    ? '0 0 20px rgba(255,68,68,0.5), 0 2px 8px rgba(0,0,0,0.6)'
                    : '0 0 15px rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.5)',
                  letterSpacing: '-1px',
                  filter: text.isCriticalHit ? 'brightness(1.1)' : 'brightness(1.0)',
                  position: 'relative' as const,
                }}>
                  <span style={{
                    position: 'absolute' as const,
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: text.isCriticalHit 
                      ? 'linear-gradient(135deg, #ff4444, #ff6b00)'
                      : 'linear-gradient(135deg, #ffffff, #dddddd)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'blur(6px)',
                    opacity: 0.4,
                    zIndex: -1,
                  }}>
                    +{text.value.toLocaleString()}
                  </span>
                  +{text.value.toLocaleString()}
                </span>
              </div>
              
              {/* Multiplier breakdown */}
              {text.multipliers && text.multipliers.total > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.2, 
                    duration: 0.3
                  }}
                  style={{
                    display: 'flex',
                    gap: 6,
                    fontSize: 16,
                    fontWeight: 700,
                    color: text.color,
                    textShadow: text.multipliers.total >= 3 
                      ? `0 0 15px ${text.color}FF, 0 0 30px ${text.color}80` // Glow for 3x+
                      : `0 0 10px ${text.color}60`,
                    filter: text.multipliers.total >= 3 ? 'brightness(1.2)' : 'brightness(1.1)',
                  }}
                >
                  {text.multipliers.combo && (
                    <span>×{text.multipliers.combo}</span>
                  )}
                  {text.multipliers.colorBonus && (
                    <span>×{text.multipliers.colorBonus}</span>
                  )}
                  {text.multipliers.tier && (
                    <span>×{text.multipliers.tier.toFixed(1)}</span>
                  )}
                </motion.div>
              )}
              
              {/* Critical hit label */}
              {text.isCriticalHit && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#ef4444',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    textShadow: '0 0 15px #ef444480',
                  }}
                >
                  CRITICAL!
                </motion.div>
              )}
              
              {/* Particle burst for high scores - REDUCED for performance, DISABLED for high combo */}
              {text.value >= 1000 && !prefersReducedMotion && (lastAction?.combo || 0) < 5 && (
                <>
                  {/* Reduced from 8 to 4 particles, disabled for combo >= 5 */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        opacity: 1,
                        scale: 0,
                        x: 0,
                        y: 0,
                      }}
                      animate={{
                        opacity: [1, 0],
                        scale: [0, 1],
                        x: Math.cos((i / 4) * Math.PI * 2) * 50, // Reduced distance
                        y: Math.sin((i / 4) * Math.PI * 2) * 50, // Reduced distance
                      }}
                      transition={{
                        duration: 0.6, // Faster animation
                        ease: 'easeOut',
                      }}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: 6, // Smaller particles
                        height: 6,
                        borderRadius: '50%',
                        background: text.color,
                        boxShadow: `0 0 8px ${text.color}`,
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
    </>
  );
});
