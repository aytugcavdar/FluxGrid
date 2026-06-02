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
  const lastAction = useGameStore(s => s.lastAction);
  const prevRef = useRef<typeof lastAction>(null);
  const [show, setShow] = React.useState(false);
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    const shouldShow =
      lastAction?.type === 'CLEAR' &&
      ((lastAction.lines ?? 0) >= 2 || !!lastAction.colorBonus || !!lastAction.isPerfectClear);

    if (shouldShow && lastAction !== prevRef.current) {
      setCount(c => c + 1);
      setShow(true);
      const t = setTimeout(() => setShow(false), 420);
      prevRef.current = lastAction;
      return () => clearTimeout(t);
    }
    prevRef.current = lastAction;
  }, [lastAction]);

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Short confirmation sweep; block fade happens on the board. */}
          <motion.div
            key={`sweep-${count}`}
            initial={{ scaleX: 0, opacity: 0.38, x: '-28%' }}
            animate={{ scaleX: 1, opacity: [0.38, 0.24, 0], x: '0%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed pointer-events-none z-[35]"
            style={{
              left: 0, right: 0,
              top: '50%',
              height: 2,
              transformOrigin: 'left center',
              background: 'linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.26) 25%, rgba(244,114,182,0.42) 50%, rgba(52,211,153,0.28) 75%, transparent 100%)',
              boxShadow: '0 0 10px rgba(168,85,247,0.24)',
              borderRadius: 2,
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
});
