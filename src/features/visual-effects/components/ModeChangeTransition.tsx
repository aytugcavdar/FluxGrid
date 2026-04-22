import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const ModeChangeTransition: React.FC = React.memo(() => {
  const modeChangeTransition = useJuiceStore((state) => state.modeChangeTransition);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {modeChangeTransition && (
          <motion.div
            key={modeChangeTransition.timestamp}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* Wipe effect */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 1, 1, 0] }}
              transition={{ 
                duration: 1.5,
                times: [0, 0.4, 0.6, 1],
                ease: 'easeInOut'
              }}
              className="absolute inset-0 origin-left"
              style={{
                background: 'linear-gradient(90deg, #1f2937 0%, #111827 50%, #1f2937 100%)',
              }}
            />

            {/* Mode labels */}
            <div className="relative z-10 flex items-center gap-8">
              {/* From mode */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, times: [0, 0.2, 0.5, 0.7] }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 0.9, 0.8] }}
                  transition={{ duration: 0.8 }}
                  className="bg-gradient-to-br from-gray-700/80 to-gray-800/80 backdrop-blur-xl rounded-2xl px-8 py-6 border-2 border-gray-600/40"
                >
                  <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                    Leaving
                  </p>
                  <p className="text-3xl font-bold text-gray-300">
                    {modeChangeTransition.fromMode}
                  </p>
                </motion.div>
              </motion.div>

              {/* Arrow */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  rotate: 0,
                  x: [0, 20, 0]
                }}
                transition={{ 
                  duration: 1,
                  delay: 0.3,
                  times: [0, 0.6, 1]
                }}
                className="text-6xl"
              >
                ➡️
              </motion.div>

              {/* To mode */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: [0, 0, 1, 1] }}
                transition={{ duration: 1.5, times: [0, 0.5, 0.7, 1] }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.1, 1] }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="bg-gradient-to-br from-blue-500/30 to-indigo-500/30 backdrop-blur-xl rounded-2xl px-8 py-6 border-2 border-blue-400/50"
                  style={{
                    boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                  }}
                >
                  <p className="text-blue-300 text-sm uppercase tracking-wider mb-2">
                    Entering
                  </p>
                  <p className="text-3xl font-bold text-blue-100">
                    {modeChangeTransition.toMode}
                  </p>
                </motion.div>
              </motion.div>
            </div>

            {/* Particle transition */}
            {[...Array(30)].map((_, i) => {
              const startY = Math.random() * 100;
              const colors = ['#3b82f6', '#8b5cf6', '#10b981'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              return (
                <motion.div
                  key={`particle-${i}`}
                  initial={{ 
                    x: '-10vw',
                    y: `${startY}vh`,
                    opacity: 0,
                    scale: 0
                  }}
                  animate={{ 
                    x: '110vw',
                    y: `${startY + (Math.random() - 0.5) * 20}vh`,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: Math.random() * 0.5,
                    ease: 'easeInOut'
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 10px ${color}`,
                  }}
                />
              );
            })}

            {/* Top and bottom bars */}
            {['top', 'bottom'].map((position) => (
              <motion.div
                key={position}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1, 1, 0] }}
                transition={{ 
                  duration: 1.5,
                  times: [0, 0.3, 0.7, 1],
                  ease: 'easeInOut'
                }}
                className="absolute left-0 right-0 h-2 origin-left"
                style={{
                  [position]: 0,
                  background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #10b981 100%)',
                  boxShadow: position === 'top' 
                    ? '0 4px 20px rgba(59, 130, 246, 0.6)'
                    : '0 -4px 20px rgba(59, 130, 246, 0.6)',
                }}
              />
            ))}

            {/* Flash effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="absolute inset-0 bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
