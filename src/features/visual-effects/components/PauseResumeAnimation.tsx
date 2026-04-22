import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const PauseResumeAnimation: React.FC = React.memo(() => {
  const pauseResumeAnimation = useJuiceStore((state) => state.pauseResumeAnimation);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {pauseResumeAnimation && (
          <motion.div
            key={`${pauseResumeAnimation.type}-${pauseResumeAnimation.timestamp}`}
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {pauseResumeAnimation.type === 'pause' ? (
              // Pause animation
              <div className="relative">
                {/* Glow */}
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    width: '300px',
                    height: '300px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />

                {/* Pause icon */}
                <motion.div
                  className="relative bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-full p-12 border-4 border-blue-400/40"
                  style={{
                    boxShadow: '0 0 60px rgba(59, 130, 246, 0.5)',
                  }}
                >
                  <div className="flex gap-4">
                    {[0, 1].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className="w-8 h-24 bg-gradient-to-b from-blue-400 to-blue-600 rounded-lg"
                        style={{
                          boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
                        }}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                >
                  <p className="text-3xl font-bold text-blue-400" style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }}>
                    DURAKLATILDI
                  </p>
                </motion.div>
              </div>
            ) : (
              // Resume animation
              <div className="relative">
                {/* Glow */}
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    width: '300px',
                    height: '300px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />

                {/* Play icon */}
                <motion.div
                  className="relative bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-full p-12 border-4 border-emerald-400/40"
                  style={{
                    boxShadow: '0 0 60px rgba(16, 185, 129, 0.5)',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, x: -10 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '40px solid #10b981',
                      borderTop: '30px solid transparent',
                      borderBottom: '30px solid transparent',
                      filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.8))',
                      marginLeft: '8px',
                    }}
                  />
                </motion.div>

                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                >
                  <p className="text-3xl font-bold text-emerald-400" style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.8)' }}>
                    DEVAM EDİYOR
                  </p>
                </motion.div>

                {/* Countdown circles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`circle-${i}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.5, 2],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: i * 0.2,
                      ease: 'easeOut'
                    }}
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-emerald-400"
                    style={{
                      width: '200px',
                      height: '200px',
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
