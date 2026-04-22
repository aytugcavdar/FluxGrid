import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const VictoryCelebration: React.FC = React.memo(() => {
  const victoryCelebration = useJuiceStore((state) => state.victoryCelebration);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {victoryCelebration && (
          <motion.div
            key={victoryCelebration.timestamp}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full"
          >
            {/* Golden overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
              }}
            />

            {/* Fireworks */}
            {[...Array(8)].map((_, i) => {
              const x = 20 + (i % 4) * 25;
              const y = 20 + Math.floor(i / 4) * 60;
              
              return (
                <motion.div
                  key={`firework-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.2,
                    delay: 0.5 + i * 0.2,
                    ease: 'easeOut'
                  }}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                >
                  {[...Array(12)].map((_, j) => {
                    const angle = (j / 12) * Math.PI * 2;
                    const distance = 60;
                    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
                    const color = colors[j % colors.length];
                    
                    return (
                      <motion.div
                        key={`spark-${j}`}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{ 
                          x: Math.cos(angle) * distance,
                          y: Math.sin(angle) * distance,
                          opacity: 0
                        }}
                        transition={{ duration: 0.8 }}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: color,
                          boxShadow: `0 0 10px ${color}`,
                        }}
                      />
                    );
                  })}
                </motion.div>
              );
            })}

            {/* Confetti rain */}
            {[...Array(50)].map((_, i) => {
              const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const startX = Math.random() * 100;
              const endX = startX + (Math.random() - 0.5) * 20;
              
              return (
                <motion.div
                  key={`confetti-${i}`}
                  initial={{ 
                    x: `${startX}vw`,
                    y: '-10vh',
                    rotate: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    x: `${endX}vw`,
                    y: '110vh',
                    rotate: 720,
                    opacity: [1, 1, 0]
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 2,
                    ease: 'linear'
                  }}
                  className="absolute"
                  style={{
                    width: Math.random() * 10 + 5,
                    height: Math.random() * 15 + 8,
                    background: color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  }}
                />
              );
            })}

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              {/* Trophy */}
              <motion.div
                initial={{ scale: 0, y: -200, rotate: -180 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                transition={{ duration: 1, delay: 0.3, type: 'spring', stiffness: 100 }}
                className="text-9xl mb-8 relative"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [-5, 5, -5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🏆
                </motion.div>

                {/* Sparkles around trophy */}
                {[...Array(8)].map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const distance = 80;
                  
                  return (
                    <motion.div
                      key={`sparkle-${i}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 1.5,
                        delay: 0.8 + i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                      className="absolute text-3xl"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
                      }}
                    >
                      ✨
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* VICTORY text */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6, type: 'spring', stiffness: 120 }}
                className="relative mb-6"
              >
                <motion.h1
                  animate={{ 
                    textShadow: [
                      '0 0 30px rgba(251, 191, 36, 0.8)',
                      '0 0 60px rgba(251, 191, 36, 1)',
                      '0 0 30px rgba(251, 191, 36, 0.8)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-9xl font-black uppercase tracking-wider"
                  style={{
                    background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))',
                  }}
                >
                  VICTORY!
                </motion.h1>

                {/* Shine effect */}
                <motion.div
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute inset-0 overflow-hidden"
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
                      width: '50%',
                    }}
                  />
                </motion.div>
              </motion.div>

              {/* Reason */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="text-3xl font-bold text-amber-300 mb-8 text-center px-8"
                style={{
                  textShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
                }}
              >
                {victoryCelebration.reason}
              </motion.p>

              {/* Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.3, type: 'spring', stiffness: 150 }}
                className="bg-gradient-to-br from-amber-500/30 to-yellow-500/30 backdrop-blur-xl rounded-3xl px-16 py-8 border-4 border-amber-400/50"
                style={{
                  boxShadow: '0 0 60px rgba(251, 191, 36, 0.5), inset 0 0 40px rgba(251, 191, 36, 0.2)',
                }}
              >
                <p className="text-amber-200 text-lg uppercase tracking-wider mb-3 text-center">
                  Final Score
                </p>
                <motion.p
                  animate={{ 
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-7xl font-black text-center"
                  style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))',
                  }}
                >
                  {victoryCelebration.score.toLocaleString()}
                </motion.p>
              </motion.div>

              {/* Stars at bottom */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.6 }}
                className="mt-12 flex gap-4"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={`star-${i}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.5,
                      delay: 1.8 + i * 0.1,
                      type: 'spring',
                      stiffness: 200
                    }}
                    className="text-6xl"
                  >
                    ⭐
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
