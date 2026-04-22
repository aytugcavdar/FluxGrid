import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const ScoreMilestoneCelebration: React.FC = React.memo(() => {
  const scoreMilestone = useJuiceStore((state) => state.scoreMilestone);

  if (!scoreMilestone) return null;

  const { score, label } = scoreMilestone;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {scoreMilestone && (
          <motion.div
            key={scoreMilestone.timestamp}
            initial={{ opacity: 0, scale: 0.3, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -100 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative"
          >
            {/* Confetti particles */}
            {[...Array(30)].map((_, i) => {
              const angle = (Math.random() * Math.PI * 2);
              const distance = 100 + Math.random() * 150;
              const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              return (
                <motion.div
                  key={`confetti-${i}`}
                  initial={{ 
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 0,
                    rotate: 0
                  }}
                  animate={{ 
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance - 50,
                    scale: [0, 1, 0.8, 0],
                    opacity: [0, 1, 1, 0],
                    rotate: Math.random() * 720
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: 0.2 + Math.random() * 0.3,
                    ease: 'easeOut'
                  }}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    width: Math.random() * 8 + 4,
                    height: Math.random() * 12 + 6,
                    background: color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  }}
                />
              );
            })}

            {/* Main card */}
            <motion.div
              initial={{ rotateY: -90 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: 90 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border-2 border-amber-400/30"
              style={{
                boxShadow: '0 0 80px rgba(245, 158, 11, 0.4), inset 0 0 40px rgba(245, 158, 11, 0.1)',
              }}
            >
              {/* Glow pulse */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />

              {/* Trophy icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 200 }}
                className="text-7xl mb-4 text-center relative z-10"
              >
                🏆
              </motion.div>

              {/* Label */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="text-4xl font-bold text-center mb-3 relative z-10"
                style={{
                  color: '#fbbf24',
                  textShadow: '0 0 30px rgba(251, 191, 36, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5)',
                }}
              >
                {label}
              </motion.h2>

              {/* Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="text-6xl font-black text-center relative z-10"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                }}
              >
                {score.toLocaleString()}
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="text-center text-amber-200 mt-4 text-lg font-semibold relative z-10"
              >
                Milestone Unlocked!
              </motion.p>

              {/* Stars */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1],
                    opacity: [0, 1, 1]
                  }}
                  transition={{ 
                    duration: 0.4,
                    delay: 1 + i * 0.1,
                    type: 'spring',
                    stiffness: 300
                  }}
                  className="absolute text-3xl"
                  style={{
                    left: `${20 + i * 15}%`,
                    bottom: '-20px',
                  }}
                >
                  ⭐
                </motion.div>
              ))}
            </motion.div>

            {/* Burst rays */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`burst-${i}`}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: [0, 1.5, 0], opacity: [0, 0.8, 0] }}
                transition={{ 
                  duration: 1.2,
                  delay: 0.3 + i * 0.03,
                  ease: 'easeOut'
                }}
                className="absolute left-1/2 top-1/2 origin-bottom"
                style={{
                  width: '3px',
                  height: '250px',
                  background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.8) 0%, transparent 100%)',
                  transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                  filter: 'blur(1px)',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
