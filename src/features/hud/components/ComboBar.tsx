import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@features/game/store/gameStore';

const COMBO_DECAY_MS = 4000; // 4 saniyede combo sıfırlanır (görsel)

export const ComboBar: React.FC = React.memo(() => {
  const combo = useGameStore(s => s.combo);
  const lastAction = useGameStore(s => s.lastAction);
  const [fillPercent, setFillPercent] = useState(0);
  const [isDecaying, setIsDecaying] = useState(false);
  const decayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decayStartRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  // Combo değişince bar'ı doldur ve decay başlat
  useEffect(() => {
    if (combo <= 0) {
      setFillPercent(0);
      setIsDecaying(false);
      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
      cancelAnimationFrame(rafRef.current);
      return;
    }

    // Bar'ı yüzde doldur: combo ne kadar yüksekse o kadar hızlı dolar
    setFillPercent(100);
    setIsDecaying(false);

    // Decay başlat
    if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
    decayTimerRef.current = setTimeout(() => {
      setIsDecaying(true);
      decayStartRef.current = Date.now();
      
      const decay = () => {
        const elapsed = Date.now() - decayStartRef.current;
        const remaining = Math.max(0, 1 - elapsed / COMBO_DECAY_MS);
        setFillPercent(remaining * 100);
        
        if (remaining > 0) {
          rafRef.current = requestAnimationFrame(decay);
        } else {
          setIsDecaying(false);
        }
      };
      
      rafRef.current = requestAnimationFrame(decay);
    }, 500); // 0.5s sonra decay başlasın

    return () => {
      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [combo, lastAction]);

  if (combo <= 0) return null;

  // Combo seviyesine göre renk:
  const barColor = combo >= 8 ? '#f472b6'
    : combo >= 5 ? '#f59e0b'
    : combo >= 3 ? '#34d399'
    : '#22c55e';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        exit={{ opacity: 0, scaleX: 0.8 }}
        style={{
          position: 'fixed',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          pointerEvents: 'none',
        }}
      >
        {/* Combo sayısı */}
        <motion.div
          key={combo}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: barColor,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          x{combo}
        </motion.div>

        {/* Dikey bar */}
        <div style={{
          width: 4,
          height: 80,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <motion.div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${fillPercent}%`,
              background: barColor,
              borderRadius: 2,
            }}
            animate={{ height: `${fillPercent}%` }}
            transition={{ duration: isDecaying ? 0.05 : 0.2 }}
          />
        </div>

        {/* COMBO label */}
        <div style={{
          fontSize: 8,
          color: `${barColor}80`,
          fontWeight: 700,
          letterSpacing: '.08em',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}>
          COMBO
        </div>

        {/* Combo çarpan göstergesi */}
        {combo >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.4)',
              marginTop: 2,
            }}
          >
            +{combo * 75} bonus
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});
