import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const NearMissWarning: React.FC = React.memo(() => {
  const nearMissWarning = useJuiceStore((state) => state.nearMissWarning);

  const getSeverityConfig = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return { 
          color: '#fbbf24', 
          message: 'Grid dolmaya başlıyor!',
          intensity: 0.3,
          icon: '⚠️'
        };
      case 'medium':
        return { 
          color: '#f59e0b', 
          message: 'Dikkat! Grid neredeyse dolu!',
          intensity: 0.6,
          icon: '⚠️'
        };
      case 'high':
        return { 
          color: '#ef4444', 
          message: 'TEHLİKE! Grid çok dolu!',
          intensity: 1,
          icon: '🚨'
        };
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-45">
      <AnimatePresence>
        {nearMissWarning && (
          <>
            {(() => {
              const config = getSeverityConfig(nearMissWarning.severity);
              
              return (
                <>
                  {/* Pulsing border */}
                  <motion.div
                    key={`border-${nearMissWarning.timestamp}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, config.intensity * 0.8, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, repeat: 2 }}
                    className="absolute inset-0"
                    style={{
                      border: `4px solid ${config.color}`,
                      boxShadow: `inset 0 0 60px ${config.color}40, 0 0 60px ${config.color}40`,
                    }}
                  />

                  {/* Corner warnings */}
                  {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => {
                    const positions = {
                      'top-left': { top: '20px', left: '20px' },
                      'top-right': { top: '20px', right: '20px' },
                      'bottom-left': { bottom: '20px', left: '20px' },
                      'bottom-right': { bottom: '20px', right: '20px' },
                    };

                    return (
                      <motion.div
                        key={`corner-${corner}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0, 1.2, 1],
                          opacity: [0, 1, 0.8]
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="absolute"
                        style={positions[corner as keyof typeof positions]}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="text-3xl"
                          style={{
                            filter: `drop-shadow(0 0 10px ${config.color})`,
                          }}
                        >
                          {config.icon}
                        </motion.div>
                      </motion.div>
                    );
                  })}

                  {/* Center warning message */}
                  <motion.div
                    key={`message-${nearMissWarning.timestamp}`}
                    initial={{ y: -100, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -100, opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="absolute top-32 left-1/2 transform -translate-x-1/2"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-2xl border-2"
                      style={{
                        borderColor: config.color,
                        boxShadow: `0 0 40px ${config.color}60`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.span
                          animate={{ 
                            scale: [1, 1.3, 1],
                            rotate: [0, -10, 10, 0]
                          }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="text-4xl"
                        >
                          {config.icon}
                        </motion.span>
                        
                        <div>
                          <motion.p
                            animate={{ opacity: [1, 0.7, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="text-2xl font-black uppercase tracking-wide"
                            style={{
                              color: config.color,
                              textShadow: `0 0 20px ${config.color}80, 0 2px 4px rgba(0, 0, 0, 0.5)`,
                            }}
                          >
                            {config.message}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Vignette effect */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: config.intensity * 0.4 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at center, transparent 40%, ${config.color}20 100%)`,
                    }}
                  />
                </>
              );
            })()}
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
