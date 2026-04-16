import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const LineClearAnimations: React.FC = () => {
  const lineClearAnimations = useJuiceStore((state) => state.lineClearAnimations);
  const [gridBounds, setGridBounds] = useState<DOMRect | null>(null);

  // Get grid position from DOM - update more frequently
  useEffect(() => {
    const updateGridBounds = () => {
      const gridElement = document.querySelector('[data-grid-container]');
      if (gridElement) {
        const bounds = gridElement.getBoundingClientRect();
        setGridBounds(bounds);
        console.log('[LineClearAnimations] Grid bounds updated:', bounds);
      } else {
        console.warn('[LineClearAnimations] Grid element not found');
      }
    };

    // Initial update
    updateGridBounds();
    
    // Update on resize
    window.addEventListener('resize', updateGridBounds);
    
    // Also update when animations change (grid might have moved)
    if (lineClearAnimations.length > 0) {
      updateGridBounds();
    }
    
    return () => window.removeEventListener('resize', updateGridBounds);
  }, [lineClearAnimations.length]);

  if (!gridBounds) {
    console.warn('[LineClearAnimations] No grid bounds available');
    return null;
  }

  const cellSize = gridBounds.width / 10; // Grid is 10x10
  const gridOffsetX = gridBounds.left;
  const gridOffsetY = gridBounds.top;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {lineClearAnimations.map((animation) => {
          if (animation.type === 'row') {
            return (
              <React.Fragment key={animation.id}>
                {/* Main sweep effect */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 1 }}
                  animate={{ 
                    scaleX: [0, 1.2, 1],
                    opacity: [1, 0.8, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.4, 0, 0.2, 1],
                    times: [0, 0.6, 1]
                  }}
                  style={{
                    position: 'fixed',
                    left: gridOffsetX,
                    top: gridOffsetY + animation.index * cellSize,
                    width: gridBounds.width,
                    height: cellSize,
                    background: `linear-gradient(90deg, 
                      transparent 0%, 
                      ${animation.color}20 10%,
                      ${animation.color}80 50%, 
                      ${animation.color}20 90%,
                      transparent 100%)`,
                    transformOrigin: 'left center',
                    boxShadow: `0 0 30px ${animation.color}80, inset 0 0 20px ${animation.color}40`,
                    borderRadius: '4px',
                  }}
                />
                
                {/* Leading edge glow */}
                <motion.div
                  initial={{ x: 0, opacity: 1 }}
                  animate={{ 
                    x: gridBounds.width,
                    opacity: [1, 1, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: 'easeOut',
                    times: [0, 0.7, 1]
                  }}
                  style={{
                    position: 'fixed',
                    left: gridOffsetX,
                    top: gridOffsetY + animation.index * cellSize,
                    width: cellSize * 2,
                    height: cellSize,
                    background: `radial-gradient(ellipse at left, ${animation.color} 0%, transparent 70%)`,
                    boxShadow: `0 0 40px ${animation.color}`,
                    filter: 'blur(8px)',
                  }}
                />
                
                {/* Particle trail */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ 
                      x: 0, 
                      y: 0,
                      scale: 1,
                      opacity: 1 
                    }}
                    animate={{ 
                      x: gridBounds.width * (0.8 + i * 0.05),
                      y: (Math.random() - 0.5) * cellSize * 0.5,
                      scale: [1, 1.5, 0],
                      opacity: [1, 0.8, 0]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.5,
                      delay: i * 0.02,
                      ease: 'easeOut'
                    }}
                    style={{
                      position: 'fixed',
                      left: gridOffsetX,
                      top: gridOffsetY + animation.index * cellSize + cellSize / 2,
                      width: 8,
                      height: 8,
                      background: animation.color,
                      borderRadius: '50%',
                      boxShadow: `0 0 10px ${animation.color}`,
                    }}
                  />
                ))}
              </React.Fragment>
            );
          } else {
            return (
              <React.Fragment key={animation.id}>
                {/* Main sweep effect */}
                <motion.div
                  initial={{ scaleY: 0, opacity: 1 }}
                  animate={{ 
                    scaleY: [0, 1.2, 1],
                    opacity: [1, 0.8, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.4, 0, 0.2, 1],
                    times: [0, 0.6, 1]
                  }}
                  style={{
                    position: 'fixed',
                    left: gridOffsetX + animation.index * cellSize,
                    top: gridOffsetY,
                    width: cellSize,
                    height: gridBounds.height,
                    background: `linear-gradient(180deg, 
                      transparent 0%, 
                      ${animation.color}20 10%,
                      ${animation.color}80 50%, 
                      ${animation.color}20 90%,
                      transparent 100%)`,
                    transformOrigin: 'center top',
                    boxShadow: `0 0 30px ${animation.color}80, inset 0 0 20px ${animation.color}40`,
                    borderRadius: '4px',
                  }}
                />
                
                {/* Leading edge glow */}
                <motion.div
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ 
                    y: gridBounds.height,
                    opacity: [1, 1, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: 'easeOut',
                    times: [0, 0.7, 1]
                  }}
                  style={{
                    position: 'fixed',
                    left: gridOffsetX + animation.index * cellSize,
                    top: gridOffsetY,
                    width: cellSize,
                    height: cellSize * 2,
                    background: `radial-gradient(ellipse at top, ${animation.color} 0%, transparent 70%)`,
                    boxShadow: `0 0 40px ${animation.color}`,
                    filter: 'blur(8px)',
                  }}
                />
                
                {/* Particle trail */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ 
                      x: 0, 
                      y: 0,
                      scale: 1,
                      opacity: 1 
                    }}
                    animate={{ 
                      x: (Math.random() - 0.5) * cellSize * 0.5,
                      y: gridBounds.height * (0.8 + i * 0.05),
                      scale: [1, 1.5, 0],
                      opacity: [1, 0.8, 0]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.5,
                      delay: i * 0.02,
                      ease: 'easeOut'
                    }}
                    style={{
                      position: 'fixed',
                      left: gridOffsetX + animation.index * cellSize + cellSize / 2,
                      top: gridOffsetY,
                      width: 8,
                      height: 8,
                      background: animation.color,
                      borderRadius: '50%',
                      boxShadow: `0 0 10px ${animation.color}`,
                    }}
                  />
                ))}
              </React.Fragment>
            );
          }
        })}
      </AnimatePresence>
    </div>
  );
};
