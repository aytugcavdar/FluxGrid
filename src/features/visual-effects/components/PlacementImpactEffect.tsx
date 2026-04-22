import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { useJuiceStore } from '../store/juiceStore';
import { useCleanup } from '@shared/hooks/useCleanup';

export const PlacementImpactEffect: React.FC = React.memo(() => {
  const cleanup = useCleanup();
  const lastAction = useGameStore((state) => state.lastAction);
  const [impacts, setImpacts] = React.useState<Array<{
    id: number;
    dropHeight: number;
    timestamp: number;
  }>>([]);
  const impactIdRef = React.useRef(0);

  React.useEffect(() => {
    if (lastAction?.type === 'PLACE' && lastAction.dropHeight !== undefined) {
      const dropHeight = lastAction.dropHeight;
      
      // Only show impact for drops from height > 2
      if (dropHeight > 2) {
        const id = impactIdRef.current++;
        setImpacts(prev => [...prev, { id, dropHeight, timestamp: Date.now() }]);
        
        // Trigger screen shake based on drop height
        const shakeIntensity = Math.min(dropHeight * 0.5, 5);
        const shakeDuration = Math.min(dropHeight * 20, 200);
        useJuiceStore.getState().triggerScreenShake(shakeIntensity, shakeDuration);
        
        // Remove after animation
        const timeoutId = setTimeout(() => {
          setImpacts(prev => prev.filter(i => i.id !== id));
        }, 800);
        cleanup.trackTimeout(timeoutId);
      }
    }
  }, [lastAction, cleanup]);

  return (
    <div className="fixed inset-0 pointer-events-none z-45">
      <AnimatePresence>
        {impacts.map((impact) => {
          const intensity = Math.min(impact.dropHeight / 10, 1);
          
          return (
            <React.Fragment key={impact.id}>
              {/* Impact flash */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, intensity * 0.3, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at center, rgba(255, 255, 255, ${intensity * 0.3}) 0%, transparent 60%)`,
                }}
              />
              
              {/* Impact waves */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`wave-${i}`}
                  initial={{ scale: 0, opacity: intensity }}
                  animate={{ 
                    scale: [0, 2 + intensity],
                    opacity: [intensity, 0]
                  }}
                  transition={{ 
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 100,
                    height: 100,
                    marginLeft: -50,
                    marginTop: -50,
                    border: `3px solid rgba(255, 255, 255, ${intensity * 0.8})`,
                    borderRadius: '50%',
                  }}
                />
              ))}
              
              {/* Landing particles */}
              {[...Array(Math.floor(8 + impact.dropHeight))].map((_, i) => {
                const angle = (i / (8 + impact.dropHeight)) * Math.PI * 2;
                const distance = 50 + impact.dropHeight * 5;
                
                return (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ 
                      x: 0,
                      y: 0,
                      scale: 1,
                      opacity: intensity
                    }}
                    animate={{ 
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance + 20, // Slight downward bias
                      scale: [1, 0],
                      opacity: [intensity, 0]
                    }}
                    transition={{ 
                      duration: 0.5 + Math.random() * 0.3,
                      ease: 'easeOut'
                    }}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 6 + impact.dropHeight * 0.5,
                      height: 6 + impact.dropHeight * 0.5,
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '50%',
                      boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                    }}
                  />
                );
              })}
              
              {/* Dust clouds */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`dust-${i}`}
                  initial={{ 
                    x: (Math.random() - 0.5) * 100,
                    y: 0,
                    scale: 0,
                    opacity: intensity * 0.6
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 200,
                    y: -50 - Math.random() * 50,
                    scale: [0, 1 + intensity, 0],
                    opacity: [intensity * 0.6, intensity * 0.4, 0]
                  }}
                  transition={{ 
                    duration: 0.8,
                    delay: i * 0.05,
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 30 + impact.dropHeight * 2,
                    height: 30 + impact.dropHeight * 2,
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(8px)',
                  }}
                />
              ))}
            </React.Fragment>
          );
        })}
      </AnimatePresence>
    </div>
  );
});
