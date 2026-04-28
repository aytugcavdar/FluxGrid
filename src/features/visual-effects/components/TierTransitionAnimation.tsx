import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

// Detect if device is weak (low-end)
const isWeakDevice = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  
  // PRIORITY 1: Check User Agent for known weak devices (most reliable)
  const isKnownWeakDevice = 
    ua.includes('sm-j') ||      // Samsung J series (budget)
    ua.includes('sm-a') ||      // Samsung A series (budget)
    ua.includes('sm-g5') ||     // Samsung G5xx series (GM510, etc.)
    ua.includes('sm-g6') ||     // Samsung G6xx series
    ua.includes('sm-g7') ||     // Samsung G7xx series
    ua.includes('redmi') ||     // Xiaomi Redmi (budget)
    ua.includes('poco') ||      // Xiaomi Poco (budget)
    ua.includes('moto e') ||    // Motorola E (budget)
    ua.includes('moto g') ||    // Motorola G (budget)
    ua.includes('android 6') || // Old Android
    ua.includes('android 7') ||
    ua.includes('android 8') ||
    ua.includes('android 9');
  
  // PRIORITY 2: Check RAM (4GB or less = weak for games)
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const hasLowRAM = deviceMemory <= 4;
  
  // Combine checks: Known weak device OR low RAM = weak
  return isKnownWeakDevice || hasLowRAM;
};

export const TierTransitionAnimation: React.FC = React.memo(() => {
  const tierTransition = useJuiceStore((state) => state.tierTransition);
  const skipAnimations = isWeakDevice();

  if (!tierTransition) return null;

  const { fromTier, toTier } = tierTransition;
  const isUpgrade = toTier > fromTier;
  
  // Skip all animations on weak devices - just show a simple notification
  if (skipAnimations) {
    return (
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
        <div
          className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border"
          style={{
            borderColor: isUpgrade ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          }}
        >
          {/* Simple icon */}
          <div className="text-4xl mb-2 text-center">
            {isUpgrade ? '⬆️' : '⬇️'}
          </div>

          {/* Title */}
          <h2
            className="text-2xl font-bold text-center mb-2"
            style={{
              color: isUpgrade ? '#10b981' : '#ef4444',
            }}
          >
            {isUpgrade ? 'TIER UP!' : 'TIER DOWN'}
          </h2>

          {/* Tier numbers */}
          <div className="flex items-center justify-center gap-3 text-xl font-bold">
            <span className="text-gray-400">Tier {fromTier}</span>
            <span className="text-white">→</span>
            <span
              style={{
                color: isUpgrade ? '#10b981' : '#ef4444',
              }}
            >
              Tier {toTier}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {tierTransition && (
          <motion.div
            key={tierTransition.timestamp}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative"
          >
            {/* Background glow */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 1.5], opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-0"
              style={{
                background: isUpgrade
                  ? 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
                filter: 'blur(40px)',
                width: '400px',
                height: '400px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Main card */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border"
              style={{
                borderColor: isUpgrade ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                boxShadow: isUpgrade
                  ? '0 0 60px rgba(16, 185, 129, 0.3)'
                  : '0 0 60px rgba(239, 68, 68, 0.3)',
              }}
            >
              {/* Sparkles */}
              {isUpgrade && [...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 120;
                
                return (
                  <motion.div
                    key={`sparkle-${i}`}
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
                      duration: 1.2,
                      delay: 0.3 + i * 0.05,
                      ease: 'easeOut'
                    }}
                    className="absolute left-1/2 top-1/2 w-2 h-2 bg-emerald-400 rounded-full"
                    style={{
                      boxShadow: '0 0 10px rgba(16, 185, 129, 1)',
                    }}
                  />
                );
              })}

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 200 }}
                className="text-6xl mb-4 text-center"
              >
                {isUpgrade ? '⬆️' : '⬇️'}
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="text-3xl font-bold text-center mb-2"
                style={{
                  color: isUpgrade ? '#10b981' : '#ef4444',
                  textShadow: isUpgrade
                    ? '0 0 20px rgba(16, 185, 129, 0.5)'
                    : '0 0 20px rgba(239, 68, 68, 0.5)',
                }}
              >
                {isUpgrade ? 'TIER UP!' : 'TIER DOWN'}
              </motion.h2>

              {/* Tier numbers */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="flex items-center justify-center gap-4 text-2xl font-bold"
              >
                <span className="text-gray-400">Tier {fromTier}</span>
                <motion.span
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 0.6, repeat: 2, delay: 0.8 }}
                  className="text-white"
                >
                  →
                </motion.span>
                <span
                  style={{
                    color: isUpgrade ? '#10b981' : '#ef4444',
                  }}
                >
                  Tier {toTier}
                </span>
              </motion.div>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="text-center text-gray-300 mt-4 text-sm"
              >
                {isUpgrade
                  ? 'Zorluk arttı! Daha fazla puan kazan!'
                  : 'Zorluk azaldı. Tekrar yüksel!'}
              </motion.p>
            </motion.div>

            {/* Rays */}
            {isUpgrade && [...Array(8)].map((_, i) => (
              <motion.div
                key={`ray-${i}`}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: [0, 1.5, 0], opacity: [0, 0.6, 0] }}
                transition={{ 
                  duration: 1.5,
                  delay: 0.4 + i * 0.05,
                  ease: 'easeOut'
                }}
                className="absolute left-1/2 top-1/2 origin-bottom"
                style={{
                  width: '4px',
                  height: '200px',
                  background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, transparent 100%)',
                  transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
                  filter: 'blur(2px)',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
