import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const AbilityUnlockAnimation: React.FC = React.memo(() => {
  const abilityUnlock = useJuiceStore((state) => state.abilityUnlock);

  if (!abilityUnlock) return null;

  const { abilityName, abilityIcon } = abilityUnlock;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {abilityUnlock && (
          <motion.div
            key={abilityUnlock.timestamp}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              style={{
                width: '100vw',
                height: '100vh',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Main container */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateX: -90 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateX: 90 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative"
            >
              {/* Glow background */}
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                  width: '500px',
                  height: '500px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />

              {/* Card */}
              <motion.div
                className="relative bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-purple-400/40"
                style={{
                  boxShadow: '0 0 100px rgba(139, 92, 246, 0.5), inset 0 0 60px rgba(139, 92, 246, 0.1)',
                  minWidth: '400px',
                }}
              >
                {/* Unlock text */}
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-center mb-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-2xl mb-2"
                  >
                    🔓
                  </motion.div>
                  <h3 className="text-xl font-bold text-purple-300 uppercase tracking-wider">
                    Ability Unlocked
                  </h3>
                </motion.div>

                {/* Icon container */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.7, delay: 0.5, type: 'spring', stiffness: 150 }}
                  className="relative mx-auto mb-6"
                  style={{ width: '120px', height: '120px' }}
                >
                  {/* Rotating ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-4 border-purple-400/30"
                    style={{
                      borderTopColor: '#a78bfa',
                      borderRightColor: '#c084fc',
                    }}
                  />

                  {/* Inner glow */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-2 rounded-full bg-purple-500/20"
                    style={{
                      boxShadow: 'inset 0 0 30px rgba(168, 85, 247, 0.6)',
                    }}
                  />

                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center text-6xl">
                    {abilityIcon}
                  </div>

                  {/* Sparkles */}
                  {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2;
                    const distance = 70;
                    
                    return (
                      <motion.div
                        key={`sparkle-${i}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 1,
                          delay: 0.7 + i * 0.1,
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                        className="absolute w-2 h-2 bg-purple-300 rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
                          boxShadow: '0 0 10px rgba(216, 180, 254, 1)',
                        }}
                      />
                    );
                  })}
                </motion.div>

                {/* Ability name */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="text-4xl font-black text-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #d8b4fe 0%, #a78bfa 50%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 4px 12px rgba(139, 92, 246, 0.5)',
                  }}
                >
                  {abilityName}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="text-center text-purple-200 text-sm"
                >
                  Yeni yetenek kullanıma hazır!
                </motion.p>

                {/* Bottom shine */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                  style={{
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.8)',
                  }}
                />
              </motion.div>

              {/* Particle burst */}
              {[...Array(20)].map((_, i) => {
                const angle = (i / 20) * Math.PI * 2;
                const distance = 150 + Math.random() * 100;
                
                return (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ 
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      delay: 0.5 + Math.random() * 0.3,
                      ease: 'easeOut'
                    }}
                    className="absolute left-1/2 top-1/2 w-3 h-3 bg-purple-400 rounded-full"
                    style={{
                      boxShadow: '0 0 10px rgba(168, 85, 247, 1)',
                    }}
                  />
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
