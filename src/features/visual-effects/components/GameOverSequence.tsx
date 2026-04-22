import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const GameOverSequence: React.FC = React.memo(() => {
  const gameOverSequence = useJuiceStore((state) => state.gameOverSequence);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {gameOverSequence && (
          <motion.div
            key={gameOverSequence.timestamp}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full"
          >
            {/* Dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-black"
            />

            {/* Red vignette */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, transparent 30%, rgba(239, 68, 68, 0.4) 100%)',
              }}
            />

            {/* Shatter effect lines */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const length = 150 + Math.random() * 100;
              
              return (
                <motion.div
                  key={`shatter-${i}`}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.03 }}
                  className="absolute left-1/2 top-1/2 origin-left"
                  style={{
                    width: `${length}px`,
                    height: '2px',
                    background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.8) 0%, transparent 100%)',
                    transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                  }}
                />
              );
            })}

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              {/* Skull or sad emoji */}
              <motion.div
                initial={{ scale: 0, rotate: -180, y: -100 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, type: 'spring', stiffness: 100 }}
                className="text-9xl mb-8"
              >
                💀
              </motion.div>

              {/* GAME OVER text */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8, type: 'spring', stiffness: 150 }}
                className="relative mb-8"
              >
                <motion.h1
                  animate={{ 
                    textShadow: [
                      '0 0 20px rgba(239, 68, 68, 0.8)',
                      '0 0 40px rgba(239, 68, 68, 1)',
                      '0 0 20px rgba(239, 68, 68, 0.8)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-8xl font-black uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))',
                  }}
                >
                  GAME OVER
                </motion.h1>

                {/* Glitch effect */}
                <motion.div
                  animate={{ 
                    x: [-2, 2, -2],
                    opacity: [0, 0.3, 0]
                  }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute inset-0 text-8xl font-black uppercase tracking-wider"
                  style={{
                    color: '#3b82f6',
                    mixBlendMode: 'screen',
                  }}
                >
                  GAME OVER
                </motion.div>
              </motion.div>

              {/* Score display */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl px-12 py-6 border-2 border-red-500/30"
                style={{
                  boxShadow: '0 0 40px rgba(239, 68, 68, 0.3)',
                }}
              >
                <p className="text-gray-400 text-sm uppercase tracking-wider mb-2 text-center">
                  Final Score
                </p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.4, type: 'spring', stiffness: 200 }}
                  className="text-6xl font-black text-center"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {gameOverSequence.finalScore.toLocaleString()}
                </motion.p>

                {/* High score badge */}
                {gameOverSequence.highScore && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 1.6, type: 'spring', stiffness: 150 }}
                    className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full px-4 py-2 border border-amber-400/40"
                  >
                    <span className="text-2xl">🏆</span>
                    <span className="text-amber-400 font-bold uppercase text-sm tracking-wide">
                      New High Score!
                    </span>
                  </motion.div>
                )}
              </motion.div>

              {/* Falling particles */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  initial={{ 
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    opacity: 0.8,
                    rotate: 0
                  }}
                  animate={{ 
                    y: window.innerHeight + 20,
                    opacity: 0,
                    rotate: 360
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2,
                    delay: 0.5 + Math.random() * 1,
                    ease: 'linear'
                  }}
                  className="absolute w-2 h-2 bg-red-500 rounded-full"
                  style={{
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
