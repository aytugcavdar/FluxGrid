import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const ScreenShakeEffect: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const screenShake = useJuiceStore((state) => state.screenShake);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!screenShake) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const startTime = Date.now();
    const { intensity, duration } = screenShake;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        setOffset({ x: 0, y: 0 });
        return;
      }

      // Decay intensity over time
      const progress = elapsed / duration;
      const currentIntensity = intensity * (1 - progress);

      // Random shake
      const x = (Math.random() - 0.5) * currentIntensity * 2;
      const y = (Math.random() - 0.5) * currentIntensity * 2;

      setOffset({ x, y });
      requestAnimationFrame(animate);
    };

    animate();
  }, [screenShake]);

  return (
    <motion.div
      style={{
        x: offset.x,
        y: offset.y,
        width: '100%',
        height: '100%',
      }}
      transition={{ duration: 0 }}
    >
      {children}
    </motion.div>
  );
});
