import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FluxBarProps {
  flux: number;       // 0–100
  maxFlux?: number;   // default 100
  combo: number;
}

export const FluxBar: React.FC<FluxBarProps> = React.memo(({ flux, maxFlux = 100, combo }) => {
  const percent = Math.min(100, Math.max(0, (flux / maxFlux) * 100));
  const isReady = percent >= 100;
  const isCritical = percent >= 75 && !isReady;
  const prevFluxRef = useRef(flux);
  const [surge, setSurge] = useState(false);

  useEffect(() => {
    if (flux > prevFluxRef.current) {
      setSurge(true);
      const t = setTimeout(() => setSurge(false), 400);
      prevFluxRef.current = flux;
      return () => clearTimeout(t);
    }
    prevFluxRef.current = flux;
  }, [flux]);

  // Color gradient based on fill level
  const barColor = isReady
    ? 'linear-gradient(90deg, #a78bfa, #f472b6, #a78bfa)'
    : isCritical
    ? 'linear-gradient(90deg, #6366f1, #a78bfa)'
    : 'linear-gradient(90deg, #3b82f6, #6366f1)';

  const glowColor = isReady ? '#a78bfa' : isCritical ? '#8b5cf6' : '#3b82f6';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <motion.span
            animate={isReady ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.6, repeat: isReady ? Infinity : 0, repeatDelay: 0.8 }}
            style={{ fontSize: 11 }}
          >
            ⚡
          </motion.span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: isReady ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
          >
            FLUX
          </span>
          {isReady && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: '#f472b6',
                background: 'rgba(244,114,182,0.15)',
                padding: '1px 5px',
                borderRadius: 4,
                letterSpacing: '0.05em',
              }}
            >
              HAZIR!
            </motion.span>
          )}
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: isReady ? '#a78bfa' : 'rgba(255,255,255,0.35)',
            lineHeight: 1,
          }}
        >
          {Math.round(percent)}%
        </span>
      </div>

      {/* Bar track */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 6,
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
        }}
      >
        {/* Fill */}
        <motion.div
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            background: barColor,
            borderRadius: 3,
            backgroundSize: isReady ? '200% 100%' : '100% 100%',
            boxShadow: `0 0 ${isReady ? 10 : 4}px ${glowColor}${isReady ? 'CC' : '66'}`,
          }}
        />

        {/* Surge flash overlay */}
        <AnimatePresence>
          {surge && (
            <motion.div
              key="surge"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 3,
              }}
            />
          )}
        </AnimatePresence>

        {/* Ready shimmer */}
        {isReady && (
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              borderRadius: 3,
            }}
          />
        )}
      </div>
    </div>
  );
});
