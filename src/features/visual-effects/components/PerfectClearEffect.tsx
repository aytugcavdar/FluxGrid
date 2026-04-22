import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { useCleanup } from '@shared/hooks/useCleanup';

export const PerfectClearEffect: React.FC = React.memo(() => {
  const cleanup = useCleanup();
  const perfectClearDetected = useGameStore((state) => state.perfectClearDetected);
  const [showEffect, setShowEffect] = React.useState(false);

  React.useEffect(() => {
    if (perfectClearDetected) {
      setShowEffect(true);
      const timeoutId = setTimeout(() => {
        setShowEffect(false);
        // Reset the flag in store
        useGameStore.setState({ perfectClearDetected: false });
      }, 3500);
      cleanup.trackTimeout(timeoutId);
    }
  }, [perfectClearDetected, cleanup]);

  return (
    <div className="fixed inset-0 pointer-events-none z-60">
      <AnimatePresence>
        {showEffect && (
          <>
            {/* Rainbow flash */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(236, 72, 153, 0.3) 50%, transparent 100%)',
              }}
            />
            
            {/* PERFECT CLEAR text */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotateZ: -10 }}
              animate={{ 
                scale: [0, 1.3, 1],
                opacity: [0, 1, 1, 1, 0],
                rotateZ: [-10, 5, 0, 0, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 3.5,
                times: [0, 0.2, 0.3, 0.85, 1],
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="text-center">
                <motion.div
                  animate={{
                    textShadow: [
                      '0 0 30px rgba(139, 92, 246, 1), 0 0 60px rgba(236, 72, 153, 0.8)',
                      '0 0 50px rgba(236, 72, 153, 1), 0 0 80px rgba(139, 92, 246, 0.8)',
                      '0 0 30px rgba(139, 92, 246, 1), 0 0 60px rgba(236, 72, 153, 0.8)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: 2 }}
                  className="text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
                  style={{
                    WebkitTextStroke: '3px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  PERFECT
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-2"
                  style={{
                    WebkitTextStroke: '2px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  CLEAR!
                </motion.div>
              </div>
            </motion.div>
            
            {/* Rainbow particles */}
            {[...Array(30)].map((_, i) => {
              const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
              const angle = (i / 30) * Math.PI * 2;
              const distance = 200 + Math.random() * 200;
              
              return (
                <motion.div
                  key={i}
                  initial={{ 
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    scale: [0, 1.5, 1, 0],
                    opacity: [1, 1, 1, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.03,
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 16,
                    height: 16,
                    background: colors[i % colors.length],
                    borderRadius: '50%',
                    boxShadow: `0 0 20px ${colors[i % colors.length]}`,
                  }}
                />
              );
            })}
            
            {/* Expanding rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`ring-${i}`}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ 
                  scale: [0, 3],
                  opacity: [1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.3,
                  ease: 'easeOut'
                }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 200,
                  height: 200,
                  marginLeft: -100,
                  marginTop: -100,
                  border: '4px solid rgba(139, 92, 246, 0.8)',
                  borderRadius: '50%',
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
