import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const StreakIndicator: React.FC = React.memo(() => {
  const streakIndicator = useJuiceStore((state) => state.streakIndicator);

  const getStreakConfig = (type: 'combo' | 'perfect' | 'daily') => {
    switch (type) {
      case 'combo':
        return { icon: '🔥', color: '#f59e0b', label: 'COMBO STREAK' };
      case 'perfect':
        return { icon: '⭐', color: '#8b5cf6', label: 'PERFECT STREAK' };
      case 'daily':
        return { icon: '📅', color: '#10b981', label: 'DAILY STREAK' };
    }
  };

  return (
    <div className="fixed top-24 right-6 pointer-events-none z-50">
      <AnimatePresence>
        {streakIndicator && (
          <motion.div
            key={streakIndicator.timestamp}
            initial={{ x: 100, opacity: 0, scale: 0.5 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {(() => {
              const config = getStreakConfig(streakIndicator.type);
              
              return (
                <div
                  className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border-2"
                  style={{
                    borderColor: `${config.color}40`,
                    boxShadow: `0 0 30px ${config.color}40`,
                  }}
                >
                  {/* Glow */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle, ${config.color}30 0%, transparent 70%)`,
                      filter: 'blur(20px)',
                    }}
                  />

                  <div className="relative z-10 flex items-center gap-3">
                    {/* Icon */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      className="text-4xl"
                    >
                      {config.icon}
                    </motion.div>

                    <div>
                      {/* Label */}
                      <div
                        className="text-xs font-bold uppercase tracking-wider mb-1"
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </div>

                      {/* Count */}
                      <motion.div
                        key={streakIndicator.count}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-black"
                        style={{
                          color: config.color,
                          textShadow: `0 0 20px ${config.color}80`,
                        }}
                      >
                        {streakIndicator.count}
                      </motion.div>
                    </div>
                  </div>

                  {/* Flame particles for combo */}
                  {streakIndicator.type === 'combo' && [...Array(3)].map((_, i) => (
                    <motion.div
                      key={`flame-${i}`}
                      initial={{ y: 0, opacity: 1, scale: 1 }}
                      animate={{ 
                        y: -40,
                        opacity: 0,
                        scale: [1, 1.2, 0]
                      }}
                      transition={{ 
                        duration: 1,
                        delay: i * 0.2,
                        repeat: Infinity,
                        ease: 'easeOut'
                      }}
                      className="absolute bottom-0 left-1/2 w-2 h-2 rounded-full"
                      style={{
                        background: '#f59e0b',
                        boxShadow: '0 0 10px #f59e0b',
                        marginLeft: `${(i - 1) * 10}px`,
                      }}
                    />
                  ))}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
