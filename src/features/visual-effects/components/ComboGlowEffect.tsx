import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const ComboGlowEffect: React.FC = () => {
  const comboGlow = useJuiceStore((state) => state.comboGlow);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <AnimatePresence>
        {comboGlow && (
          <>
            {/* Top glow */}
            <motion.div
              key="top-glow"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: comboGlow.intensity * 0.6, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '20%',
                background: `linear-gradient(180deg, ${comboGlow.color}40 0%, transparent 100%)`,
                transformOrigin: 'top',
              }}
            />
            
            {/* Bottom glow */}
            <motion.div
              key="bottom-glow"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: comboGlow.intensity * 0.6, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '20%',
                background: `linear-gradient(0deg, ${comboGlow.color}40 0%, transparent 100%)`,
                transformOrigin: 'bottom',
              }}
            />
            
            {/* Left glow */}
            <motion.div
              key="left-glow"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: comboGlow.intensity * 0.6, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '15%',
                background: `linear-gradient(90deg, ${comboGlow.color}40 0%, transparent 100%)`,
                transformOrigin: 'left',
              }}
            />
            
            {/* Right glow */}
            <motion.div
              key="right-glow"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: comboGlow.intensity * 0.6, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: '15%',
                background: `linear-gradient(270deg, ${comboGlow.color}40 0%, transparent 100%)`,
                transformOrigin: 'right',
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
