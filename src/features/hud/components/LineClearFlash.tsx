import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';

/**
 * LineClearFlash – oyun tahtasının üzerine satır temizlendiğinde
 * yatay bir ışık taraması ve kısa ekran parlaması yapar.
 *
 * gameStore'daki linesCleared değişimini takip eder.
 */
export const LineClearFlash: React.FC = React.memo(() => {
  const linesCleared = useGameStore(s => s.stats?.linesCleared ?? 0);
  const prevRef = useRef(linesCleared);
  const [show, setShow] = React.useState(false);
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    if (linesCleared > prevRef.current) {
      setCount(c => c + 1);
      setShow(true);
      const t = setTimeout(() => setShow(false), 600);
      prevRef.current = linesCleared;
      return () => clearTimeout(t);
    }
    prevRef.current = linesCleared;
  }, [linesCleared]);

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Full-width horizontal light sweep */}
          <motion.div
            key={`sweep-${count}`}
            initial={{ scaleX: 0, opacity: 0.9, x: '-50%' }}
            animate={{ scaleX: 1, opacity: [0.9, 0.6, 0], x: '0%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed pointer-events-none z-[35]"
            style={{
              left: 0, right: 0,
              top: '50%',
              height: 3,
              transformOrigin: 'left center',
              background: 'linear-gradient(90deg, transparent 0%, #818cf8 25%, #f472b6 50%, #34d399 75%, transparent 100%)',
              boxShadow: '0 0 20px rgba(168,85,247,0.8), 0 0 8px rgba(244,114,182,0.6)',
              borderRadius: 2,
            }}
          />
          {/* Subtle full-screen radial pulse */}
          <motion.div
            key={`pulse-${count}`}
            initial={{ opacity: 0.18 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none z-[34]"
            style={{
              background: 'radial-gradient(ellipse at center 50%, rgba(129,140,248,0.25) 0%, transparent 65%)',
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
});
